const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

if (this._mediaQuery && this._mediaListener) {
    if (this._mediaQuery.removeEventListener) {
        this._mediaQuery.removeEventListener('change', this._mediaListener);
    } else {
        this._mediaQuery.removeListener(this._mediaListener);
    }
}

if (this.shadowPopup) {
    this.shadowPopup.removePopupEvents();
}

go(
    Object.entries(this.subscriptions || {}),
    each(([topic]) => unsubscribe(topic, this)),
);

if (this._popupScope?.fieldRender) this._popupScope.fieldRender.destroy();
if (this._popupScope?.listRender) this._popupScope.listRender.destroy();
if (this.shadowPopup) this.shadowPopup.destroy();

this.subscriptions = null;
this._popupScope = null;
this._isOpen = null;
this._isFullscreen = null;
this._forceFullscreen = null;
this._breakpoint = null;
this._mediaQuery = null;
this._mediaListener = null;
this._renderDialogInfo = null;
this._renderDialogActions = null;
this._evaluateFullscreen = null;
this._applyFullscreenState = null;
this._handleMediaChange = null;
this.setForceFullscreen = null;
this._handleForceTopic = null;
this.show = null;
this.hide = null;
this._handleOpenTopic = null;
