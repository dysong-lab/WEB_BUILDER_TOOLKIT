/**
 * Sliders/Basic — Standard
 *
 * 목적: 값 범위에서 단일 값을 선택할 수 있게 하는 기본 슬라이더
 * 기능:
 *   1) FieldRenderMixin으로 라벨/값표시/input 속성/활성 트랙 width 매핑
 *   2) 커스텀 메서드 `updateSliderValue`로 progress(%)/valueText 파생
 *   3) input[type=range]의 input 이벤트로 @sliderChanged 발행 (양방향)
 *
 * Mixin: FieldRenderMixin
 * 드래그/키보드 조작은 input[type=range] 네이티브가 처리한다.
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 / 자체 메서드 정의 — 반드시 먼저
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        slider:     '.slider',
        label:      '.slider__label',
        valueText:  '.slider__value-label',
        input:      '.slider__input',
        min:        '.slider__input',
        max:        '.slider__input',
        step:       '.slider__input',
        value:      '.slider__input',
        progress:   '.slider__track-active'
    },
    elementAttrs: {
        min:   'min',
        max:   'max',
        step:  'step',
        value: 'value'
    },
    styleAttrs: {
        progress: { property: 'width', unit: '%' }
    }
});

// value/min/max → progress(%) / valueText 를 파생하여 fieldRender에 위임.
// disabled 플래그는 루트 요소(.slider)의 data-disabled에 직접 반영.
this.updateSliderValue = function ({ response: data }) {
    if (!data) return;

    const min  = Number.isFinite(data.min)  ? data.min  : 0;
    const max  = Number.isFinite(data.max)  ? data.max  : 100;
    const step = Number.isFinite(data.step) ? data.step : 1;
    const raw  = Number.isFinite(data.value) ? data.value : min;
    const value = Math.min(Math.max(raw, min), max);

    const span = max - min;
    const progress = span > 0 ? ((value - min) / span) * 100 : 0;

    this.fieldRender.renderData({
        response: {
            label:     data.label ?? '',
            valueText: data.valueText != null ? String(data.valueText) : String(value),
            value,
            min,
            max,
            step,
            progress
        }
    });

    const sliderEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.slider);
    if (sliderEl) {
        sliderEl.dataset.disabled = data.disabled ? 'true' : 'false';
    }

    const inputEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.input);
    if (inputEl) {
        inputEl.disabled = !!data.disabled;
    }
};

// ======================
// 2. 구독 연결 — 함수 참조
// ======================

this.subscriptions = {
    sliderInfo: [this.updateSliderValue]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 — input 이벤트(드래그/키보드 연속 발화)
// ======================

this.customEvents = {
    input: {
        [this.fieldRender.cssSelectors.input]: '@sliderChanged'
    }
};

bindEvents(this, this.customEvents);
