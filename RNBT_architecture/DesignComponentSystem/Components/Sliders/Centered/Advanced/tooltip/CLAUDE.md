# Sliders/Centered — Advanced / tooltip

## 기능 정의

1. **슬라이더 상태 렌더링 (Centered Standard 호환)** — `sliderInfo` 토픽으로 수신한 객체(`{ label, value, min, max, step, center?, disabled, valueText?, tooltipFormat? }`)를 라벨/값 표시/핸들 위치/활성 트랙(중앙 기준 좌/우 확장)에 반영한다 (Centered Standard와 동일한 FieldRenderMixin + `updateSliderValue` 파생).
   - 활성 트랙은 **중앙 기준점**(`center`, 미지정 시 `(min + max) / 2`)에서 현재 `value`까지 확장된다(`progressLeft%` + `progress%` 두 파생값을 같은 `.slider__track-active` 요소에 적용).
   - `valueText`가 주어지지 않으면 부호(`+`/`-`)를 붙여 자동 포맷한다 (`center` 기준 오프셋 의미).
2. **드래그 중 값 tooltip 표시 (핵심 차별)** — `input[type=range]`의 thumb가 위치한 좌표 위에 `[data-visible="true"]` 토글되는 tooltip을 띄운다. tooltip의 `textContent`는 **부호 포함 포맷된 값**(`+20`, `-3`, `0`).
3. **drag 라이프사이클 동기화** — `pointerdown` 시점 tooltip visible=true + `@dragStart` 1회 발행, `pointerup`/`pointercancel` 시점 200ms delay 후 visible=false + `@dragEnd` 1회 발행. 키보드(`focus`)로 조작할 때도 focus 동안 tooltip을 표시한다(focus → visible, blur → 200ms delay 후 hidden).
4. **tooltip 위치 추적 (Centered 의미 보존)** — input value 변동 시점마다 `((value-min)/(max-min))` 비율을 `--tooltip-progress` CSS 변수로 tooltip 컨테이너에 갱신한다. CSS는 `left: calc(var(--tooltip-progress) * 100%)` + `translateX(-50%)`로 thumb 중심에 정렬한다. **Centered**는 thumb이 좌/우로 모두 이동하므로 비율은 0~1 정상 범위지만, `valueText` 부호 포맷으로 "중앙 기준 오프셋"이라는 의미를 시각적으로 강조한다.
5. **tooltip 부호 포맷 (Centered 핵심)** — `data.valueText`가 주어지지 않으면 `value > center → '+N'` / `value < center → '-N'` / `value == center → '0'`으로 자동 포맷하여 tooltip + value-label 양쪽에 동일하게 반영. 페이지가 단위(`'+20dB'`, `'-3°'`)를 같이 publish할 수 있도록 `valueText` 슬롯을 우선 사용. 추가로 `tooltipFormat?: (value, center) => string` 콜백 슬롯을 받아 페이지가 tooltip 전용 포맷을 분리할 수도 있다(미지정 시 valueText와 동일).
6. **값 변경 이벤트** — `input` 이벤트에서 `@valueChanged` 발행. (Standard `@sliderChanged`와 분리 — Advanced는 의미 명확화를 위해 새 이벤트명).

> **Standard와의 분리 정당성**:
> - **자체 상태 6종** — `_isPointerDown` / `_pointerId` / `_hideTimerId` / `_inputEl` / `_tooltipEl` / `_tooltipHostEl`(pointer 4종 + focus/blur + input 참조). Centered Standard는 stateless.
> - **새 이벤트 3종** — `@dragStart` / `@dragEnd` (라이프사이클) + `@valueChanged` (Centered Standard `@sliderChanged` 대체 — 의미 명확화). Standard는 `@sliderChanged` 1종만.
> - **새 cssSelectors KEY 2종** — `tooltip`(visible 토글 + textContent) + `tooltipHost`(`--tooltip-progress` CSS 변수 갱신 대상). Centered Standard에는 없음.
> - **자체 메서드 9종** — `updateSliderValue`(확장 — 부호 포맷 + tooltip 동시 갱신) / `_handlePointerDown` / `_handlePointerUp` / `_handlePointerCancel` / `_handleFocus` / `_handleBlur` / `_handleInput` / `_updateTooltipPosition` / `_scheduleHide`/`_clearHide`.
> - **input 외 native pointer/focus 리스너 라이프사이클** — Centered Standard는 customEvents의 `input` 이벤트만 사용하지만, 본 변형은 input element에 native pointerdown/pointerup/pointercancel/focus/blur/input 6종을 직접 부착(setPointerCapture 없이, input 자체에 부착하여 thumb drag/keyboard 양쪽을 흡수). beforeDestroy에서 명시적으로 detach.
> - **tooltipFormat 콜백 슬롯** — Centered 의미상 부호 포맷이 기본이지만, 페이지가 tooltip 전용 포맷(예: `'+20.0 dB'`)을 분리할 수 있는 단방향 콜백 슬롯을 받는다.
>
> 위 6축은 동일 register.js로 표현 불가 → Centered Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**:
> - **Sliders/Centered/Standard** (직전, 같은 컴포넌트) — FieldRenderMixin + `updateSliderValue` 파생(progressLeft + progress + 부호 valueText) + `input` 이벤트로 양방향 양식. 본 변형은 동일 토대 위에 tooltip element + native pointer/focus 리스너 6종 + visibility 라이프사이클 + tooltipFormat 콜백을 추가.
> - **Sliders/Basic/Advanced/tooltip** (동일 큰 범주, 동일 메커니즘 6단계) — pointer/focus/input 라이프사이클 + bound handler 참조 보관 + 200ms hide delay + `--tooltip-progress` CSS 변수 + `[data-visible]` 토글 — 본 변형은 동일 패턴 답습. 차별점: (1) 부호 포맷 valueText, (2) `progressLeft` styleAttrs 추가, (3) `tooltipFormat` 콜백 슬롯.
> - **Sliders/Basic/Advanced/keyboardArrowControl** (직전, 같은 큰 범주, 6단계) — preview `<script src>` 6단계 verbatim 복사 기준.
>
> **MD3 / 도메인 근거**: MD3 Centered slider는 thumb 위에 **value indicator**(label tooltip)를 표시하여 "현재 오프셋 부호+크기"를 즉시 확인할 수 있게 한다. EQ gain(±12 dB) / Pan(L100~R100) / 노출 보정(EV ±3) / 색온도 시프트(±10 mireds) 등 **중앙 기준 양/음 오프셋이 의미를 가지는 시나리오**에서는 부호 포함 tooltip이 필수.

---

## 구현 명세

### Mixin

**FieldRenderMixin** + 커스텀 메서드 9종 (`updateSliderValue`, `_handlePointerDown`, `_handlePointerUp`, `_handlePointerCancel`, `_handleFocus`, `_handleBlur`, `_handleInput`, `_updateTooltipPosition`, `_scheduleHide`/`_clearHide`).

> Mixin 조합은 Centered Standard와 동일(FieldRenderMixin 단일). Advanced 분리는 mixin 추가가 아니라 **자체 상태 + native pointer/focus 리스너 라이프사이클 + tooltip element + visibility 라이프사이클 + 부호 포맷 + tooltipFormat 콜백 + 추가 이벤트 3종**으로 이루어진다. 신규 Mixin 생성 없음.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| slider        | `.slider`                  | 루트 — `data-disabled` 대상 + 이벤트 매핑 컨테이너 |
| label         | `.slider__label`           | 라벨 텍스트 (textContent) |
| valueText     | `.slider__value-label`     | 포맷된 현재 값 (textContent, 부호 포함) |
| input         | `.slider__input`           | `input[type=range]` — value/min/max/step 속성 + native pointer/focus/input 리스너 부착 대상 |
| min           | `.slider__input`           | input의 `min` 속성 (elementAttrs) |
| max           | `.slider__input`           | input의 `max` 속성 (elementAttrs) |
| step          | `.slider__input`           | input의 `step` 속성 (elementAttrs) |
| value         | `.slider__input`           | input의 `value` 속성 (elementAttrs) |
| progress      | `.slider__track-active`    | 활성 트랙 너비 — `style.width = N%` (styleAttrs) |
| progressLeft  | `.slider__track-active`    | 활성 트랙 좌측 좌표 — `style.left  = N%` (styleAttrs) |
| tooltip       | `.slider__tooltip`         | **tooltip element** — `[data-visible]` 토글 + textContent = 부호 포맷된 값 |
| tooltipHost   | `.slider__track`           | **tooltip 부모** — `--tooltip-progress` CSS 변수 갱신 대상(0~1) |

### datasetAttrs

(없음 — `slider`의 `data-disabled` / `tooltip`의 `data-visible`은 컴포넌트가 직접 갱신하며 KEY로 관리하지 않는다.)

### elementAttrs

| KEY | VALUE (HTML attribute) |
|-----|-----------------------|
| min   | `min`   |
| max   | `max`   |
| step  | `step`  |
| value | `value` |

### styleAttrs

| KEY | VALUE |
|-----|-------|
| progress      | `{ property: 'width', unit: '%' }` |
| progressLeft  | `{ property: 'left',  unit: '%' }` |

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_isPointerDown` | `boolean` | `false` | 드래그 활성 상태 |
| `_pointerId` | `number \| null` | `null` | pointerdown ↔ pointerup 매칭 |
| `_hideTimerId` | `number \| null` | `null` | drag/blur 종료 후 200ms hide delay timer |
| `_hideDelay` | `number` | `200` | 숨김 delay(ms). 페이지 등록 후 변경 가능 |
| `_inputEl` | `Element \| null` | `null` | register.js에서 cache. native 리스너 부착 대상 |
| `_tooltipEl` | `Element \| null` | `null` | register.js에서 cache. visible 토글 + textContent 갱신 대상 |
| `_tooltipHostEl` | `Element \| null` | `null` | register.js에서 cache. `--tooltip-progress` CSS 변수 갱신 대상 |
| `_pointerDownHandler` / `_pointerUpHandler` / `_pointerCancelHandler` / `_focusHandler` / `_blurHandler` / `_inputHandler` | `Function \| null` | `null` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `sliderInfo` | `this.updateSliderValue` | Centered Standard 호환 + `tooltipFormat?` 슬롯 추가 |

### 이벤트 (customEvents — Wkit.bindEvents, 일반 DOM)

(없음 — Wkit.bindEvents의 `input` 이벤트로는 valueText 갱신 이전 / native input 핸들러와 발행 순서 충돌이 있어, 본 변형은 native 리스너 단일 채널로 통일한다. 즉 모든 이벤트 발행은 native 리스너에서 `Weventbus.emit`으로 한다.)

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@dragStart` | pointerdown(드래그 시작) 시점 1회 | `{ targetInstance, value }` |
| `@dragEnd` | pointerup/pointercancel 시점 1회 | `{ targetInstance, value }` |
| `@valueChanged` | input 이벤트(드래그/키보드 연속) | `{ targetInstance, event, value }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `updateSliderValue({ response })` | `({response}) => void` | Centered Standard 호환. `progressLeft`/`progress`/부호 포맷 `valueText` 파생 후 `fieldRender.renderData` 위임 + `data-disabled` 갱신 + tooltip textContent(부호 포함) + `--tooltip-progress` 갱신. `tooltipFormat` 콜백이 있으면 tooltip 텍스트는 콜백 결과로 override |
| `_updateTooltipPosition(value, min, max)` | `(number,number,number) => void` | `(value-min)/(max-min)` 비율을 `_tooltipHostEl.style.setProperty('--tooltip-progress', ratio)` |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | 좌클릭만. `_isPointerDown=true` + `_clearHide()` + tooltip visible=true + `@dragStart` 1회 발행 |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | `_isPointerDown=false` + `@dragEnd` 1회 발행 + `_scheduleHide()` |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | pointerup과 동일 |
| `_handleFocus(e)` | `(FocusEvent) => void` | `_clearHide()` + tooltip visible=true (키보드 조작용) |
| `_handleBlur(e)` | `(FocusEvent) => void` | drag 중이면 무시. 아니면 `_scheduleHide()` |
| `_handleInput(e)` | `(InputEvent) => void` | `@valueChanged` 발행. (값/위치 갱신은 페이지가 다시 publish 하는 sliderInfo로 단방향 흐름 유지) |
| `_scheduleHide()` | `() => void` | `_hideDelay` 후 `_tooltipEl.dataset.visible = 'false'` |
| `_clearHide()` | `() => void` | `_hideTimerId` 클리어 |

부호 포맷 규칙 (Centered):

```
center     = Number.isFinite(data.center) ? data.center : (min + max) / 2
defaultText =
  value > center  →  '+' + (value - center)
  value < center  →  '-' + (center - value)
  value === center → '0'
displayText  = data.valueText ?? defaultText
tooltipText  = typeof data.tooltipFormat === 'function'
                  ? data.tooltipFormat(value, center)
                  : displayText
```

### 페이지 연결 사례

```
[페이지 onLoad]
   │
   ├─ this.pageDataMappings = [
   │     { topic: 'sliderInfo', datasetInfo: {...} }
   │  ];
   │
   └─ Wkit.onEventBusHandlers({
        '@dragStart':    ({ value }) => analytics.track('slider_drag_start', { value }),
        '@dragEnd':      ({ value }) => analytics.track('slider_drag_end', { value }),
        '@valueChanged': ({ event, targetInstance }) => {
            const next = Number(event.target.value);
            state.value = next;
            // valueText는 컴포넌트의 부호 포맷(자동) 또는 페이지 단위 포맷
            targetInstance.updateSliderValue({ response: { ...state } });
        }
      });
```

publish 예 (EQ gain ±12 dB):
```javascript
publish('sliderInfo', {
    label: 'EQ Gain',
    value: 3,
    min: -12, max: 12, step: 1, center: 0,
    disabled: false,
    tooltipFormat: (v, c) => {
        const offset = v - c;
        const sign = offset > 0 ? '+' : offset < 0 ? '' : '';
        return `${sign}${offset.toFixed(1)} dB`;
    }
});
```

### 디자인 변형

| 파일 | 페르소나 | tooltip 시각 차별 + 도메인 컨텍스트 |
|------|---------|-----------------------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 tonal — tooltip은 라벤더 그라디언트 chip + 화살표 꼬리. drag 동안 페이드인, 8px 위 떠있음. **도메인**: 오디오 콘솔의 EQ gain 슬라이더 (±12 dB, 0=flat) — drag 중 정확한 부호+크기(±3.0 dB) 확인 필수. |
| `02_material`    | B: Material Elevated | 라이트 블루 Filled — tooltip은 네모(rounded 4px) + elevation level 3, 핸들 위 12px. **도메인**: 카메라 노출 보정 EV(±3, 0=auto) — 사용자가 정확한 stop 값(+1.3 EV)을 확인하며 조정. |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 헤어라인 — tooltip은 1px 헤어라인 박스 + Georgia 세리프 숫자. **도메인**: 디자인 툴 색온도 보정(±10 mireds, 0=원본) — 정확한 mired 시프트 확인. |
| `04_operational` | D: Dark Operational  | 다크 시안 컴팩트 — tooltip은 모노 폰트 1px cyan 테두리 사각, drag 즉시 인스턴트 표시(transition 60ms). **도메인**: 관제 콘솔의 pan offset(L100~R100, 0=center) — 즉시성 우선, 짧은 hide delay. |

각 페르소나는 thumb 중심 위에 tooltip을 띄우며, `[data-visible="true"]`일 때만 opacity 1, `data-visible="false"`이면 opacity 0 + pointer-events: none. tooltip textContent는 항상 부호(`+`/`-`/`0`) 포함.

### 결정사항

- **wkit.bindEvents 비사용**: `customEvents` 채널과 native pointer 리스너의 발행 순서가 디자인적으로 일관성을 잃어, 본 변형은 native 리스너로 단일화한다. `customEvents = {}` (빈 객체)는 유지하여 라이프사이클 호환성 확보. (Basic/Advanced/tooltip 답습.)
- **setPointerCapture 미사용**: input element는 native range UI를 가지며, drag 중 pointer가 input 영역을 벗어나도 브라우저가 자체 capture를 처리한다. (Basic/Advanced/tooltip 답습.)
- **focus/blur로 키보드 조작 흡수**: ←/→/Home/End 키보드 조작도 tooltip이 보여야 사용성 보장. focus 동안 tooltip 유지 + blur 후 200ms delay로 숨김.
- **단방향 데이터 흐름**: 컴포넌트는 상태를 소유하지 않는다. native input 이벤트 → `@valueChanged` 발행 → 페이지가 새 `value` 결정 → `sliderInfo` 재publish → `updateSliderValue`에서 progressLeft + progress + tooltip textContent + tooltip 위치 동시 갱신.
- **부호 포맷 디폴트**: Centered Standard와 동일하게 `valueText` 미지정 시 `±N` 자동 포맷. tooltip textContent에도 동일 규칙 적용.
- **tooltipFormat 콜백 슬롯**: 페이지가 tooltip 전용 포맷(단위 포함, 소수점 변환 등)을 분리하고 싶을 때 1개 함수 슬롯으로 처리. valueText는 헤더 표시값, tooltipFormat은 thumb 위 표시값을 분리 — Centered 의미를 페이지가 도메인별로 유연하게 표현.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드 조합으로 완결. native pointer 리스너 + visibility 라이프사이클 + bound handler 참조 보관 패턴이 SideSheets/resizable + Basic/Advanced/tooltip + keyboardArrowControl + 본 변형에서 5번째 반복 — 향후 `PointerLifecycleMixin` 일반화 후보로 SKILL 보강 메모(반환에 명시).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 6단계 (`Components/Sliders/Centered/Advanced/tooltip/preview/...html` → `../`를 6번)
