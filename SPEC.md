# Promote — Earn Production Access

## Concept & Vision

Promote is a gamified ticketing platform where developers earn their way to production access by resolving staging and dev environment tickets. It's a meritocratic system that rewards quality work — techs build reputation through ratings, climb the promotion ladder, and unlock paid production opportunities. The experience should feel premium, dark-mode native, and subtly gamified with visual progress indicators.

---

## 🚀 Product Owner & Monetization Vision

Promote generates revenue through a **tiered commission system**:
- **Platform Fee**: 15% commission on all production hire transactions
- **Subscription Tiers**: Optional premium memberships for customers
- **Featured Techs**: Paid promotion for top-rated developers

Techs earn money through:
- **Production Hires**: Direct payment for production support requests
- **Resolved Tickets**: Base pay per resolved staging/dev ticket
- **Bonuses**: Performance bonuses for high ratings

---

## 💰 Payment Gateway Integration

### Payment Flow
1. Customer initiates production hire request
2. Payment hold placed (escrow-style)
3. Work completed and approved
4. Funds released to tech (minus platform fee)
5. Invoice generated for customer

### Payment States
- `pending` - Payment initiated
- `held` - Funds in escrow
- `released` - Paid to tech
- `refunded` - Customer refunded
- `disputed` - Under dispute resolution

### Payout Methods (Tech)
- Bank transfer (ACH)
- PayPal
- Stripe Connect

---

## 📊 CRM Features

### Customer CRM
- **Contact Management**: All customer profiles with interaction history
- **Communication Log**: Notes, emails, meeting records
- **Ticket History**: Complete audit trail
- **Payment History**: All transactions with status
- **Lifetime Value**: Total spent with platform

### Tech CRM
- **Profile Management**: Skills, availability, hourly rate
- **Performance Analytics**: Rating trends, response time
- **Earnings Dashboard**: Real-time income tracking
- **Client Relationships**: Which customers they've worked with

### Interactions
- Notes/tags on profiles
- Follow-up reminders
- Customer satisfaction tracking

---

## 👨‍💼 Admin Panel

### Dashboard
- Platform revenue (daily/weekly/monthly)
- Active users count
- Ticket resolution rate
- Average rating across platform

### User Management
- View all users (customers/techs/admins)
- Suspend/ban users
- Promote tech tiers manually
- Reset passwords

### Financial Management
- All transactions overview
- Commission tracking
- Payout management
- Dispute resolution queue

### Platform Settings
- Commission rates
- Tier thresholds
- Featured tech settings
- Platform announcements

### Audit Logs
- All admin actions logged
- User activity tracking
- Payment audit trail

---

## 💵 Tech Personal Accounting

### Earnings Dashboard
- **Total Earned**: Lifetime earnings
- **Available Balance**: Withdrawable funds
- **Pending Payments**: Awaiting release
- **This Month**: Current month earnings
- **Average per Ticket**: Earnings metric

### Transaction History
- Every payment with status
- Filter by date range
- Export to CSV/PDF

### Payouts
- Request payout
- Payout history
- Connected payment methods
- Minimum payout threshold ($25)

### Tax Documents
- Annual earnings summary
- 1099 generation (US)
- Invoice downloads

---

## 🧾 Customer Billing

### Invoices
- Auto-generated on production hire completion
- Line-item breakdown
- Platform fee visible
- PDF download

### Payment Methods
- Add/remove cards
- Set default payment method
- Billing address

### Billing History
- All charges
- Invoice downloads
- Monthly summary emails

### Budget Tracking
- Monthly spending limit (optional)
- Alerts for threshold
- Category breakdown by tech/issue type

---

## Database Schema Additions

### payments
```sql
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hire_request_id INT,
  customer_name VARCHAR(255) NOT NULL,
  tech_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  tech_payout DECIMAL(10,2) NOT NULL,
  status ENUM('pending','held','released','refunded','disputed') DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  released_at TIMESTAMP NULL
);
```

### tech_earnings
```sql
CREATE TABLE tech_earnings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tech_name VARCHAR(255) NOT NULL,
  payment_id INT,
  source ENUM('hire','ticket','bonus') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','available','withdrawn') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### tech_payouts
```sql
CREATE TABLE tech_payouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tech_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('bank','paypal','stripe') NOT NULL,
  payout_details JSON,
  status ENUM('requested','processing','completed','failed') DEFAULT 'requested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
);
```

### customer_invoices
```sql
CREATE TABLE customer_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  payment_id INT,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('draft','sent','paid','overdue','cancelled') DEFAULT 'draft',
  due_date DATE,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### crm_contacts
```sql
CREATE TABLE crm_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  user_type ENUM('customer','tech') NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### crm_interactions
```sql
CREATE TABLE crm_interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  type ENUM('note','call','email','meeting') NOT NULL,
  subject VARCHAR(255),
  content TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### admin_logs
```sql
CREATE TABLE admin_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_name VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  target_type VARCHAR(50),
  target_id INT,
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints Additions

### Payments
- `POST /api/payments` - Initiate payment
- `GET /api/payments` - List payments (admin)
- `PATCH /api/payments/:id/release` - Release payment to tech
- `PATCH /api/payments/:id/refund` - Process refund

### Earnings
- `GET /api/earnings/:techName` - Get tech earnings summary
- `GET /api/earnings/:techName/transactions` - Transaction history
- `POST /api/payouts` - Request payout
- `GET /api/payouts/:techName` - Payout history

### Invoices
- `GET /api/invoices/:customerName` - Customer invoices
- `GET /api/invoices/:id/download` - Download PDF

### CRM
- `GET /api/crm/contacts` - List contacts
- `POST /api/crm/contacts` - Create contact
- `PATCH /api/crm/contacts/:id` - Update contact
- `GET /api/crm/contacts/:id/interactions` - Contact interactions
- `POST /api/crm/interactions` - Log interaction

### Admin
- `GET /api/admin/dashboard` - Platform stats
- `GET /api/admin/users` - All users
- `PATCH /api/admin/users/:id` - Update user (role, status)
- `GET /api/admin/payments` - All payments
- `GET /api/admin/logs` - Audit logs
- `PATCH /api/admin/settings` - Update platform settings

---

## Component Inventory Additions

### Payment Components
- `PaymentModal` - Initiate/confirm payment
- `PaymentStatusBadge` - Visual payment state
- `EarningsCard` - Stats display card
- `PayoutModal` - Request payout flow
- `PaymentMethodCard` - Saved payment methods

### CRM Components
- `ContactList` - Filterable contact table
- `ContactCard` - Contact detail view
- `InteractionTimeline` - Communication history
- `TagInput` - Tag management
- `NoteEditor` - Rich text notes

### Admin Components
- `AdminSidebar` - Navigation
- `StatsCard` - Metric display
- `DataTable` - Sortable/filterable table
- `UserActionsMenu` - Suspend, promote, etc.
- `AuditLogList` - Activity feed
- `SettingsForm` - Platform configuration

### Accounting Components
- `EarningsChart` - Visual earnings over time
- `TransactionList` - Detailed history
- `InvoiceRow` - Invoice display
- `BalanceDisplay` - Available vs pending
- `PayoutHistory` - Past payouts

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

---

## 🎫 Ticket System Enhancements

### Ticket Categories
Pre-defined categories for better organization:
- Bug Report
- Feature Request  
- Technical Support
- Infrastructure
- Security
- Documentation
- Performance
- Integration
- General Inquiry

### Issue Templates
Pre-built templates that help users write better tickets:
- Bug Report Template - Steps to reproduce, expected vs actual behavior
- Feature Request Template - Problem statement, proposed solution
- Support Request Template - Current situation, troubleshooting steps

### Encrypted Discussions
- Private message threads between customer and assigned tech
- Base64 encoding for message encryption
- Only authorized parties can view messages
- System messages for status changes

### SLA Tracking
Automatic SLA calculation based on priority:
- Critical: 1 hour response
- Urgent: 4 hours response
- High: 8 hours response
- Normal: 24 hours response
- Low: 48 hours response

### Ticket History/Audit Log
- Complete history of all ticket changes
- Actor tracking (who made changes)
- Field-level change tracking
- Metadata for context

### Notifications System
Real-time notifications for:
- New tickets created
- Ticket claimed
- Ticket resolved
- New messages
- Rating received
- Hire requests

### CSAT Surveys
Customer satisfaction tracking:
- 1-5 rating scores
- Would recommend boolean
- Resolved on time feedback
- Communication rating
- Response time rating

---

## Database Schema Additions

### ticket_categories
```sql
CREATE TABLE ticket_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'folder',
  color VARCHAR(20) DEFAULT '#FFB454',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);
```

### issue_templates
```sql
CREATE TABLE issue_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  template_content TEXT NOT NULL,
  variables JSON,
  use_count INT DEFAULT 0
);
```

### ticket_messages (Encrypted Discussions)
```sql
CREATE TABLE ticket_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_role ENUM('customer','tech','admin') NOT NULL,
  content TEXT NOT NULL,
  message_type ENUM('text','file','system','status_change'),
  encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ticket_history
```sql
CREATE TABLE ticket_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  actor_role ENUM('customer','tech','admin') NOT NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  metadata JSON
);
```

### notifications
```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  related_ticket_id INT,
  related_user VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE
);
```

### csat_surveys
```sql
CREATE TABLE csat_surveys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  tech_name VARCHAR(255),
  score INT CHECK (score >= 1 AND score <= 5),
  feedback TEXT,
  would_recommend BOOLEAN,
  resolved_on_time BOOLEAN,
  communication_rating INT,
  response_time_rating INT
);
```

---

## API Endpoints Additions

### Discussions
- `GET /api/discussions/:ticketId` - Get messages (authorized users only)
- `POST /api/discussions` - Send message
- `POST /api/discussions/system` - Add system message

### Categories & Templates
- `GET /api/categories` - List all categories
- `GET /api/categories/templates` - List templates (optional: by category)
- `GET /api/categories/templates/:id` - Get template
- `POST /api/categories/templates/:id/use` - Use template (increment count)

### Notifications
- `GET /api/notifications/:userName` - Get user notifications
- `GET /api/notifications/:userName/count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/:userName/read-all` - Mark all as read

### Ticket History
- `GET /api/ticket-history/:ticketId` - Get ticket history
- `GET /api/ticket-history/user/:userName` - Get user activity

### CSAT Surveys
- `GET /api/surveys/ticket/:ticketId` - Get survey for ticket
- `POST /api/surveys` - Submit survey
- `GET /api/surveys/tech/:techName` - Get tech surveys
- `GET /api/surveys/tech/:techName/stats` - Get CSAT stats
