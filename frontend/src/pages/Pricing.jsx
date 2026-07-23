import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Unlimited low priority tickets',
      'Unlimited normal priority tickets',
      'Basic ticket tracking',
      'Community support',
      'Access to Dev tier tickets',
      'Standard resolution time'
    ],
    cta: 'Get Started',
    highlighted: false
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For power users and businesses',
    features: [
      'Everything in Free',
      'High priority tickets',
      'Urgent priority tickets',
      'Priority support queue',
      'Access to Staging tier',
      'Faster resolution time',
      'Detailed analytics',
      'Priority customer support'
    ],
    cta: 'Start Pro Trial',
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Critical priority tickets',
      'Dedicated account manager',
      'Custom SLA agreements',
      'Production tier access',
      'API access',
      'White-label options',
      'On-premise deployment',
      '24/7 priority support'
    ],
    cta: 'Contact Sales',
    highlighted: false
  }
];

const ticketPricing = [
  { priority: 'Low', price: 'FREE', color: '#22c55e', description: 'Best for general questions and minor issues' },
  { priority: 'Normal', price: 'FREE', color: '#22c55e', description: 'Standard support requests' },
  { priority: 'High', price: '50% of tech pay', color: '#f59e0b', description: 'For issues affecting work' },
  { priority: 'Urgent', price: '75% of tech pay', color: '#f97316', description: 'For time-sensitive problems' },
  { priority: 'Critical', price: '100% of tech pay', color: '#ef4444', description: 'For system outages' }
];

const techTiers = [
  {
    tier: 'Dev',
    points: '0-32',
    access: 'Dev environment tickets',
    pay: 'Base rate',
    color: '#6366f1'
  },
  {
    tier: 'Staging',
    points: '33-65',
    access: 'Dev + Staging tickets',
    pay: '1.2x base rate',
    color: '#8b5cf6'
  },
  {
    tier: 'Production-Ready',
    points: '66+',
    access: 'All environments',
    pay: '1.5x base rate',
    color: '#fbbf24'
  }
];

export default function Pricing() {
  return (
    <div className="pricing-page">
      <div className="pricing-container">
        <div className="pricing-header">
          <h1>Simple, Transparent Pricing</h1>
          <p>Start free, scale as you grow. No hidden fees.</p>
        </div>

        <div className="pricing-cards">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`pricing-card ${plan.highlighted ? 'highlighted' : ''}`}
            >
              {plan.highlighted && <div className="popular-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>
              <p className="description">{plan.description}</p>
              <ul className="features">
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <span className="check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link 
                to="/signup" 
                className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="ticket-pricing">
          <h2>Ticket Pricing</h2>
          <p className="section-description">
            Low and Normal priority tickets are always free. Higher priorities ensure faster response times from qualified technicians.
          </p>
          <div className="ticket-grid">
            {ticketPricing.map((ticket, index) => (
              <div key={index} className="ticket-card" style={{ borderColor: ticket.color }}>
                <div className="ticket-header" style={{ backgroundColor: `${ticket.color}20` }}>
                  <h4 style={{ color: ticket.color }}>{ticket.priority}</h4>
                  <span className="price-tag" style={{ color: ticket.color }}>{ticket.price}</span>
                </div>
                <p>{ticket.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="tech-tiers">
          <h2>Technician Tier System</h2>
          <p className="section-description">
            As technicians complete tickets and receive good ratings, they progress through tiers, gaining access to better opportunities and higher pay rates.
          </p>
          <div className="tier-cards">
            {techTiers.map((tier, index) => (
              <div key={index} className="tier-card" style={{ borderTopColor: tier.color }}>
                <div className="tier-badge" style={{ backgroundColor: tier.color }}>
                  {tier.tier}
                </div>
                <div className="tier-info">
                  <div className="tier-stat">
                    <span className="label">Points Required</span>
                    <span className="value">{tier.points}</span>
                  </div>
                  <div className="tier-stat">
                    <span className="label">Environment Access</span>
                    <span className="value">{tier.access}</span>
                  </div>
                  <div className="tier-stat">
                    <span className="label">Pay Multiplier</span>
                    <span className="value">{tier.pay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pricing-faq">
          <h2>Common Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>Are there any setup fees?</h4>
              <p>No. There are no setup fees, cancellation fees, or hidden charges. You only pay for what you use.</p>
            </div>
            <div className="faq-item">
              <h4>Can I upgrade or downgrade at any time?</h4>
              <p>Yes! You can change your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="faq-item">
              <h4>What payment methods do you accept?</h4>
              <p>We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.</p>
            </div>
            <div className="faq-item">
              <h4>Is there a free trial for Pro?</h4>
              <p>Yes, new Pro accounts get a 14-day free trial with full access to all Pro features.</p>
            </div>
          </div>
        </div>

        <div className="pricing-cta">
          <h2>Ready to get started?</h2>
          <p>Join thousands of developers and businesses using Promote today.</p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn btn-primary btn-large">
              Start Free
            </Link>
            <Link to="/help" className="btn btn-secondary btn-large">
              Talk to Sales
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .pricing-page {
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 40px 20px;
        }

        .pricing-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .pricing-header h1 {
          font-size: 3rem;
          color: var(--text-primary);
          margin-bottom: 16px;
        }

        .pricing-header p {
          font-size: 1.25rem;
          color: var(--muted);
        }

        .pricing-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 80px;
        }

        .pricing-card {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 32px;
          border: 1px solid var(--line);
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }

        .pricing-card.highlighted {
          border-color: var(--amber);
          transform: scale(1.05);
        }

        .pricing-card.highlighted:hover {
          transform: scale(1.05) translateY(-4px);
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--amber);
          color: var(--bg-primary);
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .pricing-card h3 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 16px;
        }

        .price {
          display: flex;
          align-items: baseline;
          margin-bottom: 8px;
        }

        .price .amount {
          font-size: 3rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .price .period {
          font-size: 1rem;
          color: var(--muted);
          margin-left: 4px;
        }

        .pricing-card .description {
          color: var(--muted);
          margin-bottom: 24px;
        }

        .pricing-card .features {
          list-style: none;
          padding: 0;
          margin: 0 0 32px;
        }

        .pricing-card .features li {
          display: flex;
          align-items: center;
          padding: 8px 0;
          color: var(--text-secondary);
        }

        .pricing-card .check {
          color: var(--amber);
          margin-right: 12px;
          font-weight: bold;
        }

        .pricing-card .btn {
          width: 100%;
          text-align: center;
        }

        .ticket-pricing,
        .tech-tiers {
          margin-bottom: 80px;
        }

        .ticket-pricing h2,
        .tech-tiers h2 {
          font-size: 2rem;
          color: var(--text-primary);
          text-align: center;
          margin-bottom: 12px;
        }

        .section-description {
          text-align: center;
          color: var(--muted);
          max-width: 600px;
          margin: 0 auto 40px;
        }

        .ticket-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }

        .ticket-card {
          background: var(--bg-secondary);
          border-radius: 12px;
          border-top: 4px solid;
          overflow: hidden;
        }

        .ticket-header {
          padding: 20px;
          text-align: center;
        }

        .ticket-header h4 {
          font-size: 1rem;
          margin-bottom: 8px;
        }

        .ticket-header .price-tag {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .ticket-card p {
          padding: 16px;
          font-size: 0.875rem;
          color: var(--muted);
          text-align: center;
        }

        .tier-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .tier-card {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 32px;
          border-top: 4px solid;
          text-align: center;
        }

        .tier-badge {
          display: inline-block;
          padding: 8px 24px;
          border-radius: 24px;
          color: var(--bg-primary);
          font-weight: 600;
          font-size: 1.125rem;
          margin-bottom: 24px;
        }

        .tier-info {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tier-stat {
          display: flex;
          flex-direction: column;
        }

        .tier-stat .label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin-bottom: 4px;
        }

        .tier-stat .value {
          color: var(--text-primary);
          font-weight: 500;
        }

        .pricing-faq {
          margin-bottom: 80px;
        }

        .pricing-faq h2 {
          font-size: 2rem;
          color: var(--text-primary);
          text-align: center;
          margin-bottom: 40px;
        }

        .faq-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .faq-item {
          background: var(--bg-secondary);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid var(--line);
        }

        .faq-item h4 {
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .faq-item p {
          color: var(--muted);
          margin: 0;
        }

        .pricing-cta {
          text-align: center;
          padding: 64px;
          background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(99, 102, 241, 0.1) 100%);
          border-radius: 24px;
          border: 1px solid var(--line);
        }

        .pricing-cta h2 {
          font-size: 2rem;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .pricing-cta p {
          color: var(--muted);
          margin-bottom: 32px;
        }

        .cta-buttons {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        @media (max-width: 1024px) {
          .pricing-cards {
            grid-template-columns: 1fr;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
          }

          .pricing-card.highlighted {
            transform: none;
          }

          .pricing-card.highlighted:hover {
            transform: translateY(-4px);
          }

          .ticket-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .pricing-header h1 {
            font-size: 2rem;
          }

          .ticket-grid,
          .tier-cards,
          .faq-grid {
            grid-template-columns: 1fr;
          }

          .cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
