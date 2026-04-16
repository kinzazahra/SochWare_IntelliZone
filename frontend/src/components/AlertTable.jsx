import React, { useState, useEffect, useRef } from 'react';

// 📸 EVIDENCE PREVIEW
const IntruderPreview = ({ lastLogTimestamp }) => {
    const [imgUrl, setImgUrl] = useState(null);

    useEffect(() => {
        if (!lastLogTimestamp) return;
        const timer = setTimeout(() => {
            setImgUrl(`http://localhost:5000/get_latest_capture?t=${Date.now()}`);
        }, 500);
        return () => clearTimeout(timer);
    }, [lastLogTimestamp]);

    return (
        <div style={{ 
            padding: '10px', 
            background: 'var(--bg)', // 🌓 Theme Compatible
            borderRadius: '8px', 
            border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
            <p style={{ color: '#ef4444', fontSize: '0.75em', fontWeight: 'bold', marginBottom: '8px' }}>🚨 LATEST EVIDENCE</p>
            {imgUrl ? (
                <img src={imgUrl} alt="Intruder" style={{ width: '100%', borderRadius: '4px', border: '1px solid #ef4444' }} />
            ) : (
                <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, fontSize: '0.8em', color: 'var(--text-main)' }}>No active threat</div>
            )}
        </div>
    );
};

const AlertTable = () => {
    const [logs, setLogs] = useState([]);
    const [lastTimestamp, setLastTimestamp] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const lastAlertRef = useRef(null);
    
    const sirenRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));
    const beepRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));

    useEffect(() => {
        sirenRef.current.loop = true;
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
                    setLastTimestamp(timestamp);

                    if (status?.includes('CRITICAL') && !isMuted) {
                        if (sirenRef.current.paused) sirenRef.current.play().catch(() => {});
                    } else {
                        sirenRef.current.pause();
                        sirenRef.current.currentTime = 0;
                        if (status?.includes('WARNING') && !isMuted) {
                            if (lastAlertRef.current !== timestamp) {
                                beepRef.current.play().catch(() => {});
                                lastAlertRef.current = timestamp;
                            }
                        }
                    }
                });
        };
        const interval = setInterval(fetchLogs, 2000); 
        return () => { clearInterval(interval); sirenRef.current.pause(); };
    }, [isMuted]);

    return (
        <div className="alerts-layout" style={{ display: 'flex', gap: '20px', height: '100%', alignItems: 'stretch', minHeight: 0 }}>
            
            {/* LEFT COLUMN: Added overflowY: 'auto' so you can scroll down to the Silence button! */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '260px', flexShrink: 0, overflowY: 'auto', paddingRight: '5px' }}>
                <IntruderPreview lastLogTimestamp={lastTimestamp} />
                
                <div style={{ padding: '15px', background: 'var(--bg)', borderRadius: '8px', borderLeft: '4px solid #eab308' }}>
                    <h4 style={{ fontSize: '0.85em', color: '#eab308', margin: '0 0 8px 0' }}>📋 SECURITY PROTOCOL</h4>
                    <ul style={{ fontSize: '0.75em', paddingLeft: '15px', margin: 0, color: 'var(--text-main)', lineHeight: '1.6' }}>
                        <li>Identify person via capture</li>
                        <li>Announce warning via Intercom</li>
                        <li>Initiate physical check</li>
                        <li>Log incident ID: {lastTimestamp ? lastTimestamp.slice(-4) : 'N/A'}</li>
                    </ul>
                </div>

                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    style={{
                        padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        background: isMuted ? '#10b981' : '#ef4444', color: 'white', fontWeight: 'bold',
                        marginTop: 'auto', flexShrink: 0 /* 🛑 Prevents button from being squished */
                    }}
                >
                    {isMuted ? "🔊 RESUME MONITORING" : "🔕 SILENCE ALARM"}
                </button>
            </div>

            {/* RIGHT COLUMN: The Table (Now fully Light/Dark mode compatible!) */}
            <div className="alert-history" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)', minHeight: 0, overflow: 'hidden' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--header-text)' }}>📜 Alert History</h3>
                    <span style={{ fontSize: '0.8em', color: isMuted ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                        {isMuted ? "● SYSTEM MUTED" : "● LIVE SECURE"}
                    </span>
                </div>
                
                <div className="table-wrapper" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingRight: '5px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)', zIndex: 1 }}>
                            <tr style={{ borderBottom: '2px solid var(--border)', fontSize: '0.85em', color: 'var(--text-muted)' }}>
                                <th style={{ textAlign: 'left', padding: '10px', width: '40%' }}>Timestamp</th>
                                <th style={{ textAlign: 'center', padding: '10px', width: '30%' }}>Type</th>
                                <th style={{ textAlign: 'right', padding: '10px', width: '30%' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, index) => {
                                const rawTime = log.Timestamp || log.timestamp || "";
                                const displayTime = rawTime.includes(' ') ? rawTime.split(' ')[1] : rawTime;

                                return (
                                <tr key={index} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85em' }}>
                                    
                                    {/* Text Colors now adapt to the Theme! */}
                                    <td style={{ padding: '12px 10px', color: 'var(--text-main)', fontSize: '0.95em', fontFamily: 'monospace' }}>
                                        {displayTime}
                                    </td>
                                    
                                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {log.Type || log.type}
                                    </td>

                                    <td style={{ textAlign: 'right', padding: '10px' }}>
                                        <span style={{ 
                                            display: 'inline-block', width: '80px', textAlign: 'center',
                                            padding: '4px 0', borderRadius: '4px', fontSize: '0.8em', fontWeight: 'bold',
                                            backgroundColor: log.Status?.includes('CRITICAL') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                            color: log.Status?.includes('CRITICAL') ? '#ef4444' : '#eab308',
                                            border: `1px solid ${log.Status?.includes('CRITICAL') ? 'rgba(239, 68, 68, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`
                                        }}>
                                            {log.Status?.includes('CRITICAL') ? 'CRITICAL' : 'WARNING'}
                                        </span>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default AlertTable;