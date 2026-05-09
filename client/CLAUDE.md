# Client — CLAUDE.md
> React 18 + Vite + TypeScript + Tailwind · Booking.com Clone MVP · Port 3000

---

## Quick Start

```bash
cd client
npm run dev          # Vite dev server with HMR
```

Proxies `/api` requests to `http://localhost:3001` (configured in `vite.config.ts`).

---

## Key Commands

```bash
npm run dev          # start Vite dev server on port 3000
npm run build        # tsc + vite build → dist/
npm run lint         # eslint src/**/*.{ts,tsx}
```

---

## Environment Variables (client/.env)

```
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001
VITE_ENV=development
```

---

## Folder Structure

```
client/src/
├── api/
│   ├── client.ts             ← Axios instance (base URL, JWT interceptor, 401 → refresh)
│   ├── auth.api.ts           ← register, verifyOtp, login, refresh, logout
│   ├── properties.api.ts     ← search, getById
│   └── bookings.api.ts       ← createHold, createBooking, getMyBookings, cancel
├── components/
│   ├── layout/
│   │   ├── Header.tsx        ← sticky nav, auth-aware (login/register or email + logout)
│   │   └── PageWrapper.tsx   ← max-w-6xl mx-auto px-4 py-6 container
│   └── ui/
│       ├── Button.tsx        ← variant: primary/secondary/danger · size: sm/md/lg · loading spinner
│       ├── Input.tsx         ← forwardRef, label, error message
│       ├── Spinner.tsx       ← animated SVG circle, size: sm/md/lg
│       ├── ErrorBanner.tsx   ← red alert box
│       └── Badge.tsx         ← booking status chip (CONFIRMED=green, CANCELLED=red, etc.)
├── features/
│   ├── auth/
│   │   ├── login-page.tsx        ← RHF + Zod, POST /auth/login
│   │   ├── register-page.tsx     ← RHF + Zod, POST /auth/register
│   │   └── otp-page.tsx          ← 6-digit code, POST /auth/verify-otp
│   ├── search/
│   │   ├── search-page.tsx       ← hero + search form + results grid
│   │   └── property-card.tsx     ← result card linking to property detail
│   ├── property/
│   │   └── property-detail-page.tsx ← cover, amenities, room cards, stay sidebar
│   ├── checkout/
│   │   ├── guest-details-page.tsx   ← 🔒 name/email/phone/country/arrivalTime/specialRequests
│   │   ├── payment-page.tsx         ← 🔒 card form + price breakdown sidebar
│   │   └── confirmation-page.tsx    ← 🔒 confirmationNumber + PIN + summary
│   ├── trips/
│   │   └── trips-page.tsx           ← 🔒 booking list + cancel action
│   └── partner/                     ← stubs (Phase 2)
│       ├── dashboard/
│       ├── onboarding/
│       ├── bookings/
│       ├── availability/
│       └── earnings/
├── hooks/
│   ├── useAppDispatch.ts     ← unused stub (project uses Zustand, not Redux)
│   └── useAppSelector.ts     ← unused stub (project uses Zustand, not Redux)
├── store/
│   ├── auth.store.ts         ← Zustand + persist · { user, accessToken, refreshToken }
│   └── checkout.store.ts     ← Zustand · { roomSelection, guestDetails, holdId }
├── router/
│   └── index.tsx             ← createBrowserRouter, lazy pages, ProtectedRoute
├── types/
│   └── index.ts              ← User, Property, RoomType, SearchResult, BookingListItem, CreatedBooking, etc.
└── utils/
    ├── format.ts             ← formatPrice(), formatDate(), formatNights(), todayStr(), tomorrowStr()
    └── error.ts              ← getApiError() extracts human message from Axios errors
```

---

## Pages & Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/` | SearchPage | — | Destination + dates + adults search form, results grid |
| `/property/:id` | PropertyDetailPage | — | Property info, room cards, "Reserve" CTA |
| `/login` | LoginPage | — | Email + password login |
| `/register` | RegisterPage | — | Name + email + password registration |
| `/verify-otp` | OtpPage | — | 6-digit OTP verification |
| `/checkout/details` | GuestDetailsPage | 🔒 | Guest name, email, phone, arrival time |
| `/checkout/payment` | PaymentPage | 🔒 | Card form, price summary sidebar |
| `/booking/confirmation/:bookingId` | ConfirmationPage | 🔒 | confirmationNumber + PIN |
| `/trips` | TripsPage | 🔒 | Booking list + cancel |
| `/partner/dashboard` | PartnerDashboardPage | 🔒 PARTNER | Stub |
| `/partner/onboarding` | PartnerOnboardingPage | 🔒 PARTNER | Stub |
| `/partner/bookings` | PartnerBookingsPage | 🔒 PARTNER | Stub |
| `/partner/properties/:id/availability` | PartnerAvailabilityPage | 🔒 PARTNER | Stub |
| `/partner/earnings` | PartnerEarningsPage | 🔒 PARTNER | Stub |

---

## State Management

### Auth Store (`store/auth.store.ts`)
- Zustand + `persist` middleware (survives page refresh via localStorage)
- `login(user, accessToken, refreshToken)` — sets all three
- `clear()` — logout, clears all state
- `setTokens(accessToken, refreshToken)` — used by token refresh interceptor
- `isAuthenticated()` — returns `accessToken !== null`

### Checkout Store (`store/checkout.store.ts`)
- Plain Zustand (not persisted — intentionally cleared after booking)
- `setRoomSelection({ propertyId, roomTypeId, ratePlanId, checkin, checkout, adults, children, priceBreakdown, holdId })`
- `setHoldId(holdId)` — updates holdId after successful hold creation
- `setGuestDetails({ firstName, lastName, email, phone, country, arrivalTime, specialRequests, isMainGuest })`
- `clear()` — called after `POST /bookings` succeeds

---

## API Layer

### Axios Client (`api/client.ts`)
- `baseURL`: `VITE_API_URL` env var (defaults to `http://localhost:3001/api/v1`)
- Request interceptor: attaches `Authorization: Bearer <token>` from Zustand auth store
- Response interceptor: on 401 → attempt token refresh → retry original request → on failure: `clear()` + redirect to `/login`
- Timeout: 10 seconds

### Error Handling
Always use `getApiError(error)` from `utils/error.ts` — extracts the human-readable message from Axios error responses.
Never display raw `error` objects or `error.message` directly.

---

## Customer Booking Flow

```
/ (Search) → /property/:id (Pick Room → creates Hold)
  → /checkout/details (Guest info → stored in Zustand)
    → /checkout/payment (Card form → POST /bookings)
      → /booking/confirmation/:id (shows confirmationNumber + PIN)
```

- Hold is created on "Reserve" click in PropertyDetailPage (POST `/bookings/hold`)
- Hold ID is stored in `checkout.store`
- On payment success: `checkout.store.clear()` is called, navigate to confirmation with `{ state: { booking } }`
- Confirmation page reads booking from `useLocation().state.booking`

---

## Form Pattern

All forms use **React Hook Form** + **Zod** + `@hookform/resolvers/zod`:

```tsx
const schema = z.object({ email: z.string().email(), ... })
type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
})
```

No API call fires until client-side Zod validation passes.

---

## Tailwind Config

- Primary color: `primary-500` (blue) — configured in `tailwind.config.ts`
- All components use Tailwind utility classes
- Responsive breakpoints: `sm` (640px), `lg` (1024px), `xl` (1280px)

---

## TypeScript

- Strict mode enabled
- `tsconfig.node.json` exists for Vite config type checking
- `npx tsc --noEmit` passes with 0 errors
- `npx vite build` produces clean dist/ (201 modules)

---

## What Is NOT Yet Implemented (Phase 2)

- All 5 partner pages (dashboard, onboarding, bookings, availability, earnings) — currently stubs
- Date picker with blocked-date awareness
- Search filter sidebar (price range, star rating, amenities, category)
- Infinite scroll on search results
- Error boundary around `<AppRouter>`
- i18n scaffolding
- Optimistic UI for cancellation
- Bright Data MCP hybrid search UI (`ExternalHotelCard`, hybrid search results)

---

## Critical Rules

- Never store `accessToken` in `localStorage` directly — only via Zustand `persist`.
- Always use `getApiError(error)` — never display raw error objects.
- All form filenames → `kebab-case`; all component/class names → `PascalCase`.
- Never use `dangerouslySetInnerHTML`.
- DEV-only UI (payment failure toggle) must be wrapped in `import.meta.env.DEV`.
- Never run `git push`, `rm -rf`, or destructive operations without explicit user approval.
- Always ask before any `git commit`, `git add`, `git reset`, or `git merge`.
