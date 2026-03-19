/**
 * Sidebar - 필터 옵션 UI
 *
 * 기능:
 * 1. 필터 옵션 표시 (status, priority, type, assignee)
 * 2. Apply Filters 버튼 - 외부 이벤트 (@filterApplied)
 * 3. Reset 버튼 - 필터 초기화 + 외부 이벤트 (@filterReset)
 *
 * 데이터 흐름:
 * - GlobalDataPublisher의 'filters' topic 구독 → 셀렉트 옵션 렌더링
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// STATE
// ======================

this._currentFilters = {
    status: 'all',
    priority: 'all',
    type: 'all',
    assignee: 'all'
};

this._internalHandlers = null;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    'filters': ['renderFilters']
};

// ======================
// CUSTOM EVENTS (페이지가 알아야 하는 이벤트)
// ======================

this.customEvents = {
    'click': {
        '.btn-apply': '@filterApplied',
        '.btn-reset': '@filterReset'
    }
};

// ======================
// BINDINGS
// ======================

this.renderFilters = renderFilters.bind(this);

// ======================
// SUBSCRIBE
// ======================

go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// EVENT BINDINGS
// ======================

bindEvents(this, this.customEvents);

// ======================
// INTERNAL HANDLERS (페이지가 알 필요 없는 내부 UI 동작)
// ======================

setupInternalHandlers.call(this);

function setupInternalHandlers() {
    const root = this.appendElement;
    const ctx = this;

    this._internalHandlers = {
        // 셀렉트 변경 시 내부 상태 업데이트
        selectChange: (e) => {
            const filterType = e.target.dataset.filter;
            if (filterType) {
                ctx._currentFilters[filterType] = e.target.value;
            }
        },
        // Reset 클릭 시 UI 초기화 (이벤트 발행은 customEvents가 처리)
        resetClick: () => {
            ctx._currentFilters = {
                status: 'all',
                priority: 'all',
                type: 'all',
                assignee: 'all'
            };

            // 셀렉트 UI 초기화
            root.querySelectorAll('.filter-select').forEach(select => {
                select.value = 'all';
            });
        }
    };

    // 셀렉트 이벤트 등록
    root.querySelectorAll('.filter-select').forEach(select => {
        select.addEventListener('change', this._internalHandlers.selectChange);
    });

    // Reset 버튼 내부 동작 등록 (customEvents와 별개로 UI 초기화 담당)
    root.querySelector('.btn-reset')?.addEventListener('click', this._internalHandlers.resetClick);
}

// ======================
// RENDER FUNCTIONS
// ======================

function renderFilters({ response }) {
    const { data } = response;
    if (!data) return;

    const root = this.appendElement;

    // Status options
    populateSelect(root.querySelector('[data-filter="status"]'), data.statuses);

    // Priority options
    populateSelect(root.querySelector('[data-filter="priority"]'), data.priorities);

    // Type options
    populateSelect(root.querySelector('[data-filter="type"]'), data.types);

    // Assignee options
    populateSelect(root.querySelector('[data-filter="assignee"]'), data.assignees);

    console.log('[Sidebar] Filters rendered');
}

function populateSelect(selectEl, options) {
    if (!selectEl || !options) return;

    selectEl.innerHTML = options.map(opt =>
        `<option value="${opt.value}">${opt.label}</option>`
    ).join('');
}

console.log('[Sidebar] Registered');
