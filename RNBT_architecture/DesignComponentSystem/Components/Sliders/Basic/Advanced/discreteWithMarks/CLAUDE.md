# Sliders/Basic — Advanced / discreteWithMarks

## 기능 정의

1. **슬라이더 상태 렌더링 (Standard 호환)** — `sliderInfo` 토픽으로 수신한 객체(`{ label, value, min, max, step, disabled, valueText?, marks?, showMarkLabels? }`)를 라벨/값 표시/핸들 위치/활성 트랙 길이에 반영한다 (Standard와 동일한 FieldRenderMixin + `updateSliderValue` 파생).
2. **이산 마크 포인트 동적 렌더링 (핵심 차별)** — `marks: [0, 25, 50, 75, 100]`(숫자 배열) 또는 `marks: [{value, label}]`(객체 배열) 형식의 mark 정의를 받아, mark 컨테이너에 dot 요소를 동적 생성한다(`<template>` cloneNode). 각 dot은 `(markValue - min) / (max - min)` 비율로 left 위치 결정. `showMarkLabels=true`이면 dot 아래에 라벨 텍스트도 표시.
3. **mark dot active/inactive 상태 갱신** — 현재 value 이하의 mark는 `[data-active="true"]` (활성 트랙 색), 초과하는 mark는 `[data-active="false"]` (비활성 색). `updateSliderValue` 호출 시점마다 일괄 갱신.
4. **snap to nearest mark 로직 (핵심 차별)** — 비균등 mark 배열(예: `[0, 10, 30, 70, 100]`)은 native `step` 속성으로 표현 불가. 드래그 종료(`pointerup`/`pointercancel`) 또는 키보드 입력 종료(`keyup`) 시점에 가장 가까운 mark.value를 찾아 input.value 갱신 + `@valueChanged` 재발행 + `@markSnapped` 발행. 드래그 중에는 snap하지 않고 자유 이동(연속 input 이벤트는 그대로 통과).
5. **값 변경 이벤트 (Standard 호환 + 신규 1종)** — `input` 이벤트(드래그/키보드 연속) 시점에 `@valueChanged` 발행. snap 적용 시점에 `@markSnapped` 추가 발행 (payload: `{ targetInstance, value, markIndex }`).

> **Standard와의 분리 정당성**:
> - **자체 상태 7종** — `_marks`(정규화된 `[{value, label}]` 배열) / `_inputEl` / `_marksContainerEl` / `_isPointerDown` / `_pointerId` / `_lastEmittedValue`(snap 결과 디듀프) / `_handlers`(pointer 3종 + key 1종 + input 1종 참조). Standard는 stateless.
> - **새 이벤트 2종** — `@valueChanged` (Standard `@sliderChanged` 대체 — 의미 명확화) + `@markSnapped` (snap 시점 1회). Standard는 `@sliderChanged` 1종.
> - **새 cssSelectors KEY 3종** — `marks`(dot 컨테이너) + `markTemplate`(`<template id>`) + `markDot`(생성된 dot의 클래스). Standard에는 없음.
> - **자체 메서드 6종** — `updateSliderValue`(확장) / `_normalizeMarks` / `_renderMarks` / `_updateMarkActiveStates` / `_snapToNearestMark` / `_handlePointerDown`/`_handlePointerUp`/`_handlePointerCancel`/`_handleKeyUp`/`_handleInput`.
> - **DOM 동적 생성** — Standard는 HTML이 모든 요소를 갖지만, 본 변형은 mark dot/label을 page-side `marks` 데이터에 맞춰 매번 다시 그린다(템플릿 cloneNode). beforeDestroy에서 컨테이너 비우기 + native 리스너 detach.
>
> 위 5축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**:
> - **Sliders/Basic/Standard** (직전, 같은 컴포넌트) — FieldRenderMixin + `updateSliderValue` 파생 + `input` 이벤트로 양방향 양식. 본 변형은 동일 토대 위에 mark 배열 정규화 + 동적 dot 렌더링 + snap 로직 + native pointer/key 리스너를 추가.
> - **Sliders/Basic/Advanced/tooltip** (직전, 동일 컴포넌트, 6단계, FieldRender + 자체 메서드) — bound handler 참조 보관 + native pointer 라이프사이클 + beforeDestroy 명시 detach 패턴 + preview `<script src>` 6단계. 본 변형도 동일 패턴을 답습.
>
> **MD3 / 도메인 근거**: MD3 Slider의 "Discrete slider"는 valueIndicator + tickMarks를 표준화한다. 평점(1~5), T-shirt 사이즈(XS/S/M/L/XL), 음질 quality preset(Low/Mid/High/Lossless), priority level처럼 **이산 선택지를 시각화 + snap 강제**가 필요한 시나리오에서 mark+snap 조합이 필수. 비균등 mark는 native step으로 표현 불가하므로 자체 snap 로직 필수.

---

## 구현 명세

### Mixin

**FieldRenderMixin** + 커스텀 메서드 10종 (`updateSliderValue`, `_normalizeMarks`, `_renderMarks`, `_updateMarkActiveStates`, `_snapToNearestMark`, `_handlePointerDown`, `_handlePointerUp`, `_handlePointerCancel`, `_handleKeyUp`, `_handleInput`).

> Mixin 조합은 Standard와 동일(FieldRenderMixin 단일). Advanced 분리는 mixin 추가가 아니라 **자체 상태 + native 리스너 라이프사이클 + 동적 dot DOM + snap 로직 + 추가 이벤트 1종**으로 이루어진다. 신규 Mixin 생성 없음.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| slider        | `.slider`                | 루트 — `data-disabled` 대상 |
| label         | `.slider__label`         | 라벨 텍스트 (textContent) |
| valueText     | `.slider__value-label`   | 포맷된 현재 값 (textContent) |
| input         | `.slider__input`         | `input[type=range]` — value/min/max/step 속성 + native pointer/key/input 리스너 부착 대상 |
| min           | `.slider__input`         | input의 `min` 속성 대상 (elementAttrs) |
| max           | `.slider__input`         | input의 `max` 속성 대상 (elementAttrs) |
| step          | `.slider__input`         | input의 `step` 속성 대상 (elementAttrs) |
| value         | `.slider__input`         | input의 `value` 속성 대상 (elementAttrs) |
| progress      | `.slider__track-active`  | 활성 트랙 — `style.width = N%` (styleAttrs) |
| marks         | `.slider__marks`         | **mark dot 컨테이너** — `_renderMarks`가 dot/label 생성 대상 |
| markTemplate  | `#slider-mark-template`  | **template 태그** — cloneNode 원본 |
| markDot       | `.slider__mark`          | **생성된 dot 클래스** — `[data-active]` 토글 대상 |

### datasetAttrs

(없음 — `slider`의 `data-disabled` / `markDot`의 `data-active`는 컴포넌트가 직접 갱신하며 KEY로 관리하지 않는다.)

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
| `_marks` | `Array<{value, label?}>` | `[]` | 정규화된 mark 배열 (숫자 배열 → 객체 배열로 변환) |
| `_showMarkLabels` | `boolean` | `false` | 라벨 표시 여부 (마지막 publish 값 보존) |
| `_inputEl` | `Element \| null` | `null` | register.js에서 cache. native 리스너 부착 대상 |
| `_marksContainerEl` | `Element \| null` | `null` | register.js에서 cache. dot 렌더링 대상 |
| `_markTemplateEl` | `HTMLTemplateElement \| null` | `null` | register.js에서 cache. cloneNode 원본 |
| `_isPointerDown` | `boolean` | `false` | 드래그 활성 — pointerup snap 가드 |
| `_pointerId` | `number \| null` | `null` | pointerdown ↔ pointerup 매칭 |
| `_lastEmittedValue` | `number \| null` | `null` | snap 적용 후 동일 value 중복 emit 방지 |
| `_pointerDownHandler` / `_pointerUpHandler` / `_pointerCancelHandler` / `_keyUpHandler` / `_inputHandler` | `Function \| null` | `null` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `sliderInfo` | `this.updateSliderValue` | Standard 호환. payload에 `marks?` / `showMarkLabels?` 추가 슬롯. |

### 이벤트 (customEvents — Wkit.bindEvents, 일반 DOM)

(없음 — tooltip 변형과 동일 이유. native 리스너 단일 채널로 통일하여 snap 적용/이벤트 발행 순서를 일관되게 유지. `customEvents = {}` (빈 객체)는 라이프사이클 호환성 확보용으로 유지.)

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@valueChanged` | input 이벤트(드래그/키보드 연속) | `{ targetInstance, event, value }` |
| `@markSnapped` | pointerup/cancel/keyup 시점 snap 적용 후 1회 (snap 결과가 직전 emit과 다를 때만) | `{ targetInstance, value, markIndex }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `updateSliderValue({ response })` | `({response}) => void` | Standard 호환 + `marks`/`showMarkLabels` 슬롯 흡수. `progress`/`valueText` 파생 + `fieldRender.renderData` 위임 + `data-disabled` 갱신 + `_marks` 정규화/저장 + `_renderMarks` 호출 + `_updateMarkActiveStates` 호출 |
| `_normalizeMarks(marksInput, min, max)` | `(unknown, number, number) => Array<{value, label}>` | 숫자 배열 → 객체 배열 변환. min/max 범위 외 값 필터링. value 오름차순 정렬 |
| `_renderMarks()` | `() => void` | 컨테이너 비우기 + `_marks` 순회 + template cloneNode + position(%) + label(옵션) 채우기 + appendChild |
| `_updateMarkActiveStates(value, min, max)` | `(number, number, number) => void` | 컨테이너 내 모든 `.slider__mark`를 순회하며 `_marks[i].value <= value`이면 `data-active="true"`, 아니면 `false` |
| `_snapToNearestMark(rawValue)` | `(number) => {value, markIndex} \| null` | `_marks`가 비어있으면 null. 그렇지 않으면 `Math.abs(mark.value - rawValue)` 최소인 mark 반환 |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | 좌클릭만. `_isPointerDown=true` + `_pointerId` 저장 |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | `_isPointerDown=false` + `_snapToNearestMark` 적용 → input.value 갱신 + `@valueChanged`(드래그 종료 위치) + `@markSnapped` 발행 |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | pointerup과 동일 |
| `_handleKeyUp(e)` | `(KeyboardEvent) => void` | ←/→/Home/End 등으로 값이 바뀐 후 snap 적용 |
| `_handleInput(e)` | `(InputEvent) => void` | `@valueChanged` 발행. (드래그 중 자유 이동 — snap은 드래그 종료 시점) |

### 페이지 연결 사례

```
[페이지 onLoad]
   │
   ├─ this.pageDataMappings = [
   │     { topic: 'sliderInfo', datasetInfo: {...} }
   │  ];
   │
   └─ Wkit.onEventBusHandlers({
        '@valueChanged': ({ event, targetInstance }) => {
            const next = Number(event.target.value);
            state.value = next;
            targetInstance.updateSliderValue({ response: { ...state } });
        },
        '@markSnapped': ({ value, markIndex }) => {
            analytics.track('mark_snapped', { value, markIndex });
            state.value = value;
            // snap 결과는 이미 컴포넌트가 input.value를 갱신했으므로 추가 publish는 선택
        }
      });
```

publish 예 (균등 5단계):
```javascript
publish('sliderInfo', {
    label: 'Rating',
    value: 3,
    min: 1, max: 5, step: 1,
    marks: [1, 2, 3, 4, 5],
    showMarkLabels: true
});
```

publish 예 (비균등 + 라벨):
```javascript
publish('sliderInfo', {
    label: 'Quality Preset',
    value: 50,
    min: 0, max: 100, step: 1,    // step은 native 표현용. 실제 snap은 marks 기준
    marks: [
        { value: 0,   label: 'Low' },
        { value: 30,  label: 'Mid' },
        { value: 70,  label: 'High' },
        { value: 100, label: 'Lossless' }
    ],
    showMarkLabels: true
});
```

### 디자인 변형

| 파일 | 페르소나 | mark 시각 차별 + 도메인 컨텍스트 |
|------|---------|-----------------------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 tonal — mark는 라벤더 dot(6px), active는 그라디언트 fill, 라벨은 Pretendard 11px. **도메인**: 운영 콘솔의 alert priority preset (`P1/P2/P3/P4/P5`) — 5단계 평점 형태, 라벨 표시 |
| `02_material`    | B: Material Elevated | 라이트 블루 Filled — mark는 흰색 dot + 1px 블루 보더, active는 솔리드 블루, 라벨은 Roboto 12px. **도메인**: T-shirt 사이즈 선택 (`XS/S/M/L/XL`) — 5단계 균등, 라벨 표시 |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 헤어라인 — mark는 1px vertical bar(8px h), active는 진한 차콜, 라벨은 Georgia 세리프 12px. **도메인**: 음질 quality preset (`Low/Mid/High/Lossless`) — 비균등(0/30/70/100), 라벨 표시 |
| `04_operational` | D: Dark Operational  | 다크 시안 컴팩트 — mark는 작은 사각(4×8px) cyan 보더, active는 솔리드 cyan glow, 라벨은 JetBrains Mono 9px. **도메인**: 관제 alert level (`L0/L1/L2/L3`) — 4단계, 짧은 라벨 |

각 페르소나는 mark dot의 위치를 `style.left = N%`로 지정 + `transform: translateX(-50%)`로 중심 정렬. 라벨은 dot 아래에 별도 span.

### 결정사항

- **wkit.bindEvents 비사용**: tooltip 변형과 동일 이유. native 리스너 단일 채널로 snap/이벤트 발행 순서를 일관되게 유지. `customEvents = {}` (빈 객체)는 라이프사이클 호환성 확보용.
- **drag 중 자유 이동 + drag 종료 snap**: 드래그 중 snap을 강제하면 thumb이 mark 사이에서 튀는 UX가 발생. drag 종료 시점에만 snap 적용하여 자연스러운 인터랙션 보장.
- **snap 디듀프**: snap 결과 value가 직전 emit과 동일하면 `@markSnapped`/`@valueChanged` 재발행 생략 — 단순 클릭(이동 없음)에서 노이즈 방지.
- **native step과 marks의 분리**: `step` 속성은 키보드 ←/→/Home/End의 native 증감 단위로만 사용. 실제 snap은 `_marks` 기준으로 자체 처리(비균등 marks 지원).
- **단방향 데이터 흐름**: 컴포넌트는 상태 일부(`_marks` 캐시)를 보관하지만, value 결정은 페이지가 담당. native input 이벤트 → `@valueChanged` 발행 → 페이지가 새 value 결정 → `sliderInfo` 재publish → `updateSliderValue`에서 progress + mark active 동시 갱신.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드 조합으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 6단계 (`Components/Sliders/Basic/Advanced/discreteWithMarks/preview/...html` → `../`를 6번)
