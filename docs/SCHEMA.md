# Data Schema

## 1. Overview

- **Database:** PostgreSQL, accessed by the server through Prisma ORM 7.
- **Normalization:** Keep the core data in third normal form. Store users, listings, and listing images as separate entities. Use PostgreSQL enum types for fixed values that have no additional attributes.
- **Source of truth:** PostgreSQL stores users, listings, and image data. Admin dashboard totals are calculated from user and listing records; there is no separate metrics table.
- **Images:** Store validated, compressed image bytes in PostgreSQL `bytea`. Accept one to three images per listing, up to 5 MB per uploaded image.
- **Registration:** Create or update a user record from validated Telegram identity data when the user opens the Mini App. Users can browse without a username, but must have a Telegram username to post.

## 2. Entities

### User
- **Purpose:** Represents a registered Telegram user, their marketplace profile, and admin authorization.
- **Fields:**

| Field | Type | Required | Rules / notes |
|---|---|---:|---|
| `id` | UUID | Yes | Internal primary key. |
| `telegram_user_id` | BIGINT | Yes | Telegram identity; unique. Set only from validated Telegram `initData`. |
| `telegram_username` | TEXT | No | Current username, if set. Required by the server before the user can post. |
| `display_name` | TEXT | Yes | Marketplace profile name; initially populated from Telegram profile data and editable by the user. |
| `phone_number` | TEXT | No | Optional seller contact number, returned only with listing details. |
| `is_admin` | BOOLEAN | Yes | Defaults to `false`; changed only through trusted server-side administration. |
| `created_at` | TIMESTAMPTZ | Yes | Time the user was first registered. |
| `updated_at` | TIMESTAMPTZ | Yes | Updated when stored profile data changes. |

- **Entity constraints:** `telegram_user_id` is unique. No separate buyer and seller records are needed; any user may browse and post. A user may be an admin as well.
- **Sensitive data:** Telegram user ID and phone number. Never trust identity fields supplied separately by the client.
- **Related requirements:** F-07, F-08, F-12.

### Listing
- **Purpose:** Represents one item listing or one whole-house rental listing.
- **Fields:**

| Field | Type | Required | Rules / notes |
|---|---|---:|---|
| `id` | UUID | Yes | Primary key. |
| `seller_id` | UUID | Yes | Foreign key to `users.id`. |
| `listing_type` | `listing_type` enum | Yes | `ITEM` or `HOUSE_RENTAL`; drives the separate feed and form. |
| `title` | TEXT | Yes | Item name or rental title. |
| `description` | TEXT | Yes | Seller-entered text, kept in the language supplied. |
| `item_category` | `item_category` enum | No | `ELECTRONICS`, `CLOTHING`, or `OTHER`; required for items and empty for house rentals. |
| `item_condition` | `item_condition` enum | No | `NEW` or `USED`; required for items and empty for house rentals. |
| `rental_address` | TEXT | No | Seller-entered address; required for house rentals and empty for items. |
| `price_amount` | NUMERIC(12,2) | No | ETB amount. `NULL` means Contact for price; otherwise must be zero or greater. |
| `is_negotiable` | BOOLEAN | Yes | Defaults to `false`; must be `false` when `price_amount` is `NULL`. |
| `availability_status` | `listing_status` enum | Yes | `AVAILABLE`, `SOLD`, or `UNAVAILABLE`, subject to listing-type rules below. |
| `created_at` | TIMESTAMPTZ | Yes | Set by the server when posted. |
| `updated_at` | TIMESTAMPTZ | Yes | Updated when the seller changes listing data or availability. |

- **Entity constraints:**
  - For `ITEM`, `item_category` and `item_condition` are required, `rental_address` is `NULL`, and status is `AVAILABLE` or `SOLD`.
  - For `HOUSE_RENTAL`, `item_category` and `item_condition` are `NULL`, `rental_address` is required, and status is `AVAILABLE` or `UNAVAILABLE`.
  - `price_amount` cannot be negative. A missing amount represents Contact for price, not a missing form response.
  - Store rental amounts as monthly ETB prices. Currency and rental period are determined by product rules, so they are not repeated on each row.
  - Listings do not expire automatically. Sold and unavailable records remain stored and visible to their owners.
- **Sensitive data:** Seller-entered rental address; expose it through listing details as specified by product behavior.
- **Related requirements:** F-01 through F-09.

### Listing image
- **Purpose:** Stores one ordered image belonging to a listing.
- **Fields:**

| Field | Type | Required | Rules / notes |
|---|---|---:|---|
| `id` | UUID | Yes | Primary key. |
| `listing_id` | UUID | Yes | Foreign key to `listings.id`; deleting a listing deletes its images. |
| `position` | SMALLINT | Yes | Display order, from 1 to 3; unique within a listing. |
| `mime_type` | TEXT | Yes | Verified image media type. |
| `image_bytes` | BYTEA | Yes | Validated and compressed image content. |

- **Entity constraints:** A listing has one to three images. Position must be between 1 and 3. The backend enforces the minimum of one image when creating or editing a listing; the database enforces the maximum through the unique positions and range constraint.
- **Related requirements:** F-03.

### Fixed enum values

| Enum | Values |
|---|---|
| `listing_type` | `ITEM`, `HOUSE_RENTAL` |
| `item_category` | `ELECTRONICS`, `CLOTHING`, `OTHER` |
| `item_condition` | `NEW`, `USED` |
| `listing_status` | `AVAILABLE`, `SOLD`, `UNAVAILABLE` |

PostgreSQL `CHECK` constraints enforce the type-specific listing rules and nonnegative price. The server applies the same validation before writes.

## 3. Relationships

| Entity A | Relationship | Entity B | Rules |
|---|---|---|---|
| User | One-to-many | Listing | A user may own many listings; each listing has exactly one seller. |
| Listing | One-to-many | Listing image | A listing has one to three ordered images. Deleting the listing cascades to its images. |

## 4. Integrity and business invariants

- **INV-01 — Trusted identity:** A user row is keyed to a unique Telegram user ID obtained from backend-validated `initData`.
- **INV-02 — Posting access:** The backend requires the authenticated user's current Telegram username before creating a listing.
- **INV-03 — Ownership:** Only the listing owner may edit or delete their listing. Admin removal requires server-side admin authorization.
- **INV-04 — Type-specific fields:** Item category and condition are present only for item listings; rental address is present only for house rental listings.
- **INV-05 — Availability:** Items use Available/Sold; house rentals use Available/Unavailable.
- **INV-06 — Photos:** Each listing has one to three validated images, stored in order. Listing creation or photo replacement and its image rows are handled transactionally.
- **INV-07 — Admin totals:** Registered users are counted from `users`; total listings and most-listed item category are calculated from `listings`. Sold and unavailable listings remain in those counts unless deleted or removed.

Use PostgreSQL constraints for uniqueness, foreign keys, allowed values, and field relationships. Enforce authentication, ownership, admin permissions, and the minimum photo count in the trusted backend.

## 5. Indexes and query needs

| Data / query pattern | Index or optimization | Reason |
|---|---|---|
| Telegram identity lookup | Unique index on `users.telegram_user_id` | Resolve the authenticated Telegram user. |
| Public listing feed | Index on `(listing_type, availability_status, created_at DESC)` | Fetch newest available listings for the selected Items or House rentals page. |
| Seller's listings | Index on `(seller_id, created_at DESC)` | Load My listings and seller profile listings. |
| Image order | Unique index on `(listing_id, position)` | Retrieve each listing's images in display order and limit each listing to three. |

Search and price/category filters use the listing fields. Add specialized indexes only if measured MVP query performance requires them.

## 6. Access and data lifecycle

- **Ownership / tenant boundaries:** Each listing belongs to one user. The backend scopes seller operations to that user's authenticated ID.
- **Read / write permissions:** Public feeds and listing details expose available listings. Owners can read and manage their retained listings regardless of availability. Admin-only removal and dashboard queries require server-side admin authorization.
- **Image access:** Public users can retrieve images for available listings. The listing owner and an authorized admin can retrieve images for retained listings regardless of availability, so they can manage or inspect those listings.
- **Retention / deletion:** Listings remain until the seller deletes them or an admin removes them. Deleting a listing also deletes its image rows. No automatic expiry or audit history is required for v1.
- **Privacy:** Keep phone numbers out of listing feeds; return them only with listing details. Protect Telegram identity and admin fields from client writes.

## 7. Migrations and seed data

- **Migration approach:** Use Prisma ORM 7 migrations committed with the server code. Include SQL constraints in migrations where needed to enforce type-specific fields and image position limits.
- **Seed data:** No production seed data is required. Any local development fixtures must use fictional records and remain separate from production.
- **Compatibility / recovery:** Review generated migrations before applying them to a deployed database. Back up production data before schema changes that can remove or rewrite records.

## 8. Example records

An item and a house rental share the common listing fields; only the fields for their respective listing type are populated.

```text
Item listing:        listing_type=ITEM, item_category=ELECTRONICS,
                     item_condition=USED, rental_address=NULL
House rental:        listing_type=HOUSE_RENTAL, item_category=NULL,
                     item_condition=NULL, rental_address=<seller-entered address>
Contact for price:   price_amount=NULL, is_negotiable=false
```

## 9. Open schema questions

None currently identified for the MVP. Hosting remains an architecture decision and is tracked in `ARCHITECTURE.md`.
