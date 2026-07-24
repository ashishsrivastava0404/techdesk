# Messaging Integration Guide

## Overview

This document describes how the messaging system integrates with all user operations in the TechDesk platform.

---

## Messaging Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGING SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              EVENT NOTIFICATION SERVICE                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐  │   │
│  │  │ In-App   │  │  Email   │  │   SMS    │  │ Push │  │   │
│  │  │ Notifs   │  │Notifs    │  │Notifs    │  │      │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                 │
│                    ┌─────────┴─────────┐                      │
│                    │  USER OPERATIONS   │                      │
│                    │                    │                      │
│  ┌──────────┐  ┌──┴────┐  ┌────────┴──┐  ┌──────────┐     │
│  │  Tickets  │  │  CRM   │  │ Payments  │  │ Comments │     │
│  └──────────┘  └────────┘  └───────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Event Types

### Ticket Events
| Event | Trigger | Recipients |
|-------|---------|------------|
| `ticket_created` | New ticket submitted | Customer (confirm), Admins, Techs (new ticket alert) |
| `ticket_claimed` | Tech claims ticket | Customer (who claimed), Tech (confirmation) |
| `ticket_assigned` | Admin assigns tech | Tech (assignment), Customer (who will help) |
| `ticket_updated` | Any ticket field changed | Relevant parties |
| `ticket_resolved` | Tech marks resolved | Customer (rate us), Admins |
| `ticket_closed` | Customer closes ticket | Tech, Admins |
| `ticket_reopened` | Customer reopens ticket | Tech, Admins |
| `priority_changed` | Priority level changed | Customer, Assigned Tech |
| `status_changed` | Status transitions | All parties |
| `escalation` | Ticket escalated | Escalated Tech, Admins |

### Comment Events
| Event | Trigger | Recipients |
|-------|---------|------------|
| `comment_added` | New comment/reply | Other party in conversation |
| `comment_updated` | Comment edited | Other party |
| `comment_deleted` | Comment removed | Other party (if needed) |

### Payment Events
| Event | Trigger | Recipients |
|-------|---------|------------|
| `payment_received` | Customer pays | Tech (earnings), Admins |
| `payout_requested` | Tech requests payout | Admins |
| `payout_approved` | Admin approves payout | Tech |
| `payout_rejected` | Admin rejects payout | Tech |
| `payout_completed` | Payment processed | Tech |

### CRM Events
| Event | Trigger | Recipients |
|-------|---------|------------|
| `new_lead` | Lead created | Assigned Agent |
| `lead_assigned` | Lead reassigned | New Agent |
| `lead_updated` | Lead status/details changed | Tracking Users |
| `lead_converted` | Lead becomes customer | Admins |

### Rating Events
| Event | Trigger | Recipients |
|-------|---------|------------|
| `rating_received` | Customer rates service | Tech |
| `rating_updated` | Rating changed | Tech |

---

## Integration Points

### 1. Ticket Creation

```javascript
// backend/src/routes/tickets.js - POST /

const { eventNotificationService, EVENT_TYPES } = require('../services/eventNotificationService');

router.post('/', async (req, res) => {
  // ... ticket creation logic ...
  
  // After ticket is created
  const ticket = result;
  
  // 1. Notify customer (confirmation)
  await eventNotificationService.notify(EVENT_TYPES.TICKET_CREATED, customer.id, {
    userName: customer.name,
    title: ticket.title,
    ticketId: ticket.id,
    priority: ticket.priority,
    customerName: customer.name
  });
  
  // 2. Notify admins
  await eventNotificationService.notifyAdmins(EVENT_TYPES.TICKET_CREATED, {
    title: ticket.title,
    ticketId: ticket.id,
    priority: ticket.priority,
    customerName: customer.name
  });
  
  // 3. Notify qualified techs
  await eventNotificationService.notifyTechsNewTicket(ticket, ticket.category);
  
  res.status(201).json(ticket);
});
```

### 2. Ticket Claim

```javascript
// backend/src/routes/tickets.js - PATCH /:id

router.patch('/:id', async (req, res) => {
  // ... update logic ...
  
  if (tech_name && !ticket.tech_name) {
    // Tech just claimed the ticket
    
    // 1. Notify customer
    await eventNotificationService.notify(EVENT_TYPES.TICKET_CLAIMED, ticket.customer_id, {
      userName: ticket.customer_name,
      title: ticket.title,
      ticketId: ticket.id,
      techName: tech_name
    });
    
    // 2. Notify tech (confirmation)
    await eventNotificationService.notify(EVENT_TYPES.TICKET_CLAIMED, tech.id, {
      userName: tech.name,
      title: ticket.title,
      ticketId: ticket.id
    });
    
    // 3. Create system message in conversation
    await eventNotificationService.createTicketEventMessage(ticket.id, EVENT_TYPES.TICKET_CLAIMED, {
      techName: tech_name
    });
  }
  
  res.json(updatedTicket);
});
```

### 3. Ticket Resolution

```javascript
router.patch('/:id', async (req, res) => {
  // ... logic ...
  
  if (status === 'resolved') {
    // 1. Notify customer
    await eventNotificationService.notify(EVENT_TYPES.TICKET_RESOLVED, ticket.customer_id, {
      userName: ticket.customer_name,
      ticketId: ticket.id,
      title: ticket.title,
      resolution: req.body.resolution || 'Issue has been resolved'
    });
    
    // 2. Create system message
    await eventNotificationService.createTicketEventMessage(ticket.id, EVENT_TYPES.TICKET_RESOLVED, {
      resolution: req.body.resolution
    });
  }
});
```

### 4. Payment Received

```javascript
// backend/src/services/paymentGateways.js or payments.js

const { eventNotificationService, EVENT_TYPES } = require('../services/eventNotificationService');

async function processPayment(ticketId, amount, techId) {
  // ... payment logic ...
  
  // Notify tech
  await eventNotificationService.notify(EVENT_TYPES.PAYMENT_RECEIVED, techId, {
    ticketId: ticketId,
    amount: amount
  });
  
  // Notify admin
  await eventNotificationService.notifyAdmins(EVENT_TYPES.PAYMENT_RECEIVED, {
    ticketId: ticketId,
    amount: amount,
    techId: techId
  });
}
```

### 5. Comment/Message Added

```javascript
// backend/src/routes/ticketComments.js

const { eventNotificationService, EVENT_TYPES } = require('../services/eventNotificationService');

router.post('/', async (req, res) => {
  const { ticket_id, content, author_id } = req.body;
  
  // ... create comment ...
  
  // Get ticket to find recipient
  const [ticket] = await db.query('SELECT * FROM tickets WHERE id = ?', [ticket_id]);
  
  // Determine recipient (tech if customer posted, customer if tech posted)
  const recipientId = ticket.customer_id === author_id 
    ? ticket.tech_id 
    : ticket.customer_id;
  
  if (recipientId) {
    const [author] = await db.query('SELECT name FROM users WHERE id = ?', [author_id]);
    
    await eventNotificationService.notify(EVENT_TYPES.COMMENT_ADDED, recipientId, {
      ticketId: ticket_id,
      authorName: author.name,
      message: content.substring(0, 100) + '...'
    });
  }
});
```

### 6. Rating Received

```javascript
// backend/src/routes/ratings.js

const { eventNotificationService, EVENT_TYPES } = require('../services/eventNotificationService');

router.post('/', async (req, res) => {
  const { ticket_id, rating, tech_id } = req.body;
  
  // ... save rating ...
  
  // Notify tech
  await eventNotificationService.notify(EVENT_TYPES.RATING_RECEIVED, tech_id, {
    ticketId: ticket_id,
    rating: rating
  });
});
```

---

## Channel Configuration

### In-App Notifications
- Stored in `notifications` table
- Displayed in notification bell icon
- Read/unread tracking
- Click to navigate to relevant item

### Email Notifications
- Uses SendGrid API
- HTML templates with i18n
- Configurable via `notification_preferences`

### SMS Notifications
- Uses Twilio API
- Short messages for critical events
- User opt-in required

### Push Notifications
- WebPush for web
- FCM for mobile (future)
- Requires user permission

---

## User Preferences

Users can configure notification preferences:

```sql
CREATE TABLE notification_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  email_frequency ENUM('instant', 'daily', 'weekly') DEFAULT 'instant',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Quiet Hours
Users can set quiet hours during which non-critical notifications are suppressed.

### Per-Event Preferences (Future)
```javascript
notification_preferences: {
  user_id: 1,
  events: {
    ticket_created: { email: true, sms: false, push: true },
    payment_received: { email: true, sms: true, push: true },
    newsletter: { email: true, sms: false, push: false }
  }
}
```

---

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  user_name VARCHAR(255),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  related_ticket_id INT,
  related_user VARCHAR(255),
  related_payout_id INT,
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Conversations Table
```sql
CREATE TABLE conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  customer_id INT NOT NULL,
  tech_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (tech_id) REFERENCES users(id)
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  message_type ENUM('text', 'attachment', 'system') DEFAULT 'text',
  content TEXT NOT NULL,
  attachment_url VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);
```

---

## API Endpoints

### Get Notifications
```
GET /api/notifications
Query params: ?page=1&limit=20&unread_only=true
Response: { notifications: [...], total: 100, unread: 10 }
```

### Mark as Read
```
POST /api/notifications/:id/read
Response: { success: true }
```

### Mark All as Read
```
POST /api/notifications/read-all
Response: { success: true, updated: 10 }
```

### Get Conversations
```
GET /api/messages/conversations
Response: { conversations: [...] }
```

### Get Messages
```
GET /api/messages/:conversationId
Query params: ?limit=50&offset=0
Response: { messages: [...] }
```

### Send Message
```
POST /api/messages/:conversationId
Body: { content: "Hello", messageType: "text" }
Response: { message: {...} }
```

### Get Notification Preferences
```
GET /api/notifications/preferences
Response: { preferences: {...} }
```

### Update Notification Preferences
```
PUT /api/notifications/preferences
Body: { email_enabled: false, sms_enabled: true, ... }
Response: { success: true }
```

---

## Testing

### Unit Tests
```bash
npm test -- eventNotificationService.test.js
```

### Integration Tests
Test the full flow from event trigger to notification delivery.

### Load Testing
Ensure notification service handles high volume during peak times.

---

## Troubleshooting

### Notifications Not Being Sent
1. Check user has valid email/phone
2. Check user preferences allow notification type
3. Check SendGrid/Twilio credentials
4. Check for quiet hours blocking

### Messages Not Appearing
1. Check conversation exists for ticket
2. Check user is participant in conversation
3. Check message was saved to database

### Email Delivery Issues
1. Verify SendGrid API key
2. Check email templates exist
3. Check spam filters
