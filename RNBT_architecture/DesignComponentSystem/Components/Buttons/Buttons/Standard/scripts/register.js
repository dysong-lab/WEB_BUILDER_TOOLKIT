/**
 * Buttons — Standard
 *
 * 목적: 기본 액션 버튼을 표시하고 클릭 이벤트를 발행한다
 * 기능: label을 DOM에 반영하고 버튼 클릭을 페이지 이벤트로 전달한다
 *
 * Mixin: 없음
 */
const { bindEvents } = Wkit;

// ======================
// 1. selector + 자체 메서드 정의
// ======================

this.cssSelectors = {
    button: '.md-button',
    label: '.md-button__label'
};

this.renderButtonInfo = function(data = {}) {
    const button = this.appendElement.querySelector(this.cssSelectors.button);
    const label = this.appendElement.querySelector(this.cssSelectors.label);
    if (!button || !label) return;

    const nextLabel = data?.label === null || data?.label === undefined
        ? ''
        : String(data.label);

    label.textContent = nextLabel;
    button.setAttribute('aria-label', nextLabel);
};

// ======================
// 2. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        [this.cssSelectors.button]: '@buttonClicked'
    }
};
bindEvents(this, this.customEvents);
