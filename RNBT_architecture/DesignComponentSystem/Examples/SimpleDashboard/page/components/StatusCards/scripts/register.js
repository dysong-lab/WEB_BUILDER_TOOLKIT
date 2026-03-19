/**
 * StatusCards — 조립 코드
 *
 * FieldRenderMixin을 적용하여 4개 메트릭 카드의 값을 표시한다.
 * SystemInfo와 같은 Mixin, 다른 HTML/CSS — 같은 기능의 재사용.
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
        networkValue: '.status-card[data-metric="network"] .status-card__value'
    },
    dataFormat: (data) => ({
        cpuValue:     data.cpu.value,
        memoryValue:  data.memory.value,
        diskValue:    data.disk.value,
        networkValue: String(data.network.value)
    })
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
        '.status-card': '@cardClicked'
    }
};
bindEvents(this, this.customEvents);
