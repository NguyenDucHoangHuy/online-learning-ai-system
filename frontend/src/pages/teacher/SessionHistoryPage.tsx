// frontend/src/pages/teacher/SessionHistoryPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/SidebarTeacher';

const sessionData = [
  {
    id: 1,
    title: 'NEURAL NETWORKS ARCHITECTURE',
    date: '4/20/2026',
    status: 'ARCHIVED',
    idCode: 'ID: AI-902',
    isActive: false,
  },
  {
    id: 2,
    title: 'MACROECONOMIC PRINCIPLES',
    date: '4/25/2026',
    status: 'ARCHIVED',
    idCode: 'ID: ECON-1',
    isActive: false,
  },
  {
    id: 3,
    title: 'QUANTUM COMPUTING INTRO',
    date: '4/28/2026',
    status: 'ARCHIVED',
    idCode: 'ID: PHY-8',
    isActive: false,
  },
  {
    id: 4,
    title: 'ADVANCED UX PATTERNS',
    date: '5/6/2026',
    status: 'ACTIVE CHANNEL',
    idCode: 'ID: CS-505',
    isActive: true,
  },
];

const SessionHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.pageContainer}>
      {/* Sử dụng component Sidebar */}
      <Sidebar activeItem="History" />

      {/* --- Nội dung chính --- */}
      <main style={styles.mainContent}>
        <div style={styles.headerContainer}>
          <h1 style={styles.title}>Session History</h1>
          <p style={styles.subtitle}>
            Review past classrooms and comprehensive emotional analysis reports
          </p>
        </div>

        <div style={styles.sessionList}>
          {sessionData.map((item) => (
            <div key={item.id} style={styles.sessionCard}>
              <div style={styles.cardLeft}>
                <div style={styles.cardIcon}>📊</div>
                <div style={styles.cardInfo}>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  <div style={styles.metaContainer}>
                    <span style={styles.metaItem}>
                      📅 <span style={styles.metaText}>{item.date}</span>
                    </span>
                    <span
                      style={
                        item.isActive
                          ? styles.metaItemActive
                          : styles.metaItemArchived
                      }
                    >
                      🕒{' '}
                      <span
                        style={
                          item.isActive
                            ? styles.metaTextActive
                            : styles.metaTextArchived
                        }
                      >
                        {item.status}
                      </span>
                    </span>
                    <span style={styles.metaItem}>
                      📖 <span style={styles.metaText}>{item.idCode}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.cardRight}>
                {item.isActive && (
                  <button
                    style={styles.resumeBtn}
                    onClick={() => alert(`Resuming pulse for ${item.title}`)}
                  >
                    👁️ RESUME PULSE
                  </button>
                )}
                <button
                  style={styles.inspectBtn}
                  onClick={() => navigate('/teacher/session-report')}
                >
                  INSPECT REPORT
                </button>
              </div>
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
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    color: '#0f172a',
    paddingLeft: '270px', // Thêm dòng này để chừa chỗ cho Sidebar cố định
  },
  mainContent: {
    flex: 1,
    padding: '44px 64px',
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
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px 32px',
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
  cardIcon: {
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
  metaItemActive: {
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
  metaTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  metaItemArchived: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: '700',
  },
  metaTextArchived: {
    color: '#475569',
    fontWeight: '800',
  },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  resumeBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '10px',
    border: 'none',
    fontWeight: '700',
    fontSize: '11px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  inspectBtn: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    padding: '12px 24px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontWeight: '800',
    fontSize: '11px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
  },
};

export default SessionHistoryPage;