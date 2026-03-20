/**
 * Page loaded — 데이터 발행 및 갱신 관리
 *
 * 모든 컴포넌트 register 이후에 실행된다.
 */
const { registerMapping, fetchAndPublish } = GlobalDataPublisher;
const { each, go } = fx;

// ======================
// DATA FORMATS — API 응답을 selector KEY에 맞춰 변환
// ======================

this.dataFormats = {
    systemInfo: (data) => ({
        name:        data.hostname,
        status:      data.status,
        statusLabel: data.statusLabel,
        version:     data.version,
        uptime:      data.uptime
    }),
    stats: (data) => ({
        cpuValue:     data.cpu.value,
        memoryValue:  data.memory.value,
        diskValue:    data.disk.value,
        networkValue: String(data.network.value)
    }),
    events: (data) => data.events.map(event => ({
        level:   event.level,
        time:    new Date(event.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        message: event.message
    })),
    eventBrowser: (data) => data.events.map(event => ({
        itemKey:  String(event.id),
        severity: event.severity,
        time:     new Date(event.timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }),
        source:   event.source,
        message:  event.message,
        ack:      String(event.acknowledged)
    }))
};

// ======================
// DATA MAPPINGS
// ======================

this.pageDataMappings = [
    {
        topic: 'systemInfo',
        datasetInfo: {
            datasetName: 'dashboard_systemInfo',
            param: { baseUrl: 'localhost:4010' }
        },
        dataFormat: this.dataFormats.systemInfo
        // refreshInterval 없음 → 1회만 fetch
    },
    {
        topic: 'stats',
        datasetInfo: {
            datasetName: 'dashboard_stats',
            param: { baseUrl: 'localhost:4010' }
        },
        dataFormat: this.dataFormats.stats,
        refreshInterval: 5000
    },
    {
        topic: 'events',
        datasetInfo: {
            datasetName: 'dashboard_events',
            param: { baseUrl: 'localhost:4010' }
        },
        dataFormat: this.dataFormats.events,
        refreshInterval: 10000
    },
    {
        topic: 'eventBrowser',
        datasetInfo: {
            datasetName: 'dashboard_eventBrowser',
            param: { baseUrl: 'localhost:4010' }
        },
        dataFormat: this.dataFormats.eventBrowser,
        refreshInterval: 15000
    }
];

// ======================
// REGISTER + INITIAL FETCH
// ======================

this.pageParams = {};

go(
    this.pageDataMappings,
    each(registerMapping),
    each(({ topic }) => this.pageParams[topic] = {}),
    each(({ topic }) =>
        fetchAndPublish(topic, this)
            .catch(err => console.error(`[Page] ${topic} fetch failed:`, err))
    )
);

// ======================
// INTERVAL MANAGEMENT (setTimeout 체이닝)
// ======================

this.pageTimers = {};

this.startAllIntervals = () => {
    go(
        this.pageDataMappings,
        each(({ topic, refreshInterval }) => {
            if (!refreshInterval) return;

            const state = { _stopped: false, _timerId: null };
            this.pageTimers[topic] = state;

            const scheduleNext = () => {
                if (state._stopped) return;
                state._timerId = setTimeout(() => {
                    fetchAndPublish(
                        topic,
                        this,
                        this.pageParams[topic] || {}
                    )
                        .catch(err => console.error(`[Page] ${topic} refresh failed:`, err))
                        .finally(scheduleNext);
                }, refreshInterval);
            };
            scheduleNext();
        })
    );
};

this.stopAllIntervals = () => {
    go(
        Object.entries(this.pageTimers),
        each(([_, state]) => {
            state._stopped = true;
            clearTimeout(state._timerId);
        })
    );
};

this.startAllIntervals();
