/**
 * NavigationSidebar / page / before_load
 *
 * 페이지 before_load 시점
 * - 이벤트 핸들러 등록
 */

const { onEventBusHandlers } = Wkit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.pageEventBusHandlers = {
    '@menuItemClicked': ({ event, targetInstance }) => {
        // 메뉴 항목 클릭 시 페이지 전환 등 처리
        console.log('[NavigationSidebar] menuItemClicked:', event);
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
