import React, { useEffect, useState } from 'react';

const StatsPanel = () => {
    const [stats, setStats] = useState({});

    useEffect(() => {
        // 1. Create a function to fetch the data
        const fetchStats = () => {
            fetch('http://localhost:5000/get_analytics_summary')
                .then(res => res.json())
                .then(data => setStats(data))
                .catch(err => console.error("Error fetching stats:", err));
        };

        // 2. Fetch immediately when the component loads
        fetchStats();

        // 3. Set up a timer to fetch again every 2 seconds (2000ms)
        // We use 2 seconds here so we don't spam the server too hard for log files
        const interval = setInterval(fetchStats, 2000);

        // 4. Clean up the timer if the user leaves the page
        return () => clearInterval(interval);
    }, []); // The bracket stays empty, but now the timer runs infinitely inside it!

    return (
        <div className="glass-card mini-stats">
            <h4>📊 Status Overview</h4>
            <div className="stat-item">
                <span>Critical:</span> 
                <span className="text-red">{stats['CRITICAL: Unauthorized Entry'] || 0}</span>
            </div>
            <div className="stat-item">
                <span>Suspicious:</span> 
                <span className="text-yellow">{stats['WARNING: Suspicious Approach'] || 0}</span>
            </div>
            <div className="stat-item">
                <span>Time-Based Sensitivity:</span>
                <span className="text-blue">AUTO-ACTIVE</span>
            </div>
        </div>
    );
};

export default StatsPanel;