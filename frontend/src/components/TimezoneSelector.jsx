import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Common timezones with user-friendly labels
export const TIMEZONES = [
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)', region: 'Americas' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)', region: 'Americas' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', region: 'Americas' },
  { value: 'America/Anchorage', label: 'Alaska', region: 'Americas' },
  { value: 'Pacific/Honolulu', label: 'Hawaii', region: 'Americas' },
  { value: 'America/Toronto', label: 'Toronto (Canada)', region: 'Americas' },
  { value: 'America/Vancouver', label: 'Vancouver (Canada)', region: 'Americas' },
  { value: 'America/Mexico_City', label: 'Mexico City (Mexico)', region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'Brasilia (Brazil)', region: 'Americas' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (Argentina)', region: 'Americas' },
  
  // Europe
  { value: 'Europe/London', label: 'London (UK & Ireland)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris (France)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin (Germany)', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid (Spain)', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome (Italy)', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (Netherlands)', region: 'Europe' },
  { value: 'Europe/Brussels', label: 'Brussels (Belgium)', region: 'Europe' },
  { value: 'Europe/Vienna', label: 'Vienna (Austria)', region: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Stockholm (Sweden)', region: 'Europe' },
  { value: 'Europe/Warsaw', label: 'Warsaw (Poland)', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow (Russia)', region: 'Europe' },
  
  // Asia
  { value: 'Asia/Kolkata', label: 'India Standard Time', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Tokyo (Japan)', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'Shanghai (China)', region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore', region: 'Asia' },
  { value: 'Asia/Seoul', label: 'Seoul (South Korea)', region: 'Asia' },
  { value: 'Asia/Dubai', label: 'Dubai (UAE)', region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Bangkok (Thailand)', region: 'Asia' },
  { value: 'Asia/Jakarta', label: 'Jakarta (Indonesia)', region: 'Asia' },
  { value: 'Asia/Manila', label: 'Manila (Philippines)', region: 'Asia' },
  
  // Oceania
  { value: 'Australia/Sydney', label: 'Sydney (Australia)', region: 'Oceania' },
  { value: 'Australia/Melbourne', label: 'Melbourne (Australia)', region: 'Oceania' },
  { value: 'Australia/Perth', label: 'Perth (Australia)', region: 'Oceania' },
  { value: 'Pacific/Auckland', label: 'Auckland (New Zealand)', region: 'Oceania' },
  
  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', region: 'Other' }
];

// Detect user's timezone automatically
export const detectUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect timezone:', error);
    return 'UTC';
  }
};

// Get timezone offset
export const getTimezoneOffset = (timezone) => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart?.value || '';
  } catch {
    return '';
  }
};

// Format time for specific timezone
export const formatTimeForTimezone = (date, timezone, locale = 'en-US') => {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      dateStyle: 'medium'
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleString();
  }
};

export default function TimezoneSelector({ 
  variant = 'dropdown', 
  className = '',
  onTimezoneChange,
  storedTimezone = null
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState(
    storedTimezone || localStorage.getItem('preferred_timezone') || detectUserTimezone()
  );
  const dropdownRef = useRef(null);

  // Group timezones by region
  const groupedTimezones = TIMEZONES.reduce((acc, tz) => {
    if (!acc[tz.region]) {
      acc[tz.region] = [];
    }
    acc[tz.region].push(tz);
    return acc;
  }, {});

  // Filter timezones by search term
  const filteredTimezones = searchTerm
    ? TIMEZONES.filter(tz => 
        tz.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tz.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimezoneChange = (timezone) => {
    setSelectedTimezone(timezone);
    localStorage.setItem('preferred_timezone', timezone);
    if (onTimezoneChange) {
      onTimezoneChange(timezone);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedTz = TIMEZONES.find(tz => tz.value === selectedTimezone);

  return (
    <div className={`timezone-selector ${className}`} ref={dropdownRef}>
      <label className="settings-label">{t('settings.timezone') || 'Timezone'}</label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="timezone-selector-btn"
      >
        <span className="timezone-value">
          {selectedTz?.label || selectedTimezone}
        </span>
        <span className="timezone-offset">
          {getTimezoneOffset(selectedTimezone)}
        </span>
        <span className="dropdown-arrow">▼</span>
      </button>
      
      {isOpen && (
        <div className="timezone-dropdown">
          <input
            type="text"
            placeholder="Search timezone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="timezone-search"
          />
          
          <div className="timezone-list">
            {filteredTimezones ? (
              // Show filtered results
              filteredTimezones.length > 0 ? (
                filteredTimezones.map(tz => (
                  <button
                    key={tz.value}
                    onClick={() => handleTimezoneChange(tz.value)}
                    className={`timezone-option ${selectedTimezone === tz.value ? 'active' : ''}`}
                  >
                    <span className="tz-label">{tz.label}</span>
                    <span className="tz-offset">{getTimezoneOffset(tz.value)}</span>
                  </button>
                ))
              ) : (
                <div className="timezone-no-results">No timezones found</div>
              )
            ) : (
              // Show grouped timezones
              Object.entries(groupedTimezones).map(([region, timezones]) => (
                <div key={region} className="timezone-region">
                  <div className="region-header">{region}</div>
                  {timezones.map(tz => (
                    <button
                      key={tz.value}
                      onClick={() => handleTimezoneChange(tz.value)}
                      className={`timezone-option ${selectedTimezone === tz.value ? 'active' : ''}`}
                    >
                      <span className="tz-label">{tz.label}</span>
                      <span className="tz-offset">{getTimezoneOffset(tz.value)}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
