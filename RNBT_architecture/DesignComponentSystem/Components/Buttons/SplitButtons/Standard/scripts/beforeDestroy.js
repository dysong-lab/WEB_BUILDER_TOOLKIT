const { removeCustomEvents } = Wkit;
removeCustomEvents(this, this.customEvents);
this.customEvents = null;
this.renderSplitButton = null;
this.toggleMenu = null;
this.listRender.destroy();
