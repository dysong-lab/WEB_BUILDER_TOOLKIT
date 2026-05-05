# AppBars — Advanced / scrollCollapsing

## 기능 정의

1. **확장/축소 두 상태 표시** — 초기 상태에서는 큰 제목(headline) 영역과 nav/action 행을 모두 노출하고, 축소 상태에서는 nav/action 행만 남는 일반 AppBar 높이로 줄어든다 (MD3 Medium/Large App Bar 스크롤 동작 패턴).
2. **페이지 제목 표시** — `appBarInfo` 토픽으로 수신한 `{ title, subtitle }`을 큰 제목 영역과 collapsed 상태의 작은 제목 영역에 모두 렌더 (FieldRenderMixin).
3. **외부 스크롤 컨테이너 자동 추적** — 페이지가 `attachScroll(scrollEl, options?)`로 외부 스크롤 컨테이너를 지정하면 컴포넌트가 직접 scroll listener를 부착하고 threshold를 기준으로 collapsed/expanded를 토글한다.
4. **명령형 API (expand / collapse)** — 페이지가 스크롤과 무관하게 강제로 상태 전환할 수 있도록 `expand()` / `collapse()` 메서드를 노출. 둘 다 멱등.
5. **상태 변경 이벤트 발행** — 상태가 실제로 바뀐 시점에만 `@appBarCollapsed` / `@appBarExpanded` 발행 (디바운스/플리커 방지). 페이지가 다른 컴포넌트(예: FAB 표시 토글, breadcrumb 노출)와 동기화하는 데 사용.
6. **네비게이션 트리거** — nav-icon 클릭 시 `@navigationClicked` 발행 (Standard와 동일한 라우팅 슬롯).

> **Standard와의 분리 정당성**:
> - **외부 자원(scroll element) 부착** — Standard에는 없는 명령형 API(`attachScroll`)와 라이프사이클(scroll listener add/remove)이 추가된다.
> - **내부 상태(`isCollapsed`)** — Standard는 stateless. 이 변형은 자체 상태와 transition class 토글을 관리.
> - **새 이벤트 2종** — `@appBarCollapsed` / `@appBarExpanded` 가 추가되어 다른 컴포넌트와의 시각 동기화를 가능하게 한다.
> - **새 cssSelectors KEY** — `bar` 루트 외에 `headline` (확장 상태 큰 제목), `subtitle` (확장 상태 보조 텍스트)이 추가.
>
> 위 4축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **MD3 근거**: Medium/Large Top App Bar — 스크롤에 따라 headline 행이 축소되어 일반 AppBar 형태로 변형되는 표준 패턴. small 형태에는 없다.

---

## 구현 명세

### Mixin

FieldRenderMixin + 커스텀 메서드(`attachScroll`, `expand`, `collapse`, `_handleScroll`)

> ListRenderMixin/ShadowPopupMixin은 사용하지 않는다 — 제목/서브타이틀은 1:N 매핑이며 배열 데이터/팝업 없음.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| bar | `.top-app-bar` | 루트 — `data-collapsed` 토글 대상 (FieldRender의 datasetAttrs) |
| navIcon | `.top-app-bar__nav-icon` | 네비게이션 아이콘 — 클릭 이벤트 위임 |
| action | `.top-app-bar__action` | 액션 버튼 — 클릭 이벤트 위임 |
| title | `.top-app-bar__title` | collapsed 상태에서 표시되는 작은 제목 (compact row) |
| headline | `.top-app-bar__headline` | expanded 상태의 큰 제목 텍스트 |
| subtitle | `.top-app-bar__subtitle` | expanded 상태의 보조 텍스트 (옵션, 데이터 없으면 비어있음) |

### datasetAttrs

| KEY | 속성 |
|-----|------|
| — | (없음) |

> `bar` 요소의 `data-collapsed="true"|"false"`는 컴포넌트 내부 `_setCollapsed()`가 `barEl.dataset.collapsed = String(next)`로 직접 갱신한다 (외부 발행 데이터가 아니므로 datasetAttrs 매핑은 두지 않는다). CSS는 `.top-app-bar[data-collapsed="true"]` 셀렉터로 두 상태를 분기한다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| appBarInfo | `this.fieldRender.renderData` |

페이로드 예시:
```json
{ "response": { "title": "Settings", "headline": "Settings", "subtitle": "Network · Security · Power" } }
```

> `title`과 `headline`이 같은 텍스트인 경우가 일반적이지만, 페이지가 collapsed에서는 짧은 텍스트(예: "Settings")를 보여주고 expanded에서는 더 풍부한 문구(예: "All Settings")를 보여주고 싶을 수 있어 KEY를 분리했다.

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 | payload |
|--------|------------------|------|---------|
| click | `navIcon` | `@navigationClicked` | — |
| click | `action` | `@actionClicked` | — |

### 자체 발행 이벤트 (Wkit.emitEvent)

| 이벤트 | 발행 시점 | 비고 |
|--------|----------|------|
| `@appBarCollapsed` | scroll/명령으로 expanded → collapsed 전환된 시점 1회 | Weventbus 핸들러 payload는 `{ targetInstance }` (Wkit.emitEvent 표준) — `targetInstance._lastSource`로 `'scroll' \| 'command'` 구분 가능 |
| `@appBarExpanded` | scroll/명령으로 collapsed → expanded 전환된 시점 1회 | 동상 |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `attachScroll(scrollEl, options?)` | `(HTMLElement, { threshold?: number = 48 })` | 외부 스크롤 컨테이너에 scroll listener 부착. 호출 시점에 즉시 현재 scrollTop 평가. 기존 listener가 있으면 detach 후 재부착. |
| `detachScroll()` | `()` | 부착된 scroll listener 제거 (멱등). |
| `expand()` | `()` | 강제 expand. 이미 expanded면 no-op. |
| `collapse()` | `()` | 강제 collapse. 이미 collapsed면 no-op. |
| `_setCollapsed(next, source)` | `(boolean, 'scroll'\|'command')` | 내부 — 상태가 실제로 바뀔 때만 dataset.collapsed 갱신 + 이벤트 발행. |
| `_handleScroll()` | `()` | 내부 — `_scrollEl.scrollTop`을 `_threshold`와 비교해 `_setCollapsed` 호출. |

### 자체 상태 (인스턴스 속성)

| 속성 | 타입 | 설명 |
|------|------|------|
| `_scrollEl` | `HTMLElement \| null` | 부착된 외부 스크롤 컨테이너 |
| `_scrollHandler` | `Function \| null` | bind된 스크롤 핸들러 (remove 시 같은 참조 필요) |
| `_threshold` | `number` | collapsed 전환 임계 scrollTop (기본 48px) |
| `_isCollapsed` | `boolean` | 현재 상태 |
| `_lastSource` | `'scroll' \| 'command' \| undefined` | 마지막 상태 전환을 유발한 출처 (이벤트 핸들러에서 `targetInstance._lastSource`로 조회) |

### 페이지 연결 사례

```
[페이지 onLoad]
   │
   ├─ this.pageDataMappings = [{ topic: 'appBarInfo', datasetInfo: {...} }]
   │   → fetchAndPublish → AppBar.fieldRender.renderData (제목/서브타이틀 렌더)
   │
   ├─ const scrollEl = document.querySelector('.page-scroll-area');
   │  appBarInstance.attachScroll(scrollEl, { threshold: 64 });
   │   → AppBar가 직접 scroll listener를 부착하고 자동으로 collapsed 토글
   │
   └─ Wkit.onEventBusHandlers({
        '@appBarCollapsed': () => fab.show(),    // 다른 컴포넌트와 시각 동기화
        '@appBarExpanded':  () => fab.hide(),
        '@navigationClicked': () => drawer.open()
      });

[페이지 unload / 컴포넌트 destroy]
   beforeDestroy.js → this.detachScroll() 자동 호출
```

> **명령형 API 호출의 정당성**: 외부 DOM(스크롤 컨테이너)이 컴포넌트의 책임 영역 밖에 있으므로, 페이지가 명시적으로 attach/detach 시점을 결정해야 한다. 이는 `ShadowPopupMixin.show/hide`와 동일한 명령형 API 패턴이다 (구독으로 자동화 불가).

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 팔레트, 그라디언트 깊이, 다크, Pretendard, Large(128→56) |
| 02_material | B: Material Elevated | 블루 팔레트, shadow elevation, 라이트, Roboto, Medium(112→64) |
| 03_editorial | C: Minimal Editorial | 웜 그레이, 세리프 헤드라인, 라이트, 넓은 여백, Large(144→72) |
| 04_operational | D: Dark Operational | 시안 팔레트, 모노스페이스, 다크, 컴팩트(96→48), 상태 펄스 유지 |
