import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Earn Production Access Through
            <span className="gradient-text"> Quality Work</span>
          </h1>
          <p className="hero-subtitle">
            A gamified ticketing platform where developers build their reputation,
            climb the promotion ladder, and unlock production opportunities through
            resolved tickets.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn-primary btn-large">
              Get Started Free
            </Link>
            <Link to="/login" className="btn-secondary btn-large">
              Sign In
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="tier-card">
            <div className="tier-badge dev">Dev</div>
            <div className="tier-info">
              <span className="tier-label">Starting Tier</span>
              <span className="tier-threshold">0-32 points</span>
            </div>
          </div>
          <div className="tier-card">
            <div className="tier-badge staging">Staging</div>
            <div className="tier-info">
              <span className="tier-label">Intermediate</span>
              <span className="tier-threshold">33-65 points</span>
            </div>
          </div>
          <div className="tier-card featured">
            <div className="tier-badge production">Production-Ready</div>
            <div className="tier-info">
              <span className="tier-label">Top Tier</span>
              <span className="tier-threshold">66+ points</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Sign Up</h3>
            <p>Create your account as a customer or technician. No credit card required.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Submit or Claim Tickets</h3>
            <p>Customers submit tickets. Technicians claim and resolve them to earn points.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Build Reputation</h3>
            <p>Receive ratings from customers. Higher ratings mean more points and visibility.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Unlock Production</h3>
            <p>Climb the tiers to access production hire opportunities and higher pay.</p>
          </div>
        </div>
      </section>

      {/* Customer Benefits */}
      <section className="benefits">
        <div className="benefits-header">
          <h2 className="section-title">For Customers</h2>
          <p>Get expert technical support with transparent pricing and quality assurance</p>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">🎯</div>
            <h3>Expert Technicians</h3>
            <p>Access verified technicians with proven track records and ratings.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">⭐</div>
            <h3>Quality Guaranteed</h3>
            <p>Rate technician work and ensure you get the quality you deserve.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">💳</div>
            <h3>Secure Payments</h3>
            <p>Funds held in escrow until you're satisfied with the resolution.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">📊</div>
            <h3>Full Transparency</h3>
            <p>Track ticket progress, communicate directly, and review complete history.</p>
          </div>
        </div>
      </section>

      {/* Technician Benefits */}
      <section className="benefits tech-benefits">
        <div className="benefits-header">
          <h2 className="section-title">For Technicians</h2>
          <p>Earn money, build your reputation, and unlock premium opportunities</p>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">💰</div>
            <h3>Competitive Earnings</h3>
            <p>Base pay for dev tickets, staging tickets, and production hires.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">📈</div>
            <h3>Clear Progression</h3>
            <p>Climb from Dev to Staging to Production-Ready tier with transparent metrics.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🏆</div>
            <h3>Leaderboard Recognition</h3>
            <p>Top technicians get featured and receive priority hire requests.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🔐</div>
            <h3>Earn Production Access</h3>
            <p>Demonstrate quality work to unlock paid production support opportunities.</p>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="pricing-preview">
        <h2 className="section-title">Ticket Pricing</h2>
        <div className="pricing-table">
          <div className="pricing-row header">
            <span>Environment</span>
            <span>Base Pay</span>
            <span>Priority Options</span>
          </div>
          <div className="pricing-row">
            <span><span className="env-badge dev">Dev</span></span>
            <span>$25/ticket</span>
            <span>Low, Normal, High, Urgent, Critical</span>
          </div>
          <div className="pricing-row">
            <span><span className="env-badge staging">Staging</span></span>
            <span>$50/ticket</span>
            <span>Low, Normal, High, Urgent, Critical</span>
          </div>
          <div className="pricing-row featured">
            <span><span className="env-badge production">Production</span></span>
            <span>Negotiated</span>
            <span>Direct hire with customers</span>
          </div>
        </div>
        <p className="pricing-note">
          Platform takes 15% commission. Minimum payout of $25. Payouts processed in 2-3 business days.
        </p>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of developers and customers on our platform</p>
        <div className="cta-buttons">
          <Link to="/signup" className="btn-primary btn-large">
            Create Free Account
          </Link>
          <Link to="/login" className="btn-secondary btn-large">
            Sign In
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="brand-mark">Pr</div>
            <span>Promote — Earn Production Access</span>
          </div>
          <div className="footer-links">
            <Link to="/login">Sign In</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Promote Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
