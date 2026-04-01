/**
 * EventBrowser / page / before_load
 *
 * 페이지 before_load 시점
 * - 이벤트 핸들러 등록
 */

const { onEventBusHandlers } = Wkit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.pageEventBusHandlers = {
    '@eventItemClicked': ({ event, targetInstance }) => {
        // 이벤트 항목 클릭 시 상세 팝업 표시
        // 예: targetInstance.shadowPopup.show(event.detail)
        console.log('[EventBrowser] eventItemClicked:', event);
    },
    '@eventPopupClose': ({ event, targetInstance }) => {
        // 팝업 닫기
        // 예: targetInstance.shadowPopup.hide()
        console.log('[EventBrowser] eventPopupClose:', event);
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
