if (this._progressAnimationTimer) {
  clearTimeout(this._progressAnimationTimer);
}

this.customEvents = null;
this.subscriptions = null;
this._progressAnimationTimer = null;
this.animateProgressEntry = null;
this.renderProgressInfo = null;
this.cssSelectors = null;
