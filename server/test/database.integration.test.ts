import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDatabaseClient } from "../src/database.ts";
import { loadProjectEnv } from "../src/load-env.ts";
import { createPrismaUserRepository } from "../src/auth/user-repository.ts";

loadProjectEnv();

const databaseUrl = process.env.DATABASE_URL;
const databaseSuite = databaseUrl ? describe : describe.skip;

databaseSuite("PostgreSQL schema constraints", () => {
  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = createDatabaseClient(databaseUrl ?? "");
  let client: PoolClient;
  let sellerId: string;
  let secondSellerId: string;
  let telegramId = BigInt(Date.now()) * 1_000_000n;

  beforeAll(async () => {
    client = await pool.connect();
  });

  afterAll(async () => {
    client?.release();
    await pool.end();
    await prisma.$disconnect();
  });

  it("connects Prisma Client through the PostgreSQL driver adapter", async () => {
    const result = await prisma.$queryRaw<Array<{ connected: number }>>`SELECT 1 AS connected`;
    expect(result).toEqual([{ connected: 1 }]);
  });

  it("upserts Telegram identity while preserving the marketplace display name", async () => {
    const repository = createPrismaUserRepository(prisma);
    const telegramUserId = BigInt(Date.now()) * 1_000_000n + BigInt(Math.floor(Math.random() * 1_000_000));
    let createdUserId: string | undefined;

    try {
      const created = await repository.upsertTelegramUser({
        telegramUserId,
        telegramUsername: "first_username",
        displayName: "Initial Telegram Name",
      });
      createdUserId = created.id;

      const updated = await repository.upsertTelegramUser({
        telegramUserId,
        telegramUsername: null,
        displayName: "A changed Telegram Name",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.telegramUsername).toBeNull();
      expect(updated.displayName).toBe("Initial Telegram Name");
      expect(updated.isAdmin).toBe(false);
    } finally {
      if (createdUserId) await prisma.user.delete({ where: { id: createdUserId } });
    }
  });

  beforeEach(async () => {
    await client.query("BEGIN");
    sellerId = randomUUID();
    secondSellerId = randomUUID();
    telegramId += 2n;
    await client.query(
      `INSERT INTO users (id, telegram_user_id, display_name)
       VALUES ($1, $2, 'Test seller'), ($3, $4, 'Second seller')`,
      [sellerId, telegramId.toString(), secondSellerId, (telegramId + 1n).toString()],
    );
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
  });

  async function expectSqlState(sql: string, values: string[], code: string) {
    await client.query("SAVEPOINT constraint_case");
    let actualCode: string | undefined;
    try {
      await client.query(sql, values);
    } catch (error) {
      actualCode = (error as { code?: string }).code;
    }
    await client.query("ROLLBACK TO SAVEPOINT constraint_case");
    await client.query("RELEASE SAVEPOINT constraint_case");
    expect(actualCode).toBe(code);
  }

  async function insertItem(overrides: {
    seller?: string;
    category?: string | null;
    condition?: string | null;
    price?: string | null;
    negotiable?: boolean;
    status?: string;
  } = {}) {
    const id = randomUUID();
    const values = {
      seller: overrides.seller ?? sellerId,
      category: overrides.category === undefined ? "OTHER" : overrides.category,
      condition: overrides.condition === undefined ? "USED" : overrides.condition,
      price: overrides.price === undefined ? "10.00" : overrides.price,
      negotiable: overrides.negotiable ?? false,
      status: overrides.status ?? "AVAILABLE",
    };
    await client.query(
      `INSERT INTO listings
        (id, seller_id, listing_type, title, description, item_category, item_condition,
         price_amount, is_negotiable, availability_status)
       VALUES ($1, $2, 'ITEM', 'Test item', 'Test description', $3, $4, $5, $6, $7)`,
      [id, values.seller, values.category, values.condition, values.price, values.negotiable, values.status],
    );
    return id;
  }

  it("enforces listing ownership and cascades listing image deletion", async () => {
    const unknownSeller = randomUUID();
    await expectSqlState(
      `INSERT INTO listings (id, seller_id, listing_type, title, description, item_category, item_condition)
       VALUES ($1, $2, 'ITEM', 'Test item', 'Description', 'OTHER', 'USED')`,
      [randomUUID(), unknownSeller],
      "23503",
    );

    const listingId = await insertItem();
    const imageId = randomUUID();
    await client.query(
      `INSERT INTO listing_images (id, listing_id, position, mime_type, image_bytes)
       VALUES ($1, $2, 1, 'image/jpeg', decode('00', 'hex'))`,
      [imageId, listingId],
    );
    await expectSqlState("DELETE FROM users WHERE id = $1", [sellerId], "23001");

    await client.query("DELETE FROM listings WHERE id = $1", [listingId]);
    const images = await client.query("SELECT id FROM listing_images WHERE id = $1", [imageId]);
    expect(images.rowCount).toBe(0);
  });

  it("enforces listing type, status, and price rules", async () => {
    await expectSqlState(
      `INSERT INTO listings (id, seller_id, listing_type, title, description, item_condition)
       VALUES ($1, $2, 'ITEM', 'Test item', 'Description', 'USED')`,
      [randomUUID(), sellerId],
      "23514",
    );
    await expectSqlState(
      `INSERT INTO listings
        (id, seller_id, listing_type, title, description, rental_address, availability_status)
       VALUES ($1, $2, 'HOUSE_RENTAL', 'Test house', 'Description', 'Near market', 'SOLD')`,
      [randomUUID(), sellerId],
      "23514",
    );
    await expectSqlState(
      `INSERT INTO listings
        (id, seller_id, listing_type, title, description, item_category, item_condition, price_amount)
       VALUES ($1, $2, 'ITEM', 'Test item', 'Description', 'OTHER', 'USED', '-1.00')`,
      [randomUUID(), sellerId],
      "23514",
    );
    await expectSqlState(
      `INSERT INTO listings
        (id, seller_id, listing_type, title, description, item_category, item_condition, is_negotiable)
       VALUES ($1, $2, 'ITEM', 'Test item', 'Description', 'OTHER', 'USED', true)`,
      [randomUUID(), sellerId],
      "23514",
    );

    const itemId = await insertItem({ status: "SOLD" });
    const rentalId = randomUUID();
    await client.query(
      `INSERT INTO listings (id, seller_id, listing_type, title, description, rental_address, availability_status)
       VALUES ($1, $2, 'HOUSE_RENTAL', 'Test house', 'Description', 'Near market', 'UNAVAILABLE')`,
      [rentalId, sellerId],
    );
    expect(itemId).toBeTruthy();
  });

  it("limits listing images to three unique ordered positions", async () => {
    const listingId = await insertItem();
    for (const position of [1, 2, 3]) {
      await client.query(
        `INSERT INTO listing_images (id, listing_id, position, mime_type, image_bytes)
         VALUES ($1, $2, $3, 'image/jpeg', decode('00', 'hex'))`,
        [randomUUID(), listingId, position],
      );
    }

    await expectSqlState(
      `INSERT INTO listing_images (id, listing_id, position, mime_type, image_bytes)
       VALUES ($1, $2, 4, 'image/jpeg', decode('00', 'hex'))`,
      [randomUUID(), listingId],
      "23514",
    );
    await expectSqlState(
      `INSERT INTO listing_images (id, listing_id, position, mime_type, image_bytes)
       VALUES ($1, $2, 2, 'image/jpeg', decode('00', 'hex'))`,
      [randomUUID(), listingId],
      "23505",
    );
  });
});
