/**
 * StateList — 조립 코드
 *
 * StatefulListRenderMixin을 적용하여 상태 관리 목록을 표시한다.
 * 개별 항목의 상태(ack, severity 등)를 변경할 수 있다.
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyStatefulListRenderMixin(this, {
    cssSelectors: {
        container: '.state-list__container',
        item:      '.state-list__item',
        template:  '.state-list__template',
        title:     '.state-list__title',
        desc:      '.state-list__desc',
        time:      '.state-list__time',
        actionBtn: '.state-list__action-btn'
    },
    datasetAttrs: {
        itemKey:  'id',
        severity: 'severity',
        ack:      'ack'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {};

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        [this.statefulList.cssSelectors.actionBtn]: '@actionClicked',
        [this.statefulList.cssSelectors.item]:      '@itemClicked'
    }
};
bindEvents(this, this.customEvents);
