# Support Workflow Documentation

## Overview

The TechDesk support system provides a real-time feedback loop between users and support staff. Users can report issues, feature requests, or complaints directly from any page in the application using the 🐛 Report Issue button.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                         │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  🐛 Report Issue Button (Floating, Bottom-Right)     │   │
│   └─────────────────────────────────────────────────────┘   │
│                         ↓                                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Report Issue Modal                                  │   │
│   │  • Report Type (Bug, Feature, Complaint, etc.)       │   │
│   │  • Priority (Low, Medium, High, Urgent)            │   │
│   │  • Subject                                           │   │
│   │  • Description                                       │   │
│   │  Auto-captured: Page URL, Browser Info               │   │
│   └─────────────────────────────────────────────────────┘   │
│                         ↓                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│                                                             │
│   POST /api/support-reports                                │
│                         ↓                                   │
│   ┌────────────────┐    ┌────────────────┐               │
│   │ support_reports │    │ notifications   │               │
│   │ table           │    │ table          │               │
│   │                 │    │ (for admins)   │               │
│   └────────────────┘    └────────────────┘               │
│         ↓                       ↓                          │
│   ┌────────────────────────────────────────────────┐       │
│   │ admin_logs table (full audit trail)            │       │
│   └────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                         │
│                                                             │
│   📋 Support Reports Tab                                    │
│   • View all reports                                       │
│   • Filter by status/priority/type                         │
│   • Update report status                                  │
│   • Add resolution notes                                  │
│                                                             │
│   🔔 Bell Icon - Notifications                             │
│   • New report alerts                                      │
│   • Status update alerts                                  │
└─────────────────────────────────────────────────────────────┘
```

## Data Schema

### support_reports Table

```sql
CREATE TABLE support_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,                    -- Reference to users table
  user_name VARCHAR(255),         -- User's display name
  user_email VARCHAR(255),         -- User's email
  user_role ENUM('customer', 'tech', 'admin'),
  
  report_type ENUM('bug', 'feature_request', 'complaint', 'billing_issue', 'other'),
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  
  subject VARCHAR(255) NOT NULL,  -- Report title
  description TEXT NOT NULL,      -- Detailed description
  
  page_url VARCHAR(500),           -- Where issue occurred
  browser_info VARCHAR(255),       -- User's browser
  
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  assigned_to VARCHAR(255),       -- Admin handling
  resolution_notes TEXT,           -- How it was resolved
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_created (created_at)
);
```

### notifications Table Extension

```sql
-- Added field for support report notifications
ALTER TABLE notifications ADD COLUMN related_report_id INT;
```

## API Endpoints

### Submit Report (Public)
```
POST /api/support-reports
Content-Type: application/json

{
  "user_id": 1,
  "user_name": "John Doe",
  "user_email": "john@example.com",
  "user_role": "customer",
  "report_type": "bug",
  "priority": "high",
  "subject": "Login button not working",
  "description": "When I click the login button...",
  "page_url": "https://app.example.com/login",
  "browser_info": "Chrome/120.0 on Windows"
}
```

### Get My Reports
```
GET /api/support-reports/my-reports?user_id=1
```

### Admin: Get All Reports
```
GET /api/admin/support-reports
GET /api/admin/support-reports?status=open&priority=urgent
```

### Admin: Update Report
```
PATCH /api/admin/support-reports/:id
Content-Type: application/json

{
  "status": "resolved",
  "resolution_notes": "Fixed in v2.1.0",
  "admin_name": "Admin"
}
```

### Get Support Stats
```
GET /api/admin/support-stats

Response:
{
  "open": 5,
  "in_progress": 2,
  "resolved": 42,
  "urgent": 1
}
```

## User Workflow

### Submitting a Report

1. User clicks 🐛 button (bottom-right corner)
2. Modal opens with form
3. User selects:
   - **Report Type**: Bug, Feature Request, Complaint, Billing Issue, Other
   - **Priority**: Low, Medium, High, Urgent
4. User enters:
   - **Subject**: Brief title
   - **Description**: Detailed explanation
5. User clicks "Submit Report"
6. System shows confirmation
7. Admin receives notification

### Checking Report Status

1. User clicks bell icon 🔔
2. User sees notifications
3. Status updates appear as notifications
4. User can view their reports in profile (future)

## Admin Workflow

### Triaging a Report

1. **Receive Alert**: Bell icon shows new report notification
2. **Access Reports**: Go to **Admin → Support Reports**
3. **Review Stats**: Check Open/In Progress/Resolved/Urgent counts
4. **Review Report**:
   - Read description
   - Check page URL
   - Note priority level
5. **Update Status**:
   - `open` → `in_progress` (starting work)
   - `in_progress` → `resolved` (issue fixed)
   - `resolved` → `closed` (confirm with user)
6. **Add Notes**: Include resolution details
7. **Notify User**: System sends notification automatically

### Status Transition Rules

```
[User Submits]
      ↓
    OPEN ←────────────────┐
      │                    │
      │ (admin starts work)│
      ↓                    │
  IN_PROGRESS              │
      │                    │
      │ (issue resolved)   │
      ↓                    │
   RESOLVED                │
      │                    │
      │ (close after time) │
      ↓                    │
    CLOSED ────────────────┘
```

### Priority Guidelines

| Priority | Response Time | Examples |
|----------|---------------|----------|
| Urgent | Immediate | System down, data loss |
| High | Within 4h | Major feature broken |
| Medium | Within 48h | Minor issues |
| Low | Within week | Suggestions, minor bugs |

## Real-Time Feedback Loop

```
┌──────────────────────────────────────────────────────────┐
│                    USER EXPERIENCE                        │
│                                                           │
│  1. User encounters issue                                 │
│  2. Click 🐛 button                                      │
│  3. Submit report                                        │
│  4. See confirmation                                      │
│                                                           │
│  5. [Later] User checks bell icon                        │
│  6. Sees: "Your report status: In Progress"              │
│                                                           │
│  7. [Later] User checks bell icon                        │
│  8. Sees: "Your report status: Resolved"                 │
│  9. User knows issue was fixed!                          │
└──────────────────────────────────────────────────────────┘
```

## Notification Events

| Event | Recipient | Message |
|-------|-----------|---------|
| New Report | Admin | 🚨 New Support Report: [type] |
| Report Urgent | Admin | 🚨 URGENT: [subject] |
| Status Changed | User | ✅ Report Update: status changed to [status] |

## Best Practices

### For Users
- Include detailed steps to reproduce
- Mention browser and OS
- Attach screenshots if possible (future)
- Use appropriate priority level

### For Admins
- Check reports daily
- Prioritize urgent issues
- Add resolution notes
- Keep users informed via status changes

## Future Enhancements

- [ ] File attachments for reports
- [ ] Report commenting/threading
- [ ] User view of own reports
- [ ] Email notifications
- [ ] Auto-assignment rules
- [ ] SLA tracking
- [ ] Report categories/tags
- [ ] Export reports to CSV
