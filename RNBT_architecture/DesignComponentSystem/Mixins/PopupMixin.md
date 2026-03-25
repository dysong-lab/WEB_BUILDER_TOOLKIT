# PopupMixin

## 설계 의도

콘텐츠를 별도 레이어에 표시한다.

Shadow DOM으로 팝업을 생성하고, 표시/숨김/정리를 관리한다. `<template>` 태그에서 HTML/CSS를 가져와 Shadow DOM에 주입하므로, 팝업의 시각 구조는 디자인(HTML)에서 정의된다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/COMPONENT_SYSTEM_DESIGN.md) 참조

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

## 사용 예시

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
```

### 페이지 핸들러

```javascript
'@assetClicked': ({ event, targetInstance }) => {
    targetInstance.popup.show();

    const titleEl = targetInstance.popup.query(
        targetInstance.popup.cssSelectors.title
    );
    if (titleEl) titleEl.textContent = event.detail.name;
}

'@popupCloseClicked': ({ targetInstance }) => {
    targetInstance.popup.hide();
}
```

---

## 주입되는 네임스페이스

`this.popup`

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors. customEvents에서 computed property로 참조 |
| `datasetAttrs` | 주입된 datasetAttrs |
| `show()` | 팝업 표시. 최초 호출 시 Shadow DOM 생성 (lazy init) |
| `hide()` | 팝업 숨김 |
| `query(selector)` | Shadow DOM 내 단일 요소 선택 |
| `queryAll(selector)` | Shadow DOM 내 모든 요소 선택 |
| `destroy()` | Shadow DOM 호스트 제거 + 모든 속성/메서드 null 처리 |
