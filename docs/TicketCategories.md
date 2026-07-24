# TechDesk — Ticket Category Hierarchy

## Overview

TechDesk implements a hierarchical ticket category system with three levels: Category → Subcategory → Topic. This provides more accurate ticket routing and better analytics.

## Category Structure

The category hierarchy is defined in `backend/src/constants/ticketCategories.js` as a centralized constant that serves as the single source of truth.

### Main Categories (7)

| ID | Category | Icon | Description |
|----|----------|------|-------------|
| `hardware` | Hardware | 💻 | Physical equipment and device problems |
| `software` | Software | 📀 | Applications, programs, and system software |
| `network` | Network | 🌐 | Connectivity and network infrastructure |
| `access` | Access & Security | 🔐 | Account access, permissions, and security |
| `data` | Data & Storage | 💾 | Data management, storage, and backup |
| `account` | Account & Billing | 💳 | Account management and billing |
| `training` | Training & Support | 📚 | Training requests and general support |
| `other` | Other | 📋 | Issues that don't fit other categories |

### Subcategories

Each main category contains multiple subcategories:

#### Hardware (5)
- Desktop
- Laptop
- Printer/Scanner
- Network Equipment
- Peripherals

#### Software (5)
- Operating System
- Productivity Software
- Development Tools
- Communication Tools
- Security Software

#### Network (4)
- Connectivity
- Access & Permissions
- Email & Messaging
- Infrastructure

#### Access & Security (4)
- Authentication
- Permissions & Access
- Security Incidents
- Compliance & Auditing

#### Data & Storage (4)
- Storage
- Backup & Recovery
- Database
- Data Loss Prevention

#### Account & Billing (3)
- Account Management
- Billing & Payments
- Licensing

#### Training & Support (4)
- Training Request
- How-To Questions
- Documentation
- Feedback & Suggestions

#### Other (1)
- General Inquiry

## API Endpoints

### Get Full Hierarchy
```
GET /api/ticket-hierarchy
```
Returns the complete category tree structure.

**Response:**
```json
{
  "success": true,
  "data": {
    "hardware": {
      "id": "hardware",
      "name": "Hardware",
      "icon": "💻",
      "description": "Physical equipment and device problems",
      "subcategories": {
        "desktop": {
          "id": "desktop",
          "name": "Desktop",
          "topics": {
            "display": { "id": "display", "name": "Display/Monitor Issues" },
            "keyboard": { "id": "keyboard", "name": "Keyboard Problems" }
          }
        }
      }
    }
  }
}
```

### Get Category Details
```
GET /api/ticket-hierarchy/:categoryId
```
Returns a specific category with its subcategories.

### Get Subcategory Topics
```
GET /api/ticket-hierarchy/:categoryId/:subcategoryId
```
Returns topics for a specific subcategory.

### Validate Category Path
```
POST /api/ticket-hierarchy/validate
```
Validates a complete category path.

**Request:**
```json
{
  "category": "hardware",
  "subcategory": "desktop",
  "topic": "display"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "data": {
    "category": { "id": "hardware", "name": "Hardware", "icon": "💻" },
    "subcategory": { "id": "desktop", "name": "Desktop" },
    "topic": { "id": "display", "name": "Display/Monitor Issues" }
  }
}
```

### Search Categories
```
GET /api/ticket-hierarchy/search/:query
```
Search across all categories, subcategories, and topics.

## Frontend Integration

### SubmitTicket Form
The SubmitTicket page includes a 3-level dropdown selector:

```jsx
// Category Hierarchy Selection
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
  <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
    <option value="">Select Category</option>
    {Object.entries(categoryHierarchy).map(([key, cat]) => (
      <option key={key} value={key}>{cat.icon} {cat.name}</option>
    ))}
  </select>

  <select value={form.subcategory} disabled={!categoryHierarchy[form.category]?.subcategories}>
    <option value="">Select Subcategory</option>
    {/* Subcategories populated based on category */}
  </select>

  <select value={form.topic} disabled={!categoryHierarchy[form.category]?.subcategories?.[form.subcategory]?.topics}>
    <option value="">Select Topic</option>
    {/* Topics populated based on subcategory */}
  </select>
</div>
```

### Auto-Reset Behavior
When a parent selection changes, child selections are automatically reset:
```javascript
useEffect(() => {
  setForm(f => ({ ...f, subcategory: '', topic: '' }));
}, [form.category]);

useEffect(() => {
  setForm(f => ({ ...f, topic: '' }));
}, [form.subcategory]);
```

### Path Display
Shows the full selected path:
```jsx
{form.category && (
  <div>
    <strong>Selected:</strong> {categoryHierarchy[form.category]?.icon} {categoryHierarchy[form.category]?.name}
    {form.subcategory && ` → ${categoryHierarchy[form.category]?.subcategories?.[form.subcategory]?.name}`}
    {form.topic && ` → ${categoryHierarchy[form.category]?.subcategories?.[form.subcategory]?.topics?.[form.topic]?.name}`}
  </div>
)}
```

## Database Schema

### Ticket Table Update
The `tickets` table includes the hierarchy fields:

| Column | Type | Description |
|--------|------|-------------|
| `category` | VARCHAR(255) | Main category ID |
| `subcategory` | VARCHAR(255) | Subcategory ID (nullable) |
| `topic` | VARCHAR(255) | Topic ID (nullable) |

### Migration
```sql
ALTER TABLE tickets ADD COLUMN topic VARCHAR(255) NULL AFTER subcategory;
```

## Validation

When creating a ticket, the backend validates the category path:

```javascript
import { validateCategoryPath, getFullPath } from '../constants/ticketCategories.js';

if (category && subcategory && topic) {
  if (!validateCategoryPath(category, subcategory, topic)) {
    return res.status(400).json({ error: 'Invalid category hierarchy path' });
  }
  const categoryPath = getFullPath(category, subcategory, topic);
}
```

## Reporting & Analytics

The `categoryPath` object is stored in ticket history for reporting:

```javascript
await pool.query(
  `INSERT INTO ticket_history (ticket_id, action, actor_name, actor_role, metadata)
   VALUES (?, 'created', ?, 'customer', ?)`,
  [ticketId, customer_name, JSON.stringify({ priority, environment, categoryPath })]
);
```

### Analytics Use Cases
- **Volume by Category**: Which categories get the most tickets?
- **Resolution Time by Topic**: Average resolution time per topic
- **Agent Specialization**: Which agents handle which topics best?
- **SLA Compliance**: Track SLA adherence by category hierarchy

## Constants Reference

```javascript
import {
  TICKET_CATEGORIES,
  getCategories,
  getCategory,
  getFullPath,
  validateCategoryPath,
  getTopic
} from '../constants/ticketCategories.js';
```

| Function | Description |
|----------|-------------|
| `getCategories()` | Returns array of category summaries |
| `getCategory(id)` | Returns category with subcategories |
| `getFullPath(cat, sub, topic)` | Returns complete path object |
| `validateCategoryPath(cat, sub, topic)` | Returns boolean |
| `getTopic(cat, sub, topic)` | Returns topic object |

## Caching

The hierarchy data is cached for 1 hour:
```javascript
const CATEGORIES_CACHE_TTL = 3600;
await setCache(cacheKey, data, CATEGORIES_CACHE_TTL);
```
