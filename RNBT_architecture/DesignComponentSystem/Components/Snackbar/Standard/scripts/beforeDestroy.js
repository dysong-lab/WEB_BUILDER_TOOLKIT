const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

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
