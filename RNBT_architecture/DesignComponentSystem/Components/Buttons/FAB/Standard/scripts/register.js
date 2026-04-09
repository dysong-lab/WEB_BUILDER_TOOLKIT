const { bindEvents } = Wkit;

this.cssSelectors = {
    button: '.fab',
    icon: '.fab__icon'
};

this.renderFabInfo = function(data = {}) {
    const button = this.appendElement.querySelector(this.cssSelectors.button);
    const icon = this.appendElement.querySelector(this.cssSelectors.icon);
    if (!button || !icon) return;

    const nextIcon = data?.icon === null || data?.icon === undefined ? '' : String(data.icon);
    const nextAria = data?.ariaLabel === null || data?.ariaLabel === undefined ? nextIcon : String(data.ariaLabel);
    const nextSize = data?.size === 'medium' || data?.size === 'large' ? data.size : 'fab';

    icon.textContent = nextIcon;
    button.setAttribute('aria-label', nextAria);
    button.dataset.size = nextSize;
};

this.customEvents = {
    click: {
        [this.cssSelectors.button]: '@fabClicked'
    }
};
bindEvents(this, this.customEvents);
