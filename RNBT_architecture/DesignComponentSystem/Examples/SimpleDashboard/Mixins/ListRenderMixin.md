# ListRenderMixin

## 설계 의도

배열 데이터를 template 기반으로 반복 렌더링한다.

배열의 각 항목을 HTML `<template>` 태그의 cloneNode로 생성하는 **N:N 생성** 패턴이다. FieldRenderMixin과 달리 DOM을 생성한다. HTML 구조는 template 태그 안에 정의되므로 JS에 HTML 문자열이 없다.

### FieldRenderMixin과의 차이

| | FieldRenderMixin | ListRenderMixin |
|---|---|---|
| 데이터 | 객체 1개 | 배열 N개 |
| DOM | 이미 존재하는 요소에 값 채움 | template에서 복제하여 생성 |
| 추가 옵션 | — | container, item, template |

### 공통점

| | FieldRenderMixin | ListRenderMixin |
|---|---|---|
| cssSelectors | 요소별 textContent | 항목 내 textContent |
| datasetSelectors | 요소별 dataset | 항목 내 dataset |
| dataFormat | 데이터 매핑 | 데이터 매핑 (items 배열) |

---

## 네임스페이스

`this.listRender`

---

## 옵션

```javascript
applyListRenderMixin(instance, {
    container,          // String — 항목이 렌더링될 컨테이너 CSS 선택자
    item,               // String — 각 항목의 CSS 선택자 (customEvents에서 참조)
    template,           // String — <template> 태그의 CSS 선택자
    cssSelectors,       // Object — { dataFormatKey: '항목 내 CSS 선택자' }
    datasetSelectors,   // Object — { dataFormatKey: '항목 내 [data-*] 선택자' } (선택적)
    dataFormat          // Function — (data) => ({ items: [...] }) (선택적)
});
```

| 옵션 | 필수 | 설명 |
|------|------|------|
| container | O | 항목이 추가될 부모 요소 선택자 |
| item | O | 각 항목의 선택자 (customEvents computed property용) |
| template | O | `<template>` 태그 선택자 (cloneNode 대상) |
| cssSelectors | O | 각 항목 내부에서 textContent를 반영할 요소들 |
| datasetSelectors | X | 각 항목 내부에서 dataset을 반영할 요소들 |
| dataFormat | X | 데이터 형태 매핑. `{ items: [...] }` 형태를 반환해야 함 |

---

## 주입되는 속성/메서드

| 속성/메서드 | 설명 |
|-------------|------|
| `this.listRender.container` | 컨테이너 선택자 |
| `this.listRender.item` | 항목 선택자 (customEvents에서 computed property로 참조) |
| `this.listRender.cssSelectors` | 주입된 cssSelectors |
| `this.listRender.datasetSelectors` | 주입된 datasetSelectors |
| `this.listRender.renderData({ response })` | 데이터 수신 → 리스트 렌더링 |
| `this.listRender.clear()` | 컨테이너 비우기 |
| `this.listRender.destroy()` | 자기 정리 |

---

## 사용 예시

### HTML (마크업 — 컴포넌트가 소유)

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

### register.js (조립 코드)

```javascript
// 1. Mixin 적용
applyListRenderMixin(this, {
    container: '.event-log__list',
    item:      '.event-log__item',
    template:  '#event-log-item-template',
    cssSelectors: {
        level:   '.event-log__level',
        time:    '.event-log__time',
        message: '.event-log__message'
    },
    datasetSelectors: {
        level:   '[data-level]'
    },
    dataFormat: (data) => ({
        items: data.events.map(event => ({
            level:   event.level,
            time:    event.formattedTime,
            message: event.message
        }))
    })
});

// 2. 구독 연결
this.subscriptions = {
    events: [this.listRender.renderData]
};

// 3. 이벤트 매핑 — item 선택자를 computed property로 참조
this.customEvents = {
    click: {
        [this.listRender.item]:  '@eventClicked',
        '.event-log__clear-btn': '@clearClicked'
    }
};
bindEvents(this, this.customEvents);
```

### beforeDestroy.js (정리 코드)

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

### 페이지에서 Mixin 메서드 접근

```javascript
// before_load.js — 네임스페이스로 직접 접근
'@clearClicked': ({ targetInstance }) => {
    targetInstance.listRender.clear();
}
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
