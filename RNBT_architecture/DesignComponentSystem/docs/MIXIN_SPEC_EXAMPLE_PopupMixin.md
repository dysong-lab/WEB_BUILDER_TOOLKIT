# Mixin 명세서: PopupMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 콘텐츠를 별도 레이어에 표시한다 |
| **기능** | Shadow DOM으로 팝업을 생성하고, 표시/숨김/정리를 관리한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | 없음 |
| **기능의 차이** | - |

---

## 2. 인터페이스

### cssSelectors

| KEY | 종류 | 의미 |
|-----|------|------|
| `template` | 규약 | 팝업 HTML/CSS가 담긴 `<template>` 태그. 내부의 `<style>`은 Shadow DOM 스코프로 격리된다. |
| `closeBtn` | 사용자 정의 | 닫기 버튼. customEvents에서 참조 |
| `title` | 사용자 정의 | 제목 표시 요소 |
| `content` | 사용자 정의 | 콘텐츠 영역 |

> **규약 KEY**: Mixin 내부에서 `cssSelectors.template`을 직접 참조하여 `<template>`을 찾고, 그 내용을 Shadow DOM에 주입한다. 없으면 show()에서 throw.
> **사용자 정의 KEY**: 팝업 내부의 어떤 요소에 이름을 붙일지는 디자인에 따라 달라진다.
> **검색 범위:** 일반 Mixin의 cssSelectors는 `instance.appendElement` 안에서 요소를 찾는다. PopupMixin에서 `template`은 `instance.appendElement` 안에서 찾고, 나머지 사용자 정의 KEY는 `shadowRoot` 안에서 찾는다. 디자인과 기능을 분리하는 역할은 동일하다.

### datasetAttrs

| KEY | 종류 | 의미 |
|-----|------|------|
| | 사용자 정의 | CSS에서 `[data-*]`로 스타일링에 활용 |

> 규약 KEY 없음. 필요 시 사용자가 정의한다.

### 기타 옵션

| 옵션 | 필수 | 의미 |
|------|------|------|
| `onCreated` | X | Shadow DOM 생성 완료 후 호출되는 콜백. `(shadowRoot) => void` |

---

## 3. renderData 기대 데이터

해당 없음. PopupMixin은 renderData 패턴을 사용하지 않는다. 대신 show, hide 메서드를 직접 호출하여 사용한다.

### show 파라미터

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| 없음 | - | 팝업을 표시한다. 최초 호출 시 Shadow DOM을 생성(lazy init)한다. |

### hide 파라미터

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| 없음 | - | 팝업을 숨긴다. Shadow DOM은 유지된다(destroy하지 않음). |

### 사용 흐름

```
renderData 패턴이 아닌 직접 호출 패턴:
  - 페이지 핸들러에서 이벤트 수신 → popup.show() 호출
  - 닫기 이벤트 수신 → popup.hide() 호출

Shadow DOM은 최초 show() 시 lazy 생성된다.
  1. cssSelectors.template으로 <template> 태그를 찾는다
  2. host 요소를 생성하고 Shadow DOM을 연결한다
  3. template의 content를 clone하여 Shadow DOM에 주입한다
  4. onCreated 콜백을 호출한다 (있으면)

이후 show/hide는 display만 토글한다.
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.popup`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors. customEvents에서 computed property로 참조 |
| `datasetAttrs` | 주입된 datasetAttrs |
| `show()` | 팝업 표시. 최초 호출 시 Shadow DOM 생성 (lazy init) |
| `hide()` | 팝업 숨김 |
| `query(selector)` | Shadow DOM 내 단일 요소 선택. `shadowRoot.querySelector` |
| `queryAll(selector)` | Shadow DOM 내 모든 요소 선택. `shadowRoot.querySelectorAll` |
| `destroy()` | Shadow DOM 호스트 제거 + 모든 속성/메서드 null 처리 |

---

## 5. destroy 범위

```
- host 요소를 DOM에서 제거 (host.remove())
- shadowRoot = null
- host = null
- ns.show = null
- ns.hide = null
- ns.query = null
- ns.queryAll = null
- ns.cssSelectors = null
- ns.datasetAttrs = null
- instance.popup = null
```

---

## 6. 사용 예시

### HTML

```html
<div class="asset-component">
    <!-- 컴포넌트 본체 -->

    <template id="asset-popup-template">
        <style>
            .popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
            .popup-panel { background: #1e1e1e; border-radius: 8px; padding: 24px; min-width: 400px; }
            .popup-title { font-size: 18px; color: #fff; }
            .popup-close-btn { cursor: pointer; }
        </style>
        <div class="popup-overlay">
            <div class="popup-panel">
                <div class="popup-header">
                    <h2 class="popup-title"></h2>
                    <button class="popup-close-btn">✕</button>
                </div>
                <div class="popup-content"></div>
            </div>
        </div>
    </template>
</div>
```

### register.js

```javascript
applyPopupMixin(this, {
    cssSelectors: {
        template: '#asset-popup-template',
        closeBtn: '.popup-close-btn',
        title:    '.popup-title',
        content:  '.popup-content'
    }
});

// customEvents에서 Mixin의 선택자를 computed property로 참조
this.customEvents = {
    click: {
        [this.popup.cssSelectors.closeBtn]: '@popupCloseClicked'
    }
};
```

### 페이지 핸들러 (before_load.js)

```javascript
'@assetClicked': ({ event, targetInstance }) => {
    targetInstance.popup.show();

    // 선택자 계약을 통해 팝업 내부 요소에 접근
    const titleEl = targetInstance.popup.query(
        targetInstance.popup.cssSelectors.title
    );
    if (titleEl) titleEl.textContent = event.detail.name;
}

'@popupCloseClicked': ({ targetInstance }) => {
    targetInstance.popup.hide();
}
```

> 팝업 내부의 콘텐츠 렌더링(차트, 테이블 등)은 PopupMixin의 범위 밖이다. 컴포넌트의 조립 코드에서 `popup.query()`와 `popup.cssSelectors`로 요소를 찾아 직접 처리하거나, 별도 Mixin 인스턴스가 팝업 내부 요소를 대상으로 동작한다.

---
