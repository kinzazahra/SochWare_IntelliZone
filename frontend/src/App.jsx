import React, { useState, useEffect } from 'react';
import { FaBars, FaShieldAlt, FaChartLine, FaVideo, FaFileAlt, FaSlidersH, FaBug, FaCamera, FaClock, FaHistory, FaSun, FaMoon } from 'react-icons/fa';
import AlertTable from './components/AlertTable';
import './styles/dashboard.css';

const App = () => {
    const [systemStatus, setSystemStatus] = useState("SECURE");
    const [timestamp, setTimestamp] = useState(Date.now());
    const [stats, setStats] = useState({ Critical: 0, Suspicious: 0 });
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false); 

    useEffect(() => {
        const interval = setInterval(() => {
            fetch('http://localhost:5000/get_logs')
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const newestLog = data[data.length - 1]; 
                        const latestStatus = newestLog.Status || newestLog.status;
                        
                        let displayStatus = "SECURE";
                        if (latestStatus.includes('CRITICAL')) displayStatus = "CRITICAL BREACH";
                        else if (latestStatus.includes('WARNING')) displayStatus = "WARNING ACTIVE";
                        
                        setSystemStatus(displayStatus);
                    }
                })
                .catch(() => {});

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
        <div className="master-layout" data-theme={isDarkMode ? "dark" : "light"}>
            
            {/* SIDEBAR */}
            <aside className={`sidebar glass-panel ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="brand">
                    <FaShieldAlt style={{ fontSize: '28px', color: 'var(--accent)' }} />
                    <h2 style={{ display: isSidebarOpen ? 'block' : 'none', color: 'var(--header-text)' }}>
                        IntelliZone<span style={{color: 'var(--accent)'}}>//AI</span>
                    </h2>
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
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--header-text)' }}>Security Command Center</h2>
                        
                        {/* THEME TOGGLE BUTTON */}
                        <button 
                            className="toggle-btn"
                            onClick={() => setIsDarkMode(!isDarkMode)} 
                            style={{
                                marginLeft: '15px', display: 'flex', alignItems: 'center', gap: '8px',
                                borderRadius: '20px', padding: '6px 14px', fontSize: '0.85rem'
                            }}
                        >
                            {isDarkMode ? <><FaSun /> Light Mode</> : <><FaMoon /> Dark Mode</>}
                        </button>
                    </div>

                    <div className={`status-badge ${systemStatus.includes('CRITICAL') ? 'danger' : 'secure'}`}>
                        {systemStatus}
                    </div>
                </header>

                <div className="strict-grid">
                    
                    {/* KPI ROW */}
                    <div className="kpi-row">
                        <div className="kpi-card glass-panel">
                            <div className="kpi-title"><FaShieldAlt /> System Health</div>
                            <div className="kpi-value">98.4%</div>
                        </div>
                        <div className="kpi-card glass-panel">
                            <div className="kpi-title"><FaBug /> Threats Blocked</div>
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
                            <h3 style={{color: 'var(--header-text)', fontSize: '1rem', marginBottom: '10px'}}><FaHistory /> Recent Events</h3>
                            <AlertTable />
                        </div>
                        
                        <div className="grid-bottom-right">
                            <div className="video-box glass-panel">
                                <div className="box-header"><FaVideo /> Live Surveillance</div>
                                <div className="media-container">
                                    <img src="http://localhost:5000/video_feed" alt="Live Feed" className="constrained-media" />
                                </div>
                            </div>
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