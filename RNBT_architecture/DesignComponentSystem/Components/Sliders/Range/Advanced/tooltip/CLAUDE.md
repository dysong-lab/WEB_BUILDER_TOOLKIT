# Sliders/Range — Advanced / tooltip

## 기능 정의

1. **슬라이더 상태 렌더링 (Range Standard 호환)** — `sliderInfo` 토픽으로 수신한 객체(`{ label, low, high, min, max, step, minDistance?, disabled, lowText?, highText?, lowTooltipText?, highTooltipText?, tooltipFormat? }`)를 라벨/두 값 표시/두 input 속성/활성 트랙(low~high 구간)에 반영한다 (Range Standard와 동일한 FieldRenderMixin + `updateSliderValue` 파생 + 불변식 보정).
   - 활성 트랙은 `low` 지점에서 `high` 지점까지 확장된다 (`lowProgress%` + `progress%` 두 styleAttrs를 같은 `.slider__track-active` 요소에 적용).
   - `low > high`로 publish되어도 `low ≤ high` 보정. `minDistance`가 주어지면 `high - low >= minDistance` 보장.
2. **양 끝점 tooltip 동시 표시 (핵심 차별)** — `input[type=range]` 두 개의 thumb 위에 **각각 별도 tooltip 2개**(`lowTooltip`, `highTooltip`)를 띄운다. 각 tooltip의 `textContent`는 해당 핸들의 현재 값(또는 `lowTooltipText`/`highTooltipText`).
3. **drag 라이프사이클 동기화 (thumb별 독립)** — low/high 각 input에 대해 `pointerdown` 시점 **해당 tooltip만 visible=true** + `@dragStart`(payload: `{ thumb: 'low' | 'high' }`) 1회 발행, `pointerup`/`pointercancel` 시점 200ms delay 후 visible=false + `@dragEnd`(payload: `{ thumb }`) 1회 발행. 키보드(`focus`)도 동일 — 해당 input focus 동안 해당 tooltip만 표시(focus → visible, blur → 200ms delay 후 hidden).
4. **tooltip 위치 추적 (두 핸들 독립)** — input value 변동 시점마다 `((low-min)/(max-min))`을 `--low-tooltip-progress`, `((high-min)/(max-min))`을 `--high-tooltip-progress` CSS 변수로 tooltip 컨테이너(`tooltipHost`)에 갱신한다. CSS는 각 tooltip을 `left: calc(var(--low-tooltip-progress) * 100%)` / `left: calc(var(--high-tooltip-progress) * 100%)` + `translateX(-50%)`로 thumb 중심에 정렬한다.
5. **tooltip 텍스트 포맷 (low/high 분리)** — `data.lowTooltipText`/`data.highTooltipText`가 있으면 그 값을 그대로 표시, 없으면 `data.lowText`/`data.highText`(헤더 표시값) → 없으면 `String(low)`/`String(high)` 순으로 fallback. 추가로 `tooltipFormat?: (value, side: 'low'|'high') => string` 콜백 슬롯을 받아 페이지가 tooltip 전용 포맷(단위 포함, 소수점 등)을 분리할 수도 있다.
6. **값 변경 이벤트 (Range Standard 분리)** — 두 input 중 하나의 input 이벤트 시점에 `@valueChanged` 발행 (Range Standard `@sliderChanged` 대체 — 의미 명확화). payload: `{ targetInstance, event, value, thumb }`. drag 라이프사이클 이벤트는 `@dragStart`/`@dragEnd`로 별도 발행.

> **Range Standard와의 분리 정당성**:
> - **자체 상태 11종** — `_isLowPointerDown` / `_isHighPointerDown` / `_lowPointerId` / `_highPointerId` / `_lowHideTimerId` / `_highHideTimerId` / `_hideDelay` / `_lowInputEl` / `_highInputEl` / `_lowTooltipEl` / `_highTooltipEl` / `_tooltipHostEl`. Range Standard는 stateless.
> - **새 이벤트 3종** — `@dragStart` / `@dragEnd` (라이프사이클, `thumb` payload) + `@valueChanged` (Range Standard `@sliderChanged` 대체 — `thumb` payload). Range Standard는 `@sliderChanged` 1종만.
> - **새 cssSelectors KEY 3종** — `lowTooltip` / `highTooltip` (각자 visible 토글 + textContent) + `tooltipHost` (`--low-tooltip-progress`/`--high-tooltip-progress` 두 CSS 변수 갱신 대상). Range Standard에는 없음.
> - **자체 메서드 13종** — `updateSliderValue`(확장 — 두 tooltip 동시 갱신 + 불변식 보정 답습) / `_updateTooltipPosition` / `_handleLowPointerDown`/`_handleLowPointerUp`/`_handleLowPointerCancel`/`_handleLowFocus`/`_handleLowBlur`/`_handleLowInput` / `_handleHighPointerDown`/`_handleHighPointerUp`/`_handleHighPointerCancel`/`_handleHighFocus`/`_handleHighBlur`/`_handleHighInput` / `_scheduleLowHide`/`_scheduleHighHide`/`_clearLowHide`/`_clearHighHide` (총 18 메서드, 그러나 동일 시그니처 6종 × 2 thumb = 12 + 위치/스케줄 헬퍼 2 + clear 2 + update 1).
> - **input 외 native pointer/focus 리스너 12종 라이프사이클** — Range Standard는 customEvents의 `input` 이벤트만 사용하지만, 본 변형은 두 input element에 각각 native pointerdown/pointerup/pointercancel/focus/blur/input 6종을 직접 부착(저 12종 = 6 × 2 thumb). beforeDestroy에서 명시적으로 detach.
> - **tooltip 2개 독립 visibility 라이프사이클** — 한쪽 thumb drag 중에는 그쪽 tooltip만 표시. 양쪽 동시 표시는 양쪽 동시 focus(키보드)에서만 가능(현실적으로 발생 안 함). `_lowHideTimerId`/`_highHideTimerId` 분리.
>
> 위 6축은 동일 register.js로 표현 불가 → Range Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**:
> - **Sliders/Range/Standard** (직전, 같은 컴포넌트) — FieldRenderMixin + `updateSliderValue` 파생(lowProgress + progress + lowText/highText) + `low ≤ high` 및 `minDistance` 불변식 보정 + 두 input 겹치기 + 양방향 sliderInfo 흐름. 본 변형은 동일 토대 위에 tooltip 2개 element + native pointer/focus 리스너 12종 + visibility 라이프사이클 2채널 + tooltipFormat 콜백을 추가.
> - **Sliders/Basic/Advanced/tooltip** (동일 큰 범주, 동일 메커니즘 6단계) — pointer/focus/input 라이프사이클 + bound handler 참조 보관 + 200ms hide delay + `--tooltip-progress` CSS 변수 + `[data-visible]` 토글 — 본 변형은 동일 패턴 답습. 차별점: (1) thumb 2개 → tooltip 2개로 패턴 2채널화, (2) `lowProgress` styleAttrs 추가(Range Standard 답습), (3) `@dragStart`/`@dragEnd`/`@valueChanged` payload에 `thumb` 추가, (4) `tooltipFormat(value, side)` 콜백 슬롯.
> - **Sliders/Centered/Advanced/tooltip** (동일 큰 범주, 동일 메커니즘 6단계) — `tooltipFormat` 콜백 슬롯 + 동일한 6단계 preview script src — 본 변형은 콜백 시그니처를 `(value, side)`로 확장. preview `<script src>` 6단계 verbatim 복사 기준.
> - **Sliders/Centered/Advanced/discreteWithMarks** (직전, 6단계) — preview `<script src>` 6단계 verbatim 복사 기준 (`../`를 6번).
>
> **MD3 / 도메인 근거**: MD3 Range slider는 두 thumb 각각에 value indicator(label tooltip) 표시가 표준화. **양 끝점 동시 가독성**이 필요한 시나리오(가격 범위, 시간대 윈도우, 임계값 상/하한, 화면 영역 너비/높이 범위)에서 각 thumb의 정확한 수치를 drag 중에 즉시 확인할 수 있어야 한다. low/high 두 tooltip은 thumb별 독립 visibility로 "지금 잡고 있는 핸들"의 값에만 시선을 집중시킨다.

---

## 구현 명세

### Mixin

**FieldRenderMixin** + 커스텀 메서드 다수 (`updateSliderValue`, `_updateTooltipPosition`, low/high 각 6종 native handler, low/high `_scheduleHide`/`_clearHide` 4종).

> Mixin 조합은 Range Standard와 동일(FieldRenderMixin 단일). Advanced 분리는 mixin 추가가 아니라 **자체 상태 + native pointer/focus 리스너 12종 라이프사이클 + tooltip 2개 element + visibility 2채널 라이프사이클 + thumb payload 이벤트 3종 + tooltipFormat(side) 콜백**으로 이루어진다. 신규 Mixin 생성 없음.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| slider        | `.slider`                          | 루트 — `data-disabled` 대상 |
| label         | `.slider__label`                   | 라벨 텍스트 (textContent) |
| lowText       | `.slider__value-label--low`        | 낮은 값 표시 (textContent) |
| highText      | `.slider__value-label--high`       | 높은 값 표시 (textContent) |
| lowInput      | `.slider__input--low`              | low용 `input[type=range]` — 속성 + native pointer/focus/input 리스너 부착 대상 |
| highInput     | `.slider__input--high`             | high용 `input[type=range]` — 속성 + native pointer/focus/input 리스너 부착 대상 |
| lowInputMin   | `.slider__input--low`              | low input의 `min` 속성 (elementAttrs) |
| lowInputMax   | `.slider__input--low`              | low input의 `max` 속성 (elementAttrs) |
| lowInputStep  | `.slider__input--low`              | low input의 `step` 속성 (elementAttrs) |
| low           | `.slider__input--low`              | low input의 `value` 속성 (elementAttrs) |
| highInputMin  | `.slider__input--high`             | high input의 `min` 속성 (elementAttrs) |
| highInputMax  | `.slider__input--high`             | high input의 `max` 속성 (elementAttrs) |
| highInputStep | `.slider__input--high`             | high input의 `step` 속성 (elementAttrs) |
| high          | `.slider__input--high`             | high input의 `value` 속성 (elementAttrs) |
| lowProgress   | `.slider__track-active`            | 활성 트랙 좌측 좌표 — `style.left = N%` (styleAttrs) |
| progress      | `.slider__track-active`            | 활성 트랙 너비 — `style.width = N%` (styleAttrs) |
| lowTooltip    | `.slider__tooltip--low`            | **low tooltip element** — `[data-visible]` 토글 + textContent = 현재 low 값 |
| highTooltip   | `.slider__tooltip--high`           | **high tooltip element** — `[data-visible]` 토글 + textContent = 현재 high 값 |
| tooltipHost   | `.slider__track`                   | **tooltip 부모** — `--low-tooltip-progress`/`--high-tooltip-progress` 두 CSS 변수 갱신 대상(0~1) |

### datasetAttrs

(없음 — `slider`의 `data-disabled` / 두 tooltip의 `data-visible`은 컴포넌트가 직접 갱신.)

### elementAttrs

| KEY | VALUE (HTML attribute) |
|-----|-----------------------|
| lowInputMin   | `min`   |
| lowInputMax   | `max`   |
| lowInputStep  | `step`  |
| low           | `value` |
| highInputMin  | `min`   |
| highInputMax  | `max`   |
| highInputStep | `step`  |
| high          | `value` |

### styleAttrs

| KEY | VALUE |
|-----|-------|
| lowProgress | `{ property: 'left',  unit: '%' }` |
| progress    | `{ property: 'width', unit: '%' }` |

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_isLowPointerDown` | `boolean` | `false` | low thumb 드래그 활성 상태 |
| `_isHighPointerDown` | `boolean` | `false` | high thumb 드래그 활성 상태 |
| `_lowPointerId` | `number \| null` | `null` | low thumb pointerdown ↔ pointerup 매칭 |
| `_highPointerId` | `number \| null` | `null` | high thumb pointerdown ↔ pointerup 매칭 |
| `_lowHideTimerId` | `number \| null` | `null` | low tooltip hide delay timer |
| `_highHideTimerId` | `number \| null` | `null` | high tooltip hide delay timer |
| `_hideDelay` | `number` | `200` | 숨김 delay(ms). 페이지 등록 후 변경 가능 |
| `_lowInputEl` | `Element \| null` | `null` | register.js cache. native 리스너 부착 대상 |
| `_highInputEl` | `Element \| null` | `null` | register.js cache. native 리스너 부착 대상 |
| `_lowTooltipEl` | `Element \| null` | `null` | register.js cache. visible 토글 + textContent 갱신 대상 |
| `_highTooltipEl` | `Element \| null` | `null` | register.js cache. visible 토글 + textContent 갱신 대상 |
| `_tooltipHostEl` | `Element \| null` | `null` | register.js cache. CSS 변수 갱신 대상 |
| `_lowPointerDownHandler` / `_lowPointerUpHandler` / `_lowPointerCancelHandler` / `_lowFocusHandler` / `_lowBlurHandler` / `_lowInputHandler` | `Function \| null` | `null` | bound handler 참조 (low) — beforeDestroy에서 정확히 removeEventListener |
| `_highPointerDownHandler` / `_highPointerUpHandler` / `_highPointerCancelHandler` / `_highFocusHandler` / `_highBlurHandler` / `_highInputHandler` | `Function \| null` | `null` | bound handler 참조 (high) — beforeDestroy에서 정확히 removeEventListener |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `sliderInfo` | `this.updateSliderValue` | Range Standard 호환 + `lowTooltipText?` / `highTooltipText?` / `tooltipFormat?` 슬롯 추가 |

### 이벤트 (customEvents — Wkit.bindEvents, 일반 DOM)

(없음 — Wkit.bindEvents의 `input` 이벤트는 native input 핸들러와 발행 순서 충돌이 있어, 본 변형은 native 리스너 단일 채널로 통일. `customEvents = {}`는 라이프사이클 호환성 확보용.)

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@dragStart` | 두 input 중 하나의 pointerdown 시점 1회 | `{ targetInstance, value, thumb: 'low' \| 'high' }` |
| `@dragEnd` | 두 input 중 하나의 pointerup/pointercancel 시점 1회 | `{ targetInstance, value, thumb: 'low' \| 'high' }` |
| `@valueChanged` | 두 input 중 하나의 input 이벤트(드래그/키보드 연속) | `{ targetInstance, event, value, thumb: 'low' \| 'high' }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `updateSliderValue({ response })` | `({response}) => void` | Range Standard 호환. `low ≤ high`/`minDistance` 보정 + `lowProgress`/`progress`(highProgress - lowProgress)/`lowText`/`highText` 파생 + `fieldRender.renderData` 위임 + `data-disabled` 갱신 + 두 tooltip textContent + `--low-tooltip-progress`/`--high-tooltip-progress` 갱신. tooltip textContent는 `lowTooltipText`/`highTooltipText` → `lowText`/`highText` → `String(value)` 순 fallback. `tooltipFormat` 콜백이 있으면 해당 결과로 override |
| `_updateTooltipPosition(low, high, min, max)` | `(number,number,number,number) => void` | `(low-min)/(max-min)`을 `--low-tooltip-progress`, `(high-min)/(max-min)`을 `--high-tooltip-progress`로 setProperty |
| `_handleLowPointerDown(e)` / `_handleHighPointerDown(e)` | `(PointerEvent) => void` | 좌클릭만. 해당 thumb `_isXxxPointerDown=true` + `_clearXxxHide()` + 해당 tooltip visible=true + `@dragStart({ thumb })` 1회 |
| `_handleLowPointerUp(e)` / `_handleHighPointerUp(e)` | `(PointerEvent) => void` | 해당 thumb `_isXxxPointerDown=false` + `@dragEnd({ thumb })` 1회 발행 + `_scheduleXxxHide()` |
| `_handleLowPointerCancel(e)` / `_handleHighPointerCancel(e)` | `(PointerEvent) => void` | pointerup과 동일 |
| `_handleLowFocus(e)` / `_handleHighFocus(e)` | `(FocusEvent) => void` | `_clearXxxHide()` + 해당 tooltip visible=true (키보드 조작용) |
| `_handleLowBlur(e)` / `_handleHighBlur(e)` | `(FocusEvent) => void` | drag 중이면 무시. 아니면 `_scheduleXxxHide()` |
| `_handleLowInput(e)` / `_handleHighInput(e)` | `(InputEvent) => void` | `@valueChanged({ thumb, value })` 발행. (값/위치 갱신은 페이지가 다시 publish 하는 sliderInfo로 단방향 흐름 유지) |
| `_scheduleLowHide()` / `_scheduleHighHide()` | `() => void` | `_hideDelay` 후 해당 tooltip `data-visible='false'` |
| `_clearLowHide()` / `_clearHighHide()` | `() => void` | 해당 hide timer 클리어 |

### 페이지 연결 사례

```
[페이지 onLoad]
   │
   ├─ this.pageDataMappings = [
   │     { topic: 'sliderInfo', datasetInfo: {...} }
   │  ];
   │
   └─ Wkit.onEventBusHandlers({
        '@dragStart':    ({ thumb, value }) => analytics.track('slider_drag_start', { thumb, value }),
        '@dragEnd':      ({ thumb, value }) => analytics.track('slider_drag_end',   { thumb, value }),
        '@valueChanged': ({ event, thumb, targetInstance }) => {
            const next = Number(event.target.value);
            if (thumb === 'low')  state.low  = next;
            if (thumb === 'high') state.high = next;
            // low > high는 컴포넌트가 보정
            targetInstance.updateSliderValue({ response: { ...state } });
        }
      });
```

publish 예 (가격 범위, 단위 포맷):
```javascript
publish('sliderInfo', {
    label: 'Price Range',
    low: 200, high: 800,
    min: 0, max: 1000, step: 10, minDistance: 50,
    disabled: false,
    tooltipFormat: (v, side) => `$${v}`
});
```

### 디자인 변형

| 파일 | 페르소나 | tooltip 시각 차별 + 도메인 컨텍스트 |
|------|---------|-----------------------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 tonal — 두 tooltip 모두 라벤더 그라디언트 chip + 화살표 꼬리. drag 동안 페이드인, 8px 위 떠있음. **도메인**: 운영 분석 콘솔 alert threshold 범위 (low/high 임계값 동시 설정) — 두 임계값을 drag 중 정확히 확인. |
| `02_material`    | B: Material Elevated | 라이트 블루 Filled — 두 tooltip 네모(rounded 4px) + elevation level 3, 핸들 위 12px. **도메인**: 이커머스 가격 필터 범위 (`$200 ~ $800`) — 사용자가 정확한 가격 양 끝점 확인. |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 헤어라인 — 두 tooltip 1px 헤어라인 박스 + Georgia 세리프 숫자. **도메인**: 디자인 툴 inspector의 width range / opacity range — 정확한 수치 양 끝점 확인. |
| `04_operational` | D: Dark Operational  | 다크 시안 컴팩트 — 두 tooltip 모노 폰트 1px cyan 테두리 사각, drag 즉시 인스턴트 표시(transition 60ms). **도메인**: 관제 콘솔의 detection sensitivity 윈도우 (lower/upper bound) — 즉시성 우선, 짧은 hide delay. |

각 페르소나는 두 thumb 중심 위에 tooltip 2개를 띄우며, 각 tooltip이 `[data-visible="true"]`일 때만 opacity 1, `data-visible="false"`이면 opacity 0 + pointer-events: none. drag 시점에는 잡고 있는 thumb의 tooltip만 visible.

### 결정사항

- **wkit.bindEvents 비사용**: native 리스너 단일 채널로 snap/이벤트 발행 순서를 일관되게 유지. (Basic/Advanced/tooltip + Centered/Advanced/tooltip 답습.)
- **setPointerCapture 미사용**: input element는 native range UI를 가지며, drag 중 pointer가 input 영역을 벗어나도 브라우저가 자체 capture를 처리한다.
- **focus/blur로 키보드 조작 흡수**: 두 input 각각 ←/→/Home/End 키보드 조작 시 해당 tooltip만 보이도록.
- **two thumb 독립 visibility**: 한쪽 drag 중에는 그쪽 tooltip만 표시. 양쪽 동시 표시는 keyboard tabbing 중 한쪽 focus → 다른 쪽 focus 전환 사이의 순간뿐(현실적 사용에서 발생 안 함).
- **pointer 충돌 방지**: 두 input이 겹쳐있으나 `pointer-events`가 thumb에서만 활성화되어 있어 어느 thumb를 잡았는지는 native가 결정. 이벤트 핸들러는 input 자체에 부착되어 있으므로 native dispatch 결과대로 정확한 thumb 핸들러가 호출된다.
- **단방향 데이터 흐름**: 컴포넌트는 상태를 소유하지 않는다. native input 이벤트 → `@valueChanged({ thumb })` 발행 → 페이지가 새 low/high 결정 → `sliderInfo` 재publish → `updateSliderValue`에서 lowProgress + progress + 두 tooltip textContent + 두 tooltip 위치 동시 갱신.
- **불변식 보정 위치**: Range Standard 답습 — `updateSliderValue`에서 `low ≤ high` + `minDistance`를 컴포넌트가 보정.
- **tooltipFormat 콜백 시그니처**: `(value, side: 'low' | 'high') => string`. side 파라미터로 페이지가 low/high를 다르게 포맷할 수 있다(예: low는 `'$200'`, high는 `'$800+'`).
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드 조합으로 완결. native pointer 리스너 + visibility 라이프사이클 + bound handler 참조 보관 패턴이 SideSheets/resizable + Basic/Advanced/tooltip + Basic/Advanced/keyboardArrowControl + Centered/Advanced/tooltip + Centered/Advanced/discreteWithMarks + 본 변형에서 6번째 반복 — 향후 `PointerLifecycleMixin` 일반화 후보로 SKILL 보강 메모(반환에 명시).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 6단계 (`Components/Sliders/Range/Advanced/tooltip/preview/...html` → `../`를 6번)
