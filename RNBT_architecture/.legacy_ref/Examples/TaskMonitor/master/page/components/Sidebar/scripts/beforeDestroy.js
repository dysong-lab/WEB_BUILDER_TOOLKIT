/**
 * Sidebar - Destroy Script
 *
 * 정리 대상:
 * 1. customEvents (bindEvents로 등록된 것)
 * 2. 내부 이벤트 (_internalHandlers)
 * 3. GlobalDataPublisher 구독 해제
 * 4. 상태 초기화
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each } = fx;

// ======================
// 1. customEvents 해제
// ======================

removeCustomEvents(this, this.customEvents);

// ======================
// 2. 내부 이벤트 해제
// ======================

if (this._internalHandlers) {
    const root = this.appendElement;

    // 셀렉트 이벤트
    root.querySelectorAll('.filter-select').forEach(select => {
        select.removeEventListener('change', this._internalHandlers.selectChange);
    });

    // Reset 버튼 내부 동작
    root.querySelector('.btn-reset')?.removeEventListener('click', this._internalHandlers.resetClick);

    this._internalHandlers = null;
}

// ======================
// 3. GlobalDataPublisher 구독 해제
// ======================

if (this.subscriptions) {
    fx.go(
        Object.keys(this.subscriptions),
        each(topic => unsubscribe(topic, this))
    );
    this.subscriptions = null;
}

// ======================
// 4. 상태 초기화
// ======================

this._currentFilters = null;
this.renderFilters = null;
this.customEvents = null;

console.log('[Sidebar] Destroyed');
