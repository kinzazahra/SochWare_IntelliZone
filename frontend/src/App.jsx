import React, { useState, useEffect } from 'react';
import LiveFeed from './components/LiveFeed';
import AlertTable from './components/AlertTable';
import StatsPanel from './components/StatsPanel';
import './styles/dashboard.css';

const App = () => {
    const [systemStatus, setSystemStatus] = useState("SECURE");
    
    // 👇 1. ADDED: State to hold the current time for the heatmap
    const [timestamp, setTimestamp] = useState(Date.now());

    // Fetch real-time status and update heatmap timer
    useEffect(() => {
        const interval = setInterval(() => {
            // Fetch the text status
            fetch('http://localhost:5000/status')
                .then(res => res.json())
                .then(data => setSystemStatus(data.status));
                
            // 👇 2. ADDED: Update the time every second to force the image to refresh
            setTimestamp(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="dashboard-container">
            <header className="header glass-card">
                <div className="logo-section">
                    <h1>🧠 IntelliZone <span className="highlight">AI</span></h1>
                    <p className="subtitle">Smart Restricted Area Breach Prediction</p>
                </div>
                <div className={`status-badge ${systemStatus.includes('CRITICAL') ? 'danger' : 'secure'}`}>
                    <span className="dot pulse"></span> {systemStatus}
                </div>
            </header>

            <main className="dashboard-grid">
                {/* LEFT COLUMN: PRIMARY MONITORING */}
                <div className="column-left">
                    <section className="glass-card monitor-panel">
                        <div className="panel-header">
                            <h3>📹 Live Surveillance Feed</h3>
                            <div className="feed-controls">
                                <span>CAM_01</span>
                                <span className="resolution">1080P</span>
                            </div>
                        </div>
                        <div className="video-container">
                            <img src="http://localhost:5000/video_feed" alt="Live Feed" className="main-stream" />
                        </div>
                    </section>

                    <section className="glass-card table-panel">
                        <AlertTable />
                    </section>
                </div>

                {/* RIGHT COLUMN: ANALYTICS & INTELLIGENCE */}
                <div className="column-right">
                    <section className="glass-card analytics-panel">
                        <h3>🔥 Intrusion Heatmap</h3>
                        <div className="heatmap-container">
                            {/* 👇 3. MODIFIED: Added the timestamp to the end of the URL 👇 */}
                            <img 
                                src={`http://localhost:5000/analytics/heatmap?t=${timestamp}`} 
                                alt="Heatmap" 
                                className="heatmap-stream" 
                            />
                        </div>
                    </section>

                    <section className="stats-grid">
                        <StatsPanel />
                        
                        <div className="glass-card engine-card">
                            <h4>🔮 Prediction Engine</h4>
                            <div className="prediction-content">
                                <div className="risk-level">
                                    <p>SENSITIVITY</p>
                                    <span className="high-text">TIME-BASED AUTO</span>
                                </div>
                                <p className="hint">Night sensitivity active (10PM-6AM)</p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default App;