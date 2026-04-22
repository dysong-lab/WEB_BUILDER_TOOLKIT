const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

// 3. 이벤트 제거

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// 2. 구독 해제

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

// 1. 자체 상태 및 Mixin 정리

if (this._hideTimer) {
  clearTimeout(this._hideTimer);
}

this._hideTimer = null;
this.normalizeSnackbarInfo = null;
this.clearHideTimer = null;
this.scheduleAutoHide = null;
this.showSnackbar = null;
this.hideSnackbar = null;
this.renderSnackbarInfo = null;
this.fieldRender.destroy();
