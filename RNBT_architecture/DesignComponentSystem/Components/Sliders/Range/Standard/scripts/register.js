/**
 * Sliders/Range — Standard
 *
 * 목적: 두 핸들로 최솟값~최댓값 범위(low, high)를 선택할 수 있게 하는 슬라이더
 * 기능:
 *   1) FieldRenderMixin으로 라벨/두 값표시/두 input 속성/활성 트랙(left + width) 매핑
 *   2) 커스텀 메서드 `updateSliderValue`로 lowProgress(%)/progress(%)/lowText/highText 파생
 *      + low <= high 및 minDistance 불변식 보정
 *      (활성 트랙은 low 지점에서 high 지점까지 확장)
 *   3) 두 input[type=range]의 input 이벤트로 @sliderChanged 발행 (양방향)
 *
 * Mixin: FieldRenderMixin
 * 드래그/키보드 조작은 두 input[type=range] 네이티브가 각자 처리한다.
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 / 자체 메서드 정의 — 반드시 먼저
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        slider:        '.slider',
        label:         '.slider__label',
        lowText:       '.slider__value-label--low',
        highText:      '.slider__value-label--high',
        lowInput:      '.slider__input--low',
        highInput:     '.slider__input--high',
        lowInputMin:   '.slider__input--low',
        lowInputMax:   '.slider__input--low',
        lowInputStep:  '.slider__input--low',
        low:           '.slider__input--low',
        highInputMin:  '.slider__input--high',
        highInputMax:  '.slider__input--high',
        highInputStep: '.slider__input--high',
        high:          '.slider__input--high',
        lowProgress:   '.slider__track-active',
        progress:      '.slider__track-active'
    },
    elementAttrs: {
        lowInputMin:   'min',
        lowInputMax:   'max',
        lowInputStep:  'step',
        low:           'value',
        highInputMin:  'min',
        highInputMax:  'max',
        highInputStep: 'step',
        high:          'value'
    },
    styleAttrs: {
        lowProgress: { property: 'left',  unit: '%' },
        progress:    { property: 'width', unit: '%' }
    }
});

// low/high/min/max/step/minDistance → lowProgress(%)/progress(%)/lowText/highText 파생
// 불변식: min <= low <= high <= max, 그리고 high - low >= minDistance
// disabled 플래그는 루트 요소(.slider)의 data-disabled + 두 input의 disabled 속성에 직접 반영.
this.updateSliderValue = function ({ response: data }) {
    if (!data) return;

    const min  = Number.isFinite(data.min)  ? data.min  : 0;
    const max  = Number.isFinite(data.max)  ? data.max  : 100;
    const step = Number.isFinite(data.step) ? data.step : 1;
    const minDist = Math.max(
        0,
        Number.isFinite(data.minDistance) ? data.minDistance : 0
    );

    // 1) 원시값 + 개별 clamp
    let low  = Number.isFinite(data.low)  ? data.low  : min;
    let high = Number.isFinite(data.high) ? data.high : max;
    low  = Math.min(Math.max(low,  min), max);
    high = Math.min(Math.max(high, min), max);

    // 2) 순서 보정 (low > high면 swap)
    if (low > high) {
        const tmp = low;
        low = high;
        high = tmp;
    }

    // 3) minDistance 보정
    if (minDist > 0 && (high - low) < minDist) {
        if (low + minDist <= max) {
            high = low + minDist;
        } else {
            high = max;
            low  = Math.max(min, max - minDist);
        }
    }

    // 4) 파생 %
    const span = max - min;
    const lowProgress  = span > 0 ? ((low  - min) / span) * 100 : 0;
    const highProgress = span > 0 ? ((high - min) / span) * 100 : 0;
    const progress     = Math.max(0, highProgress - lowProgress);

    const lowText  = data.lowText  != null ? String(data.lowText)  : String(low);
    const highText = data.highText != null ? String(data.highText) : String(high);

    this.fieldRender.renderData({
        response: {
            label:         data.label ?? '',
            lowText,
            highText,
            // low input 속성 4개
            lowInputMin:   min,
            lowInputMax:   max,
            lowInputStep:  step,
            low,
            // high input 속성 4개
            highInputMin:  min,
            highInputMax:  max,
            highInputStep: step,
            high,
            // activeTrack 좌측/너비
            lowProgress,
            progress
        }
    });

    const sliderEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.slider);
    if (sliderEl) {
        sliderEl.dataset.disabled = data.disabled ? 'true' : 'false';
    }

    const lowInputEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.lowInput);
    if (lowInputEl) {
        lowInputEl.disabled = !!data.disabled;
    }

    const highInputEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.highInput);
    if (highInputEl) {
        highInputEl.disabled = !!data.disabled;
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
// 3. 이벤트 매핑 — 두 input 이벤트(드래그/키보드 연속 발화)
// ======================

this.customEvents = {
    input: {
        [this.fieldRender.cssSelectors.lowInput]:  '@sliderChanged',
        [this.fieldRender.cssSelectors.highInput]: '@sliderChanged'
    }
};

bindEvents(this, this.customEvents);
