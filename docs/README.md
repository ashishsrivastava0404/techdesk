# TechDesk Documentation

Welcome to the TechDesk documentation. This folder contains comprehensive guides for all aspects of the application.

## Documentation Index

### Getting Started
- [Architecture.md](./Architecture.md) - System architecture overview
- [Phases.md](./Phases.md) - Development phases

### Core Features
- [Database.md](./Database.md) - Database schema and models
- [TicketCategories.md](./TicketCategories.md) - Ticket category system
- [ThreadedDiscussions.md](./ThreadedDiscussions.md) - Discussion system

### Security & Performance
- [Security.md](./Security.md) - Security practices
- [Redis.md](./Redis.md) - Caching with Redis
- [PWA.md](./PWA.md) - Progressive Web App setup

### User Experience
- [SEO.md](./SEO.md) - SEO optimization
- [Prompts.md](./Prompts.md) - UI prompts and messages
- [GlobalExpansion.md](./GlobalExpansion.md) - Internationalization

### Integrations
- [MessagingIntegration.md](./MessagingIntegration.md) - Email, SMS, Push notifications
- [Error-Handling.md](./Error-Handling.md) - Error handling patterns

### Testing & Deployment
- [Testing.md](./Testing.md) - Testing strategies
- [Validation.md](./Validation.md) - Validation system documentation
- [Notifications.md](./Notifications.md) - Notification system documentation
- [Routing.md](./Routing.md) - Routing system documentation
- [ExpertProfile.md](./ExpertProfile.md) - Expert profile & expertise management

### Business Logic
- [MarketingStrategy.md](./MarketingStrategy.md) - Marketing and referral system
- [support-workflow.md](./support-workflow.md) - Support workflow
- [admin-guide.md](./admin-guide.md) - Admin guide

## Quick Links

### API Documentation
- [Auth Routes](./Routing.md#api-routes) - Authentication endpoints
- [Ticket Routes](./Routing.md#api-routes) - Ticket management
- [Message Routes](./Routing.md#api-routes) - Messaging endpoints
- [Credit Routes](./Routing.md#api-routes) - Credit system

### Validation Reference
- [Error Codes](./Validation.md#error-codes) - Complete error code list
- [Form Validation](./Validation.md#form-validation) - Form validation rules
- [Database Errors](./Validation.md#database-error-handling) - DB error handling

### Testing
- Run backend tests: `cd backend && npm test`
- Run frontend tests: `cd frontend && npm test`
- Total tests: **710 tests passing**

## Recent Updates

### v1.4.0 - Master Data Management
- Added Master Data section to Admin Panel
- Categories management with hierarchy view
- Templates management with usage tracking
- Tech Stack management with certified badges
- Topic suggestions management

### v1.3.0 - Expert Profile & Expertise System
- Added ExpertProfile.md with complete expert management docs
- Added TechStack.js with 100+ technologies across 10 categories
- Added ExpertProfile component with Trust Layer UI
- Added ExpertSnippet and QualifiedExpertsList components
- Added techstack dropdown to SubmitTicket form
- Added 68 expert service tests

### v1.2.0 - Comprehensive Documentation
- Added Validation.md with complete validation system docs
- Added Notifications.md with notification system docs
- Added Routing.md with routing system docs
- Added 121 new validation tests

### v1.1.0 - Error Handling & Messaging
- Comprehensive error service
- Email/SMS/Push notification support
- User preference management

### v1.0.0 - Core Features
- User authentication
- Ticket management
- Real-time messaging
- Credit system
- Admin dashboard

## Contributing

When adding new features, please:
1. Add tests in appropriate test files
2. Update validation if needed
3. Add notification support if applicable
4. Update this documentation
5. Ensure all tests pass
