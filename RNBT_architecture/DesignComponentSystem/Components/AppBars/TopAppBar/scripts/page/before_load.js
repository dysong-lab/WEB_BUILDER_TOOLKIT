/**
 * TopAppBar / page / before_load
 *
 * 페이지 before_load 시점
 * - 이벤트 핸들러 등록
 */

const { onEventBusHandlers } = Wkit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.pageEventBusHandlers = {
    '@menuToggle': ({ event, targetInstance }) => {
        // 메뉴 토글 버튼 클릭 시 처리
        // 예: NavigationDrawer 열기/닫기
        console.log('[TopAppBar] menuToggle:', event);
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
