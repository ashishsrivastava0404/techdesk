import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShow(true);
    } else {
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
      } catch (e) {
        setShow(true);
      }
    }
  }, []);

  const savePreferences = (prefs) => {
    localStorage.setItem('cookie_consent', JSON.stringify(prefs));
    setShow(false);
    setShowPreferences(false);
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true
    });
  };

  const acceptEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false
    });
  };

  if (!show) return null;

  return (
    <>
      <div className="cookie-overlay" onClick={() => setShowPreferences(false)} />
      <div className="cookie-consent">
        <div className="cookie-header">
          <h3>We value your privacy</h3>
          <p>
            We use cookies to enhance your browsing experience, serve personalized content, 
            and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
          </p>
        </div>

        {!showPreferences ? (
          <div className="cookie-actions">
            <button 
              className="btn btn-secondary btn-small"
              onClick={acceptEssential}
            >
              Essential Only
            </button>
            <button 
              className="btn btn-secondary btn-small"
              onClick={() => setShowPreferences(true)}
            >
              Customize
            </button>
            <button 
              className="btn btn-primary btn-small"
              onClick={acceptAll}
            >
              Accept All
            </button>
          </div>
        ) : (
          <div className="cookie-preferences">
            <div className="cookie-option">
              <div className="cookie-option-info">
                <strong>Essential Cookies</strong>
                <span>Required for the website to function</span>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={preferences.essential} 
                  disabled 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="cookie-option">
              <div className="cookie-option-info">
                <strong>Analytics Cookies</strong>
                <span>Help us understand how you use our site</span>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    analytics: e.target.checked
                  })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="cookie-option">
              <div className="cookie-option-info">
                <strong>Marketing Cookies</strong>
                <span>Used to deliver relevant advertisements</span>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    marketing: e.target.checked
                  })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="cookie-actions">
              <button 
                className="btn btn-secondary btn-small"
                onClick={() => setShowPreferences(false)}
              >
                Back
              </button>
              <button 
                className="btn btn-primary btn-small"
                onClick={() => savePreferences(preferences)}
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        <div className="cookie-links">
          <a href="/cookies">Cookie Policy</a>
          <span>|</span>
          <a href="/privacy">Privacy Policy</a>
        </div>
      </div>

      <style>{`
        .cookie-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9998;
        }

        .cookie-consent {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-secondary, #1e293b);
          border-top: 1px solid var(--border-color, #334155);
          padding: 20px;
          z-index: 9999;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .cookie-header {
          max-width: 600px;
          margin: 0 auto 16px;
          text-align: center;
        }

        .cookie-header h3 {
          margin: 0 0 8px;
          color: var(--text-primary, #f8fafc);
        }

        .cookie-header p {
          margin: 0;
          color: var(--text-secondary, #94a3b8);
          font-size: 14px;
          line-height: 1.5;
        }

        .cookie-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cookie-preferences {
          max-width: 500px;
          margin: 0 auto 16px;
        }

        .cookie-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color, #334155);
        }

        .cookie-option:last-of-type {
          border-bottom: none;
        }

        .cookie-option-info {
          display: flex;
          flex-direction: column;
        }

        .cookie-option-info strong {
          color: var(--text-primary, #f8fafc);
        }

        .cookie-option-info span {
          font-size: 12px;
          color: var(--text-secondary, #94a3b8);
        }

        .toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
        }

        .toggle input {
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
          background-color: var(--border-color, #475569);
          transition: 0.3s;
          border-radius: 26px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .toggle input:checked + .toggle-slider {
          background-color: var(--primary-color, #6366f1);
        }

        .toggle input:disabled + .toggle-slider {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle input:checked + .toggle-slider:before {
          transform: translateX(22px);
        }

        .cookie-links {
          text-align: center;
          font-size: 12px;
          color: var(--text-secondary, #94a3b8);
        }

        .cookie-links a {
          color: var(--primary-color, #6366f1);
          text-decoration: none;
        }

        .cookie-links a:hover {
          text-decoration: underline;
        }

        .cookie-links span {
          margin: 0 8px;
        }

        @media (max-width: 600px) {
          .cookie-actions {
            flex-direction: column;
          }

          .cookie-actions button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
