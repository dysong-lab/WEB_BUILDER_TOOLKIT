const { removeCustomEvents } = Wkit;
removeCustomEvents(this, this.customEvents);
this.customEvents = null;
this.renderFabMenu = null;
this.toggleMenu = null;
this.listRender.destroy();
