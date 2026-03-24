/**
 * Page before_unload — 모든 리소스 정리
 */
const { unregisterMapping } = GlobalDataPublisher;
const { offEventBusHandlers } = Wkit;
const { each, go } = fx;

// ======================
// INTERVAL CLEANUP
// ======================

if (this.stopAllIntervals) {
    this.stopAllIntervals();
}
this.pageIntervals = null;

// ======================
// EVENT BUS CLEANUP
// ======================

offEventBusHandlers(this.pageEventBusHandlers);
this.pageEventBusHandlers = null;

// ======================
// DATA PUBLISHER CLEANUP
// ======================

go(
    this.pageDataMappings,
    each(({ topic }) => unregisterMapping(topic))
);

this.pageDataMappings = null;
this.pageParams = null;
