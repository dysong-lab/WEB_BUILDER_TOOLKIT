/**
 * Tooltips — Standard
 *
 * 목적: UI 요소에 대한 짧은 라벨(Plain Tooltip)을 표시한다
 * 기능: FieldRenderMixin으로 라벨 텍스트 렌더링
 *
 * Mixin: FieldRenderMixin
 * 표시/숨김, 위치 계산, 자동 dismiss 타이머, 앵커 이벤트 바인딩은 모두 페이지가 담당한다.
 * 페이지는 루트 요소의 data-open 속성과 style(left/top)을 직접 제어한다.
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 — 반드시 먼저
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        tooltip: '.tooltip',
        label:   '.tooltip__label'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    tooltipInfo: [this.fieldRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 — MD3 Plain Tooltip은 내부 상호작용 요소 없음
// ======================

this.customEvents = {};

bindEvents(this, this.customEvents);
