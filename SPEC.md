# Promote — Earn Production Access

## Concept & Vision

Promote is a gamified ticketing platform where developers earn their way to production access by resolving staging and dev environment tickets. It's a meritocratic system that rewards quality work — techs build reputation through ratings, climb the promotion ladder, and unlock paid production opportunities. The experience should feel premium, dark-mode native, and subtly gamified with visual progress indicators.

## Design Language

### Aesthetic Direction
Dark, sophisticated developer tooling aesthetic — inspired by premium IDE themes and observability dashboards. Not generic "dark mode" but a considered palette with teal/amber accent interplay.

### Color Palette
```
--bg: #0E1A1B           (Deep teal-black background)
--bg-alt: #0A1415       (Darker panel background)
--panel: #142526        (Card/panel background)
--panel-2: #1B2E30      (Elevated panel)
--line: #23393B         (Border/divider)
--text: #E9F3F1         (Primary text)
--muted: #8FADA9        (Secondary text)
--muted-2: #5E7C79      (Tertiary text)
--amber: #FFB454        (Primary accent - actions, CTAs)
--amber-dim: #7A5A2A    (Amber background variant)
--green: #4FD98A        (Success/production tier)
--green-dim: #1E3B2B    (Green background variant)
--red: #FF6B6B          (Error/high priority)
--red-dim: #3B2323      (Red background variant)
--blue: #6FB8FF         (Info/dev tier)
```

### Typography
- **Display/Headings**: Space Grotesk (700, 600, 500)
- **Body**: Inter (400, 500, 600)
- **Monospace**: JetBrains Mono (400, 500, 600)

### Spatial System
- Base unit: 4px
- Border radius: 10px (panels), 8px (buttons), 7px (inputs)
- Consistent 20px panel padding
- 24px gap between major sections

### Motion Philosophy
- Subtle 150ms transitions on interactive elements
- No dramatic animations — professional and snappy
- Hover states lift slightly with shadow enhancement

## Layout & Structure

### App Shell
- Max-width 1180px centered container
- Topbar with brand, identity input, role toggle
- Tab navigation below topbar
- Content area with consistent spacing

### Responsive Strategy
- Two-column grids collapse to single column below 860px
- Tab navigation wraps naturally
- Touch-friendly tap targets (min 44px)

## Features & Interactions

### Authentication (Simplified)
- Name-based identity stored server-side
- Role toggle: Customer / Tech
- Identity persists in database, not localStorage

### Dashboard
**Customer View:**
- Summary cards: My Open Tickets, Resolved Tickets, Pending Requests
- Quick action buttons to submit tickets

**Tech View:**
- Summary cards: Available Tickets, My Resolved Tickets, Current Score
- Leaderboard preview (top 3)

### Ticket Management

**Submit Ticket (Customer):**
- Title (required)
- Description (required, textarea)
- Environment selector: Dev / Staging (radio-style buttons)
- Priority: Normal / High
- Submit creates ticket with status "open"

**Available Tickets (Tech):**
- Lists open tickets matching tech's tier access
- Dev tier: sees dev tickets only
- Staging tier: sees dev + staging tickets  
- Production-Ready: sees all tickets
- "Claim" button to pick up ticket

**My Tickets:**
- Filter tabs: All / Open / Claimed / Resolved / Closed
- Sortable by date
- Claimed tickets show "Mark Resolved" action
- Resolved tickets show rating modal

### Rating System
- 1-5 star visual picker
- Optional comment textarea
- Rating calculates composite score for tech

### Leaderboard
- Ranked list of all techs
- Visual ladder showing Dev → Staging → Production progress
- Composite score calculation
- Tier badges

**Tier Thresholds:**
- Dev: 0-32 composite
- Staging: 33-65 composite
- Production-Ready: 66+ composite

**Composite Score Formula:**
```
composite = (avgRating * 20) + (resolvedCount * 2)
avgRating weighted 1-5 scale → 0-100
each resolved ticket adds 2 points
```

### Hire Requests
**Customer → Tech:**
- "Request for production" button on Production-Ready techs
- Modal with message and contact info
- Creates request visible in My Requests

**Tech sees:**
- My Leads: Incoming hire requests
- Accept/Decline actions

## Component Inventory

### Topbar
- Brand mark (gradient amber square with "Pr")
- Brand text (Promote / Earn Production Access)
- Name input field
- Role toggle buttons

### Tab Navigation
- States: default, hover, active
- Active has amber border and background tint

### Cards/Panels
- Background: var(--panel)
- Border: 1px solid var(--line)
- Padding: 20px
- Border-radius: 10px

### Form Elements
- Input fields with bg-alt, line border
- Focus state: amber border
- Select, textarea same styling

### Buttons
- Primary: amber background, dark text
- Ghost: transparent, line border
- Hover: brightness increase or border color change
- Disabled: 40% opacity

### Badges
- Small pill-shaped labels
- Color-coded by type (env, status, priority, tier)

### Ticket Card
- Title, metadata (ID, date, env, status)
- Description preview
- Action buttons row

### Tech Card (Leaderboard)
- Rank number, name, stats
- Ladder visualization (3 progress bars)
- Score and tier tag

### Modals
- Overlay with backdrop blur
- Centered card with close action
- Form inputs for data entry

## Technical Approach

### Frontend
- React 18 with Vite
- React Router for navigation
- CSS Modules or styled-components for styling
- Context API for state management

### Backend
- Node.js + Express
- RESTful API design
- JWT for simple session handling

### Database (MySQL)
- `users` - id, name, role, created_at
- `tickets` - id, title, description, environment, priority, status, customer_name, tech_name, created_at, resolved_at
- `ratings` - id, ticket_id, tech_name, rating, comment, created_at
- `hire_requests` - id, tech_name, customer_name, message, contact, status, created_at

### API Endpoints

**Users:**
- `GET /api/users/:name` - Get user by name (create if not exists)
- `GET /api/users` - List all users (for leaderboard)

**Tickets:**
- `GET /api/tickets` - List tickets (filtered by role/query params)
- `POST /api/tickets` - Create ticket
- `PATCH /api/tickets/:id` - Update ticket (claim, resolve)
- `DELETE /api/tickets/:id` - Delete ticket

**Ratings:**
- `POST /api/ratings` - Submit rating
- `GET /api/ratings/tech/:name` - Get tech's ratings

**Hire Requests:**
- `GET /api/hire-requests` - List requests (filtered by user)
- `POST /api/hire-requests` - Create request
- `PATCH /api/hire-requests/:id` - Update status

**Stats:**
- `GET /api/stats/:name` - Get user stats for dashboard
- `GET /api/leaderboard` - Get ranked tech list
