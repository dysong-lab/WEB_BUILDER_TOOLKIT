# ListRenderMixin

## 설계 의도

배열 데이터를 template 기반으로 반복 렌더링한다.

배열의 각 항목을 HTML `<template>` 태그의 cloneNode로 생성하는 **N:N 생성** 패턴이다. FieldRenderMixin과 달리 DOM을 생성한다. HTML 구조는 template 태그 안에 정의되므로 JS에 HTML 문자열이 없다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/COMPONENT_SYSTEM_DESIGN.md) 참조
> **구독/이벤트/정리 패턴**: 설계 문서의 "라이프사이클" 참조

### FieldRenderMixin과의 차이

| | FieldRenderMixin | ListRenderMixin |
|---|---|---|
| 데이터 | 플랫 객체 1개 | 배열 N개 |
| DOM | 이미 존재하는 요소에 값 채움 | template에서 복제하여 생성 |
| 추가 KEY | — | container, item, template |

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
    container: '.event-log__list',           // 항목이 추가될 부모
    item:      '.event-log__item',           // 각 항목의 루트
    template:  '#event-log-item-template',   // cloneNode 대상
    level:     '.event-log__level',          // 로그 레벨 표시
    time:      '.event-log__time',           // 시간 표시
    message:   '.event-log__message',        // 메시지 표시
    clearBtn:  '.event-log__clear-btn'       // 이벤트 매핑 전용 (template 밖)
}
```

### datasetSelectors

data-* 속성으로 HTML 요소를 참조한다.

```javascript
datasetSelectors: {
    level: 'level'      // HTML의 data-level 속성을 가진 요소
}
```

### renderData가 기대하는 데이터

배열. 각 항목의 KEY가 cssSelectors/datasetSelectors의 KEY와 일치해야 한다.

```javascript
// 이 배열이 renderData에 전달되면:
[
    { level: 'ERROR', time: '14:30', message: 'Connection failed' },
    { level: 'INFO',  time: '14:31', message: 'Reconnected' }
]
```

---

## 사용 예시

### HTML

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

### register.js

```javascript
applyListRenderMixin(this, {
    cssSelectors: {
        container: '.event-log__list',
        item:      '.event-log__item',
        template:  '#event-log-item-template',
        level:     '.event-log__level',
        time:      '.event-log__time',
        message:   '.event-log__message',
        clearBtn:  '.event-log__clear-btn'
    },
    datasetSelectors: {
        level: 'level'
    }
});

this.subscriptions = {
    events: [this.listRender.renderData]
};
```

---

## 주입되는 네임스페이스

`this.listRender`

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors (customEvents에서 computed property로 참조) |
| `datasetSelectors` | 주입된 datasetSelectors |
| `renderData({ response })` | selector KEY에 맞춰진 배열을 받아 항목을 생성하여 렌더링 |
| `clear()` | 컨테이너의 모든 항목을 제거 |
| `destroy()` | Mixin이 주입한 모든 속성과 메서드를 정리 |

---

## template 태그의 약속

template 내부의 HTML 구조는 자유롭지만, **cssSelectors와 datasetSelectors의 VALUE에 해당하는 요소**가 반드시 존재해야 한다.

```
01_list:   수직 리스트 (flex row)
02_table:  테이블 행 (grid columns)
03_bubble: 채팅 버블 (nested divs)

→ template 구조가 완전히 달라도 선택자만 유지하면 같은 Mixin이 동작
```

---

## 디자인 변형

같은 register.js로 HTML/CSS만 교체할 수 있다. 조건:

1. `container` VALUE에 해당하는 요소가 존재
2. `template` VALUE에 해당하는 `<template>` 태그가 존재
3. template 내부에 각 KEY의 VALUE에 해당하는 요소가 존재
4. `item` VALUE가 template 내부의 최상위 요소와 매칭
