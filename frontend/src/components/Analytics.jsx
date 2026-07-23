import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Replace with your actual GA measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

export default function Analytics() {
  const location = useLocation();

  useEffect(() => {
    // Check if user has consented to analytics cookies
    const consent = localStorage.getItem('cookie_consent');
    if (consent) {
      try {
        const preferences = JSON.parse(consent);
        if (!preferences.analytics) {
          return; // User opted out of analytics
        }
      } catch (e) {
        return;
      }
    } else {
      return; // No consent given yet
    }

    // Load GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      page_path: location.pathname,
      cookie_flags: 'SameSite=None;Secure'
    });

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search
      });
    }
  }, [location]);

  return null;
}

// Helper function to track custom events
export const trackEvent = (action, category, label, value) => {
  if (window.gtag && typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

// Predefined event helpers
export const trackSignup = (method) => {
  trackEvent('sign_up', 'engagement', method);
};

export const trackLogin = (method) => {
  trackEvent('login', 'engagement', method);
};

export const trackTicketSubmit = (priority) => {
  trackEvent('ticket_submit', 'conversion', priority);
};

export const trackTicketResolve = (timeToResolve) => {
  trackEvent('ticket_resolve', 'conversion', 'resolved', timeToResolve);
};

export const trackPageView = (pageName) => {
  trackEvent('page_view', 'navigation', pageName);
};
