/**
 * Divider — Standard
 *
 * 목적: 레이아웃 내부 섹션을 구분하는 시각적 분절선을 표시한다
 * 기능: orientation / inset / thickness / emphasis 상태를 루트에 반영한다
 *
 * Mixin: 없음
 */

// ======================
// 1. selector + 자체 메서드 정의
// ======================

this.cssSelectors = {
  root: ".md-divider",
};

this.renderDividerInfo = function (data = {}) {
  const root = this.appendElement.querySelector(this.cssSelectors.root);
  if (!root) return;

  const orientation =
    data?.orientation === "vertical" ? "vertical" : "horizontal";
  const inset =
    data?.inset === "start" || data?.inset === "both" ? data.inset : "full";
  const thicknessValue = Number(data?.thickness);
  const thickness =
    Number.isFinite(thicknessValue) && thicknessValue >= 1
      ? Math.round(thicknessValue)
      : 1;
  const emphasis = data?.emphasis === "strong" ? "strong" : "subtle";

  root.dataset.orientation = orientation;
  root.dataset.inset = inset;
  root.dataset.emphasis = emphasis;
  root.style.setProperty("--divider-thickness", `${thickness}px`);
  root.setAttribute("aria-orientation", orientation);
};

this.renderDividerInfo();

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = null;

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = null;
