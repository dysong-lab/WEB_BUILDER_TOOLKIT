# Mixin 명세서: StatefulListRenderMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 데이터를 보여주고, 개별 항목의 상태를 변경한다 |
| **기능** | 배열 데이터의 각 항목을 반복 생성하여 표시하고, 개별 항목의 상태를 변경/조회할 수 있다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | ListRenderMixin (데이터를 보여준다) |
| **기능의 차이** | ListRenderMixin은 "표시"만 한다. StatefulListRenderMixin은 "표시 + 상태 변경"을 담당한다. updateItemState/getItemState로 개별 항목의 dataset을 변경/조회할 수 있다. |

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

### itemKey

| 종류 | 의미 |
|------|------|
| 규약 | 항목을 식별하는 필드명. updateItemState/getItemState에서 이 필드로 항목을 찾는다. |

> `itemKey`는 datasetAttrs와 성격이 다르다. datasetAttrs는 렌더링 방식(data 속성 매핑)을 결정하지만, itemKey는 믹스인의 동작 방식(항목 식별 기준)을 결정하는 인터페이스 설정이다. 따라서 datasetAttrs 안이 아닌 options 최상위에 위치한다.

### datasetAttrs

| KEY | 종류 | 의미 |
|-----|------|------|
| `severity` | 사용자 정의 | CSS가 `[data-severity]`로 스타일링 |
| `ack` | 사용자 정의 | CSS가 `[data-ack]`로 스타일링 |

> cssSelectors와 key를 공유하여 위치를 결정하고, VALUE가 data 속성명이 된다.

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
// renderData({ response: [...] })에 전달되는 data의 형태:
[
    {
        id:       '1',           // → itemKey가 'id'이므로 이 필드로 항목 식별
        severity: 'warning',     // → cssSelectors['severity'] + datasetAttrs['severity'] → data-severity
        time:     '14:30:05',    // → cssSelectors['time'] → textContent
        source:   'sensor-01',   // → cssSelectors['source'] → textContent
        message:  'Temp high',   // → cssSelectors['message'] → textContent
        ack:      'false'        // → cssSelectors['ack'] + datasetAttrs['ack'] → data-ack
    }
]
```

### KEY 매칭 규칙

```
Object.entries(cssSelectors)를 순회하며:
  각 KEY로 itemData[key]를 찾고, 값이 있으면:
    → datasetAttrs에 같은 KEY가 있으면 → data 속성 설정
    → 없으면 → textContent 설정

규약 KEY(container, template, item)도 순회에 포함되지만,
template 내부에 해당 선택자 요소가 없으므로 무시된다.

datasetAttrs는 별도로 순회하지 않는다.
cssSelectors 순회 중 datasetAttrs[key] 존재 여부로 분기할 뿐이다.
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
    itemKey: 'id',
    datasetAttrs: {
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
