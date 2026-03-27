const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4010;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// GET /api/header-info
// Header 컴포넌트용 (FieldRenderMixin)
// cssSelectors KEY: title, userName, time
// ─────────────────────────────────────────
app.get('/api/header-info', (req, res) => {
    res.json({
        title:    'ECO Monitoring Dashboard',
        userName: 'Admin',
        time:     new Date().toLocaleString('ko-KR')
    });
});

// ─────────────────────────────────────────
// GET /api/menu-items
// Sidebar 컴포넌트용 (StatefulListRenderMixin)
// cssSelectors KEY: icon, label, badge
// datasetAttrs KEY: menuid, active
// ─────────────────────────────────────────
app.get('/api/menu-items', (req, res) => {
    res.json([
        { menuid: 'dashboard', icon: '📊', label: 'Dashboard',  badge: '',   active: 'true' },
        { menuid: 'devices',   icon: '🖥️', label: 'Devices',    badge: '12', active: '' },
        { menuid: 'events',    icon: '📋', label: 'Events',     badge: '3',  active: '' },
        { menuid: 'reports',   icon: '📈', label: 'Reports',    badge: '',   active: '' },
        { menuid: 'settings',  icon: '⚙️', label: 'Settings',   badge: '',   active: '' }
    ]);
});

// ─────────────────────────────────────────
// GET /api/line-chart
// LineChart 컴포넌트용 (EChartsMixin)
// 데이터 규약: { categories, values }
// ─────────────────────────────────────────
app.get('/api/line-chart', (req, res) => {
    res.json({
        categories: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
        values: [
            [42, 55, 48, 72, 65, 58].map(v => v + Math.floor(Math.random() * 10 - 5)),
            [65, 68, 72, 70, 75, 73].map(v => v + Math.floor(Math.random() * 10 - 5))
        ]
    });
});

// ─────────────────────────────────────────
// GET /api/bar-chart
// BarChart 컴포넌트용 (EChartsMixin)
// ─────────────────────────────────────────
app.get('/api/bar-chart', (req, res) => {
    res.json({
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        values: [
            [120, 200, 150, 80, 70, 110].map(v => v + Math.floor(Math.random() * 20 - 10)),
            [90, 170, 130, 60, 50, 90].map(v => v + Math.floor(Math.random() * 20 - 10))
        ]
    });
});

// ─────────────────────────────────────────
// GET /api/pie-chart
// PieChart 컴포넌트용 (EChartsMixin + mapData)
// 데이터 규약: { items: [{ name, value }] }
// ─────────────────────────────────────────
app.get('/api/pie-chart', (req, res) => {
    res.json({
        items: [
            { name: 'UPS',    value: 35 },
            { name: 'CRAC',   value: 25 },
            { name: 'PDU',    value: 20 },
            { name: 'Sensor', value: 12 },
            { name: 'Switch', value: 8 }
        ]
    });
});

// ─────────────────────────────────────────
// GET /api/gauge
// GaugeChart 컴포넌트용 (EChartsMixin + mapData)
// 데이터 규약: { value, name }
// ─────────────────────────────────────────
app.get('/api/gauge', (req, res) => {
    res.json({
        value: Math.floor(Math.random() * 40 + 50),
        name:  'CPU Usage'
    });
});

// ─────────────────────────────────────────
// GET /api/table-data
// Table 컴포넌트용 (TabulatorMixin)
// ─────────────────────────────────────────
const deviceTypes = ['UPS', 'CRAC', 'PDU', 'Sensor', 'Switch'];
const statuses = ['Online', 'Online', 'Online', 'Warning', 'Offline'];

app.get('/api/table-data', (req, res) => {
    const data = Array.from({ length: 5 }, (_, i) => ({
        id:      'D-' + String(i + 1).padStart(3, '0'),
        name:    `${deviceTypes[i]}-${String(i + 1).padStart(2, '0')}`,
        type:    deviceTypes[i],
        status:  statuses[Math.floor(Math.random() * statuses.length)],
        value:   (Math.random() * 60 + 40).toFixed(1) + '%',
        updated: new Date().toISOString().replace('T', ' ').slice(0, 16)
    }));
    res.json(data);
});

// ─────────────────────────────────────────
// GET /api/events
// EventBrowser 컴포넌트용 (ListRenderMixin)
// cssSelectors KEY: time, level, message, source
// datasetAttrs KEY: level
// ─────────────────────────────────────────
const levels = ['info', 'warning', 'error'];
const eventMessages = [
    'UPS-01 voltage drop detected',
    'CRAC-02 temperature above threshold',
    'PDU-03 load balancing completed',
    'Sensor-04 calibration started',
    'Switch-05 port flapping detected',
    'UPS-06 battery replacement required'
];

app.get('/api/events', (req, res) => {
    const now = Date.now();
    const events = Array.from({ length: 6 }, (_, i) => ({
        time:    new Date(now - i * 120000).toLocaleTimeString('ko-KR', { hour12: false }),
        level:   levels[Math.floor(Math.random() * levels.length)],
        message: eventMessages[i % eventMessages.length],
        source:  ['UPS', 'CRAC', 'PDU', 'Sensor', 'Switch', 'UPS'][i]
    }));
    res.json(events);
});

app.listen(PORT, () => {
    console.log(`Dashboard Corporate mock server running on http://localhost:${PORT}`);
});
