# Mixin 명세서: ListRenderMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 데이터를 보여준다 |
| **기능** | 배열 데이터의 각 항목을 반복 생성하여 표시한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | FieldRenderMixin (데이터를 보여준다) |
| **기능의 차이** | FieldRenderMixin은 이미 존재하는 DOM 요소에 값을 채움. ListRenderMixin은 template에서 DOM을 생성함. 데이터 형태도 다름 (플랫 객체 vs 배열). |

---

## 2. 인터페이스

### cssSelectors

| KEY | 종류 | 의미 |
|-----|------|------|
| `container` | 규약 | 항목이 추가될 부모 요소 |
| `template` | 규약 | `<template>` 태그 (cloneNode 대상) |
| `item` | 사용자 정의 | 각 항목의 루트 요소. customEvents에서 `[this.listRender.cssSelectors.item]`으로 참조하기 위해 등록 |
| `level` | 사용자 정의 | 로그 레벨 표시 요소 |
| `time` | 사용자 정의 | 시간 표시 요소 |
| `message` | 사용자 정의 | 메시지 표시 요소 |
| `clearBtn` | 사용자 정의 | Clear 버튼. 이벤트 매핑 전용 (template 밖, 데이터 매칭 없음) |

> **규약 KEY**: Mixin 내부에서 `cssSelectors.container`, `cssSelectors.template`으로 직접 참조한다. 없으면 renderData에서 throw.
> **사용자 정의 KEY**: Mixin이 `Object.entries(cssSelectors)`로 순회하며, data의 같은 이름의 KEY와 매칭하여 textContent에 반영한다.

### datasetAttrs

해당 없음. 이 Mixin은 datasetAttrs를 사용하지 않는다. 모든 값은 textContent로 설정된다.

### 기타 옵션

없음.

---

## 3. renderData 기대 데이터

### 데이터 형태

```
배열. 각 항목은 cssSelectors의 KEY와 매칭되는 KEY를 가진 객체.
```

### 예시

```javascript
// renderData({ response: ??? })에 전달되는 response의 형태:
[
    { level: 'ERROR', time: '14:30', message: 'Connection failed' },
    { level: 'INFO',  time: '14:31', message: 'Reconnected' }
]
```

### KEY 매칭 규칙

```
Object.entries(cssSelectors)를 순회하며,
각 KEY로 itemData[key]를 찾고, 값이 있으면 해당 요소의 textContent에 반영.

datasetAttrs는 사용하지 않는다.

규약 KEY(container, template)도 순회에 포함되지만,
template 내부에 해당 선택자 요소가 없으므로 무시된다.
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.listRender`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors. customEvents에서 computed property로 참조 |
| `renderData({ response })` | 배열 데이터를 받아 template 복제로 항목 생성 |
| `clear()` | 컨테이너의 모든 항목을 제거 (`innerHTML = ''`) |
| `destroy()` | Mixin이 주입한 모든 속성과 메서드를 null 처리 |

---

## 5. destroy 범위

```
- ns.renderData = null
- ns.clear = null
- ns.cssSelectors = null
- instance.listRender = null
```

---

## 6. 사용 예시

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
    }
});

this.subscriptions = {
    events: [this.listRender.renderData]
};

// customEvents에서 Mixin의 선택자를 computed property로 참조
this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]:     '@eventClicked',
        [this.listRender.cssSelectors.clearBtn]: '@clearClicked'
    }
};
```

---
