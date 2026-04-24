# 3DShadowPopupMixin

## 설계 의도

3D 컴포넌트에서 콘텐츠를 별도 레이어에 표시한다.

3D 컴포넌트의 `appendElement`는 `THREE.Group`이므로 DOM에 직접 팝업을 붙일 수 없다. 대신 `page.appendElement`(HTMLDivElement)에 Shadow DOM 호스트를 생성하고, HTML/CSS를 문자열(`getHTML`/`getStyles`)로 받아 주입한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 책임 분리 (중요)

3DShadowPopupMixin은 **컴포넌트가 publishCode HTML 내부 구조를 알지 못한 채** 팝업을 표시할 수 있게 한다. 책임은 다음과 같이 나뉜다:

| 주체 | 책임 |
|------|------|
| **컴포넌트 register.js** | 3D 클릭 이벤트 → `@xxxClicked` 발행. `apply3DShadowPopupMixin`으로 `shadowPopup` 네임스페이스 생성. **publishCode 내부 클래스/구조를 알지 못한다** |
| **publishCode HTML/CSS** | 팝업의 시각 구조 + 클래스명/dataset 정의. 사용자가 에디터에서 작성 |
| **페이지 코드 (loaded.js 등)** | publishCode의 클래스명을 알고, `bindPopupEvents`로 정적 이벤트 등록 + 이벤트 수신 시 `show()` + `query()`로 데이터 매핑 |
| **Mixin 본체** | lazy init (동기 보장), 이벤트 위임 + 큐잉, query/queryAll, 정리 |

> ⚠️ **컴포넌트 register.js에서 `query` / `bindPopupEvents`를 호출해서는 안 된다.** 컴포넌트는 publishCode 내부를 모르는 상태로 일관되게 유지되어야 한다. 데이터 매핑 / 이벤트 바인딩은 페이지 코드 측에서 처리한다.

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

| 옵션 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `getHTML` | `(this: instance) => string` | ✓ | — | 팝업 HTML을 반환하는 함수. `getHTML.call(instance)`로 호출 — `this`는 instance에 바인딩 |
| `getStyles` | `(this: instance) => string` | ✓ | — | 팝업 CSS를 반환하는 함수. 반환 문자열이 `<style>{css}</style>` 형태로 Shadow DOM에 주입 |

### 네임스페이스 (`this.shadowPopup`)

| 메서드 | 역할 |
|--------|------|
| `show()` | 팝업 표시. 최초 호출 시 Shadow DOM 생성 (lazy init, 동기) |
| `hide()` | 팝업 숨김 (Shadow DOM은 유지) |
| `query(selector)` | Shadow DOM 내 단일 요소 선택. init 전에는 `null` 반환 |
| `queryAll(selector)` | Shadow DOM 내 모든 요소 선택. init 전에는 `[]` 반환 |
| `bindPopupEvents(events)` | Shadow DOM 내 이벤트 위임. `'@eventName'`은 Weventbus로 전파. **`show()` 전에 호출 가능 (지연 바인딩)** |
| `removePopupEvents()` | `bindPopupEvents`로 바인딩된 이벤트 해제 |
| `destroy()` | 이벤트 해제 + Shadow DOM 호스트 제거 + 모든 속성/메서드 null 처리 |

---

## 메서드 입력 포맷

### 단순 시그니처

| 메서드 | 파라미터 | 타입 | 필수 | 기본값 | 의미 | 반환 |
|--------|----------|------|------|--------|------|------|
| `show` | — | — | — | — | 최초 호출 시 `ensureInstance()` — `document.createElement('div')` → `instance.page.appendElement.appendChild(host)` → `attachShadow` → `getHTML()`/`getStyles()` 결과 주입. **완전 동기** | `void` |
| `hide` | — | — | — | — | `host.style.display = 'none'`. Shadow DOM 유지 | `void` |
| `query` | `selector` | string | ✓ | — | CSS 선택자 | `Element \| null` (shadowRoot 미생성 시 `null`) |
| `queryAll` | `selector` | string | ✓ | — | CSS 선택자 | `NodeList` (shadowRoot 미생성 시 빈 배열 `[]`) |
| `removePopupEvents` | — | — | — | — | 등록된 모든 리스너 해제 | `void` |
| `destroy` | — | — | — | — | `removePopupEvents` 호출 + host DOM 제거 + 네임스페이스 필드 null | `void` |

### 복합 객체 파라미터

#### `bindPopupEvents(events)`

**`events` 형태** (2D ShadowPopup과 **동일한 규약**)

```javascript
{
    [eventType]: {                      // 'click' | 'mouseover' | ...
        [selector]: handler | '@eventBusTopic'
    }
}
```

| 키 | 타입 | 의미 |
|----|------|------|
| `eventType` | string | DOM 이벤트 이름 |
| `selector` | string (CSS 선택자) | Shadow DOM 내부 요소 선택자 |
| value: `handler` | `(event: Event) => void` | DOM event 객체 하나만 받는 함수 |
| value: `'@topic'` | string (`@`로 시작) | Weventbus 토픽으로 전파. 페이로드 `{ event, targetInstance: instance }` |

**반환**: `void`

**동작 시점** (2D와 동일한 lazy 규약)

- `show()` 이전: 내부 `_pendingEvents`에 큐잉만 됨
- 최초 `show()`: Shadow DOM 생성 직후 큐에서 꺼내 일괄 바인딩
- `show()` 이후: 즉시 바인딩

---

## lazy init과 동기 보장

`show()`는 최초 호출 시 Shadow DOM을 lazy하게 생성한다. 이 과정은 **완전히 동기**다:

```
show()
  → ensureInstance()
       ├─ document.createElement('div')             ← 동기
       ├─ page.appendElement.appendChild(host)      ← 동기
       ├─ host.attachShadow({ mode: 'open' })       ← 동기
       ├─ getHTML() / getStyles() 호출              ← 동기
       └─ shadowRoot.innerHTML = `<style>...`       ← 동기 (innerHTML 파싱은 동기)
  → host.style.display = ''
```

따라서 `show()` 다음 줄에서 즉시 `query()` / textContent 접근이 보장된다. race condition은 없다.

또한 한 번 init된 이후에는 `hide()` 상태(`display:none`)에서도 Shadow DOM이 살아있어 `query()` / `bindPopupEvents` 모두 동작한다.

---

## 사용 예시

### 1. register.js (컴포넌트) — Mixin 적용 + 이벤트 발행만

```javascript
// ── MeshStateMixin ────────────────────────────────────────────

applyMeshStateMixin(this, {
    colorMap: {
        normal:  0x34d399,
        warning: 0xfbbf24,
        error:   0xf87171,
        offline: 0x6b7280
    }
});

// ── 3DShadowPopupMixin ────────────────────────────────────────

const { htmlCode, cssCode } = this.properties.publishCode || {};

apply3DShadowPopupMixin(this, {
    getHTML:   () => htmlCode || '',
    getStyles: () => cssCode || ''
});

// ── 3D 이벤트 → 외부 전파 ─────────────────────────────────────
// `@battClicked`를 수신한 쪽(페이지 코드)이 popup을 띄우고 데이터를 채운다.
// 컴포넌트는 publishCode 내부 클래스를 모르며, 직접 query/bindPopupEvents를
// 호출하지 않는다.

const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@battClicked'
};
bind3DEvents(this, this.customEvents);
```

### 2. loaded.js (페이지) — 정적 이벤트 등록 + 데이터 매핑

```javascript
const battInstance = wemb.findInstance('battComponent');

// (1) 정적 이벤트 — 페이지 로드 시 1회 등록
//     show 전이라 Mixin이 _pendingEvents에 큐잉했다가 첫 show 때 자동 바인딩한다.
battInstance.shadowPopup.bindPopupEvents({
    click: {
        '.popup-close': () => battInstance.shadowPopup.hide()
    }
});

// (2) 클릭 이벤트 수신 → 데이터 fetch + show + query 매핑
Weventbus.on('@battClicked', async () => {
    const data = await fetchBattStatus(battInstance.name);

    const root = battInstance.shadowPopup;
    root.show();   // lazy init 동기 + 첫 호출 시 위 bindPopupEvents 자동 적용

    root.query('.popup-name').textContent      = data.name;
    root.query('.popup-status').textContent    = data.status;
    root.query('.popup-status').dataset.status = data.status;
});
```

### 3. 컨테이너 (meshesArea/area_01) — 클릭된 mesh별 처리

```javascript
const containerInstance = wemb.findInstance('gltfContainerComponent');
let currentRequestId = 0;

containerInstance.shadowPopup.bindPopupEvents({
    click: {
        '.popup-close': () => containerInstance.shadowPopup.hide()
    }
});

Weventbus.on('@meshClicked', async ({ event }) => {
    // 어느 mesh가 클릭됐는지는 컴포넌트가 헬퍼로 제공
    const meshName = containerInstance.resolveMeshName(event);
    if (!meshName) return;

    // latest-wins로 다중 클릭 race 방지
    const myId = ++currentRequestId;
    const data = await fetchEquipmentDetail(meshName);
    if (myId !== currentRequestId) return;

    const root = containerInstance.shadowPopup;
    root.show();
    root.query('.popup-name').textContent      = meshName;
    root.query('.popup-status').textContent    = data.status;
    root.query('.popup-status').dataset.status = data.status;
});
```

### 4. before_unload.js (페이지) — 이벤트 정리

```javascript
const battInstance = wemb.findInstance('battComponent');
battInstance.shadowPopup.removePopupEvents();
// destroy()는 컴포넌트 beforeDestroy.js에서 처리하므로 페이지에서 호출하지 않는다.
```

### 5. beforeDestroy.js (컴포넌트) — Mixin 정리

```javascript
const { remove3DEvents } = Wkit;

remove3DEvents(this, this.customEvents);
this.customEvents = null;

this.shadowPopup.destroy();
```

---

## 자주 묻는 질문

**Q. 컴포넌트 register.js에서 직접 popup 데이터를 채우면 안 되나?**
A. 안 된다. 그러려면 컴포넌트가 publishCode 내부 클래스명을 알아야 하는데, publishCode는 사용자가 에디터에서 자유롭게 작성하는 HTML이다. 컴포넌트가 특정 클래스명을 가정하면 publishCode 형태가 강제되고, 컴포넌트별로 다른 약속이 생긴다. 데이터 매핑은 publishCode를 작성한 사람이 그 페이지에서 직접 처리해야 한다.

**Q. `show()` 전에 `query()`를 호출하면?**
A. `null`을 반환한다. 페이지 코드는 항상 `show()`를 먼저 호출한 뒤 `query()`로 매핑한다. 단 `bindPopupEvents`는 예외로, init 전에 호출하면 `_pendingEvents`에 큐잉됐다가 첫 show 시 자동 바인딩된다.

**Q. close 버튼은 어떻게 닫히나?**
A. 페이지 코드에서 `bindPopupEvents`로 등록한 핸들러가 닫는다. 클래스명(`.popup-close` 등)은 publishCode 작성자와 페이지 코드 작성자 사이의 약속이며, 이 둘은 같은 사람이거나 같이 작업하는 사이라 자연스럽게 공유된다. 컴포넌트는 그 약속을 모른다.

**Q. 같은 popup이 여러 번 열릴 때 데이터를 매번 새로 채워야 하는데, 처음에 한 번 init할 때만 채우는 onCreated 같은 게 필요하지 않나?**
A. 필요 없다. 매 show마다 데이터가 바뀔 가능성이 있으므로, 매 클릭 핸들러에서 `show()` + `query()`로 새로 채우는 패턴이 정석이다. init 1회용 콜백(onCreated)이 의미를 갖는 시나리오가 거의 없어 API에서 제거되었다.
