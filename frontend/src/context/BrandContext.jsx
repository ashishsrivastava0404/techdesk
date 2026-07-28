import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/index.js';
import { useApp } from './AppContext.jsx';

const BrandContext = createContext({
  brand: {
    app_name: 'TechDesk',
    app_logo_url: '',
    app_favicon_url: '',
    company_name: 'TechDesk Inc.',
    support_email: 'support@techdesk.com',
    website_url: 'https://techdesk.example.com',
    terms_url: '/terms',
    privacy_url: '/privacy',
    cookies_url: '/cookies'
  },
  loading: true
});

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState({
    app_name: 'TechDesk',
    app_logo_url: '',
    app_favicon_url: '',
    company_name: 'TechDesk Inc.',
    support_email: 'support@techdesk.com',
    website_url: 'https://techdesk.example.com',
    terms_url: '/terms',
    privacy_url: '/privacy',
    cookies_url: '/cookies'
  });
  const [loading, setLoading] = useState(true);
  const { user } = useApp();

  useEffect(() => {
    // Only load admin settings if user is admin
    if (user?.role === 'admin') {
      loadBrandSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadBrandSettings = async () => {
    try {
      const data = await api.admin.getSettings();
      if (data) {
        setBrand({
          app_name: data.app_name || data.platform_name || 'TechDesk',
          app_logo_url: data.app_logo_url || data.logo_url || '',
          app_favicon_url: data.app_favicon_url || '',
          company_name: data.company_name || '',
          support_email: data.support_email || 'support@example.com',
          website_url: data.website_url || '',
          terms_url: data.terms_url || '/terms',
          privacy_url: data.privacy_url || '/privacy',
          cookies_url: data.cookies_url || '/cookies'
        });
      }
    } catch (error) {
      // Silently fail for non-admin users - use default brand settings
      console.log('Brand settings not available (admin only)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrandContext.Provider value={{ brand, loading, reloadBrand: loadBrandSettings }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() { return useContext(BrandContext); }
