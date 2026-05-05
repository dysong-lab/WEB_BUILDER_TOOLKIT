# Sliders/Centered — Advanced / discreteWithMarks

## 기능 정의

1. **슬라이더 상태 렌더링 (Centered Standard 호환)** — `sliderInfo` 토픽으로 수신한 객체(`{ label, value, min, max, step, center?, disabled, valueText?, marks?, showMarkLabels? }`)를 라벨/값 표시/핸들 위치/활성 트랙(중앙 기준 좌/우 확장)에 반영한다 (Centered Standard와 동일한 FieldRenderMixin + `updateSliderValue` 파생).
   - 활성 트랙은 **중앙 기준점**(`center`, 미지정 시 `(min + max) / 2`)에서 현재 `value`까지 확장된다(`progressLeft%` + `progress%` 두 파생값).
   - `valueText`가 주어지지 않으면 부호(`+`/`-`)를 붙여 자동 포맷한다 (`center` 기준 오프셋 의미).
2. **이산 마크 포인트 동적 렌더링 (핵심 차별 1)** — `marks: [-12, -6, 0, 6, 12]`(숫자 배열) 또는 `marks: [{value, label}]`(객체 배열) 형식의 mark 정의를 받아, mark 컨테이너에 dot 요소를 동적 생성한다(`<template>` cloneNode). 각 dot은 `(markValue - min) / (max - min)` 비율로 left 위치 결정. `showMarkLabels=true`이면 dot 아래에 라벨 텍스트도 표시.
3. **중앙 mark 강조 (Centered 핵심 — 차별 2)** — `marks` 배열 안에서 `center`(미지정 시 `(min+max)/2`)와 일치하는 mark는 dot에 `[data-center="true"]` 속성을 부여하여 별도 시각 강조(중앙 mark는 굵게/색대비/세로 선 등 페르소나별 표현). center mark가 marks 배열에 없으면 자동으로 추가하여 항상 중앙 기준점이 시각화되도록 보장.
4. **mark dot active 상태 갱신 (Centered 의미)** — Basic은 `markValue <= value`로 단방향(좌 → 우) 활성화 누적이지만, Centered는 **center ↔ value 구간** 안에 들어오는 mark만 `[data-active="true"]`. 즉 `Math.min(value, center) <= markValue <= Math.max(value, center)` 인 mark가 active. center mark는 항상 active(중앙 기준점이라는 의미). `updateSliderValue` 호출 시점마다 일괄 갱신.
5. **snap to nearest mark 로직 (핵심 차별 3)** — 비균등 mark 배열은 native `step` 속성으로 표현 불가. 드래그 종료(`pointerup`/`pointercancel`) 또는 키보드 입력 종료(`keyup`) 시점에 가장 가까운 mark.value를 찾아 input.value 갱신 + `@valueChanged` 재발행 + `@markSnapped` 발행. 드래그 중에는 snap하지 않고 자유 이동. snap 결과가 직전 emit과 동일하면 디듀프(중복 emit 차단).
6. **값 변경 이벤트 (Centered Standard 호환 + 신규 1종)** — `input` 이벤트(드래그/키보드 연속) 시점에 `@valueChanged` 발행 (Centered Standard `@sliderChanged` 대체 — 의미 명확화). snap 적용 시점에 `@markSnapped` 추가 발행 (payload: `{ targetInstance, value, markIndex, isCenter }`).

> **Standard와의 분리 정당성**:
> - **자체 상태 8종** — `_marks`(정규화된 `[{value, label, isCenter}]` 배열) / `_showMarkLabels` / `_centerValue`(현재 center, mark 활성 구간 계산) / `_inputEl` / `_marksContainerEl` / `_markTemplateEl` / `_isPointerDown` / `_pointerId` / `_lastEmittedValue`. Centered Standard는 stateless.
> - **새 이벤트 2종** — `@valueChanged` (Centered Standard `@sliderChanged` 대체) + `@markSnapped` (snap 시점 1회, `isCenter` 포함). Centered Standard는 `@sliderChanged` 1종.
> - **새 cssSelectors KEY 3종** — `marks`(dot 컨테이너) + `markTemplate`(`<template id>`) + `markDot`(생성된 dot의 클래스). Centered Standard에는 없음.
> - **자체 메서드 11종** — `updateSliderValue`(확장) / `_normalizeMarks`(center 자동 추가) / `_renderMarks` / `_updateMarkActiveStates`(center↔value 구간 활성화) / `_snapToNearestMark` / `_applySnap` / `_handlePointerDown`/`_handlePointerUp`/`_handlePointerCancel`/`_handleKeyUp`/`_handleInput`.
> - **DOM 동적 생성** — Centered Standard는 HTML이 모든 요소를 갖지만, 본 변형은 mark dot/label을 page-side `marks` 데이터에 맞춰 매번 다시 그린다(템플릿 cloneNode). beforeDestroy에서 컨테이너 비우기 + native 리스너 detach.
>
> 위 5축은 동일 register.js로 표현 불가 → Centered Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**:
> - **Sliders/Centered/Standard** (직전, 같은 컴포넌트) — FieldRenderMixin + `updateSliderValue` 파생(progressLeft + progress + 부호 valueText) + `input` 이벤트로 양방향 양식. 본 변형은 동일 토대 위에 mark 배열 정규화 + 동적 dot 렌더링 + center mark 강조 + center↔value 구간 active + snap 로직 + native pointer/key 리스너를 추가.
> - **Sliders/Basic/Advanced/discreteWithMarks** (동일 메커니즘 6단계, FieldRender + 자체 메서드) — 마크 정규화/동적 렌더링/snap/native pointer+key 리스너 라이프사이클/bound handler 참조 보관/200ms 디듀프/`@markSnapped` 발행 + preview `<script src>` 6단계. 본 변형도 동일 패턴 답습. 차별: (1) 부호 포맷 valueText, (2) `progressLeft` styleAttrs 추가, (3) center mark 강조(`[data-center]`), (4) center↔value 구간 active 로직, (5) `isCenter` payload.
> - **Sliders/Centered/Advanced/tooltip** (직전 6단계, 동일 컴포넌트) — preview `<script src>` 6단계 verbatim 복사 기준 + native pointer/key/input 리스너 라이프사이클 + bound handler 참조 보관 + Centered Standard 호환 `updateSliderValue`(progressLeft + progress + 부호 valueText) — 본 변형은 동일 토대 위에 marks 정규화/렌더/snap/center 강조 추가.
>
> **MD3 / 도메인 근거**: MD3 Centered slider는 thumb 좌/우 양방향 오프셋을 표현. discrete + center mark 조합은 **이산 양/음 단계**(예: EQ band gain `-12/-6/0/+6/+12 dB`, 카메라 노출 `-3/-2/-1/0/+1/+2/+3 EV`, 화이트밸런스 `-3/-2/-1/0/+1/+2/+3 step`, 색온도 시프트 `-10/-5/0/+5/+10 mireds`)에서 필수. center mark가 시각적으로 강조되어야 "0 = 기준" 의미가 즉시 인지된다.

---

## 구현 명세

### Mixin

**FieldRenderMixin** + 커스텀 메서드 11종 (`updateSliderValue`, `_normalizeMarks`, `_renderMarks`, `_updateMarkActiveStates`, `_snapToNearestMark`, `_applySnap`, `_handlePointerDown`, `_handlePointerUp`, `_handlePointerCancel`, `_handleKeyUp`, `_handleInput`).

> Mixin 조합은 Centered Standard와 동일(FieldRenderMixin 단일). Advanced 분리는 mixin 추가가 아니라 **자체 상태 + native 리스너 라이프사이클 + 동적 dot DOM + center 강조 + center↔value 구간 active + snap 로직 + 추가 이벤트 1종 + isCenter 슬롯**으로 이루어진다. 신규 Mixin 생성 없음.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| slider        | `.slider`                  | 루트 — `data-disabled` 대상 |
| label         | `.slider__label`           | 라벨 텍스트 (textContent) |
| valueText     | `.slider__value-label`     | 포맷된 현재 값 (textContent, 부호 포함) |
| input         | `.slider__input`           | `input[type=range]` — value/min/max/step 속성 + native pointer/key/input 리스너 부착 대상 |
| min           | `.slider__input`           | input의 `min` 속성 (elementAttrs) |
| max           | `.slider__input`           | input의 `max` 속성 (elementAttrs) |
| step          | `.slider__input`           | input의 `step` 속성 (elementAttrs) |
| value         | `.slider__input`           | input의 `value` 속성 (elementAttrs) |
| progress      | `.slider__track-active`    | 활성 트랙 너비 — `style.width = N%` (styleAttrs) |
| progressLeft  | `.slider__track-active`    | 활성 트랙 좌측 좌표 — `style.left  = N%` (styleAttrs) |
| marks         | `.slider__marks`           | **mark dot 컨테이너** — `_renderMarks`가 dot/label 생성 대상 |
| markTemplate  | `#slider-mark-template`    | **template 태그** — cloneNode 원본 |
| markDot       | `.slider__mark`            | **생성된 dot 클래스** — `[data-active]`/`[data-center]` 토글 대상 |

### datasetAttrs

(없음 — `slider`의 `data-disabled` / `markDot`의 `data-active` / `data-center`는 컴포넌트가 직접 갱신하며 KEY로 관리하지 않는다.)

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
| `_marks` | `Array<{value, label, isCenter}>` | `[]` | 정규화된 mark 배열 (center 자동 포함) |
| `_showMarkLabels` | `boolean` | `false` | 라벨 표시 여부 (마지막 publish 값 보존) |
| `_centerValue` | `number` | `0` | 현재 center 값. mark active 구간 계산용 |
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
| `sliderInfo` | `this.updateSliderValue` | Centered Standard 호환. payload에 `marks?` / `showMarkLabels?` 추가 슬롯. |

### 이벤트 (customEvents — Wkit.bindEvents, 일반 DOM)

(없음 — tooltip / Basic discreteWithMarks 변형과 동일 이유. native 리스너 단일 채널로 통일하여 snap 적용/이벤트 발행 순서를 일관되게 유지. `customEvents = {}` (빈 객체)는 라이프사이클 호환성 확보용.)

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@valueChanged` | input 이벤트(드래그/키보드 연속), snap 결과 재발행 | `{ targetInstance, event, value }` |
| `@markSnapped` | pointerup/cancel/keyup 시점 snap 적용 후 1회 (snap 결과가 직전 emit과 다를 때만) | `{ targetInstance, value, markIndex, isCenter }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `updateSliderValue({ response })` | `({response}) => void` | Centered Standard 호환 + `marks`/`showMarkLabels` 슬롯 흡수. `progressLeft`/`progress`/부호 포맷 `valueText` 파생 + `fieldRender.renderData` 위임 + `data-disabled` 갱신 + `_centerValue` 저장 + `_marks` 정규화/저장 + `_renderMarks` 호출 + `_updateMarkActiveStates` 호출 |
| `_normalizeMarks(marksInput, min, max, center)` | `(unknown, number, number, number) => Array<{value, label, isCenter}>` | 숫자 배열 → 객체 배열 변환. min/max 범위 외 값 필터링. **center 값이 marks에 없으면 자동 추가**. value 오름차순 정렬. `isCenter` 플래그 부여 |
| `_renderMarks()` | `() => void` | 컨테이너 비우기 + `_marks` 순회 + template cloneNode + position(%) + label(옵션) + `[data-center]` 부여 + appendChild |
| `_updateMarkActiveStates(value, center)` | `(number, number) => void` | 컨테이너 내 모든 `.slider__mark`를 순회. `Math.min(value, center) <= markValue <= Math.max(value, center)` 인 mark는 `data-active="true"`, 아니면 `false` |
| `_snapToNearestMark(rawValue)` | `(number) => {value, markIndex, isCenter} \| null` | `_marks`가 비어있으면 null. 그렇지 않으면 `Math.abs(mark.value - rawValue)` 최소인 mark 반환 (`isCenter` 포함) |
| `_applySnap()` | `() => void` | snap 적용 진입점 — `_snapToNearestMark` + 디듀프 + input.value 즉시 갱신 + progress/progressLeft/active 동기 갱신 + `@valueChanged`/`@markSnapped` 발행 |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | 좌클릭만. `_isPointerDown=true` + `_pointerId` 저장 |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | `_isPointerDown=false` + `_applySnap` 호출 |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | pointerup과 동일 |
| `_handleKeyUp(e)` | `(KeyboardEvent) => void` | ←/→/Home/End 등으로 값이 바뀐 후 snap 적용 |
| `_handleInput(e)` | `(InputEvent) => void` | `@valueChanged` 발행. (드래그 중 자유 이동 — snap은 드래그 종료 시점) |

부호 포맷 규칙 (Centered):

```
center      = Number.isFinite(data.center) ? data.center : (min + max) / 2
defaultText =
  value > center  →  '+' + (value - center)
  value < center  →  '-' + (center - value)
  value === center → '0'
displayText  = data.valueText ?? defaultText
```

mark active 구간 (Centered 핵심):

```
lo = Math.min(value, center)
hi = Math.max(value, center)
mark는 lo <= mark.value <= hi 일 때 active
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
        '@valueChanged': ({ event, value, targetInstance }) => {
            const next = event ? Number(event.target.value) : value;
            state.value = next;
            targetInstance.updateSliderValue({ response: { ...state } });
        },
        '@markSnapped': ({ value, markIndex, isCenter }) => {
            analytics.track('mark_snapped', { value, markIndex, isCenter });
        }
      });
```

publish 예 (EQ band gain ±12 dB, 6 dB step):
```javascript
publish('sliderInfo', {
    label: 'EQ Gain',
    value: 0,
    min: -12, max: 12, step: 1, center: 0,
    marks: [
        { value: -12, label: '-12' },
        { value:  -6, label: '-6'  },
        { value:   0, label: '0'   },
        { value:   6, label: '+6'  },
        { value:  12, label: '+12' }
    ],
    showMarkLabels: true,
    disabled: false
});
```

publish 예 (카메라 노출 ±3 EV, 비균등):
```javascript
publish('sliderInfo', {
    label: 'Exposure (EV)',
    value: 0,
    min: -3, max: 3, step: 1, center: 0,
    marks: [-3, -2, -1, 0, 1, 2, 3],
    showMarkLabels: true,
    valueText: '0 EV'
});
```

### 디자인 변형

| 파일 | 페르소나 | mark 시각 차별 + 도메인 컨텍스트 |
|------|---------|-----------------------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 tonal — mark는 라벤더 dot(6px), active(center↔value 구간)는 그라디언트 fill, **center mark는 14px 세로바**(중앙 기준점 강조). Pretendard 11px 라벨. **도메인**: 오디오 콘솔 EQ band gain (±12 dB, step 6 dB, 0=flat) — `-12/-6/0/+6/+12` 5단계, 중앙(0=flat)이 기준. |
| `02_material`    | B: Material Elevated | 라이트 블루 Filled — mark는 흰색 dot + 1px 블루 보더, active는 솔리드 블루, **center mark는 16px 굵은 vertical 라인**(블루 컬러). Roboto 12px 라벨. **도메인**: 카메라 노출 보정 EV (±3, step 1, 0=auto) — `-3/-2/-1/0/+1/+2/+3` 7단계, 0(auto)이 기준. |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 헤어라인 — mark는 1px vertical bar(8px h), active는 진한 차콜(12px h), **center mark는 차콜 굵은 1.5px 14px**. Georgia 12px italic 라벨. **도메인**: 디자인 툴 색온도 보정 mireds 시프트 (±10, step 5, 0=원본) — `-10/-5/0/+5/+10` 5단계, 0(원본)이 기준. |
| `04_operational` | D: Dark Operational  | 다크 시안 컴팩트 — mark는 4×8px cyan 보더 사각, active는 솔리드 cyan + glow, **center mark는 cyan 1px 12px 라인 + dim glow**. JetBrains Mono 9px 라벨. **도메인**: 관제 콘솔 pan offset (±100, step 50, 0=center) — `-100/-50/0/+50/+100` 5단계, 0(center)이 기준. |

각 페르소나는 mark dot의 위치를 `style.left = N%`로 지정 + `transform: translateX(-50%)`로 중심 정렬. 라벨은 dot 아래에 별도 span. `[data-center="true"]`인 dot은 별도 시각 강조.

### 결정사항

- **wkit.bindEvents 비사용**: tooltip / Basic discreteWithMarks와 동일 이유. native 리스너 단일 채널로 snap/이벤트 발행 순서를 일관되게 유지.
- **drag 중 자유 이동 + drag 종료 snap**: drag 중 snap 강제 시 thumb이 mark 사이에서 튀는 UX 발생 — drag 종료 시점에만 snap 적용.
- **snap 디듀프**: snap 결과 value가 직전 emit과 동일하면 재발행 생략 — 단순 클릭에서 노이즈 방지.
- **center mark 자동 포함**: 페이지가 marks에 center를 명시하지 않아도 `_normalizeMarks`가 자동 추가하여 항상 중앙 기준점이 시각화. `isCenter` 플래그로 강조.
- **center mark는 항상 active 의미**: center↔value 구간 안에 들어오는 모든 mark가 active이므로, value=center일 때도 center mark는 active(자기 자신).
- **native step과 marks의 분리**: `step`은 키보드 ←/→/Home/End의 native 증감 단위로만. 실제 snap은 `_marks` 기준 자체 처리(비균등 marks 지원).
- **단방향 데이터 흐름**: native input 이벤트 → `@valueChanged` 발행 → 페이지가 새 value 결정 → `sliderInfo` 재publish → `updateSliderValue`에서 progressLeft + progress + mark active 동시 갱신.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드 조합으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 6단계 (`Components/Sliders/Centered/Advanced/discreteWithMarks/preview/...html` → `../`를 6번)
