# SideSheets — Advanced / resizable

## 기능 정의

1. **시트 헤더 렌더링 (Standard 호환)** — `sideSheetInfo` 토픽으로 수신한 단일 객체(`headline`/`supporting`)를 시트 상단 헤더 영역에 렌더 (FieldRenderMixin, `_popupScope`).
2. **시트 액션 버튼 렌더링 (Standard 호환)** — `sideSheetActions` 토픽으로 수신한 배열(`actionid`/`actionLabel`/`actionIcon`)을 template 반복으로 시트 하단 액션 영역에 렌더 (ListRenderMixin, `_popupScope`).
3. **시트 표시/숨김 + 라이프사이클 이벤트** — ShadowPopupMixin으로 Shadow DOM 기반 모달 Side Sheet 관리. `setSheetOpen` 토픽 또는 `show()`/`hide()` 호출 시 `@sideSheetOpened` / `@sideSheetClosed` 발행. `hide()` 시점에 인라인 width를 리셋(다음 open 시 기본 너비로 복귀).
4. **모서리 핸들 드래그로 너비 조절 (핵심 차별)** — Shadow DOM 내부 `.side-sheet__resize-handle`에서 pointerdown 시작 → pointermove로 dx 추적 → `surface.style.width` 갱신. side='right'(기본): 핸들이 sheet의 좌측 가장자리에 위치, dx<0(왼쪽 드래그)일수록 width 증가. side='left': 핸들이 sheet의 우측 가장자리에 위치, dx>0일수록 width 증가. 본문/액션/헤더/닫기는 resize 트리거가 아니다.
5. **min/max 제약 (viewport 기반 clamp)** — `_minWidth`(기본 280), `_maxWidth`(기본 viewport `innerWidth - margin*2`) 안에 클램프. setPointerCapture로 outside drag 추적.
6. **resize 상태 시각 차별** — `surface` 요소에 `data-resizing="true|false"`를 부착해 CSS가 페르소나별로 idle/resizing 2상태(handle 강조 색, surface 그림자, transition off, user-select: none)를 차별화. handle 자체는 항상 `cursor: ew-resize`.
7. **resize 라이프사이클 이벤트** — pointerdown 시점에 `@sheetResizeStart` `{ width }` 1회 발행, pointerup/cancel 시점에 `@sheetResizeEnd` `{ width }` 1회 발행. 이동 중(pointermove)은 너무 자주 발화하므로 발행하지 않는다.
8. **외부 명령형 너비 제어** — `setSheetWidth` 토픽 publish (`{ width }`) 또는 `setSheetWidth(width)` 호출로 강제 너비 조절(localStorage 복원, 사용자 preset 적용 등). 같은 clamp 로직 적용. resize 이벤트 발행 없음.
9. **side 옵션** — 인스턴스 상태 `_side: 'left' | 'right'` (기본 `'right'`). HTML view에서 `[data-side="left"|"right"]`로 위치/border-radius/handle 좌우 배치를 분기. JS는 side 값을 읽어 dx 부호를 결정한다(`right`면 width 증가가 dx<0, `left`면 dx>0).
10. **액션 버튼 / 닫기 이벤트 (Standard 호환)** — Shadow DOM 내부 `.side-sheet__action` 클릭 시 `@sideSheetActionClicked`, `.side-sheet__close-btn` / `.side-sheet__scrim` 클릭 시 `@sideSheetClose` 발행 (bindPopupEvents).

> **Standard와의 분리 정당성**:
> - **자체 상태 11종** — `_isOpen` / `_side` / `_minWidth` / `_maxWidth` / `_startX` / `_originW` / `_isPointerDown` / `_pointerId` / `_surfaceEl` / `_handleEl` / pointer 4종 handler 참조. Standard는 stateless.
> - **Shadow DOM 내부 native pointer 리스너 라이프사이클** — Standard에는 없는 pointer 4종을 Shadow DOM의 `_handleEl`(좌측 또는 우측 가장자리 1개)에 직접 부착. `onCreated` 콜백 안에서 부착하고 beforeDestroy에서 명시적으로 detach.
> - **새 이벤트 4종** — `@sideSheetOpened` / `@sideSheetClosed` (라이프사이클) + `@sheetResizeStart` / `@sheetResizeEnd` (resize). Standard는 `@sideSheetClose` / `@sideSheetActionClicked` 2종만.
> - **새 구독 토픽 2종** — `setSheetOpen` (외부 명령형 open/close) + `setSheetWidth` (외부 강제 너비). Standard는 데이터 구독(`sideSheetInfo`/`sideSheetActions`)만.
> - **새 cssSelectors KEY 2종** — `surface` (`data-resizing` 속성 + `width` 갱신 대상) + `resizeHandle` (resize 트리거 영역). Standard에는 없음.
> - **자체 메서드 9종** — `_handlePointerDown` / `_handlePointerMove` / `_handlePointerUp` / `_handlePointerCancel` / `_clampWidth` / `setSheetWidth` / `_handleOpenTopic` / `_handleWidthTopic` + show/hide wrapper 2종 + 데이터 핸들러 래퍼 2종.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**:
> - **Sheets/BottomSheets/Advanced/swipeToDismiss** (직전, 같은 큰 범주, ShadowPopupMixin 동일) — Shadow DOM 내부 native pointer 리스너 4종 라이프사이클 + setPointerCapture + show/hide wrapper + data-* 속성 토글 + 라이프사이클 이벤트 발행. 본 변형은 동일 패턴을 transform 대신 width 직접 갱신 + 단일 handle(좌 또는 우 가장자리)로 응용.
> - **Dialogs/Advanced/resizable** — pointer 4종 + setPointerCapture + clamp + width/height 직접 갱신 + `data-resizing` 속성 + show/hide wrapper. 본 변형은 width만 갱신(SideSheet은 화면 가장자리에 fixed top/bottom 고정으로 height는 화면 전체) + side 옵션으로 좌/우 분기.
>
> **MD3 / 도메인 근거**: MD3 Side sheet는 **secondary content anchored to the side of the screen**으로 정의되며, 데스크톱 작업 환경(MS Outlook reading pane / Slack thread / Notion side panel / Linear issue detail / VSCode side panel)에서 **사용자가 panel의 width를 자유롭게 조절**하는 패턴이 표준화되어 있다. 본문/리스트/diff 폭에 맞춰 panel을 늘리거나, 메인 콘텐츠 영역을 더 크게 보고 싶을 때 panel을 줄인다. resize handle은 panel의 inner edge(메인 콘텐츠 쪽 가장자리)에 두어 ew-resize 커서로 드래그 affordance를 제공한다.

---

## 구현 명세

### Mixin

ShadowPopupMixin + FieldRenderMixin (`_popupScope`) + ListRenderMixin (`_popupScope`) + 커스텀 메서드 9종

> Mixin 조합은 Standard와 동일하다. Advanced 분리는 mixin 추가가 아니라 **자체 상태 + Shadow DOM 내부 native pointer 리스너 라이프사이클(handle 1개) + width 직접 갱신 + 추가 이벤트/토픽 + side 옵션 분기** 으로 이루어진다. 신규 Mixin 생성 없음(기존 mixin + 자체 메서드 조합).

### cssSelectors

#### ShadowPopupMixin (`this.shadowPopup`) — 팝업 + resize 토글 대상

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#side-sheet-popup-template` | 팝업 HTML/CSS가 담긴 template (규약) |
| surface | `.side-sheet__surface` | **resize width 적용 대상** — `data-resizing` + `style.width` 갱신 |
| resizeHandle | `.side-sheet__resize-handle` | **resize 트리거 영역** — pointerdown 시작점 |
| closeBtn | `.side-sheet__close-btn` | 닫기 버튼 — Shadow DOM 내부 이벤트 |
| scrim | `.side-sheet__scrim` | 배경 오버레이 — 닫기 트리거 |

#### FieldRenderMixin (`this._popupScope.fieldRender`) — 시트 헤더

| KEY | VALUE | 용도 |
|-----|-------|------|
| headline | `.side-sheet__headline` | 시트 제목 |
| supporting | `.side-sheet__supporting` | 시트 보조 설명 |

#### ListRenderMixin (`this._popupScope.listRender`) — 시트 액션

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.side-sheet__actions` | 항목이 추가될 부모 (규약) |
| template | `#side-sheet-action-template` | cloneNode 대상 (규약) |
| actionid | `.side-sheet__action` | 항목 식별 + 이벤트 매핑 |
| actionLabel | `.side-sheet__action-label` | 액션 라벨 |
| actionIcon | `.side-sheet__action-icon` | 액션 아이콘 (선택적) |

### itemKey

actionid (ListRenderMixin)

### datasetAttrs

| Mixin | KEY | VALUE |
|-------|-----|-------|
| ListRenderMixin | actionid | actionid |

> `surface` 요소의 `data-resizing="true|false"`는 컴포넌트 내부 `_handlePointerDown`/`_handlePointerUp`이 직접 갱신한다. CSS는 `.side-sheet__surface[data-resizing="true"]`로 transition off + 그림자 강화 등을 분기.

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_isOpen` | `boolean` | `false` | 시트 표시 여부 |
| `_side` | `'right' \| 'left'` | `'right'` | sheet 앵커 위치. dx 부호 결정에 사용. HTML `[data-side]`와 일치 |
| `_minWidth` | `number` | `280` | 최소 width(px) |
| `_maxWidth` | `number \| null` | `null` | 최대 width(px). `null`이면 viewport 기준 자동(`innerWidth - margin*2`) |
| `_startX` | `number` | `0` | pointerdown 시점의 client X (dx 기준) |
| `_originW` | `number` | `0` | pointerdown 시점의 surface width 스냅샷 |
| `_isPointerDown` | `boolean` | `false` | down→up 사이의 활성 상태. 중복 down 차단 + move 처리 게이트 |
| `_pointerId` | `number \| null` | `null` | setPointerCapture/release용 |
| `_surfaceEl` | `Element \| null` | `null` | onCreated에서 cache. width/data-resizing 갱신 대상 |
| `_handleEl` | `Element \| null` | `null` | onCreated에서 cache. pointerdown 부착 대상 |
| `_pointerDownHandler` / `_pointerMoveHandler` / `_pointerUpHandler` / `_pointerCancelHandler` | `Function \| null` | `null` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `sideSheetInfo` | `this._renderSideSheetInfo` | Standard 호환. `_popupScope.fieldRender.renderData` 위임 |
| `sideSheetActions` | `this._renderSideSheetActions` | Standard 호환. `_popupScope.listRender.renderData` 위임 |
| `setSheetOpen` | `this._handleOpenTopic` | `{ open: boolean }` 수신 → `show()` / `hide()` |
| `setSheetWidth` | `this._handleWidthTopic` | `{ width: number }` 수신 → `setSheetWidth(width)` |

### 이벤트 (customEvents — Shadow DOM 내부, bindPopupEvents)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| click | `closeBtn` (shadowPopup.cssSelectors) | `@sideSheetClose` |
| click | `scrim` (shadowPopup.cssSelectors) | `@sideSheetClose` |
| click | `.side-sheet__action` (직접 셀렉터 — Shadow DOM 내부) | `@sideSheetActionClicked` |

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@sideSheetOpened` | closed → open 전환된 시점 1회 | `{ targetInstance }` |
| `@sideSheetClosed` | open → closed 전환된 시점 1회 | `{ targetInstance }` |
| `@sheetResizeStart` | pointerdown(드래그 시작) 시점 1회 | `{ targetInstance, width }` |
| `@sheetResizeEnd` | pointerup/cancel 시점 1회 | `{ targetInstance, width }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderSideSheetInfo({ response })` | `({response}) => void` | Standard 호환 핸들러. `_popupScope.fieldRender.renderData` 위임 |
| `_renderSideSheetActions({ response })` | `({response}) => void` | Standard 호환 핸들러. `_popupScope.listRender.renderData` 위임 |
| `_clampWidth(w)` | `(number) => number` | min/max 안에 width clamp. `_maxWidth` `null`이면 viewport 기준 자동(`innerWidth - margin*2`, margin 16px) |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | mouse는 좌클릭만. `setPointerCapture`. surface rect 스냅샷 + `_isPointerDown=true` + `data-resizing="true"` + `@sheetResizeStart` 1회 발행 |
| `_handlePointerMove(e)` | `(PointerEvent) => void` | dx 계산 → `_side === 'right'`면 `_originW - dx`, `'left'`면 `_originW + dx` → `_clampWidth` → surface.style.width 갱신 |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | `_isPointerDown=false`. `data-resizing="false"` + `@sheetResizeEnd` 1회 발행. `releasePointerCapture` 시도 |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | pointerup과 동일 처리 |
| `setSheetWidth(width)` | `(number) => void` | 외부 명령형 API. clamp 후 width 갱신. resize 이벤트 발행 없음 |
| `_handleOpenTopic({ response })` | `({response}) => void` | `setSheetOpen` 토픽 수신 → `response.open` 으로 `show()` / `hide()` |
| `_handleWidthTopic({ response })` | `({response}) => void` | `setSheetWidth` 토픽 수신 → `setSheetWidth(response.width)` |
| `show()` (오버라이드) | `() => void` | `shadowPopup.show()` 호출 후 `_isOpen` 갱신 + `@sideSheetOpened` 발행 |
| `hide()` (오버라이드) | `() => void` | `shadowPopup.hide()` 호출 후 `_isOpen` 갱신 + 인라인 width 리셋 + `@sideSheetClosed` 발행 |

> **show/hide 오버라이드의 정당성**: BottomSheets/swipeToDismiss / Dialogs/resizable과 동일 — 라이프사이클 이벤트 발행을 단일 진입점으로 모으기 위해 인스턴스 레벨에서 wrapper를 둔다. `this.shadowPopup.show()`는 그대로 호출(Mixin 메서드 재정의 아님).

> **resize 트리거 분리**: pointerdown 핸들러는 resize handle 자체에만 부착되어 있으므로 본문/헤더/액션 버튼/닫기 버튼은 트리거 대상이 아니다 (closest 분기 불필요).

> **`_side` 결정 시점**: 초기값 `'right'`. HTML view에서 `[data-side="left"]`이면 페이지/통합 레이어에서 인스턴스 옵션으로 수정하는 것이 자연스럽지만, 본 컴포넌트의 4 페르소나 view는 모두 `data-side="right"`로 통일한다(SideSheet은 LTR 표준에서 right anchor가 일반적). left side는 옵션 확장 지점으로만 정의하며 페이지가 인스턴스 등록 후 `_side = 'left'`로 변경한 뒤 view 의 data-side와 함께 left 페르소나로 배치할 수 있다.

### 페이지 연결 사례

```
[페이지 onLoad]
   │
   ├─ this.pageDataMappings = [
   │     { topic: 'sideSheetInfo',    datasetInfo: {...} },
   │     { topic: 'sideSheetActions', datasetInfo: {...} }
   │  ];
   │
   ├─ // 외부 트리거로 시트 열기
   │  document.querySelector('#open').addEventListener('click', () => {
   │     sheetInstance.show();
   │     // 또는 sheetInstance._handleOpenTopic({ response: { open: true } });
   │  });
   │
   ├─ // localStorage 복원 — 사용자가 마지막으로 조절한 너비 적용
   │  const saved = JSON.parse(localStorage.getItem('sideSheetWidth') || '{"width":400}');
   │  sheetInstance._handleWidthTopic({ response: { width: saved.width } });
   │
   └─ Wkit.onEventBusHandlers({
        '@sideSheetOpened':       () => state.lockBackdrop(),
        '@sideSheetClosed':       () => state.unlockBackdrop(),
        '@sheetResizeStart':      ({ width }) => analytics.track('sheet_resize_start', { width }),
        '@sheetResizeEnd':        ({ width }) => localStorage.setItem('sideSheetWidth', JSON.stringify({ width })),
        '@sideSheetActionClicked': ({ event }) => { /* actionid 분기 */ },
        '@sideSheetClose':         ({ targetInstance }) => targetInstance.hide()
      });
```

### 디자인 변형

| 파일 | 페르소나 | resizing 시각 차별 + 도메인 컨텍스트 |
|------|---------|------------------------------------|
| `01_refined` | A: Refined Technical | 다크 퍼플 tonal — handle은 좌측 가장자리에 6px 폭 세로 막대(라벤더), resizing 시 surface 그림자 강화(퍼플 글로우) + handle 컬러 lift + transition off. **도메인**: 운영 분석 콘솔의 alert detail panel — alert metric/log 표가 가로로 길어 우측 panel을 끌어당겨 작업 영역 확보. |
| `02_material` | B: Material Elevated | 라이트 elevation — handle은 6px 폭 + dot 패턴, resizing 시 box-shadow elevation level 4→5 강화 + handle background 강조. **도메인**: 이메일 reading pane (Outlook/Gmail) — 이메일 본문/첨부 폭에 맞춰 reading pane width 조절. |
| `03_editorial` | C: Minimal Editorial | 웜 그레이 헤어라인 — handle은 1px 헤어라인 + 4px hit area (시각적 경량), resizing 시 미세 grey shadow + 헤어라인 컬러 강화. **도메인**: 디자인 툴 inspector panel (Figma/Sketch 우측 panel) — 속성 라벨/값 컬럼 폭에 맞춰 panel 조절. |
| `04_operational` | D: Dark Operational | 다크 시안 컴팩트 — handle은 4px 폭 cyan glow, resizing 시 cyan border glow 강화 + handle bright cyan + 빠른 transition. **도메인**: 관제 dashboard의 device detail panel (모니터링 콘솔) — 장비 metric stream/log 폭에 맞춰 panel 조절, drag 즉시 반응(관제 시야 우선). |

각 페르소나는 surface 좌측 가장자리(`data-side="right"` 기준)에 `.side-sheet__resize-handle`을 절대 배치하고, `cursor: ew-resize` 기본 + `[data-resizing="true"]` 분기로 idle/resizing 2상태를 차별화한다.

### 결정사항

- **side 'right' 고정 (4 view 모두)**: 본 변형의 4 페르소나 view는 모두 `data-side="right"`로 통일한다 (LTR 표준). left side는 인스턴스 옵션(`_side = 'left'`)으로 확장 가능하지만 별도 view를 추가하지 않는다 (한 변형 4개 view는 페르소나 시각 차별 축, side 좌/우 분기 축이 아니다).
- **width만 갱신, height는 100% 고정**: SideSheet은 `top: 0; bottom: 0`로 화면 전체 높이를 차지하므로 height resize는 의미 없다. Dialogs/resizable은 width+height 모두 가능하지만 본 변형은 width 1축 전용.
- **handle 1개**: Dialogs/resizable은 SE/S/E 3개 handle direction 분기지만, SideSheet은 자연스러운 resize 축이 1개(메인 콘텐츠 쪽 가장자리)이므로 단일 handle로 단순화.
- **신규 Mixin 생성 금지**: ShadowPopupMixin + 자체 메서드 조합으로 완결. resize 패턴(Dialogs/resizable, SideSheets/resizable)이 2회 반복 — 향후 일반화 후보로 SKILL 보강 메모(반환에 명시).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 6단계 (`Components/Sheets/SideSheets/Advanced/resizable/preview/...html` → ../를 6번)
