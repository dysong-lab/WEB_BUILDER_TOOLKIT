if (this._progressAnimationTimer) {
  clearTimeout(this._progressAnimationTimer);
}

// 3. 이벤트 제거

this.customEvents = null;
// 2. 구독 해제

this.subscriptions = null;
// 1. 자체 상태 및 Mixin 정리

this._progressAnimationTimer = null;
this.animateProgressEntry = null;
this.renderProgressInfo = null;
this.cssSelectors = null;
