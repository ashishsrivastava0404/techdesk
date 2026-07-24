# Admin Guide

## Overview

This guide covers administrative functions for the TechDesk platform, including user management, financial oversight, support ticket management, and platform configuration.

## Table of Contents

1. [Admin Dashboard](#admin-dashboard)
2. [User Management](#user-management)
3. [Payments & Payouts](#payments--payouts)
4. [Support Reports](#support-reports)
5. [Financial Audit](#financial-audit)
6. [Platform Settings](#platform-settings)

---

## Admin Dashboard

The admin dashboard provides a centralized view of platform operations.

### Dashboard Stats
- **Active Tickets**: Open and claimed tickets
- **Resolved (This Month)**: Tickets closed this month
- **Total Platform Fees**: Sum of all platform fees collected
- **Pending Payouts**: Payout requests awaiting processing

### Navigation Tabs
| Tab | Path | Description |
|-----|------|-------------|
| Overview | `/admin` | Dashboard with stats |
| Users | `/admin/users` | User management |
| Payments | `/admin/payments` | Payment & payout management |
| Credits | `/admin/credits` | Credit system management |
| Analytics | `/admin/analytics` | Revenue charts & stats |
| Financial Audit | `/admin/financial-audit` | Financial transaction history |
| Support Reports | `/admin/support-reports` | User-reported issues |
| Settings | `/admin/settings` | Platform configuration |

---

## User Management

### View Users
Navigate to **Users** tab to see all registered users.

### User Actions
- **View Details**: Click on a user to see their profile
- **Change Status**: Active ↔ Suspended
- **Update Role**: Customer, Tech, or Admin

### User Table Columns
| Field | Description |
|-------|-------------|
| Name | User's display name |
| Email | User's email address |
| Role | Customer, Tech, or Admin |
| Status | Active or Suspended |
| Created | Registration date |

---

## Payments & Payouts

### Payments Tab
View all customer payments with:
- Customer name
- Amount
- Status (pending, completed, disputed, failed)
- Platform fee
- Date

### Payouts Tab
Manage tech earnings payouts:

#### Payout Statuses
| Status | Description |
|--------|-------------|
| `requested` | Tech has requested payout |
| `processing` | Admin is processing payout |
| `completed` | Payout sent to tech |
| `failed` | Payout failed |

#### Processing a Payout
1. Go to **Payments** → **Payouts** tab
2. Find the payout request
3. Update status: `requested` → `processing` → `completed`

**Note**: Always verify payment details before marking as completed.

---

## Support Reports

### Overview
The Support Reports system allows users to report issues directly to administrators through a floating 🐛 button visible on all pages.

### Report Types
| Type | Icon | Use Case |
|------|------|----------|
| Bug Report | 🐛 | Something isn't working |
| Feature Request | 💡 | New feature suggestion |
| Complaint | 😤 | User dissatisfaction |
| Billing Issue | 💰 | Payment problems |
| Other | 📝 | Miscellaneous |

### Priority Levels
| Priority | Color | Response Time |
|----------|-------|---------------|
| Urgent | 🔴 Red | Immediate |
| High | 🟡 Amber | Same day |
| Medium | Default | Within 48h |
| Low | Gray | Within week |

### Managing Reports

#### Stats Cards
- **Open**: New reports awaiting review
- **In Progress**: Reports being worked on
- **Resolved**: Reports marked as resolved
- **Urgent**: High-priority reports needing attention

#### Report Details
Each report shows:
- Report type and priority badges
- Subject and description
- User info (name, role)
- Page URL where issue occurred
- Browser information
- Submission timestamp

#### Status Workflow
```
Open → In Progress → Resolved → Closed
```

To update a report status:
1. Find the report in the list
2. Use the status dropdown on the right
3. Select new status
4. The system will:
   - Update the database
   - Log the action in audit trail
   - Notify the user via bell icon

### Triage Workflow

1. **Receive**: New report appears in list
2. **Review**: Read description and check page URL
3. **Prioritize**: Set appropriate priority
4. **Assign**: Mark as "In Progress"
5. **Investigate**: Look into the issue
6. **Resolve**: Mark as "Resolved"
7. **Close**: Mark as "Closed" when done

---

## Financial Audit

### Purpose
Complete audit trail of all financial transactions for compliance and tracking.

### Transaction Types
| Type | Description |
|------|-------------|
| Payment | Customer payment for service |
| Payout | Tech earnings payout |
| Refund | Customer refund |
| Dispute | Payment dispute |
| Credit | Credit adjustment |
| Fee | Platform fee |
| Adjustment | Manual adjustment |

### Audit Log Entries
Each entry captures:
- Transaction type and ID
- Action (e.g., `payout_completed`)
- Previous/new status
- Amount and currency
- Platform fee
- Tech amount
- Admin who made the change
- IP address
- Timestamp

### Filtering
Filter logs by:
- Transaction type
- Tech ID
- Customer ID
- Date range

---

## Platform Settings

### Configuration Options

#### Payout Settings
| Setting | Description |
|---------|-------------|
| Commission Rate | Platform fee percentage (e.g., 0.15 = 15%) |
| Minimum Payout | Minimum amount before payout |
| Payout Auto-Approve | Automatically approve payouts |

#### Tech Earnings
| Setting | Description |
|---------|-------------|
| Dev Ticket Pay | Base pay for development tickets |
| Staging Ticket Pay | Base pay for staging tickets |
| Dev Threshold | Minimum tickets for dev rate |
| Staging Threshold | Minimum tickets for staging rate |

#### Credit by Priority
| Priority | Default Credit |
|----------|----------------|
| Low | $0 |
| Normal | $0 |
| High | $50 |
| Urgent | $75 |
| Critical | $100 |

#### Feature Flags
- Enable Leaderboard
- Enable Referrals
- Enable Badges
- Enable Chatbot
- Maintenance Mode

---

## Notifications

Admins receive notifications for:
- 🚨 New Support Reports (especially urgent)
- 🔔 New ticket submissions
- 💰 Payment received
- ⚠️ Disputed payments
- 📊 Weekly summaries (configurable)

---

## Best Practices

1. **Daily Review**: Check Support Reports daily
2. **Urgent First**: Address urgent reports immediately
3. **Document Changes**: Add resolution notes to reports
4. **Audit Trail**: All financial changes are logged
5. **User Communication**: Keep users informed via notifications

---

## Security Notes

- Admin actions are logged with IP address
- Password changes require current password
- API keys are masked in the frontend
- Sensitive settings require confirmation
