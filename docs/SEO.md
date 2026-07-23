# Promote — SEO (Search Engine Optimization) Guide

## Overview

Promote implements comprehensive SEO best practices including meta tags, structured data, sitemaps, and proper robots configuration. This ensures the platform ranks well in search engines and shares properly on social media.

---

## Meta Tags

### Location
`frontend/index.html`

### Primary Meta Tags

```html
<!-- Primary Meta Tags -->
<title>Promote — Earn Production Access Through Quality Work</title>
<meta name="title" content="Promote — Earn Production Access Through Quality Work" />
<meta name="description" content="A gamified ticketing platform where developers earn production access by resolving staging and dev environment tickets. Build reputation, climb the ladder, get promoted!" />
<meta name="keywords" content="developer ticketing, staging tickets, dev environment, production access, tech platform, reputation system, developer promotion" />
<meta name="author" content="Promote" />
<meta name="robots" content="index, follow" />
```

### Open Graph (Facebook/Meta)

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://promote.example.com/" />
<meta property="og:title" content="Promote — Earn Production Access Through Quality Work" />
<meta property="og:description" content="A gamified ticketing platform where developers earn production access by resolving staging and dev environment tickets." />
<meta property="og:image" content="https://promote.example.com/og-image.png" />
<meta property="og:site_name" content="Promote" />
```

### Twitter Cards

```html
<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="https://promote.example.com/" />
<meta property="twitter:title" content="Promote — Earn Production Access Through Quality Work" />
<meta property="twitter:description" content="A gamified ticketing platform where developers earn production access by resolving staging and dev environment tickets." />
<meta property="twitter:image" content="https://promote.example.com/og-image.png" />
```

### Meta Tags Reference

| Tag | Purpose | Platform |
|-----|---------|----------|
| `title` | Page title | All |
| `description` | Page summary | All |
| `keywords` | Search terms | Some engines |
| `author` | Content author | Some engines |
| `robots` | Crawling directives | All |
| `og:*` | Open Graph | Facebook, LinkedIn |
| `twitter:*` | Twitter Cards | Twitter |

---

## Canonical URL

```html
<!-- Canonical URL -->
<link rel="canonical" href="https://promote.example.com/" />
```

**Best Practice:** Always include a canonical tag to prevent duplicate content issues.

---

## Favicon Configuration

### Adaptive Favicons

```html
<!-- Favicon with Dark/Light mode support -->
<link rel="icon" href="/icon.svg" type="image/svg+xml" />
<link rel="icon" href="/icon-dark.svg" media="(prefers-color-scheme: dark)" />
<link rel="icon" href="/icon-light.svg" media="(prefers-color-scheme: light)" />
<link rel="apple-touch-icon" href="/icon.svg" />
```

---

## Sitemap (sitemap.xml)

### Location
`frontend/public/sitemap.xml`

### Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.s3maps.org/schemas/sitemap/0.9">
  <!-- Public Pages -->
  <url>
    <loc>https://promote.example.com/</loc>
    <lastmod>2026-07-23</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://promote.example.com/login</loc>
    <lastmod>2026-07-23</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://promote.example.com/signup</loc>
    <lastmod>2026-07-23</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://promote.example.com/faq</loc>
    <lastmod>2026-07-23</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://promote.example.com/pricing</loc>
    <lastmod>2026-07-23</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://promote.example.com/terms</loc>
    <lastmod>2026-07-23</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://promote.example.com/privacy</loc>
    <lastmod>2026-07-23</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://promote.example.com/cookies</loc>
    <lastmod>2026-07-23</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

### Sitemap Attributes

| Attribute | Description |
|-----------|-------------|
| `<loc>` | URL of the page (absolute URL required) |
| `<lastmod>` | Last modification date (YYYY-MM-DD) |
| `<changefreq>` | How often the page changes |
| `<priority>` | Priority relative to other pages (0.0-1.0) |

### Change Frequency Values

| Value | Use Case |
|-------|----------|
| `always` | Dynamic content (multiple times per day) |
| `hourly` | Frequently updated |
| `daily` | Updated every day |
| `weekly` | Updated weekly |
| `monthly` | Updated monthly |
| `yearly` | Rarely changes |
| `never` | Archive content |

---

## robots.txt

### Location
`frontend/public/robots.txt`

### Configuration

```txt
# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /submit/
Disallow: /available/
Disallow: /mytickets/
Disallow: /leaderboard/
Disallow: /earnings/
Disallow: /settings/
Disallow: /notifications/
Disallow: /reset-password
Disallow: /forgot-password
Disallow: /billing
Disallow: /crm
Disallow: /leads
Disallow: /requests

# Allow public marketing pages
Allow: /faq
Allow: /pricing
Allow: /terms
Allow: /privacy
Allow: /cookies
Allow: /help

# Allow search engines to crawl sitemap
Sitemap: https://promote.example.com/sitemap.xml

# Crawl delay for politeness
Crawl-delay: 1
```

### robots.txt Directives

| Directive | Description |
|-----------|-------------|
| `User-agent` | Target crawler |
| `Allow` | Pages that can be crawled |
| `Disallow` | Pages that cannot be crawled |
| `Sitemap` | Location of sitemap |
| `Crawl-delay` | Delay between requests |

---

## JSON-LD Structured Data

### Location
`frontend/index.html`

### Organization Schema

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Promote",
  "url": "https://promote.example.com",
  "logo": "https://promote.example.com/icon.svg",
  "description": "A gamified ticketing platform where developers earn production access through quality work",
  "sameAs": [
    "https://twitter.com/promote",
    "https://github.com/promote"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@promote.example.com"
  }
}
</script>
```

### Structured Data Types

| Type | Use Case | Pages |
|------|----------|-------|
| Organization | Brand information | All |
| WebSite | Site-wide info | Landing |
| SoftwareApplication | App details | Landing |
| FAQPage | FAQ content | /faq |
| BreadcrumbList | Navigation | Inner pages |

---

## Page-Specific SEO

### Landing Page (/, /landing)

**Priority: 1.0** (highest)

```html
<title>Promote — Earn Production Access Through Quality Work</title>
<meta name="description" content="Join the premier platform where developers earn production access by resolving staging and dev environment tickets. Build reputation, climb the ladder, get promoted!" />
```

### Authentication Pages (/login, /signup)

**Priority: 0.8**

```html
<title>Login | Promote — Earn Production Access</title>
<meta name="description" content="Sign in to your Promote account to manage tickets, track earnings, and connect with developers." />
```

### Marketing Pages (/faq, /pricing)

**Priority: 0.7-0.8**

```html
<!-- FAQ Page -->
<title>FAQ | Promote — Frequently Asked Questions</title>
<meta name="description" content="Find answers to common questions about Promote, the developer ticketing platform." />

<!-- Pricing Page -->
<title>Pricing | Promote — Simple, Transparent Pricing</title>
<meta name="description" content="Learn about Promote's pricing plans for customers and developers. No hidden fees." />
```

### Legal Pages (/terms, /privacy, /cookies)

**Priority: 0.5**

```html
<title>Terms of Service | Promote</title>
<meta name="description" content="Read the Terms of Service for using the Promote platform." />
```

---

## SEO Best Practices

### ✅ Implemented
- [x] Descriptive page titles (< 60 characters)
- [x] Unique meta descriptions (< 160 characters)
- [x] Proper heading hierarchy (H1, H2, H3)
- [x] Semantic HTML5 elements
- [x] Alt text for images
- [x] Mobile-responsive design
- [x] Fast page load times
- [x] HTTPS enabled
- [x] Sitemap.xml submitted to Google
- [x] robots.txt configured
- [x] Open Graph tags for social sharing
- [x] Twitter Card meta tags
- [x] Canonical URLs

### 🚧 Future Enhancements
- [ ] OG image (1200x630 recommended)
- [ ] Breadcrumb structured data
- [ ] Video content with schema
- [ ] Local business schema (if applicable)
- [ ] Review/rating schema

---

## SEO Testing Tools

### Google Tools
- [Google Search Console](https://search.google.com/search-console)
- [Google PageSpeed Insights](https://pagespeed.web.dev)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

### Third-Party Tools
- [Schema.org Validator](https://validator.schema.org)
- [Sitemap Validator](https://www.xml-sitemaps.com/validate-sitemap.html)
- [Open Graph Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### SEO Audit Checklist

- [ ] Title tags present and unique
- [ ] Meta descriptions present
- [ ] H1 tags present (one per page)
- [ ] Images have alt text
- [ ] Links have descriptive text
- [ ] Page loads under 3 seconds
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Sitemap.xml accessible
- [ ] robots.txt not blocking content
- [ ] Open Graph tags configured
- [ ] Structured data valid

---

## Performance Optimization

### Image Optimization
```html
<!-- Use WebP with fallback -->
<picture>
  <source srcset="/image.webp" type="image/webp">
  <img src="/image.png" alt="Description" loading="lazy" />
</picture>
```

### Lazy Loading
```html
<!-- Native lazy loading -->
<img src="/image.jpg" loading="lazy" alt="Description" />
```

### Preconnect to External Resources
```html
<!-- Preconnect to fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet" />
```

---

## Analytics Integration

### Google Analytics 4

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Component Integration

```jsx
// frontend/src/components/Analytics.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Analytics = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Track page views
    if (window.gtag) {
      window.gtag('config', 'G-XXXXXXXXXX', {
        page_path: location.pathname,
      });
    }
  }, [location]);
  
  return null;
};

export default Analytics;
```
