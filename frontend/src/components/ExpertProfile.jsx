import { useState, useEffect } from 'react';
import { api } from '../api/index.js';

/**
 * ExpertProfile Component
 * Displays expert profile with rating, stats, and verification status
 * Used in the "Trust Layer" for customers to see expert qualifications
 */
export default function ExpertProfile({ expertId, compact = false, showStats = true }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [expertId]);

  const loadProfile = async () => {
    if (!expertId) return;
    
    try {
      setLoading(true);
      const data = await api.expert.getPublicProfile(expertId);
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (err) {
      setError('Failed to load expert profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: compact ? '8px' : '16px', 
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}>
        {compact ? '...' : 'Loading profile...'}
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ 
        padding: compact ? '8px' : '16px', 
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '12px'
      }}>
        Expert info unavailable
      </div>
    );
  }

  const { user, skills, overallStats } = profile;
  const rating = overallStats?.avgRating || 0;
  const ticketsResolved = overallStats?.totalTicketsResolved || 0;

  // Render star rating
  const renderStars = (rating, maxStars = 5) => {
    const stars = [];
    for (let i = 1; i <= maxStars; i++) {
      if (i <= Math.floor(rating)) {
        stars.push('★');
      } else if (i - 0.5 <= rating) {
        stars.push('⯪');
      } else {
        stars.push('☆');
      }
    }
    return stars.join('');
  };

  if (compact) {
    // Compact view for inline display
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        background: 'var(--surface-2)',
        borderRadius: '16px',
        fontSize: '12px'
      }}>
        <span style={{ fontWeight: 600 }}>{user.name}</span>
        <span style={{ color: '#f59e0b' }}>
          {renderStars(rating)} {rating.toFixed(1)}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          {ticketsResolved} resolved
        </span>
      </div>
    );
  }

  // Full profile view
  return (
    <div style={{
      padding: '16px',
      background: 'var(--surface-1)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Avatar */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--primary-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 600,
          fontSize: '18px'
        }}>
          {user.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '16px' }}>{user.name}</span>
            <VerifiedBadge />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <StatCard
            label="Rating"
            value={rating.toFixed(1)}
            icon={<span style={{ color: '#f59e0b' }}>{renderStars(rating)}</span>}
          />
          <StatCard
            label="Resolved"
            value={ticketsResolved}
            suffix="tickets"
          />
          <StatCard
            label="Success"
            value={`${(overallStats?.successRate || 0).toFixed(0)}%`}
          />
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            color: 'var(--text-muted)',
            marginBottom: '8px'
          }}>
            TOP EXPERTISE
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {skills.slice(0, 6).map((skill, idx) => (
              <span
                key={idx}
                style={{
                  padding: '4px 10px',
                  background: skill.isCertified ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-2)',
                  color: skill.isCertified ? '#10b981' : 'var(--text)',
                  borderRadius: '16px',
                  fontSize: '12px',
                  border: skill.isCertified ? '1px solid #10b981' : 'none'
                }}
              >
                {skill.techName}
                {skill.isCertified && <span style={{ marginLeft: '4px' }}>✓</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Verified Badge Component
 */
function VerifiedBadge() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      background: 'rgba(16, 185, 129, 0.1)',
      color: '#10b981',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600
    }}>
      ✓ Verified
    </span>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ label, value, icon, suffix }) {
  return (
    <div style={{
      padding: '12px',
      background: 'var(--surface-2)',
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '18px', fontWeight: 600 }}>
        {icon || value}
        {suffix && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> {suffix}</span>}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
        {label}
      </div>
    </div>
  );
}

/**
 * ExpertSnippet Component
 * Small snippet for showing expert preview in lists
 */
export function ExpertSnippet({ expert, onClick }) {
  if (!expert) return null;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        background: 'var(--surface-1)',
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.2s'
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'var(--primary-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 600,
        fontSize: '14px'
      }}>
        {expert.name?.charAt(0)?.toUpperCase() || '?'}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 500, fontSize: '13px' }}>{expert.name}</span>
          {expert.isVerified && (
            <span style={{ color: '#10b981', fontSize: '10px' }}>✓</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ color: '#f59e0b' }}>
            {'★'.repeat(Math.floor(expert.rating || 0))}{'☆'.repeat(5 - Math.floor(expert.rating || 0))}
          </span>
          <span>{(expert.rating || 0).toFixed(1)}</span>
          <span>•</span>
          <span>{expert.ticketsResolved || 0} resolved</span>
        </div>
      </div>

      {/* Arrow */}
      {onClick && (
        <span style={{ color: 'var(--text-muted)' }}>›</span>
      )}
    </div>
  );
}

/**
 * QualifiedExpertsList Component
 * Shows list of qualified experts for a ticket
 */
export function QualifiedExpertsList({ category, complexity = 'moderate', maxExperts = 5 }) {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExperts();
  }, [category, complexity]);

  const loadExperts = async () => {
    try {
      setLoading(true);
      const data = await api.expert.getQualifiedExperts(category, complexity);
      if (data.success) {
        setExperts(data.experts.slice(0, maxExperts));
      }
    } catch (err) {
      console.error('Error loading experts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
        Loading qualified experts...
      </div>
    );
  }

  if (experts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
        No qualified experts available for this category yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ 
        fontSize: '12px', 
        fontWeight: 600, 
        color: 'var(--text-muted)',
        marginBottom: '4px'
      }}>
        QUALIFIED EXPERTS ({experts.length})
      </div>
      {experts.map((expert) => (
        <ExpertSnippet
          key={expert.id}
          expert={{
            id: expert.id,
            name: expert.name,
            rating: expert.avgRating || expert.rating,
            ticketsResolved: expert.totalTicketsResolved || expert.tickets_resolved,
            isVerified: expert.meetsRating && expert.meetsExperience
          }}
        />
      ))}
    </div>
  );
}
