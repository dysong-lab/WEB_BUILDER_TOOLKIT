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
        const item = event.target.closest(targetInstance.statefulList.cssSelectors.item);
        const eventId = item?.dataset.id;
        if (!eventId) return;

        try {
            await fetch('http://localhost:4010/api/event-browser/ack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId })
            });

            // API 성공 → Mixin의 updateItemState로 DOM만 변경
            targetInstance.statefulList.updateItemState(eventId, { ack: 'true' });
            console.log('[Page] Event acknowledged:', eventId);
        } catch (err) {
            console.error('[Page] Ack failed:', err);
        }
    },

    // DeviceList에서 항목 클릭 → 팝업 표시 + 상세 데이터 fetch
    '@deviceClicked': ({ event, targetInstance }) => {
        const item = event.target.closest(targetInstance.listRender.cssSelectors.item);
        if (!item) return;

        targetInstance.popup.show();

        const sel = targetInstance.popup.cssSelectors;
        const titleEl = targetInstance.popup.query(sel.title);
        if (titleEl) titleEl.textContent = item.querySelector(targetInstance.listRender.cssSelectors.name)?.textContent || '';

        const deviceName = item.querySelector(targetInstance.listRender.cssSelectors.name)?.textContent;
        fetch('http://localhost:4010/api/device-detail?name=' + encodeURIComponent(deviceName))
            .then(r => r.json())
            .then(detail => {
                const q = (s) => targetInstance.popup.query(s);
                if (q(sel.type))     q(sel.type).textContent     = detail.type     || '';
                if (q(sel.status))   q(sel.status).textContent   = detail.status   || '';
                if (q(sel.location)) q(sel.location).textContent = detail.location || '';
                if (q(sel.lastSeen)) q(sel.lastSeen).textContent = detail.lastSeen || '';
                if (q(sel.ip))       q(sel.ip).textContent       = detail.ip       || '';
            })
            .catch(err => console.error('[Page] Device detail fetch failed:', err));
    },

    // DeviceList에서 팝업 닫기 (Shadow DOM → Weventbus로 전파됨)
    '@devicePopupClose': ({ targetInstance }) => {
        targetInstance.popup.hide();
    },

    // EventBrowser에서 항목 클릭
    '@eventSelected': ({ event, targetInstance }) => {
        const item = event.target.closest(targetInstance.statefulList.cssSelectors.item);
        if (event.target.closest(targetInstance.statefulList.cssSelectors.ackBtn)) return;
        const eventId = item?.dataset.id;
        console.log('[Page] Event selected:', eventId);
    }
};

onEventBusHandlers(this.pageEventBusHandlers);
