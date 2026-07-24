import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedCurrencies, formatCurrency, getPreferredCurrency, setPreferredCurrency } from '../i18n';

export default function CurrencySelector({ 
  variant = 'dropdown', 
  className = '',
  onCurrencyChange,
  showName = true 
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(
    supportedCurrencies.find(c => c.code === getPreferredCurrency()) || supportedCurrencies[0]
  );
  const dropdownRef = useRef(null);

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

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
    setPreferredCurrency(currency.code);
    if (onCurrencyChange) {
      onCurrencyChange(currency.code);
    }
    setIsOpen(false);
  };

  // Compact variant for header
  if (variant === 'compact') {
    return (
      <div className={`currency-selector-compact ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="currency-btn-compact"
          title={t('settings.select_currency')}
        >
          <span className="currency-symbol">{selectedCurrency.symbol}</span>
          <span className="currency-code">{selectedCurrency.code}</span>
        </button>
        
        {isOpen && (
          <div className="currency-dropdown-mini">
            {supportedCurrencies.map(curr => (
              <button
                key={curr.code}
                onClick={() => handleCurrencyChange(curr)}
                className={`currency-option ${selectedCurrency.code === curr.code ? 'active' : ''}`}
              >
                <span className="currency-symbol">{curr.symbol}</span>
                <span>{curr.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full dropdown variant
  return (
    <div className={`currency-selector ${className}`} ref={dropdownRef}>
      <label className="settings-label">{t('settings.currency')}</label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="currency-selector-btn"
      >
        <span className="currency-symbol-lg">{selectedCurrency.symbol}</span>
        <span className="currency-name">{selectedCurrency.name}</span>
        <span className="currency-code-lg">{selectedCurrency.code}</span>
        <span className="dropdown-arrow">▼</span>
      </button>
      
      {isOpen && (
        <div className="currency-dropdown">
          {supportedCurrencies.map(curr => (
            <button
              key={curr.code}
              onClick={() => handleCurrencyChange(curr)}
              className={`currency-option ${selectedCurrency.code === curr.code ? 'active' : ''}`}
            >
              <span className="currency-symbol-lg">{curr.symbol}</span>
              <div className="currency-info">
                <span className="currency-name">{curr.name}</span>
                <span className="currency-code-lg">{curr.code}</span>
              </div>
              {selectedCurrency.code === curr.code && (
                <span className="check-mark">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
      
      <div className="currency-preview">
        <span className="preview-label">Preview:</span>
        <span className="preview-amount">{formatCurrency(99.99, selectedCurrency.code)}</span>
      </div>
    </div>
  );
}

// Hook for using currency in components
export function useCurrency() {
  const [currentCurrency, setCurrentCurrency] = useState(getPreferredCurrency());
  
  const changeCurrency = (code) => {
    setCurrentCurrency(code);
    setPreferredCurrency(code);
  };
  
  return {
    currency: currentCurrency,
    symbol: supportedCurrencies.find(c => c.code === currentCurrency)?.symbol || '$',
    format: (amount) => formatCurrency(amount, currentCurrency),
    changeCurrency
  };
}
