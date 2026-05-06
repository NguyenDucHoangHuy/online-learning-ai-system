import React, { useState } from 'react';
import Sidebar from '../../components/layout/SidebarStudent';

const ongoingSessions = [
  {
    id: 1,
    title: 'Advanced Robotics Lab',
    roomCode: 'ROBO-1',
  },
  {
    id: 2,
    title: 'Circuit Design Patterns',
    roomCode: 'CIRC-2',
  },
  {
    id: 3,
    title: 'Digital Art & Geometry',
    roomCode: 'ART-99',
  },
  {
    id: 4,
    title: 'Political Economics',
    roomCode: 'POL-10',
  },
];

const JoinClassPage: React.FC = () => {
  
  const [roomCode, setRoomCode] = useState('');

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Joining classroom: ${roomCode}`);
  };

  return (
    <div style={styles.pageContainer}>
      {/* Sidebar cố định */}
      <Sidebar activeItem="Join Class" />

      {/* Nội dung chính */}
      <main style={styles.mainContent}>
        {/* Tiêu đề */}
        <div style={styles.headerContainer}>
          <h1 style={styles.title}>Welcome back, !</h1>
          <p style={styles.subtitle}>Ready to start your learning session?</p>
        </div>

        <div style={styles.contentGrid}>
          {/* Form Join Class */}
          <div style={styles.joinClassCard}>
            <div style={styles.iconContainer}>
              <span style={styles.searchIcon}>🔍</span>
            </div>

            <div>
              <h2 style={styles.cardTitle}>Join a Classroom</h2>
              <p style={styles.cardSubtitle}>
                Enter the unique session code provided by your teacher to enter the
                live interactive environment.
              </p>
            </div>

            <form onSubmit={handleJoinClass} style={styles.formGroup}>
              <label style={styles.label}>ROOM CODE</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="MATH-101"
                style={styles.input}
              />
              <button type="submit" style={styles.submitBtn}>
                Enter Classroom &#8594;
              </button>
            </form>
          </div>

          {/* Ongoing Sessions Card */}
          <div style={styles.ongoingCard}>
            <div style={styles.ongoingHeader}>
              <div style={styles.clockIconBox}>⏱️</div>
              <div>
                <h2 style={styles.ongoingTitle}>Ongoing Sessions</h2>
                <p style={styles.ongoingSubtitle}>
                  Quickly jump back into active classes you are currently enrolled in.
                </p>
              </div>
            </div>

            <div style={styles.sessionList}>
              {ongoingSessions.map((session) => (
                <div
                  key={session.id}
                  style={styles.sessionItem}
                  onClick={() => alert(`Joining ${session.title}`)}
                >
                  <div style={styles.sessionItemLeft}>
                    <div style={styles.bookIconBox}>📖</div>
                    <div>
                      <h3 style={styles.sessionTitle}>{session.title}</h3>
                      <span style={styles.sessionCode}>{session.roomCode}</span>
                    </div>
                  </div>
                  <span style={styles.arrowIcon}>&#8594;</span>
                </div>
              ))}
            </div>
          </div>
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
    paddingLeft: '270px', // Chừa khoảng trống cho Sidebar
  },
  mainContent: {
    flex: 1,
    padding: '48px 64px',
    overflowY: 'auto',
  },
  headerContainer: {
    marginBottom: '40px',
  },
  title: {
    fontSize: '38px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
    margin: 0,
    fontWeight: '500',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '28px',
    alignItems: 'start',
  },
  joinClassCard: {
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '40px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    height: '420px',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: '46px',
    height: '46px',
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#3b82f6',
    fontSize: '20px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  cardSubtitle: {
    fontSize: '12px',
    lineHeight: '1.5',
    color: '#64748b',
    margin: 0,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '9px',
    fontWeight: '800',
    letterSpacing: '1px',
    color: '#94a3b8',
  },
  input: {
    padding: '16px 20px',
    fontSize: '15px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  submitBtn: {
    marginTop: '6px',
    padding: '18px 24px',
    backgroundColor: '#475569',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '12px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.4px',
    transition: 'background-color 0.2s',
  },
  ongoingCard: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '28px',
    padding: '40px',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)',
    height: '420px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  ongoingHeader: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  clockIconBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },
  ongoingTitle: {
    fontSize: '20px',
    fontWeight: '800',
    margin: '0 0 6px 0',
    color: '#ffffff',
  },
  ongoingSubtitle: {
    fontSize: '12px',
    lineHeight: '1.4',
    color: '#93c5fd',
    margin: 0,
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '12px',
  },
  sessionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 18px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  sessionItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  bookIconBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  sessionTitle: {
    fontSize: '12px',
    fontWeight: '800',
    margin: '0 0 4px 0',
    color: '#ffffff',
  },
  sessionCode: {
    fontSize: '10px',
    color: '#93c5fd',
    fontWeight: '700',
  },
  arrowIcon: {
    fontSize: '14px',
    color: '#93c5fd',
  },
};

export default JoinClassPage;