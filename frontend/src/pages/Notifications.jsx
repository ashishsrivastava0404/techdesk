import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';

export default function Notifications() {
  const { user, showToast } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.name) {
      loadNotifications();
    }
  }, [user?.name]);

  const loadNotifications = async () => {
    try {
      const [data, countData] = await Promise.all([
        api.notifications.get(user.name, { limit: 50 }),
        api.notifications.getCount(user.name)
      ]);
      setNotifications(data);
      setUnreadCount(countData.unread_count);
    } catch (error) {
      showToast('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      showToast('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllRead(user.name);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read');
    } catch (error) {
      showToast('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_ticket': return '📋';
      case 'ticket_claimed': return '✋';
      case 'ticket_resolved': return '✅';
      case 'new_message': return '💬';
      case 'rating_received': return '⭐';
      case 'hire_request': return '💼';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'ticket_claimed': return 'var(--blue)';
      case 'ticket_resolved': return 'var(--green)';
      case 'rating_received': return 'var(--amber)';
      case 'new_ticket': return 'var(--amber)';
      default: return 'var(--text)';
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (!user?.name) {
    return (
      <div className="view-container">
        <div className="empty">
          <div className="empty-title">Notifications</div>
          <p>Enter your name to view notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="view-title" style={{ marginBottom: '4px' }}>Notifications</h2>
          <p className="view-sub" style={{ margin: 0 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="empty" style={{ padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <div className="empty-title">No notifications</div>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          {notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
              style={{
                padding: '16px',
                borderBottom: '1px solid var(--line)',
                cursor: notification.is_read ? 'default' : 'pointer',
                background: notification.is_read ? 'transparent' : 'rgba(255, 180, 84, 0.05)',
                display: 'flex',
                gap: '12px',
                transition: 'background 0.15s'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}>
                {getNotificationIcon(notification.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ 
                      fontWeight: notification.is_read ? 400 : 600,
                      fontSize: '14px',
                      color: notification.is_read ? 'var(--muted)' : getNotificationColor(notification.type)
                    }}>
                      {notification.title}
                    </div>
                    {notification.message && (
                      <div style={{ 
                        fontSize: '13px', 
                        color: 'var(--muted)',
                        marginTop: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notification.message}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {!notification.is_read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--amber)'
                      }} />
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                </div>
                {notification.related_user && (
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                    From: {notification.related_user}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
