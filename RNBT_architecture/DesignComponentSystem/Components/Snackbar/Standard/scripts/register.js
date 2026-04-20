const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

applyFieldRenderMixin(this, {
  cssSelectors: {
    root: ".snackbar",
    message: ".snackbar__message",
    action: ".snackbar__action",
    actionLabel: ".snackbar__action-label",
    dismiss: ".snackbar__dismiss",
  },
  datasetAttrs: {
    tone: "tone",
    open: "open",
    hasAction: "hasAction",
  },
});

this._hideTimer = null;

this.normalizeSnackbarInfo = function ({ response: data } = {}) {
  const nextData = data || {};
  const tone =
    nextData.tone === "neutral" ||
    nextData.tone === "success" ||
    nextData.tone === "warning" ||
    nextData.tone === "danger"
      ? nextData.tone
      : "accent";
  const actionLabel =
    nextData.actionLabel === null || nextData.actionLabel === undefined
      ? ""
      : String(nextData.actionLabel).trim();
  const message =
    nextData.message === null || nextData.message === undefined
      ? ""
      : String(nextData.message);
  const durationValue = Number(nextData.duration);

  return {
    message,
    actionLabel,
    tone,
    open: nextData.open === true,
    duration:
      Number.isFinite(durationValue) && durationValue > 0 ? durationValue : 0,
  };
};

this.clearHideTimer = function () {
  if (this._hideTimer) {
    clearTimeout(this._hideTimer);
    this._hideTimer = null;
  }
};

this.scheduleAutoHide = function (duration) {
  this.clearHideTimer();
  if (!duration || duration <= 0) return;

  this._hideTimer = setTimeout(() => {
    this.hideSnackbar("timeout");
  }, duration);
};

this.showSnackbar = function (payload = {}) {
  const root = this.appendElement.querySelector(this.fieldRender.cssSelectors.root);
  const action = this.appendElement.querySelector(this.fieldRender.cssSelectors.action);
  if (!root || !action) return;

  const nextData = this.normalizeSnackbarInfo(payload);

  this.fieldRender.renderData({
    response: {
      message: nextData.message,
      actionLabel: nextData.actionLabel,
    },
  });

  root.dataset.tone = nextData.tone;
  root.dataset.open = "true";
  root.dataset.hasAction = nextData.actionLabel ? "true" : "false";
  root.setAttribute("role", "status");
  root.setAttribute("aria-live", "polite");
  root.setAttribute("aria-hidden", "false");
  action.hidden = nextData.actionLabel === "";
  action.disabled = nextData.actionLabel === "";

  this.scheduleAutoHide(nextData.duration);
  Weventbus.emit("@snackbarShown", {
    targetInstance: this,
    response: nextData,
  });
};

this.hideSnackbar = function (reason = "manual") {
  const root = this.appendElement.querySelector(this.fieldRender.cssSelectors.root);
  const action = this.appendElement.querySelector(this.fieldRender.cssSelectors.action);
  if (!root || !action) return;

  this.clearHideTimer();
  root.dataset.open = "false";
  root.setAttribute("aria-hidden", "true");
  action.hidden = root.dataset.hasAction !== "true";

  Weventbus.emit("@snackbarHidden", {
    targetInstance: this,
    response: { reason },
  });
};

this.renderSnackbarInfo = function (payload = {}) {
  const nextData = this.normalizeSnackbarInfo(payload);
  if (nextData.open) {
    this.showSnackbar({ response: nextData });
  } else {
    const root = this.appendElement.querySelector(this.fieldRender.cssSelectors.root);
    const action = this.appendElement.querySelector(this.fieldRender.cssSelectors.action);
    if (!root || !action) return;

    this.clearHideTimer();
    this.fieldRender.renderData({
      response: {
        message: nextData.message,
        actionLabel: nextData.actionLabel,
      },
    });
    root.dataset.tone = nextData.tone;
    root.dataset.hasAction = nextData.actionLabel ? "true" : "false";
    root.dataset.open = "false";
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-hidden", "true");
    action.hidden = nextData.actionLabel === "";
    action.disabled = nextData.actionLabel === "";
  }
};

this.subscriptions = {
  snackbarInfo: [this.renderSnackbarInfo],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this.customEvents = {
  click: {
    [this.fieldRender.cssSelectors.action]: "@snackbarActionClicked",
    [this.fieldRender.cssSelectors.dismiss]: "@snackbarDismissed",
  },
};
bindEvents(this, this.customEvents);
