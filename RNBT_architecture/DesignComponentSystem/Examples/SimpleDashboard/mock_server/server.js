const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4010;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// GET /api/system-info
// SystemInfo 컴포넌트용 (FieldRenderMixin)
// ─────────────────────────────────────────
app.get('/api/system-info', (req, res) => {
    const status = 'RUNNING';
    const statusMap = { RUNNING: '정상', STOPPED: '중지', ERROR: '오류' };

    res.json({
        hostname: 'RNBT-PROD-01',
        status: status,
        statusLabel: statusMap[status] || status,
        version: 'v2.4.1',
        uptime: `${Math.floor(Math.random() * 1000) + 100}h`
    });
});

// ─────────────────────────────────────────
// GET /api/stats
// StatusCards 컴포넌트용 (FieldRenderMixin)
// ─────────────────────────────────────────
app.get('/api/stats', (req, res) => {
    res.json({
        cpu: { value: (Math.random() * 60 + 20).toFixed(1), unit: '%' },
        memory: { value: (Math.random() * 30 + 50).toFixed(1), unit: '%' },
        disk: { value: (Math.random() * 10 + 70).toFixed(1), unit: '%' },
        network: { value: Math.floor(Math.random() * 500 + 100), unit: 'Mbps' }
    });
});

// ─────────────────────────────────────────
// GET /api/events
// EventLog 컴포넌트용 (ListRenderMixin)
// ─────────────────────────────────────────
const levels = ['info', 'warn', 'error'];
const messages = [
    'System health check completed',
    'CPU temperature threshold warning',
    'Disk I/O latency spike detected',
    'Service restarted successfully',
    'Network packet loss detected',
    'Memory usage normalized',
    'Backup completed',
    'Certificate renewal scheduled',
    'Database connection pool expanded',
    'Cache invalidation triggered'
];

app.get('/api/events', (req, res) => {
    const now = Date.now();
    const events = Array.from({ length: 8 }, (_, i) => ({
        id: now - i * 60000,
        timestamp: new Date(now - i * 60000).toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        source: ['monitor', 'scheduler', 'agent'][Math.floor(Math.random() * 3)]
    }));
    res.json({ events });
});

app.listen(PORT, () => {
    console.log(`Mock server running on http://localhost:${PORT}`);
});
