/**
 * EChartsBar / page / before_load
 *
 * 페이지 before_load 시점
 * - 이벤트 핸들러 등록
 */

const { onEventBusHandlers } = Wkit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.pageEventBusHandlers = {
    // EChartsBar는 이벤트를 발행하지 않음
};

onEventBusHandlers(this.pageEventBusHandlers);
