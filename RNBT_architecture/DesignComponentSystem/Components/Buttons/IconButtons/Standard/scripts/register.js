/**
 * IconButtons — Standard
 *
 * 목적: 아이콘 기반 보조 액션 버튼을 표시하고 클릭 이벤트를 발행한다
 * 기능: icon/ariaLabel을 DOM에 반영하고 버튼 클릭을 페이지 이벤트로 전달한다
 *
 * Mixin: 없음
 */
const { bindEvents } = Wkit;

this.cssSelectors = {
  button: ".icon-button",
  icon: ".icon-button__icon",
};

this.renderIconButtonInfo = function (data = {}) {
  const button = this.appendElement.querySelector(this.cssSelectors.button);
  const icon = this.appendElement.querySelector(this.cssSelectors.icon);
  if (!button || !icon) return;

  const nextIcon =
    data?.icon === null || data?.icon === undefined ? "" : String(data.icon);
  const nextAria =
    data?.ariaLabel === null || data?.ariaLabel === undefined
      ? nextIcon
      : String(data.ariaLabel);

  icon.textContent = nextIcon;
  button.setAttribute("aria-label", nextAria);
};

this.customEvents = {
  click: {
    [this.cssSelectors.button]: "@iconButtonClicked",
  },
};
bindEvents(this, this.customEvents);
