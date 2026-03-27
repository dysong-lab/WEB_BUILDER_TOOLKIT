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
        topic: 'dashboard_headerInfo',
        datasetInfo: {
            datasetName: 'dashboard_headerInfo',
            param: { baseUrl: '10.23.128.125:4010' }
        }
    },
    {
        topic: 'dashboard_menuItems',
        datasetInfo: {
            datasetName: 'dashboard_menuItems',
            param: { baseUrl: '10.23.128.125:4010' }
        }
    },
    {
        topic: 'dashboard_lineChart',
        datasetInfo: {
            datasetName: 'dashboard_lineChart',
            param: { baseUrl: '10.23.128.125:4010' }
        },
        refreshInterval: 30000
    },
    {
        topic: 'dashboard_barChart',
        datasetInfo: {
            datasetName: 'dashboard_barChart',
            param: { baseUrl: '10.23.128.125:4010' }
        },
        refreshInterval: 30000
    },
    {
        topic: 'dashboard_pieChart',
        datasetInfo: {
            datasetName: 'dashboard_pieChart',
            param: { baseUrl: '10.23.128.125:4010' }
        },
        refreshInterval: 30000
    },
    {
        topic: 'dashboard_gauge',
        datasetInfo: {
            datasetName: 'dashboard_gauge',
            param: { baseUrl: '10.23.128.125:4010' }
        },
        refreshInterval: 10000
    },
    {
        topic: 'dashboard_tableData',
        datasetInfo: {
            datasetName: 'dashboard_tableData',
            param: { baseUrl: '10.23.128.125:4010' }
        },
        refreshInterval: 30000
    },
    {
        topic: 'dashboard_events',
        datasetInfo: {
            datasetName: 'dashboard_events',
            param: { baseUrl: '10.23.128.125:4010' }
        },
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

this.pageIntervals = {};

this.startAllIntervals = () => {
    go(
        this.pageDataMappings,
        each(({ topic, refreshInterval }) => {
            if (!refreshInterval) return;

            const state = { _stopped: false, _timerId: null };
            this.pageIntervals[topic] = state;

            const scheduleNext = () => {
                if (state._stopped) return;
                state._timerId = setTimeout(() => {
                    fetchAndPublish(topic, this, this.pageParams[topic] || {})
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
        Object.entries(this.pageIntervals),
        each(([_, state]) => {
            state._stopped = true;
            clearTimeout(state._timerId);
        })
    );
};

this.startAllIntervals();
