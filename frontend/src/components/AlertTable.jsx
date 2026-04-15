import React, { useState, useEffect } from 'react';

const AlertTable = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = () => {
            fetch('http://localhost:5000/get_logs')
                .then(res => res.json())
                .then(data => {
                    // Reverse to show newest at the top
                    setLogs(data.reverse());
                })
                .catch(err => console.error("Error fetching logs:", err));
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 2000); // Update every 2 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="alert-history">
            <div className="panel-header">
                <h3>📜 Alert History</h3>
            </div>
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Type</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? (
                            logs.map((log, index) => (
                                <tr key={index} className={log.Status?.includes('CRITICAL') ? 'row-danger' : ''}>
                                    {/* Using Bracket notation to handle potential case sensitivity from CSV */}
                                    <td>{log.Timestamp || log.timestamp}</td>
                                    <td>{log.Type || log.type}</td>
                                    <td>
                                        <span className={`status-tag ${log.Status?.includes('CRITICAL') ? 'crit' : 'warn'}`}>
                                            {log.Status || log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" style={{textAlign: 'center', opacity: 0.5}}>Waiting for logs...</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AlertTable;