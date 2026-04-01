/**
 * EChartsBar / page / loaded
 *
 * 페이지 loaded 시점
 * - 데이터 매핑 등록
 * - 최초 데이터 발행
 * - 갱신 인터벌 시작
 */

const { registerMapping, fetchAndPublish } = GlobalDataPublisher;
const { each, go } = fx;

// ======================
// DATA MAPPINGS
// ======================

this.pageDataMappings = [
    {
        topic: 'barChartData',
        datasetInfo: {
            datasetName: 'barChartData',
            param: { baseUrl: 'localhost:4010' }
        },
        refreshInterval: 10000
    }
];

// ======================
// PARAM MANAGEMENT
// ======================

this.pageParams = {};

go(
    this.pageDataMappings,
    each(registerMapping),
    each(({ topic }) => this.pageParams[topic] = {}),
    each(({ topic }) =>
        fetchAndPublish(topic, this)
            .catch(err => console.error(`[Page] ${topic}:`, err))
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
                const state = { _stopped: false, _timerId: null };
                this.pageIntervals[topic] = state;

                const scheduleNext = () => {
                    if (state._stopped) return;
                    state._timerId = setTimeout(() => {
                        fetchAndPublish(topic, this, this.pageParams[topic] || {})
                            .catch(err => console.error(`[Page] ${topic}:`, err))
                            .finally(scheduleNext);
                    }, refreshInterval);
                };
                scheduleNext();
            }
        })
    );
};

this.stopAllIntervals = () => {
    go(
        Object.values(this.pageIntervals || {}),
        each(state => {
            state._stopped = true;
            clearTimeout(state._timerId);
            state._timerId = null;
        })
    );
};

this.startAllIntervals();
