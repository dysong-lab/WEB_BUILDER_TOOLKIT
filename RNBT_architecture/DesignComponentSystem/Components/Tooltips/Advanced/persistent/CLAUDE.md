# Tooltips — Advanced / persistent

## 기능 정의

1. **클릭 진입 모드 (sticky pin)** — Standard/richContent 의 hover-then-auto-hide 모델과 달리, 본 변형은 **trigger 클릭이 표시 진입점**이다. trigger 영역(`[data-tooltip-trigger-id]` 가 부착된 요소들) 클릭 시 해당 trigger 좌표 기준으로 tooltip 표시 + sticky 고정 (`_persisted = true`). 명시적 dismiss 트리거(× / outside-click / 재클릭 / Escape) 전까지 표시 유지.
2. **multi-trigger 지원 + clickTarget 추적** — 한 페이지에 여러 trigger 가 존재할 때(`data-tooltip-trigger-id` 가 다른 값으로 부착된 요소 N 개), `_clickTarget` 자체 상태가 *현재 어떤 trigger 에서 열렸는지* 를 추적. 다른 trigger 클릭 시 → 이전 dismiss + 새 trigger 에 표시. 같은 trigger 재클릭 시 → toggle close (`reason: 'toggle'`).
3. **× close 버튼 (view 포함)** — view 의 popup 안에 `.tooltip-pt__close` 닫기 버튼이 있다. 클릭 시 dismiss(`reason: 'close'`).
4. **outside-click dismiss (document 임시 listener)** — popup 이 열린 동안 document 에 `mousedown` capture-phase listener 부착. popup 자기자신/active trigger 영역 외부 click 이면 dismiss(`reason: 'outside'`).
5. **Escape 키 dismiss** — popup 열린 동안 document `keydown` capture-phase listener 부착. `Escape` (또는 keyCode 27) 시 dismiss(`reason: 'escape'`).
6. **trigger 재클릭 toggle dismiss** — 현재 active trigger 와 같은 trigger 재클릭 시 dismiss(`reason: 'toggle'`).
7. **콘텐츠 매핑 (contentMap)** — `tooltipContents` 토픽으로 `{ [triggerId]: text }` map 을 받아 `_contentMap: Map<string, string>` 에 저장. trigger 클릭 시 해당 triggerId 의 텍스트를 popup 콘텐츠로 표시. 동시에 단일 콘텐츠 모드(`tooltipContent` 토픽 — `{ content }`) 도 지원 — 모든 trigger 가 같은 텍스트를 공유.
8. **외부 명령형 제어 (setTooltipPersistent 토픽)** — `setTooltipPersistent` 토픽으로 `{ open: boolean, content?: string, triggerId?: string }` 페이로드 수신 시 페이지가 명령형으로 open/close 가능. open=true 이면 (triggerId 가 있으면 해당 trigger 좌표, 없으면 popup 자체 위치 유지) 표시. open=false 이면 close. content 가 있으면 동시에 콘텐츠 갱신.
9. **라이프사이클 이벤트 발행** — pin (open) 시 `@tooltipPinned { triggerId, content }` 1회 emit. dismiss 시 `@tooltipDismissed { reason, triggerId }` 1회 emit (reason ∈ `'close' | 'outside' | 'toggle' | 'escape' | 'switch' | 'external'`).

> **Standard 와의 분리 정당성 (5축)**:
> - **새 자체 상태 7종** — `_cssSelectors`, `_persisted: boolean`, `_clickTarget: HTMLElement | null`, `_currentTriggerId: string | null`, `_contentMap: Map<string, string>`, `_singleContent: string`, `_outsideHandlers / _rootClickHandler / _closeBtnHandler`. Standard 는 stateless.
> - **새 토픽 3종** — `tooltipContent` (단일 콘텐츠), `tooltipContents` (triggerId map), `setTooltipPersistent` (외부 명령형 토글). Standard 는 `tooltipInfo` 단일 토픽이며 plain `label` 만, hover/dismiss timer/위치 모두 페이지 책임.
> - **새 이벤트 2종** — `@tooltipPinned` (sticky pin), `@tooltipDismissed` (dismiss + reason). Standard 는 발행 이벤트 0종.
> - **자체 메서드 9종** — `_pin(triggerEl, triggerId, content)`, `_dismiss(reason)`, `_repositionToTrigger(triggerEl)`, `_handleRootClick(e)`, `_handleOutsideMouseDown(e)`, `_handleEscapeKey(e)`, `_handleSetContents({response})`, `_handleSetSingleContent({response})`, `_handleSetPersistent({response})`. Standard 는 자체 메서드 0개.
> - **HTML 구조 변경** — Standard 는 `<span class="tooltip__label">` 단일 텍스트 슬롯. persistent 는 ① popup root (`.tooltip-pt__popup`) + close btn (`.tooltip-pt__close`) + body (`.tooltip-pt__body`) ② trigger area (`.tooltip-pt__trigger` × N — `data-tooltip-trigger-id` 부착) ③ 컨테이너 root (`.tooltip-pt`) 로 multi-element 구조. prefix `.tooltip-pt__*` 로 Standard `.tooltip__*` / richContent `.tooltip-rc__*` 와 분리(같은 페이지 공존 시 CSS 충돌 X).
>
> 위 5축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가.

> **richContent 와의 분리 정당성**:
> - richContent: hover/focus 진입(페이지 책임) + auto-dismiss + HTML 콘텐츠 + sanitize. *콘텐츠 측면* 확장.
> - persistent: **클릭 진입(컴포넌트 책임)** + sticky pin (자동 dismiss 없음) + plain text 콘텐츠 + multi-trigger + 자체 outside-click/Escape/toggle dismiss. *상호작용 측면* 확장.
> - 같은 페이지에서 두 변형이 공존 가능 (Standard hover tooltip + persistent click-pinned tooltip). prefix 분리로 CSS 충돌 X.

> **참조 패턴**:
> - `Tooltips/Advanced/richContent` — Mixin 미사용 + 자체 메서드 + bindEvents 위임 + dataset 토글 + prefix 분리. 본 변형도 동일 채택.
> - `Menus/Advanced/contextMenu` — 자체 trigger element listener + document 임시 listener (mousedown/keydown) 라이프사이클 + bound handler refs + viewport flip + `_open`/`_close` 자체 메서드 + `@xxxOpened/@xxxClosed` 라이프사이클 emit. 본 변형의 dismiss 라이프사이클 패턴 차용.
> - `Lists/Advanced/multiSelect` — 자체 평면 렌더 + 자체 명시 emit 패턴 (참고만).

> **MD3 / 도메인 근거**: MD3 Rich Tooltip 에서 *"persists until dismissed"* 명시. 클릭 트리거(persistent variant)는 MD3 spec 의 명시적 카테고리는 아니지만 다음 실사용에서 표준 패턴: ① **데이터 셀 hint** — table 셀 옆 ⓘ 클릭 → 해당 셀의 출처/계산식 보기, 다른 셀 ⓘ 클릭 또는 outside-click 으로 dismiss. ② **form field help** — 입력 필드 옆 ? 클릭 → 형식 안내 + 예시, 입력 시작 시 outside-click 으로 dismiss. ③ **inline 정의** — 본문 단어 옆 [?] 클릭 → glossary 정의, Escape 으로 dismiss. ④ **chart legend hint** — 차트 범례 항목 클릭 → 측정 단위/계산 방식, 다른 범례 클릭 시 자동 switch. 모든 케이스에서 hover 는 표시 안 함(클릭 진입 only — accidental show 방지 + 모바일 호환), dismiss 는 명시적 (× / outside / Escape / 재클릭) — auto-dismiss timer 없음.

---

## 구현 명세

### Mixin

없음 — 자체 메서드 9종 + 자체 상태 7종으로 완결.

> **신규 Mixin 생성 금지** — produce-component Step 3-1 에 따라 본 루프에서 새 Mixin 을 만들지 않는다. trigger 영역 listener + document 임시 listener (mousedown/keydown) + sticky open 라이프사이클은 contextMenu 와 일부 중복(향후 `TriggerPopupMixin` / `StickyPopupMixin` 일반화 후보 메모) 되지만 본 변형은 자체 메서드로 완결.
>
> **Standard 가 사용한 FieldRenderMixin 제거 사유**: Standard 의 `tooltipInfo` 단일 객체 → `label` textContent 1:1 매핑은 FieldRenderMixin 으로 충분했으나, persistent 는 ① triggerId map 분기 (`tooltipContents` Map<id, text>), ② 단일 콘텐츠 (`tooltipContent`), ③ 외부 명령형 (`setTooltipPersistent`) 의 3 채널 + sticky open 라이프사이클이 필요해 단순 textContent 매핑으로 표현 불가. 자체 메서드(`_pin` / `_dismiss`)가 콘텐츠 + 표시 + 라이프사이클 emit 을 단일 진입점에서 책임진다.

### cssSelectors (자체 — Mixin 미사용이므로 KEY 등록은 인스턴스 자체에 메모만)

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.tooltip-pt` | 컨테이너 루트 — bindEvents 위임 host + 모든 native click 위임 host. |
| popup | `.tooltip-pt__popup` | popup 컨테이너 — `data-open` 토글 + `style.left/top` 갱신 대상 + `data-trigger-id` 부착(현재 active trigger). |
| body | `.tooltip-pt__body` | 콘텐츠 textContent 주입 대상. |
| closeBtn | `.tooltip-pt__close` | × 닫기 버튼 — bindEvents 위임 click → `@tooltipCloseClicked` (Standard 호환). 자체 native click delegator 가 추가로 명시 dismiss 처리. |
| trigger | `.tooltip-pt__trigger` | trigger 영역 — `data-tooltip-trigger-id` 부착. bindEvents 위임 click → `@tooltipTriggerClicked` (Standard 호환). 자체 native click delegator 가 pin/toggle 처리. |

> Mixin 미사용이므로 `cssSelectors` 옵션 객체는 없으며, 위 KEY 는 register.js 안에서 직접 사용된다(하드코딩 금지 — 공통 상수 `_cssSelectors` 로 추출). `bindEvents` 셀렉터는 `[this._cssSelectors.trigger]` / `[this._cssSelectors.closeBtn]` computed property 형태로 참조.

### datasetAttrs

자체 사용 dataset 메모(Mixin 옵션은 아님):

| KEY | dataset | 용도 |
|-----|---------|------|
| trigger | `data-tooltip-trigger-id` | trigger element 식별 (multi-trigger 분기) |
| popup | `data-open`, `data-trigger-id` | popup 표시 상태 + 현재 active trigger ID |

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_cssSelectors` | `object` | (위 표) | 자체 KEY → CSS 셀렉터 매핑. 단일 진실 출처. |
| `_persisted` | `boolean` | `false` | 현재 sticky pin 상태. true 이면 popup 표시 중. |
| `_clickTarget` | `HTMLElement \| null` | `null` | 마지막 pin 진입 trigger element 참조. dismiss 시 null. |
| `_currentTriggerId` | `string \| null` | `null` | 현재 active triggerId 문자열. dismiss 시 null. |
| `_contentMap` | `Map<string, string>` | empty | `tooltipContents` 페이로드 — triggerId 별 콘텐츠. |
| `_singleContent` | `string` | `''` | `tooltipContent` 페이로드 — 모든 trigger 공유 콘텐츠. `_contentMap` 에 키가 없으면 fallback. |
| `_popupEl` | `HTMLElement \| null` | `null` | `.tooltip-pt__popup` cache. |
| `_bodyEl` | `HTMLElement \| null` | `null` | `.tooltip-pt__body` cache. |
| `_closeBtnEl` | `HTMLElement \| null` | `null` | `.tooltip-pt__close` cache. |
| `_rootClickHandler` | `function \| null` | `null` | root 영역 native click delegator bound ref (trigger/closeBtn pin/toggle/close). |
| `_outsideHandlers` | `{mousedown, keydown} \| null` | `null` | document 임시 listener bound refs (open 동안만 부착). |

### 구독 (subscriptions)

| topic | handler | payload |
|-------|---------|---------|
| `tooltipContent` | `this._handleSetSingleContent` | `{ content: string }` 또는 string |
| `tooltipContents` | `this._handleSetContents` | `{ [triggerId]: content }` map |
| `setTooltipPersistent` | `this._handleSetPersistent` | `{ open: boolean, content?: string, triggerId?: string }` |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 | payload |
|--------|------------------|------|---------|
| click | `this._cssSelectors.trigger` (`.tooltip-pt__trigger`) | `@tooltipTriggerClicked` | `{ event, targetInstance }` (Standard 호환 시그니처) |
| click | `this._cssSelectors.closeBtn` (`.tooltip-pt__close`) | `@tooltipCloseClicked` | `{ event, targetInstance }` (Standard 호환 시그니처) |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@tooltipPinned` | `_pin()` 시 1회 (다른 trigger 로 switch 시는 이전 dismiss + 새 pin 1쌍 발행) | `{ targetInstance, triggerId, content, x, y }` |
| `@tooltipDismissed` | `_dismiss()` 시 1회. reason ∈ `'close'`(× 버튼) / `'outside'`(document mousedown 외부) / `'toggle'`(active trigger 재클릭) / `'escape'`(Escape 키) / `'switch'`(다른 trigger 클릭으로 인한 자동 close) / `'external'`(setTooltipPersistent open=false) | `{ targetInstance, reason, triggerId }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_pin(triggerEl, triggerId, content)` | `(HTMLElement, string, string) => void` | popup 표시 + sticky pin 진입. ① body 에 textContent 주입(`content` 또는 `_contentMap.get(triggerId)` 또는 `_singleContent`). ② `_repositionToTrigger(triggerEl)` 호출. ③ `popupEl.dataset.open = 'true'` + `dataset.triggerId = triggerId`. ④ `_persisted = true`, `_clickTarget = triggerEl`, `_currentTriggerId = triggerId`. ⑤ document 임시 listener 2종(mousedown/keydown) 부착. ⑥ `@tooltipPinned` 1회 emit. |
| `_dismiss(reason)` | `(string) => void` | popup 숨김 + sticky pin 해제. 이미 닫혀있으면 silent return. ① `popupEl.dataset.open = 'false'`. ② document 임시 listener 2종 detach. ③ `@tooltipDismissed { reason, triggerId: _currentTriggerId }` 1회 emit. ④ `_persisted = false`, `_clickTarget = null`, `_currentTriggerId = null`. |
| `_repositionToTrigger(triggerEl)` | `(HTMLElement) => void` | trigger 의 `getBoundingClientRect()` 기준으로 popup 위치 계산. 기본은 trigger 아래 8px (`top = rect.bottom + 8`, `left = rect.left + rect.width/2`, `transform: translateX(-50%)`). viewport 우측 초과 시 `transform: translateX(-100%) + rect.right` 로 우측 정렬. 페이지 책임 위치 (라이트한 viewport-aware) — Standard 의 위치 책임은 페이지 본인이지만 persistent 는 컴포넌트 자체 트리거이므로 컴포넌트가 위치 계산. |
| `_handleRootClick(e)` | `(MouseEvent) => void` | root 영역 native click delegator (capture=false). ① `e.target.closest(closeBtn)` ⇒ `_dismiss('close')`. ② `e.target.closest(trigger)` ⇒ trigger 분기: 같은 triggerId 이면 `_dismiss('toggle')`, 다른 triggerId 이면 (이전이 있으면 `_dismiss('switch')`) → `_pin(trigEl, newId, ...)`. ③ 그 외(popup 내부 click) ⇒ silent (sticky 유지). |
| `_handleOutsideMouseDown(e)` | `(MouseEvent) => void` | document mousedown capture listener. `e.target` 이 popup 또는 active `_clickTarget` 안에 있으면 silent. 그 외이면 `_dismiss('outside')`. |
| `_handleEscapeKey(e)` | `(KeyboardEvent) => void` | document keydown capture listener. `e.key === 'Escape'` 또는 `e.keyCode === 27` 이면 `_dismiss('escape')`. |
| `_handleSetContents({response})` | `({response}) => void` | `tooltipContents` 토픽 핸들러. response 가 plain object 이면 `_contentMap` 을 새로 빌드 (이전 키 모두 제거 → 새 키 set). 현재 active triggerId 가 있고 새 map 에 그 키가 있으면 popup body textContent 즉시 갱신. |
| `_handleSetSingleContent({response})` | `({response}) => void` | `tooltipContent` 토픽 핸들러. response.content 또는 response 자체(string)를 `_singleContent` 에 저장. 현재 active 이고 `_contentMap` 에 active triggerId 가 없으면 popup body textContent 즉시 갱신. |
| `_handleSetPersistent({response})` | `({response}) => void` | `setTooltipPersistent` 토픽 핸들러. ① `open === true` 이면: `triggerId` 가 있으면 root 안에서 `[data-tooltip-trigger-id="${triggerId}"]` 요소 조회, 없으면 첫 trigger fallback. content 가 있으면 동시 갱신(`_singleContent` 에 저장 + 현재 trigger 의 contentMap 갱신). 그 후 `_pin`. ② `open === false` 이면 `_dismiss('external')`. |

### 페이지 연결 사례

```
[페이지 — 데이터 셀 hint / form field help / chart legend hint]
   │
   ├─ // (a) 단일 콘텐츠 모드 — 모든 trigger 공유
   │   fetchAndPublish('tooltipContent', this) 또는 직접 publish
   │     payload: { content: '이 셀은 SUM(A1:A10) 으로 계산됩니다.' }
   │
   ├─ // (b) trigger 별 콘텐츠 모드
   │   publish('tooltipContents', { response: {
   │       'cell-A1': '필드 A 의 출처: API /api/sales',
   │       'cell-B1': '필드 B 의 출처: 수동 입력',
   │       'cell-C1': '필드 C 의 계산식: A * 1.1'
   │   }})
   │
   ├─ // (c) 외부 명령형 — 페이지가 다른 UI 동작과 동기화
   │   publish('setTooltipPersistent', { response: {
   │       open: true,
   │       triggerId: 'cell-A1',
   │       content: '동적으로 갱신된 텍스트'
   │   }})
   │   // ... 또는 close
   │   publish('setTooltipPersistent', { response: { open: false }})
   │
   └─ Wkit.onEventBusHandlers({
        '@tooltipPinned':       ({triggerId, content}) => analytics.track('hint_pinned', {triggerId}),
        '@tooltipDismissed':    ({reason, triggerId}) => analytics.track('hint_dismissed', {reason, triggerId}),
        '@tooltipTriggerClicked': () => { /* Standard 호환 — 옵션 */ },
        '@tooltipCloseClicked':   () => { /* Standard 호환 — 옵션 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별 | 도메인 컨텍스트 예 |
|------|---------|----------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 그라디언트 / Pretendard / 8px 모서리 / popup 시안 outline + 1px glow / × 버튼은 시안 hover 강조. data-open 시 fade+up 150ms. | **데이터 셀 hint** — table 셀 옆 ⓘ 트리거 클릭 → "이 셀은 SUM(A1:A10) 으로 계산됩니다." 표시, 다른 ⓘ 클릭 시 자동 switch. |
| `02_material`    | B: Material Elevated | 인버스 다크 surface / Roboto / 4px 모서리 / Material elevation level 3 shadow / × 는 IconButton. data-open 시 scale-in 200ms. | **form field help** — 입력 필드 옆 ? 트리거 클릭 → "전화번호 형식: 010-XXXX-XXXX" 표시, 입력 시작 시 outside-click 으로 dismiss. |
| `03_editorial`   | C: Minimal Editorial | 웜 아이보리 / Georgia 세리프 / 0px 샤프 모서리 + 헤어라인 / × 는 ✕ 텍스트 글리프. fade-in 150ms. | **inline 정의** — 본문 단어 옆 [?] 트리거 클릭 → glossary 정의 표시, Escape 으로 dismiss. |
| `04_operational` | D: Dark Operational  | 다크 시안 / JetBrains Mono / 2px 각진 / 컴팩트 padding / × 는 monospace × glyph + 시안 hover. data-open 시 시안 ring + fade 100ms. | **chart legend hint** — 차트 범례 항목 클릭 → "Lat: ms, p99 — 측정 윈도우 5분" 표시, 다른 범례 클릭 시 자동 switch. |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. `[data-open="true"]` 셀렉터로 popup visibility 분기. trigger 영역(.tooltip-pt__trigger)은 inline-block + cursor:pointer + 페르소나 색.

### 결정사항

- **Mixin 0종 — 자체 메서드로 완결**: FieldRenderMixin 의 textContent 매핑은 단일 콘텐츠 모드에서만 충분하지만, 본 변형은 (단일/맵 분기 + sticky open 라이프사이클 + multi-trigger + outside listener) 가 단일 메서드에서 통합 처리되어야 함. 자체 메서드로 완결. 신규 Mixin 생성 금지(produce-component Step 3-1).
- **richContent 와 prefix 분리**: `.tooltip-rc__*` ↔ `.tooltip-pt__*`. 같은 페이지에서 두 변형 공존 시 CSS 충돌 차단. Standard `.tooltip__*` 와도 분리.
- **multi-trigger view 구조**: 각 페르소나의 view 는 ① 컨테이너 root (`.tooltip-pt`) 안에 ② 여러 개의 trigger 영역 (`.tooltip-pt__trigger[data-tooltip-trigger-id="..."]`) + ③ 단일 popup (`.tooltip-pt__popup`) + ④ × 닫기 버튼 (`.tooltip-pt__close`) + ⑤ 콘텐츠 슬롯 (`.tooltip-pt__body`) 로 구성. trigger 갯수와 식별자는 view 작성 시 결정(페이지가 setTooltipPersistent 로 동적 식별 가능).
- **클릭 진입 only — hover 표시 안 함**: hover 진입은 의도치 않은 표시 위험(pointer 이동 중 잠깐 trigger 위 통과). persistent 는 명확한 click intent 만 진입점. 모바일/터치 친화 (hover 미지원 환경).
- **outside-click dismiss 트리거 채널 = `mousedown`** (click 아님): popup 내부 클릭이 dismiss 로 전파되기 전에 mousedown 단계에서 외부 여부 판정. `click` 으로 잡으면 popup 내부 link click 이 mousedown→mouseup→click 사이에 dismiss 트리거가 될 수 있어 `mousedown` 으로 통일. capture phase (`true`) 로 부착.
- **재클릭 toggle vs 다른 trigger switch**: 같은 `_currentTriggerId === clickedId` ⇒ `_dismiss('toggle')`. 다른 ⇒ `_dismiss('switch')` 후 `_pin`. switch 시는 dismiss + pin 1쌍 모두 emit (analytics 추적 가능).
- **위치 계산 책임 — 컴포넌트가 담당** (Standard 는 페이지 책임): persistent 는 trigger 가 컴포넌트 view 내부에 있으므로 위치 계산을 컴포넌트가 자체 처리. `_repositionToTrigger` 가 trigger rect → popup `style.left/top`. 단순 below-trigger + center 정렬 + 우측 viewport 초과 시 right-align fallback (rich viewport flip 은 contextMenu 수준의 공간이 필요하므로 본 변형은 라이트한 정렬).
- **콘텐츠 우선순위**: `_pin(triggerEl, triggerId, content)` 의 content 가 명시되면 그것 우선 → 없으면 `_contentMap.get(triggerId)` → 없으면 `_singleContent` → 없으면 빈 문자열.
- **bindEvents 위임 + 자체 native click delegator 병행**: bindEvents 의 `@tooltipTriggerClicked` / `@tooltipCloseClicked` 는 Standard 호환 시그니처(페이지가 일반 click 알림 받기). 자체 `_handleRootClick` (root 컨테이너 native click) 가 pin/toggle/close 명시 라이프사이클 처리 — 두 채널은 직교 (Lists/multiSelect / Menus/contextMenu 의 *bindEvents 위임 + 명시 emit 병행* 패턴 차용).
- **document 임시 listener 2종** (mousedown/keydown): popup 열린 동안만 부착. 닫힐 때 정확히 detach. capture phase 로 부착하여 popup/trigger 의 다른 listener 보다 먼저 실행 (outside 판정).
- **신규 Mixin 생성 금지**: 자체 메서드로 완결. **반복 패턴 후보 메모**: `StickyPopupMixin` / `MultiTriggerMixin` — trigger 영역 위임 + sticky open 라이프사이클 + outside-click/Escape dismiss + multi-trigger 분기 패턴이 향후 Help bubble / inline glossary / interactive callout 등에서 누적되면 일반화 검토 (SKILL 회귀 규율, 본 사이클은 메모만).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js — Mixin 미사용이지만 자체 `_cssSelectors` 와 view/preview 일치)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (document 임시 listener detach → root native click handler 제거 → customEvents 제거 → 구독 해제 → 자체 메서드/상태 null)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tooltips/Advanced/persistent/preview/...html` → `../`를 5번 = richContent / Toolbars/overflowMenu 와 동일 verbatim 복사)
