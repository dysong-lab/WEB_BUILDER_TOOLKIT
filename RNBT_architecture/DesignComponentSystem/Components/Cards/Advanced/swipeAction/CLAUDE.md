# Cards — Advanced / swipeAction

## 기능 정의

1. **카드 본문 렌더링** — `cardInfo` 토픽으로 수신한 단일 객체 데이터(`id?`, `icon`, `title`, `summary`)를 카드 본문 영역에 렌더(FieldRenderMixin). `id`는 `_cardId`로 보관되어 발행 payload의 `cardId`로 사용된다.
2. **포인터 스와이프로 숨겨진 액션 영역 노출** — 카드(`.card-swipe__face`)에 pointerdown → pointermove로 누적 dx를 추적하고 `transform: translate3d(_offsetX, 0, 0)`을 즉시 갱신한다. 좌측 스와이프(dx < 0)는 우측 액션 영역(`.card-swipe__actions--right`)을, 우측 스와이프(dx > 0)는 좌측 액션 영역(`.card-swipe__actions--left`)을 노출한다. 스와이프 동안 카드 face는 사용자 손가락을 따라가며, 뒤에 absolute positioned된 액션 영역이 점진 노출된다.
3. **임계값 기반 release 결정** — pointerup 시점에 `|dx| >= _revealThreshold`(80px)이면 액션 영역을 고정 노출 위치(`±_revealedOffset`, 액션 영역 너비)에 snap하고 `_revealedSide = 'left' | 'right'`로 표식. 임계 미만이면 0으로 spring back(transition으로 0으로 복귀). cancel은 항상 spring back.
4. **액션 버튼 클릭 → 액션 이벤트 발행 + 자동 close** — 노출된 액션 영역의 액션 버튼(`.card-swipe__action`) 클릭 시 `@swipeActionClicked` 발행. payload: `{ targetInstance, actionId, cardId }`. 발행 직후 카드 face를 0으로 복귀시켜 액션 영역 닫음(`_revealedSide=null`).
5. **카드 자체 짧은 탭 → 카드 클릭 이벤트 발행** — 임계 미만 이동 + release(스와이프 인정 X)이면 `@cardClicked` 발행. payload: `{ targetInstance, cardId }`. 단, `_revealedSide`가 노출 상태(non-null)이고 face 짧은 탭이면 close만 수행하고 click은 발행하지 않는다(노출 상태 해제 우선). 드래그 인정된 사이클의 native click은 capture phase에서 차단(`stopImmediatePropagation` + `preventDefault`)되어 의도치 않은 액션 발화를 방지.
6. **외부 강제 close (선택 토픽)** — `closeSwipe` 토픽 publish 시 강제로 `_revealedSide=null` + offset 0으로 복귀. 페이지가 다른 카드 스와이프 노출 시 단일 노출을 강제하거나(한 카드만 열림), 라우트 변경 시 일괄 close 가능.

> **Standard와의 분리 정당성**:
> - **새 cssSelectors KEY** — `face` (스와이프 대상 카드 표면 — `transform` 갱신), `actionsLeft` / `actionsRight` (좌/우 액션 영역 컨테이너), `action` (액션 버튼 — 클릭 위임). Standard의 `card`/`actions`는 단일 평면이지만 swipeAction은 face + 좌/우 absolute 영역의 3층.
> - **자체 상태 6종** — `_offsetX`, `_startX`, `_revealedSide`, `_isPointerDown`, `_isDraggingDetected`, `_cardId`. Standard는 stateless.
> - **자체 메서드 8종** — `_handlePointerDown` / `_handlePointerMove` / `_handlePointerUp` / `_handlePointerCancel` / `_handleClickCapture` / `_applyOffset` / `_settle` / `_close` + `_renderCardInfo` + `_handleExternalClose`. Standard는 자체 메서드 0종.
> - **새 이벤트 1종 + 의미 변경** — `@swipeActionClicked`(payload `{actionId, cardId}`) 신규. `@cardClicked`는 짧은 탭일 때만 발행되어 의미 분리. Standard의 `@cardActionClicked`는 사용 안함(swipeAction은 `@swipeActionClicked`로 대체).
> - **새 구독 토픽** — `closeSwipe`(외부 강제 close용). Standard에는 없음.
> - **포인터 4종 + click capture native 리스너** — `pointerdown`/`pointermove`/`pointerup`/`pointercancel`의 4종 + capture phase click 차단. Standard는 `bindEvents` 단일 click 위임만.
>
> 위 5축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**: `Buttons/ExtendedFABs/Advanced/draggable` (pointer 4종 + 임계 거리 + transform translate3d + 조건부 click capture 차단), `Cards/Advanced/expandable` (Cards 본체 컨벤션 + cardInfo + cardId fallback + 외부 강제 토픽).

> **expandable / sortable / selectable과의 분리 정당성 (직교성)**:
> - **단위 차이** — expandable은 단일 카드의 펼침/접힘(boolean 상태, `cardInfo` 단일 객체). sortable/selectable은 N개 카드 그룹의 순서/선택(`cardsList` 배열). swipeAction은 단일 카드의 횡 변위(continuous offset px) + 노출 측면(left/right/null) — 데이터 단위는 expandable과 같은 단일 객체이지만 **상호작용 도메인이 다름** (확장 vs 횡 노출).
> - **상호작용 차이** — expandable은 click 토글, sortable은 HTML5 DnD, selectable은 click + Set 토글, swipeAction은 pointer 4종 + 누적 dx + transform 갱신. Native event 자체와 상태 표현이 다름.
> - **이벤트 의미 차이** — expandable은 표시 상태(접힘/펼침), sortable은 순서, selectable은 선택 집합, swipeAction은 측면 액션 의도(어느 쪽 숨겨진 액션을 호출할지). 직교 책임.
> - **dataset 채널 차이** — expandable은 `data-expanded`, sortable은 `data-drag-state`+`data-drag-target`, selectable은 `data-selected`+`aria-selected`, swipeAction은 `data-revealed-side="none|left|right"` + `data-swiping="true|false"`. 시각 채널이 모두 다름.
>
> 그러나 2D Advanced 변형은 단일 컴포넌트 단위로 register.js가 1개. 한 카드가 "펼침" + "스와이프 액션" + "선택" + "순서 재배치"를 동시에 강제하면 register.js 다중 충돌(상태/이벤트/native event handler 중복) — 별 변형으로 분리. 두 책임이 동시에 필요한 경우는 별도 합성 변형(향후) 또는 페이지 레벨에서 두 컴포넌트를 결합.

> **MD3 / 도메인 근거**: MD3는 모바일 카드 패턴에서 swipe-to-reveal-actions(스와이프하여 숨겨진 액션 노출)를 명시 제공하지는 않지만, **Material 모바일 패턴(Gmail / iOS Mail / Google Tasks / Slack 채널 리스트)**의 대표 인터랙션이며, 카드 우측 swipe → archive/delete, 좌측 swipe → mark as read/share 같은 일관된 의미론이 widely adopted된다. 데스크톱 환경에서도 mouse pointer로 동일 인터랙션이 가능하며 본 변형은 PointerEvents 표준(mouse + touch + pen 동시 호환)으로 구현. 키보드/스크린리더 호환은 별도 a11y 변형(향후) — 본 변형은 mouse/touch pointer 기반 swipe-to-reveal의 표준 구현.

---

## 구현 명세

### Mixin

FieldRenderMixin (카드 본문 1:1 필드 매핑) + 커스텀 메서드(`_handlePointerDown` / `_handlePointerMove` / `_handlePointerUp` / `_handlePointerCancel` / `_handleClickCapture` / `_applyOffset` / `_settle` / `_close` / `_renderCardInfo` / `_handleExternalClose`).

> 액션 버튼은 1~3개로 고정이므로 HTML에 직접 작성한다(ListRenderMixin 미사용). 본 변형의 핵심은 swipe 인터랙션이고 액션 리스트 동적 렌더는 아님 — Standard / Advanced/selectable과 책임이 다름.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| card | `.card-swipe` | 카드 루트 — `data-revealed-side="none\|left\|right"` + `data-swiping="true\|false"` 토글 대상, pointer/click 리스너 부착 위임 부모 |
| face | `.card-swipe__face` | 스와이프 대상 표면 — `transform: translate3d(...)` 갱신 + face 영역 클릭이 카드 클릭 이벤트 |
| icon | `.card-swipe__icon` | 미디어 아이콘 (선택적, FieldRender) |
| title | `.card-swipe__title` | 헤드라인(제목) 텍스트 (FieldRender) |
| summary | `.card-swipe__summary` | 요약 텍스트 (FieldRender) |
| actionsLeft | `.card-swipe__actions--left` | 좌측 액션 영역(우측으로 스와이프 시 노출) — absolute positioned 카드 뒤 |
| actionsRight | `.card-swipe__actions--right` | 우측 액션 영역(좌측으로 스와이프 시 노출) — absolute positioned 카드 뒤 |
| action | `.card-swipe__action` | 개별 액션 버튼 — `data-actionid` 식별 + 클릭 위임 |

### datasetAttrs

| KEY | data-* | 용도 |
|-----|--------|------|
| revealedSide | `revealed-side` | `data-revealed-side="none\|left\|right"`. 인스턴스 메서드(`_settle` / `_close`)가 직접 갱신. |
| swiping | `swiping` | `data-swiping="true\|false"`. pointermove 진행 중 true → CSS가 transition을 무효화(즉시 추종), pointerup/cancel 시 false → spring back transition 활성화. |

> FieldRender datasetAttrs에는 등록하지 않음 — 외부 데이터가 아니라 내부 인터랙션 상태이므로 컴포넌트 자체가 직접 dataset 갱신.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_revealThreshold` | number | 스와이프 인정 임계 거리(고정 80px). 이 미만 dx + release = spring back, 이상 = snap to revealed offset. |
| `_dragThreshold` | number | 드래그 인정 임계 거리(고정 5px). 이 미만 dx 이동 + release = 짧은 탭(click 통과 / face 클릭 시 `@cardClicked` 발행). |
| `_offsetX` | number | 현재 face의 누적 translateX(px). 초기 0. |
| `_startX` | number | pointerdown 시점의 client X (move의 dx 기준). |
| `_originX` | number | pointerdown 시점의 `_offsetX` 스냅샷. |
| `_revealedSide` | `'left' \| 'right' \| null` | 현재 노출된 액션 영역 측면. null = 닫힘. |
| `_revealedOffsetLeft` | number | 좌측 액션 영역 폭(px). snap 시 `_offsetX = +_revealedOffsetLeft`. 초기에는 0이며 `_handlePointerDown`에서 측정. |
| `_revealedOffsetRight` | number | 우측 액션 영역 폭(px). snap 시 `_offsetX = -_revealedOffsetRight`. 초기에는 0이며 `_handlePointerDown`에서 측정. |
| `_isPointerDown` | boolean | down→up 사이의 활성 상태. 중복 down 차단 + move 처리 게이트. |
| `_isDraggingDetected` | boolean | 임계(5px) 도달 후 true. true면 click capture에서 차단. |
| `_cardId` | string \| null | `cardInfo.id`로 수신된 식별자. 없으면 `this.id` fallback. |
| `_faceEl` / `_actionsLeftEl` / `_actionsRightEl` | Element \| null | querySelector 캐시(매 move마다 반복 회피). |
| `_pointerDownHandler` / `_pointerMoveHandler` / `_pointerUpHandler` / `_pointerCancelHandler` / `_clickCaptureHandler` | function \| null | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `cardInfo` | `this._renderCardInfo` | `{ id?, icon, title, summary }` 수신 → `_cardId` 보관 + `fieldRender.renderData` 위임 |
| `closeSwipe` | `this._handleExternalClose` | payload 무관(있어도 무시) — 강제 close. 다른 카드가 열릴 때 페이지가 일괄 close 시 사용. |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `action` (fieldRender.cssSelectors) | 액션 버튼 클릭 | (Wkit.bindEvents 표준 — `@swipeActionClicked` 발화 후 페이지가 `event.target.closest('.card-swipe__action')?.dataset.actionid`로 actionId 추출 + targetInstance에서 cardId 추출) |

> Wkit.bindEvents의 표준 payload는 `{ targetInstance, event }`이다. actionId / cardId는 페이지가 event/targetInstance에서 추출(직접 emit 패턴 X). 이 방식은 Cards/Standard `@cardActionClicked`와 동일 컨벤션.

### 자체 발행 이벤트 (Wkit.emitEvent / Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@cardClicked` | face 짧은 탭(임계 미만 + `_revealedSide==null`) 시 1회 | `{ targetInstance, cardId }` |

> 액션 클릭은 customEvents의 `@swipeActionClicked`가 처리한다(payload는 Wkit 표준 `{targetInstance, event}`).

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderCardInfo({ response })` | `({response}) => void` | `cardInfo` 수신 핸들러 — `id`를 `_cardId`에 보관 + fieldRender.renderData 위임 |
| `_handleExternalClose()` | `() => void` | `closeSwipe` 토픽 수신 핸들러 — `_close()` 호출 |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | mouse면 좌클릭만(button=0). face 또는 액션 영역 외부면 무시(액션 버튼 클릭은 자체 처리). querySelector 캐시 + setPointerCapture + 액션 영역 폭 측정. `_startX = clientX`, `_originX = _offsetX`, `_isPointerDown=true`, `_isDraggingDetected=false`, `dataset.swiping="false"`(임계 미달). |
| `_handlePointerMove(e)` | `(PointerEvent) => void` | `_isPointerDown=false`면 무시. dx = clientX - startX. `\|dx\| >= _dragThreshold` 도달 시 `_isDraggingDetected=true` + `dataset.swiping="true"`. `_offsetX = _originX + dx`로 갱신 + `_applyOffset()`. 좌/우 한계는 snap 시점에 적용(드래그 중 stretch 약간 허용). |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | `_isPointerDown=false` + `dataset.swiping="false"`(transition 활성화). `_isDraggingDetected=false`이면 짧은 탭 — face 클릭이고 `_revealedSide==null`이면 `@cardClicked` 발행, 그 외 close. `_isDraggingDetected=true`이면 `_settle()` 호출 후 click capture에서 click 차단. |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | `_isPointerDown=false` + `dataset.swiping="false"`. 드래그 중이었으면 spring back(`_close`) — cancel은 의도된 release가 아니므로 항상 close. |
| `_handleClickCapture(e)` | `(Event) => void` | `_isDraggingDetected=true`면 `stopImmediatePropagation` + `preventDefault` + `_isDraggingDetected=false`. false면 그대로 통과 → bindEvents가 액션 click 처리. |
| `_applyOffset()` | `() => void` | `_faceEl.style.transform = 'translate3d(' + _offsetX + 'px, 0, 0)'`. |
| `_settle()` | `() => void` | release 시점 결정. `_offsetX <= -_revealThreshold` → snap to `-_revealedOffsetRight`(우측 액션 노출), `_offsetX >= +_revealThreshold` → snap to `+_revealedOffsetLeft`(좌측 액션 노출), 그 외 → `_close()`. snap 시 `dataset.revealed-side` 갱신. |
| `_close()` | `() => void` | `_offsetX=0` + `_applyOffset()` + `_revealedSide=null` + `dataset.revealed-side="none"`. |

### 페이지 연결 사례

```
[페이지 onLoad]
   │
   ├─ this.pageDataMappings = [{ topic: 'cardInfo', datasetInfo: {...} }]
   │   → fetchAndPublish → SwipeCard.fieldRender.renderData (제목/요약 렌더)
   │
   └─ Wkit.onEventBusHandlers({
        '@cardClicked':         ({ cardId }) => router.push(`/cards/${cardId}`),
        '@swipeActionClicked':  ({ event, targetInstance }) => {
            const actionId = event.target.closest('.card-swipe__action')?.dataset.actionid;
            const cardId   = targetInstance._cardId ?? targetInstance.id;
            // archive / delete / share / pin 등 actionId별 분기
        }
      });

[사용자 좌측 스와이프] → face translateX 음수 → 우측 액션 노출(archive/delete) → release
   ├─ |dx| >= 80 → snap, _revealedSide='right', 액션 노출 유지
   └─ |dx| < 80  → spring back to 0

[액션 버튼 클릭] → @swipeActionClicked 발행 → close

[다른 카드 스와이프 시 단일 노출 강제 (선택)]
   페이지가 instance.subscriptions.closeSwipe.forEach(h => h.call(instance, { response: {} }))
   → 모든 swipeCard 인스턴스가 close

[짧은 탭(스와이프 안 됨, 닫힌 상태)] → @cardClicked 발행
[짧은 탭(열린 상태)] → 단순 close (click 미발행)
```

### 디자인 변형

| 파일 | 페르소나 | swipe 시각 차별화 | 액션 영역 시각 |
|------|---------|---------------------|---------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 face / 부드러운 spring back(280ms cubic-bezier 1.4 over) / dragging 시 face elevation 미세 강화 | 좌: 보라 surface tint(`#3D2E9C` archive 톤), 우: 핑크 perma 강조(`#5A2E63` delete 톤) |
| `02_material`    | B: Material Elevated | 라이트 블루 elevation / 표준 ease-out(220ms) / dragging 시 box-shadow level 4 → 5 상승 | 좌: tonal blue surface tint(`#E0E5FF` archive), 우: 머티리얼 red surface(`#FFEBEE` + `#D32F2F` 아이콘 — delete) |
| `03_editorial`   | C: Minimal Editorial | 웜 크림 outlined / 차분한 ease-out(320ms) / dragging 시 outline 두께 1 → 2px / 우측 vertical rule(액션 구분선) | 좌: 크림 베이지(`#F0E9D8`) / 우: 미드 그레이(`#D8D3CB`) — 차분한 동일 톤이지만 vertical rule로 구분 |
| `04_operational` | D: Dark Operational  | 다크 시안 outline / instant snap(80ms) / dragging 시 시안 ring border 강화 | 좌: 노랑 surface(`#3A2F0E` archive 강조 색 대비), 우: 빨강 surface(`#3E1418` delete 강조 색 대비) — 운영 페르소나의 색상 대비 의미론 |

각 페르소나는 `[data-revealed-side="left|right|none"]` + `[data-swiping="true|false"]` 셀렉터로 face transform transition / 액션 영역 가시성 / dragging 시각을 동시에 분기한다.
