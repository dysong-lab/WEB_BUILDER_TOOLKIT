/**
 * NavigationDrawer / page / before_load
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
        console.log('[NavigationDrawer] menuItemClicked:', event);
    },
    '@drawerClose': ({ event, targetInstance }) => {
        // 드로어 닫기 (오버레이 클릭 또는 닫기 버튼)
        console.log('[NavigationDrawer] drawerClose:', event);
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
