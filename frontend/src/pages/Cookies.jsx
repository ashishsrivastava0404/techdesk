import { Link } from 'react-router-dom';

export default function Cookies() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Cookie Policy</h1>
        <p className="last-updated">Last updated: July 23, 2026</p>

        <section>
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your computer or mobile device 
            when you visit a website. They help websites remember your preferences, 
            understand your behavior, and improve your overall experience.
          </p>
        </section>

        <section>
          <h2>2. How We Use Cookies</h2>
          <p>Promote uses cookies for several purposes:</p>
          
          <h3>2.1 Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable 
            core functionality such as security, authentication, and accessibility.
          </p>
          <table>
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>auth_token</td>
                <td>Maintains your logged-in session</td>
                <td>24 hours</td>
              </tr>
              <tr>
                <td>refresh_token</td>
                <td>Extends your session securely</td>
                <td>7 days</td>
              </tr>
              <tr>
                <td>cookie_consent</td>
                <td>Remembers your cookie preferences</td>
                <td>1 year</td>
              </tr>
            </tbody>
          </table>

          <h3>2.2 Analytics Cookies</h3>
          <p>
            These cookies help us understand how visitors interact with our website by 
            collecting and reporting information anonymously.
          </p>
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Purpose</th>
                <th>Privacy Policy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Google Analytics</td>
                <td>Usage analytics and trends</td>
                <td><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy</a></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>3. Managing Your Cookie Preferences</h2>
          <p>
            When you first visit Promote, you'll see a cookie consent banner. You can:
          </p>
          <ul>
            <li><strong>Accept all cookies:</strong> Enable all cookie types</li>
            <li><strong>Essential only:</strong> Only enable essential cookies</li>
            <li><strong>Customize:</strong> Choose which cookies to enable</li>
          </ul>
          <p>
            You can change your preferences at any time by clicking the "Cookie Settings" 
            link in our footer.
          </p>
        </section>

        <section>
          <h2>4. Browser Settings</h2>
          <p>
            Most web browsers allow you to control cookies through their settings. However, 
            disabling cookies may affect the functionality of our website.
          </p>
          <p>To manage cookies in your browser:</p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome Settings</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Firefox Settings</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari Settings</a></li>
            <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Edge Settings</a></li>
          </ul>
        </section>

        <section>
          <h2>5. Third-Party Cookies</h2>
          <p>
            Some cookies are placed by third-party services that appear on our pages. 
            These third parties include:
          </p>
          <ul>
            <li>Google (Analytics and Sign-in)</li>
            <li>Stripe (Payment processing)</li>
            <li>SendGrid (Email delivery)</li>
          </ul>
          <p>
            We don't control these third-party cookies. You should review the respective 
            privacy policies of these services for more information.
          </p>
        </section>

        <section>
          <h2>6. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy periodically to reflect changes in our 
            practices or for other operational, legal, or regulatory reasons.
          </p>
        </section>

        <section>
          <h2>7. Contact Us</h2>
          <p>
            If you have questions about our use of cookies, please contact us at{' '}
            <a href="mailto:privacy@promote.example.com">privacy@promote.example.com</a>.
          </p>
        </section>

        <div className="legal-footer">
          <Link to="/">&larr; Back to Home</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
