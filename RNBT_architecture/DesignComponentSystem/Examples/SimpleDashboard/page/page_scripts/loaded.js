/**
 * Page loaded — 데이터 발행 및 갱신 관리
 *
 * 모든 컴포넌트 register 이후에 실행된다.
 */
const { registerMapping, fetchAndPublish } = GlobalDataPublisher;
const { each, go } = fx;

// ======================
// DATA MAPPINGS
// ======================

this.pageDataMappings = [
    {
        topic: 'systemInfo',
        datasetInfo: {
            datasetName: 'dashboard_systemInfo',
            param: { baseUrl: 'localhost:4010' }
        }
        // refreshInterval 없음 → 1회만 fetch
    },
    {
        topic: 'stats',
        datasetInfo: {
            datasetName: 'dashboard_stats',
            param: { baseUrl: 'localhost:4010' }
        },
        refreshInterval: 5000
    },
    {
        topic: 'events',
        datasetInfo: {
            datasetName: 'dashboard_events',
            param: { baseUrl: 'localhost:4010' }
        },
        refreshInterval: 10000
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
// INTERVAL MANAGEMENT
// ======================

this.startAllIntervals = () => {
    this.pageIntervals = {};

    go(
        this.pageDataMappings,
        each(({ topic, refreshInterval }) => {
            if (refreshInterval) {
                this.pageIntervals[topic] = setInterval(() => {
                    fetchAndPublish(
                        topic,
                        this,
                        this.pageParams[topic] || {}
                    ).catch(err => console.error(`[Page] ${topic} refresh failed:`, err));
                }, refreshInterval);
            }
        })
    );
};

this.stopAllIntervals = () => {
    go(
        Object.values(this.pageIntervals || {}),
        each(interval => clearInterval(interval))
    );
};

this.startAllIntervals();
