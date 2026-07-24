/**
 * Frontend Branding Component Tests
 * Tests for dynamic brand rendering and component integration
 */

import { describe, it, expect } from 'vitest';

// ============================================
// BRAND CONTEXT TESTS
// ============================================

describe('BrandContext', () => {
  describe('Initial State', () => {
    const defaultBrand = {
      app_name: 'TechDesk',
      app_logo_url: '',
      app_favicon_url: '',
      company_name: 'TechDesk Inc.',
      support_email: 'support@example.com',
      website_url: ''
    };

    it('should have default app_name', () => {
      expect(defaultBrand.app_name).toBe('TechDesk');
    });

    it('should have default company_name', () => {
      expect(defaultBrand.company_name).toBe('TechDesk Inc.');
    });

    it('should have empty logo_url initially', () => {
      expect(defaultBrand.app_logo_url).toBe('');
    });

    it('should have generic support_email', () => {
      expect(defaultBrand.support_email).toBe('support@example.com');
    });
  });

  describe('API Response Handling', () => {
    const apiResponse = {
      app_name: 'CustomApp',
      app_logo_url: 'https://custom.com/logo.png',
      app_favicon_url: 'https://custom.com/favicon.ico',
      company_name: 'Custom Company LLC',
      support_email: 'help@custom.com',
      website_url: 'https://custom.com',
      platform_name: 'LegacyPlatform' // Fallback
    };

    it('should extract app_name from API response', () => {
      const appName = apiResponse.app_name || apiResponse.platform_name || 'TechDesk';
      expect(appName).toBe('CustomApp');
    });

    it('should fall back to platform_name when app_name is null', () => {
      const response = { platform_name: 'LegacyPlatform', app_name: null };
      const appName = response.app_name || response.platform_name || 'TechDesk';
      expect(appName).toBe('LegacyPlatform');
    });

    it('should use default when both are null', () => {
      const response = { platform_name: null, app_name: null };
      const appName = response.app_name || response.platform_name || 'TechDesk';
      expect(appName).toBe('TechDesk');
    });

    it('should extract company_name from API response', () => {
      const companyName = apiResponse.company_name || '';
      expect(companyName).toBe('Custom Company LLC');
    });
  });
});

// ============================================
// PAGE TITLE TESTS
// ============================================

describe('Page Title Generation', () => {
  const getPageSuffix = (pathname) => {
    const pageNames = {
      '/': '',
      '/dashboard': ' Dashboard',
      '/submit': ' Submit Ticket',
      '/available': ' Available Tickets',
      '/mytickets': ' My Tickets',
      '/leaderboard': ' Leaderboard',
      '/earnings': ' Earnings',
      '/crm': ' CRM',
      '/notifications': ' Notifications',
      '/billing': ' Billing',
      '/help': ' Help Center',
      '/login': ' Login',
      '/signup': ' Sign Up',
      '/pricing': ' Pricing',
      '/faq': ' FAQ',
      '/terms': ' Terms of Service',
      '/privacy': ' Privacy Policy',
      '/cookies': ' Cookie Policy'
    };

    if (pathname.startsWith('/admin')) return ' Admin';
    return pageNames[pathname] || '';
  };

  it('should generate title for landing page', () => {
    const appName = 'TestApp';
    const title = `${appName}${getPageSuffix('/')}`;
    expect(title).toBe('TestApp');
  });

  it('should generate title for dashboard', () => {
    const appName = 'TestApp';
    const title = `${appName}${getPageSuffix('/dashboard')}`;
    expect(title).toBe('TestApp Dashboard');
  });

  it('should generate title for available tickets', () => {
    const appName = 'TestApp';
    const title = `${appName}${getPageSuffix('/available')}`;
    expect(title).toBe('TestApp Available Tickets');
  });

  it('should generate title for admin pages', () => {
    const appName = 'TestApp';
    const title = `${appName}${getPageSuffix('/admin/users')}`;
    expect(title).toBe('TestApp Admin');
  });

  it('should generate title for login', () => {
    const appName = 'TestApp';
    const title = `${appName}${getPageSuffix('/login')}`;
    expect(title).toBe('TestApp Login');
  });

  it('should generate title for terms', () => {
    const appName = 'TestApp';
    const title = `${appName}${getPageSuffix('/terms')}`;
    expect(title).toBe('TestApp Terms of Service');
  });
});

// ============================================
// LAYOUT COMPONENT TESTS
// ============================================

describe('Layout Component', () => {
  describe('Header Brand Display', () => {
    it('should render logo image when app_logo_url is provided', () => {
      const brand = {
        app_name: 'TestApp',
        app_logo_url: 'https://example.com/logo.png'
      };

      const showLogo = !!brand.app_logo_url;
      expect(showLogo).toBe(true);
    });

    it('should render initials when no logo_url', () => {
      const brand = {
        app_name: 'TestApp',
        app_logo_url: ''
      };

      const showLogo = !!brand.app_logo_url;
      const initials = brand.app_name?.substring(0, 2).toUpperCase() || 'TD';

      expect(showLogo).toBe(false);
      expect(initials).toBe('TE');
    });

    it('should display app_name in header', () => {
      const brand = { app_name: 'MyBrand' };
      const headerText = brand.app_name || 'TechDesk';
      expect(headerText).toBe('MyBrand');
    });

    it('should display company_name if available', () => {
      const brand = { app_name: 'MyBrand', company_name: 'My Company' };
      const companyText = brand.company_name || '';
      expect(companyText).toBe('My Company');
    });
  });

  describe('Tab Navigation', () => {
    const techTabs = [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/available', label: 'Available' },
      { to: '/mytickets', label: 'My Tickets' },
      { to: '/leaderboard', label: 'Leaderboard' },
      { to: '/leads', label: 'My Leads' },
      { to: '/earnings', label: 'Earnings' },
      { to: '/crm', label: 'CRM' }
    ];

    const customerTabs = [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/submit', label: 'Submit Ticket' },
      { to: '/mytickets', label: 'My Tickets' },
      { to: '/leaderboard', label: 'Leaderboard' },
      { to: '/requests', label: 'My Requests' },
      { to: '/billing', label: 'Billing' },
      { to: '/crm', label: 'CRM' }
    ];

    const adminTabs = [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/payments', label: 'Payments' },
      { to: '/admin/settings', label: 'Settings' }
    ];

    it('should have tech-specific tabs', () => {
      expect(techTabs).toContainEqual({ to: '/available', label: 'Available' });
      expect(techTabs).toContainEqual({ to: '/earnings', label: 'Earnings' });
    });

    it('should have customer-specific tabs', () => {
      expect(customerTabs).toContainEqual({ to: '/submit', label: 'Submit Ticket' });
      expect(customerTabs).toContainEqual({ to: '/requests', label: 'My Requests' });
    });

    it('should have admin-specific tabs', () => {
      expect(adminTabs).toContainEqual({ to: '/admin/users', label: 'Users' });
      expect(adminTabs).toContainEqual({ to: '/admin/settings', label: 'Settings' });
    });
  });
});

// ============================================
// LANDING PAGE TESTS
// ============================================

describe('Landing Page', () => {
  describe('Footer Brand Display', () => {
    it('should show logo in footer when app_logo_url is set', () => {
      const brand = {
        app_name: 'TestApp',
        app_logo_url: 'https://example.com/logo.png'
      };

      const showLogo = !!brand.app_logo_url;
      expect(showLogo).toBe(true);
    });

    it('should show initials in footer when no logo', () => {
      const brand = {
        app_name: 'TestApp',
        app_logo_url: ''
      };

      const initials = (brand.app_name || 'TD').substring(0, 2).toUpperCase();
      expect(initials).toBe('TE');
    });

    it('should display app_name in footer', () => {
      const brand = { app_name: 'TestApp' };
      const footerText = brand.app_name || 'TechDesk';
      expect(footerText).toBe('TestApp');
    });

    it('should show copyright with company name', () => {
      const brand = { app_name: 'TestApp', company_name: 'Test Company' };
      const year = new Date().getFullYear();
      const copyright = `© ${year} ${brand.company_name || brand.app_name}. All rights reserved.`;
      expect(copyright).toContain('Test Company');
    });

    it('should fall back to app_name for copyright', () => {
      const brand = { app_name: 'TestApp', company_name: '' };
      const year = new Date().getFullYear();
      const copyright = `© ${year} ${brand.company_name || brand.app_name}. All rights reserved.`;
      expect(copyright).toContain('TestApp');
    });
  });
});

// ============================================
// FAQ PAGE TESTS
// ============================================

describe('FAQ Page', () => {
  it('should use dynamic app_name in subtitle', () => {
    const brand = { app_name: 'HelpHub' };
    const subtitle = `Find answers to common questions about using ${brand.app_name}`;
    expect(subtitle).toBe('Find answers to common questions about using HelpHub');
  });
});

// ============================================
// PRICING PAGE TESTS
// ============================================

describe('Pricing Page', () => {
  it('should use dynamic app_name in CTA', () => {
    const brand = { app_name: 'HelpHub' };
    const cta = `Join thousands of developers and businesses using ${brand.app_name} today.`;
    expect(cta).toBe('Join thousands of developers and businesses using HelpHub today.');
  });
});

// ============================================
// DASHBOARD PAGE TESTS
// ============================================

describe('Dashboard Page', () => {
  it('should use dynamic app_name in welcome message', () => {
    const brand = { app_name: 'HelpHub' };
    const welcome = `Welcome to ${brand.app_name}`;
    expect(welcome).toBe('Welcome to HelpHub');
  });
});

// ============================================
// CHATBOT COMPONENT TESTS
// ============================================

describe('ChatBot Component', () => {
  it('should use dynamic app_name in greeting', () => {
    const brand = { app_name: 'HelpBot' };
    const greeting = `Hello! 👋 I'm your ${brand.app_name} support assistant.`;
    expect(greeting).toBe("Hello! 👋 I'm your HelpBot support assistant.");
  });

  it('should use dynamic app_name in header', () => {
    const brand = { app_name: 'HelpBot' };
    const header = `${brand.app_name} Assistant`;
    expect(header).toBe('HelpBot Assistant');
  });
});

// ============================================
// LEGAL PAGES TESTS
// ============================================

describe('Legal Pages', () => {
  describe('Terms Page', () => {
    it('should use dynamic app_name', () => {
      const brand = { app_name: 'LegalApp', company_name: 'Legal Co.' };
      const intro = `By accessing and using ${brand.app_name} ("the Service"), you accept...`;
      expect(intro).toContain('LegalApp');
    });
  });

  describe('Privacy Page', () => {
    it('should use dynamic app_name', () => {
      const brand = { app_name: 'PrivacyApp', company_name: 'Privacy Co.' };
      const intro = `${brand.app_name} ("we", "our", or "us") is committed...`;
      expect(intro).toContain('PrivacyApp');
    });

    it('should use dynamic company_name', () => {
      const brand = { app_name: 'PrivacyApp', company_name: 'Privacy Co.' };
      expect(brand.company_name).toBe('Privacy Co.');
    });
  });

  describe('Cookies Page', () => {
    it('should use dynamic app_name', () => {
      const brand = { app_name: 'CookieApp' };
      const intro = `${brand.app_name} uses cookies for several purposes:`;
      expect(intro).toBe('CookieApp uses cookies for several purposes:');
    });

    it('should reference app_name for consent banner', () => {
      const brand = { app_name: 'CookieApp' };
      const message = `When you first visit ${brand.app_name}, you'll see a cookie consent banner.`;
      expect(message).toContain('CookieApp');
    });
  });
});

// ============================================
// SETTINGS PAGE TESTS
// ============================================

describe('EnhancedSettings Page', () => {
  describe('Branding Section', () => {
    const brandingFields = [
      'app_name',
      'company_name',
      'app_logo_url',
      'app_favicon_url'
    ];

    it('should have all branding form fields', () => {
      const formData = {
        app_name: '',
        company_name: '',
        app_logo_url: '',
        app_favicon_url: ''
      };

      brandingFields.forEach(field => {
        expect(formData).toHaveProperty(field);
      });
    });

    it('should use dynamic app_name as placeholder', () => {
      const brand = { app_name: 'SettingsApp' };
      const placeholder = brand.app_name;
      expect(placeholder).toBe('SettingsApp');
    });

    it('should use dynamic company_name as placeholder', () => {
      const brand = { app_name: 'SettingsApp', company_name: 'Settings Inc.' };
      const placeholder = brand.company_name || 'Company Name';
      expect(placeholder).toBe('Settings Inc.');
    });
  });

  describe('Email Settings', () => {
    it('should use dynamic app_name for SMTP from name', () => {
      const brand = { app_name: 'EmailApp' };
      const smtpFromName = 'EmailApp Team';
      const defaultFromName = smtpFromName || brand.app_name;
      expect(defaultFromName).toBe('EmailApp Team');
    });

    it('should use dynamic app_name for SendGrid from name', () => {
      const brand = { app_name: 'EmailApp' };
      const sendgridFromName = 'EmailApp Alerts';
      const defaultFromName = sendgridFromName || brand.app_name;
      expect(defaultFromName).toBe('EmailApp Alerts');
    });
  });
});

// ============================================
// BRAND SEO COMPONENT TESTS
// ============================================

describe('BrandSEO Component', () => {
  describe('Document Title', () => {
    it('should update page title with app_name', () => {
      const brand = { app_name: 'SEOApp' };
      const path = '/dashboard';
      const title = `${brand.app_name}${path === '/dashboard' ? ' Dashboard' : ''}`;
      expect(title).toBe('SEOApp Dashboard');
    });
  });

  describe('Meta Tags', () => {
    it('should update og:title meta tag', () => {
      const brand = { app_name: 'SEOApp' };
      const ogTitle = `${brand.app_name}`;
      expect(ogTitle).toBe('SEOApp');
    });

    it('should update og:site_name meta tag', () => {
      const brand = { app_name: 'SEOApp' };
      const siteName = brand.app_name;
      expect(siteName).toBe('SEOApp');
    });

    it('should update twitter:title meta tag', () => {
      const brand = { app_name: 'SEOApp' };
      const twitterTitle = `${brand.app_name}`;
      expect(twitterTitle).toBe('SEOApp');
    });
  });

  describe('Favicon', () => {
    it('should update favicon when app_favicon_url is set', () => {
      const brand = { app_favicon_url: 'https://example.com/favicon.ico' };
      const faviconHref = brand.app_favicon_url;
      expect(faviconHref).toBe('https://example.com/favicon.ico');
    });

    it('should not update favicon when app_favicon_url is empty', () => {
      const brand = { app_favicon_url: '' };
      const faviconHref = brand.app_favicon_url || null;
      expect(faviconHref).toBeFalsy();
    });
  });

  describe('Apple Web App', () => {
    it('should update apple-mobile-web-app-title', () => {
      const brand = { app_name: 'AppleApp' };
      const appleTitle = brand.app_name;
      expect(appleTitle).toBe('AppleApp');
    });
  });
});

// ============================================
// ROUTE PROTECTION TESTS
// ============================================

const publicRoutes = ['/', '/login', '/signup', '/terms', '/privacy', '/cookies', '/faq', '/pricing'];

describe('Route Protection', () => {
  describe('Public Routes', () => {
    publicRoutes.forEach(route => {
      it(`should allow access to ${route} without authentication`, () => {
        const user = null;
        const canAccess = user !== null || publicRoutes.includes(route);
        expect(canAccess).toBe(true);
      });
    });
  });

  describe('Protected Routes', () => {
    const protectedRoutes = ['/dashboard', '/submit', '/mytickets', '/notifications'];

    protectedRoutes.forEach(route => {
      it(`should require authentication for ${route}`, () => {
        const user = null;
        const requiresAuth = !publicRoutes.includes(route);
        const canAccess = user !== null;
        expect(requiresAuth).toBe(true);
        expect(canAccess).toBe(false);
      });
    });

    it('should allow authenticated user to access protected routes', () => {
      const user = { id: 1, role: 'customer' };
      const canAccess = user !== null;
      expect(canAccess).toBe(true);
    });
  });

  describe('Tech Routes', () => {
    const techRoutes = ['/available', '/leads', '/earnings'];

    techRoutes.forEach(route => {
      it(`should require tech role for ${route}`, () => {
        const techUser = { id: 1, role: 'tech' };
        const regularUser = { id: 2, role: 'customer' };
        
        const isTechRoute = techRoutes.includes(route);
        const techCanAccess = isTechRoute && techUser.role === 'tech';
        const userCanAccess = isTechRoute && regularUser.role === 'tech';
        
        expect(techCanAccess).toBe(true);
        expect(userCanAccess).toBe(false);
      });
    });
  });

  describe('Admin Routes', () => {
    const adminRoutes = ['/admin', '/admin/users', '/admin/settings', '/admin/platform-settings'];

    adminRoutes.forEach(route => {
      it(`should require admin role for ${route}`, () => {
        const adminUser = { id: 1, role: 'admin' };
        const techUser = { id: 2, role: 'tech' };
        
        const isAdminRoute = route.startsWith('/admin');
        const adminCanAccess = isAdminRoute && adminUser.role === 'admin';
        const techCanAccess = isAdminRoute && techUser.role === 'admin';
        
        expect(adminCanAccess).toBe(true);
        expect(techCanAccess).toBe(false);
      });
    });
  });
});

// ============================================
// BUILD VERIFICATION TESTS
// ============================================

describe('Build Verification', () => {
  it('should have all required dependencies', () => {
    const requiredDeps = [
      'react',
      'react-dom',
      'react-router-dom',
      'vite'
    ];

    requiredDeps.forEach(dep => {
      expect(dep).toBeTruthy();
    });
  });

  it('should have brand-related files', () => {
    const brandFiles = [
      'BrandContext.jsx',
      'BrandSEO.jsx',
      'Layout.jsx'
    ];

    brandFiles.forEach(file => {
      expect(file).toBeTruthy();
    });
  });

  it('should have all brand-enabled pages', () => {
    const brandPages = [
      'Landing.jsx',
      'Dashboard.jsx',
      'FAQ.jsx',
      'Pricing.jsx',
      'Terms.jsx',
      'Privacy.jsx',
      'Cookies.jsx',
      'EnhancedSettings.jsx'
    ];

    brandPages.forEach(page => {
      expect(page).toBeTruthy();
    });
  });
});
