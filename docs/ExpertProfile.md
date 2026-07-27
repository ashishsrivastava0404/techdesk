# Expert Profile & Expertise Management

## Overview

The TechDesk Expert Profile system enables tech experts to showcase their skills, build credibility through ratings and track records, and get matched with tickets based on their expertise. Customers can view verified expert profiles before deciding who should handle their tickets.

## Table of Contents

1. [Tech Stack Categories](#tech-stack-categories)
2. [Expertise Levels](#expertise-levels)
3. [Complexity Tiers](#complexity-tiers)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Trust Layer Components](#trust-layer-components)
7. [Workflow](#workflow)
8. [Testing](#testing)

---

## Tech Stack Categories

The system includes 10 major technology categories with 100+ technologies:

### Category Structure

| Category | Icon | Description | Example Technologies |
|----------|------|-------------|---------------------|
| Languages | 💻 | Programming Languages | JavaScript, Python, Java, Go, Rust |
| Frontend | 🎨 | Frontend Frameworks | React, Vue, Angular, Next.js |
| Backend | ⚙️ | Backend Frameworks | Node.js, Django, Spring, Rails |
| Databases | 🗄️ | Database Systems | MySQL, PostgreSQL, MongoDB, Redis |
| Cloud | ☁️ | Cloud & DevOps | AWS, Azure, GCP, Docker, Kubernetes |
| Mobile | 📱 | Mobile Development | React Native, Flutter, Native iOS/Android |
| Data | 📊 | Data & Analytics | TensorFlow, PyTorch, Spark, Kafka |
| Security | 🔒 | Security | OAuth, JWT, OWASP, Penetration Testing |
| CMS | 🛒 | CMS & E-Commerce | WordPress, Shopify, WooCommerce |
| Tools | 🔧 | Collaboration Tools | Git, Jira, Slack, Figma |

### Technology Properties

Each technology has:
- `id` - Unique identifier
- `name` - Display name
- `category` - Sub-category within the main category
- `certified` - Whether certification is available

---

## Expertise Levels

Experts can declare their proficiency level for each technology:

| Level | Min Years | Badge | Description |
|-------|-----------|-------|-------------|
| Beginner | 0 | - | Just started learning |
| Intermediate | 1 | - | Working knowledge |
| Advanced | 3 | - | Deep expertise |
| Expert | 5 | - | Multiple years of experience |
| Certified | 3 | ✓ | Verified certification |

### Certification

Some technologies require certification verification:
- Technologies marked as `certified: true` in the tech stack
- Experts claiming "Certified" level must provide proof
- Admin approval required for certification badges

---

## Complexity Tiers

Tickets are categorized by complexity to match with appropriate experts:

| Tier | Max Rating | Max Experience | Description |
|------|------------|---------------|-------------|
| Simple | 2.5 | 2 years | Basic issues, quick resolution |
| Moderate | 3.5 | 4 years | Standard issues, moderate expertise |
| Complex | 4.5 | 6 years | Technical issues, significant expertise |
| Critical | 5.0 | 10 years | Mission-critical, top experts only |

### Eligibility Rules

An expert can handle a ticket if:
1. Their average rating >= (tier's maxRating - 1)
2. Their years of experience >= (tier's maxYears - 1)
3. They have verified skills in the ticket's category

---

## API Endpoints

### Public Endpoints

```
GET  /api/expert/technologies
GET  /api/expert/profile/:userId
GET  /api/expert/qualified?category=&complexity=
GET  /api/expert/leaderboard?limit=
```

### Protected Endpoints (Tech/Admin)

```
GET  /api/expert/profile          - Get own profile
PUT  /api/expert/skills           - Update skills
GET  /api/expert/eligibility      - Check eligibility
POST /api/expert/claim/:id/check  - Check claim eligibility
GET  /api/expert/stats            - Get stats
```

### Admin Endpoints

```
GET  /api/expert/admin/pending         - Pending verifications
POST /api/expert/admin/verify          - Verify skill
GET  /api/expert/admin/experts         - List all experts
```

### API Examples

**Get Technologies:**
```bash
curl /api/expert/technologies
```

Response:
```json
{
  "success": true,
  "technologies": [
    { "id": "react", "name": "React", "categoryId": "frontend", "certified": true },
    ...
  ],
  "categories": [
    { "id": "frontend", "name": "Frontend Frameworks", "icon": "🎨", "count": 12 },
    ...
  ],
  "expertiseLevels": [
    { "id": "beginner", "name": "Beginner", "minYears": 0 },
    ...
  ]
}
```

**Get Qualified Experts:**
```bash
curl /api/expert/qualified?category=software&complexity=moderate
```

Response:
```json
{
  "success": true,
  "experts": [
    {
      "id": "123",
      "name": "John Doe",
      "rating": 4.5,
      "ticketsResolved": 150,
      "meetsRating": true,
      "meetsExperience": true
    }
  ]
}
```

**Update Skills:**
```bash
curl -X PUT /api/expert/skills \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "skills": [
      { "techId": "react", "expertiseLevel": "expert", "yearsExperience": 5 },
      { "techId": "nodejs", "expertiseLevel": "advanced", "yearsExperience": 3 }
    ]
  }'
```

---

## Database Schema

### expert_skills Table

```sql
CREATE TABLE expert_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  tech_id VARCHAR(100) NOT NULL,
  expertise_level ENUM('beginner', 'intermediate', 'advanced', 'expert', 'certified'),
  years_experience INT DEFAULT 0,
  certification_proof TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_tech (user_id, tech_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (tech_id) REFERENCES tech_stack(id)
);
```

### expert_stats Table

```sql
CREATE TABLE expert_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  total_tickets_resolved INT DEFAULT 0,
  total_rating DECIMAL(5,2) DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  avg_resolution_time INT DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  last_active TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### expert_category_stats Table

```sql
CREATE TABLE expert_category_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  tickets_resolved INT DEFAULT 0,
  total_rating DECIMAL(5,2) DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  UNIQUE KEY unique_user_category (user_id, category),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### tech_stack Table

```sql
CREATE TABLE tech_stack (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  certified BOOLEAN DEFAULT FALSE
);
```

---

## Trust Layer Components

### ExpertProfile Component

Display expert's complete profile with rating and stats:

```jsx
import ExpertProfile from '../components/ExpertProfile';

// Full profile
<ExpertProfile expertId="123" />

// Compact inline version
<ExpertProfile expertId="123" compact={true} />
```

### ExpertSnippet Component

Small snippet for expert lists:

```jsx
import { ExpertSnippet } from '../components/ExpertProfile';

<ExpertSnippet 
  expert={{
    name: "John Doe",
    rating: 4.5,
    ticketsResolved: 150,
    isVerified: true
  }}
  onClick={() => showFullProfile(expert.id)}
/>
```

### QualifiedExpertsList Component

Show list of qualified experts for a ticket:

```jsx
import { QualifiedExpertsList } from '../components/ExpertProfile';

<QualifiedExpertsList 
  category="software"
  complexity="moderate"
  maxExperts={5}
/>
```

---

## Workflow

### Expert Updates Skills

1. Expert visits `/profile/settings`
2. Selects technologies from searchable dropdown
3. Chooses expertise level for each
4. For "Certified" level, provides certification proof
5. System validates and stores skills
6. If certification required, skills marked for admin review

### Customer Submits Ticket

1. Customer selects category hierarchy
2. Optionally selects tech stack (e.g., "Node.js", "React")
3. System automatically determines complexity tier based on:
   - Selected priority
   - Category
   - Time estimate

### Customer Views Qualified Experts

1. Ticket detail page shows "Qualified Experts" section
2. System queries experts with:
   - Matching skills
   - Rating >= tier threshold
   - Verified skills
3. Customer sees:
   - Expert name
   - Star rating
   - Completed tickets count
   - Verification badge

### Expert Claims Ticket

1. Expert clicks "Claim" on available ticket
2. System checks eligibility:
   - `validateCreditDeduction()` - Credits available
   - `checkExpertEligibility()` - Meets rating/experience
3. If eligible, claim is approved
4. Stats update on ticket resolution:
   - `updateStatsOnResolution()` called
   - Category stats updated
   - Rating recalculated

---

## Testing

Run expert service tests:

```bash
cd backend
npm test -- expertService.test.js
```

### Test Coverage

| Category | Tests |
|----------|-------|
| Tech Stack Structure | 15 |
| Technology Lookup | 10 |
| Expertise Levels | 6 |
| Complexity Tiers | 8 |
| Eligibility Checks | 8 |
| Popular Technologies | 6 |
| Mobile Technologies | 3 |
| Cloud Technologies | 5 |
| Database Technologies | 4 |
| Statistics | 4 |
| **Total** | **68** |

---

## Frontend Integration

### SubmitTicket.jsx

The ticket form now includes a tech stack dropdown:

```jsx
// Selected technologies stored in state
const [selectedTechs, setSelectedTechs] = useState([]);

// On submit, included in ticket data
const ticketData = {
  ...
  tech_stack: selectedTechs.map(t => t.id)
};
```

### API Integration

```javascript
// Get technologies for dropdown
const technologies = await api.expert.getTechnologies();

// Get qualified experts for a ticket
const experts = await api.expert.getQualifiedExperts(category, complexity);

// Update own skills
await api.expert.updateSkills(skills);
```

---

## References

- [Validation](./Validation.md) - Tech stack validation rules
- [Notifications](./Notifications.md) - Expert notification events
- [Error Handling](./Error-Handling.md) - Error codes
