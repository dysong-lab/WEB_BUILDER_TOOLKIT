/**
 * Cube3DSymbol - beforeDestroy
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;

// ==================
// UNSUBSCRIBE
// ==================

if (this.subscriptions) {
    fx.go(
        Object.entries(this.subscriptions),
        fx.each(([topic, _]) => unsubscribe(topic, this))
    );
    this.subscriptions = null;
}

// ==================
// REMOVE EVENTS
// ==================

if (this.customEvents) {
    removeCustomEvents(this, this.customEvents);
    this.customEvents = null;
}

// ==================
// CLEAR REFERENCES
// ==================

this.setStatus = null;
this.updateFromData = null;
this.getStatus = null;
this.renderData = null;
this._currentStatus = null;

console.log('[Cube3DSymbol] Destroyed');
