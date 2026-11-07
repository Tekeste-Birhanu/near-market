# Design and UX Specification

## 1. Design direction
- **Product feel:** Familiar and easy to use inside Telegram, with a distinct Near Market identity.
- **Theme support:** Support Light and Dark themes. Follow Telegram's active theme until the user changes the Light/Dark toggle in Profile > Settings; then persist and apply that choice locally.
- **Primary audience:** Buyers and sellers browsing and posting items or whole-house rentals, plus admins using the Admin Mini App.
- **Design priorities:** Make listings easy to scan, keep prices and contact actions clear, and keep posting straightforward on mobile.

## 2. Design principles
- Keep browsing focused: show the information buyers need to decide whether to open a listing.
- Use consistent layouts for item and house rental listings while showing only relevant details for each type.
- Make primary actions easy to find without crowding the screen.
- Use the device system font so Amharic and English render naturally across supported devices.

## 3. Visual foundations
- **Typography:** Use the device system font, including its Amharic and English support. Give listing prices strong visual prominence, followed by titles and supporting details.
- **Color:** Use a distinct Near Market blue for the brand accent and key actions. Adapt surfaces and text to the active Light or Dark theme, and maintain readable contrast in both.
- **Spacing:** Use comfortable spacing within cards and forms. Preserve enough density for buyers to scan the feed while aiming to show two listing cards in the initial screen view where the device size allows.
- **Shape and elevation:** Use rounded listing cards with a subtle border. Avoid relying on shadows to separate cards.
- **Icons and imagery:** Use clear listing photos and recognizable icons. Listing-card images are square and occupy about one-third of the card width.
- **Responsive behavior:** Design for narrow Telegram Mini App screens first. Keep card text and actions legible on small screens and adapt spacing without changing the item/rental layout pattern.

## 4. Components and patterns

| Component / pattern | Purpose | Relevant behavior / variants |
|---|---|---|
| Bottom navigation | Move between main areas of the Mini App. | Show an icon and label for Listings, Post, and Profile. The Admin Mini App also has Dashboard. |
| Listing type tabs | Switch between Items and House rentals within Listings. | Items is selected by default. Search applies only to the selected tab and sits above the tabs. |
| Search and filters | Find listings in the selected listing type. | Keep filters hidden until Filter is tapped; show the controls inline on the Listings page. |
| Theme setting | Let users control light or dark appearance. | In Profile > Settings, provide a Light/Dark toggle. Follow Telegram's active theme until the user changes the toggle, then persist the chosen appearance locally. |
| Listing card | Summarize a listing in the feed. | Stack cards vertically. Use a square image at about one-third width, with title, prominent price, and a compact Contact button beside a compact View details button. Item cards show New or Used. Rental cards show the seller-entered address. Use the same layout for both listing types. |
| Photo gallery | Display listing photos on the details page. | Show a large main photo at the top and allow swiping through up to three photos. |
| Listing form | Create or edit a listing. | Use one scrollable form for each listing type. Show uploaded photos as thumbnails with a remove control. Keep Publish fixed at the bottom while creating a listing. |
| Dashboard metric card | Present an admin marketplace total. | Show total users, total listings, and most listed item category in three separate summary cards. |

## 5. Screen-specific guidance

### Listings
- **Purpose:** Browse and search items or whole-house rentals.
- **Layout and hierarchy:** Put search above the Items and House rentals tabs. Show filters inline only after Filter is tapped. Use vertically stacked, spacious listing cards; aim to show two cards in the initial view where screen size permits.
- **Primary action:** Each card has compact Contact and View details buttons side by side. Contact opens the seller's Telegram account.
- **Visual details:** Keep the price most prominent. Show New/Used on item cards and the seller-entered address on rental cards. Use a simple empty message with a Post button when the selected tab has no listings.
- **Related flow:** J-01 in `APP_FLOW.md`.

### Listing details
- **Purpose:** Let buyers review a listing and choose how to contact its seller.
- **Layout and hierarchy:** Show a large photo at the top, followed by listing information and contact options. Allow buyers to swipe through up to three photos.
- **Visual details:** Keep price easy to find. Show optional phone contact here, along with the Telegram contact action; do not put the phone number in the feed.
- **Related flow:** J-01 in `APP_FLOW.md`.

### Item and house rental forms
- **Purpose:** Let sellers enter the details for the selected listing type.
- **Layout and hierarchy:** Use one scrollable page per form. Keep the Publish action fixed at the bottom. Display selected photos as thumbnails with a remove control.
- **Related flow:** J-02 and J-03 in `APP_FLOW.md`.

### Admin dashboard
- **Purpose:** Give admins a quick view of marketplace totals.
- **Layout and hierarchy:** Present total users, total listings, and most listed item category in three separate summary cards.
- **Related flow:** J-04 in `APP_FLOW.md`.

## 6. Interaction and UI states
- **Interactive states:** Give buttons, tabs, filters, and cards clear pressed, selected, focus, and disabled states as applicable. Keep action buttons compact within listing cards.
- **Operation feedback:** Show clear loading and success feedback for listing submissions and other actions.
- **Validation and errors:** Place field validation near the relevant form field. Explain system errors clearly and provide a visible retry path where appropriate.
- **Empty states:** Use concise text and a Post button when a listing feed is empty. Avoid decorative illustrations that compete with the action.
- **Confirmation:** Use a clear confirmation dialog for destructive actions, with distinct confirm and cancel actions.

## 7. Accessibility
- Use semantic structure and meaningful labels.
- Ensure keyboard access and visible focus.
- Maintain readable contrast in both Telegram themes and do not rely on color alone.
- Provide appropriate alternative text and accessible names.
- Respect reduced-motion preferences where animation is used.
- Ensure interactive controls work with relevant assistive technologies.

## 8. Content guidelines
- **Tone and terminology:** Use concise, familiar wording. Keep navigation and action labels consistent with Listings, Items, House rentals, Post, Profile, My listings, Settings, and Dashboard.
- **Labels and messages:** Localize interface labels and messages in English by default, with an Amharic option. Keep seller-entered listing text in the language the seller chose; do not imply it is translated.
- **Dates, numbers, and localization:** Format listing prices in ETB. House rental prices are identified as monthly, consistent with the product requirements.
- **Errors:** State what happened and what the user can do next in plain language.

## 9. Open design questions
None currently identified.
