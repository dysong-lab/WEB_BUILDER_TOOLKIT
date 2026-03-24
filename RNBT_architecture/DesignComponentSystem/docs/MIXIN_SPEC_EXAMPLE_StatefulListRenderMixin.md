# Mixin 명세서: StatefulListRenderMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 데이터를 보여주고, 개별 항목의 상태를 변경한다 |
| **수단** | HTML `<template>` 태그를 cloneNode하여 항목을 반복 생성하고, dataset을 통해 개별 항목의 상태를 관리한다 |
| **기능** | template을 복제하여 배열 데이터를 반복 렌더링하고, itemKey로 특정 항목을 찾아 dataset 상태를 변경/조회한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | ListRenderMixin (데이터를 보여준다) |
| **수단의 차이** | ListRenderMixin은 "표시"만 한다. StatefulListRenderMixin은 "표시 + 상태 변경"을 담당한다. updateItemState/getItemState로 개별 항목의 dataset을 변경/조회할 수 있다. |

---

## 2. 인터페이스

### cssSelectors

| KEY | 종류 | 의미 |
|-----|------|------|
| `container` | 규약 | 항목이 추가될 부모 요소 |
| `item` | 규약 | 각 항목의 루트 요소. updateItemState에서 `item + '[data-' + itemKeyAttr + '="' + id + '"]'`로 항목을 탐색하는 데 사용 |
| `template` | 규약 | `<template>` 태그 (cloneNode 대상) |
| `severity` | 사용자 정의 | 심각도 라벨 표시 요소 |
| `time` | 사용자 정의 | 시간 표시 요소 |
| `source` | 사용자 정의 | 이벤트 출처 표시 요소 |
| `message` | 사용자 정의 | 메시지 표시 요소 |
| `ackBtn` | 사용자 정의 | ACK 버튼. 이벤트 매핑 전용 (template 안이지만 데이터 매칭 불필요) |

> **규약 KEY**: Mixin 내부에서 `cssSelectors.container`로 컨테이너를, `cssSelectors.template`으로 template을 직접 참조한다. 없으면 renderData에서 throw.
> `cssSelectors.item`은 updateItemState/getItemState에서 `item + '[data-id="..."]'` 선택자를 조립하여 개별 항목을 탐색하는 데 사용한다. ListRenderMixin의 item(사용자 정의)과 달리 Mixin이 직접 참조하므로 규약 KEY이다.
> **사용자 정의 KEY**: Mixin이 `Object.entries(cssSelectors)`로 순회하며, data의 같은 이름의 KEY와 매칭하여 textContent에 반영한다.

### datasetAttrs

| KEY | 종류 | 의미 |
|-----|------|------|
| `itemKey` | 규약 | 항목을 식별하는 data-* 속성명. updateItemState/getItemState에서 이 속성으로 항목을 찾는다. |
| `severity` | 사용자 정의 | CSS가 `[data-severity]`로 스타일링 |
| `ack` | 사용자 정의 | CSS가 `[data-ack]`로 스타일링 |

> **규약 KEY**: `datasetAttrs.itemKey`는 Mixin이 내부에서 직접 추출하여 `const itemKeyAttr = datasetAttrs.itemKey`로 사용한다. 이 값이 항목 식별의 기준이 된다.
> **사용자 정의 KEY**: `Object.entries(datasetAttrs)`로 순회하며, data의 같은 이름의 KEY와 매칭하여 dataset에 반영한다.

### 기타 옵션

없음.

---

## 3. renderData 기대 데이터

### 데이터 형태

```
배열. 각 항목은 cssSelectors/datasetAttrs의 KEY와 매칭되는 KEY를 가진 객체.
```

### 예시

```javascript
// renderData({ response: { data: ??? } })에 전달되는 data의 형태:
[
    {
        itemKey:  '1',           // → datasetAttrs['itemKey'] → data-id="1"
        severity: 'warning',     // → cssSelectors['severity'] + datasetAttrs['severity']
        time:     '14:30:05',    // → cssSelectors['time']
        source:   'sensor-01',   // → cssSelectors['source']
        message:  'Temp high',   // → cssSelectors['message']
        ack:      'false'        // → datasetAttrs['ack'] → data-ack="false"
    }
]
```

### KEY 매칭 규칙

```
cssSelectors: Object.entries(cssSelectors)를 순회하며,
              각 KEY로 itemData[key]를 찾고, 값이 있으면 해당 요소의 textContent에 반영.

datasetAttrs: Object.entries(datasetAttrs)를 순회하며,
              각 KEY로 itemData[key]를 찾고, 값이 있으면 해당 요소의 dataset에 반영.

규약 KEY(container, template, item)도 cssSelectors 순회에 포함되지만,
template 내부에 해당 선택자 요소가 없으므로 무시된다.

규약 KEY(itemKey)도 datasetAttrs 순회에 포함되며,
template 내부에 data-id 속성이 있는 요소(item 자체)에 값이 반영된다.
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.statefulList`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors. customEvents에서 computed property로 참조 |
| `datasetAttrs` | 주입된 datasetAttrs |
| `renderData({ response })` | 배열 데이터를 받아 template 복제로 항목 생성 |
| `updateItemState(id, state)` | itemKey로 항목을 찾아 dataset을 변경. API 호출은 페이지가 담당. |
| `getItemState(id)` | itemKey로 항목을 찾아 dataset 복사본을 반환. 없으면 null. |
| `clear()` | 컨테이너의 모든 항목을 제거 (`innerHTML = ''`) |
| `destroy()` | Mixin이 주입한 모든 속성과 메서드를 null 처리 |

---

## 5. destroy 범위

```
- ns.renderData = null
- ns.updateItemState = null
- ns.getItemState = null
- ns.clear = null
- ns.cssSelectors = null
- ns.datasetAttrs = null
- instance.statefulList = null
```

---

## 6. 사용 예시

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
    datasetAttrs: {
        itemKey:  'id',
        severity: 'severity',
        ack:      'ack'
    }
});

this.subscriptions = {
    eventBrowser: [this.statefulList.renderData]
};

// customEvents에서 Mixin의 선택자를 computed property로 참조
this.customEvents = {
    click: {
        [this.statefulList.cssSelectors.ackBtn]: '@ackClicked'
    }
};
```

---
