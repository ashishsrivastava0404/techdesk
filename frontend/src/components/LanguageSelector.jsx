import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, supportedLanguages } from '../i18n';

export default function LanguageSelector({ variant = 'dropdown', className = '' }) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const currentLanguage = supportedLanguages.find(
    lang => lang.code === i18n.language
  ) || supportedLanguages[0];

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

  const handleLanguageChange = async (languageCode) => {
    await changeLanguage(languageCode);
    setIsOpen(false);
  };

  // Compact variant for header/settings
  if (variant === 'compact') {
    return (
      <div className={`language-selector-compact ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="language-btn-compact"
          title={t('settings.select_language')}
        >
          <span className="language-flag">{getFlagEmoji(currentLanguage.code)}</span>
          <span className="language-code">{currentLanguage.code.toUpperCase()}</span>
        </button>
        
        {isOpen && (
          <div className="language-dropdown-mini">
            {supportedLanguages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`language-option ${i18n.language === lang.code ? 'active' : ''}`}
              >
                <span className="language-flag">{getFlagEmoji(lang.code)}</span>
                <span>{lang.nativeName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full dropdown variant
  return (
    <div className={`language-selector ${className}`} ref={dropdownRef}>
      <label className="settings-label">{t('settings.language')}</label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="language-selector-btn"
      >
        <span className="language-flag">{getFlagEmoji(currentLanguage.code)}</span>
        <span className="language-name">{currentLanguage.nativeName}</span>
        <span className="dropdown-arrow">▼</span>
      </button>
      
      {isOpen && (
        <div className="language-dropdown">
          {supportedLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`language-option ${i18n.language === lang.code ? 'active' : ''}`}
            >
              <span className="language-flag">{getFlagEmoji(lang.code)}</span>
              <div className="language-info">
                <span className="language-native">{lang.nativeName}</span>
                <span className="language-english">{lang.name}</span>
              </div>
              {i18n.language === lang.code && (
                <span className="check-mark">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Get flag emoji from language code
function getFlagEmoji(languageCode) {
  const flags = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    pt: '🇧🇷',
    zh: '🇨🇳',
    hi: '🇮🇳',
    ja: '🇯🇵',
    ar: '🇸🇦'
  };
  return flags[languageCode] || '🌐';
}
