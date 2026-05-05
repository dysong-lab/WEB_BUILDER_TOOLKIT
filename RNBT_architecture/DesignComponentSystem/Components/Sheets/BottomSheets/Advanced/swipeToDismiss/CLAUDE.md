# BottomSheets — Advanced / swipeToDismiss

## 기능 정의

1. **시트 헤더 렌더링 (Standard 호환)** — `bottomSheetInfo` 토픽으로 수신한 단일 객체(`headline`/`supporting`)를 시트 상단 헤더 영역에 렌더 (FieldRenderMixin, `_popupScope`).
2. **시트 액션 버튼 렌더링 (Standard 호환)** — `bottomSheetActions` 토픽으로 수신한 배열(`actionid`/`actionLabel`/`actionIcon`)을 template 반복으로 시트 하단 액션 영역에 렌더 (ListRenderMixin, `_popupScope`).
3. **시트 표시/숨김 + 라이프사이클 이벤트** — ShadowPopupMixin으로 Shadow DOM 기반 모달 Bottom Sheet 관리. `setSheetOpen` 토픽 또는 `show()`/`hide()` 호출 시 `@bottomSheetOpened` / `@bottomSheetClosed` 발행. `hide()` 시점에 transform 인라인 리셋(다음 open 시 기본 위치로 복귀).
4. **상단 핸들에서 아래로 스와이프 추적 (drag 진행 중)** — Shadow DOM 내부 `.bottom-sheet__drag-handle-area`에서 pointerdown 시작 → pointermove로 dy(아래로 양수) 추적. 위로 드래그(dy<0)는 0으로 클램프(dismiss 변형은 위로 끌기 의미 없음). 아래로 드래그 시 `surface.style.transform = translate3d(0, dy, 0)`로 시트 본체가 손가락을 따라옴 (transition off). setPointerCapture로 핸들 밖 추적.
5. **dismiss 임계 분기 (5/80px 거리 + 500px/s velocity 이중 임계, 핵심 차별)** — pointerup/cancel 시점에:
   - **|dy| < 5px (drag 미인정)** — 짧은 탭. 시트 본체 transform 0 복귀, dismiss 안 함.
   - **dy ≥ 80px (거리 임계 초과)** OR **velocity ≥ 500 px/s (속도 임계 초과)** + 아래로 방향 — dismiss 트리거. `@swipeDismissed` `{ targetInstance, distance, velocity }` 1회 발행 후 `hide()` 호출(slide-out + fade-out 애니메이션 포함).
   - **5px ≤ dy < 80px + velocity < 500 px/s** — 임계 미달 → 원위치 복귀(transform 0, transition 활성).
6. **CSS transition 자연스러운 복귀/dismiss** — drag 종료 시 `data-swiping="false"`로 transition 활성화 → transform 0(원위치) 또는 `data-dismissing="true"`로 slide-out 애니메이션(transform translateY(100%) + opacity 0). dismiss 애니메이션 종료 후(280ms) hide() 호출.
7. **swipeDirection 옵션 (`down` 고정)** — BottomSheet은 자연스럽게 아래로 스와이프 → dismiss. `_swipeDirection: 'down'` (고정 — 위로 스와이프는 의미 없음). 향후 확장 여지로 옵션 신설하지 않음(YAGNI).
8. **drag 진행 이벤트 (선택, UI 보조)** — drag 인정 첫 진입 시 `@swipeProgressStart` `{ distance: 0 }` 1회. drag 인정 사이클의 매 move마다 `@swipeProgress` `{ distance, ratio: distance/dismissDistanceThreshold }` (throttle 없음, 라이트). 페이지가 backdrop opacity / scrim fade 등의 부수 효과를 적용하는 데 사용. 미사용 시 무해.
9. **액션 버튼 / 닫기 이벤트 (Standard 호환)** — Shadow DOM 내부 `.bottom-sheet__action` 클릭 시 `@bottomSheetActionClicked`, `.bottom-sheet__scrim` 클릭 시 `@bottomSheetClose` 트리거.
10. **swipe 인정 사이클의 click 합성 차단** — handle 영역에서 5px 이상 drag 인정 사이클이 끝났을 때 native click이 합성되는 것을 방지하기 위해 capture phase에서 `_handleClickCapture`로 `stopImmediatePropagation`+`preventDefault`. drag 미인정(짧은 탭)은 통과.

> **Standard / draggableHeight / snapPoints와의 분리 정당성**:
> - **Standard** 대비: drag 기능 자체가 추가 (Standard는 stateless 고정 height). dismiss 트리거 임계값 + velocity 결정 로직 + `@swipeDismissed` 이벤트.
> - **draggableHeight** 대비: draggableHeight는 **drag로 height 자유 조절** + min/max clamp만 한다. swipeToDismiss는 **drag로 sheet 본체 transform translateY** + **dismiss 임계 분기 + slide-out 애니메이션 + `@swipeDismissed` 발행 + hide() 자동 호출**. drag 진행 방식이 다르고(height vs translateY) drag 종료 시 결과가 본질적으로 다르다(자유 height 유지 vs dismiss 또는 원위치).
> - **snapPoints** 대비: snapPoints는 **drag로 height 갱신 + 종료 시 미리 정의된 snap 지점 중 하나로 자동 이동** + `@snapChanged` 발행. swipeToDismiss는 **drag로 transform translateY + 종료 시 dismiss 또는 원위치** — snap 지점 개념 자체가 없고 결과가 binary(dismiss/keep). drag 시점 변환 대상도 다름(height vs transform).
> - **자체 상태 14종**: `_isOpen` / `_swipeDirection` (고정 'down') / `_dismissDistanceThreshold`(80) / `_dismissVelocityThreshold`(500) / `_dragThreshold`(5) / `_isDraggingDetected` / `_isDismissing` / `_lastMoveTs` / `_lastMoveY` / `_startY` / `_isPointerDown` / `_pointerId` / `_surfaceEl` / `_handleEl` / pointer/click handler 5종 참조.
> - **새 이벤트 3종 추가**: `@swipeDismissed` (dismiss 시점 distance + velocity payload) / `@swipeProgressStart` (drag 인정 첫 진입) / `@swipeProgress` (매 move).
> - **자체 메서드 추가**: `_decideDismiss` (현재 dy + velocity → dismiss 여부 결정), `_applyDismissAnimated` (transform translateY(100%) + opacity 0 + transition end → hide() 호출), `_springBack` (transform 0 + transition 활성), `_handleClickCapture` (drag 인정 cycle의 click 합성 차단), pointer 4종 + 외부 명령형 없음(dismiss는 항상 swipe 또는 hide()로 트리거).
>
> **참조 패턴**:
> - `Sheets/BottomSheets/Advanced/snapPoints` — Shadow DOM 내부 pointer 4종 + setPointerCapture + show/hide wrapper + velocity 계산. 본 변형은 동일 라이프사이클/velocity 패턴 + drag 종료 시 dismiss 결정으로 변환.
> - `Sheets/BottomSheets/Advanced/draggableHeight` — handle 영역 분리 + Shadow DOM pointer 부착. 본 변형은 동일.
> - `Lists/Advanced/swipeToDelete` — 5/120px 이중 임계 + click capture 합성 차단 + animate-out → 데이터 제거 + emit 패턴. 본 변형은 5/80px(dismiss는 더 보수적이지 않아도 됨, "닫기"는 deletes처럼 부정 결과는 아님) + velocity 보강 + animate-out → hide() 호출.

> **MD3 / 도메인 근거**: MD3 Bottom sheet anatomy에서 **drag handle**은 닫기 트리거의 표준 affordance다. 모바일 친화 인터랙션(iOS Sheet swipe down to dismiss / Android Modal Bottom Sheet swipe down)에서 표준화된 패턴이며, 핸들 위에 손가락을 두고 빠르게 아래로 끌면(velocity 임계 초과) 거리 미달이어도 즉시 dismiss, 천천히 끌어 80px 이상 가면 거리 임계로 dismiss. 실사용: **모바일 알림 시트**(notification dismissal), **이미지 detail viewer**(swipe down to close), **Now Playing**(곡 재생 화면 dismiss), **shopping cart preview**(드로워 닫기). PointerEvents 표준으로 데스크톱(mouse drag)에서도 동일하게 작동.

---

## 구현 명세

### Mixin

ShadowPopupMixin + FieldRenderMixin (`_popupScope`) + ListRenderMixin (`_popupScope`) + 커스텀 메서드 다수

> Mixin 조합은 Standard / draggableHeight / snapPoints와 동일하다. swipeToDismiss 변형의 분리는 mixin 추가가 아니라 **drag 종료 시 dismiss 결정 로직 + velocity 추적 + slide-out 애니메이션 + 새 이벤트(`@swipeDismissed`) + click capture 합성 차단**으로 이루어진다. 신규 Mixin 생성 없음(SKILL 회귀 규율).

### cssSelectors

#### ShadowPopupMixin (`this.shadowPopup`) — 팝업 + drag/dismiss 토글 대상

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#bottom-sheet-popup-template` | 팝업 HTML/CSS가 담긴 template (규약) |
| surface | `.bottom-sheet__surface` | **drag/dismiss 적용 대상** — `data-swiping` + `data-dismissing` + `style.transform` 갱신 |
| handle | `.bottom-sheet__drag-handle-area` | **드래그 트리거 영역** — pointerdown 시작점 + click capture 부착 대상 |
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

> `surface` 요소의 `data-swiping="true|false"` + `data-dismissing="true|false"`는 컴포넌트 내부 메서드가 직접 갱신한다. CSS는 `[data-swiping="true"]`로 transition off, `[data-swiping="false"]`로 transform 복귀 transition 활성화, `[data-dismissing="true"]`로 slide-out + fade-out 애니메이션을 정의한다.

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_isOpen` | `boolean` | `false` | 시트 표시 여부 |
| `_swipeDirection` | `'down'` | `'down'` | 허용 swipe 방향. 고정값(BottomSheet은 down만 의미가 있음) |
| `_dismissDistanceThreshold` | `number` | `80` | dismiss 거리 임계값(px) |
| `_dismissVelocityThreshold` | `number` | `500` | dismiss velocity 임계값(px/s) |
| `_dragThreshold` | `number` | `5` | drag 인정 임계 거리(px) |
| `_isDraggingDetected` | `boolean` | `false` | 5px 도달 후 true. true면 click capture에서 차단 |
| `_isDismissing` | `boolean` | `false` | dismiss 애니메이션 진행 중 (재진입 차단) |
| `_lastMoveTs` | `number` | `0` | 마지막 pointermove 타임스탬프 (velocity 계산용) |
| `_lastMoveY` | `number` | `0` | 마지막 pointermove clientY (velocity 계산용) |
| `_startY` | `number` | `0` | pointerdown 시점의 client Y (dy 기준) |
| `_isPointerDown` | `boolean` | `false` | down→up 사이의 활성 상태 |
| `_pointerId` | `number \| null` | `null` | setPointerCapture/release용 |
| `_surfaceEl` | `Element \| null` | `null` | onCreated에서 cache. transform/data-* 갱신 대상 |
| `_handleEl` | `Element \| null` | `null` | onCreated에서 cache. pointerdown + click capture 부착 대상 |
| `_pointerDownHandler` / `_pointerMoveHandler` / `_pointerUpHandler` / `_pointerCancelHandler` / `_clickCaptureHandler` | `Function \| null` | `null` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `bottomSheetInfo` | `this._renderBottomSheetInfo` | Standard 호환 |
| `bottomSheetActions` | `this._renderBottomSheetActions` | Standard 호환 |
| `setSheetOpen` | `this._handleOpenTopic` | `{ open: boolean }` 수신 → `show()` / `hide()` |

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
| `@swipeProgressStart` | drag 인정 첫 진입(5px 도달) 1회 | `{ targetInstance }` |
| `@swipeProgress` | drag 인정 사이클의 매 move | `{ targetInstance, distance, ratio }` (`ratio = distance / _dismissDistanceThreshold`, clamp [0,1]) |
| `@swipeDismissed` | dismiss 결정 직후 1회 (hide() 호출 직전) | `{ targetInstance, distance, velocity }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderBottomSheetInfo({ response })` | `({response}) => void` | Standard 호환 핸들러 |
| `_renderBottomSheetActions({ response })` | `({response}) => void` | Standard 호환 핸들러 |
| `_decideDismiss(dy, velocityY)` | `(number, number) => boolean` | dy ≥ _dismissDistanceThreshold OR velocityY ≥ _dismissVelocityThreshold → true (단, velocity는 아래 방향(양수)일 때만) |
| `_applyDismissAnimated(distance, velocity)` | `(number, number) => void` | `data-dismissing="true"` + `@swipeDismissed` 발행 → 280ms 후 `hide()` 호출 + reset |
| `_springBack()` | `() => void` | `data-swiping="false"` (transition 활성) + transform 0 → drag state 정리 |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | mouse는 좌클릭만. setPointerCapture. surface rect 스냅샷 + `_isPointerDown=true` + `_lastMoveTs/Y` 초기화 + `data-swiping="false"` |
| `_handlePointerMove(e)` | `(PointerEvent) => void` | dy 계산. dy<0이면 0으로 클램프(위로 끌기 무의미). 5px 도달 시 `data-swiping="true"` + `@swipeProgressStart`. 매 move에서 `surface.style.transform = translate3d(0, dy, 0)` + `@swipeProgress` |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | velocity 계산 → `_decideDismiss` → true면 `_applyDismissAnimated`, false면 `_springBack` |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | 항상 `_springBack` (cancel은 의도된 release 아님) |
| `_handleClickCapture(e)` | `(Event) => void` | `_isDraggingDetected=true`면 `stopImmediatePropagation` + `preventDefault` + reset. false면 통과 |
| `_handleOpenTopic({ response })` | `({response}) => void` | `setSheetOpen` 토픽 수신 → `show()` / `hide()` |
| `show()` (오버라이드) | `() => void` | `shadowPopup.show()` 호출 + transform 인라인 리셋 + `_isOpen` 갱신 + `@bottomSheetOpened` 발행 |
| `hide()` (오버라이드) | `() => void` | `shadowPopup.hide()` 호출 + transform 인라인 리셋 + dismissing 리셋 + `_isOpen` 갱신 + `@bottomSheetClosed` 발행 |

> **show/hide 오버라이드의 정당성**: snapPoints / draggableHeight와 동일 — 라이프사이클 이벤트 발행을 단일 진입점으로 모으고, 다음 open 시 transform 리셋 + dismissing 상태 클린업이 필요.

> **drag 트리거 분리**: pointer/click capture 핸들러는 `_handleEl`(`.bottom-sheet__drag-handle-area`)에만 부착되어 있으므로 본문/액션 버튼은 트리거 대상이 아니다. 본문에서 swipe down하면 dismiss되지 않는다(의도적 — 본문 스크롤과 충돌 방지).

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
   └─ Wkit.onEventBusHandlers({
        '@bottomSheetOpened':       () => state.lockBackdrop(),
        '@bottomSheetClosed':       () => state.unlockBackdrop(),
        '@swipeProgressStart':      () => analytics.track('sheet_swipe_start'),
        '@swipeProgress':           ({ ratio }) => backdropEl.style.opacity = String(0.6 - ratio * 0.4),
        '@swipeDismissed':          ({ distance, velocity }) => analytics.track('sheet_dismissed', { distance, velocity }),
        '@bottomSheetActionClicked': ({ event }) => { /* actionid 분기 */ },
        '@bottomSheetClose':         ({ targetInstance }) => targetInstance.hide()
      });
```

### 디자인 변형

| 파일 | 페르소나 | swipe / dismiss 시각 차별 + 도메인 컨텍스트 |
|------|---------|-------------------------------------------|
| `01_refined` | A: Refined Technical | 다크 퍼플 tonal — handle은 cursor: grab, swiping 시 surface 그림자 강화(퍼플 글로우), dismiss 시 320ms cubic-bezier로 부드러운 slide-out + fade-out. **도메인**: 운영 분석 콘솔 알림 detail sheet — 알림 내용 확인 후 핸들을 빠르게 아래로 swipe → dismiss. |
| `02_material` | B: Material Elevated | 라이트 elevation — swiping 시 box-shadow level 4→5 강화 + cursor: grabbing, dismiss 시 240ms ease-in으로 표준 sheet dismiss. **도메인**: 음악 player "Now Playing" detail — 가사/큐 확인 후 핸들 swipe down → mini player로 minimize. |
| `03_editorial` | C: Minimal Editorial | 웜 그레이 헤어라인 — swiping 시 미세 grey shadow + 헤어라인 강화, dismiss 시 320ms cubic-bezier(0.4, 0, 0.2, 1)로 차분한 slide. **도메인**: 지도 위 장소 detail sheet — 장소 정보 확인 후 swipe down → 지도 전체 화면 복귀. |
| `04_operational` | D: Dark Operational | 다크 시안 컴팩트 — swiping 시 cyan border glow, dismiss 시 빠른 160ms linear로 즉각 닫힘(관제 시야 우선). **도메인**: 관제 alert detail — 알람 처리 완료 후 핸들 swipe down → 즉각 dismiss하여 다음 알람으로. |

각 페르소나는 `[data-swiping="true"] { transition: none }` + `[data-swiping="false"] { transition: transform 240ms ease-out }` + `[data-dismissing="true"] { transform: translateY(100%); opacity: 0; transition: transform Xms, opacity Xms }`을 핵심 차별 축으로 한다. swipe 중에는 즉각 추종, drag 종료 후 임계 미달 시 transition으로 원위치, dismiss 결정 시 별도 slide-out + fade-out 애니메이션으로 자연스러운 종료를 만든다.

### 결정사항

- **swipeDirection 'down' 고정**: BottomSheet은 자연스럽게 아래쪽이 닫는 방향이므로 옵션화하지 않음(YAGNI). `_swipeDirection: 'down'` 상수.
- **거리 + velocity 이중 임계**: 거리(80px)와 velocity(500 px/s) 어느 한쪽만 만족해도 dismiss. 사용자가 핸들을 빠르게 살짝 끌면 거리는 짧아도 dismiss 가능, 천천히 끌어 80px 이상 가면 dismiss. 양쪽 모두 미달일 때만 원위치 복귀.
- **swipeToDelete의 80px vs 120px**: swipeToDelete는 120px(부정 결과 — 데이터 손실)이지만 swipeToDismiss는 80px(닫기는 복구 쉬움 — 다시 열면 됨)으로 더 관대하다.
- **위로 끌기는 클램프**: dy<0일 때 transform 0으로 고정(위로 끌어도 시각 변화 없음). draggableHeight/snapPoints처럼 height를 늘리는 의미가 없다(dismiss 변형은 닫기 전용).
- **dismiss 애니메이션은 transform translateY(100%) + opacity 0**: surface 자체가 화면 아래로 사라지는 자연스러운 애니메이션. transition end 후 `hide()` 호출하여 ShadowPopupMixin이 DOM 제거.
- **신규 Mixin 생성 금지**: ShadowPopupMixin + 자체 메서드 조합으로 완결. swipe 패턴(Cards/swipeAction, Lists/swipeToDelete, BottomSheets/swipeToDismiss)이 3회 반복 — 향후 일반화 후보로 SKILL 보강 메모(반환에 명시).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 6단계 (`Components/Sheets/BottomSheets/Advanced/swipeToDismiss/preview/...html` → ../를 6번)
