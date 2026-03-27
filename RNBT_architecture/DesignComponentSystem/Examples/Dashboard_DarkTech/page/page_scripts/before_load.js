/**
 * Page before_load — 이벤트 핸들러 등록
 *
 * 컴포넌트 register 이전에 실행된다.
 * Mixin 메서드에 네임스페이스로 직접 접근한다.
 */
const { onEventBusHandlers } = Wkit;

this.pageEventBusHandlers = {

    // Sidebar 메뉴 클릭
    '@menuItemClicked': ({ event, targetInstance }) => {
        const item = event.target.closest(targetInstance.statefulList.cssSelectors.item);
        const menuId = item?.getAttribute('data-menuid');
        console.log('[Page] Menu clicked:', menuId);
    },

    // EventBrowser 항목 클릭 → 팝업 표시
    '@eventItemClicked': ({ event, targetInstance }) => {
        const item = event.target.closest(targetInstance.listRender.cssSelectors.item);
        if (!item) return;

        targetInstance.shadowPopup.show();

        if (targetInstance._popupScope && targetInstance._popupScope.listRender) {
            const data = [
                { label: 'Time',    value: item.querySelector(targetInstance.listRender.cssSelectors.time)?.textContent },
                { label: 'Level',   value: item.querySelector(targetInstance.listRender.cssSelectors.level)?.textContent },
                { label: 'Message', value: item.querySelector(targetInstance.listRender.cssSelectors.message)?.textContent },
                { label: 'Source',  value: item.querySelector(targetInstance.listRender.cssSelectors.source)?.textContent }
            ];
            targetInstance._popupScope.listRender.renderData({ response: data });
        }
    },

    // EventBrowser 팝업 닫기
    '@eventPopupClose': ({ targetInstance }) => {
        targetInstance.shadowPopup.hide();
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
