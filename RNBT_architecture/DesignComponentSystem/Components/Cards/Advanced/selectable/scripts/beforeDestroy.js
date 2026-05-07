const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

const containerEl = this.appendElement.querySelector(this.listRender.cssSelectors.container);
if (containerEl && this._groupClickHandler) {
    containerEl.removeEventListener('click', this._groupClickHandler);
}

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

this.subscriptions = null;
this._selectedIds = null;
this._groupClickHandler = null;
this._renderItems = null;
this._setSelectedFromTopic = null;
this._handleSelect = null;
this._setSelected = null;
this._applySelection = null;
this.listRender.destroy();
