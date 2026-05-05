# Lists — Advanced / swipeToDelete

## 기능 정의

1. **리스트 항목 동적 렌더** — `listItems` 토픽으로 수신한 배열(`[{itemid, leading?, headline, supporting?}]`)을 ListRenderMixin이 `<template>` cloneNode로 N개의 항목으로 렌더한다. 각 항목은 **front layer**(콘텐츠) + **back layer**(좌/우 delete 배경 + 휴지통 아이콘)의 2층 구조. `_currentItems` 자체 상태로 데이터를 캐시하여 삭제 후 재렌더에 사용. Standard와 cssSelectors 호환(itemid/leading/headline/supporting).
2. **포인터 횡 스와이프 추적 + 임계 분기 (5/120px 이중 임계)** — `pointerdown`/`pointermove`/`pointerup`/`pointercancel` 4종을 컨테이너에 위임. `pointerdown` 시점에 `_dragState`(`{ itemId, startX, currentX, direction, pointerId }`) 셋업 + 시작 항목의 `_faceEl.setPointerCapture()`. `pointermove`에서 누적 dx를 추적:
   - **dx 절대값 < 5px**: drag 미인정(click으로 처리되므로 capture 차단 안 함).
   - **5px ≤ dx 절대값 < 120px**: drag 인정 — 항목에 `data-swiping="true"` + face transform `translate3d(dx, 0, 0)` 즉시 적용. 방향(`'left'|'right'`)에 따라 좌측/우측 back layer 노출.
   - **dx 절대값 ≥ 120px (delete threshold)**: 다음 release(pointerup)가 들어오면 즉시 삭제 트리거.
3. **방향 옵션 (`swipeDirection`) — `'left' | 'right' | 'both'`** — 기본 `'both'`. 옵션이 `'left'`이면 좌측 스와이프(dx < 0)만 삭제 트리거, `'right'`이면 우측 스와이프(dx > 0)만 삭제 트리거. `setSwipeDirection` 토픽으로 외부에서 갱신 가능. 허용 방향이 아닌 쪽 스와이프는 transform 적용을 0으로 클램프(시각 피드백 차단).
4. **release 시 결정** — pointerup 시점에 `_isDraggingDetected`가 false(미달 5px 미만)이면 짧은 탭 — `@listItemClicked`는 native click이 자체 발화하므로 이 컴포넌트는 별도 처리 안 함, drag state 정리만 수행. drag 인정된 사이클이면:
   - `|dx| >= _deleteThreshold`(120px) + 허용 방향 → animate-out(120ms transform translate3d ±containerWidth, 0, 0) + 데이터에서 항목 제거(`_currentItems.filter(it => it.itemid !== itemId)`) + ListRender 재렌더 + `@itemSwipeDelete` 발행.
   - 그 외(미달 또는 비허용 방향) → spring back to 0(`_dragState=null`, `data-swiping="false"`, transform 0) — 시각 복귀.
5. **삭제 이벤트 발행 + 클릭 합성 차단** — drag 인정된 사이클의 native click은 capture phase(`_handleClickCapture`)에서 `stopImmediatePropagation` + `preventDefault`로 차단(`@listItemClicked` 합성 발화 방지). 삭제 트리거 시 `Weventbus.emit('@itemSwipeDelete', { targetInstance, itemId, item, deletedAt: ISO, remainingItemIds })`.
6. **분석/UX 이벤트 (선택)** — drag 인정된 첫 move 사이클에서 `@itemSwipeStart` 1회 emit(payload: `{ targetInstance, itemId, direction }`). drag 인정 사이클의 매 move마다(throttle 없음, 라이트하므로) `@itemSwipeProgress` emit(payload: `{ targetInstance, itemId, dx, direction, ratio: dx/threshold }`). 페이지가 분석/UI 미리보기에 사용. 미사용 시 무해.
7. **외부 항목 복원 (`restoreItem` 토픽, 선택)** — `{ itemId, atIndex }` 페이로드 수신 시, 페이지가 보관한 마지막 삭제 데이터를 받아 `_currentItems`의 `atIndex` 위치에 삽입 + ListRender 재렌더. Snackbar/undo 시나리오에서 페이지가 책임 위임. 컴포넌트는 단순 삽입만 수행(중복 itemid는 추가하지 않음).
8. **항목 클릭 호환 (Standard와 동일 이벤트)** — drag 미인정(짧은 탭)인 경우 native click → `@listItemClicked` 발행(bindEvents 위임). drag가 인정된 사이클은 capture phase에서 차단되어 click이 발화하지 않는다.

> **Standard와의 분리 정당성**:
> - **HTML 구조 변경 — front/back 2층** — Standard 항목은 단일 평면(`.list__item` 안에 leading/headline/supporting). swipeToDelete는 `.list-swipedel__item`(루트, 2층 wrapper) 안에 `.list-swipedel__back`(절대 위치, 좌/우 delete 시각) + `.list-swipedel__face`(콘텐츠, transform 갱신). cssSelectors KEY는 Standard 호환(itemid/leading/headline/supporting) + 추가 KEY 4종(face, back, backIconLeft, backIconRight) 신설. 클래스명도 `list-swipedel__*`로 분리(`list__*` / `list-reorder__*` 충돌 방지).
> - **자체 상태 5종** — `_currentItems` (데이터 진실 보관), `_dragState` (`{itemId, startX, currentX, direction, pointerId}` 또는 null), `_isDraggingDetected`, `_swipeDirection` ('left'|'right'|'both'), `_lastDeletedAt` (디버깅/관측용 ISO). Standard는 stateless.
> - **자체 메서드 9종** — `_renderItems` / `_setSwipeDirection` / `_restoreItem` / `_handlePointerDown` / `_handlePointerMove` / `_handlePointerUp` / `_handlePointerCancel` / `_handleClickCapture` / `_applyOffset` / `_finishDelete` / `_springBack` / `_emitSwipeStart` / `_emitSwipeProgress` / `_emitSwipeDelete`. Standard는 자체 메서드 0종.
> - **포인터 4종 + click capture native 리스너** — `pointerdown`/`pointermove`/`pointerup`/`pointercancel` 컨테이너 위임 + capture phase click 차단. Standard는 `bindEvents` 단일 click 위임만.
> - **새 이벤트 3~4종** — `@itemSwipeDelete`(payload: `{itemId, item, deletedAt, remainingItemIds}`), `@itemSwipeStart`/`@itemSwipeProgress`(분석/UX 선택). Standard는 `@listItemClicked` 1종.
> - **새 구독 토픽 2종** — `setSwipeDirection`(외부에서 방향 옵션 갱신), `restoreItem`(외부 undo로 복원). Standard는 `listItems` 1종.
> - **template 변경** — Standard 항목은 `<div class="list__item" data-itemid="">`. swipeToDelete는 `<div class="list-swipedel__item" data-itemid=""><div class="list-swipedel__back ..."><div class="list-swipedel__face">...`로 2층 wrapper.
>
> 위 7축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **Cards/Advanced/swipeAction과의 차이 (1줄 핵심)**: swipeAction은 **스와이프로 숨겨진 액션 버튼 노출 → 사용자가 액션 클릭으로 확정**(release 후 액션 영역 유지 + 액션 버튼 클릭 → `@swipeActionClicked` → 컴포넌트가 close). swipeToDelete는 **스와이프 자체로 즉시 삭제 트리거**(임계값 초과 + release → animate-out + 데이터 제거 + `@itemSwipeDelete`) — 별도 액션 버튼 단계 없음. 두 변형은 같은 pointer 4종 + 5px drag threshold + transform translate3d 패턴을 공유하지만, **release 시 행동(snap to revealed offset vs animate-out + delete)**이 직교. 또한 swipeAction은 Cards 도메인(단일 객체 + `cardInfo` 토픽)이고 swipeToDelete는 Lists 도메인(배열 + `listItems` 토픽).

> **draggableReorder와의 직교성 (1줄 핵심)**: draggableReorder는 항목 **순서 재배치**(HTML5 DnD 5종 + ListRender 재호출 + `_currentOrder` 진실 보관). swipeToDelete는 항목 **삭제**(pointer 4종 + 5/120px 이중 임계 + 데이터 제거 + ListRender 재호출). 동일 `listItems` 데이터 모델을 공유하지만 **상호작용 native event(HTML5 DnD vs PointerEvents)와 결과(순서 변경 vs 항목 제거)가 직교** — 한 컴포넌트가 둘을 동시 수행하면 native event listener 경합(dragstart vs pointerdown), DOM mutation 시점 충돌(ListRender 재렌더가 양쪽에서 동시 발생) → 별 변형으로 분리.

> **MD3 / 도메인 근거**: MD3 자체는 swipe-to-delete를 명시적 컴포넌트로 정의하지 않으나, **Material 모바일 패턴(Gmail / iOS Mail / Android 알림 / Slack 등)**의 표준 인터랙션이며 "list 항목을 좌/우로 스와이프하여 삭제 + Snackbar undo"가 widely adopted. PointerEvents 표준(mouse + touch + pen 동시 호환)으로 데스크톱 환경에서도 동일 동작. 실사용 시나리오: ① **이메일 빠른 삭제**(받은편지함 항목 좌/우 스와이프 → 삭제), ② **할 일 항목 처리**(완료된 작업 큐에서 제거), ③ **알림 무시**(notification dismissal), ④ **운영 알람 처리**(처리 완료된 알람 큐에서 즉시 제거). 키보드/스크린리더 호환 + Snackbar undo UI는 별도 합성 변형(향후) — 본 변형은 mouse/touch pointer 기반 swipe-to-delete + `restoreItem` 외부 토픽으로 undo 책임 위임.

---

## 구현 명세

### Mixin

ListRenderMixin (리스트 항목 배열 렌더) + 자체 메서드(`_renderItems` / `_setSwipeDirection` / `_restoreItem` / `_handlePointerDown` / `_handlePointerMove` / `_handlePointerUp` / `_handlePointerCancel` / `_handleClickCapture` / `_applyOffset` / `_finishDelete` / `_springBack` / `_emitSwipeStart` / `_emitSwipeProgress` / `_emitSwipeDelete`).

> 자체 메서드 14종 + 자체 상태 6종(임계값 2종 + 인터랙션 4종) + bound handler 5종. 신규 Mixin 생성 금지 — ListRenderMixin + 자체 메서드 조합으로 완결(SKILL 회귀 규율).

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group        | `.list-swipedel`              | 그룹 컨테이너 — `role="list"` |
| container    | `.list-swipedel__items`       | 항목이 추가될 부모 (ListRenderMixin 규약) — pointer 4종 + click capture 위임 부착 대상 |
| template     | `#list-swipedel-item-template`| `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| itemid       | `.list-swipedel__item`        | 렌더된 각 row 루트 — `data-swiping="true\|false"` 부착 + native click 매핑 (Standard 호환 KEY) |
| face         | `.list-swipedel__face`        | 콘텐츠 표면 — `transform: translate3d(...)` 갱신, 사용자 손가락 추종 |
| back         | `.list-swipedel__back`        | 절대 위치 back layer — 좌/우 delete 시각(빨강 배경 + 휴지통 아이콘). `data-side="left\|right"` 부착으로 노출 측 분기 |
| backIconLeft | `.list-swipedel__back-icon--left`  | 좌측 휴지통 아이콘(우측 스와이프 시 노출) |
| backIconRight| `.list-swipedel__back-icon--right` | 우측 휴지통 아이콘(좌측 스와이프 시 노출) |
| leading      | `.list-swipedel__leading`     | 선행 요소 (아이콘/이모지 textContent) — Standard 호환 KEY |
| headline     | `.list-swipedel__headline`    | 헤드라인 텍스트 — Standard 호환 KEY |
| supporting   | `.list-swipedel__supporting`  | 보조 텍스트 — Standard 호환 KEY |

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| itemid | `itemid` | 항목 식별 — `event.target.closest(itemid)?.dataset.itemid`로 itemid 추출. ListRender가 `data-itemid`를 항목에 자동 설정. Standard와 동일 KEY. |

### itemKey

`itemid` (ListRender) — `getItemState`/`updateItemState`는 사용하지 않지만 일관성/확장성을 위해 등록.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_dragThreshold` | number | drag 인정 임계 거리(고정 5px). 미만 dx 이동 + release = 짧은 탭(click 통과). |
| `_deleteThreshold` | number | 삭제 트리거 임계 거리(고정 120px). 이상 dx + release = animate-out + 삭제. |
| `_currentItems` | object[] | 현재 렌더된 데이터 캐시 — `[{itemid, leading?, headline, supporting?, ...}]`. 삭제/복원 후 재렌더 진실 보관. |
| `_swipeDirection` | `'left' \| 'right' \| 'both'` | 허용 방향. 기본 `'both'`. `setSwipeDirection` 토픽으로 갱신. |
| `_dragState` | object \| null | `{itemId, startX, currentX, direction: 'left'\|'right', pointerId, faceEl}` 또는 null. pointerdown에서 set, up/cancel/finishDelete에서 null. 한 번에 한 항목만 swipe. |
| `_isDraggingDetected` | boolean | 임계(5px) 도달 후 true. true면 click capture에서 차단. |
| `_lastDeletedAt` | string \| null | 마지막 삭제 ISO timestamp(디버깅/관측용, 페이로드와 동일 값). |
| `_pointerDownHandler` / `_pointerMoveHandler` / `_pointerUpHandler` / `_pointerCancelHandler` / `_clickCaptureHandler` | function \| null | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `listItems` | `this._renderItems` | `[{ itemid, leading?, headline, supporting? }]` — Standard 호환 |
| `setSwipeDirection` | `this._setSwipeDirection` | `'left' \| 'right' \| 'both'` (그 외 값은 무시) |
| `restoreItem` | `this._restoreItem` | `{ itemId, atIndex, item? }` — 외부 undo로 복원. `item`이 있으면 그것을, 없으면 무시. atIndex는 0-based. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `itemid` (ListRender) | 항목 클릭 (drag 미인정 짧은 탭만 native click 발생, drag 인정 사이클은 capture phase에서 차단) | `@listItemClicked` (bindEvents 위임 발행 — Standard 호환). 페이로드 `{ targetInstance, event }`. |

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@itemSwipeStart` | drag 인정 첫 진입(5px 도달 시) 1회 | `{ targetInstance, itemId, direction }` |
| `@itemSwipeProgress` | drag 인정 사이클의 매 move | `{ targetInstance, itemId, dx, direction, ratio }` (`ratio = abs(dx) / _deleteThreshold`, clamp [0,1]) |
| `@itemSwipeDelete` | animate-out 완료 후 1회 | `{ targetInstance, itemId, item, deletedAt: ISO, remainingItemIds }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderItems({ response })` | `({response}) => void` | `listItems` 핸들러. items 배열을 ListRender selectorKEY(itemid/leading/headline/supporting)에 맞게 그대로 전달(Standard 호환). `listRender.renderData` 호출. `_currentItems = items.slice()`로 진실 갱신. `_dragState = null`, `_isDraggingDetected = false`. |
| `_setSwipeDirection({ response })` | `({response}) => void` | `setSwipeDirection` 핸들러. response가 `'left'`/`'right'`/`'both'`이면 `_swipeDirection`에 적용. 그 외 무시. 진행 중인 drag는 그대로(다음 사이클부터 적용). |
| `_restoreItem({ response })` | `({response}) => void` | `restoreItem` 핸들러. `{itemId, atIndex, item}` 수신. `item` 누락 시 무시. 중복 itemid는 추가 X. `_currentItems`의 `atIndex`(범위 보정 0~length) 위치에 삽입 → `listRender.renderData` 재호출. |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | mouse면 좌클릭(0)만. 진행 중 drag(`_dragState != null`) 있으면 무시. `e.target.closest(itemid)`로 시작 항목 찾음. 없으면 무시. face 영역 안인지 확인. `_dragState`에 `{itemId, startX, currentX, direction:null, pointerId, faceEl}` 셋업. faceEl.setPointerCapture. `_isDraggingDetected=false`. 항목에 `data-swiping="false"`. |
| `_handlePointerMove(e)` | `(PointerEvent) => void` | `_dragState=null`이면 무시. `pointerId` 일치 확인. dx = clientX - startX. `currentX` 갱신. `\|dx\| >= _dragThreshold` + 미인정이면 인정 + `data-swiping="true"` + direction set + `_emitSwipeStart`. 인정 후: 허용 방향 검사(`_swipeDirection`에 따라 dx 0으로 클램프 가능) → face transform 갱신 + `_emitSwipeProgress`. |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | `_dragState=null`이면 무시. `pointerId` 일치 확인. drag 미인정(`_isDraggingDetected=false`)이면 짧은 탭 — drag state 정리만(click은 native로 통과해 `@listItemClicked` 발화). 인정이면: `\|dx\| >= _deleteThreshold` + 허용 방향 → `_finishDelete()` 호출(animate-out + 데이터 제거 + emit). 미달 또는 비허용 → `_springBack()`. |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | drag 인정 사이클이었으면 `_springBack()`. drag state 정리. `_isDraggingDetected=false`(다음 click capture 통과). |
| `_handleClickCapture(e)` | `(Event) => void` | `_isDraggingDetected=true`면 `stopImmediatePropagation` + `preventDefault` + `_isDraggingDetected=false`. false면 통과 → bindEvents가 `@listItemClicked` 발화. |
| `_applyOffset(faceEl, dx)` | `(Element, number) => void` | `faceEl.style.transform = 'translate3d(' + dx + 'px, 0, 0)'`. faceEl 없으면 no-op. |
| `_finishDelete()` | `() => void` | drag 인정 사이클 + 임계 초과 시 호출. animate-out: faceEl transform을 ±containerWidth로 120ms transition 후, `_currentItems.filter(it => it.itemid !== draggedItemId)`로 제거 → ListRender 재렌더 → `_emitSwipeDelete(itemId, item, remainingItemIds)`. drag state 정리. |
| `_springBack()` | `() => void` | faceEl transform 0으로 복귀(CSS transition 활성화). 항목 `data-swiping="false"`. drag state 정리. `_isDraggingDetected`는 click capture가 false로 복귀. |
| `_emitSwipeStart(itemId, direction)` | `(string, 'left'\|'right') => void` | `Weventbus.emit('@itemSwipeStart', {targetInstance, itemId, direction})`. |
| `_emitSwipeProgress(itemId, dx, direction, ratio)` | `(...) => void` | `Weventbus.emit('@itemSwipeProgress', {targetInstance, itemId, dx, direction, ratio})`. |
| `_emitSwipeDelete(itemId, item, remainingItemIds)` | `(...) => void` | `Weventbus.emit('@itemSwipeDelete', {targetInstance, itemId, item, deletedAt, remainingItemIds})`. `deletedAt`은 호출 시점 `new Date().toISOString()`. `_lastDeletedAt`도 동일 값으로 갱신. |

### 페이지 연결 사례

```
[페이지 — 이메일 받은편지함 / 할 일 처리 / 알림 dismiss / 운영 알람 큐]
    │
    └─ fetchAndPublish('listItems', this) 또는 직접 publish
        payload 예: [
          { itemid: 'mail-1', leading: '✉️', headline: '계약 검토 요청',  supporting: '오늘 09:14 · 영업팀' },
          { itemid: 'mail-2', leading: '📎', headline: '주간 회의 자료',  supporting: '어제 17:42 · 디자인팀' },
          { itemid: 'mail-3', leading: '💬', headline: '버그 리포트 #1247',supporting: '2일 전 · QA' },
          ...
        ]
        (선택) instance.subscriptions.setSwipeDirection.forEach(h => h.call(instance, { response: 'both' }))

[Lists/Advanced/swipeToDelete]
    ├─ ListRender가 items 배열을 row(2층 wrapper)로 렌더
    └─ _renderItems가 _currentItems 캐시 보관

[사용자가 'mail-2'를 좌측으로 120px 이상 스와이프 → release]
    ├─ pointerdown → _dragState 셋업 + setPointerCapture
    ├─ pointermove (5px 도달) → _isDraggingDetected=true + data-swiping="true" + @itemSwipeStart
    ├─ pointermove (계속) → face transform 갱신 + @itemSwipeProgress(ratio 증가)
    ├─ pointerup (|dx|=140 ≥ 120) → _finishDelete:
    │     animate-out 120ms → _currentItems에서 'mail-2' 제거 → ListRender 재렌더
    │     → @itemSwipeDelete: { itemId:'mail-2', item:{...}, deletedAt:'2026-05-05T...', remainingItemIds:['mail-1','mail-3',...] }
    └─ click은 capture phase에서 차단 (drag 인정 사이클이므로)

[페이지]
    └─ @itemSwipeDelete → 자체 데이터/서버에서 삭제 + Snackbar "삭제됨 — Undo" 노출
       (사용자 Undo 클릭) → instance.subscriptions.restoreItem.forEach(h => h.call(instance,
                              { response: { itemId:'mail-2', atIndex:1, item:{...} } }))
       → 컴포넌트가 _currentItems[1]에 삽입 + 재렌더

운영: this.pageDataMappings = [
        { topic: 'listItems', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@itemSwipeDelete': ({ itemId, item, remainingItemIds }) => {
          // API 삭제 + Snackbar undo
          api.deleteMail(itemId);
          showSnackbar('삭제됨', () => targetInstance.subscriptions.restoreItem.forEach(h => h.call(targetInstance, {
            response: { itemId, atIndex: 0, item }
          })));
        },
        '@itemSwipeProgress': ({ ratio }) => { /* 분석/UI 진행 표시 */ },
        '@listItemClicked': ({ event }) => {
          const id = event.target.closest('.list-swipedel__item')?.dataset.itemid;
          // 메일 상세 페이지로 이동
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | swipe / animate-out 시각 차별화 | back layer 시각 + 도메인 컨텍스트 |
|------|---------|-------------------------------|---------------------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 face / 부드러운 spring back(280ms cubic-bezier 1.4 over) / animate-out 180ms / dragging 시 face elevation 미세 강화 | back: 다크 핑크-레드 그라디언트(`#5A2E63 → #8B2C3D`) + 휴지통 아이콘 핑크-라이트(`#FFB3C1`). **이메일 빠른 삭제** (받은편지함 항목 좌/우 스와이프). |
| `02_material`    | B: Material Elevated | 라이트 elevation / 표준 ease-out(220ms) / animate-out 200ms / dragging 시 box-shadow level 4 → 5 상승 | back: Material red surface(`#FFEBEE` + delete 아이콘 `#D32F2F`). **할 일 항목 처리** (완료된 작업 큐에서 제거). |
| `03_editorial`   | C: Minimal Editorial | 웜 크림 outlined / 차분한 ease-out(320ms) / animate-out 260ms / dragging 시 outline 두께 1 → 2px | back: 웜 grey 배경(`#D8D3CB`) + 진한 갈색 휴지통 아이콘(`#6B6560`) + 우측 vertical rule. **알림 dismissal** (구독 알림 무시 + 정적 페이지 정리). |
| `04_operational` | D: Dark Operational  | 다크 시안 outline / instant snap(80ms) / animate-out 120ms / dragging 시 시안 ring border 강화 | back: 빨강 surface(`#3E1418`) + 노랑/빨강 휴지통 아이콘(`#FF5A60`) + 1px solid border 강조. **운영 알람 처리** (처리 완료된 알람 큐에서 즉시 제거 — Critical 알람 dismiss 시나리오). |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-swiping="true|false"]` 셀렉터로 face transform transition / back layer 가시성 / dragging 시각을 동시에 분기. swipe 인정 후 face transition은 0(즉시 추종), release/cancel 시 transition 활성화.

### 결정사항

- **Standard cssSelectors KEY 호환**: `itemid`/`leading`/`headline`/`supporting`은 Standard와 동일 KEY명. 클래스명만 `list-swipedel__*`로 분리(`list__*` / `list-reorder__*`와 충돌 방지). 페이지가 동일한 `listItems` 토픽 데이터를 양쪽에 publish 가능.
- **2층 wrapper(front/back)**: back layer는 `position: absolute; inset: 0; z-index: 1`로 항목 뒤에 깔리고, face는 `position: relative; z-index: 2`로 위에 떠서 transform translate3d로 손가락 추종. swipe 진행 중 back이 점진 노출되는 시각.
- **5/120px 이중 임계**: swipeAction의 5/80px과 비교하여 **삭제 임계는 더 보수적(120px)**이어야 한다 — 삭제는 부정 결과를 야기하므로 우발적 트리거 방지. swipeAction은 80px이면 액션 영역 노출(취소 가능)이지만 swipeToDelete는 임계 초과 = 즉시 삭제 시작이라 더 명확한 의도 요구.
- **단순 데이터 제거 + 페이지 책임 위임 undo**: 컴포넌트는 즉시 제거 + emit만 수행. 페이지가 Snackbar/undo UI를 보여주고 `restoreItem`으로 복원 토픽을 publish하는 책임을 진다(컴포넌트 외부). 이 분리는 SOC(separation of concerns) — 컴포넌트는 swipe + delete 메커니즘만, undo UI/UX는 페이지 도메인.
- **신규 Mixin 생성 금지**: 큐의 변형 설명에 따라 ListRenderMixin + 자체 메서드 조합으로 완결. swipe 패턴(Cards/swipeAction, Lists/swipeToDelete)이 2회 반복 — 향후 1회 더 반복되면 일반화 가능성 검토 후보(반환에 메모만 — SKILL 회귀 규율).
- **방향 옵션의 외부 갱신**: 실 시나리오에서 운영 알람(좌측 swipe만 가능 — dismiss로 의미 고정), 이메일(both — archive/delete 양쪽)처럼 페이지가 정책을 가질 수 있으므로 `setSwipeDirection` 토픽으로 외부 갱신 가능.
