import React from 'react';

interface SidebarProps {
  onSignOut?: () => void;
  activeItem?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onSignOut, activeItem = 'Join Class' }) => {
  return (
    <aside style={styles.sidebar}>
      {/* Phần trên cùng: Logo và Menu điều hướng */}
      <div>
        <div style={styles.brandContainer}>
          <div style={styles.brandLogo}>AI</div>
          <div style={styles.brandText}>
            <span style={styles.brandTitle}>EduSense</span>
            <span style={styles.brandSubtitle}>PLATFORM</span>
          </div>
        </div>

        <nav style={styles.navMenu}>
          <div style={{ ...styles.navItem, ...(activeItem === 'Join Class' ? styles.navItemActive : {}) }}>
            <span style={styles.navIcon}>🏠</span>
            <span>Join Class</span>
          </div>
          <div style={styles.navItem}>
            <span style={styles.navIcon}>⏱️</span>
            <span>History</span>
          </div>
        </nav>
      </div>

      {/* Phần dưới cùng: User Profile và Sign Out cố định ở đáy */}
      <div style={styles.bottomSection}>
        <div style={styles.userProfile}>
          <div style={styles.userAvatar}>👤</div>
          <div style={styles.userDetails}>
            <span style={styles.userName}>STUDENT</span>
          </div>
        </div>
        <button style={styles.signOutBtn} onClick={onSignOut || (() => alert('Sign Out'))}>
          <span style={styles.signOutIcon}>↪</span> Sign Out
        </button>
      </div>
    </aside>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: '270px',
    height: '100vh',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '32px 24px',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '40px',
  },
  brandLogo: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '12px',
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontWeight: '800',
    fontSize: '14px',
    color: '#0f172a',
    lineHeight: '1.2',
  },
  brandSubtitle: {
    fontSize: '9px',
    color: '#64748b',
    letterSpacing: '1.2px',
    fontWeight: '700',
    marginTop: '2px',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '10px 14px',
    borderRadius: '8px',
    color: '#64748b',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  navItemActive: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
  },
  navIcon: {
    fontSize: '16px',
  },
  bottomSection: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '20px',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
    backgroundColor: '#f8fafc',
    padding: '8px 12px',
    borderRadius: '8px',
  },
  userAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#64748b',
  },
  signOutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px',
    backgroundColor: '#ffffff',
    border: '1px solid #fecaca',
    color: '#ef4444',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
};

export default Sidebar;