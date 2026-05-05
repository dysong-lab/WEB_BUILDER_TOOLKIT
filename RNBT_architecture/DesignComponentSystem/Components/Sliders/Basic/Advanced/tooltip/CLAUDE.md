# Sliders/Basic — Advanced / tooltip

## 기능 정의

1. **슬라이더 상태 렌더링 (Standard 호환)** — `sliderInfo` 토픽으로 수신한 객체(`{ label, value, min, max, step, disabled, valueText? }`)를 라벨/값 표시/핸들 위치/활성 트랙 길이에 반영한다 (Standard와 동일한 FieldRenderMixin + `updateSliderValue` 파생).
2. **드래그 중 값 tooltip 표시 (핵심 차별)** — `input[type=range]`의 thumb가 위치한 좌표 위에 `[data-visible="true"]` 토글되는 tooltip을 띄운다. tooltip의 `textContent`는 현재 값(또는 `valueText`).
3. **drag 라이프사이클 동기화** — `pointerdown` 시점 tooltip visible=true + `@dragStart` 1회 발행, `pointerup`/`pointercancel` 시점 200ms delay 후 visible=false + `@dragEnd` 1회 발행. 키보드(`focus`)로 조작할 때도 focus 동안 tooltip을 표시한다(focus → visible, blur → 200ms delay 후 hidden).
4. **tooltip 위치 추적** — input value 변동 시점마다 `((value-min)/(max-min))` 비율을 `--tooltip-progress` CSS 변수로 tooltip 컨테이너에 갱신한다. CSS는 `left: calc(var(--tooltip-progress) * 100%)` + `translateX(-50%)`로 thumb 중심에 정렬한다(thumb 폭은 페르소나마다 6~20px이므로 픽셀 보정은 컴포넌트가 아닌 CSS의 `padding`/`calc`로 흡수).
5. **값 변경 이벤트 (Standard 호환)** — `input` 이벤트에서 `@valueChanged` 발행. (Standard `@sliderChanged`와 분리 — Advanced는 의미 명확화를 위해 새 이벤트명).

> **Standard와의 분리 정당성**:
> - **자체 상태 6종** — `_isPointerDown` / `_pointerId` / `_hideTimerId` / `_inputEl` / `_tooltipEl` / `_handlers`(pointer 4종 + focus/blur + input 참조). Standard는 stateless.
> - **새 이벤트 3종** — `@dragStart` / `@dragEnd` (라이프사이클) + `@valueChanged` (Standard `@sliderChanged` 대체 — 의미 명확화). Standard는 `@sliderChanged` 1종만.
> - **새 cssSelectors KEY 2종** — `tooltip`(visible 토글 + textContent) + `tooltipHost`(`--tooltip-progress` CSS 변수 갱신 대상). Standard에는 없음.
> - **자체 메서드 5종** — `_handlePointerDown` / `_handlePointerUp` / `_handlePointerCancel` / `_handleFocus` / `_handleBlur` / `_updateTooltipPosition` / `_scheduleHide` / `_clearHide`.
> - **input 외 native pointer/focus 리스너 라이프사이클** — Standard는 customEvents의 `input` 이벤트만 사용하지만, 본 변형은 input element에 native pointerdown/pointerup/pointercancel/focus/blur 5종을 직접 부착(setPointerCapture 없이, input 자체에 부착하여 thumb drag/keyboard 양쪽을 흡수). beforeDestroy에서 명시적으로 detach.
>
> 위 5축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**:
> - **Sliders/Basic/Standard** (직전, 같은 컴포넌트) — FieldRenderMixin + `updateSliderValue` 파생 + `input` 이벤트로 양방향 양식. 본 변형은 동일 토대 위에 tooltip element + native pointer/focus 리스너 5종 + visibility 라이프사이클을 추가.
> - **Sheets/SideSheets/Advanced/resizable** (직전 큰 범주, 동일 회기) — Shadow DOM 내부 native pointer 리스너 4종 라이프사이클 + setPointerCapture + bound handler 참조 보관 + beforeDestroy 명시 detach. 본 변형은 일반 DOM이므로 setPointerCapture는 생략하지만, **bound handler 참조 보관 + 5종 detach** 패턴은 답습. preview `<script src>` 깊이도 동일 6단계.
>
> **MD3 / 도메인 근거**: MD3 Slider의 "Discrete slider"는 thumb 위에 **value indicator**(label tooltip)를 drag/focus 시점에 표시하는 패턴이 표준화되어 있다. 볼륨/밝기/필터 임계값 조절처럼 **사용자가 정확한 수치를 확인하면서 조작**해야 하는 시나리오에서 valueText의 가독성 확보가 필수다.

---

## 구현 명세

### Mixin

**FieldRenderMixin** + 커스텀 메서드 8종 (`updateSliderValue`, `_handlePointerDown`, `_handlePointerUp`, `_handlePointerCancel`, `_handleFocus`, `_handleBlur`, `_updateTooltipPosition`, `_scheduleHide`/`_clearHide`).

> Mixin 조합은 Standard와 동일(FieldRenderMixin 단일). Advanced 분리는 mixin 추가가 아니라 **자체 상태 + native pointer/focus 리스너 라이프사이클 + tooltip element + visibility 라이프사이클 + 추가 이벤트 3종**으로 이루어진다. 신규 Mixin 생성 없음.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| slider       | `.slider`                | 루트 — `data-disabled` 대상 + 이벤트 매핑 컨테이너 |
| label        | `.slider__label`         | 라벨 텍스트 (textContent) |
| valueText    | `.slider__value-label`   | 포맷된 현재 값 (textContent) |
| input        | `.slider__input`         | `input[type=range]` — value/min/max/step 속성 + native pointer/focus/input 리스너 부착 대상 |
| min          | `.slider__input`         | input의 `min` 속성 대상 (elementAttrs) |
| max          | `.slider__input`         | input의 `max` 속성 대상 (elementAttrs) |
| step         | `.slider__input`         | input의 `step` 속성 대상 (elementAttrs) |
| value        | `.slider__input`         | input의 `value` 속성 대상 (elementAttrs) |
| progress     | `.slider__track-active`  | 활성 트랙 — `style.width = N%` (styleAttrs) |
| tooltip      | `.slider__tooltip`       | **tooltip element** — `[data-visible]` 토글 + textContent = 현재 값 |
| tooltipHost  | `.slider__track`         | **tooltip 부모** — `--tooltip-progress` CSS 변수 갱신 대상(0~1) |

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
| progress | `{ property: 'width', unit: '%' }` |

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
| `sliderInfo` | `this.updateSliderValue` | Standard 호환 |

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
| `updateSliderValue({ response })` | `({response}) => void` | Standard 호환. `progress`/`valueText` 파생 후 `fieldRender.renderData` 위임 + `data-disabled` 갱신 + tooltip textContent + `--tooltip-progress` 갱신 |
| `_updateTooltipPosition(value, min, max)` | `(number,number,number) => void` | `(value-min)/(max-min)` 비율을 `_tooltipHostEl.style.setProperty('--tooltip-progress', ratio)` |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | 좌클릭만. `_isPointerDown=true` + `_clearHide()` + tooltip visible=true + `@dragStart` 1회 발행 |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | `_isPointerDown=false` + `@dragEnd` 1회 발행 + `_scheduleHide()` |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | pointerup과 동일 |
| `_handleFocus(e)` | `(FocusEvent) => void` | `_clearHide()` + tooltip visible=true (키보드 조작용) |
| `_handleBlur(e)` | `(FocusEvent) => void` | `_scheduleHide()` |
| `_handleInput(e)` | `(InputEvent) => void` | `@valueChanged` 발행. (값/위치 갱신은 페이지가 다시 publish 하는 sliderInfo로 단방향 흐름 유지) |
| `_scheduleHide()` | `() => void` | `_hideDelay` 후 `_tooltipEl.dataset.visible = 'false'` |
| `_clearHide()` | `() => void` | `_hideTimerId` 클리어 |

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
            state.valueText = `${next}%`;
            targetInstance.updateSliderValue({ response: { ...state } });
        }
      });
```

### 디자인 변형

| 파일 | 페르소나 | tooltip 시각 차별 + 도메인 컨텍스트 |
|------|---------|-----------------------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 tonal — tooltip은 라벤더 그라디언트 chip + 화살표(꼬리). drag 동안 페이드인, 8px 위 떠있음. **도메인**: 운영 분석 콘솔에서 alert threshold 슬라이더 — 드래그 중 정확한 임계값 확인이 필수. |
| `02_material`    | B: Material Elevated | 라이트 블루 Filled — tooltip은 네모(rounded 4px) + elevation level 3, 핸들 위 12px. **도메인**: 미디어 플레이어 볼륨 슬라이더 — 사용자가 정확한 % 확인하며 조정. |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 헤어라인 — tooltip은 1px 헤어라인 박스 + Georgia 세리프 숫자. **도메인**: 디자인 툴 inspector의 opacity/scale 슬라이더 — 정확한 수치 입력 보조. |
| `04_operational` | D: Dark Operational  | 다크 시안 컴팩트 — tooltip은 모노 폰트 1px cyan 테두리 사각, drag 즉시 인스턴트 표시(transition 60ms). **도메인**: 관제 콘솔의 detection sensitivity 슬라이더 — 즉시성 우선, 짧은 hide delay. |

각 페르소나는 thumb 중심 위에 tooltip을 띄우며, `[data-visible="true"]`일 때만 opacity 1, `data-visible="false"`이면 opacity 0 + pointer-events: none.

### 결정사항

- **wkit.bindEvents 비사용**: `customEvents` 채널과 native pointer 리스너의 발행 순서가 디자인적으로 일관성을 잃어, 본 변형은 native 리스너로 단일화한다. `customEvents = {}` (빈 객체)는 유지하여 라이프사이클 호환성 확보.
- **setPointerCapture 미사용**: input element는 native range UI를 가지며, drag 중 pointer가 input 영역을 벗어나도 브라우저가 자체 capture를 처리한다. 추가 capture는 input의 native 동작과 충돌할 수 있으므로 의도적으로 생략.
- **focus/blur로 키보드 조작 흡수**: ←/→/Home/End 키보드 조작도 tooltip이 보여야 사용성 보장. focus 동안 tooltip 유지 + blur 후 200ms delay로 숨김.
- **단방향 데이터 흐름**: 컴포넌트는 상태를 소유하지 않는다. native input 이벤트 → `@valueChanged` 발행 → 페이지가 새 `value` 결정 → `sliderInfo` 재publish → `updateSliderValue`에서 progress + tooltip textContent + tooltip 위치 동시 갱신.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드 조합으로 완결. native pointer 리스너 + visibility 라이프사이클 + bound handler 참조 보관 패턴이 SideSheets/resizable과 4번째 반복 — 향후 `PointerLifecycleMixin` 일반화 후보로 SKILL 보강 메모(반환에 명시).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 6단계 (`Components/Sliders/Basic/Advanced/tooltip/preview/...html` → ../를 6번)
