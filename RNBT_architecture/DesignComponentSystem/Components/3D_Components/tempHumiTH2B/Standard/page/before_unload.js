/**
 * tempHumiTH2B — 01_status / page / before_unload
 *
 * 페이지 before_unload 시점
 * - 인터벌 정지
 * - 이벤트 핸들러 해제
 * - 데이터 매핑 해제
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
