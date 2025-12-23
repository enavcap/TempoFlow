"use client";

import React, { useEffect, useState } from 'react';

const MAX_LOGS = 30;

const DebugOverlay: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const text = typeof detail === 'string' ? detail : JSON.stringify(detail);
      setLogs(prev => [text, ...prev].slice(0, MAX_LOGS));
    };
    window.addEventListener('tempoflow-debug', handler as EventListener);
    return () => window.removeEventListener('tempoflow-debug', handler as EventListener);
  }, []);

  if (logs.length === 0) return null;

  return (
    <div style={{ position: 'fixed', right: 12, top: 12, zIndex: 9999, width: 360, maxHeight: '60vh', overflow: 'auto', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 12, padding: 8, borderRadius: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>TempoFlow Debug</div>
      {logs.map((l, i) => (
        <div key={i} style={{ marginBottom: 6, whiteSpace: 'pre-wrap' }}>{l}</div>
      ))}
    </div>
  );
};

export default DebugOverlay;
