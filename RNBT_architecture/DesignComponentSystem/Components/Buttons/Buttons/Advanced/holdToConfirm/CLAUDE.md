# Buttons — Advanced / holdToConfirm

## 기능 정의

1. **라벨/아이콘 표시** — `buttonInfo` 토픽으로 수신한 데이터를 라벨/아이콘 영역에 렌더(Standard와 동일한 1:1 필드 매핑).
2. **Hold-to-Confirm 게이트 (1500ms 충전)** — pointerdown 시점부터 `--hold-progress` 0→1을 RAF로 보간하면서 **반드시 끝까지 누르고 있어야** 임계(1500ms) 도달 시 `@holdConfirmed` 1회 발행. 중간에 떼면(pointerup/leave/cancel) **아무 이벤트도 발화하지 않고** progress만 0으로 reset된다(또는 부드러운 fade-out 후 reset). **일반 click 이벤트는 의도적으로 발행하지 않는다** — 이 변형은 "끝까지 hold하지 않으면 아무 일도 일어나지 않는" UI다(우발적 click 차단).
3. **상태 머신 시각 차별** — `data-hold-state="idle|holding|confirmed"` 속성을 버튼에 부착해 CSS가 페르소나별로 idle/holding/confirmed 3상태를 차별화한다(holding 중에는 progress fill/ring/underline/glow ramp가 1로 채워지고, confirmed는 한 번 짧게 강조 후 idle 복귀).
4. **단발 발화 + 자동 reset** — 임계 도달 시 `@holdConfirmed` 1회 emit 후 즉시 `_holdLatched=true`로 잠궈 같은 hold 사이클 내 중복 발화를 방지한다. pointerup이 오면 `_holdLatched`를 풀고 idle 복귀(잔상은 200ms fade로 자연 제거).

> **Standard와의 분리 정당성**: Standard는 단일 click → `@buttonClicked` 발행이 끝이다. holdToConfirm은 ① 새 이벤트 `@holdConfirmed` (payload `{ holdMs: 1500 }`) + click 이벤트 의도적 미발행, ② pointer 4종 native 리스너 + RAF progress + `_holdTimer`/`_holdRaf`/`_holdLatched` 자체 상태, ③ click capture phase 차단 (도중에 손 떼면 click도, longPress도 아닌 "no-op + reset"이 되어야 함) — 세 축 모두 Standard register.js와 직교. 따라서 같은 register.js로 표현 불가 → 별도 Advanced 변형으로 분리.

> **longPress와의 분리 정당성**: longPress는 **gesture 분기 인식**이다 — 임계 도달 전 release하면 "단순 click"으로 분기 발화(`@buttonClicked`), 임계 도달 후 release하면 `@buttonLongPressed`로 분기 발화. 즉 hold 시간이 **두 이벤트의 라우터** 역할이며, **release 시점**이 결정 시점이다. holdToConfirm은 **확인 게이트**다 — 끝까지 누르고 있어야만 `@holdConfirmed`가 발화되며, **임계 도달 시점 자체**가 결정 시점이다. 임계 미만 release는 분기가 아니라 **abort + no-op + 시각 reset**이며, 단순 click 이벤트도 발화하지 않는다(`@buttonClicked` 없음). 의미와 구현 모두 다르다:
> - longPress: hold 시간 = 두 이벤트의 라우터 (release 시점에 분기 발화)
> - holdToConfirm: hold 완료 = 단일 이벤트의 트리거 (임계 시점에 발화, release는 reset)
> - longPress: 단순 click(`@buttonClicked`) 발화 가능 + 임계 후 click 억제
> - holdToConfirm: click 발화 자체가 의미 없음 — 모든 click capture-block (gesture-only UI)
>
> 도메인도 다르다: longPress는 **컨텍스트 메뉴 / 멀티 셀렉트 진입 등 보조 입력**, holdToConfirm은 **돌이킬 수 없는 위험 액션의 확인 게이트**(핵 발사 버튼, 결제 확정, 일괄 archive 등). 따라서 동일 register.js로 통합할 수 없고 별도 Advanced 변형으로 둔다.

> **MD3 근거**: Hold-to-confirm 패턴은 MD3 표준 게이트가 아니지만, 위험 액션 UX(banking confirm, e-commerce checkout, 산업 콘솔의 SHUTDOWN/LAUNCH/ARCHIVE 트리거)에서 dialog confirmation의 마찰 대안으로 널리 사용된다. 시각적 progress 충전이 사용자에게 "지금 위험 액션을 발사하고 있다"는 명시적 시간 마진을 제공한다.

---

## 구현 명세

### Mixin

FieldRenderMixin (라벨/아이콘 렌더 전용) + 커스텀 메서드(`_handlePointerDown` / `_handlePointerUp` / `_handlePointerLeave` / `_handlePointerCancel` / `_handleClickCapture` / `_tickHold` / `_resetHold`).

> **Mixin 불필요 범주에 가깝지만 Standard가 FieldRenderMixin으로 라벨 렌더를 처리하므로 동일 Mixin을 재사용**한다(buttonInfo payload 호환성 유지). hold 게이트 로직(타이머/RAF/click 차단)은 추가 Mixin 없이 자체 메서드 + 직접 native 이벤트 리스너로 완결한다(Components/CLAUDE.md 표 — Buttons 범주는 "Mixin 불필요" 권장이며, 신규 Mixin 생성은 본 SKILL의 대상이 아님).

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| button | `.button` | 버튼 요소 — pointerdown/up/leave/cancel + click capture 부착 대상 + `data-hold-state` 속성 + `.button--holding` / `.button--confirmed` 클래스 토글 |
| label | `.button__label` | 라벨 텍스트 (FieldRender) |
| icon | `.button__icon` | 아이콘 (FieldRender, 선택적) |
| progress | `.button__progress` | 진행 표시 요소 (페르소나별 fill / conic ring / underline / cyan glow ramp) — `--hold-progress` 0~1 변수 setProperty 대상 |

### datasetAttrs

| KEY | data-* | 용도 |
|-----|--------|------|
| holdState | `hold-state` | `data-hold-state="idle|holding|confirmed"` 속성을 button에 직접 setAttribute(`_buttonEl.dataset.holdState`)로 갱신. FieldRender datasetAttrs에는 등록하지 않음 — 인스턴스 메서드가 직접 제어. |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_holdMs` | 임계 시간(고정 1500ms). `@holdConfirmed` payload `holdMs`로 노출. |
| `_holdTimer` | setTimeout 핸들. 임계 도달 시 `@holdConfirmed` emit + `_holdLatched=true`. |
| `_holdRaf` | requestAnimationFrame 핸들. hold 동안 progress 변수 갱신용. |
| `_holdStartedAt` | hold 시작 시각(performance.now). progress 계산용. |
| `_holdLatched` | 임계 도달 후 단발 발화를 위한 잠금 플래그. `@holdConfirmed` 1회만 발화 보장. pointerup/cancel 시 풀린다. |
| `_resetTimer` | confirmed → idle 복귀 잔상 fade 타이머(200ms). |
| `_buttonEl` | hold 중 querySelector 반복 방지용 cache. |
| `_pointerDownHandler` / `_pointerUpHandler` / `_pointerLeaveHandler` / `_pointerCancelHandler` / `_clickCaptureHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 this에 보관. |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `buttonInfo` | `this.fieldRender.renderData` (Standard와 동일한 페이로드 `{ label, icon }`) |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| `@holdConfirmed` | — (Weventbus.emit, 직접 발행) | hold 타이머가 1500ms 도달 시 1회 (`_holdLatched=false → true` 전이) | `{ targetInstance, holdMs: 1500 }` |

> **click 이벤트는 발행하지 않는다.** longPress와 달리 짧은 click은 의미가 없으므로 `customEvents`에 click 매핑을 두지 않는다. 추가로 capture phase에서 모든 click을 stopImmediatePropagation으로 차단해 페이지/외부 핸들러가 우발적 click 동작을 받지 않도록 보장한다 (gesture-only UI 원칙).

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_handlePointerDown(e)` | pointerType이 mouse면 `e.button !== 0` 차단(좌클릭만). 이미 hold 중이면 중복 down 무시. `setPointerCapture(e.pointerId)` 시도(요소 밖으로 나가도 up/cancel 추적). `data-hold-state="holding"`, `.button--holding` 추가, `_holdStartedAt = performance.now()`, `setTimeout(_holdMs)`로 임계 콜백 등록 → 임계 도달 시 `_holdLatched=true`, `data-hold-state="confirmed"`, `.button--confirmed` 추가, `Weventbus.emit('@holdConfirmed', { targetInstance, holdMs })`. RAF로 `_tickHold` 시작. |
| `_handlePointerUp(e)` | hold 중이면(임계 미도달) `_resetHold({ wasConfirmed: false })`. 임계 이미 도달했으면(`_holdLatched=true`) `_resetHold({ wasConfirmed: true })`로 confirmed 잔상 fade 후 idle 복귀. 어느 경우에도 click은 발행하지 않음(capture에서 차단). |
| `_handlePointerLeave(e)` / `_handlePointerCancel(e)` | hold 중(임계 미도달)이면 `_resetHold({ wasConfirmed: false })`. 임계 도달 후라면 confirmed 잔상 진행 중일 수 있으므로 그대로 둔다(`_resetTimer`가 처리). |
| `_handleClickCapture(e)` | 모든 click을 capture phase에서 `e.stopImmediatePropagation()` + `e.preventDefault()`. holdToConfirm은 click 이벤트를 의미적으로 발행하지 않는 gesture-only UI. |
| `_tickHold()` | progress = `min(1, (now - _holdStartedAt) / _holdMs)` 계산 → `_buttonEl.style.setProperty('--hold-progress', String(progress))`. `_holdLatched=false` AND `progress < 1`이면 다음 frame 예약. 1 도달 시 setTimeout 콜백이 처리하므로 RAF는 자연 종료. |
| `_resetHold({ wasConfirmed })` | `clearTimeout(_holdTimer)` + `cancelAnimationFrame(_holdRaf)` + `_holdLatched=false` 복귀. `wasConfirmed=true`면 `data-hold-state="confirmed"` 잔상을 200ms 노출 후 `data-hold-state="idle"` + `.button--confirmed`/`.button--holding` 제거 + `--hold-progress=0`. `wasConfirmed=false`면 즉시 idle 복귀(`.button--holding` 제거, `--hold-progress=0`). |

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('buttonInfo', this)──> [Buttons/holdToConfirm] 라벨/아이콘 렌더

[Buttons/holdToConfirm] ──@holdConfirmed { holdMs: 1500 }──▶ [페이지]
                                                                ├─ 결제 확정 (POST /api/checkout/commit)
                                                                ├─ 일괄 archive (POST /api/archive/all)
                                                                ├─ Publish 실행 (POST /api/publish)
                                                                └─ EXEC SHUTDOWN 등 위험 작업

(임계 미만 release / pointerleave / cancel) → 아무 이벤트도 발행 X. progress 0으로 reset.

운영: this.pageDataMappings = [
        { topic: 'buttonInfo', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@holdConfirmed': ({ targetInstance, holdMs }) => { /* 위험 액션 commit */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | progress 시각 표현 (1차 채널) | confirmed 잔상 |
|------|---------|------------------------------|---------------|
| `01_refined` | A: Refined Technical | 퍼플 그라디언트 / 좌→우 fill bar (`.button__progress` width = progress*100%) + 퍼플 글로우 점진 강화 | 강한 퍼플 글로우 1회 + scale 0.98 settle |
| `02_material` | B: Material Elevated | 라이트 elevated / 360° conic-gradient progress ring + scale 0.96 pulse | 에러 컨테이너 색 잔상 + elevation 단계 상승 |
| `03_editorial` | C: Minimal Editorial | 웜 크림 / 라벨 하단 underline scaleX 진행 + 라벨 letter-spacing 천천히 확장 | italic 잔상 + underline 1.0 정착 |
| `04_operational` | D: Dark Operational | 다크 시안 모노 / 좌→우 시안 fill + 시안 border glow ramp + 진행률 라벨 강조 | 시안 → 그린 confirmed 잔상 + glow 폭발 |

각 페르소나는 페르소나 프로파일(SKILL Step 5-1)을 따르며, **holdToConfirm의 progress가 longPress의 progress와 시각적으로 명확히 구분**되도록 차별화한다 — longPress는 *"꽉 채우면 longPress 발화"*의 보조 신호, holdToConfirm은 *"꽉 채워야만 의미가 있는"* 1차 시각 채널.
