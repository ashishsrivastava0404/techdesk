import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// Slide data
const SLIDES = [
  {
    id: 1,
    badge: '🚀 New Features',
    title: 'Smart AI-Powered Ticket Routing',
    titleHighlight: 'AI-Powered Ticket Routing',
    description: 'Automatically assign tickets to the right technicians based on expertise, workload, and availability. Reduce resolution time by 50%.',
    features: ['Auto-assignment', 'Expertise matching', 'Load balancing'],
    cta: 'Start Free Trial',
    secondaryCta: 'Watch Demo',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: '🤖'
  },
  {
    id: 2,
    badge: '🌍 Global Ready',
    title: 'Multi-Language Support',
    titleHighlight: 'Multi-Language Support',
    description: 'Serve customers in their native language. Built-in translations for 9+ languages with RTL support.',
    features: ['9+ Languages', 'RTL Support', 'Auto locale detection'],
    cta: 'Explore Features',
    secondaryCta: 'View Pricing',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    icon: '🌍'
  },
  {
    id: 3,
    badge: '⚡ Real-Time',
    title: 'Instant Customer Connection',
    titleHighlight: 'Instant Customer Connection',
    description: 'Real-time messaging between technicians and customers. Get instant notifications and faster response times.',
    features: ['Live chat', 'Push notifications', 'Email & SMS'],
    cta: 'Get Started',
    secondaryCta: 'Learn More',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: '⚡'
  },
  {
    id: 4,
    badge: '💰 Fair Compensation',
    title: 'Built-In Credit System',
    titleHighlight: 'Built-In Credit System',
    description: 'Fair and transparent compensation for technicians. Track earnings, request payouts, and manage finances seamlessly.',
    features: ['Auto calculations', 'Payout tracking', 'Financial reports'],
    cta: 'See How It Works',
    secondaryCta: 'Join as Tech',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: '💰'
  },
  {
    id: 5,
    badge: '🎨 Beautiful Design',
    title: 'Customizable Branding',
    titleHighlight: 'Customizable Branding',
    description: 'White-label solution with full customization. Match your brand colors, logo, and messaging for a seamless experience.',
    features: ['Custom colors', 'Logo upload', 'Email templates'],
    cta: 'Try It Free',
    secondaryCta: 'View Templates',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    icon: '🎨'
  }
];

// Auto-play interval (milliseconds)
const AUTO_PLAY_INTERVAL = 6000;

export default function HeroSlides() {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = useCallback((index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % SLIDES.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + SLIDES.length) % SLIDES.length);
  }, [currentSlide, goToSlide]);

  // Auto-play
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(nextSlide, AUTO_PLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === ' ') setIsPaused(p => !p);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevSlide, nextSlide]);

  const slide = SLIDES[currentSlide];

  return (
    <div className="hero-slides-container">
      {/* Main Slide */}
      <div 
        className="hero-slide"
        style={{ background: slide.gradient }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="slide-content">
          {/* Badge */}
          <div className="slide-badge">
            <span className="badge-icon">{slide.icon}</span>
            <span>{slide.badge}</span>
          </div>

          {/* Title */}
          <h1 className="slide-title">
            {slide.title.split(slide.titleHighlight)[0]}
            <span className="title-highlight"> {slide.titleHighlight.replace(slide.title.split(' ').slice(0, 2).join(' '), '')}</span>
          </h1>

          {/* Description */}
          <p className="slide-description">
            {slide.description}
          </p>

          {/* Features */}
          <div className="slide-features">
            {slide.features.map((feature, idx) => (
              <div key={idx} className="feature-tag">
                <span className="feature-check">✓</span>
                {feature}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="slide-ctas">
            <button className="cta-primary">
              {slide.cta}
              <span className="cta-arrow">→</span>
            </button>
            <button className="cta-secondary">
              {slide.secondaryCta}
            </button>
          </div>
        </div>

        {/* Visual Element */}
        <div className="slide-visual">
          <div className="visual-card">
            <div className="card-header">
              <div className="status-dot active"></div>
              <span>TechDesk Dashboard</span>
            </div>
            <div className="card-content">
              <div className="stat-row">
                <div className="stat">
                  <span className="stat-value">247</span>
                  <span className="stat-label">Open Tickets</span>
                </div>
                <div className="stat">
                  <span className="stat-value">18m</span>
                  <span className="stat-label">Avg Response</span>
                </div>
                <div className="stat">
                  <span className="stat-value">94%</span>
                  <span className="stat-label">Satisfaction</span>
                </div>
              </div>
              <div className="ticket-list">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="ticket-item">
                    <div className="ticket-icon">📋</div>
                    <div className="ticket-info">
                      <span className="ticket-title">Ticket #{1000 + i}</span>
                      <span className="ticket-meta">Priority: {['High', 'Normal', 'Low'][i-1]}</span>
                    </div>
                    <span className="ticket-badge">{['Active', 'Pending', 'New'][i-1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        className="slide-nav prev" 
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button 
        className="slide-nav next" 
        onClick={nextSlide}
        aria-label="Next slide"
      >
        ›
      </button>

      {/* Dots */}
      <div className="slide-dots">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            className={`dot ${idx === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="slide-progress">
        <div 
          className="progress-bar"
          style={{ 
            animationDuration: `${AUTO_PLAY_INTERVAL}ms`,
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        />
      </div>

      {/* Slide Counter */}
      <div className="slide-counter">
        <span className="current">{String(currentSlide + 1).padStart(2, '0')}</span>
        <span className="separator">/</span>
        <span className="total">{String(SLIDES.length).padStart(2, '0')}</span>
      </div>

      <style>{`
        .hero-slides-container {
          position: relative;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .hero-slide {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 60px 80px;
          min-height: 500px;
          color: white;
          transition: all 0.5s ease;
        }

        .slide-content {
          flex: 1;
          max-width: 550px;
        }

        .slide-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .badge-icon {
          font-size: 16px;
        }

        .slide-title {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.2;
          margin: 0 0 20px 0;
        }

        .title-highlight {
          display: block;
          background: linear-gradient(90deg, #ffd700, #ffed4a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .slide-description {
          font-size: 18px;
          line-height: 1.6;
          opacity: 0.95;
          margin: 0 0 30px 0;
        }

        .slide-features {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 35px;
        }

        .feature-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.15);
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .feature-check {
          color: #4ade80;
        }

        .slide-ctas {
          display: flex;
          gap: 16px;
        }

        .cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: #333;
          border: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .cta-arrow {
          transition: transform 0.2s;
        }

        .cta-primary:hover .cta-arrow {
          transform: translateX(4px);
        }

        .cta-secondary {
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.5);
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cta-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: white;
        }

        .slide-visual {
          flex: 1;
          display: flex;
          justify-content: flex-end;
          max-width: 400px;
        }

        .visual-card {
          background: white;
          border-radius: 16px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
          color: #333;
          font-weight: 600;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ccc;
        }

        .status-dot.active {
          background: #22c55e;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .card-content {
          padding: 20px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 800;
          color: #333;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
        }

        .ticket-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ticket-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 10px;
        }

        .ticket-icon {
          font-size: 20px;
        }

        .ticket-info {
          flex: 1;
        }

        .ticket-title {
          display: block;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .ticket-meta {
          font-size: 12px;
          color: #666;
        }

        .ticket-badge {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          background: #e0f2fe;
          color: #0284c7;
          font-weight: 600;
        }

        /* Navigation */
        .slide-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          font-size: 28px;
          color: #333;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .slide-nav:hover {
          background: white;
          transform: translateY(-50%) scale(1.1);
        }

        .slide-nav.prev {
          left: 20px;
        }

        .slide-nav.next {
          right: 20px;
        }

        /* Dots */
        .slide-dots {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 10;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        .dot.active {
          background: white;
          transform: scale(1.2);
        }

        .dot:hover:not(.active) {
          background: rgba(255, 255, 255, 0.7);
        }

        /* Progress Bar */
        .slide-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
        }

        .progress-bar {
          height: 100%;
          background: white;
          width: 100%;
          transform-origin: left;
          animation: progress linear forwards;
        }

        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        /* Counter */
        .slide-counter {
          position: absolute;
          top: 30px;
          right: 40px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          z-index: 10;
        }

        .slide-counter .current {
          font-weight: 800;
          font-size: 24px;
        }

        .slide-counter .separator {
          margin: 0 5px;
        }

        .slide-counter .total {
          opacity: 0.6;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .hero-slide {
            flex-direction: column;
            padding: 40px 30px;
            text-align: center;
          }

          .slide-content {
            max-width: 100%;
          }

          .slide-title {
            font-size: 36px;
          }

          .slide-features {
            justify-content: center;
          }

          .slide-ctas {
            justify-content: center;
            flex-wrap: wrap;
          }

          .slide-visual {
            margin-top: 30px;
            max-width: 100%;
          }

          .slide-nav {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
