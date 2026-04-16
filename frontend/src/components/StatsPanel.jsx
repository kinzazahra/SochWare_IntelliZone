import React, { useState, useEffect } from 'react';

const StatsPanel = () => {
    const [stats, setStats] = useState({ Critical: 0, Suspicious: 0 });

    // 🌙 1. Helper to check if it's currently Night Mode (10PM - 6AM)
    const isNight = () => {
        const hour = new Date().getHours();
        return hour >= 22 || hour < 6;
    };

    useEffect(() => {
        const fetchStats = () => {
            fetch('http://localhost:5000/get_analytics_summary')
                .then(res => res.json())
                .then(data => {
                    // Map the backend status tags to our display stats
                    setStats({
                        Critical: data["CRITICAL: Unauthorized Entry"] || 0,
                        Suspicious: data["WARNING: Suspicious Approach"] || 0
                    });
                })
                .catch(err => console.error("Stats fetch error:", err));
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="stats-container" style={{ display: 'flex', gap: '20px' }}>
            {/* Status Overview Card */}
            <div className="stats-card" style={{ flex: 1, padding: '20px', background: '#1a1a2e', borderRadius: '12px' }}>
                <h3>📊 Status Overview</h3>
                <div style={{ marginTop: '15px' }}>
                    <p>Critical: <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>{stats.Critical}</span></p>
                    <p>Suspicious: <span style={{ color: '#ffd93d', fontWeight: 'bold' }}>{stats.Suspicious}</span></p>
                    
                    {/* 🌙 2. DYNAMIC LABEL: Changes color and text based on time */}
                    <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
                        Sensitivity: 
                        <span style={{ 
                            marginLeft: '8px',
                            color: isNight() ? '#ff4d4d' : '#4ade80', 
                            fontWeight: 'bold',
                            textShadow: isNight() ? '0 0 10px rgba(255, 77, 77, 0.5)' : 'none'
                        }}>
                            {isNight() ? "🌙 NIGHT MODE (STRICT)" : "☀️ DAY MODE (NORMAL)"}
                        </span>
                    </p>
                </div>
            </div>

            {/* Prediction Engine Card */}
            <div className="stats-card" style={{ flex: 1, padding: '20px', background: '#1a1a2e', borderRadius: '12px' }}>
                <h3>🔮 Prediction Engine</h3>
                <div style={{ marginTop: '15px', fontSize: '0.9em', opacity: 0.8 }}>
                    <p>MODE: TIME-BASED AUTO</p>
                    <p>ACTIVE WINDOW: 22:00 - 06:00</p>
                    <p style={{ color: isNight() ? '#ff4d4d' : '#888' }}>
                        {isNight() ? "● System is currently on High Alert" : "○ System is currently on Standard Alert"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StatsPanel;