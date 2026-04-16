import React, { useState, useEffect, useRef } from 'react';

const AlertTable = () => {
    const [logs, setLogs] = useState([]);
    const lastAlertRef = useRef(null);

    useEffect(() => {
        const alarmSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

        const fetchLogs = () => {
            fetch('http://localhost:5000/get_logs')
                .then(res => res.json())
                .then(data => {
                    if (!data || data.length === 0) return;
                    
                    const newLogs = [...data].reverse();
                    const newest = newLogs[0];
                    const timestamp = newest.Timestamp || newest.timestamp;
                    const status = newest.Status || newest.status;

                    setLogs(newLogs);

                    if (status?.includes('CRITICAL')) {
                        if (lastAlertRef.current !== timestamp) {
                            console.log("🚨 NEW CRITICAL ALERT! Beeping...");
                            alarmSound.play().catch(e => console.log("Sound blocked by browser."));
                            lastAlertRef.current = timestamp;
                        }
                    }
                })
                .catch(err => console.error("Fetch error:", err));
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 2000); 
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="alert-history">
            <div className="panel-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>📜 Alert History</h3>
                <button 
                    onClick={() => {
                        const testAlarm = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                        testAlarm.play();
                    }}
                    style={{
                        background: 'rgba(255,0,0,0.2)', border: '1px solid rgba(255,0,0,0.5)', 
                        color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                        fontSize: '0.8em', fontWeight: 'bold'
                    }}
                >
                    🔊 Test Alarm
                </button>
            </div>
            
            <div className="table-wrapper" style={{ overflowY: 'auto', maxHeight: '350px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                            <th style={{ padding: '12px 8px', textAlign: 'left' }}>Timestamp</th>
                            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Type</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? (
                            logs.map((log, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px 8px', textAlign: 'left', fontSize: '0.9em', opacity: 0.8 }}>
                                        {log.Timestamp || log.timestamp}
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '0.9em' }}>
                                        {log.Type || log.type}
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                        <span 
                                            className={`status-tag ${log.Status?.includes('CRITICAL') ? 'crit' : 'warn'}`}
                                            style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '4px', 
                                                backgroundColor: log.Status?.includes('CRITICAL') ? 'rgba(255,0,0,0.2)' : 'rgba(255,165,0,0.2)',
                                                color: log.Status?.includes('CRITICAL') ? '#ff6b6b' : '#ffd93d'
                                            }}
                                        >
                                            {log.Status || log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" style={{textAlign: 'center', padding: '30px', opacity: 0.5}}>
                                    Waiting for system alerts...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AlertTable;