/**
 * Chiller — 01_status / page / before_load
 *
 * 페이지 before_load 시점
 * - 이벤트 핸들러 등록
 */

const { onEventBusHandlers } = Wkit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.pageEventBusHandlers = {
    // '@chillerStatusChanged': ({ event }) => {
    //     console.log('Chiller status:', event);
    // }
};

onEventBusHandlers(this.pageEventBusHandlers);
