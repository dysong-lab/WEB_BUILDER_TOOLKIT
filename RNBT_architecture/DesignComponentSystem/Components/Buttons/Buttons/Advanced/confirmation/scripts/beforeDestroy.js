if (this._buttonElement) {
  this._buttonElement.removeEventListener("click", this._primaryClickHandler, true);
}

if (this._cancelElement) {
  this._cancelElement.removeEventListener("click", this._cancelClickHandler);
}

if (this._confirmTimer) {
  window.clearTimeout(this._confirmTimer);
}

this.subscriptions = null;
this.renderButtonInfo = null;
this.applyConfirmationState = null;
this.resetConfirmationState = null;
this.enterConfirmationState = null;
this.confirmAction = null;
this._primaryClickHandler = null;
this._cancelClickHandler = null;
this._buttonElement = null;
this._cancelElement = null;
this.cssSelectors = null;
