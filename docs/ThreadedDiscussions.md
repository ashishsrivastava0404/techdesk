# TechDesk — Threaded Discussions

## Overview

TechDesk implements a threaded discussion system for tickets, allowing customers and technicians to communicate in organized conversation threads. Comments support multiple message types and role-based access control.

## Database Schema

### ticket_comments Table

```sql
CREATE TABLE ticket_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  user_id INT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role ENUM('customer', 'technician', 'admin', 'system') NOT NULL DEFAULT 'customer',
  message TEXT NOT NULL,
  message_type ENUM('comment', 'note', 'resolution', 'internal') NOT NULL DEFAULT 'comment',
  parent_id INT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  attachments JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES ticket_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### Database Migration

Run the migration file:
```bash
mysql -u root -p your_database_name < backend/src/db/migrations/add_ticket_comments.sql
```

## Message Types

| Type | Description | Internal |
|------|-------------|----------|
| `comment` | Regular discussion message | No |
| `note` | Internal note (technician only) | Yes |
| `resolution` | Resolution confirmation | No |
| `internal` | Internal discussion | Yes |

## User Roles

| Role | Description | Permissions |
|------|-------------|------------|
| `customer` | Ticket submitter | View/add public comments |
| `technician` | Assigned agent | View/add all comments, internal notes |
| `admin` | Platform admin | Full access to all comments |
| `system` | Automated messages | Created by system |

## API Endpoints

### Get Comments (Threaded)
```
GET /api/tickets/:ticketId/comments?includeInternal=false
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|----------|------|---------|-------------|
| `includeInternal` | boolean | false | Include internal notes (technician/admin only) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ticket_id": 100,
      "user_id": 1,
      "user_name": "John Doe",
      "user_role": "customer",
      "message": "My printer is not working",
      "message_type": "comment",
      "parent_id": null,
      "is_internal": false,
      "created_at": "2024-01-15T10:30:00Z",
      "children": [
        {
          "id": 2,
          "user_name": "Tech Support",
          "user_role": "technician",
          "message": "Have you tried restarting it?",
          "message_type": "comment",
          "parent_id": 1,
          "children": []
        }
      ]
    }
  ]
}
```

### Create Comment
```
POST /api/tickets/:ticketId/comments
```

**Request Body:**
```json
{
  "message": "Thank you for the help!",
  "message_type": "comment",
  "parent_id": null,
  "is_internal": false,
  "attachments": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "ticket_id": 100,
    "user_name": "John Doe",
    "user_role": "customer",
    "message": "Thank you for the help!",
    "message_type": "comment",
    "parent_id": 2,
    "is_internal": false,
    "created_at": "2024-01-15T10:35:00Z"
  }
}
```

### Update Comment
```
PATCH /api/tickets/:ticketId/comments/:commentId
```

**Request Body:**
```json
{
  "message": "Updated message content",
  "is_internal": true
}
```

### Delete Comment
```
DELETE /api/tickets/:ticketId/comments/:commentId
```

## Access Control

### Viewing Comments
- **Customer**: Can view public comments on their own tickets
- **Technician**: Can view public + internal comments on assigned tickets
- **Admin**: Can view all comments on all tickets

### Creating Comments
| Role | Public Comment | Internal Note |
|------|----------------|----------------|
| Customer | ✅ | ❌ |
| Technician | ✅ | ✅ |
| Admin | ✅ | ✅ |

### Updating/Deleting Comments
- Author can update/delete their own comments
- Admin can update/delete any comment

## Frontend Implementation

### TicketDetail Component

The TicketDetail page includes the threaded discussion panel:

```jsx
const [comments, setComments] = useState([]);
const [replyingTo, setReplyingTo] = useState(null);

// Load comments
const loadComments = async () => {
  const response = await fetch(`/api/tickets/${ticket.id}/comments`);
  const data = await response.json();
  if (data.success) {
    setComments(data.data);
  }
};

// Send message
const sendMessage = async (message) => {
  await fetch(`/api/tickets/${ticket.id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      parent_id: replyingTo,
      message_type: 'comment'
    })
  });
  loadComments();
};
```

### Threaded Message Rendering

```jsx
const renderComments = (comments, isReply = false) => {
  return comments.map(comment => {
    const isOwn = comment.user_name === user?.name;
    const isTechnician = comment.user_role === 'technician' || comment.user_role === 'admin';
    
    const bubbleBg = isOwn 
      ? 'var(--amber)' 
      : isTechnician 
        ? 'var(--primary)' 
        : 'var(--panel)';

    return (
      <div key={comment.id} style={{ marginLeft: isReply ? '24px' : '0' }}>
        <div className={`message-bubble ${isOwn ? 'own' : ''} ${isTechnician ? 'technician' : ''}`}>
          <span className="role-badge">
            {comment.user_role === 'technician' && '🔧 '}
            {comment.user_role === 'admin' && '👑 '}
            {comment.user_role === 'customer' && '👤 '}
            {comment.user_name}
          </span>
          <div className="message-content">{comment.message}</div>
          <div className="message-meta">
            <span>{formatDate(comment.created_at)}</span>
            {!isReply && (
              <button onClick={() => replyToComment(comment)}>Reply</button>
            )}
          </div>
        </div>
        
        {/* Render children (replies) */}
        {comment.children?.length > 0 && (
          renderComments(comment.children, true)
        )}
      </div>
    );
  });
};
```

### Reply Feature

```jsx
const replyToComment = (comment) => {
  setReplyingTo(comment.id);
  setNewMessage(`@${comment.user_name} `);
};

// Show reply indicator
{replyingTo && (
  <div className="reply-indicator">
    Replying to a comment
    <button onClick={() => { setReplyingTo(null); setNewMessage(''); }}>
      Cancel
    </button>
  </div>
)}
```

## Visual Design

### Message Bubbles

| Role | Background | Text Color | Icon |
|------|------------|------------|------|
| Own Message | Amber | Dark | None |
| Technician | Primary (Blue) | Light | 🔧 |
| Admin | Primary (Blue) | Light | 👑 |
| Customer | Panel (Gray) | Text | 👤 |

### Thread Indentation
- Root comments: No indentation
- Replies: 24px left indent with border
- Nested replies: Additional indentation

## History Logging

Comments are automatically logged to ticket_history:

```sql
CREATE TRIGGER after_comment_insert
AFTER INSERT ON ticket_comments
FOR EACH ROW
BEGIN
  INSERT INTO ticket_history (ticket_id, action, actor_name, actor_role, metadata)
  VALUES (
    NEW.ticket_id,
    'comment_added',
    NEW.user_name,
    NEW.user_role,
    JSON_OBJECT(
      'comment_id', NEW.id,
      'message_type', NEW.message_type,
      'preview', LEFT(NEW.message, 100)
    )
  );
END//
```

## Use Cases

### Customer Support
```
Customer: "My printer is not working"
Technician: "Have you tried restarting it?"
Customer: "Yes, but still not working"
Technician: "Let me check the network settings"
[Internal Note - Customer cannot see]: "Network driver outdated, need to update"
Technician: "Found the issue, updating the driver now"
```

### Resolution Flow
```
Technician: "I've fixed the issue"
[System: Resolution status changed to 'resolved']
Customer: "Thank you! It's working now"
```

## Best Practices

1. **Use descriptive messages**: Include context and relevant details
2. **Use internal notes sparingly**: Only for sensitive or technical information
3. **Reference previous comments**: When replying, reference context
4. **Close threads**: Mark tickets as resolved to close discussion

## Error Handling

| Error | HTTP Code | Message |
|-------|----------|---------|
| Ticket not found | 404 | "Ticket not found" |
| Not authorized | 403 | "Not authorized to view this ticket" |
| Internal note by customer | 403 | "Only technicians can add internal notes" |
| Empty message | 400 | "Message is required" |
