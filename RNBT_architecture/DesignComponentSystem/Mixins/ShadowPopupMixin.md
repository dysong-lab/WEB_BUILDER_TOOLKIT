# ShadowPopupMixin

## 설계 의도

콘텐츠를 별도 레이어에 표시한다.

Shadow DOM으로 팝업을 생성하고, 표시/숨김/정리를 관리한다. `<template>` 태그에서 HTML/CSS를 가져와 Shadow DOM에 주입하므로, 팝업의 시각 구조는 디자인(HTML)에서 정의된다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## Shadow DOM이란

ShadowPopupMixin은 Shadow DOM을 사용한다. 이것이 일반 Mixin과 다른 두 가지 특성을 만든다.

### 1. 스타일 격리

Shadow DOM 안의 CSS는 바깥에 영향을 주지 않고, 바깥의 CSS도 안에 영향을 주지 않는다. 팝업의 `.popup-title`과 본체의 `.popup-title`이 같은 이름이어도 충돌하지 않는다.

이 격리 때문에 팝업의 CSS는 `<template>` 안에 `<style>` 태그로 인라인한다. 일반 컴포넌트는 런타임이 HTML과 CSS를 별도로 로드하여 조합하므로 `views/`와 `styles/`를 분리하지만, 팝업 template은 `cloneNode`로 Shadow DOM에 통째로 주입되므로 `<style>`이 함께 들어가야 한다. 외부 `<link>` 태그로 분리할 수도 있지만, 경로가 런타임 환경에 의존하게 되어 안정성이 떨어진다.

```html
<template id="popup-template">
    <style>
        /* 이 CSS는 Shadow DOM 안에서만 적용된다 */
        .popup-panel { background: #ffffff; border-radius: 12px; }
    </style>
    <div class="popup-overlay">
        <div class="popup-panel">...</div>
    </div>
</template>
```

### 2. 이벤트 boundary

Shadow DOM 내부에서 발생한 이벤트는 shadow boundary를 넘을 때 `event.target`이 host 요소로 retarget된다. 따라서 `instance.appendElement`에서의 이벤트 위임(`bindEvents`)으로는 Shadow DOM 내부 요소의 클릭을 잡을 수 없다.

```
instance.appendElement
  ├── .device-list__item     ← bindEvents로 잡을 수 있음
  └── <div> (shadow host)
       └── #shadow-root
            └── .popup-close-btn  ← bindEvents로 잡을 수 없음
                                     event.target이 host로 retarget됨
```

이 문제를 해결하기 위해 `bindPopupEvents`가 존재한다. Shadow DOM 내부의 `shadowRoot`에 직접 이벤트를 위임한다.

---

## 인터페이스

### cssSelectors

| KEY | 종류 | 의미 |
|-----|------|------|
| `template` | 규약 | 팝업 HTML/CSS가 담긴 `<template>` 태그 |
| 나머지 | 사용자 정의 | 팝업 내부 요소 (디자인에 따라 정의) |

> `template`은 `instance.appendElement`에서 찾고, 나머지 KEY는 `shadowRoot`에서 찾는다.

### 기타 옵션

| 옵션 | 필수 | 의미 |
|------|------|------|
| `onCreated` | X | Shadow DOM 생성 완료 후 콜백. `(shadowRoot) => void` |

---

## 주입되는 네임스페이스

`this.shadowPopup`

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors. customEvents에서 computed property로 참조 |
| `datasetAttrs` | 주입된 datasetAttrs |
| `show()` | 팝업 표시. 최초 호출 시 Shadow DOM 생성 (lazy init) |
| `hide()` | 팝업 숨김 |
| `query(selector)` | Shadow DOM 내 단일 요소 선택 |
| `queryAll(selector)` | Shadow DOM 내 모든 요소 선택 |
| `bindPopupEvents(events)` | Shadow DOM 내 이벤트 위임. `show()` 전에 호출 가능 (지연 바인딩) |
| `removePopupEvents()` | `bindPopupEvents`로 바인딩된 이벤트 해제 |
| `destroy()` | 이벤트 해제 + Shadow DOM 호스트 제거 + 모든 속성/메서드 null 처리 |

---

## 이벤트 처리

### 일반 DOM 이벤트 → bindEvents (기존 패턴)

```javascript
this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@deviceClicked'
    }
};
bindEvents(this, this.customEvents);
```

### Shadow DOM 내부 이벤트 → bindPopupEvents

```javascript
this.shadowPopup.bindPopupEvents({
    click: {
        [this.shadowPopup.cssSelectors.closeBtn]: '@popupClose'
    }
});
```

값이 `@`로 시작하는 문자열이면 `Weventbus`로 전파된다 (customEvents와 동일한 패턴). 함수이면 직접 호출된다.

`show()` 전에 호출해도 된다. Shadow DOM이 아직 생성되지 않은 상태에서는 내부에 보관했다가, 최초 `show()` 시 Shadow DOM 생성과 함께 자동 바인딩된다.

---

## 팝업 내부에서 다른 Mixin 사용

팝업 내부에서도 기존 Mixin(ListRenderMixin 등)을 사용할 수 있다. Mixin은 `instance.appendElement.querySelector()`로 요소를 찾으므로, `appendElement`를 `shadowRoot`로 지정하면 Shadow DOM 안에서 동작한다.

### 방법

`onCreated` 콜백에서 `shadowRoot`를 `appendElement`로 가진 래퍼 객체를 만들고, 그 래퍼에 Mixin을 적용한다.

```javascript
this._popupScope = null;

applyShadowPopupMixin(this, {
    cssSelectors: {
        template: '#popup-template',
        closeBtn: '.popup-close-btn',
        title:    '.popup-title'
    },
    onCreated: (shadowRoot) => {
        this._popupScope = { appendElement: shadowRoot };
        applyListRenderMixin(this._popupScope, {
            cssSelectors: {
                container: '.popup-detail-list',
                template:  '#popup-detail-item-template',
                label:     '.popup-field__label',
                value:     '.popup-field__value'
            }
        });
    }
});
```

### 팝업 template HTML

팝업 template 안에 `<template>`을 중첩하여 ListRenderMixin의 반복 대상을 정의한다.

```html
<template id="popup-template">
    <style>/* Shadow DOM 스코프 CSS */</style>
    <div class="popup-overlay">
        <div class="popup-panel">
            <div class="popup-header">
                <span class="popup-title"></span>
                <button class="popup-close-btn">&times;</button>
            </div>
            <div class="popup-detail-list"></div>

            <template id="popup-detail-item-template">
                <div class="popup-field">
                    <span class="popup-field__label"></span>
                    <span class="popup-field__value"></span>
                </div>
            </template>
        </div>
    </div>
</template>
```

### 페이지 핸들러에서 사용

```javascript
'@deviceClicked': ({ event, targetInstance }) => {
    targetInstance.shadowPopup.show();

    fetch('/api/device-detail?name=' + deviceName)
        .then(r => r.json())
        .then(detail => {
            // 데이터 변환은 페이지의 책임
            const data = [
                { label: 'Type',     value: detail.type },
                { label: 'Status',   value: detail.status },
                { label: 'Location', value: detail.location }
            ];
            targetInstance._popupScope.listRender.renderData({
                response: { data }
            });
        });
}
```

### 정리

`_popupScope`의 Mixin은 `popup.destroy()` 전에 먼저 정리한다.

```javascript
// beforeDestroy.js
if (this._popupScope && this._popupScope.listRender) {
    this._popupScope.listRender.destroy();
}
this._popupScope = null;
this.shadowPopup.destroy();
```

---

## 사용 예시 (전체)

### register.js

```javascript
applyListRenderMixin(this, {
    cssSelectors: {
        container: '.device-list__body',
        item:      '.device-list__item',
        template:  '#device-list-item-template',
        name:      '.device-list__name'
    }
});

this._popupScope = null;

applyShadowPopupMixin(this, {
    cssSelectors: {
        template: '#device-detail-popup-template',
        closeBtn: '.popup-close-btn',
        title:    '.popup-title'
    },
    onCreated: (shadowRoot) => {
        this._popupScope = { appendElement: shadowRoot };
        applyListRenderMixin(this._popupScope, {
            cssSelectors: {
                container: '.popup-detail-list',
                template:  '#popup-detail-item-template',
                label:     '.popup-field__label',
                value:     '.popup-field__value'
            }
        });
    }
});

// 일반 DOM 이벤트
this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@deviceClicked'
    }
};
bindEvents(this, this.customEvents);

// Shadow DOM 내부 이벤트 → Weventbus로 전파
this.shadowPopup.bindPopupEvents({
    click: {
        [this.shadowPopup.cssSelectors.closeBtn]: '@devicePopupClose'
    }
});
```
