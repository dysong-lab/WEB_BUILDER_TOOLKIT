/**
 * tempHumiTH2B — 01_status / page / before_load
 *
 * 페이지 before_load 시점
 * - 이벤트 핸들러 등록
 */

const { onEventBusHandlers } = Wkit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.pageEventBusHandlers = {
    // '@tempHumiTH2BStatusChanged': ({ event }) => {
    //     console.log('tempHumiTH2B status:', event);
    // }
};

onEventBusHandlers(this.pageEventBusHandlers);
