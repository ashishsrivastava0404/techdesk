# Promote — Database Schema

## Overview

The Promote database uses MariaDB with an Entity-Relationship model designed for a ticketing platform with payment processing, CRM, and admin features.

## Database Initialization

```javascript
// backend/src/db/index.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'promote',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initDatabase() {
  // Creates database and all tables
}

export default pool;
```

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │   tickets   │       │ticket_messages│
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ name        │◄──────│customer_name│       │ ticket_id(FK)│
│ role        │       │ tech_name   │──────►│ sender_name  │
│ email       │       │ base_pay    │       │ content      │
│ hourly_rate │       │ priority    │       │ encrypted    │
│ bio         │       │ status      │       └─────────────┘
│ payout_*    │       │ category    │
└─────────────┘       │ sla_due_at  │       ┌─────────────┐
       │              └─────────────┘       │ticket_history│
       │                     │              ├─────────────┤
       │                     │              │ id (PK)     │
       ▼                     ▼              │ ticket_id(FK)│
┌─────────────┐       ┌─────────────┐      │ action      │
│crm_contacts │       │   ratings   │       │ actor_name  │
├─────────────┤       ├─────────────┤       └─────────────┘
│ id (PK)     │       │ id (PK)     │
│ user_name   │       │ ticket_id   │──────►┌─────────────┐
│ user_type   │       │ tech_name   │       │tech_earnings│
│ company     │       │ rating      │       ├─────────────┤
│ email       │       │ comment     │       │ id (PK)     │
│ tags        │       └─────────────┘       │ tech_name   │
└─────────────┘                              │ payment_id  │
       │                                     │ source      │
       ▼                                     │ amount      │
┌─────────────┐       ┌─────────────┐       └─────────────┘
│crm_interact │       │  payments   │
├─────────────┤       ├─────────────┤       ┌─────────────┐
│ id (PK)     │       │ id (PK)     │       │tech_payouts │
│ contact_id  │       │ customer    │       ├─────────────┤
│ type        │       │ tech_name   │       │ id (PK)     │
│ subject     │       │ amount      │       │ tech_name   │
│ content     │       │ platform_fee│       │ amount      │
│ created_by  │       │ status      │       │ method      │
└─────────────┘       │ transaction │       │ status      │
                      └─────────────┘       └─────────────┘
```

## Tables

### users
Stores all platform users (customers and techs).

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('customer', 'tech', 'admin') DEFAULT 'customer',
  status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
  email VARCHAR(255),
  google_id VARCHAR(255),
  avatar_url VARCHAR(500),
  skills TEXT,
  hourly_rate DECIMAL(10,2) DEFAULT 50.00,
  bio TEXT,
  payout_method ENUM('bank', 'paypal', 'stripe') DEFAULT 'stripe',
  payout_details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Indexes:**
- `name` (UNIQUE)
- `role`
- `status`
- `google_id`

**New Fields (v2):**
- `google_id` - Google OAuth user ID

---

### tickets
Core ticket table with all ticket-related data.

```sql
CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  subject VARCHAR(255) DEFAULT NULL,
  short_description TEXT DEFAULT NULL,
  long_description TEXT DEFAULT NULL,
  environment ENUM('dev', 'staging') DEFAULT 'dev',
  priority ENUM('low', 'normal', 'high', 'urgent', 'critical') DEFAULT 'normal',
  status ENUM('open', 'claimed', 'in_progress', 'resolved', 'closed', 'rejected', 'pending_assignment') DEFAULT 'open',
  customer_name VARCHAR(255) NOT NULL,
  tech_name VARCHAR(255) DEFAULT NULL,
  base_pay DECIMAL(10,2) DEFAULT 25.00,
  category VARCHAR(100) DEFAULT 'general',
  subcategory VARCHAR(100) DEFAULT NULL,
  tags JSON,
  estimated_hours DECIMAL(5,2) DEFAULT NULL,
  actual_hours DECIMAL(5,2) DEFAULT NULL,
  time_remaining_hours DECIMAL(5,2) DEFAULT NULL,
  first_response_at TIMESTAMP NULL DEFAULT NULL,
  sla_due_at TIMESTAMP NULL DEFAULT NULL,
  sla_status ENUM('on_track', 'at_risk', 'breached', 'met') DEFAULT 'on_track',
  satisfaction_score INT DEFAULT NULL,
  satisfaction_comment TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL DEFAULT NULL
);
```

**Indexes:**
- `customer_name`
- `tech_name`
- `status`
- `priority`
- `category`
- `created_at`

**Foreign Keys:**
- `customer_name` → `users(name)`
- `tech_name` → `users(name)`

**New Fields (v2):**
- `subject` - Topic/subject line for the ticket
- `short_description` - Brief summary (max 200 words)
- `long_description` - Detailed description (max 1000 words)
- `subcategory` - Hierarchical sub-category
- `pending_assignment` - Status for tickets awaiting agent approval

---

### ratings
Tech rating after ticket resolution.

```sql
CREATE TABLE ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  tech_name VARCHAR(255) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `ticket_id` (UNIQUE)
- `tech_name`

**Foreign Keys:**
- `ticket_id` → `tickets(id)`

---

### hire_requests
Direct hire requests from customers to techs.

```sql
CREATE TABLE hire_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tech_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  contact VARCHAR(255) NOT NULL,
  proposed_amount DECIMAL(10,2) DEFAULT 0,
  status ENUM('sent', 'accepted', 'declined', 'in_progress', 'completed', 'disputed') DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL
);
```

**Indexes:**
- `tech_name`
- `customer_name`
- `status`

---

### ticket_messages
Encrypted discussion messages for tickets.

```sql
CREATE TABLE ticket_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_role ENUM('customer', 'tech', 'admin') NOT NULL,
  content TEXT NOT NULL,
  message_type ENUM('text', 'file', 'system', 'status_change') DEFAULT 'text',
  encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `ticket_id`
- `created_at`

**Foreign Keys:**
- `ticket_id` → `tickets(id)` (ON DELETE CASCADE)

---

### ticket_history
Audit log for all ticket changes.

```sql
CREATE TABLE ticket_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  actor_role ENUM('customer', 'tech', 'admin') NOT NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `ticket_id`
- `actor_name`
- `created_at`

**Foreign Keys:**
- `ticket_id` → `tickets(id)` (ON DELETE CASCADE)

---

### payments
Escrow payments for tickets and hires.

```sql
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hire_request_id INT DEFAULT NULL,
  ticket_id INT DEFAULT NULL,
  customer_name VARCHAR(255) NOT NULL,
  tech_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  tech_payout DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'held', 'released', 'refunded', 'disputed', 'failed') DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  released_at TIMESTAMP NULL DEFAULT NULL
);
```

**Indexes:**
- `customer_name`
- `tech_name`
- `status`
- `transaction_id` (UNIQUE)
- `stripe_payment_intent_id`

**Foreign Keys:**
- `hire_request_id` → `hire_requests(id)`
- `ticket_id` → `tickets(id)`

**New Fields (v2):**
- `stripe_payment_intent_id` - Stripe PaymentIntent ID
- `stripe_customer_id` - Stripe Customer ID
- `failed` status - Payment failed

---

### tech_earnings
Tech earnings ledger.

```sql
CREATE TABLE tech_earnings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tech_name VARCHAR(255) NOT NULL,
  payment_id INT DEFAULT NULL,
  source ENUM('hire', 'ticket', 'bonus', 'payout') NOT NULL,
  description VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'available', 'withdrawn') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `tech_name`
- `status`
- `created_at`

**Foreign Keys:**
- `payment_id` → `payments(id)`

---

### tech_payouts
Tech payout requests.

```sql
CREATE TABLE tech_payouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tech_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('bank', 'paypal', 'stripe') NOT NULL,
  payout_details JSON,
  status ENUM('requested', 'processing', 'completed', 'failed') DEFAULT 'requested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL
);
```

**Indexes:**
- `tech_name`
- `status`
- `created_at`

---

### ticket_categories
Ticket categorization.

```sql
CREATE TABLE ticket_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'folder',
  color VARCHAR(20) DEFAULT '#FFB454',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Default Categories:**
1. Bug Report (#ef4444)
2. Feature Request (#22c55e)
3. Technical Support (#3b82f6)
4. Infrastructure (#8b5cf6)
5. Security (#f59e0b)
6. Documentation (#06b6d4)
7. Performance (#ec4899)
8. Integration (#14b8a6)
9. General Inquiry (#FFB454)

---

### issue_templates
Pre-built ticket templates.

```sql
CREATE TABLE issue_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  template_content TEXT NOT NULL,
  variables JSON,
  is_active BOOLEAN DEFAULT TRUE,
  use_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### notifications
User notifications.

```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  related_ticket_id INT,
  related_user VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `user_name`
- `is_read`
- `created_at`

---

### csat_surveys
Customer satisfaction surveys.

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
  communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
  response_time_rating INT CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
  completed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `ticket_id` (UNIQUE)
- `tech_name`
- `created_at`

**Foreign Keys:**
- `ticket_id` → `tickets(id)`

---

### crm_contacts
CRM contact profiles.

```sql
CREATE TABLE crm_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  user_type ENUM('customer', 'tech') NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tags JSON,
  notes TEXT,
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Indexes:**
- `user_name` (UNIQUE)
- `user_type`
- `company`

---

### crm_interactions
CRM interaction history.

```sql
CREATE TABLE crm_interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id INT NOT NULL,
  type ENUM('note', 'call', 'email', 'meeting') NOT NULL,
  subject VARCHAR(255),
  content TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `contact_id`
- `created_at`

**Foreign Keys:**
- `contact_id` → `crm_contacts(id)` (ON DELETE CASCADE)

---

### admin_logs
Admin action audit log.

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

**Indexes:**
- `admin_name`
- `created_at`

---

### platform_settings
Platform configuration.

```sql
CREATE TABLE platform_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE NOT NULL,
  value JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Default Settings:**
| Key | Value |
|-----|-------|
| commission_rate | 0.15 |
| minimum_payout | 25.00 |
| dev_ticket_pay | 25.00 |
| staging_ticket_pay | 50.00 |
| dev_threshold | 33 |
| staging_threshold | 66 |

---



### ticket_attachments
File attachments for tickets.

```sql
CREATE TABLE ticket_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  uploader_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INT,
  file_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);
```

**Indexes:**
- `ticket_id`
- `created_at`

**Foreign Keys:**
- `ticket_id` → `tickets(id)` (ON DELETE CASCADE)

---

### help_articles
Knowledge base articles for the help center.

```sql
CREATE TABLE help_articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags JSON,
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  author VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Indexes:**
- `slug` (UNIQUE)
- `category`
- `is_published`

---

### credit_transactions (v2)
Credit system transaction ledger.

```sql
CREATE TABLE credit_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  type ENUM('credit', 'debit', 'transfer_in', 'transfer_out', 'refund') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255),
  related_user VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_name (user_name),
  INDEX idx_created_at (created_at)
);
```

**Indexes:**
- `user_name`
- `created_at`

**Transaction Types:**
- `credit` - Credits added (purchases, admin additions)
- `debit` - Credits deducted (ticket payments)
- `transfer_in` - Credits received from another user
- `transfer_out` - Credits sent to another user
- `refund` - Credits refunded

---

### agent_expertise (v2)
Maps agents to their expertise categories for intelligent routing.

```sql
CREATE TABLE agent_expertise (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tech_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100) DEFAULT NULL,
  expertise_level ENUM('beginner', 'intermediate', 'expert') DEFAULT 'intermediate',
  success_rate DECIMAL(5,2) DEFAULT 0,
  total_tickets INT DEFAULT 0,
  successful_tickets INT DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_expertise (tech_name, category, subcategory)
);
```

**Indexes:**
- `tech_name`
- `category`
- `success_rate` (for routing queries)

**Scoring Factors:**
- Expertise level (0-40 points)
- Success rate (0-40 points)
- Average rating (0-40 points)
- Current workload (0-20 points)

---

### agent_requests (v2)
Agent-to-customer request workflow.

```sql
CREATE TABLE agent_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  tech_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  message TEXT,
  proposed_rate DECIMAL(10,2) DEFAULT NULL,
  estimated_days INT DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
  response_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);
```

**Indexes:**
- `ticket_id`
- `tech_name`
- `customer_name`
- `status`
- `created_at`

**Foreign Keys:**
- `ticket_id` → `tickets(id)` (ON DELETE CASCADE)

---

### category_hierarchies (v2)
Nested category/sub-category structure.

```sql
CREATE TABLE category_hierarchies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INT DEFAULT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'folder',
  color VARCHAR(20) DEFAULT '#FFB454',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES category_hierarchies(id) ON DELETE SET NULL
);
```

**Indexes:**
- `parent_id` (self-referencing FK)

**Example Hierarchy:**
```
- Technology
  - Software
    - Bug Reports
    - Feature Requests
  - Hardware
- Billing
  - Payments
  - Subscriptions
```

---

### topic_suggestions (v2)
Topic auto-suggest based on historical success rates.

```sql
CREATE TABLE topic_suggestions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tag VARCHAR(100) NOT NULL,
  usage_count INT DEFAULT 1,
  success_rate DECIMAL(5,2) DEFAULT 0,
  avg_resolution_hours DECIMAL(10,2) DEFAULT 0,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_tag (tag)
);
```

**Indexes:**
- `tag` (UNIQUE)
- `success_rate` (for suggestion queries)

---

## Migration Guide

### Adding a New Table

1. Add table definition to `initDatabase()`
2. Include in the main SQL file
3. Update this documentation
4. Write migration script if needed

### Modifying Existing Tables

1. Create migration script
2. Test migration on development database
3. Backup production database
4. Run migration
5. Verify data integrity

### Resetting Database

```bash
# Drop all tables
mysql -u root promote -e "SHOW TABLES" | tail -n +2 | while read table; do
  mysql -u root promote -e "DROP TABLE IF EXISTS $table";
done

# Restart backend to reinitialize
pm2 restart backend
```

---

## Performance Considerations

### Indexing Strategy
- Primary keys on all tables
- Foreign key columns indexed
- Frequently queried columns indexed
- Composite indexes for common queries

### Query Optimization
- Use parameterized queries
- Limit result sets
- Paginate large queries
- Avoid SELECT *

### Connection Management
- Connection pooling enabled
- Pool size: 10 connections
- Queue limit: unlimited

---

## Database Summary

### Core Tables (8)
| Table | Purpose | Primary Key |
|-------|---------|-------------|
| `users` | Platform users | id |
| `tickets` | Support tickets | id |
| `ratings` | Tech ratings | id |
| `hire_requests` | Direct hire requests | id |
| `payments` | Payment transactions | id |
| `tech_earnings` | Tech earnings ledger | id |
| `tech_payouts` | Payout requests | id |
| `customer_invoices` | Customer invoices | id |

### Communication Tables (3)
| Table | Purpose | Primary Key |
|-------|---------|-------------|
| `ticket_messages` | Encrypted ticket discussions | id |
| `ticket_history` | Ticket audit log | id |
| `ticket_attachments` | File attachments | id |

### CRM Tables (2)
| Table | Purpose | Primary Key |
|-------|---------|-------------|
| `crm_contacts` | Contact profiles | id |
| `crm_interactions` | Interaction history | id |

### Admin Tables (2)
| Table | Purpose | Primary Key |
|-------|---------|-------------|
| `admin_logs` | Admin audit log | id |
| `platform_settings` | Configuration storage | id |

### V2 Enhancement Tables (5)
| Table | Purpose | Primary Key |
|-------|---------|-------------|
| `credit_transactions` | Credit ledger | id |
| `agent_expertise` | Agent skills mapping | id |
| `agent_requests` | Agent-customer workflow | id |
| `category_hierarchies` | Nested categories | id |
| `topic_suggestions` | Auto-suggest topics | id |

### Support Tables (2)
| Table | Purpose | Primary Key |
|-------|---------|-------------|
| `ticket_categories` | Ticket categories | id |
| `help_articles` | Knowledge base | id |

### Feedback Tables (2)
| Table | Purpose | Primary Key |
|-------|---------|-------------|
| `notifications` | User notifications | id |
| `csat_surveys` | Customer satisfaction | id |

---

## Database Statistics

### Total Tables: 24

### Storage Requirements
| Component | Estimated Size |
|-----------|----------------|
| User data | ~500 bytes/row |
| Ticket data | ~2 KB/row |
| Messages | ~500 bytes/row |
| Transactions | ~1 KB/row |

### Index Recommendations
- `tickets.customer_name` - For customer ticket queries
- `tickets.tech_name` - For tech ticket queries
- `tickets.status` - For filtering active tickets
- `tickets.priority` - For routing decisions
- `ratings.tech_name` - For leaderboard calculations
- `payments.status` - For financial reporting
