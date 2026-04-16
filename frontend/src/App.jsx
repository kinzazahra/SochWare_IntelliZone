import React, { useState, useEffect } from 'react';
import { FaBars, FaShieldAlt, FaChartLine, FaVideo, FaFileAlt, FaSlidersH, FaBug, FaCamera, FaClock, FaHistory } from 'react-icons/fa';
import AlertTable from './components/AlertTable';
import './styles/dashboard.css';

const App = () => {
    const [systemStatus, setSystemStatus] = useState("SECURE");
    const [timestamp, setTimestamp] = useState(Date.now());
    const [stats, setStats] = useState({ Critical: 0, Suspicious: 0 });
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Fetch real backend data
    useEffect(() => {
        const interval = setInterval(() => {
            
            // 🛑 REMOVED THE FLAKY /status FETCH
            // ✅ NOW FETCHING LOGS DIRECTLY SO HEADER AND TABLE ALWAYS MATCH
            fetch('http://localhost:5000/get_logs')
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        // Get the absolute newest log entry
                        const newestLog = data[data.length - 1]; 
                        const latestStatus = newestLog.Status || newestLog.status;
                        
                        // Format it cleanly for the badge
                        let displayStatus = "SECURE";
                        if (latestStatus.includes('CRITICAL')) displayStatus = "CRITICAL BREACH";
                        else if (latestStatus.includes('WARNING')) displayStatus = "WARNING ACTIVE";
                        
                        setSystemStatus(displayStatus);
                    }
                })
                .catch(() => {});

            // Fetch Analytics...
            fetch('http://localhost:5000/get_analytics_summary')
                .then(res => res.json())
                .then(data => setStats({
                    Critical: data["CRITICAL: Unauthorized Entry"] || 0,
                    Suspicious: data["WARNING: Suspicious Approach"] || 0
                })).catch(() => {});
                
            setTimestamp(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="master-layout">
            {/* SIDEBAR WITH REACT-ICONS */}
            <aside className={`sidebar glass-panel ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="brand">
                    <FaShieldAlt style={{ fontSize: '28px', color: '#66fcf1' }} />
                    <h2 style={{ display: isSidebarOpen ? 'block' : 'none' }}>IntelliZone<span style={{color: '#66fcf1'}}>//AI</span></h2>
                </div>
                <nav className="nav-menu">
                    <div className="nav-item active"><FaChartLine className="icon"/><span style={{ display: isSidebarOpen ? 'block' : 'none' }}>Dashboard</span></div>
                    <div className="nav-item"><FaVideo className="icon"/><span style={{ display: isSidebarOpen ? 'block' : 'none' }}>Zone Config</span></div>
                    <div className="nav-item"><FaFileAlt className="icon"/><span style={{ display: isSidebarOpen ? 'block' : 'none' }}>Logs</span></div>
                    <div className="nav-item"><FaSlidersH className="icon"/><span style={{ display: isSidebarOpen ? 'block' : 'none' }}>Settings</span></div>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-wrapper">
                
                {/* HEADER */}
                <header className="top-header glass-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><FaBars /></button>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Security Command Center</h2>
                    </div>
                    <div className={`status-badge ${systemStatus.includes('CRITICAL') ? 'danger' : 'secure'}`}>
                        {systemStatus}
                    </div>
                </header>

                <div className="strict-grid">
                    
                    {/* NEW KPI ROW FROM YOUR CODE */}
                    <div className="kpi-row">
                        <div className="kpi-card glass-panel">
                            <div className="kpi-title"><FaShieldAlt /> System Health</div>
                            <div className="kpi-value">98.4%</div>
                        </div>
                        <div className="kpi-card glass-panel">
                            <div className="kpi-title"><FaBug /> Threats Blocked</div>
                            {/* Uses REAL data from your AI */}
                            <div className="kpi-value">{stats.Critical + stats.Suspicious}</div>
                        </div>
                        <div className="kpi-card glass-panel">
                            <div className="kpi-title"><FaCamera /> Active Feeds</div>
                            <div className="kpi-value">2 / 2</div>
                        </div>
                        <div className="kpi-card glass-panel">
                            <div className="kpi-title"><FaClock /> Response Time</div>
                            <div className="kpi-value">0.8s</div>
                        </div>
                    </div>

                    {/* BOTTOM ROW (Table & Videos) */}
                    <div className="grid-bottom">
                        <div className="grid-bottom-left glass-panel">
                            <h3 style={{color: '#fff', fontSize: '1rem', marginBottom: '10px'}}><FaHistory /> Recent Events</h3>
                            <AlertTable />
                        </div>
                        
                        <div className="grid-bottom-right">
                            {/* REAL CAMERA FEED */}
                            <div className="video-box glass-panel">
                                <div className="box-header"><FaVideo /> Live Surveillance</div>
                                <div className="media-container">
                                    <img src="http://localhost:5000/video_feed" alt="Live Feed" className="constrained-media" />
                                </div>
                            </div>
                            {/* REAL HEATMAP FEED */}
                            <div className="video-box glass-panel">
                                <div className="box-header"><FaChartLine /> Intrusion Heatmap</div>
                                <div className="media-container">
                                    <img src={`http://localhost:5000/analytics/heatmap?t=${timestamp}`} alt="Heatmap" className="constrained-media" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default App;