# BottomSheets — Advanced / snapPoints

## 기능 정의

1. **시트 헤더 렌더링 (Standard 호환)** — `bottomSheetInfo` 토픽으로 수신한 단일 객체(`headline`/`supporting`)를 시트 상단 헤더 영역에 렌더 (FieldRenderMixin, `_popupScope`).
2. **시트 액션 버튼 렌더링 (Standard 호환)** — `bottomSheetActions` 토픽으로 수신한 배열(`actionid`/`actionLabel`/`actionIcon`)을 template 반복으로 시트 하단 액션 영역에 렌더 (ListRenderMixin, `_popupScope`).
3. **시트 표시/숨김 + 라이프사이클 이벤트** — ShadowPopupMixin으로 Shadow DOM 기반 모달 Bottom Sheet 관리. `setSheetOpen` 토픽 또는 `show()`/`hide()` 호출 시 `@bottomSheetOpened` / `@bottomSheetClosed` 발행. `hide()` 시점에 시트 height 인라인 스타일 + 현재 snap index 리셋(다음 open 시 기본 snap으로 복귀).
4. **상단 핸들 드래그로 height 자유 갱신 (drag 진행 중)** — Shadow DOM 내부 `.bottom-sheet__drag-handle-area`에서 pointerdown 시작 → pointermove로 `surface.style.height` 즉시 갱신 (transition 끔). 위로 드래그(dy < 0) = height 증가, 아래로 드래그(dy > 0) = height 감소. setPointerCapture로 핸들 밖 추적.
5. **drag 종료 시 snap 자동 결정 (핵심 차별)** — pointerup/cancel 시점에 _snapPoints(viewport 비율 배열, 기본 `[0.5, 0.75, 1.0]`) 중 가장 가까운 지점으로 자동 이동. velocity (마지막 move의 dy/dt) > 임계값(`_velocityThreshold`, 기본 500 px/s)이면 **방향에 따라 다음/이전 snap point로 jump**. 그렇지 않으면 가장 가까운 snap.
6. **CSS transition 자연스러운 snap** — drag 종료 후 `requestAnimationFrame` 한 번 후 `data-dragging="false"`로 전환 → CSS transition 활성화 → height 갱신으로 자연스럽게 snap point에 안착(280ms ease-out).
7. **외부 명령형 snap 제어** — `setSnapIndex` 토픽 publish (`{ snapIndex }`) 또는 `setSnapIndex(index)` 호출로 강제 snap 이동. 같은 transition 적용.
8. **동적 snap points 변경 (선택)** — `setSnapPoints` 토픽 publish (`{ snapPoints: number[] }`) 또는 `setSnapPoints(arr)` 호출로 비율 배열 갱신.
9. **dragging 상태 시각 차별** — `surface` 요소에 `data-dragging="true|false"`를 부착해 CSS가 페르소나별로 idle/dragging 2상태를 차별화. dragging 중에는 `transition: none`(즉각 반응), idle에서는 `transition: height 280ms ease-out`(snap 애니메이션 활성화).
10. **드래그 라이프사이클 + snap 이벤트** — pointerdown 시점 `@dragHeightStart` `{ height }` 1회. pointerup/cancel 시점 `@dragHeightEnd` `{ height }` 1회. snap 결정 직후 `@snapChanged` `{ snapIndex, snapValue, height }` 1회 발행.
11. **액션 버튼 / 닫기 이벤트 (Standard 호환)** — Shadow DOM 내부 `.bottom-sheet__action` 클릭 시 `@bottomSheetActionClicked`, `.bottom-sheet__scrim` 클릭 시 `@bottomSheetClose` 트리거.

> **Standard / draggableHeight와의 분리 정당성**:
> - **Standard** 대비: `Standard`는 stateless / 고정 height의 modal sheet — drag 기능 없음. snapPoints는 drag + snap 결정 + velocity 기반 분기 필요.
> - **draggableHeight** 대비: `draggableHeight`는 자유 height(drag 종료 시점의 height 그대로 유지) + min/max clamp만 한다. snapPoints는 **drag 종료 시점에 미리 정의된 snap 지점 중 하나로 자동 이동** + **velocity 기반 다음/이전 snap jump** + **CSS transition으로 자연스러운 snap** + 별도 이벤트(`@snapChanged`) + 별도 토픽(`setSnapIndex`/`setSnapPoints`)을 갖는다. drag 진행 중 동작은 같지만 **drag 종료 시 행동이 본질적으로 다르다** → 동일 register.js로 표현 불가.
> - **자체 상태 14종** (draggableHeight의 9종 + snap 5종): `_isOpen` / `_snapPoints` / `_currentSnapIndex` / `_velocityThreshold` / `_lastMoveTs` / `_lastMoveY` / `_startY` / `_originH` / `_isPointerDown` / `_pointerId` / `_surfaceEl` / `_handleEl` / pointer handler 4종 참조.
> - **새 이벤트 1종 추가**: `@snapChanged` (snap index/value/height payload).
> - **새 구독 토픽 2종 추가**: `setSnapIndex` (외부 강제 snap) + `setSnapPoints` (동적 snap 배열 변경).
> - **자체 메서드 추가**: `_decideSnapIndex` (현재 height + velocity → 다음 snap index 결정), `_applySnapAnimated` (transition 활성 + height 갱신 + `@snapChanged` 발행), `setSnapIndex` (외부 명령형), `setSnapPoints` (동적 변경), `_handleSnapIndexTopic`, `_handleSnapPointsTopic`.
>
> **참조 패턴**:
> - `Sheets/BottomSheets/Advanced/draggableHeight` — Shadow DOM 내부 pointer 4종 + setPointerCapture + show/hide wrapper. 본 변형은 동일 라이프사이클 패턴 + drag 종료 시점에 snap 결정 추가.

> **MD3 / 도메인 근거**: MD3는 bottom sheet의 **collapsed/half/expanded** 3상태 전환을 제시한다. 본 변형은 그 전환 지점을 **사용자 정의 비율(`snapPoints: [0.5, 0.75, 1.0]`)**로 일반화하고, drag 종료 시 자동으로 가장 가까운 지점으로 안착시켜 사용자가 "딱 맞는 위치"를 신경쓰지 않도록 한다. iOS 13+ Modal sheet (medium/large), Apple Maps Look Around (peek/half/full), Google Maps directions detail에서 표준화된 패턴.

---

## 구현 명세

### Mixin

ShadowPopupMixin + FieldRenderMixin (`_popupScope`) + ListRenderMixin (`_popupScope`) + 커스텀 메서드 다수

> Mixin 조합은 Standard / draggableHeight와 동일하다. snapPoints 변형의 분리는 mixin 추가가 아니라 **drag 종료 시 snap 결정 로직 + velocity 추적 + CSS transition 토글 + 새 이벤트/토픽**으로 이루어진다. 신규 Mixin 생성 없음.

### cssSelectors

#### ShadowPopupMixin (`this.shadowPopup`) — 팝업 + drag/snap 토글 대상

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#bottom-sheet-popup-template` | 팝업 HTML/CSS가 담긴 template (규약) |
| surface | `.bottom-sheet__surface` | **drag/snap 적용 대상** — `data-dragging` + `data-snap-index` + `style.height` 갱신 |
| handle | `.bottom-sheet__drag-handle-area` | **드래그 트리거 영역** — pointerdown 시작점 |
| scrim | `.bottom-sheet__scrim` | 배경 오버레이 — 닫기 트리거 |

#### FieldRenderMixin (`this._popupScope.fieldRender`) — 시트 헤더

| KEY | VALUE | 용도 |
|-----|-------|------|
| headline | `.bottom-sheet__headline` | 시트 제목 |
| supporting | `.bottom-sheet__supporting` | 시트 보조 설명 |

#### ListRenderMixin (`this._popupScope.listRender`) — 시트 액션

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.bottom-sheet__actions` | 항목이 추가될 부모 (규약) |
| template | `#bottom-sheet-action-template` | cloneNode 대상 (규약) |
| actionid | `.bottom-sheet__action` | 항목 식별 + 이벤트 매핑 |
| actionLabel | `.bottom-sheet__action-label` | 액션 라벨 |
| actionIcon | `.bottom-sheet__action-icon` | 액션 아이콘 (선택적) |

### itemKey

actionid (ListRenderMixin)

### datasetAttrs

| Mixin | KEY | VALUE |
|-------|-----|-------|
| ListRenderMixin | actionid | actionid |

> `surface` 요소의 `data-dragging="true|false"` + `data-snap-index="0|1|2"`는 컴포넌트 내부 메서드가 직접 갱신한다. CSS는 `[data-dragging="true"]`로 transition off, `[data-dragging="false"]`로 transition 활성화한다.

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_isOpen` | `boolean` | `false` | 시트 표시 여부 |
| `_snapPoints` | `number[]` | `[0.5, 0.75, 1.0]` | viewport height 대비 비율 배열 (오름차순) |
| `_currentSnapIndex` | `number` | `0` | 현재 snap point index (`_snapPoints[i]`) |
| `_velocityThreshold` | `number` | `500` | velocity jump 임계값 (px/s) |
| `_lastMoveTs` | `number` | `0` | 마지막 pointermove 타임스탬프 (velocity 계산용) |
| `_lastMoveY` | `number` | `0` | 마지막 pointermove clientY (velocity 계산용) |
| `_startY` | `number` | `0` | pointerdown 시점의 client Y (dy 기준) |
| `_originH` | `number` | `0` | pointerdown 시점의 surface height 스냅샷 |
| `_isPointerDown` | `boolean` | `false` | down→up 사이의 활성 상태 |
| `_pointerId` | `number \| null` | `null` | setPointerCapture/release용 |
| `_surfaceEl` | `Element \| null` | `null` | onCreated에서 cache. height/data-* 갱신 대상 |
| `_handleEl` | `Element \| null` | `null` | onCreated에서 cache. pointerdown 부착 대상 |
| `_pointerDownHandler` / `_pointerMoveHandler` / `_pointerUpHandler` / `_pointerCancelHandler` | `Function \| null` | `null` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `bottomSheetInfo` | `this._renderBottomSheetInfo` | Standard 호환 |
| `bottomSheetActions` | `this._renderBottomSheetActions` | Standard 호환 |
| `setSheetOpen` | `this._handleOpenTopic` | `{ open: boolean }` 수신 → `show()` / `hide()` |
| `setSnapIndex` | `this._handleSnapIndexTopic` | `{ snapIndex: number }` 수신 → `setSnapIndex(index)` (애니메이션 적용) |
| `setSnapPoints` | `this._handleSnapPointsTopic` | `{ snapPoints: number[] }` 수신 → `setSnapPoints(arr)` (동적 변경) |

### 이벤트 (customEvents — Shadow DOM 내부, bindPopupEvents)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| click | `scrim` (shadowPopup.cssSelectors) | `@bottomSheetClose` |
| click | `.bottom-sheet__action` (직접 셀렉터 — Shadow DOM 내부) | `@bottomSheetActionClicked` |

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@bottomSheetOpened` | closed → open 전환된 시점 1회 | `{ targetInstance }` |
| `@bottomSheetClosed` | open → closed 전환된 시점 1회 | `{ targetInstance }` |
| `@dragHeightStart` | pointerdown 시점 1회 (drag 시작) | `{ targetInstance, height }` |
| `@dragHeightEnd` | pointerup/cancel 시점 1회 (drag 종료) | `{ targetInstance, height }` |
| `@snapChanged` | snap 결정/적용 직후 1회 (drag 종료 + 외부 setSnapIndex) | `{ targetInstance, snapIndex, snapValue, height }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderBottomSheetInfo({ response })` | `({response}) => void` | Standard 호환 핸들러 |
| `_renderBottomSheetActions({ response })` | `({response}) => void` | Standard 호환 핸들러 |
| `_resolveSnapHeights()` | `() => number[]` | 현재 viewport height × `_snapPoints` 비율 → 픽셀 배열 |
| `_decideSnapIndex(currentH, velocityY)` | `(number, number) => number` | velocity 임계값 초과 시 방향에 따라 다음/이전 index, 아니면 가장 가까운 index 반환 |
| `_applySnapAnimated(index)` | `(number) => void` | `data-dragging="false"` (transition 활성) + height = `_resolveSnapHeights()[index]` + `data-snap-index` + `@snapChanged` 발행 |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | mouse는 좌클릭만. setPointerCapture. surface rect 스냅샷 + `_isPointerDown=true` + `data-dragging="true"` + `_lastMoveTs/Y` 초기화 + `@dragHeightStart` 발행 |
| `_handlePointerMove(e)` | `(PointerEvent) => void` | dy 계산 → `_originH - dy` → surface.style.height 즉시 갱신 (transition off 상태) + `_lastMoveTs/Y` 갱신 (velocity 계산용) |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | velocity 계산 → `_decideSnapIndex` → `requestAnimationFrame` 후 `_applySnapAnimated` → `@dragHeightEnd` 발행 |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | pointerup과 동일 처리 (snap 적용) |
| `setSnapIndex(index)` | `(number) => void` | 외부 명령형 API. clamp 후 `_applySnapAnimated`로 애니메이션 + `@snapChanged` 발행 |
| `setSnapPoints(arr)` | `(number[]) => void` | snap 배열 동적 변경. 비율 정렬 + clamp(0~1). currentIndex 재정렬 |
| `_handleOpenTopic({ response })` | `({response}) => void` | `setSheetOpen` 토픽 수신 → `show()` / `hide()` |
| `_handleSnapIndexTopic({ response })` | `({response}) => void` | `setSnapIndex` 토픽 수신 → `setSnapIndex(...)` |
| `_handleSnapPointsTopic({ response })` | `({response}) => void` | `setSnapPoints` 토픽 수신 → `setSnapPoints(...)` |
| `show()` (오버라이드) | `() => void` | `shadowPopup.show()` 호출 + 기본 snap(첫 index) 적용 + `_isOpen` 갱신 + `@bottomSheetOpened` 발행 |
| `hide()` (오버라이드) | `() => void` | `shadowPopup.hide()` 호출 + height 인라인 리셋 + `_currentSnapIndex` 리셋 + `_isOpen` 갱신 + `@bottomSheetClosed` 발행 |

> **show/hide 오버라이드의 정당성**: draggableHeight와 동일 — 라이프사이클 이벤트 발행을 단일 진입점으로 모으고, snapPoints는 추가로 open 시점에 기본 snap height를 적용해야 하므로 wrapper가 필수.

> **drag 트리거 분리**: pointer 핸들러는 `_handleEl`(`.bottom-sheet__drag-handle-area`)에만 부착되어 있으므로 본문/액션 버튼은 트리거 대상이 아니다.

### 페이지 연결 사례

```
[페이지 onLoad]
   │
   ├─ this.pageDataMappings = [
   │     { topic: 'bottomSheetInfo',    datasetInfo: {...} },
   │     { topic: 'bottomSheetActions', datasetInfo: {...} }
   │  ];
   │
   ├─ // 외부 트리거로 시트 열기
   │  document.querySelector('#open').addEventListener('click', () => {
   │     sheetInstance.show();
   │  });
   │
   ├─ // 강제 snap 이동 (예: "Expand" 버튼)
   │  document.querySelector('#expand').addEventListener('click', () => {
   │     sheetInstance._handleSnapIndexTopic({ response: { snapIndex: 2 } });
   │  });
   │
   └─ Wkit.onEventBusHandlers({
        '@bottomSheetOpened':       () => state.lockBackdrop(),
        '@bottomSheetClosed':       () => state.unlockBackdrop(),
        '@dragHeightStart':         ({ height }) => analytics.track('sheet_drag_start', { height }),
        '@dragHeightEnd':           ({ height }) => analytics.track('sheet_drag_end',   { height }),
        '@snapChanged':             ({ snapIndex, snapValue, height }) => {
            localStorage.setItem('sheetSnapIndex', JSON.stringify({ index: snapIndex }));
            // peek/half/full 단계에 따라 본문 콘텐츠 밀도 조절 (선택)
        },
        '@bottomSheetActionClicked': ({ event }) => { /* actionid 분기 */ },
        '@bottomSheetClose':         ({ targetInstance }) => targetInstance.hide()
      });
```

### 디자인 변형

| 파일 | 페르소나 | snap 시각 차별 + 도메인 컨텍스트 |
|------|---------|----------------------------------|
| `01_refined` | A: Refined Technical | 다크 퍼플 tonal — handle은 cursor: ns-resize, dragging 시 surface 그림자 강화(퍼플 글로우), `data-snap-index="2"` (full)에서 상단 라운드 약화. **도메인**: 운영 분석 콘솔 detail sheet — peek(50% — KPI 1줄) / half(75% — 차트 + 알람) / full(100% — 전체 상세 + 로그 타임라인) 3단계. |
| `02_material` | B: Material Elevated | 라이트 elevation — dragging 시 box-shadow elevation level 4→5 강화 + cursor: grabbing, snap 결정 시 spring-like ease-out. **도메인**: 음악 player "Now Playing" — mini(50% — 곡 정보 + 재생 컨트롤) / expanded(75% — 가사 + 큐) / full(100% — 가사 풀스크린) 3단계. |
| `03_editorial` | C: Minimal Editorial | 웜 그레이 헤어라인 — dragging 시 미세 grey shadow + 헤어라인 강화, snap 시 240ms cubic-bezier로 부드러운 안착. **도메인**: 지도 위 장소 detail sheet — peek(50% — 이름 + 평점) / half(75% — 주소 + 사진 + 리뷰) / full(100% — 전체 정보 + 메뉴 리스트). |
| `04_operational` | D: Dark Operational | 다크 시안 컴팩트 — dragging 시 cyan border glow, snap 시 빠른 120ms linear로 즉각 반응. **도메인**: 관제 alert 필터 sheet — collapsed(50% — 필터 카운트 요약) / half(75% — 카테고리 필터) / full(100% — 전체 필터 + 검색). |

각 페르소나는 `[data-dragging="false"] { transition: height ... ease-out }` + `[data-dragging="true"] { transition: none }`을 핵심 차별 축으로 한다. drag 중에는 즉각, drag 종료 후 snap 적용 시점에 transition이 자연스러운 안착을 만든다.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 6단계 (`Components/Sheets/BottomSheets/Advanced/snapPoints/preview/...html` → ../를 6번)
