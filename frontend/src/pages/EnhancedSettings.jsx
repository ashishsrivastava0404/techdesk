import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useBrand } from '../context/BrandContext.jsx';
import { api } from '../api/index.js';

const SettingsSection = ({ title, icon, children }) => (
  <div className="settings-section">
    <div className="settings-section-header">
      <span className="settings-icon">{icon}</span>
      <h3>{title}</h3>
    </div>
    <div className="settings-section-content">
      {children}
    </div>
  </div>
);

const SettingRow = ({ label, description, children, badge }) => (
  <div className="setting-row">
    <div className="setting-info">
      <div className="setting-label-row">
        <label>{label}</label>
        {badge && <span className={`setting-badge ${badge.type}`}>{badge.text}</span>}
      </div>
      {description && <span className="setting-description">{description}</span>}
    </div>
    <div className="setting-control">
      {children}
    </div>
  </div>
);

const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <label className={`toggle-switch ${disabled ? 'disabled' : ''}`}>
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    <span className="toggle-slider"></span>
  </label>
);

const SelectField = ({ value, onChange, options, disabled }) => (
  <select 
    value={value} 
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="settings-select"
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

export default function EnhancedSettings() {
  const { user, showToast } = useApp();
  const { brand } = useBrand();
  const appName = brand.app_name || 'TechDesk';
  const companyName = brand.company_name || '';
  
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getSettings();
      setSettings(data);
      setFormData({
        // Platform Info
        platform_name: data.platform_name || appName,
        platform_tagline: data.platform_tagline || '',
        support_email: data.support_email || 'support@example.com',
        platform_url: data.platform_url || '',
        
        // Branding
        app_name: data.app_name || data.platform_name || appName,
        app_logo_url: data.app_logo_url || data.logo_url || '',
        app_favicon_url: data.app_favicon_url || '',
        company_name: data.company_name || companyName,
        website_url: data.website_url || '',
        
        // Payout & Earnings
        commission_rate: parseFloat(data.commission_rate || 0.15),
        minimum_payout: parseFloat(data.minimum_payout || 25),
        dev_ticket_pay: parseFloat(data.dev_ticket_pay || 25),
        staging_ticket_pay: parseFloat(data.staging_ticket_pay || 50),
        production_ticket_pay: parseFloat(data.production_ticket_pay || 100),
        payout_auto_approve: data.payout_auto_approve === true || data.payout_auto_approve === 'true',
        payout_schedule_days: parseInt(data.payout_schedule_days || 7),
        
        // Tier Thresholds
        dev_threshold: parseInt(data.dev_threshold || 33),
        staging_threshold: parseInt(data.staging_threshold || 66),
        production_threshold: parseInt(data.production_threshold || 100),
        
        // Ticket Credits
        credit_low_priority: parseFloat(data.credit_low_priority || 0),
        credit_normal_priority: parseFloat(data.credit_normal_priority || 0),
        credit_high_priority: parseFloat(data.credit_high_priority || 50),
        credit_urgent_priority: parseFloat(data.credit_urgent_priority || 75),
        credit_critical_priority: parseFloat(data.credit_critical_priority || 100),
        
        // Appearance
        theme: data.theme || 'dark',
        primary_color: data.primary_color || '#6366f1',
        accent_color: data.accent_color || '#f59e0b',
        logo_url: data.logo_url || '',
        
        // Notifications
        email_notifications: data.email_notifications !== false,
        push_notifications: data.push_notifications === true,
        notification_sound: data.notification_sound !== false,
        email_digest_frequency: data.email_digest_frequency || 'daily',
        
        // Moderation
        require_ticket_rating: data.require_ticket_rating !== false,
        min_rating_required: parseInt(data.min_rating_required || 1),
        allow_guest_tickets: data.allow_guest_tickets === true,
        moderation_queue: data.moderation_queue === true,
        
        // Security
        require_email_verification: data.require_email_verification === true,
        enforce_strong_passwords: data.enforce_strong_passwords !== false,
        session_timeout_minutes: parseInt(data.session_timeout_minutes || 60),
        max_login_attempts: parseInt(data.max_login_attempts || 5),
        two_factor_required: data.two_factor_required === true,
        
        // SLA
        max_ticket_age_days: parseInt(data.max_ticket_age_days || 30),
        escalation_timeout_hours: parseInt(data.escalation_timeout_hours || 24),
        auto_close_resolved_days: parseInt(data.auto_close_resolved_days || 7),
        sla_warning_threshold_hours: parseInt(data.sla_warning_threshold_hours || 8),
        
        // API & Integrations
        stripe_enabled: data.stripe_enabled !== false,
        stripe_api_key: data.stripe_api_key || '',
        stripe_secret_key: data.stripe_secret_key || '',
        stripe_webhook_secret: data.stripe_webhook_secret || '',
        paypal_enabled: data.paypal_enabled !== false,
        paypal_client_id: data.paypal_client_id || '',
        paypal_secret: data.paypal_secret || '',
        razorpay_enabled: data.razorpay_enabled === true,
        razorpay_key_id: data.razorpay_key_id || '',
        razorpay_key_secret: data.razorpay_key_secret || '',
        google_oauth_enabled: data.google_oauth_enabled !== false,
        google_client_id: data.google_client_id || '',
        google_client_secret: data.google_client_secret || '',
        sentry_enabled: data.sentry_enabled === true,
        sentry_dsn: data.sentry_dsn || '',
        openai_enabled: data.openai_enabled === true,
        openai_api_key: data.openai_api_key || '',
        allow_api_access: data.allow_api_access === true,
        
        // AWS S3
        aws_access_key_id: data.aws_access_key_id || '',
        aws_secret_access_key: data.aws_secret_access_key || '',
        aws_region: data.aws_region || 'us-east-1',
        aws_s3_bucket: data.aws_s3_bucket || '',
        
        // Cloudinary
        cloudinary_api_key: data.cloudinary_api_key || '',
        cloudinary_cloud_name: data.cloudinary_cloud_name || '',
        cloudinary_api_secret: data.cloudinary_api_secret || '',
        
        // SMTP Email
        smtp_enabled: data.smtp_enabled === true,
        smtp_host: data.smtp_host || '',
        smtp_port: data.smtp_port || '587',
        smtp_secure: data.smtp_secure !== false,
        smtp_user: data.smtp_user || '',
        smtp_pass: data.smtp_pass || '',
        smtp_from_email: data.smtp_from_email || '',
        smtp_from_name: data.smtp_from_name || appName,
        
        // SendGrid
        sendgrid_enabled: data.sendgrid_enabled === true,
        sendgrid_api_key: data.sendgrid_api_key || '',
        sendgrid_from_email: data.sendgrid_from_email || '',
        sendgrid_from_name: data.sendgrid_from_name || appName,
        
        // Twilio SMS
        twilio_enabled: data.twilio_enabled === true,
        twilio_account_sid: data.twilio_account_sid || '',
        twilio_auth_token: data.twilio_auth_token || '',
        twilio_phone_number: data.twilio_phone_number || '',
        
        // AWS Secrets Manager
        aws_secrets_manager_enabled: data.aws_secrets_manager_enabled === true,
        aws_secrets_manager_region: data.aws_secrets_manager_region || 'us-east-1',
        aws_secrets_manager_secret_prefix: data.aws_secrets_manager_secret_prefix || 'promote',
        
        // Feature Flags
        enable_leaderboard: data.enable_leaderboard !== false,
        enable_referrals: data.enable_referrals === true,
        enable_badges: data.enable_badges !== false,
        enable_chatbot: data.enable_chatbot !== false,
        maintenance_mode: data.maintenance_mode === true,
        
        // Legal
        require_terms_acceptance: data.require_terms_acceptance !== false,
        privacy_policy_url: data.privacy_policy_url || '/privacy',
        terms_url: data.terms_url || '/terms',
        cookie_policy_url: data.cookie_policy_url || '/cookies',
      });
    } catch (error) {
      showToast('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.admin.updateSettings(formData);
      showToast('Settings saved successfully!');
    } catch (error) {
      showToast('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="view-container">
        <div className="empty">
          <div className="empty-title">Settings</div>
          <p>You need admin access to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="view-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'general', icon: '🏢', label: 'General' },
    { id: 'branding', icon: '🎨', label: 'Branding' },
    { id: 'earnings', icon: '💰', label: 'Earnings' },
    { id: 'tiers', icon: '📊', label: 'Tier System' },
    { id: 'credits', icon: '🎫', label: 'Credits' },
    { id: 'appearance', icon: '✨', label: 'Appearance' },
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
    { id: 'moderation', icon: '🛡️', label: 'Moderation' },
    { id: 'security', icon: '🔐', label: 'Security' },
    { id: 'sla', icon: '⏱️', label: 'SLA' },
    { id: 'integrations', icon: '🔗', label: 'Integrations' },
    { id: 'features', icon: '⚡', label: 'Features' },
    { id: 'legal', icon: '📜', label: 'Legal' },
  ];

  return (
    <div className="enhanced-settings">
      <div className="settings-sidebar">
        <div className="settings-sidebar-header">
          <h2>Settings</h2>
          <p>Configure your platform</p>
        </div>
        <nav className="settings-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              <span className="nav-label">{section.label}</span>
            </button>
          ))}
        </nav>
        <div className="settings-sidebar-footer">
          <button 
            className="btn btn-primary btn-full" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="settings-content">
        {activeSection === 'general' && (
          <SettingsSection title="Platform Information" icon="🏢">
            <SettingRow label="Platform Name" description="Your platform's display name">
              <input
                type="text"
                value={formData.platform_name || ''}
                onChange={(e) => updateField('platform_name', e.target.value)}
                className="settings-input"
              />
            </SettingRow>
            <SettingRow label="Tagline" description="Short tagline for your platform">
              <input
                type="text"
                value={formData.platform_tagline || ''}
                onChange={(e) => updateField('platform_tagline', e.target.value)}
                className="settings-input"
              />
            </SettingRow>
            <SettingRow label="Support Email" description="Contact email for user support">
              <input
                type="email"
                value={formData.support_email || ''}
                onChange={(e) => updateField('support_email', e.target.value)}
                className="settings-input"
              />
            </SettingRow>
            <SettingRow label="Platform URL" description="Main website URL">
              <input
                type="url"
                value={formData.platform_url || ''}
                onChange={(e) => updateField('platform_url', e.target.value)}
                className="settings-input"
              />
            </SettingRow>
            <SettingRow label="Logo URL" description="URL to your platform logo (optional)">
              <input
                type="url"
                value={formData.logo_url || ''}
                onChange={(e) => updateField('logo_url', e.target.value)}
                className="settings-input"
                placeholder="https://example.com/logo.png"
              />
            </SettingRow>
          </SettingsSection>
        )}

        {activeSection === 'branding' && (
          <SettingsSection title="Branding & Identity" icon="🎨">
            <p style={{ marginBottom: '20px', color: 'var(--muted)', fontSize: '13px' }}>
              Customize your platform's visual identity. These settings update everywhere automatically.
            </p>
            
            <SettingRow label="Application Name" description="The name shown in the header and browser tab">
              <input
                type="text"
                value={formData.app_name || ''}
                onChange={(e) => updateField('app_name', e.target.value)}
                className="settings-input"
                placeholder="TechDesk"
              />
            </SettingRow>
            
            <SettingRow label="Company Name" description="Your company or organization name">
              <input
                type="text"
                value={formData.company_name || ''}
                onChange={(e) => updateField('company_name', e.target.value)}
                className="settings-input"
                placeholder="TechDesk Inc."
              />
            </SettingRow>
            
            <SettingRow label="Logo URL" description="URL to your logo image (recommended: 200x200px)">
              <input
                type="url"
                value={formData.app_logo_url || ''}
                onChange={(e) => updateField('app_logo_url', e.target.value)}
                className="settings-input"
                placeholder="https://example.com/logo.png"
              />
            </SettingRow>
            
            {formData.app_logo_url && (
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--surface-2)', borderRadius: '12px', textAlign: 'center' }}>
                <img src={formData.app_logo_url} alt="Logo Preview" style={{ maxWidth: '150px', maxHeight: '80px', objectFit: 'contain' }} />
                <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>Logo Preview</p>
              </div>
            )}
            
            <SettingRow label="Favicon URL" description="URL to your favicon (16x16 or 32x32 ICO/PNG)">
              <input
                type="url"
                value={formData.app_favicon_url || ''}
                onChange={(e) => updateField('app_favicon_url', e.target.value)}
                className="settings-input"
                placeholder="https://example.com/favicon.ico"
              />
            </SettingRow>
            
            <SettingRow label="Support Email" description="Contact email shown to users">
              <input
                type="email"
                value={formData.support_email || ''}
                onChange={(e) => updateField('support_email', e.target.value)}
                className="settings-input"
                placeholder="support@example.com"
              />
            </SettingRow>
            
            <SettingRow label="Website URL" description="Your main website URL">
              <input
                type="url"
                value={formData.website_url || ''}
                onChange={(e) => updateField('website_url', e.target.value)}
                className="settings-input"
                placeholder="https://example.com"
              />
            </SettingRow>
            
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--amber-dim)', borderRadius: '12px', border: '1px solid var(--amber)' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px' }}>💡 Preview</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                {formData.app_logo_url ? (
                  <img src={formData.app_logo_url} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', background: 'var(--amber)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000' }}>
                    {(formData.app_name || 'TD').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>{formData.app_name || 'App Name'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{formData.company_name || 'Company Name'}</div>
                </div>
              </div>
            </div>
          </SettingsSection>
        )}

        {activeSection === 'earnings' && (
          <SettingsSection title="Payout & Earnings Configuration" icon="💰">
            <SettingRow label="Commission Rate" description="Platform fee percentage (e.g., 0.15 = 15%)">
              <div className="input-with-suffix">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.commission_rate || 0}
                  onChange={(e) => updateField('commission_rate', parseFloat(e.target.value))}
                  className="settings-input"
                />
                <span className="input-suffix">%</span>
              </div>
            </SettingRow>
            <SettingRow label="Minimum Payout" description="Minimum amount for payout requests">
              <div className="input-with-suffix">
                <span className="input-prefix">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimum_payout || 0}
                  onChange={(e) => updateField('minimum_payout', parseFloat(e.target.value))}
                  className="settings-input"
                />
              </div>
            </SettingRow>
            <SettingRow label="Payout Auto-Approve" description="Automatically approve payout requests" badge={{ text: 'Use with caution', type: 'warning' }}>
              <ToggleSwitch
                checked={formData.payout_auto_approve || false}
                onChange={(val) => updateField('payout_auto_approve', val)}
              />
            </SettingRow>
            <SettingRow label="Payout Schedule" description="Days between payout processing">
              <div className="input-with-suffix">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={formData.payout_schedule_days || 7}
                  onChange={(e) => updateField('payout_schedule_days', parseInt(e.target.value))}
                  className="settings-input"
                />
                <span className="input-suffix">days</span>
              </div>
            </SettingRow>
            <div className="settings-subsection">
              <h4>Base Ticket Pay Rates</h4>
              <SettingRow label="Dev Environment" description="Base pay for dev tickets">
                <div className="input-with-suffix">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dev_ticket_pay || 0}
                    onChange={(e) => updateField('dev_ticket_pay', parseFloat(e.target.value))}
                    className="settings-input"
                  />
                </div>
              </SettingRow>
              <SettingRow label="Staging Environment" description="Base pay for staging tickets">
                <div className="input-with-suffix">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.staging_ticket_pay || 0}
                    onChange={(e) => updateField('staging_ticket_pay', parseFloat(e.target.value))}
                    className="settings-input"
                  />
                </div>
              </SettingRow>
              <SettingRow label="Production Environment" description="Base pay for production tickets">
                <div className="input-with-suffix">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.production_ticket_pay || 0}
                    onChange={(e) => updateField('production_ticket_pay', parseFloat(e.target.value))}
                    className="settings-input"
                  />
                </div>
              </SettingRow>
            </div>
          </SettingsSection>
        )}

        {activeSection === 'tiers' && (
          <SettingsSection title="Tier System Configuration" icon="📊">
            <div className="tier-preview">
              <div className="tier-card-preview dev">
                <span className="tier-name">Dev</span>
                <span className="tier-points">0 - {formData.dev_threshold} pts</span>
                <span className="tier-pay">${formData.dev_ticket_pay}/ticket</span>
              </div>
              <div className="tier-card-preview staging">
                <span className="tier-name">Staging</span>
                <span className="tier-points">{formData.dev_threshold} - {formData.staging_threshold} pts</span>
                <span className="tier-pay">${formData.staging_ticket_pay}/ticket</span>
              </div>
              <div className="tier-card-preview production">
                <span className="tier-name">Production</span>
                <span className="tier-points">{formData.staging_threshold}+ pts</span>
                <span className="tier-pay">${formData.production_ticket_pay}/ticket</span>
              </div>
            </div>
            <SettingRow label="Dev Tier Threshold" description="Points required for Dev tier">
              <input
                type="range"
                min="0"
                max="100"
                value={formData.dev_threshold || 33}
                onChange={(e) => updateField('dev_threshold', parseInt(e.target.value))}
                className="settings-range"
              />
              <span className="range-value">{formData.dev_threshold || 33} pts</span>
            </SettingRow>
            <SettingRow label="Staging Tier Threshold" description="Points required for Staging tier">
              <input
                type="range"
                min="0"
                max="200"
                value={formData.staging_threshold || 66}
                onChange={(e) => updateField('staging_threshold', parseInt(e.target.value))}
                className="settings-range"
              />
              <span className="range-value">{formData.staging_threshold || 66} pts</span>
            </SettingRow>
            <SettingRow label="Production Tier Threshold" description="Points required for Production tier">
              <input
                type="range"
                min="0"
                max="300"
                value={formData.production_threshold || 100}
                onChange={(e) => updateField('production_threshold', parseInt(e.target.value))}
                className="settings-range"
              />
              <span className="range-value">{formData.production_threshold || 100} pts</span>
            </SettingRow>
          </SettingsSection>
        )}

        {activeSection === 'credits' && (
          <SettingsSection title="Credit System Configuration" icon="🎫">
            <p className="settings-info">
              Credits are used to pay for higher priority tickets. Low and Normal priority 
              tickets are typically FREE to encourage engagement.
            </p>
            <div className="credit-cards">
              <div className="credit-card low">
                <span className="credit-name">Low Priority</span>
                <input
                  type="number"
                  value={formData.credit_low_priority || 0}
                  onChange={(e) => updateField('credit_low_priority', parseFloat(e.target.value))}
                  className="credit-input"
                />
                <span className="credit-suffix">credits</span>
                <span className="credit-note">Usually FREE</span>
              </div>
              <div className="credit-card normal">
                <span className="credit-name">Normal Priority</span>
                <input
                  type="number"
                  value={formData.credit_normal_priority || 0}
                  onChange={(e) => updateField('credit_normal_priority', parseFloat(e.target.value))}
                  className="credit-input"
                />
                <span className="credit-suffix">credits</span>
                <span className="credit-note">Usually FREE</span>
              </div>
              <div className="credit-card high">
                <span className="credit-name">High Priority</span>
                <div className="credit-with-percent">
                  <input
                    type="number"
                    value={formData.credit_high_priority || 50}
                    onChange={(e) => updateField('credit_high_priority', parseFloat(e.target.value))}
                    className="credit-input"
                  />
                  <span className="credit-suffix">%</span>
                </div>
                <span className="credit-note">of tech pay</span>
              </div>
              <div className="credit-card urgent">
                <span className="credit-name">Urgent Priority</span>
                <div className="credit-with-percent">
                  <input
                    type="number"
                    value={formData.credit_urgent_priority || 75}
                    onChange={(e) => updateField('credit_urgent_priority', parseFloat(e.target.value))}
                    className="credit-input"
                  />
                  <span className="credit-suffix">%</span>
                </div>
                <span className="credit-note">of tech pay</span>
              </div>
              <div className="credit-card critical">
                <span className="credit-name">Critical Priority</span>
                <div className="credit-with-percent">
                  <input
                    type="number"
                    value={formData.credit_critical_priority || 100}
                    onChange={(e) => updateField('credit_critical_priority', parseFloat(e.target.value))}
                    className="credit-input"
                  />
                  <span className="credit-suffix">%</span>
                </div>
                <span className="credit-note">of tech pay</span>
              </div>
            </div>
          </SettingsSection>
        )}

        {activeSection === 'appearance' && (
          <SettingsSection title="Appearance & Branding" icon="🎨">
            <SettingRow label="Theme" description="Choose your platform's color scheme">
              <SelectField
                value={formData.theme || 'dark'}
                onChange={(val) => updateField('theme', val)}
                options={[
                  { value: 'dark', label: 'Dark Mode' },
                  { value: 'light', label: 'Light Mode' },
                  { value: 'system', label: 'System Default' },
                ]}
              />
            </SettingRow>
            <SettingRow label="Primary Color" description="Main brand color for buttons and accents">
              <div className="color-input-group">
                <input
                  type="color"
                  value={formData.primary_color || '#6366f1'}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  className="settings-color"
                />
                <input
                  type="text"
                  value={formData.primary_color || '#6366f1'}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  className="settings-input color-text"
                />
              </div>
            </SettingRow>
            <SettingRow label="Accent Color" description="Secondary color for highlights">
              <div className="color-input-group">
                <input
                  type="color"
                  value={formData.accent_color || '#f59e0b'}
                  onChange={(e) => updateField('accent_color', e.target.value)}
                  className="settings-color"
                />
                <input
                  type="text"
                  value={formData.accent_color || '#f59e0b'}
                  onChange={(e) => updateField('accent_color', e.target.value)}
                  className="settings-input color-text"
                />
              </div>
            </SettingRow>
            <div className="theme-preview">
              <h4>Theme Preview</h4>
              <div 
                className="preview-card"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--line)',
                }}
              >
                <div 
                  className="preview-button primary"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  Primary Button
                </div>
                <div 
                  className="preview-button accent"
                  style={{ backgroundColor: formData.accent_color }}
                >
                  Accent Button
                </div>
              </div>
            </div>
          </SettingsSection>
        )}

        {activeSection === 'notifications' && (
          <SettingsSection title="Notification Settings" icon="🔔">
            <SettingRow label="Email Notifications" description="Send email notifications to users">
              <ToggleSwitch
                checked={formData.email_notifications !== false}
                onChange={(val) => updateField('email_notifications', val)}
              />
            </SettingRow>
            <SettingRow label="Push Notifications" description="Enable browser push notifications">
              <ToggleSwitch
                checked={formData.push_notifications || false}
                onChange={(val) => updateField('push_notifications', val)}
              />
            </SettingRow>
            <SettingRow label="Notification Sound" description="Play sound for new notifications">
              <ToggleSwitch
                checked={formData.notification_sound !== false}
                onChange={(val) => updateField('notification_sound', val)}
              />
            </SettingRow>
            <SettingRow label="Email Digest Frequency" description="How often to send email digests">
              <SelectField
                value={formData.email_digest_frequency || 'daily'}
                onChange={(val) => updateField('email_digest_frequency', val)}
                options={[
                  { value: 'realtime', label: 'Real-time' },
                  { value: 'hourly', label: 'Hourly' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'never', label: 'Never' },
                ]}
              />
            </SettingRow>
          </SettingsSection>
        )}

        {activeSection === 'moderation' && (
          <SettingsSection title="Moderation & Quality Control" icon="🛡️">
            <SettingRow label="Require Ticket Rating" description="Customers must rate before closing" badge={{ text: 'Recommended', type: 'success' }}>
              <ToggleSwitch
                checked={formData.require_ticket_rating !== false}
                onChange={(val) => updateField('require_ticket_rating', val)}
              />
            </SettingRow>
            <SettingRow label="Minimum Rating" description="Minimum star rating allowed">
              <SelectField
                value={formData.min_rating_required || 1}
                onChange={(val) => updateField('min_rating_required', parseInt(val))}
                options={[
                  { value: 1, label: '1 star (all ratings)' },
                  { value: 2, label: '2 stars' },
                  { value: 3, label: '3 stars' },
                  { value: 4, label: '4 stars (high quality)' },
                  { value: 5, label: '5 stars only' },
                ]}
              />
            </SettingRow>
            <SettingRow label="Allow Guest Tickets" description="Allow ticket submission without account">
              <ToggleSwitch
                checked={formData.allow_guest_tickets || false}
                onChange={(val) => updateField('allow_guest_tickets', val)}
              />
            </SettingRow>
            <SettingRow label="Moderation Queue" description="New tickets require approval before posting">
              <ToggleSwitch
                checked={formData.moderation_queue || false}
                onChange={(val) => updateField('moderation_queue', val)}
              />
            </SettingRow>
          </SettingsSection>
        )}

        {activeSection === 'security' && (
          <SettingsSection title="Security Settings" icon="🔐">
            <SettingRow label="Require Email Verification" description="Users must verify email before using platform">
              <ToggleSwitch
                checked={formData.require_email_verification || false}
                onChange={(val) => updateField('require_email_verification', val)}
              />
            </SettingRow>
            <SettingRow label="Enforce Strong Passwords" description="Require 8+ chars with numbers and symbols">
              <ToggleSwitch
                checked={formData.enforce_strong_passwords !== false}
                onChange={(val) => updateField('enforce_strong_passwords', val)}
              />
            </SettingRow>
            <SettingRow label="Session Timeout" description="Auto-logout after inactivity">
              <div className="input-with-suffix">
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={formData.session_timeout_minutes || 60}
                  onChange={(e) => updateField('session_timeout_minutes', parseInt(e.target.value))}
                  className="settings-input"
                />
                <span className="input-suffix">minutes</span>
              </div>
            </SettingRow>
            <SettingRow label="Max Login Attempts" description="Lock account after failed attempts">
              <div className="input-with-suffix">
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={formData.max_login_attempts || 5}
                  onChange={(e) => updateField('max_login_attempts', parseInt(e.target.value))}
                  className="settings-input"
                />
                <span className="input-suffix">attempts</span>
              </div>
            </SettingRow>
            <SettingRow label="Require 2FA" description="Mandatory two-factor authentication for all users" badge={{ text: 'Enterprise', type: 'premium' }}>
              <ToggleSwitch
                checked={formData.two_factor_required || false}
                onChange={(val) => updateField('two_factor_required', val)}
              />
            </SettingRow>
          </SettingsSection>
        )}

        {activeSection === 'sla' && (
          <SettingsSection title="SLA Configuration" icon="⏱️">
            <p className="settings-info">
              Service Level Agreement settings help ensure timely ticket resolution.
            </p>
            <SettingRow label="Max Ticket Age" description="Days before auto-escalation">
              <div className="input-with-suffix">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.max_ticket_age_days || 30}
                  onChange={(e) => updateField('max_ticket_age_days', parseInt(e.target.value))}
                  className="settings-input"
                />
                <span className="input-suffix">days</span>
              </div>
            </SettingRow>
            <SettingRow label="Escalation Timeout" description="Hours before ticket escalation">
              <div className="input-with-suffix">
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={formData.escalation_timeout_hours || 24}
                  onChange={(e) => updateField('escalation_timeout_hours', parseInt(e.target.value))}
                  className="settings-input"
                />
                <span className="input-suffix">hours</span>
              </div>
            </SettingRow>
            <SettingRow label="Auto-Close Resolved" description="Days after resolution to auto-close">
              <div className="input-with-suffix">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.auto_close_resolved_days || 7}
                  onChange={(e) => updateField('auto_close_resolved_days', parseInt(e.target.value))}
                  className="settings-input"
                />
                <span className="input-suffix">days</span>
              </div>
            </SettingRow>
            <SettingRow label="SLA Warning Threshold" description="Hours before SLA breach warning">
              <div className="input-with-suffix">
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={formData.sla_warning_threshold_hours || 8}
                  onChange={(e) => updateField('sla_warning_threshold_hours', parseInt(e.target.value))}
                  className="settings-input"
                />
                <span className="input-suffix">hours</span>
              </div>
            </SettingRow>
          </SettingsSection>
        )}

        {activeSection === 'integrations' && (
          <SettingsSection title="Payment & API Integrations" icon="🔗">
            {/* Stripe */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">💳</span>
                <span className="integration-name">Stripe</span>
                <ToggleSwitch
                  checked={formData.stripe_enabled !== false}
                  onChange={(val) => updateField('stripe_enabled', val)}
                />
              </div>
              {formData.stripe_enabled && (
                <div className="integration-fields">
                  <div className="settings-input-group">
                    <label>API Key</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.stripe_api_key || ''}
                      onChange={(e) => updateField('stripe_api_key', e.target.value)}
                      placeholder="sk_test_..."
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Secret Key</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.stripe_secret_key || ''}
                      onChange={(e) => updateField('stripe_secret_key', e.target.value)}
                      placeholder="sk_test_..."
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Webhook Secret</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.stripe_webhook_secret || ''}
                      onChange={(e) => updateField('stripe_webhook_secret', e.target.value)}
                      placeholder="whsec_..."
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Publishable Key</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.stripe_publishable_key || ''}
                      onChange={(e) => updateField('stripe_publishable_key', e.target.value)}
                      placeholder="pk_test_..."
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Currency</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.stripe_currency || 'USD'}
                      onChange={(e) => updateField('stripe_currency', e.target.value)}
                      placeholder="USD"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Platform Account ID (Connect)</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.stripe_platform_account_id || ''}
                      onChange={(e) => updateField('stripe_platform_account_id', e.target.value)}
                      placeholder="acct_..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* PayPal */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">🅿️</span>
                <span className="integration-name">PayPal</span>
                <ToggleSwitch
                  checked={formData.paypal_enabled !== false}
                  onChange={(val) => updateField('paypal_enabled', val)}
                />
              </div>
              {formData.paypal_enabled && (
                <div className="integration-fields">
                  <div className="settings-input-group">
                    <label>Client ID</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.paypal_client_id || ''}
                      onChange={(e) => updateField('paypal_client_id', e.target.value)}
                      placeholder="PayPal Client ID"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Secret</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.paypal_secret || ''}
                      onChange={(e) => updateField('paypal_secret', e.target.value)}
                      placeholder="PayPal Secret"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Mode</label>
                    <select
                      className="settings-select"
                      value={formData.paypal_mode || 'sandbox'}
                      onChange={(e) => updateField('paypal_mode', e.target.value)}
                    >
                      <option value="sandbox">Sandbox</option>
                      <option value="live">Live</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Razorpay */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">💠</span>
                <span className="integration-name">Razorpay</span>
                <ToggleSwitch
                  checked={formData.razorpay_enabled || false}
                  onChange={(val) => updateField('razorpay_enabled', val)}
                />
              </div>
              {formData.razorpay_enabled && (
                <div className="integration-fields">
                  <div className="settings-input-group">
                    <label>Key ID</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.razorpay_key_id || ''}
                      onChange={(e) => updateField('razorpay_key_id', e.target.value)}
                      placeholder="Razorpay Key ID"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Key Secret</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.razorpay_key_secret || ''}
                      onChange={(e) => updateField('razorpay_key_secret', e.target.value)}
                      placeholder="Razorpay Key Secret"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Google OAuth */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">🌐</span>
                <span className="integration-name">Google OAuth</span>
                <ToggleSwitch
                  checked={formData.google_oauth_enabled !== false}
                  onChange={(val) => updateField('google_oauth_enabled', val)}
                />
              </div>
              {formData.google_oauth_enabled && (
                <div className="integration-fields">
                  <div className="settings-input-group">
                    <label>Client ID</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.google_client_id || ''}
                      onChange={(e) => updateField('google_client_id', e.target.value)}
                      placeholder="Google Client ID"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Client Secret</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.google_client_secret || ''}
                      onChange={(e) => updateField('google_client_secret', e.target.value)}
                      placeholder="Google Client Secret"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sentry */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">🐛</span>
                <span className="integration-name">Sentry (Error Tracking)</span>
                <ToggleSwitch
                  checked={formData.sentry_enabled || false}
                  onChange={(val) => updateField('sentry_enabled', val)}
                />
              </div>
              {formData.sentry_enabled && (
                <div className="integration-fields">
                  <div className="settings-input-group">
                    <label>DSN</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.sentry_dsn || ''}
                      onChange={(e) => updateField('sentry_dsn', e.target.value)}
                      placeholder="https://...@sentry.io/..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* OpenAI */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">🤖</span>
                <span className="integration-name">OpenAI</span>
                <ToggleSwitch
                  checked={formData.openai_enabled || false}
                  onChange={(val) => updateField('openai_enabled', val)}
                />
              </div>
              {formData.openai_enabled && (
                <div className="integration-fields">
                  <div className="settings-input-group">
                    <label>API Key</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.openai_api_key || ''}
                      onChange={(e) => updateField('openai_api_key', e.target.value)}
                      placeholder="sk-..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AWS S3 */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">☁️</span>
                <span className="integration-name">AWS S3 Storage</span>
              </div>
              <div className="integration-fields">
                <div className="settings-input-group">
                  <label>Access Key ID</label>
                  <input
                    type="password"
                    className="settings-input"
                    value={formData.aws_access_key_id || ''}
                    onChange={(e) => updateField('aws_access_key_id', e.target.value)}
                    placeholder="AKIA..."
                  />
                </div>
                <div className="settings-input-group">
                  <label>Secret Access Key</label>
                  <input
                    type="password"
                    className="settings-input"
                    value={formData.aws_secret_access_key || ''}
                    onChange={(e) => updateField('aws_secret_access_key', e.target.value)}
                    placeholder="AWS Secret Key"
                  />
                </div>
                <div className="settings-input-group">
                  <label>Region</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={formData.aws_region || 'us-east-1'}
                    onChange={(e) => updateField('aws_region', e.target.value)}
                    placeholder="us-east-1"
                  />
                </div>
                <div className="settings-input-group">
                  <label>S3 Bucket Name</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={formData.aws_s3_bucket || ''}
                    onChange={(e) => updateField('aws_s3_bucket', e.target.value)}
                    placeholder="my-bucket-name"
                  />
                </div>
              </div>
            </div>

            {/* Cloudinary */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">📷</span>
                <span className="integration-name">Cloudinary</span>
              </div>
              <div className="integration-fields">
                <div className="settings-input-group">
                  <label>Cloud Name</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={formData.cloudinary_cloud_name || ''}
                    onChange={(e) => updateField('cloudinary_cloud_name', e.target.value)}
                    placeholder="my-cloud"
                  />
                </div>
                <div className="settings-input-group">
                  <label>API Key</label>
                  <input
                    type="password"
                    className="settings-input"
                    value={formData.cloudinary_api_key || ''}
                    onChange={(e) => updateField('cloudinary_api_key', e.target.value)}
                    placeholder="Cloudinary API Key"
                  />
                </div>
                <div className="settings-input-group">
                  <label>API Secret</label>
                  <input
                    type="password"
                    className="settings-input"
                    value={formData.cloudinary_api_secret || ''}
                    onChange={(e) => updateField('cloudinary_api_secret', e.target.value)}
                    placeholder="Cloudinary API Secret"
                  />
                </div>
              </div>
            </div>

            {/* SMTP Email */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">📧</span>
                <span className="integration-name">SMTP Email</span>
                <ToggleSwitch
                  checked={formData.smtp_enabled || false}
                  onChange={(val) => updateField('smtp_enabled', val)}
                />
              </div>
              {formData.smtp_enabled && (
                <div className="integration-fields">
                  <div className="settings-input-group">
                    <label>SMTP Host</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.smtp_host || ''}
                      onChange={(e) => updateField('smtp_host', e.target.value)}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Port</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.smtp_port || '587'}
                      onChange={(e) => updateField('smtp_port', e.target.value)}
                      placeholder="587"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Secure (TLS/SSL)</label>
                    <ToggleSwitch
                      checked={formData.smtp_secure !== false}
                      onChange={(val) => updateField('smtp_secure', val)}
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Username</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.smtp_user || ''}
                      onChange={(e) => updateField('smtp_user', e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Password</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.smtp_pass || ''}
                      onChange={(e) => updateField('smtp_pass', e.target.value)}
                      placeholder="SMTP Password"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>From Email</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.smtp_from_email || ''}
                      onChange={(e) => updateField('smtp_from_email', e.target.value)}
                      placeholder="noreply@example.com"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>From Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.smtp_from_name || appName}
                      onChange={(e) => updateField('smtp_from_name', e.target.value)}
                      placeholder={appName}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SendGrid */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">📨</span>
                <span className="integration-name">SendGrid (Email API)</span>
                <ToggleSwitch
                  checked={formData.sendgrid_enabled || false}
                  onChange={(val) => updateField('sendgrid_enabled', val)}
                />
              </div>
              {formData.sendgrid_enabled && (
                <div className="integration-fields">
                  <div className="settings-input-group">
                    <label>API Key</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.sendgrid_api_key || ''}
                      onChange={(e) => updateField('sendgrid_api_key', e.target.value)}
                      placeholder="SG.xxxxxx..."
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>From Email</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.sendgrid_from_email || ''}
                      onChange={(e) => updateField('sendgrid_from_email', e.target.value)}
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>From Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.sendgrid_from_name || appName}
                      onChange={(e) => updateField('sendgrid_from_name', e.target.value)}
                      placeholder={appName}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Twilio SMS */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">📱</span>
                <span className="integration-name">Twilio SMS</span>
                <ToggleSwitch
                  checked={formData.twilio_enabled || false}
                  onChange={(val) => updateField('twilio_enabled', val)}
                />
              </div>
              {formData.twilio_enabled && (
                <div className="integration-fields">
                  <div className="settings-input-group">
                    <label>Account SID</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.twilio_account_sid || ''}
                      onChange={(e) => updateField('twilio_account_sid', e.target.value)}
                      placeholder="ACxxxxxxxx..."
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Auth Token</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.twilio_auth_token || ''}
                      onChange={(e) => updateField('twilio_auth_token', e.target.value)}
                      placeholder="Twilio Auth Token"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.twilio_phone_number || ''}
                      onChange={(e) => updateField('twilio_phone_number', e.target.value)}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bank/Plaid Integration */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">🏦</span>
                <span className="integration-name">Bank Integration (Plaid)</span>
                <ToggleSwitch
                  checked={formData.bank_enabled || false}
                  onChange={(val) => updateField('bank_enabled', val)}
                />
              </div>
              {formData.bank_enabled && (
                <div className="integration-fields">
                  <div className="settings-input-group">
                    <label>API Key</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.bank_api_key || ''}
                      onChange={(e) => updateField('bank_api_key', e.target.value)}
                      placeholder="Plaid API Key"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>API Secret</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={formData.bank_api_secret || ''}
                      onChange={(e) => updateField('bank_api_secret', e.target.value)}
                      placeholder="Plaid API Secret"
                    />
                  </div>
                </div>
              )}
            </div>

            <SettingRow label="Allow API Access" description="Enable third-party API integrations">
              <ToggleSwitch
                checked={formData.allow_api_access || false}
                onChange={(val) => updateField('allow_api_access', val)}
              />
            </SettingRow>

            {/* AWS Secrets Manager */}
            <div className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">🔐</span>
                <span className="integration-name">AWS Secrets Manager</span>
                <ToggleSwitch
                  checked={formData.aws_secrets_manager_enabled || false}
                  onChange={(val) => updateField('aws_secrets_manager_enabled', val)}
                />
              </div>
              {formData.aws_secrets_manager_enabled && (
                <div className="integration-fields">
                  <div style={{ background: 'var(--amber-dim)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                    ⚠️ AWS Secrets Manager will store all API keys securely. Make sure your AWS credentials have permissions for Secrets Manager.
                  </div>
                  <div className="settings-input-group">
                    <label>AWS Region</label>
                    <select
                      className="settings-select"
                      value={formData.aws_secrets_manager_region || 'us-east-1'}
                      onChange={(e) => updateField('aws_secrets_manager_region', e.target.value)}
                    >
                      <option value="us-east-1">US East (N. Virginia)</option>
                      <option value="us-west-2">US West (Oregon)</option>
                      <option value="eu-west-1">EU (Ireland)</option>
                      <option value="eu-central-1">EU (Frankfurt)</option>
                      <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                      <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                    </select>
                  </div>
                  <div className="settings-input-group">
                    <label>Secret Prefix</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.aws_secrets_manager_secret_prefix || 'promote'}
                      onChange={(e) => updateField('aws_secrets_manager_secret_prefix', e.target.value)}
                      placeholder="promote"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                      Secrets will be stored as: {formData.aws_secrets_manager_secret_prefix || 'promote'}/stripe, {formData.aws_secrets_manager_secret_prefix || 'promote'}/smtp, etc.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </SettingsSection>
        )}

        {activeSection === 'features' && (
          <SettingsSection title="Feature Flags" icon="⚡">
            <SettingRow label="Enable Leaderboard" description="Show tech leaderboard rankings" badge={{ text: 'Popular', type: 'success' }}>
              <ToggleSwitch
                checked={formData.enable_leaderboard !== false}
                onChange={(val) => updateField('enable_leaderboard', val)}
              />
            </SettingRow>
            <SettingRow label="Enable Referrals" description="Allow user referral program">
              <ToggleSwitch
                checked={formData.enable_referrals || false}
                onChange={(val) => updateField('enable_referrals', val)}
              />
            </SettingRow>
            <SettingRow label="Enable Badges" description="Award badges for achievements">
              <ToggleSwitch
                checked={formData.enable_badges !== false}
                onChange={(val) => updateField('enable_badges', val)}
              />
            </SettingRow>
            <SettingRow label="Enable Chatbot" description="AI chatbot assistant">
              <ToggleSwitch
                checked={formData.enable_chatbot !== false}
                onChange={(val) => updateField('enable_chatbot', val)}
              />
            </SettingRow>
            <SettingRow label="Maintenance Mode" description="Block access for maintenance" badge={{ text: 'Use with caution', type: 'danger' }}>
              <ToggleSwitch
                checked={formData.maintenance_mode || false}
                onChange={(val) => updateField('maintenance_mode', val)}
              />
            </SettingRow>
          </SettingsSection>
        )}

        {activeSection === 'legal' && (
          <SettingsSection title="Legal & Compliance" icon="📜">
            <SettingRow label="Require Terms Acceptance" description="Users must accept terms before signing up">
              <ToggleSwitch
                checked={formData.require_terms_acceptance !== false}
                onChange={(val) => updateField('require_terms_acceptance', val)}
              />
            </SettingRow>
            <SettingRow label="Privacy Policy URL" description="Link to your privacy policy">
              <input
                type="text"
                value={formData.privacy_policy_url || '/privacy'}
                onChange={(e) => updateField('privacy_policy_url', e.target.value)}
                className="settings-input"
              />
            </SettingRow>
            <SettingRow label="Terms of Service URL" description="Link to your terms of service">
              <input
                type="text"
                value={formData.terms_url || '/terms'}
                onChange={(e) => updateField('terms_url', e.target.value)}
                className="settings-input"
              />
            </SettingRow>
            <SettingRow label="Cookie Policy URL" description="Link to your cookie policy">
              <input
                type="text"
                value={formData.cookie_policy_url || '/cookies'}
                onChange={(e) => updateField('cookie_policy_url', e.target.value)}
                className="settings-input"
              />
            </SettingRow>
          </SettingsSection>
        )}
      </div>

      <style>{`
        .enhanced-settings {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 0;
          min-height: calc(100vh - 120px);
        }

        .settings-sidebar {
          background: var(--bg-secondary);
          border-right: 1px solid var(--line);
          display: flex;
          flex-direction: column;
        }

        .settings-sidebar-header {
          padding: 24px;
          border-bottom: 1px solid var(--line);
        }

        .settings-sidebar-header h2 {
          font-size: 1.25rem;
          margin-bottom: 4px;
        }

        .settings-sidebar-header p {
          color: var(--muted);
          font-size: 0.875rem;
          margin: 0;
        }

        .settings-nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .settings-nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-size: 0.9375rem;
        }

        .settings-nav-item:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .settings-nav-item.active {
          background: var(--amber);
          color: var(--bg-primary);
        }

        .nav-icon {
          font-size: 1.125rem;
        }

        .settings-sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--line);
        }

        .settings-content {
          padding: 32px;
          overflow-y: auto;
        }

        .settings-section {
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px solid var(--line);
          margin-bottom: 24px;
        }

        .settings-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--line);
        }

        .settings-section-header h3 {
          font-size: 1.125rem;
          margin: 0;
        }

        .settings-icon {
          font-size: 1.25rem;
        }

        .settings-section-content {
          padding: 24px;
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid var(--line);
        }

        .setting-row:last-child {
          border-bottom: none;
        }

        .setting-info {
          flex: 1;
        }

        .setting-label-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .setting-label-row label {
          font-weight: 500;
          color: var(--text-primary);
        }

        .setting-description {
          display: block;
          font-size: 0.8125rem;
          color: var(--muted);
          margin-top: 4px;
        }

        .setting-control {
          flex-shrink: 0;
          margin-left: 24px;
        }

        .settings-input {
          padding: 10px 14px;
          background: var(--bg-primary);
          border: 1px solid var(--line);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.9375rem;
          min-width: 200px;
        }

        .settings-input:focus {
          outline: none;
          border-color: var(--amber);
        }

        .settings-select {
          padding: 10px 14px;
          background: var(--bg-primary);
          border: 1px solid var(--line);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.9375rem;
          min-width: 180px;
          cursor: pointer;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 52px;
          height: 28px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--border-color);
          transition: 0.3s;
          border-radius: 28px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .toggle-switch input:checked + .toggle-slider {
          background-color: var(--amber);
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .toggle-switch.disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .input-with-suffix,
        .input-with-prefix {
          display: flex;
          align-items: center;
          background: var(--bg-primary);
          border: 1px solid var(--line);
          border-radius: 8px;
          overflow: hidden;
        }

        .input-with-suffix input,
        .input-with-prefix input {
          border: none;
          background: transparent;
          padding: 10px 14px;
          color: var(--text-primary);
          font-size: 0.9375rem;
          min-width: 100px;
        }

        .input-with-suffix input:focus,
        .input-with-prefix input:focus {
          outline: none;
        }

        .input-prefix,
        .input-suffix {
          padding: 10px 12px;
          color: var(--muted);
          font-size: 0.875rem;
          background: var(--bg-tertiary);
        }

        .settings-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .settings-badge.success {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .settings-badge.warning {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .settings-badge.danger {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .settings-badge.premium {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
        }

        .settings-info {
          background: var(--bg-tertiary);
          padding: 16px;
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 0.9375rem;
          margin-bottom: 20px;
        }

        .settings-subsection {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--line);
        }

        .settings-subsection h4 {
          margin-bottom: 16px;
          color: var(--text-secondary);
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .tier-preview {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .tier-card-preview {
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          border: 2px solid;
        }

        .tier-card-preview.dev {
          background: rgba(99, 102, 241, 0.1);
          border-color: #6366f1;
        }

        .tier-card-preview.staging {
          background: rgba(139, 92, 246, 0.1);
          border-color: #8b5cf6;
        }

        .tier-card-preview.production {
          background: rgba(251, 191, 36, 0.1);
          border-color: #fbbf24;
        }

        .tier-name {
          display: block;
          font-weight: 600;
          font-size: 1.125rem;
          margin-bottom: 8px;
        }

        .tier-points {
          display: block;
          font-size: 0.875rem;
          color: var(--muted);
          margin-bottom: 4px;
        }

        .tier-pay {
          display: block;
          font-family: var(--mono);
          font-weight: 600;
          color: var(--green);
        }

        .settings-range {
          width: 150px;
          margin-right: 12px;
        }

        .range-value {
          font-family: var(--mono);
          font-weight: 600;
          color: var(--amber);
          min-width: 60px;
        }

        .credit-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .credit-card {
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          border: 2px solid;
        }

        .credit-card.low {
          background: rgba(34, 197, 94, 0.1);
          border-color: #22c55e;
        }

        .credit-card.normal {
          background: rgba(59, 130, 246, 0.1);
          border-color: #3b82f6;
        }

        .credit-card.high {
          background: rgba(245, 158, 11, 0.1);
          border-color: #f59e0b;
        }

        .credit-card.urgent {
          background: rgba(249, 115, 22, 0.1);
          border-color: #f97316;
        }

        .credit-card.critical {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
        }

        .credit-name {
          display: block;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .credit-input {
          width: 80px;
          padding: 8px;
          background: var(--bg-primary);
          border: 1px solid var(--line);
          border-radius: 6px;
          color: var(--text-primary);
          text-align: center;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .credit-with-percent {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .credit-suffix {
          color: var(--muted);
          font-size: 0.875rem;
        }

        .credit-note {
          display: block;
          font-size: 0.75rem;
          color: var(--muted);
          margin-top: 8px;
        }

        .color-input-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .settings-color {
          width: 48px;
          height: 48px;
          padding: 0;
          border: 2px solid var(--line);
          border-radius: 8px;
          cursor: pointer;
        }

        .color-text {
          width: 120px !important;
          min-width: 120px !important;
          font-family: var(--mono);
        }

        .theme-preview {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--line);
        }

        .theme-preview h4 {
          margin-bottom: 16px;
          color: var(--text-secondary);
        }

        .preview-card {
          display: flex;
          gap: 12px;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid;
        }

        .preview-button {
          padding: 10px 20px;
          border-radius: 6px;
          color: white;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .integration-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .integration-card {
          background: var(--bg-tertiary);
          border-radius: 12px;
          padding: 16px;
        }

        .integration-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .integration-header .toggle-switch {
          margin-left: auto;
        }

        .integration-icon {
          font-size: 1.5rem;
        }

        .integration-name {
          font-weight: 600;
        }

        .integration-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--line);
        }

        .settings-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .settings-input-group label {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .settings-input-group input {
          padding: 10px 14px;
          background: var(--bg-primary);
          border: 1px solid var(--line);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.9375rem;
        }

        .settings-input-group input:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        @media (max-width: 1024px) {
          .enhanced-settings {
            grid-template-columns: 1fr;
          }

          .settings-sidebar {
            border-right: none;
            border-bottom: 1px solid var(--line);
          }

          .settings-nav {
            display: flex;
            overflow-x: auto;
            padding: 12px;
            gap: 8px;
          }

          .settings-nav-item {
            flex-shrink: 0;
            padding: 10px 16px;
          }
        }

        @media (max-width: 768px) {
          .tier-preview,
          .integration-cards {
            grid-template-columns: 1fr;
          }

          .setting-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .setting-control {
            margin-left: 0;
            width: 100%;
          }

          .settings-input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
