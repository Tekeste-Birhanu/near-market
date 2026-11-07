# Application Flow

## 1. Purpose

Describe how buyers, sellers, and admins move through Near Market. Product requirements are in `PRD.md`; visual guidance is in `DESIGN.md`.

## 2. Navigation map

```text
Telegram bot
  ├── Marketplace bot → Mini App
  │   ├── Listings → Items (default) / House rentals → listing details → seller profile / contact seller
  │   ├── Post → choose Item or House rental → matching form → publish
  │   └── Profile → My listings / Settings → edit profile
  └── Admin bot → Admin Mini App
      ├── Listings → Items / House rentals → listing details
      ├── Post → choose Item or House rental → matching form
      ├── Profile → My listings / Settings
      └── Dashboard (default)
```

The marketplace Mini App opens on Listings with Items selected. The Admin Mini App has the same navigation plus Dashboard and opens on Dashboard. The interface defaults to English; users can switch to Amharic and use a Light/Dark toggle in Profile > Settings. Theme follows Telegram until the user changes the toggle; the selected preference is stored locally. Users can browse before setting up to post.

## 3. Main journeys

### J-01 - Browse listings

- **Actor / role:** Buyer
- **Entry point:** Marketplace bot opens the Mini App.
- **Preconditions / access:** No seller profile setup is required to browse.
- **Steps:**
  1. The Mini App opens on Listings with Items selected.
  2. The buyer can switch to House rentals and browse or search either listing type.
  3. The buyer opens listing details and can view the seller profile or contact the seller.
- **Back navigation:** Returning from listing details restores the same page and browsing position.
- **Unavailable listing:** If a sold or unavailable listing is opened from an old link, show an unavailable message.
- **Success outcome:** The buyer finds a listing and can contact its seller.
- **Related requirements:** F-01, F-02, F-07, F-08

### J-02 - Post a listing

- **Actor / role:** Seller
- **Entry point:** The seller taps **Post** in the main navigation.
- **Preconditions / access:** The seller must have a Telegram username. Browsing remains available without one.
- **Steps:**
  1. If the Telegram username is missing, posting is blocked and the seller is told a username is required so buyers can contact them.
  2. The first time the seller posts, show the prohibited-listings notice before opening the form; no separate acknowledgment checkbox is required.
  3. Ask whether the seller is posting an Item or a House rental.
  4. Open the matching form.
  5. The seller enters listing details and uploads at least one image before submitting. Any phone number is managed separately in Profile > Settings and applies to all of the seller's listings.
  6. The listing appears immediately after successful submission.
- **Success outcome:** The listing is published on the matching Items or House rentals page, then its details open.
- **Failure and recovery:** If submission fails, preserve entered details where feasible and let the seller retry.
- **Related requirements:** F-03, F-05, F-11

### J-03 - Manage own listings

- **Actor / role:** Seller
- **Entry point:** The seller opens **Profile** and selects **My listings**.
- **Preconditions / access:** The seller is authenticated and can manage only listings they own.
- **Steps:**
  1. Show the seller's own listings, including sold and unavailable listings.
  2. From Profile > Settings, the seller can edit their display name, optional phone number, and interface language.
  3. The seller can edit a listing, change its availability to Sold or Unavailable as appropriate, or choose to delete it.
  4. Always ask the seller to confirm before permanently deleting a listing. Cancel returns to My listings without deleting it.
- **Unsaved changes:** If the seller leaves a form with unsaved changes, ask for confirmation before discarding them.
- **Success outcome:** The listing reflects the seller's changes; sold or unavailable listings are hidden from the public feed by default.
- **Related requirements:** F-06, F-08

### J-04 - Remove a listing as an admin

- **Actor / role:** Admin
- **Entry point:** Admin opens the separate admin bot, which launches the Admin Mini App.
- **Preconditions / access:** The user is authorized as an admin.
- **Steps:**
  1. The Admin Mini App opens on the Dashboard tab, showing all registered users (buyers and sellers), total listings, and the most listed item category.
  2. The admin navigates to Items or House rentals and browses or searches listings, as other users do.
  3. The admin opens a listing, chooses to remove it, and confirms the action.
  4. The listing is removed and its seller is notified on Telegram without a reason being included.
- **Success outcome:** The listing is no longer available to buyers.
- **Related requirements:** F-09

## 4. Screen and route inventory

| Screen / route    | Purpose                                                                                        | Who can access it                                        | Related journeys |
| ----------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------- |
| Listings          | Browse items and whole-house rentals, with Items selected by default.                          | Any Mini App user.                                       | J-01             |
| Post              | Choose whether to post an item or house rental.                                                | Any Mini App user; posting requires a Telegram username. | J-02             |
| Listing details   | Show listing information and contact options.                                                  | Any Mini App user.                                       | J-01             |
| Seller profile    | Show seller's display name and available listings.                                             | Any Mini App user.                                       | J-01             |
| Profile           | Open My listings and Settings.                                                                 | Authenticated user.                                      | J-03             |
| Settings          | Edit marketplace display name, optional profile phone number, interface language, and theme.    | Authenticated user.                                      | J-03             |
| Item form         | Create or edit an item listing.                                                                | Authenticated seller; can edit only own listings.        | J-02, J-03       |
| House rental form | Create or edit a whole-house rental listing.                                                   | Authenticated seller; can edit only own listings.        | J-02, J-03       |
| My listings       | Show and manage the seller's own listings, including sold/unavailable listings.                | Authenticated seller.                                    | J-03             |
| Dashboard         | Show all registered users (buyers and sellers), total listings, and most listed item category. | Authorized admin.                                        | J-04             |

## 5. Shared states and edge cases

- **Loading:** Keep the current page context while listings or details load.
- **Empty:** Explain when a feed has no available listings. Keep the **Post** navigation item available.
- **Error:** Show a clear error and allow retry. Preserve listing form details where feasible if submission fails.
- **Unauthorized:** If a user without a Telegram username taps Post, block posting and explain the username requirement; keep browsing available.
- **Unavailable listing:** If a sold or unavailable listing is reached from an old link, show an unavailable message.
- **Destructive action:** Always confirm before permanently deleting a seller listing or removing a listing as an admin. Cancel leaves the listing unchanged.
- **Unsaved changes:** Confirm before discarding changes when leaving a listing form.
- **Offline / interrupted:** Preserve entered listing details where feasible so the seller can retry.

## 6. Flow rules

- Listings is the default marketplace page, with Items selected; users switch to House rentals within Listings.
- The Post navigation item asks the seller to choose Item or House rental, then opens the matching form.
- Profile contains My listings and Settings.
- The Admin Mini App has the same Listings, Post, and Profile navigation, plus Dashboard.
- Browsing does not require seller setup. Posting requires a Telegram username.
- The first time a seller posts, show the prohibited-listings notice before the listing form; no acknowledgment checkbox is required.
- Returning from listing details restores the same listing type and browsing position.
- Sellers can manage only their own listings. Admin-only screens and actions require admin access.
- Sold and unavailable listings are hidden from public feeds by default but remain in My listings.
- Buyer reporting is not part of the MVP.
