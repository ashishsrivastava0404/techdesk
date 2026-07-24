import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  countryLocaleMap, 
  applyRegionalSettings,
  detectUserTimezone,
  getTimezoneOffset
} from '../i18n';

// Countries with flag emojis
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' }
];

export default function RegionalSettings({ onSettingsChange }) {
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [previewSettings, setPreviewSettings] = useState(null);

  // Auto-detect country on mount
  useEffect(() => {
    const detectedTimezone = detectUserTimezone();
    // Try to match timezone to a country
    const matchedCountry = Object.entries(countryLocaleMap).find(
      ([code, settings]) => settings.timezone === detectedTimezone
    );
    if (matchedCountry) {
      setSelectedCountry(matchedCountry[0]);
      setPreviewSettings(matchedCountry[1]);
    }
  }, []);

  const handleCountrySelect = (countryCode) => {
    setSelectedCountry(countryCode);
    const settings = applyRegionalSettings(countryCode);
    setPreviewSettings(settings);
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  };

  const getCurrentTimeInZone = (timezone) => {
    try {
      return new Date().toLocaleTimeString('en-US', { 
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="regional-settings">
      <div className="regional-header">
        <h3>📍 Regional Settings</h3>
        <p className="regional-description">
          Select your country to automatically configure language, currency, and timezone.
        </p>
      </div>

      <div className="country-grid">
        {COUNTRIES.map(country => {
          const settings = countryLocaleMap[country.code];
          const isSelected = selectedCountry === country.code;
          
          return (
            <button
              key={country.code}
              onClick={() => handleCountrySelect(country.code)}
              className={`country-card ${isSelected ? 'selected' : ''}`}
            >
              <span className="country-flag">{country.flag}</span>
              <span className="country-name">{country.name}</span>
              {isSelected && settings && (
                <div className="country-preview">
                  <span className="preview-item">
                    {settings.language.toUpperCase()}
                  </span>
                  <span className="preview-item">
                    {settings.currency}
                  </span>
                  <span className="preview-item timezone">
                    {getTimezoneOffset(settings.timezone)}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {previewSettings && (
        <div className="settings-preview">
          <h4>Preview for {COUNTRIES.find(c => c.code === selectedCountry)?.name}</h4>
          <div className="preview-grid">
            <div className="preview-card">
              <span className="preview-label">Language</span>
              <span className="preview-value">
                {COUNTRIES.find(c => c.code === selectedCountry)?.flag} {previewSettings.language.toUpperCase()}
              </span>
            </div>
            <div className="preview-card">
              <span className="preview-label">Currency</span>
              <span className="preview-value">
                {previewSettings.currency}
              </span>
            </div>
            <div className="preview-card">
              <span className="preview-label">Timezone</span>
              <span className="preview-value">
                {previewSettings.timezone}
              </span>
              <span className="preview-time">
                Current: {getCurrentTimeInZone(previewSettings.timezone)}
              </span>
            </div>
            <div className="preview-card">
              <span className="preview-label">Locale</span>
              <span className="preview-value">
                {previewSettings.locale}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="regional-info">
        <h4>What gets configured:</h4>
        <ul>
          <li>🗣️ <strong>Language</strong> - App interface and notifications</li>
          <li>💰 <strong>Currency</strong> - Display prices in your local currency</li>
          <li>🕐 <strong>Timezone</strong> - All dates and times shown in your local time</li>
          <li>🌐 <strong>Locale</strong> - Number, date, and formatting conventions</li>
        </ul>
      </div>
    </div>
  );
}
