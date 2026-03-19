/**
 * Page - loaded.js
 *
 * 호출 시점: Page 컴포넌트들이 모두 초기화된 후
 *
 * 책임:
 * - Page 레벨 데이터 매핑 등록
 * - 초기 데이터 발행
 * - 자동 갱신 인터벌 시작
 */

const { each } = fx;

// ======================
// DATA MAPPINGS
// ======================

this.pageDataMappings = [
    {
        topic: 'tasks',
        datasetInfo: {
            datasetName: 'tasksApi',
            param: { status: 'all', priority: 'all', type: 'all', assignee: 'all' }
        },
        refreshInterval: 10000
    },
    {
        topic: 'statusSummary',
        datasetInfo: {
            datasetName: 'statusApi',
            param: {}
        },
        refreshInterval: 15000
    },
    {
        topic: 'activity',
        datasetInfo: {
            datasetName: 'activityApi',
            param: { limit: 10 }
        },
        refreshInterval: 8000
    }
];

// ======================
// PARAM MANAGEMENT
// ======================

this.pageParams = {};

// ======================
// INITIALIZATION
// ======================

fx.go(
    this.pageDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => this.pageParams[topic] = {}),
    each(({ topic }) =>
        GlobalDataPublisher.fetchAndPublish(topic, this)
            .catch(err => console.error(`[fetchAndPublish:${topic}]`, err))
    )
);

// ======================
// INTERVAL MANAGEMENT
// ======================

this.pageIntervals = {};

this.startAllIntervals = () => {
    fx.go(
        this.pageDataMappings,
        each(({ topic, refreshInterval }) => {
            if (refreshInterval) {
                this.pageIntervals[topic] = setInterval(() => {
                    const params = this.pageParams?.[topic] || {};
                    GlobalDataPublisher.fetchAndPublish(topic, this, params)
                        .catch(err => console.error(`[fetchAndPublish:${topic}]`, err));
                }, refreshInterval);
            }
        })
    );
    console.log('[Page] Auto-refresh intervals started');
};

this.stopAllIntervals = () => {
    fx.go(
        Object.values(this.pageIntervals || {}),
        each(clearInterval)
    );
    console.log('[Page] Auto-refresh intervals stopped');
};

this.startAllIntervals();

console.log('[Page] loaded - Data mappings registered, initial data published, intervals started');
