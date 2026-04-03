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
        const card = event.target.closest(targetInstance.fieldRender.cssSelectors.card);
        const metric = card?.dataset.metric;
        console.log('[Page] Card clicked:', metric);
    },

    // EventLog에서 이벤트 항목 클릭
    '@eventClicked': ({ event, targetInstance }) => {
        const item = event.target.closest(targetInstance.listRender.cssSelectors.item);
        const message = item?.querySelector(targetInstance.listRender.cssSelectors.message)?.textContent;
        console.log('[Page] Event clicked:', message);
    },

    // EventLog에서 Clear 버튼 클릭
    // → Mixin 메서드에 네임스페이스로 직접 접근
    '@clearClicked': ({ targetInstance }) => {
        targetInstance.listRender.clear();
    },

    // EventBrowser에서 Ack 버튼 클릭
    // → 페이지가 API 호출 → 성공 시 Mixin으로 DOM 상태 변경
    '@ackClicked': async ({ event, targetInstance }) => {
        const item = event.target.closest(targetInstance.listRender.cssSelectors.item);
        const eventId = item?.dataset.id;
        if (!eventId) return;

        try {
            await fetch('http://localhost:4010/api/event-browser/ack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId })
            });

            // API 성공 → Mixin의 updateItemState로 DOM만 변경
            targetInstance.listRender.updateItemState(eventId, { ack: 'true' });
            console.log('[Page] Event acknowledged:', eventId);
        } catch (err) {
            console.error('[Page] Ack failed:', err);
        }
    },

    // DeviceList에서 항목 클릭 → 팝업 표시 + 상세 데이터 fetch
    '@deviceClicked': ({ event, targetInstance }) => {
        const item = event.target.closest(targetInstance.listRender.cssSelectors.item);
        if (!item) return;

        targetInstance.shadowPopup.show();

        // 팝업 제목 설정
        const titleEl = targetInstance.shadowPopup.query(targetInstance.shadowPopup.cssSelectors.title);
        if (titleEl) titleEl.textContent = item.querySelector(targetInstance.listRender.cssSelectors.name)?.textContent || '';

        // API fetch → 데이터 변환 → 팝업 내부 ListRenderMixin으로 렌더링
        const deviceName = item.querySelector(targetInstance.listRender.cssSelectors.name)?.textContent;
        fetch('http://localhost:4010/api/device-detail?name=' + encodeURIComponent(deviceName))
            .then(r => r.json())
            .then(detail => {
                // 플랫 객체 → 배열 변환 (페이지의 데이터 변환 책임)
                const data = [
                    { label: 'Type',      value: detail.type },
                    { label: 'Status',    value: detail.status },
                    { label: 'Location',  value: detail.location },
                    { label: 'Last Seen', value: detail.lastSeen },
                    { label: 'IP',        value: detail.ip }
                ];
                targetInstance._popupScope.listRender.renderData({ response: data });
            })
            .catch(err => console.error('[Page] Device detail fetch failed:', err));
    },

    // DeviceList에서 팝업 닫기 (Shadow DOM → Weventbus로 전파됨)
    '@devicePopupClose': ({ targetInstance }) => {
        targetInstance.shadowPopup.hide();
    },

    // EventBrowser에서 항목 클릭
    '@eventSelected': ({ event, targetInstance }) => {
        const item = event.target.closest(targetInstance.listRender.cssSelectors.item);
        if (event.target.closest(targetInstance.listRender.cssSelectors.ackBtn)) return;
        const eventId = item?.dataset.id;
        console.log('[Page] Event selected:', eventId);
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
