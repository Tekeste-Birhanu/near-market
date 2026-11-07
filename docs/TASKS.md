# Implementation Tasks

Complete a task when its checkboxes are met. Tasks are listed in dependency order. Tests and checks belong with the feature they verify.

## M1 - Foundation and Telegram access

**T-01 - Initialize the npm workspace**

- [x] Set up `client/` and `server/` workspaces, TypeScript defaults, scripts, `.gitignore`, and `.env.example`; use free tools/services for the MVP.
- [x] Add Tailwind CSS to the client using its Vite integration.
- [x] Configure Vitest, React Testing Library, and Supertest where applicable; install, type-check, test, and build successfully.

**T-02 - Scaffold the React Mini App client**

- [x] Create the React + TypeScript + Vite client entry point.
- [x] Verify local startup, production build, and a basic render test.

**T-03 - Scaffold the Express API server**

- [x] Create the Node.js + TypeScript + Express server, configuration loading, health endpoint, and centralized error handling.
- [x] Add API rate limiting with the standard `429` error response; settle and document limits before release.
- [x] Verify safe configuration errors and test the app with Supertest without opening a network port.

**T-04 - Configure PostgreSQL and Prisma schema**

- [x] Implement the User, Listing, and ListingImage schema, enums, indexes, and constraints from `SCHEMA.md`; store compressed image bytes in PostgreSQL `bytea` with no external object storage.
- [x] Apply migrations to a clean local/test database; verify ownership, listing type/status, price, and image constraints.

**T-05 - Implement Telegram Mini App authentication**

- [x] Validate raw Telegram `initData` in `POST /api/v1/auth/session`, upsert the user, set the initial display name from Telegram profile data, and issue the API access token from `API.md`.
- [x] Reject invalid or expired data; never trust client-supplied identity/admin fields or log secrets/raw authentication data.
- [x] Verify valid, tampered, expired, and username-less sessions with unit and Supertest tests.

**T-06 - Add the marketplace Telegraf bot**

- [x] Configure the marketplace bot start/launch path to the Marketplace Mini App using a server-side token.
- [x] Allow local API work without a bot token; fail safely when bot startup is enabled with invalid configuration.
- [x] Test bot configuration without contacting Telegram.
- [x] Verify the launch action with a reachable development Mini App URL.

## M2 - App shell and profile

**T-07 - Connect the client to Telegram authentication**

- [ ] Send Telegram `initData` to the session endpoint and attach the returned token to API requests; never use `initDataUnsafe`.
- [ ] Handle expired sessions and local development without weakening production validation; verify with client tests.

**T-08 - Build the Marketplace Mini App shell**

- [ ] Add Listings, Post, and Profile navigation; show Items selected by default with House rentals as the other tab.
- [ ] Localize all interface labels and messages in English and Amharic, default to English, and persist the language choice locally.
- [ ] Define shared Tailwind theme tokens for Near Market blue and light/dark surfaces; use the device system font and support narrow screens and Telegram themes.

**T-09 - Implement seller profile settings**

- [ ] Implement `GET /me` and `PATCH /me` for display name and optional profile phone number, with Profile/Settings UI; include language selection and a Light/Dark toggle in Settings.
- [ ] Follow Telegram's theme until the user selects Light or Dark; persist and apply an explicit theme choice locally.
- [ ] Allow users to set, change, or clear their phone number; show it only on listing details.
- [ ] Reject client attempts to change Telegram identity or admin role; verify API and UI behavior.

## M3 - Browse and contact

**T-10 - Implement listing read and search API**

- [ ] Add available listing feeds with type-specific search (title/description and rental address), filters, newest-first ordering, and cursor pagination.
- [ ] Support item category, condition, and price filters; support rental price filters; reject invalid combinations.
- [ ] Verify filters, visibility, ordering, pagination, and errors with unit and Supertest tests.

**T-11 - Implement listing details, images, and seller API**

- [ ] Add listing details, image retrieval, seller profiles, and sellers' available-listings endpoints; let owners retrieve their retained listing details regardless of availability for management.
- [ ] Allow public image reads only for available listings; allow the owner and admins to read images for retained listings regardless of status.
- [ ] Return optional seller phone only on listing details; return unavailable to other users for sold/unavailable listings and not found for deleted records.
- [ ] Verify image ownership, media type, visibility, and phone privacy with Supertest.

**T-12 - Build item browsing UI**

- [ ] Put search above the Items/House rentals tabs; show inline filters only after Filter is tapped, and scope search/filters to Items.
- [ ] Use vertically stacked, comfortably spaced cards with rounded subtle borders and no heavy shadows; place a square image about one-third width beside title/price, New/Used badge, and compact Contact/View details buttons side by side; aim to show two cards initially where screen size allows.
- [ ] Make Contact open the seller's Telegram account and View details open the listing details.
- [ ] Add loading, empty, error, and retry states; empty feeds include a Post action; verify with React Testing Library.

**T-13 - Build house rental browsing UI**

- [ ] Put search above the tabs; show inline price filters only after Filter is tapped, and scope search/filters to House rentals.
- [ ] Use the same card layout as Items; show monthly ETB price and seller-entered address. Aim for two cards in the initial view where screen size allows.
- [ ] Make Contact open the seller's Telegram account and View details open the listing details.
- [ ] Add loading, empty, error, and retry states; empty feeds include a Post action; verify with React Testing Library.

**T-14 - Build listing details, seller profile, and contact flows**

- [ ] Show a large main photo first and allow swiping through up to three photos; show all listing details, including rental address, seller profile, and available seller listings.
- [ ] Link to the seller's Telegram username and show optional phone only on details.
- [ ] Restore the selected feed and position when returning from details; show the agreed unavailable message; verify navigation and contact behavior.

## M4 - Seller features

**T-15 - Implement posting entry, username gate, and rules notice**

- [ ] Require a Telegram username before posting while keeping browsing available.
- [ ] Before the first listing form, clearly say that all illegal listings, including drugs, are prohibited; do not require an acknowledgment checkbox.
- [ ] Route the Post action to the selected Item or House rental form; verify with UI tests.

**T-16 - Implement listing creation and image validation API**

- [ ] Add `POST /listings` with type-specific validation, username enforcement, image validation/compression, and transactional persistence.
- [ ] Accept one to three images up to 5 MB each; reject invalid image data and field combinations.
- [ ] Create listings as Available and publish immediately; posting is free. Accept zero-or-higher ETB price or non-negotiable Contact for price, support negotiable prices and monthly rents, and add no payment/checkout flow.
- [ ] Verify validation, upload, transaction, and failure cases with unit and Supertest tests.

**T-17 - Build item listing form and publish flow**

- [ ] Add item title, description, category (Electronics, Clothing, Other), separate New/Used condition, ETB price or Contact for price, negotiability, and one-to-three photo fields.
- [ ] Validate required fields and at least one image before submission, show field errors beside inputs and loading/success feedback, and open details after success.
- [ ] Keep seller-entered text in its original language without translated duplicate fields; use a scrollable form, photo thumbnails with remove controls, and a fixed Publish action; confirm before discarding unsaved changes.
- [ ] Preserve form values after submission failure or interruption where feasible; verify required fields, image limits, success, and retry with React Testing Library.

**T-18 - Build house rental form and publish flow**

- [ ] Add whole-house-only title, description, required seller-entered address, monthly ETB price or Contact for price, negotiability, and one-to-three photo fields.
- [ ] Validate required fields and at least one image before submission, show field errors beside inputs and loading/success feedback, and open details after success.
- [ ] Keep seller-entered text in its original language without translated duplicate fields; use a scrollable form, photo thumbnails with remove controls, and a fixed Publish action; confirm before discarding unsaved changes.
- [ ] Preserve form values after submission failure or interruption where feasible; verify required fields, image limits, success, and retry with React Testing Library.

**T-19 - Implement My listings and listing lifecycle**

- [ ] Add owner-scoped My listings, edit, availability status, and delete endpoints and UI.
- [ ] Keep sold/unavailable listings visible to their owners, hide them from public feeds, enforce item Available/Sold and rental Available/Unavailable states, and never expire listings automatically.
- [ ] Keep the existing photo set when no replacements are selected; when photos are changed, submit the complete replacement set with at least one and at most three images. Show photo thumbnails with remove controls; confirm deletion and remove listing images with the listing.
- [ ] Verify ownership, status, edit, and delete behavior with API and UI tests.

## M5 - Admin features

**T-20 - Establish trusted admin provisioning**

- [ ] Add an operator-only method to grant the initial admin role; never allow Mini App requests to grant admin access.
- [ ] Document the setup without committing Telegram IDs or secrets; verify regular users cannot elevate their role.

**T-21 - Build Admin Mini App entry and navigation**

- [ ] Add admin authorization, Dashboard navigation, and the separate Telegraf admin bot launch action.
- [ ] Give admins the shared Listings, Post, and Profile navigation plus Dashboard, opening on Dashboard; block non-admin access to admin screens/actions.
- [ ] Keep the admin bot token server-side; defer production webhook/polling choice until hosting is selected.
- [ ] Verify authorization and the launch action with a configured development bot.

**T-22 - Implement admin dashboard metrics**

- [ ] Add `/admin/dashboard` and cards for total users, total retained listings, and most-listed item category.
- [ ] Count every registered user (buyers and sellers) and all retained listings, including sold/unavailable; calculate most-listed category across retained item listings and handle empty/tied results deterministically.
- [ ] Show the three metrics in separate cards; verify results, empty/tied data, admin authorization, and card rendering with tests.

**T-23 - Implement admin listing review, removal, and seller notice**

- [ ] Let admins browse/search the same Items and House rentals pages as other users, with filters, and inspect retained listings and their images regardless of availability; deny these operations to non-admins.
- [ ] Confirm removal, delete the listing and images, then send the seller notice through the marketplace bot without a reason.
- [ ] Handle notification failures without restoring removed listings or logging private data; verify API and mocked Telegram behavior.

## M6 - Release readiness

**T-24 - Verify end-to-end user journeys**

- [ ] Verify browse/contact, post/manage, admin dashboard, removal, and seller notification for both listing types.
- [ ] Check loading, empty, validation, unavailable, unauthorized, and recoverable error states.
- [ ] Run configured test suites and record manual Telegram Mini App checks accurately.

**T-25 - Review security, privacy, and accessibility**

- [ ] Verify server-side authentication, ownership, admin authorization, input validation, and image handling.
- [ ] Confirm phone numbers are absent from feeds/profile pages and secrets/raw `initData` are absent from logs.
- [ ] Check semantic labels, keyboard use, visible focus, descriptive alternative text for images, reduced motion, pressed/selected/disabled states, and contrast in Telegram themes.

**T-26 - Finalize developer and release documentation**

- [ ] Add verified local setup, environment, test, migration, and run instructions to the README; keep the `docs/API.md` link.
- [ ] Confirm `.env.example` matches configuration and contains no secrets.
- [ ] Complete the release checklist; keep hosting deferred until a free-tier option is selected.

## Release checklist

- [ ] All Must requirements are implemented and verified.
- [ ] Configured tests, lint, type-check, and production builds pass; any unrun checks are reported.
- [ ] Authentication, authorization, validation, privacy, and error handling are reviewed.
- [ ] README and `.env.example` match the implementation.
- [ ] Hosting, migration, and rollback steps are addressed when a free-tier host is selected.
