/**
 * Page before_load — 이벤트 핸들러 등록
 *
 * 컴포넌트 register 이전에 실행된다.
 * Mixin 메서드에 네임스페이스로 직접 접근한다.
 */
const { onEventBusHandlers } = Wkit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.pageEventBusHandlers = {

    // StatusCards에서 카드 클릭
    '@cardClicked': ({ event, targetInstance }) => {
        const card = event.target.closest('.status-card');
        const metric = card?.dataset.metric;
        console.log('[Page] Card clicked:', metric);
    },

    // EventLog에서 이벤트 항목 클릭
    '@eventClicked': ({ event, targetInstance }) => {
        const item = event.target.closest('.event-log__item');
        const message = item?.querySelector('.event-log__message')?.textContent;
        console.log('[Page] Event clicked:', message);
    },

    // EventLog에서 Clear 버튼 클릭
    // → Mixin 메서드에 네임스페이스로 직접 접근
    '@clearClicked': ({ targetInstance }) => {
        targetInstance.listRender.clear();
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
