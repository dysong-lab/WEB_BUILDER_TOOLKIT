# StatefulListRenderMixin

## 설계 의도

이벤트 목록을 렌더링하고, **개별 항목의 상태를 변경**할 수 있는 Mixin이다.

ListRenderMixin은 "표시"만 하지만, StatefulListRenderMixin은 "표시 + 상태 변경"을 담당한다.

```
ListRenderMixin:  데이터 → DOM 렌더링 (표시만)
StatefulListRenderMixin:   데이터 → DOM 렌더링 + 개별 항목 상태 변경
```

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조
> **구독/이벤트/정리 패턴**: 설계 문서의 "라이프사이클" 참조

---

## 인터페이스

### cssSelectors

CSS 선택자로 HTML 요소를 참조한다.

| KEY | 필수 | 의미 |
|-----|------|------|
| `container` | O | 항목이 추가될 부모 요소 |
| `item` | O | 각 항목의 루트 요소 (customEvents에서 참조) |
| `template` | O | `<template>` 태그 (cloneNode 대상) |

```javascript
cssSelectors: {
    container: '.event-browser__list',           // 항목이 추가될 부모
    item:      '.event-browser__item',           // 각 항목의 루트
    template:  '#event-browser-item-template',   // cloneNode 대상
    severity:  '.event-browser__severity-label', // 심각도 라벨
    time:      '.event-browser__time',           // 발생 시간
    source:    '.event-browser__source',         // 이벤트 출처
    message:   '.event-browser__message',        // 이벤트 메시지
    ackBtn:    '.event-browser__ack-btn'         // 이벤트 매핑 전용
}
```

### itemKey

항목을 식별하는 필드명. updateItemState/getItemState에서 이 필드로 항목을 찾는다.

```javascript
itemKey: 'id'    // itemData의 'id' 필드로 항목을 식별
```

itemKey는 datasetAttrs와 성격이 다르다:

```
datasetAttrs의 key (severity, ack 등):
  → 렌더링 방식 결정: "이 데이터를 이 위치에 data 속성으로 넣어라"
  → 데이터 매핑

itemKey:
  → 믹스인의 동작 방식 결정: "항목을 이 필드로 식별해라"
  → 인터페이스 설정 (updateItemState, getItemState에서만 사용)
```

따라서 datasetAttrs 안이 아닌 options 최상위에 위치한다.

### datasetAttrs

cssSelectors와 key를 공유하여, 대상 요소에 data 속성을 설정한다.
([SELECTORS_AS_CONTRACT.md](../docs/architecture/SELECTORS_AS_CONTRACT.md) 참조)

```javascript
datasetAttrs: {
    severity: 'severity',    // CSS가 [data-severity]로 스타일링
    ack:      'ack'          // CSS가 [data-ack]로 스타일링
}
```

### renderData가 기대하는 데이터

배열. 각 항목의 KEY가 cssSelectors/datasetAttrs의 KEY와 일치해야 한다.

```javascript
[
    {
        id:       '1',           // → itemKey가 'id'이므로 이 필드로 항목 식별
        severity: 'warning',     // → cssSelectors['severity'] + datasetAttrs['severity']
        time:     '14:30:05',    // → cssSelectors['time']
        source:   'sensor-01',   // → cssSelectors['source']
        message:  'Temp high',   // → cssSelectors['message']
        ack:      'false'        // → datasetAttrs['ack'] → data-ack="false"
    }
]
```

---

## 사용 예시

### HTML

```html
<div class="event-browser">
    <div class="event-browser__list"></div>

    <template id="event-browser-item-template">
        <div class="event-browser__item" data-id="" data-severity="" data-ack="false">
            <span class="event-browser__severity-label"></span>
            <span class="event-browser__time"></span>
            <span class="event-browser__source"></span>
            <div class="event-browser__message"></div>
            <button class="event-browser__ack-btn">ACK</button>
        </div>
    </template>
</div>
```

### register.js

```javascript
applyStatefulListRenderMixin(this, {
    cssSelectors: {
        container: '.event-browser__list',
        item:      '.event-browser__item',
        template:  '#event-browser-item-template',
        severity:  '.event-browser__severity-label',
        time:      '.event-browser__time',
        source:    '.event-browser__source',
        message:   '.event-browser__message',
        ackBtn:    '.event-browser__ack-btn'
    },
    itemKey: 'id',
    datasetAttrs: {
        severity: 'severity',
        ack:      'ack'
    }
});

this.subscriptions = {
    eventBrowser: [this.statefulList.renderData]
};
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
성공 → targetInstance.statefulList.updateItemState(id, { ack: 'true' })
    ↓
Mixin이 해당 항목의 dataset 변경 (DOM만)
    ↓
CSS가 시각 전환: [data-ack="true"] { opacity: 0.5; }
```

---

## 주입되는 네임스페이스

`this.statefulList`

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors (customEvents에서 computed property로 참조) |
| `datasetAttrs` | 주입된 datasetAttrs |
| `renderData({ response })` | selector KEY에 맞춰진 배열을 받아 항목을 생성하여 렌더링 |
| `updateItemState(id, state)` | itemKey로 항목을 찾아 dataset을 변경. API 호출은 페이지가 담당. |
| `getItemState(id)` | itemKey로 항목을 찾아 dataset 복사본을 반환. 없으면 null. |
| `clear()` | 컨테이너의 모든 항목을 제거 |
| `destroy()` | Mixin이 주입한 모든 속성과 메서드를 정리 |

---

## ListRenderMixin과의 선택 기준

| 조건 | 선택 |
|---|---|
| 데이터를 표시만 하면 되는가 | ListRenderMixin |
| 개별 항목의 상태를 변경해야 하는가 (Ack, severity 등) | StatefulListRenderMixin |
