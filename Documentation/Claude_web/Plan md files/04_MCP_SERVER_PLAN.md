# 🤖 MCP SERVER INTEGRATION PLAN
## WinWin.travel MCP + Booking.com Clone
> Separate Layer — Sits on top of your existing MVP stack

---

## 🔍 What Is the WinWin.travel MCP Server?

WinWin.travel provides a **free, fully hosted** MCP (Model Context Protocol) server that gives your AI agents direct access to 3M+ real hotel inventory with live booking capabilities — no Docker, no npm install, no self-hosting required.

| Property | Value |
|----------|-------|
| Transport | SSE (Server-Sent Events) |
| Endpoint | `https://sandbox.api.winwin.travel/mcp/sse` |
| Auth | Bearer token (free, via Tally form) |
| Cost | Free to connect; earn up to 10% cashback on bookings |
| Inventory | 3 Million+ hotels worldwide |
| Self-hosting needed | ❌ None |

---

## 🧰 What Tools the MCP Exposes

| Tool | What It Does | Maps to Your App |
|------|-------------|-----------------|
| `search_hotels` | Filter by 500+ attributes (price, amenities, vibe, policies, pet fees, pillow menu, etc.) | Replaces your `/api/search` for real inventory |
| `get_hotel_details` | Full hotel profile — rooms, amenities, photos, reviews | Replaces your `/api/properties/:id` |
| `book_reservation` | End-to-end booking — generates payment link or processes via Stripe MCP | Replaces your `simulatePayment()` with real bookings |
| `rate_hotel` | Like/dislike signals to train AI recommendations | Future: personalization engine |
| `get_market_trends` | Live price stats, demand trends, price alerts | Future: partner analytics dashboard |

---

## 🏗️ How It Fits Into Your Monorepo

```
booking-app/
├── client/               ← React 18 frontend (no change)
├── server/               ← Express backend (no change)
│   └── src/
│       └── modules/
│           └── mcp/      ← NEW: MCP proxy + Claude agent layer
│               ├── mcp.routes.ts
│               ├── mcp.controller.ts
│               └── mcp.service.ts
├── packages/
│   └── shared/           ← Add MCP types/schemas here
└── docker-compose.yml
```

> The MCP layer is additive — it does NOT replace your database or backend.
> Your local DB + Prisma handles users, auth, OTP, partner listings, and partner bookings.
> WinWin MCP handles real external hotel inventory search and booking.

---

## ✅ STEP 1 — Get Access Token

1. Go to: **[https://tally.so/r/GxdpeO](https://tally.so/r/GxdpeO)**
2. Fill the form → receive your `Bearer` token via email
3. Store it safely:
```bash
# server/.env
WINWIN_MCP_TOKEN=your_bearer_token_here
WINWIN_MCP_URL=https://sandbox.api.winwin.travel/mcp/sse
```
Add `WINWIN_MCP_TOKEN=` and `WINWIN_MCP_URL=` to your `.env.example` with empty values.

---

## ✅ STEP 2 — Configure Claude Desktop (for local dev / testing)

Before wiring into your app, test the MCP directly in Claude Desktop to understand tool behavior.

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "winwin-travel": {
      "url": "https://sandbox.api.winwin.travel/mcp/sse",
      "headers": {
        "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```
Restart Claude Desktop → try prompts like:
- *"Find boutique hotels in Mumbai under ₹5000/night with a rooftop pool"*
- *"Book the second option for 2 adults, send payment link to test@email.com"*

This tells you exactly what data shape each tool returns before you write integration code.

---

## ✅ STEP 3 — Install MCP Client SDK in Your Backend

```bash
cd server
npm install @modelcontextprotocol/sdk eventsource
npm install -D @types/eventsource
```

The SDK handles the SSE connection, tool discovery, and call/response lifecycle.

---

## ✅ STEP 4 — Build the MCP Service Layer

```typescript
// server/src/modules/mcp/mcp.service.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { env } from '../../config/env'
import { logger } from '../../config/logger'

let mcpClient: Client | null = null

/**
 * Returns a singleton MCP client connected to WinWin.travel.
 * Reconnects automatically if the connection drops.
 */
export async function getMcpClient(): Promise<Client> {
  if (mcpClient) return mcpClient

  const transport = new SSEClientTransport(
    new URL(env.WINWIN_MCP_URL),
    {
      requestInit: {
        headers: { Authorization: `Bearer ${env.WINWIN_MCP_TOKEN}` }
      }
    }
  )

  mcpClient = new Client({ name: 'booking-clone-client', version: '1.0.0' }, { capabilities: {} })
  await mcpClient.connect(transport)
  logger.info('MCP client connected to WinWin.travel')
  return mcpClient
}

export const mcpService = {

  /**
   * Search real hotels via WinWin MCP.
   * Wraps search_hotels tool — maps your query params to MCP input schema.
   */
  async searchHotels(params: {
    city:      string
    checkin:   string    // YYYY-MM-DD
    checkout:  string    // YYYY-MM-DD
    adults:    number
    maxPrice?: number
    amenities?: string[]
  }) {
    try {
      const client = await getMcpClient()
      const result = await client.callTool('search_hotels', {
        location:    params.city,
        check_in:    params.checkin,
        check_out:   params.checkout,
        guests:      params.adults,
        max_price:   params.maxPrice,
        amenities:   params.amenities ?? [],
      })
      logger.info('MCP search_hotels called', { city: params.city })
      return result
    } catch (error) {
      logger.error('MCP searchHotels failed', { error })
      throw error
    }
  },

  /**
   * Get full hotel details via WinWin MCP.
   */
  async getHotelDetails(hotelId: string) {
    const client = await getMcpClient()
    return client.callTool('get_hotel_details', { hotel_id: hotelId })
  },

  /**
   * Create a real booking via WinWin MCP.
   * Returns a payment link OR processes via Stripe MCP.
   */
  async bookReservation(params: {
    hotelId:       string
    roomId:        string
    checkin:       string
    checkout:      string
    guestName:     string
    guestEmail:    string
    adults:        number
  }) {
    const client = await getMcpClient()
    return client.callTool('book_reservation', {
      hotel_id:    params.hotelId,
      room_id:     params.roomId,
      check_in:    params.checkin,
      check_out:   params.checkout,
      guest_name:  params.guestName,
      guest_email: params.guestEmail,
      guests:      params.adults,
    })
  },

  /**
   * Get market trends for a city (price alerts, demand, etc.)
   */
  async getMarketTrends(city: string) {
    const client = await getMcpClient()
    return client.callTool('get_market_trends', { location: city })
  },
}
```

---

## ✅ STEP 5 — Add MCP Routes to Express

```typescript
// server/src/modules/mcp/mcp.routes.ts
import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware/validate.middleware'
import { authenticate } from '../../middleware/auth.middleware'
import { mcpController } from './mcp.controller'

const router = Router()

const searchSchema = z.object({
  city:     z.string().min(1),
  checkin:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults:   z.coerce.number().min(1).max(20),
  maxPrice: z.coerce.number().optional(),
})

// Public search
router.get('/mcp/search',           validate(searchSchema), mcpController.search)
router.get('/mcp/hotels/:hotelId',  mcpController.hotelDetail)
router.get('/mcp/trends/:city',     mcpController.trends)

// Booking requires auth
router.post('/mcp/book', authenticate, validate(bookSchema), mcpController.book)

export default router
```

Register in `src/index.ts`:
```typescript
import mcpRoutes from './modules/mcp/mcp.routes'
app.use('/api', mcpRoutes)
```

---

## ✅ STEP 6 — Wire Frontend to MCP Endpoints

Add a new API file in the client:
```typescript
// client/src/api/mcp.api.ts
import { apiClient } from './client'

export const mcpApi = {
  searchHotels: (params: SearchParams) =>
    apiClient.get('/mcp/search', { params }).then(r => r.data),

  getHotelDetail: (hotelId: string) =>
    apiClient.get(`/mcp/hotels/${hotelId}`).then(r => r.data),

  bookHotel: (data: BookingInput) =>
    apiClient.post('/mcp/book', data).then(r => r.data),

  getMarketTrends: (city: string) =>
    apiClient.get(`/mcp/trends/${city}`).then(r => r.data),
}
```

Update `search-page.tsx` to call `mcpApi.searchHotels()` instead of `propertiesApi.search()` when real inventory is desired. You can run **both in parallel** — show partner listings (your DB) alongside WinWin real inventory in the same search results page.

---

## ✅ STEP 7 — Hybrid Search Results Strategy

The smartest approach is to **merge your local partner listings with WinWin real inventory**:

```typescript
// server/src/modules/search/search.service.ts (updated)

async hybridSearch(params: SearchParams) {
  const [localResults, mcpResults] = await Promise.allSettled([
    prisma.property.findMany({ where: { city: params.city, status: 'ACTIVE' } }),
    mcpService.searchHotels(params),
  ])

  return {
    partnerListings: localResults.status === 'fulfilled' ? localResults.value : [],
    externalHotels:  mcpResults.status  === 'fulfilled' ? mcpResults.value  : [],
  }
}
```

On the frontend, render them in separate sections: **"Partner Hotels"** (your local DB) and **"More Hotels"** (WinWin inventory). This is exactly how Booking.com differentiates preferred partner listings from aggregated inventory.

---

## 🔴 ADVANCED TASKS (Phase 2 and beyond)

### A. Claude AI Concierge Agent
Build a chat widget that uses Claude + WinWin MCP tools to answer natural language queries:
```
User: "Find me a pet-friendly hotel in Ahmedabad under ₹4000 with blackout curtains"
Claude → calls search_hotels with amenities: ["pet_friendly", "blackout_curtains"], max_price: 4000
Claude → responds with 3 matching hotels, formatted conversationally
```
Implementation: use the Anthropic SDK on your backend to run Claude with the WinWin tools available. Stream the response to the frontend via SSE.

```typescript
// server/src/modules/agent/concierge.service.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function runConciergeAgent(userMessage: string) {
  const tools = await mcpClient.listTools()   // discovers WinWin tools automatically

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    tools: tools.map(t => ({
      name:        t.name,
      description: t.description,
      input_schema: t.inputSchema,
    })),
    messages: [{ role: 'user', content: userMessage }],
  })

  // Handle tool_use blocks → call MCP → continue agent loop
  return response
}
```

### B. Real Payment via Stripe MCP
WinWin's `book_reservation` supports Stripe MCP integration. When ready to go live:
1. Add Stripe MCP server to your Claude Desktop / backend agent config
2. The booking agent calls `book_reservation` → WinWin returns a Stripe `payment_intent` → Claude calls Stripe MCP to confirm — all in one agent turn.
3. No manual Stripe code needed on your side.

### C. Price Alert System
Use `get_market_trends` to poll prices for a city on a schedule:
```typescript
// server/src/jobs/price-alert.job.ts
cron.schedule('0 8 * * *', async () => {
  const watchedCities = await prisma.priceAlert.findMany({ where: { active: true } })
  for (const alert of watchedCities) {
    const trends = await mcpService.getMarketTrends(alert.city)
    if (trends.avgPrice < alert.targetPrice) {
      await emailService.sendPriceAlert(alert.userEmail, alert.city, trends)
    }
  }
})
```

### D. AI-Powered Recommendations (Rate Hotel)
After a completed booking, call `rate_hotel` with the user's feedback:
```typescript
await mcpService.rateHotel(hotelId, { liked: ['pool', 'location'], disliked: ['wifi'] })
```
Over time this trains WinWin's recommendation engine to surface better results for that user's profile — without you building a recommendation system.

### E. Partner Dashboard Market Intel
Add a "Market Insights" tab for your partner listings, powered by `get_market_trends`:
- Competitor pricing in their city
- Demand forecast for the next 30 days
- When to raise/lower room prices

### F. Multi-MCP Architecture (Scale-up)
WinWin covers hotels. Add more MCP servers for a full travel stack:

| Need | MCP Server |
|------|-----------|
| Flights | Kiwi.com MCP (official, launched Aug 2025) |
| Activities | Expedia Group MCP (official) |
| Maps/Navigation | Mapbox MCP (official) |
| Currency | Any currency exchange MCP |
| Weather at destination | WeatherXM MCP |

All can be connected to the same Claude agent — it discovers tools from all servers automatically.

---

## ⚖️ WinWin MCP vs Your Own Backend — When to Use Each

| Scenario | Use Your Backend (Prisma) | Use WinWin MCP |
|----------|--------------------------|---------------|
| Partner registers + manages listing | ✅ | ❌ |
| User auth + OTP + JWT | ✅ | ❌ |
| Search partner's own listings | ✅ | ❌ |
| Search real-world hotel inventory | ❌ | ✅ |
| Price comparison across 3M hotels | ❌ | ✅ |
| Real booking with payment link | ❌ | ✅ |
| Market trends / competitor pricing | ❌ | ✅ |
| Cancellation of your partner's booking | ✅ | ❌ |
| AI concierge (natural language search) | ❌ | ✅ (via Claude agent) |

---

## 🚫 CRITICAL RULES FOR MCP INTEGRATION

- Store `WINWIN_MCP_TOKEN` in `.env` only — never commit it, never log it.
- Always use `Promise.allSettled()` (not `Promise.all()`) for hybrid search — one failing source must not break the other.
- Cache MCP responses for search results (Redis or React Query's `staleTime`) — avoid hammering the SSE connection on every keystroke.
- Never forward raw MCP tool responses directly to the client — always validate and shape the response in your controller first (Zod).
- Rate limit the `/api/mcp/search` endpoint (separate from auth limiter) — it's a proxy to an external service.
- Handle MCP client disconnects gracefully — implement reconnect logic with exponential backoff.

---

## 📋 Build Order for MCP Integration

```
1. Get token → Test in Claude Desktop → Understand tool schemas         (1 day)
2. Install SDK + build mcpService singleton                              (1 day)
3. Add /api/mcp/* routes + Zod validation                               (1 day)
4. Wire frontend mcpApi + update search page (hybrid results)           (1 day)
5. Add concierge chat widget (Claude + MCP agent)                       (2-3 days)
6. Stripe MCP for real payments                                         (1-2 days)
7. Price alerts cron + partner market intel dashboard                   (2 days)
8. Multi-MCP (flights, activities, weather)                             (ongoing)
```

Total to working MCP integration alongside your existing MVP: **~4 days**.
