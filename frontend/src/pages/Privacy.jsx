import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: July 23, 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Promote ("we", "our", or "us") is committed to protecting your privacy. This 
            Privacy Policy explains how we collect, use, disclose, and safeguard your 
            information when you use our platform and services.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Personal Information</h3>
          <p>We may collect the following types of personal information:</p>
          <ul>
            <li>Name and email address</li>
            <li>Account credentials (passwords are hashed)</li>
            <li>Profile information (skills, bio, avatar)</li>
            <li>Payment information (processed through third-party providers)</li>
            <li>Google OAuth information (if using Google sign-in)</li>
          </ul>

          <h3>2.2 Usage Data</h3>
          <p>We may also collect:</p>
          <ul>
            <li>Ticket submissions and messages</li>
            <li>Technician performance metrics (ratings, completion times)</li>
            <li>Credit transaction history</li>
            <li>Payout records</li>
            <li>Browser and device information</li>
            <li>IP addresses and cookies</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide and maintain our Services</li>
            <li>Process ticket submissions and resolutions</li>
            <li>Calculate and process payments/payouts</li>
            <li>Send notifications about tickets and account activity</li>
            <li>Improve our platform and user experience</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2>4. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our 
            platform and hold certain information. You can instruct your browser to refuse 
            all cookies or to indicate when a cookie is being sent.
          </p>
          
          <h3>Types of Cookies We Use:</h3>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for authentication and security</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how you use our platform</li>
            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
          </ul>
        </section>

        <section>
          <h2>5. Third-Party Services</h2>
          <p>We may employ third-party companies to facilitate our Services:</p>
          <ul>
            <li><strong>Payment Processing:</strong> Stripe, PayPal for payments and payouts</li>
            <li><strong>Authentication:</strong> Google OAuth for sign-in</li>
            <li><strong>Email:</strong> SendGrid for transactional emails</li>
            <li><strong>Analytics:</strong> Google Analytics for usage tracking</li>
            <li><strong>Cloud Storage:</strong> AWS S3 for file uploads</li>
          </ul>
          <p>
            These third parties have their own privacy policies governing their use of your 
            personal information.
          </p>
        </section>

        <section>
          <h2>6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect 
            your information. However, no method of transmission over the Internet or electronic 
            storage is 100% secure, and we cannot guarantee absolute security.
          </p>
          <p>Security measures include:</p>
          <ul>
            <li>Password hashing with salt</li>
            <li>JWT-based authentication</li>
            <li>Encrypted data transmission (HTTPS)</li>
            <li>Rate limiting on API endpoints</li>
            <li>Secure database practices</li>
          </ul>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <p>
            We will retain your personal information only for as long as is necessary for the 
            purposes set out in this Privacy Policy. We will retain and use your information 
            to the extent necessary to comply with our legal obligations, resolve disputes, 
            and enforce our policies.
          </p>
        </section>

        <section>
          <h2>8. Your Rights (GDPR & CCPA)</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request copies of your personal data</li>
            <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Restrict processing:</strong> Request limitation of data processing</li>
            <li><strong>Data portability:</strong> Request transfer of your data</li>
            <li><strong>Object:</strong> Object to processing of your personal data</li>
            <li><strong>Withdraw consent:</strong> Withdraw consent at any time</li>
          </ul>
          <p>
            To exercise these rights, please contact us at{' '}
            <a href="mailto:privacy@promote.example.com">privacy@promote.example.com</a>.
          </p>
        </section>

        <section>
          <h2>9. Children's Privacy</h2>
          <p>
            Our Services are not intended for individuals under the age of 18. We do not 
            knowingly collect personal information from children under 18. If you are a parent 
            or guardian and believe your child has provided us with personal information, 
            please contact us immediately.
          </p>
        </section>

        <section>
          <h2>10. International Transfers</h2>
          <p>
            Your information may be transferred to and maintained on servers located 
            outside of your state, province, country, or other governmental jurisdiction. 
            We will ensure appropriate safeguards are in place for such transfers.
          </p>
        </section>

        <section>
          <h2>11. Changes to This Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any 
            changes by posting the new Privacy Policy on this page and updating the 
            "Last updated" date.
          </p>
        </section>

        <section>
          <h2>12. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us:</p>
          <ul>
            <li>Email: <a href="mailto:privacy@promote.example.com">privacy@promote.example.com</a></li>
            <li>Address: [Company Address]</li>
          </ul>
        </section>

        <div className="legal-footer">
          <Link to="/">&larr; Back to Home</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/cookies">Cookie Policy</Link>
        </div>
      </div>
    </div>
  );
}
