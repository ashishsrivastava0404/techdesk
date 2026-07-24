import { useEffect } from 'react';
import { useBrand } from '../context/BrandContext.jsx';
import { useLocation } from 'react-router-dom';

export default function BrandSEO() {
  const { brand } = useBrand();
  const location = useLocation();

  useEffect(() => {
    const appName = brand.app_name || 'TechDesk';
    const companyName = brand.company_name || '';
    const websiteUrl = brand.website_url || 'https://app.example.com';

    // Update page title
    document.title = `${appName}${getPageSuffix(location.pathname)}`;

    // Update meta tags
    const updateMeta = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`) || 
                  document.querySelector(`meta[property="${name}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      }
    };

    const updateOgMeta = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      }
    };

    // Update title meta tags
    updateMeta('title', `${appName}${getPageSuffix(location.pathname)}`);
    updateMeta('author', companyName || appName);
    updateOgMeta('og:title', `${appName}${getPageSuffix(location.pathname)}`);
    updateOgMeta('og:site_name', appName);
    updateOgMeta('twitter:title', `${appName}${getPageSuffix(location.pathname)}`);

    // Update favicon if set
    if (brand.app_favicon_url) {
      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon) {
        favicon.setAttribute('href', brand.app_favicon_url);
      }
    }

    // Update Apple touch icon
    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleIcon && brand.app_favicon_url) {
      appleIcon.setAttribute('href', brand.app_favicon_url);
    }

    // Update Apple web app title
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) {
      appleTitle.setAttribute('content', appName);
    }

    // Update theme color
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute('content', '#6366f1');
    }

  }, [brand, location.pathname]);

  return null;
}

function getPageSuffix(pathname) {
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

  // Check for admin pages
  if (pathname.startsWith('/admin')) {
    return ' Admin';
  }

  return pageNames[pathname] || '';
}
