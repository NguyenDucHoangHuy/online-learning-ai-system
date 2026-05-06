// frontend/src/pages/student/MyLearningPage.tsx
import React from 'react';

const learningData = [
  {
    id: 1,
    title: 'CALCULUS I: INTEGRALS',
    date: '2/15/2026',
    status: 'COURSE COMPLETED',
    room: 'ROOM: MATH-101',
  },
  {
    id: 2,
    title: 'MACROECONOMIC PRINCIPLES',
    date: '3/10/2026',
    status: 'COURSE COMPLETED',
    room: 'ROOM: ECON-1',
  },
  {
    id: 3,
    title: 'ETHICS IN AI FOUNDATIONS',
    date: '4/5/2026',
    status: 'COURSE COMPLETED',
    room: 'ROOM: PHI-302',
  },
  {
    id: 4,
    title: 'ORGANIC CHEMISTRY LAB',
    date: '4/22/2026',
    status: 'COURSE COMPLETED',
    room: 'ROOM: CHEM-4',
  },
];

const MyLearningPage: React.FC = () => {
  return (
    <div style={styles.pageContainer}>
      {/* --- Sidebar Điều Hướng --- */}
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.brandContainer}>
            <div style={styles.brandLogo}>AI</div>
            <div style={styles.brandText}>
              <span style={styles.brandTitle}>EduSense</span>
              <span style={styles.brandSubtitle}>PLATFORM</span>
            </div>
          </div>

          <nav style={styles.navMenu}>
            <div style={styles.navItem}>
              <span style={styles.navIcon}>🏠</span>
              <span>Join Class</span>
            </div>
            <div style={{ ...styles.navItem, ...styles.navItemActive }}>
              <span style={styles.navIcon}>⏱️</span>
              <span>History</span>
            </div>
          </nav>
        </div>

        <div style={styles.bottomSection}>
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>👤</div>
            <div style={styles.userDetails}>
              <span style={styles.userName}>STUDENT</span>
            </div>
          </div>
          <button style={styles.signOutBtn} onClick={() => alert('Sign Out')}>
            <span style={styles.signOutIcon}>↪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* --- Nội dung chính --- */}
      <main style={styles.mainContent}>
        <div style={styles.headerContainer}>
          <h1 style={styles.title}>My Learning</h1>
          <p style={styles.subtitle}>Review your academic journey and previous classroom interactions</p>
        </div>

        <div style={styles.learningList}>
          {learningData.map((item) => (
            <div key={item.id} style={styles.learningCard}>
              <div style={styles.cardLeft}>
                <div style={styles.bookIcon}>📖</div>
                <div style={styles.cardInfo}>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  <div style={styles.metaContainer}>
                    <span style={styles.metaItem}>
                      📅 <span style={styles.metaText}>{item.date}</span>
                    </span>
                    <span style={styles.metaItemGreen}>
                      ⏱️ <span style={styles.metaTextGreen}>{item.status}</span>
                    </span>
                    <span style={styles.metaItem}>
                      🕒 <span style={styles.metaText}>{item.room}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button style={styles.reviewBtn} onClick={() => alert(`Reviewing insights for ${item.title}`)}>
                REVIEW INSIGHTS
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#ffffff', // Nền trang chính màu trắng
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    color: '#0f172a',
  },
  sidebar: {
    width: '270px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '32px 24px',
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
  mainContent: {
    flex: 1,
    padding: '44px 64px',
    backgroundColor: '#f8fafc', // Màu nền nội dung hơi xám nhẹ
    overflowY: 'auto',
  },
  headerContainer: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    fontWeight: '500',
  },
  learningList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  learningCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '18px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
  },
  bookIcon: {
    fontSize: '24px',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    width: '54px',
    height: '54px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  metaContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500',
  },
  metaText: {
    fontWeight: '700',
    color: '#334155',
  },
  metaItemGreen: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: '700',
  },
  metaTextGreen: {
    color: '#059669',
    fontWeight: '800',
  },
  reviewBtn: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '12px 26px',
    borderRadius: '10px',
    border: 'none',
    fontWeight: '800',
    fontSize: '11px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
};
export default MyLearningPage;