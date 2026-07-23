import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: July 23, 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Promote ("the Service"), you accept and agree to be bound by 
            the terms and provision of this agreement. If you do not agree to abide by these 
            terms, please do not use this Service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            Promote is a gamified ticketing platform that allows customers to submit technical 
            support tickets and developers (Techs) to resolve them. Techs earn points and 
            reputation through ticket resolution, enabling progression through tier levels 
            (Dev → Staging → Production-Ready).
          </p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <p>By registering for an account, you agree to:</p>
          <ul>
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and promptly update your information</li>
            <li>Keep your password secure and confidential</li>
            <li>Be responsible for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>
        </section>

        <section>
          <h2>4. For Customers</h2>
          <p>As a customer using our platform:</p>
          <ul>
            <li>You may submit tickets describing technical issues you encounter</li>
            <li>You agree to provide clear, accurate ticket descriptions</li>
            <li>You will rate technicians after ticket resolution</li>
            <li>You agree to pay any applicable credit/ticket fees</li>
            <li>Low and Normal priority tickets are free; High/Urgent/Critical have associated costs</li>
          </ul>
        </section>

        <section>
          <h2>5. For Technicians (Techs)</h2>
          <p>As a technician on our platform:</p>
          <ul>
            <li>You agree to resolve tickets professionally and timely</li>
            <li>You must maintain a minimum quality rating</li>
            <li>Your tier level determines access to different environments</li>
            <li>Dev tier: Access to dev environment tickets</li>
            <li>Staging tier: Access to staging environment tickets</li>
            <li>Production-Ready tier: Access to all tickets</li>
            <li>You agree to payout terms and minimum withdrawal amounts</li>
          </ul>
        </section>

        <section>
          <h2>6. Credit System</h2>
          <p>
            Credits are used to pay for High, Urgent, and Critical priority tickets. 
            Low and Normal priority tickets are free. Credit costs are calculated as 
            percentages of the tech's base pay for the ticket.
          </p>
        </section>

        <section>
          <h2>7. Payout System</h2>
          <p>
            Techs earn money through ticket resolution. The platform deducts a commission 
            fee (configurable by admin, default 15%). Minimum payout amounts apply as 
            configured in platform settings. Payouts are processed within specified timeframes.
          </p>
        </section>

        <section>
          <h2>8. Prohibited Uses</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Submit false, misleading, or fraudulent tickets</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Upload viruses or malicious code</li>
            <li>Attempt to gain unauthorized access</li>
            <li>Spam or solicit other users</li>
            <li>Circumvent any security measures</li>
          </ul>
        </section>

        <section>
          <h2>9. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by 
            Promote and are protected by international copyright, trademark, patent, trade 
            secret, and other intellectual property laws.
          </p>
        </section>

        <section>
          <h2>10. Limitation of Liability</h2>
          <p>
            In no event shall Promote, nor its directors, employees, partners, agents, 
            suppliers, or affiliates, be liable for any indirect, incidental, special, 
            consequential, or punitive damages, including without limitation, loss of 
            profits, data, use, goodwill, or other intangible losses.
          </p>
        </section>

        <section>
          <h2>11. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or 
            liability, for any reason, including without limitation if you breach the Terms.
          </p>
        </section>

        <section>
          <h2>12. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. We will 
            provide notice of significant changes. Your continued use of the Service after 
            changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2>13. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at{' '}
            <a href="mailto:legal@promote.example.com">legal@promote.example.com</a>.
          </p>
        </section>

        <div className="legal-footer">
          <Link to="/">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
