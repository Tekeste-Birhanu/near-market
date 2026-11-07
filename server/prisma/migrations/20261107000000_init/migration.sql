-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "listing_type" AS ENUM ('ITEM', 'HOUSE_RENTAL');

-- CreateEnum
CREATE TYPE "item_category" AS ENUM ('ELECTRONICS', 'CLOTHING', 'OTHER');

-- CreateEnum
CREATE TYPE "item_condition" AS ENUM ('NEW', 'USED');

-- CreateEnum
CREATE TYPE "listing_status" AS ENUM ('AVAILABLE', 'SOLD', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "telegram_user_id" BIGINT NOT NULL,
    "telegram_username" TEXT,
    "display_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "listing_type" "listing_type" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "item_category" "item_category",
    "item_condition" "item_condition",
    "rental_address" TEXT,
    "price_amount" DECIMAL(12,2),
    "is_negotiable" BOOLEAN NOT NULL DEFAULT false,
    "availability_status" "listing_status" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_images" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "image_bytes" BYTEA NOT NULL,

    CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_user_id_key" ON "users"("telegram_user_id");

-- CreateIndex
CREATE INDEX "listings_listing_type_availability_status_created_at_idx" ON "listings"("listing_type", "availability_status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "listings_seller_id_created_at_idx" ON "listings"("seller_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "listing_images_listing_id_position_key" ON "listing_images"("listing_id", "position");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enforce listing type, status, and type-specific fields at the database boundary.
ALTER TABLE "listings" ADD CONSTRAINT "listings_type_fields_check" CHECK (
    ("listing_type" = 'ITEM'
        AND "item_category" IS NOT NULL
        AND "item_condition" IS NOT NULL
        AND "rental_address" IS NULL
        AND "availability_status" IN ('AVAILABLE', 'SOLD'))
    OR
    ("listing_type" = 'HOUSE_RENTAL'
        AND "item_category" IS NULL
        AND "item_condition" IS NULL
        AND "rental_address" IS NOT NULL
        AND "availability_status" IN ('AVAILABLE', 'UNAVAILABLE'))
);

ALTER TABLE "listings" ADD CONSTRAINT "listings_price_nonnegative_check"
    CHECK ("price_amount" IS NULL OR "price_amount" >= 0);

ALTER TABLE "listings" ADD CONSTRAINT "listings_contact_price_not_negotiable_check"
    CHECK ("price_amount" IS NOT NULL OR "is_negotiable" = false);

ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_position_range_check"
    CHECK ("position" BETWEEN 1 AND 3);
