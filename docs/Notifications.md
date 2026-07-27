# Notification System Documentation

## Overview

This document describes the comprehensive notification system implemented across the TechDesk application, covering event types, channels, delivery mechanisms, and user preferences.

## Table of Contents

1. [Event Types](#event-types)
2. [Notification Channels](#notification-channels)
3. [Priority Levels](#priority-levels)
4. [Message Templates](#message-templates)
5. [User Preferences](#user-preferences)
6. [Quiet Hours](#quiet-hours)
7. [Delivery Status](#delivery-status)
8. [API Endpoints](#api-endpoints)
9. [Testing](#testing)

---

## Event Types

### Ticket Events

| Event | Code | Description |
|-------|------|-------------|
| Ticket Created | ticket_created | New ticket submitted |
| Ticket Claimed | ticket_claimed | Tech claimed ticket |
| Ticket Resolved | ticket_resolved | Ticket marked as resolved |
| Ticket Closed | ticket_closed | Ticket closed |
| Ticket Reopened | ticket_reopened | Ticket reopened |

### Payment Events

| Event | Code | Description |
|-------|------|-------------|
| Payment Received | payment_received | Payment successful |
| Payout Requested | payout_requested | Payout request submitted |
| Payout Approved | payout_approved | Payout approved |
| Payout Rejected | payout_rejected | Payout rejected |
| Credits Added | credits_added | Credits added to account |

### Communication Events

| Event | Code | Description |
|-------|------|-------------|
| Comment Added | comment_added | New comment on ticket |
| Internal Note | internal_note | Internal note added |
| Message Received | new_message | Direct message received |

### Marketing Events

| Event | Code | Description |
|-------|------|-------------|
| New Lead | new_lead | New tech lead assigned |
| Rating Received | rating_received | Customer rated service |
| Reminder | reminder | Scheduled reminder |

---

## Notification Channels

### Available Channels

| Channel | Description | Availability |
|---------|-------------|--------------|
| in_app | In-application notification center | Always |
| email | Email notification | Configurable |
| push | Push notification | Configurable |
| sms | SMS text message | Configurable |

### Channel Configuration

```javascript
// Default channel configuration
const DEFAULT_CHANNELS = {
  in_app: true,   // Always enabled
  email: true,    // Default enabled
  push: false,    // Default disabled
  sms: false      // Default disabled
};
```

---

## Priority Levels

| Priority | Level | Description |
|----------|-------|-------------|
| low | 1 | Non-urgent, can wait |
| normal | 2 | Standard priority |
| high | 3 | Important, expedited |
| urgent | 4 | Requires immediate attention |
| critical | 5 | Emergency, system-wide |

### Priority Mapping

Events can have multiple priority levels depending on context:

```javascript
const EVENT_PRIORITIES = {
  ticket_created: 'normal',
  ticket_claimed: 'high',
  ticket_resolved: 'normal',
  payment_received: 'high',
  payout_approved: 'normal',
  new_lead: 'high',
  rating_received: 'low',
  reminder: 'low'
};
```

---

## Message Templates

### System Messages

```javascript
const SYSTEM_MESSAGES = {
  ticket_created: {
    short: 'New ticket #{ticket_id} created',
    full: 'Your support ticket #{ticket_id} has been created successfully.'
  },
  ticket_claimed: {
    short: 'Ticket #{ticket_id} claimed by {tech_name}',
    full: '{tech_name} has claimed your ticket #{ticket_id}.'
  },
  ticket_resolved: {
    short: 'Ticket #{ticket_id} resolved',
    full: 'Your ticket #{ticket_id} has been marked as resolved.'
  },
  payment_received: {
    short: 'Payment of {amount} received',
    full: 'We have received your payment of {amount}.'
  }
};
```

### Email Templates

```javascript
const EMAIL_TEMPLATES = {
  ticket_created: {
    subject: {
      en: 'New Ticket #{ticket_id} Created',
      es: 'Ticket #{ticket_id} Creado'
    },
    body: {
      en: `
        <h1>Hello {customer_name},</h1>
        <p>Your support ticket has been successfully created.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          <p><strong>Ticket #{ticket_id}</strong></p>
          <p><strong>Subject:</strong> {ticket_subject}</p>
          <p><strong>Priority:</strong> {ticket_priority}</p>
        </div>
      `
    }
  },
  ticket_resolved: {
    subject: {
      en: 'Ticket #{ticket_id} Resolved',
      es: 'Ticket #{ticket_id} Resuelto'
    },
    body: {
      en: `
        <h1>Hello {customer_name},</h1>
        <p>Your support ticket has been resolved.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          <p><strong>Resolution:</strong> {resolution}</p>
        </div>
      `
    }
  }
};
```

### SMS Templates

```javascript
const SMS_TEMPLATES = {
  ticket_created: 'New ticket #{ticket_id}: {subject}',
  ticket_claimed: 'Ticket #{ticket_id} claimed by {tech_name}',
  ticket_resolved: 'Ticket #{ticket_id} has been resolved',
  payment_received: 'Payment of {amount} received',
  payout_approved: 'Payout of {amount} approved',
  reminder: 'Reminder: {message}'
};
```

---

## User Preferences

### Preference Structure

```javascript
const DEFAULT_PREFERENCES = {
  channels: {
    email: true,
    push: false,
    sms: false
  },
  frequency: 'immediate', // immediate, daily, weekly
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: 'UTC'
  },
  events: {
    ticket_created: true,
    ticket_claimed: true,
    ticket_resolved: true,
    payment_received: true,
    new_message: true
  },
  marketing: {
    promotional: false,
    newsletter: false
  }
};
```

### Frequency Options

| Option | Description |
|--------|-------------|
| immediate | Send immediately |
| daily | Daily digest |
| weekly | Weekly summary |

---

## Quiet Hours

### Configuration

```javascript
// User quiet hours preference
const quietHours = {
  enabled: true,
  start: '22:00',  // 10 PM
  end: '08:00',    // 8 AM
  timezone: 'America/New_York'
};
```

### Validation Logic

```javascript
function isInQuietHours(preferences, currentTime) {
  if (!preferences.quietHours?.enabled) {
    return false;
  }
  
  const { start, end, timezone } = preferences.quietHours;
  const now = moment.tz(currentTime, timezone);
  const startTime = moment.tz(`${now.format('YYYY-MM-DD')} ${start}`, timezone);
  const endTime = moment.tz(`${now.format('YYYY-MM-DD')} ${end}`, timezone);
  
  // Handle overnight quiet hours (e.g., 10 PM to 8 AM)
  if (startTime.isAfter(endTime)) {
    return now.isAfter(startTime) || now.isBefore(endTime);
  }
  
  return now.isBetween(startTime, endTime);
}
```

---

## Delivery Status

### Status Types

| Status | Description |
|--------|-------------|
| pending | Queued for delivery |
| sent | Sent to channel |
| delivered | Confirmed delivery |
| read | Read by user |
| failed | Delivery failed |

### Tracking

```javascript
const DELIVERY_STATUS = {
  pending: 'pending',
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed'
};
```

### Read Receipts

```javascript
// Mark notification as read
async function markAsRead(notificationId, userId) {
  await db.query(
    'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_name = ?',
    [notificationId, userId]
  );
}

// Get unread count
async function getUnreadCount(userId) {
  const [result] = await db.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_name = ? AND is_read = FALSE',
    [userId]
  );
  return result.count;
}
```

---

## API Endpoints

### GET /api/notifications

Get user's notifications.

**Query Parameters:**
- `limit` (optional) - Max results, default 50
- `offset` (optional) - Offset for pagination
- `unread_only` (optional) - Filter unread only

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "ticket_created",
      "title": "New Ticket",
      "message": "Your ticket #123 has been created",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "unread_count": 5,
  "total": 50
}
```

### GET /api/notifications/unread-count

Get unread notification count.

**Response:**
```json
{
  "success": true,
  "count": 5
}
```

### PUT /api/notifications/:id/read

Mark notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### PUT /api/notifications/read-all

Mark all notifications as read.

**Response:**
```json
{
  "success": true,
  "marked_count": 5
}
```

### DELETE /api/notifications/:id

Delete a notification.

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

### POST /api/notifications (Internal)

Create notification (internal use only).

**Request Body:**
```json
{
  "user_name": "user@example.com",
  "type": "ticket_created",
  "title": "New Ticket",
  "message": "Your ticket has been created",
  "related_ticket_id": 123,
  "related_user": "tech@example.com"
}
```

---

## Testing

### Run Notification Tests

```bash
cd backend
npm test -- eventNotification.test.js
```

### Test Coverage

| Category | Tests |
|----------|-------|
| Event Types | 6 |
| User Preferences | 5 |
| System Messages | 14 |
| SMS Messages | 7 |
| Email Content | 4 |
| Notification Channels | 5 |
| Quiet Hours | 4 |
| Bulk Notifications | 3 |
| Delivery Status | 4 |
| Read Receipts | 3 |
| Conversation Tracking | 3 |

---

## Fallback Behavior

### Missing User Preferences

If user preferences are not configured:
- All channels default to enabled
- Frequency defaults to immediate
- Quiet hours default to disabled
- All events default to enabled

### Template Fallbacks

If a translation is missing:
- Email: Falls back to English
- SMS: Falls back to English
- In-app: Falls back to English

### Channel Fallbacks

If a channel fails:
- Log error
- Mark as failed
- Continue with other channels
- Don't block other notifications

---

## Integration

### With Ticket System

```javascript
// When ticket is created
await notificationService.send({
  event: 'ticket_created',
  userId: ticket.customer_id,
  data: {
    ticket_id: ticket.id,
    subject: ticket.title
  }
});

// When ticket is claimed
await notificationService.send({
  event: 'ticket_claimed',
  userId: ticket.customer_id,
  data: {
    ticket_id: ticket.id,
    tech_name: tech.name
  }
});
```

### With Payment System

```javascript
// When payment received
await notificationService.send({
  event: 'payment_received',
  userId: user.id,
  data: {
    amount: payment.amount,
    currency: payment.currency
  }
});
```

---

## References

- [Error Handling](./Error-Handling.md)
- [Validation](./Validation.md)
- [Messaging Integration](./MessagingIntegration.md)
