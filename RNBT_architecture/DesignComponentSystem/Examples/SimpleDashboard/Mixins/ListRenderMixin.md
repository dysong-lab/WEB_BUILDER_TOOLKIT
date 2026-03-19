# ListRenderMixin

## 설계 의도

배열 데이터를 template 기반으로 반복 렌더링한다.

배열의 각 항목을 HTML `<template>` 태그의 cloneNode로 생성하는 **N:N 생성** 패턴이다. FieldRenderMixin과 달리 DOM을 생성한다. HTML 구조는 template 태그 안에 정의되므로 JS에 HTML 문자열이 없다.

> **Mixin 공통 사용법**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/COMPONENT_SYSTEM_DESIGN.md)의 "Mixin > 공통 사용법" 참조

### FieldRenderMixin과의 차이

| | FieldRenderMixin | ListRenderMixin |
|---|---|---|
| 데이터 | 객체 1개 | 배열 N개 |
| DOM | 이미 존재하는 요소에 값 채움 | template에서 복제하여 생성 |
| 추가 옵션 | — | container, item, template |

---

## 사용법

### 1단계: HTML을 본다

```html
<div class="event-log">
    <div class="event-log__header">
        <span class="event-log__title">Event Log</span>
        <button class="event-log__clear-btn">Clear</button>
    </div>
    <div class="event-log__list"></div>

    <template id="event-log-item-template">
        <div class="event-log__item">
            <span class="event-log__level" data-level=""></span>
            <span class="event-log__time"></span>
            <span class="event-log__message"></span>
        </div>
    </template>
</div>
```

HTML에서 확인하는 것:
- 항목이 렌더링될 컨테이너 → `.event-log__list`
- template 태그 → `#event-log-item-template`
- template 안에서 항목 루트 → `.event-log__item`
- 텍스트를 넣을 요소 → `.event-log__level`, `.event-log__time`, `.event-log__message`
- data 속성이 있는 요소 → `data-level` → dataset 바인딩 대상
- template 밖의 버튼 → `.event-log__clear-btn` → 이벤트 바인딩 대상

### 2단계: Mixin을 적용한다 (register.js)

```javascript
applyListRenderMixin(this, {
    container: '.event-log__list',
    item:      '.event-log__item',
    template:  '#event-log-item-template',
    cssSelectors: {
        level:    '.event-log__level',       // 데이터 바인딩용
        time:     '.event-log__time',        // 데이터 바인딩용
        message:  '.event-log__message',     // 데이터 바인딩용
        clearBtn: '.event-log__clear-btn'    // 이벤트 바인딩 전용 (template 밖)
    },
    datasetSelectors: {
        level: '[data-level]'
    },
    dataFormat: (data) => ({
        items: data.events.map(event => ({
            level:   event.level,       // → cssSelectors.level textContent + datasetSelectors.level dataset
            time:    event.formattedTime,// → cssSelectors.time textContent
            message: event.message      // → cssSelectors.message textContent
            // clearBtn 키 없음 → cssSelectors.clearBtn 건너뜀
        }))
    })
});
```

**FieldRenderMixin과의 차이:**
- `container`, `item`, `template` 옵션이 추가됨
- dataFormat은 `{ items: [...] }` 형태를 반환해야 함

**키 매칭 규칙은 동일:**
- dataFormat 항목의 키가 cssSelectors에 있으면 → textContent
- dataFormat 항목의 키가 datasetSelectors에 있으면 → dataset
- cssSelectors에 있지만 dataFormat에 없으면 → 건너뜀 (이벤트 전용)

### 3단계: 구독을 연결한다

```javascript
this.subscriptions = {
    events: [this.listRender.renderData]
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
// Mixin의 선택자를 computed property로 참조 — 하드코딩 금지
this.customEvents = {
    click: {
        [this.listRender.item]:               '@eventClicked',
        [this.listRender.cssSelectors.clearBtn]: '@clearClicked'
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

this.listRender.destroy();
```

---

## 옵션

```javascript
applyListRenderMixin(instance, {
    container,          // String — 항목이 렌더링될 컨테이너 CSS 선택자
    item,               // String — 각 항목의 CSS 선택자
    template,           // String — <template> 태그의 CSS 선택자
    cssSelectors,       // Object — { key: '항목 내 CSS 선택자' }
    datasetSelectors,   // Object — { key: '항목 내 [data-*] 선택자' } (선택적)
    dataFormat          // Function — (data) => ({ items: [...] }) (선택적)
});
```

| 옵션 | 필수 | 설명 |
|------|------|------|
| container | O | 항목이 추가될 부모 요소 선택자 |
| item | O | 각 항목의 선택자 (customEvents에서 computed property로 참조) |
| template | O | `<template>` 태그 선택자 (cloneNode 대상) |
| cssSelectors | O | HTML 요소를 CSS 선택자로 찾아 참조. dataFormat에 키가 있으면 textContent 반영 |
| datasetSelectors | X | HTML 요소를 data 속성 선택자로 찾아 참조. dataFormat에 키가 있으면 dataset 반영 |
| dataFormat | X | 데이터 형태 매핑. `{ items: [...] }` 형태를 반환해야 함 |

---

## 주입되는 인터페이스

네임스페이스: `this.listRender`

### 속성

| 속성 | 역할 |
|------|------|
| `container` | 컨테이너 선택자 |
| `item` | 항목 선택자 (customEvents에서 computed property로 참조) |
| `cssSelectors` | 주입된 cssSelectors |
| `datasetSelectors` | 주입된 datasetSelectors |

### 메서드

#### `renderData({ response })`

데이터를 수신하여 항목을 렌더링한다. template을 cloneNode하여 항목을 생성하고, 각 항목에 cssSelectors와 datasetSelectors를 반영한다.

```javascript
// 구독을 통한 자동 호출
subscribe('events', this, this.listRender.renderData);
```

- 호출될 때마다 컨테이너를 비우고 전체 재렌더링
- dataFormat에 없는 cssSelectors 키는 건너뜀

#### `clear()`

컨테이너의 모든 항목을 제거한다.

```javascript
// 페이지 핸들러에서 호출
targetInstance.listRender.clear();
```

#### `destroy()`

Mixin이 주입한 모든 속성과 메서드를 정리한다.

```javascript
// beforeDestroy.js
this.listRender.destroy();
```

---

## template 태그의 약속

template 내부의 HTML 구조는 자유롭지만, **cssSelectors와 datasetSelectors의 선택자에 해당하는 요소**가 반드시 존재해야 한다.

```
약속된 선택자:
  cssSelectors:     .event-log__level, .event-log__time, .event-log__message
  datasetSelectors: [data-level]

이 선택자들이 template 안에 있으면 디자인은 자유:

01_list:   수직 리스트 (flex row)
02_table:  테이블 행 (grid columns)
03_bubble: 채팅 버블 (nested divs)

→ template 구조가 완전히 달라도 선택자만 유지하면 같은 Mixin이 동작
```

---

## 디자인 변형

같은 Mixin을 적용하면서 HTML/CSS만 교체할 수 있다. 조건:

1. `container` 선택자에 해당하는 요소가 존재
2. `template` 선택자에 해당하는 `<template>` 태그가 존재
3. template 내부에 `cssSelectors`와 `datasetSelectors`의 선택자가 존재
4. `item` 선택자가 template 내부의 최상위 요소와 매칭

```
01_list.html     — 수직 리스트
02_table.html    — 테이블 구조
03_bubble.html   — 채팅 버블

→ register.js는 동일
```
