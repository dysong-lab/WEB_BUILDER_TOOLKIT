const { removeCustomEvents } = Wkit;

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

this.renderButtonInfo = null;
this.cssSelectors = null;
