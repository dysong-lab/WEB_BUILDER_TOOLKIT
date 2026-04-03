# 3DShadowPopupMixin

## 설계 의도

3D 컴포넌트에서 콘텐츠를 별도 레이어에 표시한다.

3D 컴포넌트의 `appendElement`는 `THREE.Group`이므로 DOM에 직접 팝업을 붙일 수 없다. 대신 `page.appendElement`(HTMLDivElement)에 Shadow DOM 호스트를 생성하고, HTML/CSS를 문자열(`getHTML`/`getStyles`)로 받아 주입한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 2D ShadowPopupMixin과의 차이

| 항목 | 2D (ShadowPopupMixin) | 3D (3DShadowPopupMixin) |
|------|----------------------|------------------------|
| 콘텐츠 소스 | DOM `<template>` 태그 탐색 | `getHTML()` / `getStyles()` 문자열 |
| Host 부착 | `instance.appendElement` | `instance.page.appendElement` |
| cssSelectors | 옵션으로 받아 네임스페이스에 저장 | 없음 (문자열 기반이므로 불필요) |
| datasetAttrs | 옵션으로 받아 네임스페이스에 저장 | 없음 |

> ⚠️ **네임스페이스 충돌**: 3DShadowPopupMixin과 ShadowPopupMixin은 모두 `this.shadowPopup` 네임스페이스를 사용한다. **동일 인스턴스에 두 Mixin을 동시에 적용할 수 없다.**

---

## 인터페이스

### 옵션

| 옵션 | 필수 | 의미 |
|------|------|------|
| `getHTML` | O | 팝업 HTML을 반환하는 함수. `this`는 instance로 바인딩된다. `() => string` |
| `getStyles` | O | 팝업 CSS를 반환하는 함수. `this`는 instance로 바인딩된다. `() => string` |
| `onCreated` | X | Shadow DOM 생성 완료 후 콜백. `(shadowRoot) => void` |

> `cssSelectors`/`datasetAttrs` 옵션은 없다. 3D 컴포넌트는 `<template>` 태그를 사용하지 않고, HTML/CSS를 문자열로 직접 받으므로 선택자 계약이 필요 없다. 팝업 내부 요소에 접근할 때는 `query()`에 CSS 선택자를 직접 전달한다.

---

## 주입되는 네임스페이스

`this.shadowPopup`

| 속성/메서드 | 역할 |
|------------|------|
| `show()` | 팝업 표시. 최초 호출 시 Shadow DOM 생성 (lazy init) |
| `hide()` | 팝업 숨김 |
| `query(selector)` | Shadow DOM 내 단일 요소 선택 |
| `queryAll(selector)` | Shadow DOM 내 모든 요소 선택 |
| `bindPopupEvents(events)` | Shadow DOM 내 이벤트 위임. `'@eventName'`은 Weventbus로 전파. `show()` 전 호출 가능 (지연 바인딩) |
| `removePopupEvents()` | `bindPopupEvents`로 바인딩된 이벤트 해제 |
| `destroy()` | 이벤트 해제 + Shadow DOM 호스트 제거 + 모든 속성/메서드 null 처리 |

---

## 이벤트 처리

### 3D 이벤트 → bind3DEvents (기존 패턴)

3D 컴포넌트는 일반 DOM `bindEvents` 대신 `bind3DEvents`를 사용한다.

```javascript
const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@battClicked'
};
bind3DEvents(this, this.customEvents);
```

### Shadow DOM 내부 이벤트 → bindPopupEvents

```javascript
this.shadowPopup.bindPopupEvents({
    click: {
        '.popup-close': () => this.shadowPopup.hide()
    }
});
```

값이 `@`로 시작하는 문자열이면 `Weventbus`로 전파된다 (customEvents와 동일한 패턴). 함수이면 직접 호출된다.

`show()` 전에 호출해도 된다. Shadow DOM이 아직 생성되지 않은 상태에서는 내부에 보관했다가, 최초 `show()` 시 Shadow DOM 생성과 함께 자동 바인딩된다.

---

## Shadow DOM 생성 흐름

```
최초 show() 호출 시 lazy 생성:
  1. host 요소(div)를 생성한다
  2. instance.page.appendElement에 host를 부착한다
  3. host에 Shadow DOM을 연결한다
  4. getHTML()/getStyles()로 콘텐츠를 문자열로 받아 Shadow DOM에 주입한다
  5. bindPopupEvents가 show() 전에 호출되었으면 여기서 바인딩한다
  6. onCreated 콜백을 호출한다 (있으면)

이후 show/hide는 display만 토글한다.
```

---

## 사용 예시

### register.js

```javascript
// ── 3DShadowPopupMixin ────────────────────────────────────────

const { htmlCode, cssCode } = this.properties.publishCode || {};

apply3DShadowPopupMixin(this, {
    getHTML:   () => htmlCode || '',
    getStyles: () => cssCode || '',
    onCreated: (shadowRoot) => {
        // 팝업 내부 이벤트 바인딩
        this.shadowPopup.bindPopupEvents({
            click: {
                '.popup-close': () => this.shadowPopup.hide()
            }
        });
    }
});

// ── 3D 이벤트 → 팝업 표시 ─────────────────────────────────────

const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@battClicked'
};
bind3DEvents(this, this.customEvents);

this.showDetail = () => {
    this.shadowPopup.show();

    const nameEl = this.shadowPopup.query('.popup-name');
    if (nameEl) nameEl.textContent = this.name || 'BATT';
};
```

### beforeDestroy.js

```javascript
const { remove3DEvents } = Wkit;

// 3. 이벤트 제거
remove3DEvents(this, this.customEvents);
this.customEvents = null;

// 1. Mixin 정리
this.shadowPopup.destroy();
```
