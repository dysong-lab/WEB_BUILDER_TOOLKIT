/**
 * SystemInfo — SimpleDashboard
 *
 * 목적: 시스템 상태 정보를 표시한다
 * 기능: FieldRenderMixin으로 시스템 정보를 렌더링한다
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
        name:        '.system-info__name',
        status:      '.system-info__status',
        statusLabel: '.system-info__status',
        version:     '.system-info__version',
        uptime:      '.system-info__uptime'
    },
    datasetAttrs: {
        status:      'status'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    systemInfo: [this.fieldRender.renderData]
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

this.customEvents = {};
bindEvents(this, this.customEvents);
