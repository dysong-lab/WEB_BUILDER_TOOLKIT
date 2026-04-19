/**
 * Sliders/Centered — Standard
 *
 * 목적: 중앙 기준점으로부터의 오프셋(양/음)을 선택할 수 있게 하는 슬라이더
 * 기능:
 *   1) FieldRenderMixin으로 라벨/값표시/input 속성/활성 트랙 (width + left) 매핑
 *   2) 커스텀 메서드 `updateSliderValue`로 progressLeft(%)/progress(%)/valueText 파생
 *      (활성 트랙을 중앙(center)에서 현재 value까지 좌/우로 확장)
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
        slider:       '.slider',
        label:        '.slider__label',
        valueText:    '.slider__value-label',
        input:        '.slider__input',
        min:          '.slider__input',
        max:          '.slider__input',
        step:         '.slider__input',
        value:        '.slider__input',
        progress:     '.slider__track-active',
        progressLeft: '.slider__track-active'
    },
    elementAttrs: {
        min:   'min',
        max:   'max',
        step:  'step',
        value: 'value'
    },
    styleAttrs: {
        progress:     { property: 'width', unit: '%' },
        progressLeft: { property: 'left',  unit: '%' }
    }
});

// value/min/max/center → progressLeft(%)/progress(%)/valueText 를 파생하여 fieldRender에 위임.
// 활성 트랙은 center 지점에서 value 지점까지 확장된다 (좌/우 모두 가능).
// disabled 플래그는 루트 요소(.slider)의 data-disabled + input.disabled 에 직접 반영.
this.updateSliderValue = function ({ response: data }) {
    if (!data) return;

    const min  = Number.isFinite(data.min)  ? data.min  : -50;
    const max  = Number.isFinite(data.max)  ? data.max  :  50;
    const step = Number.isFinite(data.step) ? data.step :   1;
    const raw  = Number.isFinite(data.value) ? data.value : 0;
    const value = Math.min(Math.max(raw, min), max);

    const rawCenter = Number.isFinite(data.center) ? data.center : (min + max) / 2;
    const center = Math.min(Math.max(rawCenter, min), max);

    const span = max - min;

    // 활성 트랙: center ↔ value 구간
    const leftVal  = Math.min(value, center);
    const widthVal = Math.abs(value - center);

    const progressLeft = span > 0 ? ((leftVal - min) / span) * 100 : 50;
    const progress     = span > 0 ? ( widthVal       / span) * 100 : 0;

    // 기본 valueText — center 기준 오프셋에 부호를 붙인다.
    // 페이지가 valueText 를 직접 주면 (단위 포맷 등) 그 값을 우선 사용한다.
    let valueText;
    if (data.valueText != null) {
        valueText = String(data.valueText);
    } else if (value > center) {
        valueText = `+${value - center}`;
    } else if (value < center) {
        valueText = `-${center - value}`;
    } else {
        valueText = '0';
    }

    this.fieldRender.renderData({
        response: {
            label:     data.label ?? '',
            valueText,
            value,
            min,
            max,
            step,
            progress,
            progressLeft
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
