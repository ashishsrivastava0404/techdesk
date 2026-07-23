import { useState } from 'react';
import { Link } from 'react-router-dom';

const faqCategories = [
  {
    name: 'Getting Started',
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Click the "Sign Up" button on the landing page. You can register with your email and password, or sign up with your Google account for faster access.'
      },
      {
        q: 'What are the different user roles?',
        a: 'There are three main roles: Customers (submit tickets for tech support), Technicians/Techs (resolve tickets and earn money), and Admins (manage the platform).'
      },
      {
        q: 'Is Promote free to use?',
        a: 'Yes! Basic features are completely free. Low and Normal priority tickets are free for customers. Only High, Urgent, and Critical tickets require credits, which are very affordable.'
      }
    ]
  },
  {
    name: 'For Customers',
    questions: [
      {
        q: 'How do I submit a ticket?',
        a: 'After logging in, go to "Submit Ticket" from the dashboard. Fill in the ticket details including title, description, environment, and priority level. Submit and wait for a technician to claim your ticket.'
      },
      {
        q: 'How much do tickets cost?',
        a: 'Low and Normal priority tickets are FREE. High priority tickets cost 50% of the tech\'s base pay. Urgent tickets are 75% of base pay. Critical tickets are 100% of base pay.'
      },
      {
        q: 'How do I rate a technician?',
        a: 'After a ticket is resolved, you\'ll receive a rating prompt. Rate the technician on a scale of 1-5 stars and optionally provide feedback. Your rating helps build the tech\'s reputation.'
      },
      {
        q: 'Can I cancel a ticket?',
        a: 'You can cancel a ticket before it\'s claimed by a technician. Once claimed, you\'ll need to work with the assigned technician to resolve the issue or escalate to admin support.'
      }
    ]
  },
  {
    name: 'For Technicians',
    questions: [
      {
        q: 'How do I start earning?',
        a: 'After signing up, you\'ll start at the Dev tier. Browse available tickets in the "Available Tickets" section, claim one that matches your skills, resolve it, and get rated by the customer.'
      },
      {
        q: 'What are the tier levels?',
        a: 'There are three tiers: Dev (0-32 points, access to dev environment), Staging (33-65 points, access to staging), and Production-Ready (66+ points, access to all tickets including production).'
      },
      {
        q: 'How do points work?',
        a: 'Points are earned through ticket resolution. Each completed ticket earns you points based on complexity. Maintain high ratings to progress to higher tiers and access better-paying tickets.'
      },
      {
        q: 'When do I get paid?',
        a: 'Earnings are calculated after each ticket. You can view your balance in the Earnings section. Payouts are processed based on the minimum payout threshold set by the platform.'
      },
      {
        q: 'What payment methods are supported?',
        a: 'We support multiple payment methods including Stripe, PayPal, and direct bank transfer. Set up your preferred payment method in your account settings.'
      }
    ]
  },
  {
    name: 'Credits & Payments',
    questions: [
      {
        q: 'What are credits?',
        a: 'Credits are used to pay for higher priority tickets. You can purchase credits through the billing section using Stripe or PayPal.'
      },
      {
        q: 'Can I get a refund for unused credits?',
        a: 'Credit refunds are handled on a case-by-case basis. Contact support if you have issues with your credit balance.'
      }
    ]
  },
  {
    name: 'Security & Privacy',
    questions: [
      {
        q: 'Is my data secure?',
        a: 'Yes. We use industry-standard security measures including password hashing, JWT authentication, HTTPS encryption, and secure database practices.'
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot password?" on the login page and enter your email. You\'ll receive a reset link to create a new password.'
      },
      {
        q: 'What information do you collect?',
        a: 'We collect account information (name, email), ticket data, and usage analytics. We never sell your personal information. See our Privacy Policy for details.'
      }
    ]
  }
];

export default function FAQ() {
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);

  const toggleQuestion = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  return (
    <div className="faq-page">
      <div className="faq-container">
        <div className="faq-header">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about using Promote</p>
        </div>

        <div className="faq-content">
          <div className="faq-sidebar">
            <h3>Categories</h3>
            <ul>
              {faqCategories.map((category, index) => (
                <li key={index}>
                  <button
                    className={activeCategory === index ? 'active' : ''}
                    onClick={() => setActiveCategory(index)}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="faq-questions">
            <h2>{faqCategories[activeCategory].name}</h2>
            {faqCategories[activeCategory].questions.map((item, index) => {
              const globalIndex = activeCategory * 10 + index;
              return (
                <div 
                  key={index} 
                  className={`faq-item ${expandedQuestion === globalIndex ? 'expanded' : ''}`}
                >
                  <button 
                    className="faq-question"
                    onClick={() => toggleQuestion(globalIndex)}
                  >
                    <span>{item.q}</span>
                    <span className="faq-icon">{expandedQuestion === globalIndex ? '−' : '+'}</span>
                  </button>
                  {expandedQuestion === globalIndex && (
                    <div className="faq-answer">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="faq-cta">
          <h3>Still have questions?</h3>
          <p>Can't find what you're looking for? Contact our support team.</p>
          <Link to="/submit" className="btn btn-primary">Submit a Ticket</Link>
        </div>
      </div>

      <style>{`
        .faq-page {
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 40px 20px;
        }

        .faq-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .faq-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .faq-header h1 {
          font-size: 2.5rem;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .faq-header p {
          color: var(--muted);
          font-size: 1.125rem;
        }

        .faq-content {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 32px;
        }

        .faq-sidebar {
          position: sticky;
          top: 100px;
          height: fit-content;
        }

        .faq-sidebar h3 {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin-bottom: 16px;
        }

        .faq-sidebar ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .faq-sidebar li {
          margin-bottom: 4px;
        }

        .faq-sidebar button {
          width: 100%;
          text-align: left;
          padding: 10px 16px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9375rem;
        }

        .faq-sidebar button:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .faq-sidebar button.active {
          background: var(--amber);
          color: var(--bg-primary);
          font-weight: 500;
        }

        .faq-questions h2 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 24px;
        }

        .faq-item {
          background: var(--bg-secondary);
          border-radius: 12px;
          margin-bottom: 12px;
          border: 1px solid var(--line);
          overflow: hidden;
        }

        .faq-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s;
        }

        .faq-question:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .faq-item.expanded .faq-question {
          border-bottom: 1px solid var(--line);
        }

        .faq-icon {
          font-size: 1.5rem;
          color: var(--amber);
          font-weight: 300;
        }

        .faq-answer {
          padding: 20px;
          background: var(--bg-secondary);
        }

        .faq-answer p {
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0;
        }

        .faq-cta {
          text-align: center;
          margin-top: 64px;
          padding: 48px;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--line);
        }

        .faq-cta h3 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .faq-cta p {
          color: var(--muted);
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .faq-content {
            grid-template-columns: 1fr;
          }

          .faq-sidebar {
            position: static;
            overflow-x: auto;
            margin-bottom: 24px;
          }

          .faq-sidebar ul {
            display: flex;
            gap: 8px;
          }

          .faq-sidebar li {
            flex-shrink: 0;
          }

          .faq-sidebar button {
            width: auto;
            padding: 8px 16px;
          }
        }
      `}</style>
    </div>
  );
}
