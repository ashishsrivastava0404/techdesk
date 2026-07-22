import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';
import HireModal from '../components/HireModal.jsx';

export default function Leaderboard() {
  const { user, showToast, requireName } = useApp();
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hireTech, setHireTech] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await api.users.leaderboard();
      setTechs(data);
    } catch (error) {
      showToast('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRungFill = (composite, from, to) => {
    const pct = Math.max(0, Math.min(100, (composite - from) / (to - from) * 100));
    return pct;
  };

  const getBarWidths = (composite) => {
    const devPct = composite >= 33 ? 100 : getRungFill(composite, 0, 33);
    const stagingPct = composite <= 33 ? 0 : (composite >= 66 ? 100 : getRungFill(composite, 33, 66));
    const prodPct = composite <= 66 ? 0 : getRungFill(composite, 66, 100);
    return { devPct, stagingPct, prodPct };
  };

  if (loading) {
    return (
      <div className="view-container">
        <div className="empty">Loading leaderboard...</div>
      </div>
    );
  }

  const isCustomer = user?.role === 'customer';

  return (
    <div className="view-container">
      <h2 className="view-title">
        {isCustomer ? 'Hire a Pro' : 'Leaderboard'}
      </h2>
      <p className="view-sub">
        {isCustomer 
          ? 'Ranked by score earned resolving tickets. Production-Ready techs are proven and ready for paid work.'
          : 'See where you rank. Climb the ladder by resolving tickets well and fast.'}
      </p>
      
      <div className="shared-note">
        Shared across everyone using this app
      </div>

      {techs.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No techs yet</div>
          <p>Scores appear once techs start resolving rated tickets.</p>
        </div>
      ) : (
        techs.map((tech, index) => {
          const { devPct, stagingPct, prodPct } = getBarWidths(tech.composite);
          const hireBtn = isCustomer ? (
            <button
              className={`btn btn-sm ${tech.tier === 'Production-Ready' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => tech.tier === 'Production-Ready' && setHireTech(tech)}
              disabled={tech.tier !== 'Production-Ready'}
              title={tech.tier !== 'Production-Ready' ? 'Available once Production-Ready' : ''}
            >
              Request for production
            </button>
          ) : null;

          return (
            <div key={tech.name} className="tech-card">
              <div className="rank-num">#{index + 1}</div>
              <div>
                <div className="tech-name">{tech.name}</div>
                <div className="tech-sub">
                  {tech.count} rated {tech.count === 1 ? 'ticket' : 'tickets'} ·{' '}
                  {tech.avgRating ? `${tech.avgRating}★ avg` : 'no ratings yet'}
                </div>
                <div className="ladder">
                  <div className="rung">
                    <div className="rung-fill" style={{ width: `${devPct}%`, background: 'var(--blue)' }} />
                  </div>
                  <div className="rung">
                    <div className="rung-fill" style={{ width: `${stagingPct}%`, background: 'var(--amber)' }} />
                  </div>
                  <div className="rung">
                    <div className="rung-fill" style={{ width: `${prodPct}%`, background: 'var(--green)' }} />
                  </div>
                </div>
                <div className="ladder-labels">
                  <span className="rung-label">Dev</span>
                  <span className="rung-label">Staging</span>
                  <span className="rung-label">Production</span>
                </div>
              </div>
              <div className="score-col">
                <div className="score-num">{tech.composite}</div>
                <span className={`tier-tag tier-${tech.tier.replace(/\s/g, '-')}`}>
                  {tech.tier}
                </span>
                {hireBtn}
              </div>
            </div>
          );
        })
      )}

      {hireTech && (
        <HireModal
          tech={hireTech}
          onSubmit={async (message, contact) => {
            try {
              await api.hireRequests.create({
                tech_name: hireTech.name,
                customer_name: user.name,
                message,
                contact
              });
              showToast('Request sent!');
              setHireTech(null);
            } catch (error) {
              showToast(error.message || 'Failed to send request');
            }
          }}
          onClose={() => setHireTech(null)}
        />
      )}
    </div>
  );
}
