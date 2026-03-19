/**
 * Master - before_load.js
 *
 * 호출 시점: 앱 시작 직후, Master 컴포넌트들이 초기화되기 전
 *
 * 책임:
 * - Master 레벨 이벤트 버스 핸들러 등록
 * - Master 파라미터 상태 초기화
 */

const { onEventBusHandlers } = Wkit;

// ======================
// MASTER PARAMS STATE
// ======================

this.masterParams = {
    tasks: {
        status: 'all',
        priority: 'all',
        type: 'all',
        assignee: 'all'
    },
    activity: {}
};

// ======================
// EVENT BUS HANDLERS
// ======================

this.masterEventBusHandlers = {
    /**
     * Sidebar 필터 적용 이벤트
     */
    '@filterApplied': ({ targetInstance }) => {
        const filters = targetInstance._currentFilters;
        console.log('[Master] Filter applied:', filters);

        this.masterParams.tasks = { ...filters };
        GlobalDataPublisher.fetchAndPublish('tasks', this, this.masterParams.tasks);
    },

    /**
     * Sidebar 필터 리셋 이벤트
     */
    '@filterReset': () => {
        console.log('[Master] Filter reset');

        this.masterParams.tasks = {
            status: 'all',
            priority: 'all',
            type: 'all',
            assignee: 'all'
        };

        GlobalDataPublisher.fetchAndPublish('tasks', this, this.masterParams.tasks);
    },

    /**
     * Header 새로고침 클릭
     */
    '@refreshAllClicked': () => {
        console.log('[Master] Refresh all clicked');

        // 모든 topic 재발행
        GlobalDataPublisher.fetchAndPublish('tasks', this, this.masterParams.tasks);
        GlobalDataPublisher.fetchAndPublish('statusSummary', this);
        GlobalDataPublisher.fetchAndPublish('activity', this, this.masterParams.activity);
    }
};

onEventBusHandlers(this.masterEventBusHandlers);

console.log('[Master] before_load - Event handlers registered');
