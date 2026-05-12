# Booking.com Technical Requirements Analysis

## 1. Product Navigation (Homepage Tabs)
- **Stays**: Primary vertical for accommodation search.
- **Flights**: Directs to flight search (powered by Kayak).
- **Flight + Hotel**: Packages vertical (lastminute.com integration).
- **Car rental**: Car hire services.
- **Attractions**: Booking for local tours and activities.
- **Airport taxis**: Pre-booked taxi services.

## 2. Main Search Component (Homepage)
- **Destination Input**: 
    - Placeholder: "Where are you going?"
    - Type: Combobox/Autocomplete.
- **Date Range Picker**:
    - Default Value: Often defaults to next month or specific dates if previously searched.
    - Behavior: Opens a calendar modal for Check-in and Check-out.
- **Occupancy/Rooms Picker**:
    - Default Value: 2 adults, 0 children, 1 room.
    - Fields:
        - Adults (number incrementer)
        - Children (number incrementer, with age dropdowns appearing per child)
        - Rooms (number incrementer)
- **Search Button**: Primary CTA.
- **Checkbox**: "Add flights to my search" (Cross-sell toggle).

## 3. Promotional & Discovery Content (Homepage Sections)
- **Why Booking.com?**: Trust banners (Free cancellation, 2M+ properties, etc.).
- **Your recent searches**: Carousel of previous search queries.
- **Trending destinations**: List/Grid of popular locations.
- **Offers**: Promotional banners (e.g., Getaway Deals).
- **Browse by property type**: Categories like Hotels, Apartments, Resorts.
- **Quick and easy trip planner**: Filters like "Beach", "Outdoors".
- **Home guests love**: Featured homes.
- **Stay at our top unique properties**: Curated list.
- **Destinations we love**: Regional tabs for cities/interests.
## 4. Search Results Page (SERP)
### 4.1 Filter Sidebar Categories
- **Your budget (per night)**: Range slider or checkboxes.
- **Popular filters**: Dynamic based on destination (e.g., Free cancellation, Breakfast included).
- **Facilities**: Swimming pool, Parking, Spa, etc.
- **Property rating**: Star ratings (1-5 stars).
- **Meals**: Breakfast included, Self catering.
- **Property type**: Hotels, Apartments, Hostels, etc.
- **Landmarks**: Proximity to specific sites (e.g., Times Square).
- **Bed preference**: Twin beds, Double bed.
- **Review score**: 9+, 8+, 7+, 6+.
- **Sustainability**: Travel Sustainable levels.
- **Room facilities**: Kitchen, Balcony, etc.
- **District**: Specific neighborhoods (e.g., Manhattan).
- **Accessibility**: Property and Room accessibility features.

### 4.2 Sorting & View Controls
- **Sort Options**: Top picks, Distance, Star rating, Price, Best reviewed.
- **Map View**: Toggle to see properties on a map.

### 4.3 Property Card Data Points
- **Visuals**: Primary thumbnail, "Save" heart icon.
- **Identity**: Name, Star/Quality rating, Location, Distance from centre.
- **Badges**: "Metro access", "Promoted/Ad" label.
- **Social Proof**: Review score (numeric), Textual label (e.g., "Very good"), Review count.
- **Specific Scores**: Location score.
- **Room Info**: Room type name, Bed configuration.
- **Booking Terms**: Free cancellation, No prepayment needed.
- **Urgency**: "We have X left at this price".
- **Pricing**: Strikethrough price (original), Current price, Taxes & charges.
- **CTA**: "See availability" button.

## 5. Property Detail Page (PDP)
### 5.1 Header & Overview
- **Breadcrumbs**: Home > Hotels > Country > Region > City > District > Property Name.
- **Identity**: Name, Star/Quality rating, Address, "Show on map" link.
- **Primary CTAs**: "Reserve" (top and floating), "Save" heart, "Share" icon.
- **Social Proof**: Overall review score (e.g., 8.2), textual rating (e.g., "Very good"), review count.

### 5.2 Navigation Tabs
- Overview, Prices, Facilities, House rules, Guest reviews.

### 5.3 Availability / Room Selection Table
- **Columns**: Room type, Number of guests, Price, Your choices, Select rooms.
- **Room Type Cell**: Name (link), Bed configuration, Facilities list (Free WiFi, Air conditioning, etc.).
- **Price Cell**: Strikethrough price, Current price, Taxes & charges breakdown, Discount badge (e.g., "23% off").
- **Choices Cell**: Cancellation policy, Prepayment terms, Urgency badge (e.g., "We have 3 left").
- **Action**: Dropdown for room count, "I'll reserve" button.

### 5.4 Facilities & Surroundings
- **Most popular facilities**: Icon-based list.
- **Detailed categories**: Pets, Media & Tech, Food & Drink, Internet, Parking, Services, General, Accessibility, Languages spoken.
- **Surroundings**: "What's nearby", "Top attractions", "Public transport", "Closest airports".

### 5.5 Guest Reviews Section
- **Category Scores**: Staff, Facilities, Cleanliness, Comfort, Value, Location, Free WiFi.
- **Review Highlights**: "Top-rated guest experiences" carousel with snippets.
- **Common Questions**: Accordion-style FAQs (e.g., "Do they serve breakfast?").

## 6. House Rules & Fine Print
### 6.1 House Rules
- **Check-in/out**: Precise times and requirements (e.g., photo ID).
- **Cancellation/Prepayment**: Link to conditions.
- **Damage Deposit**: Amount, currency, and refund terms.
- **Children & Beds**: Child policies, age limits, and extra bed options.
- **Age restriction**: Minimum age for check-in.
- **Pets**: Policies and potential charges.
- **Groups**: Terms for bookings of 9+ rooms.
- **Accepted payment methods**: List of credit cards/methods.

### 6.2 Fine Print
- Textual notes about specific property policies (e.g., facility hours, renovation notices).

## 7. Checkout Flow
### 7.1 Step 1: Your details
- **Forms**: Name, Email, Country, Phone.
- **Add-ons**: Flight, Car hire, Taxi options.
- **Preferences**: Special requests, Arrival time selection.
- **Sidebar**: Property summary, Booking summary, Price breakdown.

### 7.2 Step 2: Final details
- **Address Details**: Address line 1, City, Zip code, Country.
- **Payment Method**: Card type selection, Cardholder name, Card number, Expiration date, CVC.
- **Final Review**: "Check your booking" sidebar with total price and cancellation terms.
- **Submission**: "Complete booking" button (final step).

## 8. Summary of Findings
- The Booking.com flow is a multi-step process (Search -> PDP -> Checkout Step 1 -> Checkout Step 2).
- Key technical elements include interactive filters, dynamic price conversion, urgency badges, and detailed policy sections.
- The UI uses a persistent sidebar for booking summaries and pricing in the checkout phase.
