/**
 * ProgressIndicators — Standard
 *
 * 목적: 확정(determinate) 선형 진행 표시기. progressInfo 데이터를
 *       바의 폭(width %), 라벨, 값 텍스트, 상태(data-status)로 렌더한다.
 * 기능: FieldRenderMixin — styleAttrs(progress→width%) + datasetAttrs(status)
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
        indicator: '.progress-indicator',
        track:     '.progress-indicator__track',
        bar:       '.progress-indicator__bar',
        label:     '.progress-indicator__label',
        valueText: '.progress-indicator__value',
        status:    '.progress-indicator'
    },
    datasetAttrs: {
        status:    'status'
    },
    styleAttrs: {
        progress:  { property: 'width', unit: '%' }
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    progressInfo: [this.fieldRender.renderData]
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
        [this.fieldRender.cssSelectors.indicator]: '@progressClicked'
    }
};

bindEvents(this, this.customEvents);
