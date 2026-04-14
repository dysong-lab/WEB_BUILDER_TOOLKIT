# Mixin 명세서: 3DShadowPopupMixin

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 콘텐츠를 별도 레이어에 표시한다 |
| **기능** | 3D 컴포넌트에서 Shadow DOM으로 팝업을 생성하고, 표시/숨김/정리를 관리한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | ShadowPopupMixin |
| **기능의 차이** | ShadowPopupMixin은 DOM `<template>` 태그에서 콘텐츠를 가져와 `instance.appendElement`에 부착한다. 3DShadowPopupMixin은 `getHTML()`/`getStyles()` 문자열로 콘텐츠를 받아 `instance.page.appendElement`에 부착한다. 3D 컴포넌트의 `appendElement`는 `THREE.Group`이므로 DOM을 직접 붙일 수 없기 때문이다. |

---

## 2. 인터페이스

### cssSelectors

해당 없음. 3DShadowPopupMixin은 `<template>` 태그를 사용하지 않으므로 cssSelectors 옵션이 없다. 팝업 내부 요소에 접근할 때는 `query()`에 CSS 선택자를 직접 전달한다.

### datasetAttrs

해당 없음.

### 기타 옵션

| 옵션 | 필수 | 의미 |
|------|------|------|
| `getHTML` | O | 팝업 HTML을 반환하는 함수. `this`는 instance로 바인딩된다. `() => string` |
| `getStyles` | O | 팝업 CSS를 반환하는 함수. `this`는 instance로 바인딩된다. `() => string` |

---

## 3. renderData 기대 데이터

해당 없음. 3DShadowPopupMixin은 renderData 패턴을 사용하지 않는다. 대신 show, hide 메서드를 직접 호출하여 사용한다.

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
  - 3D 이벤트 수신 → popup.show() 호출
  - 닫기 이벤트 수신 → popup.hide() 호출

Shadow DOM은 최초 show() 시 lazy 생성된다 (완전히 동기).
  1. host 요소(div)를 생성한다
  2. instance.page.appendElement에 host를 부착한다
  3. host에 Shadow DOM을 연결한다
  4. getHTML()/getStyles()로 콘텐츠를 문자열로 받아 주입한다 (innerHTML 동기 파싱)
  5. bindPopupEvents가 show() 전에 호출되었으면 여기서 바인딩한다

이후 show/hide는 display만 토글한다. show() 다음 줄에서 즉시 query() 접근이 보장된다.
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.shadowPopup`

> ⚠️ ShadowPopupMixin과 동일한 네임스페이스를 사용한다. 동일 인스턴스에 두 Mixin을 동시에 적용할 수 없다.

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `show()` | 팝업 표시. 최초 호출 시 Shadow DOM 생성 (lazy init) |
| `hide()` | 팝업 숨김 |
| `query(selector)` | Shadow DOM 내 단일 요소 선택. `shadowRoot.querySelector` |
| `queryAll(selector)` | Shadow DOM 내 모든 요소 선택. `shadowRoot.querySelectorAll` |
| `bindPopupEvents(events)` | Shadow DOM 내 이벤트 위임. `'@eventName'`은 Weventbus로 전파. show() 전 호출 가능 (지연 바인딩) |
| `removePopupEvents()` | `bindPopupEvents`로 바인딩된 이벤트 해제 |
| `destroy()` | 이벤트 해제 + Shadow DOM 호스트 제거 + 모든 속성/메서드 null 처리 |

---

## 5. destroy 범위

```
- removePopupEvents() (바인딩된 이벤트 해제)
- host 요소를 DOM에서 제거 (host.remove())
- shadowRoot = null
- host = null
- _pendingEvents = null
- ns.show = null
- ns.hide = null
- ns.query = null
- ns.queryAll = null
- ns.bindPopupEvents = null
- ns.removePopupEvents = null
- instance.shadowPopup = null
```

---

## 6. 사용 예시

### 책임 분리

| 주체 | 책임 |
|------|------|
| **컴포넌트 register.js** | Mixin 적용 + 3D 클릭 이벤트 발행만. publishCode 내부 클래스/구조를 알지 못한다 |
| **publishCode HTML/CSS** | 팝업 시각 구조 + 클래스명 정의 |
| **페이지 코드 (loaded.js)** | publishCode 클래스명을 알고, 정적 이벤트는 `bindPopupEvents`로 1회 등록, 동적 데이터는 매 클릭마다 `show()` + `query()`로 매핑 |

### register.js (컴포넌트)

```javascript
const { htmlCode, cssCode } = this.properties.publishCode || {};

apply3DShadowPopupMixin(this, {
    getHTML:   () => htmlCode || '',
    getStyles: () => cssCode || ''
});

// 3D 이벤트 발행만 — 컴포넌트는 popup 내부를 모른다
const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@battClicked'
};
bind3DEvents(this, this.customEvents);
```

### loaded.js (페이지) — 정적 이벤트 + 동적 매핑

```javascript
const battInstance = wemb.findInstance('battComponent');

// (1) 정적 이벤트 — show 전 1회 호출 (Mixin이 큐잉 후 첫 show 시 자동 바인딩)
battInstance.shadowPopup.bindPopupEvents({
    click: {
        '.popup-close': () => battInstance.shadowPopup.hide()
    }
});

// (2) 클릭 이벤트 → 데이터 fetch + show + query 매핑
Weventbus.on('@battClicked', async () => {
    const data = await fetchBattStatus(battInstance.name);

    const root = battInstance.shadowPopup;
    root.show();   // lazy init 동기, 다음 줄부터 query 안전

    root.query('.popup-name').textContent      = data.name;
    root.query('.popup-status').textContent    = data.status;
    root.query('.popup-status').dataset.status = data.status;
});
```

### before_unload.js (페이지)

```javascript
const battInstance = wemb.findInstance('battComponent');
battInstance.shadowPopup.removePopupEvents();
```

### beforeDestroy.js (컴포넌트)

```javascript
const { remove3DEvents } = Wkit;

remove3DEvents(this, this.customEvents);
this.customEvents = null;

this.shadowPopup.destroy();
```

> 팝업 내부의 콘텐츠 렌더링은 3DShadowPopupMixin의 범위 밖이다. **컴포넌트가 아닌 페이지 코드**에서 `shadowPopup.query()`로 요소를 찾아 직접 처리한다.

---
