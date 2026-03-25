const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4010;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// GET /api/system-info
// SystemInfo 컴포넌트용 (FieldRenderMixin)
//
// cssSelectors KEY: name, statusLabel, version, uptime
// datasetAttrs KEY: status
// ─────────────────────────────────────────
app.get('/api/system-info', (req, res) => {
    const status = 'RUNNING';
    const statusMap = { RUNNING: '정상', STOPPED: '중지', ERROR: '오류' };

    res.json({
        name:        'RNBT-PROD-01',
        status:      status,
        statusLabel: statusMap[status] || status,
        version:     'v2.4.1',
        uptime:      `${Math.floor(Math.random() * 1000) + 100}h`
    });
});

// ─────────────────────────────────────────
// GET /api/stats
// StatusCards 컴포넌트용 (FieldRenderMixin)
//
// cssSelectors KEY: cpuValue, memoryValue, diskValue, networkValue
// ─────────────────────────────────────────
app.get('/api/stats', (req, res) => {
    res.json({
        cpuValue:     (Math.random() * 60 + 20).toFixed(1),
        memoryValue:  (Math.random() * 30 + 50).toFixed(1),
        diskValue:    (Math.random() * 10 + 70).toFixed(1),
        networkValue: String(Math.floor(Math.random() * 500 + 100))
    });
});

// ─────────────────────────────────────────
// GET /api/events
// EventLog 컴포넌트용 (ListRenderMixin)
//
// cssSelectors KEY: level, time, message
// datasetAttrs KEY: level
// ─────────────────────────────────────────
const levels = ['info', 'warn', 'error'];
const eventMessages = [
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
        level:   levels[Math.floor(Math.random() * levels.length)],
        time:    new Date(now - i * 60000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        message: eventMessages[Math.floor(Math.random() * eventMessages.length)]
    }));
    res.json(events);
});

// ─────────────────────────────────────────
// GET /api/event-browser
// EventBrowser 컴포넌트용 (StatefulListRenderMixin)
//
// cssSelectors KEY: severity, time, source, message
// datasetAttrs KEY: itemKey(→data-id), severity, ack
// ─────────────────────────────────────────
const severities = ['critical', 'warning', 'info'];
const browserMessages = [
    'UPS-01 input voltage drop below threshold',
    'CRAC-03 return temperature exceeding 28°C',
    'PDU-02 load percentage above 85%',
    'Sensor-015 humidity reading anomaly detected',
    'Network switch port flapping detected',
    'Backup power generator test scheduled',
    'Fire suppression system inspection due',
    'Cooling unit fan speed variance detected',
    'Access control door held open alert',
    'Battery replacement required for UPS-02',
    'Server rack temperature rising steadily',
    'Power distribution imbalance on phase B'
];

// Ack 상태를 메모리에 유지 (서버 재시작 시 초기화)
const ackedEvents = new Set();

app.get('/api/event-browser', (req, res) => {
    const now = Date.now();
    const events = Array.from({ length: 15 }, (_, i) => {
        const id = 'evt-' + String(1000 + i);
        return {
            itemKey:  id,
            severity: severities[Math.floor(Math.random() * severities.length)],
            time:     new Date(now - i * 120000 - Math.random() * 60000).toLocaleTimeString('ko-KR', {
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }),
            source:   ['UPS', 'CRAC', 'PDU', 'Sensor', 'Network'][Math.floor(Math.random() * 5)],
            message:  browserMessages[Math.floor(Math.random() * browserMessages.length)],
            ack:      String(ackedEvents.has(id))
        };
    });
    res.json(events);
});

// ─────────────────────────────────────────
// POST /api/event-browser/ack
// Ack API — 페이지가 호출
// ─────────────────────────────────────────
app.post('/api/event-browser/ack', (req, res) => {
    const { eventId } = req.body;
    if (!eventId) {
        return res.status(400).json({ error: 'eventId required' });
    }
    ackedEvents.add(eventId);
    res.json({ success: true, eventId: eventId, acknowledged: true });
});

// ─────────────────────────────────────────
// GET /api/devices
// DeviceList 컴포넌트용 (ListRenderMixin)
//
// cssSelectors KEY: name, type, status
// datasetAttrs KEY: status
// ─────────────────────────────────────────
const deviceTypes = ['UPS', 'CRAC', 'PDU', 'Sensor', 'Switch'];
const deviceStatuses = ['online', 'online', 'online', 'warning', 'offline'];
const deviceLocations = ['1F Server Room A', '2F Server Room B', '1F Network Room', 'B1 Power Room', '3F Control Room'];

const devices = Array.from({ length: 12 }, (_, i) => {
    const type = deviceTypes[i % deviceTypes.length];
    const num = String(i + 1).padStart(2, '0');
    return {
        name:     `${type}-${num}`,
        type:     type,
        status:   deviceStatuses[Math.floor(Math.random() * deviceStatuses.length)],
        location: deviceLocations[Math.floor(Math.random() * deviceLocations.length)],
        ip:       `192.168.${Math.floor(Math.random() * 3) + 1}.${10 + i}`,
    };
});

app.get('/api/devices', (req, res) => {
    // 상태를 매번 약간 변동
    const result = devices.map(d => ({
        name:   d.name,
        type:   d.type,
        status: deviceStatuses[Math.floor(Math.random() * deviceStatuses.length)]
    }));
    res.json(result);
});

// ─────────────────────────────────────────
// GET /api/device-detail?name=UPS-01
// DeviceList 팝업용 (PopupMixin)
// ─────────────────────────────────────────
app.get('/api/device-detail', (req, res) => {
    const name = req.query.name;
    const device = devices.find(d => d.name === name);
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }
    res.json({
        name:     device.name,
        type:     device.type,
        status:   deviceStatuses[Math.floor(Math.random() * deviceStatuses.length)],
        location: device.location,
        lastSeen: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ip:       device.ip
    });
});

app.listen(PORT, () => {
    console.log(`Mock server running on http://localhost:${PORT}`);
});
