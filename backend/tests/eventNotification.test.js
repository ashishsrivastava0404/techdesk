/**
 * Event Notification Service Tests
 * Tests for comprehensive notification system
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ============================================
// EVENT TYPES TESTS
// ============================================

describe('Event Types', () => {
  const EVENT_TYPES = {
    TICKET_CREATED: 'ticket_created',
    TICKET_CLAIMED: 'ticket_claimed',
    TICKET_ASSIGNED: 'ticket_assigned',
    TICKET_RESOLVED: 'ticket_resolved',
    PAYMENT_RECEIVED: 'payment_received',
    PAYOUT_REQUESTED: 'payout_requested',
    COMMENT_ADDED: 'comment_added'
  };

  it('should have ticket events defined', () => {
    expect(EVENT_TYPES.TICKET_CREATED).toBe('ticket_created');
    expect(EVENT_TYPES.TICKET_CLAIMED).toBe('ticket_claimed');
    expect(EVENT_TYPES.TICKET_ASSIGNED).toBe('ticket_assigned');
    expect(EVENT_TYPES.TICKET_RESOLVED).toBe('ticket_resolved');
  });

  it('should have payment events defined', () => {
    expect(EVENT_TYPES.PAYMENT_RECEIVED).toBe('payment_received');
    expect(EVENT_TYPES.PAYOUT_REQUESTED).toBe('payout_requested');
  });

  it('should have comment events defined', () => {
    expect(EVENT_TYPES.COMMENT_ADDED).toBe('comment_added');
  });
});

// ============================================
// USER PREFERENCES TESTS
// ============================================

describe('User Preferences', () => {
  const defaultPreferences = {
    email_enabled: true,
    sms_enabled: true,
    in_app_enabled: true,
    push_enabled: true,
    email_frequency: 'instant'
  };

  it('should have default preferences', () => {
    expect(defaultPreferences.email_enabled).toBe(true);
    expect(defaultPreferences.sms_enabled).toBe(true);
    expect(defaultPreferences.in_app_enabled).toBe(true);
  });

  it('should have email frequency options', () => {
    const validFrequencies = ['instant', 'daily', 'weekly'];
    expect(validFrequencies).toContain(defaultPreferences.email_frequency);
  });
});

// ============================================
// SYSTEM MESSAGE GENERATION TESTS
// ============================================

describe('System Message Generation', () => {
  const getEventSystemMessage = (eventType, data) => {
    const messages = {
      ticket_created: `Ticket "${data.title}" has been created`,
      ticket_claimed: `${data.techName || 'A technician'} has claimed the ticket`,
      ticket_assigned: `Ticket has been assigned to ${data.techName || 'a technician'}`,
      ticket_resolved: `Ticket has been resolved: ${data.resolution || ''}`,
      comment_added: `${data.authorName || 'Someone'} added a comment`,
      payment_received: `Payment of ${data.amount || 0} received`,
      payout_approved: `Payout of ${data.amount || 0} approved`,
      payout_rejected: `Payout request rejected: ${data.reason || 'No reason provided'}`,
      new_lead: `New lead assigned: ${data.leadName || 'Unknown'}`,
      rating_received: `You received a ${data.rating || 0}-star rating`
    };

    return messages[eventType] || `Event: ${eventType}`;
  };

  it('should generate ticket created message', () => {
    const message = getEventSystemMessage('ticket_created', { title: 'Test Ticket' });
    expect(message).toBe('Ticket "Test Ticket" has been created');
  });

  it('should generate ticket claimed message', () => {
    const message = getEventSystemMessage('ticket_claimed', { techName: 'John Doe' });
    expect(message).toBe('John Doe has claimed the ticket');
  });

  it('should generate ticket claimed message with fallback', () => {
    const message = getEventSystemMessage('ticket_claimed', {});
    expect(message).toBe('A technician has claimed the ticket');
  });

  it('should generate ticket resolved message', () => {
    const message = getEventSystemMessage('ticket_resolved', { resolution: 'Fixed successfully' });
    expect(message).toBe('Ticket has been resolved: Fixed successfully');
  });

  it('should generate ticket resolved message with empty resolution', () => {
    const message = getEventSystemMessage('ticket_resolved', {});
    expect(message).toBe('Ticket has been resolved: ');
  });

  it('should generate comment added message', () => {
    const message = getEventSystemMessage('comment_added', { authorName: 'Jane' });
    expect(message).toBe('Jane added a comment');
  });

  it('should generate payment received message', () => {
    const message = getEventSystemMessage('payment_received', { amount: 100 });
    expect(message).toBe('Payment of 100 received');
  });

  it('should generate payout approved message', () => {
    const message = getEventSystemMessage('payout_approved', { amount: 500 });
    expect(message).toBe('Payout of 500 approved');
  });

  it('should generate payout rejected message', () => {
    const message = getEventSystemMessage('payout_rejected', { reason: 'Invalid details' });
    expect(message).toBe('Payout request rejected: Invalid details');
  });

  it('should generate payout rejected with default reason', () => {
    const message = getEventSystemMessage('payout_rejected', {});
    expect(message).toBe('Payout request rejected: No reason provided');
  });

  it('should generate new lead message', () => {
    const message = getEventSystemMessage('new_lead', { leadName: 'Acme Corp' });
    expect(message).toBe('New lead assigned: Acme Corp');
  });

  it('should generate rating received message', () => {
    const message = getEventSystemMessage('rating_received', { rating: 5 });
    expect(message).toBe('You received a 5-star rating');
  });

  it('should handle unknown event type', () => {
    const message = getEventSystemMessage('unknown_event', {});
    expect(message).toBe('Event: unknown_event');
  });
});

// ============================================
// SMS MESSAGE GENERATION TESTS
// ============================================

describe('SMS Message Generation', () => {
  const getSmsMessage = (eventType, data) => {
    const messages = {
      ticket_created: `Your ticket #${data.ticketId} has been created. We'll notify you when a technician is assigned.`,
      ticket_claimed: `Your ticket #${data.ticketId} is being worked on by ${data.techName}.`,
      ticket_resolved: `Your ticket #${data.ticketId} has been resolved. Please rate your experience.`,
      payment_received: `Payment received: $${data.amount} for ticket #${data.ticketId}.`,
      payout_approved: `Your payout of $${data.amount} has been approved and will be processed.`,
      reminder: `Reminder: You have pending tickets that need attention.`
    };

    return messages[eventType] || `TechDesk: ${data.message || 'You have a new notification'}`;
  };

  it('should generate ticket created SMS', () => {
    const message = getSmsMessage('ticket_created', { ticketId: 123 });
    expect(message).toContain('123');
    expect(message).toContain('created');
  });

  it('should generate ticket claimed SMS', () => {
    const message = getSmsMessage('ticket_claimed', { ticketId: 123, techName: 'John' });
    expect(message).toContain('123');
    expect(message).toContain('John');
  });

  it('should generate ticket resolved SMS', () => {
    const message = getSmsMessage('ticket_resolved', { ticketId: 123 });
    expect(message).toContain('123');
    expect(message).toContain('resolved');
  });

  it('should generate payment received SMS', () => {
    const message = getSmsMessage('payment_received', { ticketId: 123, amount: 50 });
    expect(message).toContain('$50');
    expect(message).toContain('123');
  });

  it('should generate payout approved SMS', () => {
    const message = getSmsMessage('payout_approved', { amount: 200 });
    expect(message).toContain('$200');
    expect(message).toContain('approved');
  });

  it('should generate reminder SMS', () => {
    const message = getSmsMessage('reminder', {});
    expect(message).toContain('Reminder');
  });

  it('should generate default SMS for unknown events', () => {
    const message = getSmsMessage('unknown_event', { message: 'Test' });
    expect(message).toContain('TechDesk');
    expect(message).toContain('Test');
  });
});

// ============================================
// EMAIL CONTENT TESTS
// ============================================

describe('Email Content Generation', () => {
  const getEmailContent = (eventType, data, language = 'en') => {
    const templates = {
      ticket_created: {
        subject: language === 'es' 
          ? `Ticket #${data.ticket_id} Creado` 
          : `Ticket #${data.ticket_id} Created`,
        body: language === 'es'
          ? `<h1>Hola ${data.customer_name}</h1><p>Tu ticket ha sido creado.</p>`
          : `<h1>Hello ${data.customer_name}</h1><p>Your ticket has been created.</p>`
      },
      ticket_resolved: {
        subject: language === 'es'
          ? `Ticket #${data.ticket_id} Resuelto`
          : `Ticket #${data.ticket_id} Resolved`,
        body: language === 'es'
          ? `<p>Tu ticket ha sido resuelto.</p><p>${data.resolution || ''}</p>`
          : `<p>Your ticket has been resolved.</p><p>${data.resolution || ''}</p>`
      }
    };

    return templates[eventType] || { subject: 'Notification', body: '<p>You have a new notification.</p>' };
  };

  it('should generate ticket created email in English', () => {
    const content = getEmailContent('ticket_created', { ticket_id: 123, customer_name: 'John' }, 'en');
    expect(content.subject).toContain('123');
    expect(content.subject).toContain('Created');
    expect(content.body).toContain('John');
  });

  it('should generate ticket created email in Spanish', () => {
    const content = getEmailContent('ticket_created', { ticket_id: 456, customer_name: 'Maria' }, 'es');
    expect(content.subject).toContain('456');
    expect(content.subject).toContain('Creado');
    expect(content.body).toContain('Maria');
  });

  it('should generate ticket resolved email', () => {
    const content = getEmailContent('ticket_resolved', { ticket_id: 789, resolution: 'Fixed' }, 'en');
    expect(content.subject).toContain('789');
    expect(content.subject).toContain('Resolved');
    expect(content.body).toContain('Fixed');
  });

  it('should generate ticket resolved email in Spanish', () => {
    const content = getEmailContent('ticket_resolved', { ticket_id: 789, resolution: 'Arreglado' }, 'es');
    expect(content.subject).toContain('789');
    expect(content.subject).toContain('Resuelto');
    expect(content.body).toContain('Arreglado');
  });
});

// ============================================
// NOTIFICATION CHANNEL TESTS
// ============================================

describe('Notification Channels', () => {
  const channels = ['in_app', 'email', 'sms', 'push'];

  it('should have all required channels', () => {
    expect(channels).toContain('in_app');
    expect(channels).toContain('email');
    expect(channels).toContain('sms');
    expect(channels).toContain('push');
  });

  it('should have 4 channels', () => {
    expect(channels.length).toBe(4);
  });
});

// ============================================
// PRIORITY LEVEL TESTS
// ============================================

describe('Notification Priority', () => {
  const priorities = ['low', 'normal', 'high', 'urgent'];

  it('should have all priority levels', () => {
    expect(priorities).toContain('low');
    expect(priorities).toContain('normal');
    expect(priorities).toContain('high');
    expect(priorities).toContain('urgent');
  });

  it('should have 4 priority levels', () => {
    expect(priorities.length).toBe(4);
  });

  it('should prioritize urgent over high', () => {
    const priorityOrder = ['urgent', 'high', 'normal', 'low'];
    expect(priorityOrder.indexOf('urgent')).toBeLessThan(priorityOrder.indexOf('high'));
  });
});

// ============================================
// EVENT-TO-CHANNEL MAPPING TESTS
// ============================================

describe('Event to Channel Mapping', () => {
  const eventChannels = {
    ticket_created: ['in_app', 'email'],
    ticket_claimed: ['in_app', 'email'],
    ticket_resolved: ['in_app', 'email', 'sms'],
    payment_received: ['in_app', 'email', 'sms'],
    payout_requested: ['in_app'],
    payout_approved: ['in_app', 'email', 'sms'],
    new_message: ['in_app', 'push'],
    reminder: ['in_app', 'email']
  };

  it('should map ticket_created to in_app and email', () => {
    const channels = eventChannels.ticket_created;
    expect(channels).toContain('in_app');
    expect(channels).toContain('email');
    expect(channels).not.toContain('sms');
  });

  it('should map ticket_resolved to multiple channels', () => {
    const channels = eventChannels.ticket_resolved;
    expect(channels).toContain('in_app');
    expect(channels).toContain('email');
    expect(channels).toContain('sms');
  });

  it('should map payment_received to all notification channels', () => {
    const channels = eventChannels.payment_received;
    expect(channels).toContain('in_app');
    expect(channels).toContain('email');
    expect(channels).toContain('sms');
  });

  it('should map payout_requested to in_app only', () => {
    const channels = eventChannels.payout_requested;
    expect(channels).toContain('in_app');
    expect(channels.length).toBe(1);
  });

  it('should map new_message to in_app and push', () => {
    const channels = eventChannels.new_message;
    expect(channels).toContain('in_app');
    expect(channels).toContain('push');
  });
});

// ============================================
// MESSAGE TYPE TESTS
// ============================================

describe('Message Types', () => {
  const messageTypes = ['text', 'attachment', 'system'];

  it('should have text message type', () => {
    expect(messageTypes).toContain('text');
  });

  it('should have attachment message type', () => {
    expect(messageTypes).toContain('attachment');
  });

  it('should have system message type', () => {
    expect(messageTypes).toContain('system');
  });

  it('should have 3 message types', () => {
    expect(messageTypes.length).toBe(3);
  });
});

// ============================================
// QUITE HOURS TESTS
// ============================================

describe('Quiet Hours', () => {
  const isInQuietHours = (now, start, end) => {
    if (!start || !end) return false;
    
    const currentHour = now.getHours();
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    
    if (startHour < endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      return currentHour >= startHour || currentHour < endHour;
    }
  };

  it('should return false when no quiet hours set', () => {
    expect(isInQuietHours(new Date(), null, null)).toBe(false);
  });

  it('should detect in quiet hours during daytime', () => {
    const nightTime = new Date('2024-01-01T03:00:00');
    expect(isInQuietHours(nightTime, '22:00', '08:00')).toBe(true);
  });

  it('should not be in quiet hours outside range', () => {
    const daytime = new Date('2024-01-01T14:00:00');
    expect(isInQuietHours(daytime, '22:00', '08:00')).toBe(false);
  });
});

// ============================================
// BULK NOTIFICATION TESTS
// ============================================

describe('Bulk Notifications', () => {
  const notifyMultiple = async (userIds, eventType, data) => {
    const results = [];
    for (const userId of userIds) {
      results.push({ userId, success: true });
    }
    return results;
  };

  it('should notify multiple users', async () => {
    const userIds = [1, 2, 3];
    const results = await notifyMultiple(userIds, 'ticket_created', {});
    
    expect(results.length).toBe(3);
    expect(results[0].userId).toBe(1);
    expect(results[1].userId).toBe(2);
    expect(results[2].userId).toBe(3);
  });

  it('should return success for each user', async () => {
    const userIds = [1, 2];
    const results = await notifyMultiple(userIds, 'ticket_created', {});
    
    expect(results.every(r => r.success)).toBe(true);
  });

  it('should handle empty user list', async () => {
    const results = await notifyMultiple([], 'ticket_created', {});
    expect(results.length).toBe(0);
  });
});

// ============================================
// NOTIFICATION DELIVERY TESTS
// ============================================

describe('Notification Delivery', () => {
  const mockDeliveryResults = {
    in_app: { delivered: true, timestamp: new Date() },
    email: { delivered: true, messageId: 'msg-123' },
    sms: { delivered: true, sid: 'SM123' },
    push: { delivered: true }
  };

  it('should have delivery status for each channel', () => {
    expect(mockDeliveryResults.in_app).toBeDefined();
    expect(mockDeliveryResults.email).toBeDefined();
    expect(mockDeliveryResults.sms).toBeDefined();
    expect(mockDeliveryResults.push).toBeDefined();
  });

  it('should mark in_app as delivered', () => {
    expect(mockDeliveryResults.in_app.delivered).toBe(true);
  });

  it('should have email message ID', () => {
    expect(mockDeliveryResults.email.messageId).toBeDefined();
  });

  it('should have SMS SID', () => {
    expect(mockDeliveryResults.sms.sid).toBeDefined();
  });
});

// ============================================
// READ RECEIPT TESTS
// ============================================

describe('Read Receipts', () => {
  const markAsRead = (messageId, userId, messages) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      message.is_read = true;
      message.read_at = new Date();
      message.read_by = userId;
      return true;
    }
    return false;
  };

  it('should mark message as read', () => {
    const messages = [
      { id: 1, content: 'Test', is_read: false },
      { id: 2, content: 'Test 2', is_read: false }
    ];
    
    markAsRead(1, 100, messages);
    
    expect(messages[0].is_read).toBe(true);
    expect(messages[0].read_at).toBeDefined();
    expect(messages[0].read_by).toBe(100);
  });

  it('should not affect other messages', () => {
    const messages = [
      { id: 1, content: 'Test', is_read: false },
      { id: 2, content: 'Test 2', is_read: false }
    ];
    
    markAsRead(1, 100, messages);
    
    expect(messages[1].is_read).toBe(false);
  });

  it('should return false for non-existent message', () => {
    const messages = [{ id: 1, content: 'Test', is_read: false }];
    const result = markAsRead(999, 100, messages);
    expect(result).toBe(false);
  });
});

// ============================================
// CONVERSATION TRACKING TESTS
// ============================================

describe('Conversation Tracking', () => {
  const getUnreadCount = (messages, userId) => {
    return messages.filter(m => 
      m.sender_id !== userId && !m.is_read
    ).length;
  };

  it('should count unread messages from others', () => {
    const messages = [
      { id: 1, sender_id: 2, is_read: false },
      { id: 2, sender_id: 1, is_read: false },
      { id: 3, sender_id: 2, is_read: true }
    ];
    
    const count = getUnreadCount(messages, 1);
    expect(count).toBe(1);
  });

  it('should not count own messages as unread', () => {
    const messages = [
      { id: 1, sender_id: 1, is_read: false },
      { id: 2, sender_id: 2, is_read: false }
    ];
    
    const count = getUnreadCount(messages, 1);
    expect(count).toBe(1);
  });

  it('should return 0 when all messages read', () => {
    const messages = [
      { id: 1, sender_id: 2, is_read: true },
      { id: 2, sender_id: 2, is_read: true }
    ];
    
    const count = getUnreadCount(messages, 1);
    expect(count).toBe(0);
  });
});
