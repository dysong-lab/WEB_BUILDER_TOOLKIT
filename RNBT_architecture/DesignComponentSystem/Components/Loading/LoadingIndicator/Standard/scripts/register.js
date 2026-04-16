/**
 * LoadingIndicator — Standard
 *
 * 목적: CSS 애니메이션으로 짧은 대기 시간의 비확정 진행 상태를 표시한다
 * 기능: Mixin 불필요 — 순수 HTML + CSS
 *
 * Mixin: 없음
 */
const { bindEvents } = Wkit;

// ======================
// 1. 선택자 계약
// ======================

this.cssSelectors = {
    indicator: '.loading-indicator'
};

// ======================
// 2. 구독 — 없음 (데이터 바인딩 불필요)
// ======================

this.subscriptions = {};

// ======================
// 3. 이벤트 — 없음 (상호작용 불필요)
// ======================

this.customEvents = {};
bindEvents(this, this.customEvents);
