// frontend/src/pages/teacher/SessionReportPage.tsx
import React from 'react';
import Sidebar from '../../components/layout/SidebarTeacher';

const participationData = [
  {
    id: 1,
    fullName: 'Alice Smith',
    duration: '60/60m',
    attention: 94,
    primaryState: 'SATISFIED',
  },
  {
    id: 2,
    fullName: 'Bob Johnson',
    duration: '55/60m',
    attention: 72,
    primaryState: 'NEUTRAL',
  },
  {
    id: 3,
    fullName: 'Charlie Day',
    duration: '60/60m',
    attention: 45,
    primaryState: 'DISTRACTED',
  },
  {
    id: 4,
    fullName: 'Diana Ross',
    duration: '42/60m',
    attention: 89,
    primaryState: 'ENGAGED',
  },
];

const SessionReportPage: React.FC = () => {
  return (
    <div style={styles.pageContainer}>
      {/* Sidebar Component */}
      <Sidebar />

      {/* --- Nội dung chính --- */}
      <main style={styles.mainContent}>
        {/* --- Header Section --- */}
        <div style={styles.headerContainer}>
          <div style={styles.headerLeft}>
            <button style={styles.backBtn} onClick={() => alert('Back')}>
              &#8592;
            </button>
            <div>
              <h1 style={styles.title}>Session Report</h1>
              <p style={styles.subtitle}>
                Post-class analysis and emotional engagement metrics
              </p>
            </div>
          </div>
          <button style={styles.exportBtn} onClick={() => alert('Exporting Data...')}>
            📥 Export Detailed Data
          </button>
        </div>

        {/* --- Top Dashboard Row --- */}
        <div style={styles.topRow}>
          {/* Biểu đồ */}
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <div>
                <h3 style={styles.chartTitle}>Engagement Timeline</h3>
                <span style={styles.chartSubtitle}>AVERAGE PARTICIPANT ATTENTION</span>
              </div>
              <span style={styles.aiTrackingBadge}>AI TRACKING HISTORY</span>
            </div>
            <div style={styles.chartBody}>
              <div style={styles.chartPlaceholder}>
                <div style={styles.axisY}>
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>
                <div style={styles.graphArea}>
                  <svg width="100%" height="160" viewBox="0 0 520 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 20 110 C 60 80, 100 50, 160 50 C 220 50, 250 110, 300 90 C 350 70, 400 40, 460 70" stroke="#3b82f6" strokeWidth="4" fill="none" />
                    <circle cx="20" cy="110" r="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
                    <circle cx="100" cy="75" r="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
                    <circle cx="160" cy="50" r="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
                    <circle cx="250" cy="95" r="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
                    <circle cx="330" cy="65" r="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
                    <circle cx="400" cy="50" r="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
                    <circle cx="470" cy="75" r="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
                  </svg>
                  <div style={styles.axisX}>
                    <span>0m</span>
                    <span>10m</span>
                    <span>20m</span>
                    <span>30m</span>
                    <span>40m</span>
                    <span>50m</span>
                    <span>60m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={styles.rightColumn}>
            {/* Happiness Index */}
            <div style={styles.metricCard}>
              <div style={styles.metricIconBox}>😊</div>
              <div style={styles.metricTitle}>88.5%</div>
              <div style={styles.metricSubtitle}>HAPPINESS INDEX</div>
              <div style={styles.progressBar}>
                <div style={styles.progressFill}></div>
              </div>
            </div>

            {/* AI Observation */}
            <div style={styles.observationCard}>
              <div style={styles.observationHeader}>
                <span style={styles.observationIcon}>⚡</span>
                <div style={styles.observationTitleWrap}>
                  <h4 style={styles.observationTitle}>AI OBSERVATION</h4>
                  <span style={styles.observationSubtitle}>SMART ANALYTICS</span>
                </div>
              </div>
              <p style={styles.observationText}>
                "Participation peaked exactly 20 minutes in during the live demo. This suggests visual demonstrations significantly increase student retention for this topic."
              </p>
            </div>
          </div>
        </div>

        {/* --- Student Participation Breakdown Section --- */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>👥 Student Participation Breakdown</h2>
        </div>
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={{ ...styles.th, width: '25%' }}>FULLNAME</th>
                <th style={{ ...styles.th, width: '20%' }}>DURATION</th>
                <th style={{ ...styles.th, width: '25%' }}>ATTENTION</th>
                <th style={{ ...styles.th, width: '18%' }}>PRIMARY STATE</th>
                <th style={{ ...styles.th, width: '12%' }}>INSIGHT</th>
              </tr>
            </thead>
            <tbody>
              {participationData.map((item) => {
                let stateStyle = styles.stateSatisfied;
                if (item.primaryState === 'NEUTRAL') stateStyle = styles.stateNeutral;
                if (item.primaryState === 'DISTRACTED') stateStyle = styles.stateDistracted;
                if (item.primaryState === 'ENGAGED') stateStyle = styles.stateEngaged;

                return (
                  <tr key={item.id} style={styles.tableRow}>
                    <td style={styles.tdName}>{item.fullName}</td>
                    <td style={styles.tdValue}>{item.duration}</td>
                    <td style={styles.tdValue}>
                      <div style={styles.attentionBarWrap}>
                        <div style={styles.attentionPercent}>{item.attention}%</div>
                        <div style={styles.attentionBarOuter}>
                          <div style={{ ...styles.attentionBarInner, width: `${item.attention}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.tdValue}>
                      <span style={stateStyle}>{item.primaryState}</span>
                    </td>
                    <td style={styles.tdInsight}>
                      <button style={styles.inspectLink} onClick={() => alert(`Inspecting ${item.fullName}`)}>
                        INSPECT &gt;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    padding: '40px 64px',
    overflowY: 'auto',
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  backBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    width: '44px',
    height: '44px',
    fontSize: '20px',
    color: '#334155',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    fontWeight: '500',
  },
  exportBtn: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  topRow: {
    display: 'flex',
    gap: '24px',
    marginBottom: '32px',
    height: '360px',
  },
  chartCard: {
    flex: 2,
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '32px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  chartSubtitle: {
    fontSize: '9px',
    letterSpacing: '1px',
    fontWeight: '700',
    color: '#64748b',
  },
  aiBadge: {
    backgroundColor: '#eff6ff',
    color: '#3b82f6',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '9px',
    fontWeight: '800',
  },
  chartBody: {
    height: '210px',
  },
  chartPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  axisY: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '160px',
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '600',
    position: 'absolute',
    transform: 'translateX(-20px)',
  },
  graphArea: {
    position: 'relative',
    marginLeft: '25px',
  },
  axisX: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '16px',
    paddingLeft: '10px',
    paddingRight: '10px',
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    justifyContent: 'space-between',
    height: '100%',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '30px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    height: '45%',
    justifyContent: 'center',
  },
  metricIconBox: {
    fontSize: '26px',
    backgroundColor: '#f0fdf4',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  metricTitle: {
    fontSize: '32px',
    fontWeight: '900',
    color: '#0f172a',
    margin: 0,
  },
  metricSubtitle: {
    fontSize: '10px',
    color: '#64748b',
    fontWeight: '700',
    marginTop: '2px',
    marginBottom: '16px',
  },
  progressBar: {
    height: '6px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '88%',
    backgroundColor: '#34d399',
  },
  observationCard: {
    backgroundColor: '#090d16',
    color: '#ffffff',
    borderRadius: '24px',
    padding: '24px 28px',
    height: '45%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
  },
  observationHeader: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '14px',
  },
  observationIcon: {
    backgroundColor: '#1e293b',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  observationTitleWrap: {
    display: 'flex',
    flexDirection: 'column',
  },
  observationTitle: {
    fontSize: '13px',
    fontWeight: '800',
    margin: 0,
  },
  observationSubtitle: {
    fontSize: '8px',
    letterSpacing: '1px',
    color: '#475569',
    fontWeight: '700',
    marginTop: '2px',
  },
  observationText: {
    fontSize: '11px',
    lineHeight: '1.5',
    color: '#cbd5e1',
    fontStyle: 'italic',
    margin: 0,
  },
  sectionHeader: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    padding: '12px 18px',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.02)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeader: {
    borderBottom: '1px solid #f1f5f9',
  },
  th: {
    padding: '16px 12px',
    fontSize: '9px',
    letterSpacing: '0.8px',
    color: '#64748b',
    fontWeight: '800',
  },
  tableRow: {
    borderBottom: '1px solid #f8fafc',
  },
  tdName: {
    padding: '20px 12px',
    fontSize: '13px',
    fontWeight: '800',
    color: '#0f172a',
  },
  tdValue: {
    padding: '20px 12px',
    fontSize: '12px',
    color: '#334155',
    fontWeight: '600',
  },
  attentionBarWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  attentionPercent: {
    width: '32px',
    fontWeight: '800',
  },
  attentionBarOuter: {
    flex: 1,
    height: '6px',
    backgroundColor: '#f1f5f9',
    borderRadius: '3px',
    overflow: 'hidden',
    minWidth: '100px',
  },
  attentionBarInner: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  tdInsight: {
    padding: '20px 12px',
    textAlign: 'right',
  },
  inspectLink: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontWeight: '800',
    fontSize: '10px',
    cursor: 'pointer',
    letterSpacing: '0.4px',
  },
  stateSatisfied: {
    backgroundColor: '#f0fdf4',
    color: '#059669',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '9px',
    fontWeight: '800',
  },
  stateNeutral: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '9px',
    fontWeight: '800',
  },
  stateDistracted: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '9px',
    fontWeight: '800',
  },
  stateEngaged: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '9px',
    fontWeight: '800',
  },
};

export default SessionReportPage;