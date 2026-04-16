import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AnalyticsDashboard = ({ stats }) => {
    // 📊 Data for the Bar Chart based on your real stats
    const data = [
        { name: 'Critical', value: stats.Critical, color: '#ff4d4d' },
        { name: 'Suspicious', value: stats.Suspicious, color: '#ffd93d' },
        { name: 'Safe', value: 100, color: '#4ade80' },
    ];

    const isNight = () => {
        const hour = new Date().getHours();
        return hour >= 22 || hour < 6;
    };

    return (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            
            {/* 📈 ALERT DISTRIBUTION CHART */}
            <div style={{ flex: 2, background: '#1a1a2e', padding: '20px', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '1em' }}>📊 Incident Distribution</h3>
                <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" stroke="#888" fontSize={12} />
                            <YAxis stroke="#888" fontSize={12} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ⏱️ TIME-BASED SENSITIVITY GAUGE */}
            <div style={{ flex: 1, background: '#1a1a2e', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '10px', fontSize: '1em' }}>⏲️ Sensitivity Gauge</h3>
                <div style={{ position: 'relative', marginTop: '20px' }}>
                    {/* Visual representation of the gauge from your methodology */}
                    <div style={{ 
                        width: '120px', height: '60px', border: '10px solid #333', 
                        borderBottom: 'none', borderRadius: '100px 100px 0 0', margin: '0 auto',
                        position: 'relative', borderColor: isNight() ? '#ff4d4d' : '#4ade80'
                    }}>
                        <div style={{ 
                            position: 'absolute', bottom: 0, left: '50%', width: '4px', height: '40px',
                            background: '#fff', transformOrigin: 'bottom',
                            transform: isNight() ? 'rotate(45deg)' : 'rotate(-45deg)',
                            transition: 'all 1s ease'
                        }} />
                    </div>
                    <p style={{ marginTop: '10px', fontWeight: 'bold', color: isNight() ? '#ff4d4d' : '#4ade80' }}>
                        {isNight() ? "HIGH (NIGHT)" : "STANDARD (DAY)"}
                    </p>
                    <p style={{ fontSize: '0.7em', opacity: 0.6 }}>Threshold: {isNight() ? '0.36' : '0.60'}</p>
                </div>
            </div>

        </div>
    );
};

export default AnalyticsDashboard;