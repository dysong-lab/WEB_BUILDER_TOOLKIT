/**
 * StatusCards — SimpleDashboard
 *
 * 목적: 핵심 지표를 카드로 표시한다
 * 기능: FieldRenderMixin으로 카드별 값과 상태를 렌더링한다
 *
 * Mixin: FieldRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        cpuValue:     '.status-card[data-metric="cpu"] .status-card__value',
        memoryValue:  '.status-card[data-metric="memory"] .status-card__value',
        diskValue:    '.status-card[data-metric="disk"] .status-card__value',
        networkValue: '.status-card[data-metric="network"] .status-card__value',
        card:         '.status-card'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    stats: [this.fieldRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        [this.fieldRender.cssSelectors.card]: '@cardClicked'
    }
};
bindEvents(this, this.customEvents);
