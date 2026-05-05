# Sliders/Range — Advanced / discreteWithMarks

## 기능 정의

1. **슬라이더 상태 렌더링 (Range Standard 호환)** — `sliderInfo` 토픽으로 수신한 객체(`{ label, low, high, min, max, step, minDistance?, disabled, lowText?, highText?, marks?, showMarkLabels? }`)를 라벨/두 값 표시/두 input 속성/활성 트랙(low~high 구간)에 반영한다 (Range Standard와 동일한 FieldRenderMixin + `updateSliderValue` 파생 + 불변식 보정).
   - 활성 트랙은 `low` 지점에서 `high` 지점까지 확장된다 (`lowProgress%` + `progress%` 두 styleAttrs를 같은 `.slider__track-active` 요소에 적용).
   - `low > high`로 publish되어도 `low ≤ high` 보정. `minDistance`가 주어지면 `high - low >= minDistance` 보장.
2. **이산 마크 포인트 동적 렌더링 (핵심 차별 1)** — `marks: [0, 25, 50, 75, 100]`(숫자 배열) 또는 `marks: [{value, label}]`(객체 배열) 형식의 mark 정의를 받아, mark 컨테이너에 dot 요소를 동적 생성한다(`<template>` cloneNode). 각 dot은 `(markValue - min) / (max - min)` 비율로 left 위치 결정. `showMarkLabels=true`이면 dot 아래에 라벨 텍스트도 표시.
3. **mark dot active 상태 갱신 (Range 의미 — 핵심 차별 2)** — Basic은 `markValue <= value`로 단방향(좌→우) 활성화 누적이지만, Range는 **low ≤ markValue ≤ high 구간**에 들어오는 mark만 `[data-active="true"]`(low/high 두 핸들 사이의 mark만 활성). `updateSliderValue` 호출 시점마다 일괄 갱신.
4. **snap to nearest mark 로직 (low/high 각 핸들 — 핵심 차별 3)** — 비균등 mark 배열(예: `[0, 10, 30, 70, 100]`)은 native `step` 속성으로 표현 불가. 두 input 각각의 드래그 종료(`pointerup`/`pointercancel`) 또는 키보드 입력 종료(`keyup`) 시점에, **해당 핸들의 현재 값**에 가장 가까운 mark.value를 찾아 input.value 갱신 + `@valueChanged({thumb})` 재발행 + `@markSnapped({thumb, value, markIndex})` 발행. 드래그 중에는 snap하지 않고 자유 이동.
5. **low < high 거부/보정 (Range 핵심 — 차별 4)** — snap 결과가 반대편 핸들의 현재 값과 같거나 넘는 경우(예: low가 high의 mark 위치로 snap되려는 시점), **반대편 mark 한 칸 안쪽**으로 양보한다.
   - `low` snap 시 `bestIndex`가 high 현재값의 mark index 이상이면 → `bestIndex = highMarkIndex - 1` (단, ≥ 0). 그래도 불가하면 `low = high - step`까지 fallback.
   - `high` snap 시 `bestIndex`가 low 현재값의 mark index 이하이면 → `bestIndex = lowMarkIndex + 1` (단, < marks.length). 그래도 불가하면 `high = low + step`까지 fallback.
   - 정책 의도: `low < high`를 **항상** 보장하면서 사용자가 끌어온 의도(가장 가까운 mark)를 최대한 존중.
   - mark가 1개 이하인 비현실적 경우는 snap 자체를 생략(no-op).
6. **값 변경 이벤트 (Range Standard 분리)** — 두 input 중 하나의 input 이벤트 시점에 `@valueChanged` 발행 (Range Standard `@sliderChanged` 대체 — 의미 명확화). payload: `{ targetInstance, event, value, thumb }`. snap 적용 시점에 `@markSnapped` 추가 발행 (payload: `{ targetInstance, value, markIndex, thumb }`).

> **Range Standard와의 분리 정당성**:
> - **자체 상태 13종** — `_marks`(정규화된 `[{value, label}]`) / `_showMarkLabels` / `_isLowPointerDown` / `_isHighPointerDown` / `_lowPointerId` / `_highPointerId` / `_lastEmittedLow`(snap 디듀프) / `_lastEmittedHigh`(snap 디듀프) / `_lowInputEl` / `_highInputEl` / `_marksContainerEl` / `_markTemplateEl` / bound handler 12종(low 6 + high 6). Range Standard는 stateless.
> - **새 이벤트 3종** — `@valueChanged` (Range Standard `@sliderChanged` 대체, `thumb` payload) + `@markSnapped` (snap 시점 1회, `thumb` payload). Range Standard는 `@sliderChanged` 1종.
> - **새 cssSelectors KEY 3종** — `marks`(dot 컨테이너) + `markTemplate`(`<template id>`) + `markDot`(생성된 dot 클래스). Range Standard에는 없음.
> - **자체 메서드 16종** — `updateSliderValue`(확장) / `_normalizeMarks` / `_renderMarks` / `_updateMarkActiveStates` / `_findNearestMarkIndex` / `_applyLowSnap` / `_applyHighSnap` / `_handleLowPointerDown`/`_handleLowPointerUp`/`_handleLowPointerCancel`/`_handleLowKeyUp`/`_handleLowInput` / `_handleHighPointerDown`/`_handleHighPointerUp`/`_handleHighPointerCancel`/`_handleHighKeyUp`/`_handleHighInput` (총 17종).
> - **DOM 동적 생성** — Range Standard는 HTML이 모든 요소를 갖지만, 본 변형은 mark dot/label을 page-side `marks` 데이터에 맞춰 매번 다시 그린다(템플릿 cloneNode). beforeDestroy에서 컨테이너 비우기 + native 리스너 detach.
> - **input 외 native pointer/key 리스너 10종 라이프사이클** — Range Standard는 customEvents의 `input` 이벤트만 사용하지만, 본 변형은 두 input element에 각각 native pointerdown/pointerup/pointercancel/keyup/input 5종을 직접 부착(저 10종 = 5 × 2 thumb). beforeDestroy에서 명시적으로 detach.
>
> 위 6축은 동일 register.js로 표현 불가 → Range Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**:
> - **Sliders/Range/Standard** (직전, 같은 컴포넌트) — FieldRenderMixin + `updateSliderValue` 파생(lowProgress + progress + lowText/highText) + `low ≤ high` 및 `minDistance` 불변식 보정 + 두 input 겹치기 + 양방향 sliderInfo 흐름. 본 변형은 동일 토대 위에 mark 배열 정규화 + 동적 dot 렌더링 + low~high 구간 active + thumb별 snap 로직 + `low < high` 양보 정책 + native pointer/key 리스너 10종 추가.
> - **Sliders/Range/Advanced/tooltip** (직전 6단계, 동일 컴포넌트) — preview `<script src>` 6단계 verbatim 복사 기준 + native pointer/focus/input 리스너 라이프사이클 + bound handler 참조 보관 + Range Standard 호환 `updateSliderValue`(lowProgress + progress + 불변식 보정) + thumb 2채널 라이프사이클. 본 변형은 동일 토대 위에 mark 정규화/렌더/active/snap 로직을 추가.
> - **Sliders/Basic/Advanced/discreteWithMarks** (동일 메커니즘 6단계) — 마크 정규화/동적 렌더링/snap/native pointer+key 리스너 라이프사이클/bound handler 참조 보관/디듀프/`@markSnapped` 발행 + preview `<script src>` 6단계. 본 변형도 동일 패턴 답습. 차별: (1) thumb 2채널(low/high), (2) `lowProgress` styleAttrs 추가, (3) low~high 구간 active(누적이 아닌 구간), (4) `low < high` 양보 정책, (5) `thumb` payload 추가.
> - **Sliders/Centered/Advanced/discreteWithMarks** (동일 메커니즘 6단계) — center↔value **구간** active 패턴(Basic의 단방향 누적과 다른 구간 의미) — 본 변형의 low~high 구간 active와 동일한 의미적 구간 패턴. center 자동 추가 대신 `low < high` 양보로 차별.
>
> **MD3 / 도메인 근거**: MD3 Range slider는 두 thumb 각각이 valueIndicator + tickMarks 표준화. discrete + range 조합은 **이산 양 끝점 범위 선택**(예: 가격대 grade 선택 `$/$$/$$$/$$$$`, T-shirt 사이즈 범위 `XS~XL`, 우선순위 등급 범위 `P1~P5`, 음질 quality range `Low~Lossless`)에서 필수. 비균등 mark는 native step으로 표현 불가하므로 자체 snap 로직 + `low < high` 보장이 동시에 필요.

---

## 구현 명세

### Mixin

**FieldRenderMixin** + 커스텀 메서드 17종 (`updateSliderValue`, `_normalizeMarks`, `_renderMarks`, `_updateMarkActiveStates`, `_findNearestMarkIndex`, `_applyLowSnap`, `_applyHighSnap`, low/high 각 5종 native handler).

> Mixin 조합은 Range Standard와 동일(FieldRenderMixin 단일). Advanced 분리는 mixin 추가가 아니라 **자체 상태 + native pointer/key 리스너 10종 라이프사이클 + 동적 dot DOM + low~high 구간 active + thumb별 snap + `low < high` 양보 정책 + 추가 이벤트 1종(`@markSnapped`) + thumb payload 슬롯**으로 이루어진다. 신규 Mixin 생성 없음.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| slider        | `.slider`                          | 루트 — `data-disabled` 대상 |
| label         | `.slider__label`                   | 라벨 텍스트 (textContent) |
| lowText       | `.slider__value-label--low`        | 낮은 값 표시 (textContent) |
| highText      | `.slider__value-label--high`       | 높은 값 표시 (textContent) |
| lowInput      | `.slider__input--low`              | low용 `input[type=range]` — 속성 + native pointer/key/input 리스너 부착 대상 |
| highInput     | `.slider__input--high`             | high용 `input[type=range]` — 속성 + native pointer/key/input 리스너 부착 대상 |
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
| marks         | `.slider__marks`                   | **mark dot 컨테이너** — `_renderMarks`가 dot/label 생성 대상 |
| markTemplate  | `#slider-mark-template`            | **template 태그** — cloneNode 원본 |
| markDot       | `.slider__mark`                    | **생성된 dot 클래스** — `[data-active]` 토글 대상 |

### datasetAttrs

(없음 — `slider`의 `data-disabled` / `markDot`의 `data-active`는 컴포넌트가 직접 갱신하며 KEY로 관리하지 않는다.)

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
| `_marks` | `Array<{value, label}>` | `[]` | 정규화된 mark 배열 (숫자 배열 → 객체 배열로 변환, 오름차순) |
| `_showMarkLabels` | `boolean` | `false` | 라벨 표시 여부 (마지막 publish 값 보존) |
| `_isLowPointerDown` | `boolean` | `false` | low thumb 드래그 활성 — pointerup snap 가드 |
| `_isHighPointerDown` | `boolean` | `false` | high thumb 드래그 활성 — pointerup snap 가드 |
| `_lowPointerId` | `number \| null` | `null` | low thumb pointerdown ↔ pointerup 매칭 |
| `_highPointerId` | `number \| null` | `null` | high thumb pointerdown ↔ pointerup 매칭 |
| `_lastEmittedLow` | `number \| null` | `null` | low snap 후 동일 value 중복 emit 방지 |
| `_lastEmittedHigh` | `number \| null` | `null` | high snap 후 동일 value 중복 emit 방지 |
| `_lowInputEl` | `Element \| null` | `null` | register.js cache. native 리스너 부착 대상 |
| `_highInputEl` | `Element \| null` | `null` | register.js cache. native 리스너 부착 대상 |
| `_marksContainerEl` | `Element \| null` | `null` | register.js cache. dot 렌더링 대상 |
| `_markTemplateEl` | `HTMLTemplateElement \| null` | `null` | register.js cache. cloneNode 원본 |
| `_lowPointerDownHandler` / `_lowPointerUpHandler` / `_lowPointerCancelHandler` / `_lowKeyUpHandler` / `_lowInputHandler` | `Function \| null` | `null` | bound handler 참조 (low) — beforeDestroy에서 정확히 removeEventListener |
| `_highPointerDownHandler` / `_highPointerUpHandler` / `_highPointerCancelHandler` / `_highKeyUpHandler` / `_highInputHandler` | `Function \| null` | `null` | bound handler 참조 (high) — beforeDestroy에서 정확히 removeEventListener |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `sliderInfo` | `this.updateSliderValue` | Range Standard 호환. payload에 `marks?` / `showMarkLabels?` 추가 슬롯. |

### 이벤트 (customEvents — Wkit.bindEvents, 일반 DOM)

(없음 — Basic discreteWithMarks / Range tooltip와 동일 이유. native 리스너 단일 채널로 통일하여 snap 적용/이벤트 발행 순서를 일관되게 유지. `customEvents = {}` (빈 객체)는 라이프사이클 호환성 확보용.)

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@valueChanged` | 두 input 중 하나의 input 이벤트(드래그/키보드 연속), snap 결과 재발행 | `{ targetInstance, event, value, thumb: 'low' \| 'high' }` |
| `@markSnapped` | 두 input 중 하나의 pointerup/cancel/keyup 시점 snap 적용 후 1회 (snap 결과가 직전 emit과 다를 때만) | `{ targetInstance, value, markIndex, thumb: 'low' \| 'high' }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `updateSliderValue({ response })` | `({response}) => void` | Range Standard 호환 + `marks`/`showMarkLabels` 슬롯 흡수. `low ≤ high`/`minDistance` 보정 + `lowProgress`/`progress`(highProgress - lowProgress)/`lowText`/`highText` 파생 + `fieldRender.renderData` 위임 + `data-disabled` 갱신 + `_marks` 정규화/저장 + `_renderMarks` 호출 + `_updateMarkActiveStates(low, high)` 호출 |
| `_normalizeMarks(marksInput, min, max)` | `(unknown, number, number) => Array<{value, label}>` | 숫자 배열 → 객체 배열 변환. min/max 범위 외 값 필터링. value 오름차순 정렬 |
| `_renderMarks()` | `() => void` | 컨테이너 비우기 + `_marks` 순회 + template cloneNode + position(%) + label(옵션) 채우기 + appendChild |
| `_updateMarkActiveStates(low, high)` | `(number, number) => void` | 컨테이너 내 모든 `.slider__mark`를 순회하며 `low <= markValue <= high`이면 `data-active="true"`, 아니면 `false` |
| `_findNearestMarkIndex(rawValue)` | `(number) => number \| -1` | `_marks`가 비어있으면 `-1`. 그렇지 않으면 `Math.abs(mark.value - rawValue)` 최소인 mark 인덱스 반환 |
| `_applyLowSnap()` | `() => void` | low snap 적용 진입점 — `_findNearestMarkIndex` + `low < high` 양보(반대편 한 칸 안쪽 + step fallback) + 디듀프 + low input.value 즉시 갱신 + lowProgress/progress/active 동기 갱신 + `@valueChanged({thumb:'low'})`/`@markSnapped({thumb:'low'})` 발행 |
| `_applyHighSnap()` | `() => void` | high snap 적용 진입점 — 대칭. `_findNearestMarkIndex` + `low < high` 양보(반대편 한 칸 안쪽 + step fallback) + 디듀프 + high input.value 즉시 갱신 + lowProgress/progress/active 동기 갱신 + `@valueChanged({thumb:'high'})`/`@markSnapped({thumb:'high'})` 발행 |
| `_handleLowPointerDown(e)` / `_handleHighPointerDown(e)` | `(PointerEvent) => void` | 좌클릭만. 해당 `_isXxxPointerDown=true` + `_xxxPointerId` 저장 |
| `_handleLowPointerUp(e)` / `_handleHighPointerUp(e)` | `(PointerEvent) => void` | 해당 `_isXxxPointerDown=false` + `_pointerId=null` + `_applyXxxSnap()` 호출 |
| `_handleLowPointerCancel(e)` / `_handleHighPointerCancel(e)` | `(PointerEvent) => void` | pointerup과 동일 |
| `_handleLowKeyUp(e)` / `_handleHighKeyUp(e)` | `(KeyboardEvent) => void` | ←/→/Home/End 등 nav key 후 `_applyXxxSnap()` |
| `_handleLowInput(e)` / `_handleHighInput(e)` | `(InputEvent) => void` | `@valueChanged({thumb})` 발행. (드래그 중 자유 이동 — snap은 드래그 종료 시점) |

snap 양보 규칙 (Range 핵심):

```
// low snap
bestIndex = _findNearestMarkIndex(rawLow)
high      = Number(_highInputEl.value)
highIndex = _findNearestMarkIndex(high)   // 가장 가까운 mark
if (bestIndex >= highIndex) {
    // low이 high의 mark에 도달/초과 → 한 칸 안쪽
    bestIndex = highIndex - 1
}
if (bestIndex < 0) {
    // mark로 표현 불가 → low = high - step (값으로 fallback)
    snappedLow = high - step
} else {
    snappedLow = _marks[bestIndex].value
}
// 그래도 high 이상이면 abort (no-op)

// high snap (대칭)
bestIndex = _findNearestMarkIndex(rawHigh)
low       = Number(_lowInputEl.value)
lowIndex  = _findNearestMarkIndex(low)
if (bestIndex <= lowIndex) {
    bestIndex = lowIndex + 1
}
if (bestIndex >= _marks.length) {
    snappedHigh = low + step
} else {
    snappedHigh = _marks[bestIndex].value
}
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
        '@valueChanged': ({ event, value, thumb, targetInstance }) => {
            const next = event ? Number(event.target.value) : value;
            if (thumb === 'low')  state.low  = next;
            if (thumb === 'high') state.high = next;
            // low > high는 컴포넌트가 보정
            targetInstance.updateSliderValue({ response: { ...state } });
        },
        '@markSnapped': ({ value, markIndex, thumb }) => {
            analytics.track('mark_snapped', { value, markIndex, thumb });
        }
      });
```

publish 예 (가격 grade 범위 — 균등):
```javascript
publish('sliderInfo', {
    label: 'Price Grade',
    low: 1, high: 3,
    min: 1, max: 4, step: 1,
    marks: [
        { value: 1, label: '$' },
        { value: 2, label: '$$' },
        { value: 3, label: '$$$' },
        { value: 4, label: '$$$$' }
    ],
    showMarkLabels: true
});
```

publish 예 (음질 range 비균등):
```javascript
publish('sliderInfo', {
    label: 'Quality Range',
    low: 0, high: 70,
    min: 0, max: 100, step: 1,
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
| `01_refined`     | A: Refined Technical | 다크 퍼플 tonal — mark는 라벤더 dot(6px), low~high 구간 active는 그라디언트 fill, 라벨 Pretendard 11px. **도메인**: 운영 콘솔 alert priority **range** (`P1/P2/P3/P4/P5` 5단계 평점) — 두 endpoint priority 동시 선택, `low < high` 자동 보장. |
| `02_material`    | B: Material Elevated | 라이트 블루 Filled — mark는 흰 dot + 1px 블루 보더, active는 솔리드 블루, 라벨 Roboto 12px. **도메인**: 이커머스 가격 **grade range** (`$/$$/$$$/$$$$` 4단계) — 사용자가 두 가격 grade 동시 선택, snap으로 명확. |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 헤어라인 — mark는 1px vertical bar(8px h), active는 진한 차콜(12px h), 라벨 Georgia 12px italic. **도메인**: 음질 **quality range** (`Low/Mid/High/Lossless` 비균등 0/30/70/100) — 두 endpoint quality 선택, 비균등 mark snap. |
| `04_operational` | D: Dark Operational  | 다크 시안 컴팩트 — mark는 4×8px cyan 보더 사각, active는 솔리드 cyan glow, 라벨 JetBrains Mono 9px. **도메인**: 관제 콘솔 **alert level range** (`L0/L1/L2/L3` 4단계) — 두 alert level 동시 임계값, 즉각 snap. |

각 페르소나는 mark dot의 위치를 `style.left = N%`로 지정 + `transform: translateX(-50%)`로 중심 정렬. 라벨은 dot 아래에 별도 span. low~high 구간 안의 mark만 `[data-active="true"]`.

### 결정사항

- **wkit.bindEvents 비사용**: tooltip / Basic discreteWithMarks와 동일 이유. native 리스너 단일 채널로 snap/이벤트 발행 순서를 일관되게 유지. `customEvents = {}` (빈 객체)는 라이프사이클 호환성 확보용.
- **drag 중 자유 이동 + drag 종료 snap**: drag 중 snap 강제 시 thumb이 mark 사이에서 튀는 UX 발생. drag 종료 시점에만 snap 적용.
- **snap 디듀프 (low/high 분리)**: snap 결과 value가 직전 emit과 동일하면 재발행 생략 — 단순 클릭에서 노이즈 방지. `_lastEmittedLow`/`_lastEmittedHigh` 분리.
- **low < high 양보 정책**: snap 결과가 반대편 핸들의 mark index와 충돌하면 한 칸 안쪽 mark로 양보. mark가 부족하면 `step` 값만큼 차이를 두는 fallback. 불가능하면 abort. **`low < high`는 항상 보장**.
- **native step과 marks의 분리**: `step`은 키보드 ←/→/Home/End의 native 증감 단위로만. 실제 snap은 `_marks` 기준 자체 처리(비균등 marks 지원).
- **단방향 데이터 흐름**: native input 이벤트 → `@valueChanged({thumb})` 발행 → 페이지가 새 low/high 결정 → `sliderInfo` 재publish → `updateSliderValue`에서 lowProgress + progress + mark active 동시 갱신.
- **불변식 보정 위치**: Range Standard 답습 — `updateSliderValue`에서 `low ≤ high` + `minDistance`를 컴포넌트가 보정. 단, snap은 `_apply{Low,High}Snap`에서 즉시 input.value를 재할당하므로 페이지 재publish 없이도 시각 일관성 유지.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드 조합으로 완결. native pointer 리스너 + bound handler 참조 보관 패턴이 SideSheets/resizable + Basic/Advanced/tooltip + Basic/Advanced/keyboardArrowControl + Centered/Advanced/tooltip + Centered/Advanced/discreteWithMarks + Range/Advanced/tooltip + 본 변형에서 7번째 반복 — 향후 `PointerLifecycleMixin` 일반화 후보로 SKILL 보강 메모(반환에 명시).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 6단계 (`Components/Sliders/Range/Advanced/discreteWithMarks/preview/...html` → `../`를 6번)
