# Buttons — Advanced / longPress

## 기능 정의

1. **라벨/아이콘 표시** — `buttonInfo` 토픽으로 수신한 데이터를 라벨/아이콘 영역에 렌더(Standard와 동일한 1:1 필드 매핑).
2. **길게 누르기 인식 (500ms)** — pointerdown 시점부터 hold 타이머를 시작해 500ms 도달 시 길게 누르기로 판정한다. pointerup/pointerleave/pointercancel 중 하나라도 임계 이전에 발생하면 타이머를 취소한다.
3. **진행도 시각 피드백** — hold 중 `--longpress-progress` CSS 변수(0~1)를 16ms마다 갱신해 페르소나별 progress fill / ring / scale / glow 표현을 구동한다. 임계 도달 시 `.button--longpressed` 클래스로 완료 신호를 1회 표시 후 reset.
4. **이벤트 분리 발행** — 임계(500ms) 도달 시 `@buttonLongPressed` 발행. 임계 미만의 pointerup이면 일반 click 으로 간주해 `@buttonClicked`만 발행. **longPress가 발생한 경우 같은 사이클의 click은 억제**(브라우저 합성 click을 `_suppressNextClick` 플래그 + capture phase listener로 차단).

> **Standard와의 분리 정당성**: Standard는 단일 click 이벤트 + FieldRender만 사용한다. longPress는 ① 새 이벤트 `@buttonLongPressed`(payload `{ durationMs }`), ② pointerdown/up/leave/cancel 4개 native 리스너 + `_holdTimer`/`_progressRaf`/`_suppressNextClick` 3종 자체 상태, ③ click 억제 로직(capture phase) — 세 축 모두 Standard register.js와 다름. 따라서 같은 register.js로 표현 불가 → 별도 Advanced 변형으로 분리.

> **MD3 근거**: Touch & gesture spec — Long press(500ms hold)는 표준 보조 입력 패턴. 위험한 액션 확인, 컨텍스트 메뉴 열기, 멀티 셀렉트 진입 등에 쓰인다.

---

## 구현 명세

### Mixin

FieldRenderMixin (라벨/아이콘 렌더 전용) + 커스텀 메서드(_handlePointerDown/_handlePointerUp/_handlePointerCancel/_handleClickCapture/_tickProgress/_clearHold).

> **Mixin 불필요 범주에 가깝지만 Standard가 FieldRenderMixin으로 라벨 렌더를 처리하므로 동일 Mixin을 재사용**한다. 커스텀 게스처(longPress) 로직은 추가 Mixin 없이 자체 메서드 + 직접 native 이벤트 리스너로 완결한다(Components/CLAUDE.md 표 — Buttons 범주는 "Mixin 불필요" 권장이며, 신규 Mixin 생성은 본 SKILL의 대상이 아님).

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| button | `.button` | 버튼 요소 — pointerdown/up/leave/cancel + click capture 부착 대상 + 클래스 토글 (`.button--pressing`, `.button--longpressed`) |
| label | `.button__label` | 라벨 텍스트 (FieldRender) |
| icon | `.button__icon` | 아이콘 (FieldRender, 선택적) |
| progress | `.button__progress` | 진행 표시 요소(페르소나별 fill / ring 등) — `--longpress-progress` 0~1 변수 setProperty 대상 |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_holdMs` | 임계 시간(고정 500ms). `@buttonLongPressed` payload `durationMs`로 노출. |
| `_holdTimer` | setTimeout 핸들. 임계 도달 시 longPress 처리 후 null. |
| `_progressRaf` | requestAnimationFrame 핸들. hold 동안 progress 변수 갱신용. cancel 시 cancelAnimationFrame. |
| `_holdStartedAt` | hold 시작 시각(performance.now). progress 계산용. |
| `_suppressNextClick` | longPress 발화 시 true → capture phase click 핸들러가 stopPropagation + preventDefault로 같은 cycle native click 차단. 그 click 처리 직후 false 복귀. |
| `_pointerDownHandler` / `_pointerUpHandler` / `_pointerLeaveHandler` / `_pointerCancelHandler` / `_clickCaptureHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 this에 보관. |
| `_buttonEl` | hold 중 querySelector를 매 frame 반복하지 않도록 cache. |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `buttonInfo` | `this.fieldRender.renderData` (Standard와 동일한 페이로드 `{ label, icon }`) |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `button` | pointerup이 임계 미만일 때 (longPress 미발화 사이클) | `{ targetInstance }` (Wkit.bindEvents 표준) |
| `@buttonLongPressed` | — (Weventbus.emit) | hold 타이머가 500ms 도달 시 1회 | `{ targetInstance, durationMs: 500 }` |

> click은 `customEvents` 맵에 등록해 `bindEvents` 위임 흐름을 그대로 사용한다(Standard와 동일 호환). longPress 발화 시점에 instance에 `_suppressNextClick = true`를 세우고, 별도 capture phase click 리스너가 같은 사이클 click을 stopImmediatePropagation으로 차단한다 → bindEvents의 bubble phase 핸들러까지 도달하지 않으므로 `@buttonClicked` 미발행이 보장된다.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_handlePointerDown(e)` | pointerType이 mouse이면 `e.button !== 0` 차단(좌클릭만). `setPointerCapture(e.pointerId)` 시도(요소 밖으로 나가도 up/cancel 추적). `.button--pressing` 추가, `_holdStartedAt = performance.now()`, `setTimeout(_, 500)`로 임계 콜백 등록 → 임계 도달 시 `_suppressNextClick=true`, `.button--longpressed` 1회 토글, `Weventbus.emit('@buttonLongPressed', { targetInstance: this, durationMs: 500 })`, `_clearHold()`. 동시에 `requestAnimationFrame(_tickProgress)` 시작. |
| `_handlePointerUp(e)` | hold 중이면(`_holdTimer` 살아있음) longPress 미달 → `_clearHold()`만 수행하고 click은 bindEvents가 같은 사이클에 자연스럽게 발화. longPress 이미 발화됐으면 capture 핸들러가 click 억제. |
| `_handlePointerLeave(e)` / `_handlePointerCancel(e)` | hold 중이면 `_clearHold()`. longPress 미발화. |
| `_handleClickCapture(e)` | capture phase에서 `_suppressNextClick`이 true면 `e.stopImmediatePropagation()` + `e.preventDefault()` 후 `_suppressNextClick=false`. (bindEvents의 bubble 단계까지 도달 X → `@buttonClicked` 미발행) |
| `_tickProgress()` | 현재 progress = `min(1, (now - _holdStartedAt) / _holdMs)` 계산 → `_buttonEl.style.setProperty('--longpress-progress', String(progress))`. progress < 1이면 다음 frame 예약. |
| `_clearHold()` | `_holdTimer` clearTimeout + null, `_progressRaf` cancelAnimationFrame + null, `.button--pressing` 제거, `--longpress-progress` 0 reset. `.button--longpressed`는 짧은 setTimeout(180ms)로 자연 fade 후 제거(완료 피드백 잔상). |

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('buttonInfo', this)──> [Buttons/longPress] 라벨/아이콘 렌더

[Buttons/longPress] ──@buttonClicked──────▶ [페이지]  (짧게 클릭)
                                               └─ 일반 액션 수행

[Buttons/longPress] ──@buttonLongPressed──▶ [페이지]  (500ms hold)
                                               ├─ 위험 액션 확인 다이얼로그 열기
                                               ├─ 컨텍스트 메뉴 노출
                                               └─ 멀티 셀렉트 모드 진입 등

운영: this.pageDataMappings = [
        { topic: 'buttonInfo', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@buttonClicked':     ({ event }) => { /* 짧은 클릭 처리 */ },
        '@buttonLongPressed': ({ targetInstance, durationMs }) => { /* hold 처리 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | progress 시각 표현 |
|------|---------|-------------------|
| `01_refined` | A: Refined Technical | 퍼플 그라디언트 / 좌→우 fill bar (`.button__progress` width = progress*100%) + 퍼플 글로우 |
| `02_material` | B: Material Elevated | 라이트 elevated / 360° conic-gradient progress ring + scale 0.96 pulse |
| `03_editorial` | C: Minimal Editorial | 웜 크림 / 좌→우 underline scaleX 진행 + label letter-spacing slow expand |
| `04_operational` | D: Dark Operational | 다크 시안 모노 / 0~100% percent label + 시안 border glow + 좌→우 fill |

각 페르소나는 페르소나 프로파일(SKILL Step 5-1)을 따르며, longPress의 progress feedback이 Standard click 버튼과 시각적으로 명확히 구분되는 방향으로 차별화한다.
