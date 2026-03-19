# EventListMixin

## 설계 의도

이벤트 목록을 렌더링하고, **개별 항목의 상태를 변경**할 수 있는 Mixin이다.

ListRenderMixin은 "표시"만 하지만, EventListMixin은 "표시 + 상태 변경"을 담당한다.

```
ListRenderMixin:  데이터 → DOM 렌더링 (표시만)
EventListMixin:   데이터 → DOM 렌더링 + 개별 항목 상태 변경
```

> **Mixin 공통 사용법**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/COMPONENT_SYSTEM_DESIGN.md)의 "Mixin > 공통 사용법" 참조

---

## 사용법

### 1단계: HTML을 본다

```html
<div class="event-browser">
    <div class="event-browser__header">
        <span class="event-browser__title">Event Browser</span>
    </div>
    <div class="event-browser__list"></div>

    <template id="event-browser-item-template">
        <div class="event-browser__item" data-id="" data-severity="" data-ack="false">
            <div class="event-browser__severity-bar"></div>
            <div class="event-browser__content">
                <div class="event-browser__top-row">
                    <span class="event-browser__severity-label"></span>
                    <span class="event-browser__time"></span>
                    <span class="event-browser__source"></span>
                </div>
                <div class="event-browser__message"></div>
            </div>
            <button class="event-browser__ack-btn">ACK</button>
        </div>
    </template>
</div>
```

HTML에서 확인하는 것:
- 컨테이너 → `.event-browser__list`
- template → `#event-browser-item-template`
- 항목 루트 → `.event-browser__item`
- 항목 식별용 data 속성 → `data-id` → `itemKey: 'id'`
- 텍스트 요소 → `.event-browser__severity-label`, `.event-browser__time`, `.event-browser__source`, `.event-browser__message`
- data 속성 요소 → `data-severity`, `data-ack`
- 이벤트 바인딩용 요소 → `.event-browser__ack-btn`

### 2단계: Mixin을 적용한다 (register.js)

```javascript
applyEventListMixin(this, {
    container: '.event-browser__list',
    item:      '.event-browser__item',
    itemKey:   'id',
    template:  '#event-browser-item-template',
    cssSelectors: {
        severity: '.event-browser__severity-label',
        time:     '.event-browser__time',
        source:   '.event-browser__source',
        message:  '.event-browser__message',
        ackBtn:   '.event-browser__ack-btn'     // 이벤트 바인딩 전용
    },
    datasetSelectors: {
        severity: '[data-severity]',
        ack:      '[data-ack]'
    },
    dataFormat: (data) => ({
        items: data.events.map(event => ({
            id:       String(event.id),        // → itemKey로 항목 식별
            severity: event.severity,          // → cssSelectors + datasetSelectors 양쪽
            time:     event.formattedTime,     // → cssSelectors.time
            source:   event.source,            // → cssSelectors.source
            message:  event.message,           // → cssSelectors.message
            ack:      String(event.acknowledged) // → datasetSelectors.ack
            // ackBtn 키 없음 → 건너뜀 (이벤트 전용)
        }))
    })
});
```

**ListRenderMixin과의 차이:**
- `itemKey` 옵션이 추가됨 — 항목을 식별하는 data 속성 키
- `updateItemState`, `getItemState` 메서드가 추가됨

### 3단계: 구독을 연결한다

```javascript
this.subscriptions = {
    eventBrowser: [this.eventList.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);
```

### 4단계: 이벤트를 매핑한다

```javascript
this.customEvents = {
    click: {
        [this.eventList.cssSelectors.ackBtn]: '@ackClicked',
        [this.eventList.item]:                '@eventSelected'
    }
};
bindEvents(this, this.customEvents);
```

### 5단계: 정리한다 (beforeDestroy.js)

```javascript
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

this.eventList.destroy();
```

---

## Ack 동작 흐름

Ack는 Mixin의 기능이 아니라 **페이지의 결정**이다. Mixin은 DOM 상태 변경만 제공한다.

```
사용자가 ACK 버튼 클릭
    ↓
customEvents → '@ackClicked' → Weventbus
    ↓
페이지 핸들러 (before_load.js)
    ↓
페이지가 Ack API 호출
    ↓
성공 → targetInstance.eventList.updateItemState(id, { ack: 'true' })
    ↓
Mixin이 해당 항목의 dataset 변경 (DOM만)
    ↓
CSS가 시각 전환: [data-ack="true"] { opacity: 0.5; }
```

### 페이지 핸들러 예시 (before_load.js)

```javascript
'@ackClicked': async ({ event, targetInstance }) => {
    const item = event.target.closest(targetInstance.eventList.item);
    const eventId = item?.dataset.id;
    if (!eventId) return;

    try {
        await fetch('/api/event-browser/ack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId })
        });

        // API 성공 → Mixin으로 DOM 상태 변경
        targetInstance.eventList.updateItemState(eventId, { ack: 'true' });
    } catch (err) {
        console.error('[Page] Ack failed:', err);
    }
}
```

---

## 옵션

```javascript
applyEventListMixin(instance, {
    container,          // String — 컨테이너 CSS 선택자
    item,               // String — 각 항목의 CSS 선택자
    itemKey,            // String — 항목 식별 data 속성 키 (예: 'id' → data-id)
    template,           // String — <template> 태그의 CSS 선택자
    cssSelectors,       // Object — { key: 'CSS 선택자' }
    datasetSelectors,   // Object — { key: '[data-*] 선택자' } (선택적)
    dataFormat          // Function — (data) => ({ items: [...] }) (선택적)
});
```

| 옵션 | 필수 | 설명 |
|------|------|------|
| container | O | 항목이 추가될 부모 요소 선택자 |
| item | O | 각 항목의 선택자 |
| itemKey | O | 항목 식별 data 속성 키. updateItemState에서 사용 |
| template | O | `<template>` 태그 선택자 |
| cssSelectors | O | HTML 요소를 CSS 선택자로 찾아 참조 |
| datasetSelectors | X | HTML 요소를 data 속성 선택자로 찾아 참조 |
| dataFormat | X | `{ items: [...] }` 형태를 반환해야 함 |

---

## 주입되는 인터페이스

네임스페이스: `this.eventList`

### 속성

| 속성 | 역할 |
|------|------|
| `container` | 컨테이너 선택자 |
| `item` | 항목 선택자 (customEvents에서 computed property로 참조) |
| `cssSelectors` | 주입된 cssSelectors |
| `datasetSelectors` | 주입된 datasetSelectors |

### 메서드

#### `renderData({ response })`

데이터를 수신하여 항목을 렌더링한다. template을 cloneNode하여 항목을 생성한다.

```javascript
subscribe('eventBrowser', this, this.eventList.renderData);
```

- 호출될 때마다 컨테이너를 비우고 전체 재렌더링
- `itemKey`에 해당하는 값을 항목의 data 속성으로 설정

#### `updateItemState(id, state)`

개별 항목의 dataset을 변경한다. `itemKey`로 항목을 식별한다.

```javascript
targetInstance.eventList.updateItemState('evt-001', { ack: 'true' });
targetInstance.eventList.updateItemState('evt-002', { severity: 'critical' });
```

- API 호출은 페이지가 담당하고, Mixin은 DOM 상태 변경만 한다
- Ack, severity 등 어떤 상태든 같은 메서드로 처리한다

#### `getItemState(id)`

개별 항목의 dataset을 조회한다. 복사본을 반환한다.

```javascript
const state = targetInstance.eventList.getItemState('evt-001');
// → { id: 'evt-001', severity: 'warning', ack: 'false' }
```

- 항목이 없으면 `null` 반환

#### `clear()`

컨테이너의 모든 항목을 제거한다.

#### `destroy()`

Mixin이 주입한 모든 속성과 메서드를 정리한다.

---

## ListRenderMixin과의 선택 기준

| 조건 | 선택 |
|---|---|
| 데이터를 표시만 하면 되는가 | ListRenderMixin |
| 개별 항목의 상태를 변경해야 하는가 (Ack, severity 등) | EventListMixin |
