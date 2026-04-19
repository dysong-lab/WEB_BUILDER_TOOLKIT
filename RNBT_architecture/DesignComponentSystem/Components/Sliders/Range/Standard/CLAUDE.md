# Sliders/Range — Standard

## 기능 정의

1. **슬라이더 상태 렌더링** — `sliderInfo` 토픽으로 수신한 객체
   (`{ label, low, high, min, max, step, minDistance?, disabled, lowText?, highText? }`)를
   라벨/두 값 표시/두 핸들 위치/활성 트랙(두 핸들 사이 구간)에 반영한다.
   - 핸들은 **겹친 2개의 `input[type=range]`**로 네이티브 구현하여 드래그·키보드 조작(←/→/Home/End)을 기본 지원한다.
   - 활성 트랙은 `low` 지점에서 `high` 지점까지 확장된다 (`left=lowProgress%`, `width=(highProgress - lowProgress)%`).
   - `lowProgress`(%)/`highProgress`(%) 및 표시 문자열(`lowText`/`highText`)은 페이지 입력값에서 파생되므로 컴포넌트 내부에서 계산한다.
2. **불변식 보정** — `low > high`로 publish되어도 컴포넌트가 `min ≤ low ≤ high ≤ max`로 보정한다.
   `minDistance`가 주어지면 `high - low >= minDistance`를 보장한다.
   (페이지가 잘못된 값을 주어도 시각적으로 정상 상태가 나오도록 방어.)
3. **값 변경 이벤트** — 두 input 중 하나가 움직이면 `@sliderChanged` 발행.
   핸들러는 `event.target`의 `data-handle`(`low`|`high`)을 읽어 어느 값이 바뀌었는지 구분한다.
   페이지는 새 low/high를 결정해 `sliderInfo`를 재publish한다 (양방향).

> **MD3 근거**: MD3 Sliders — Range sliders use two thumbs (start/end) on a single track;
> the active segment is the span *between* the thumbs; each thumb shows its own value label; `low ≤ high` 불변.
> (출처: m3.material.io/components/sliders/guidelines — WebFetch 빈 응답, WebSearch 결과 기반)

---

## 구현 명세

### Mixin

**FieldRenderMixin** + 커스텀 메서드 1개 (`updateSliderValue`).

- FieldRenderMixin — 고정 DOM(label, lowInput, highInput, lowText, highText, activeTrack의 left/width) 요소에 한 객체의 값들을 매핑한다.
- 커스텀 메서드 — `low/high/min/max/minDistance`로부터
  - `lowProgress`(%) = low의 left% 좌표
  - `highProgress`(%) = high의 left% 좌표 (activeTrack의 left가 `lowProgress`, width가 `highProgress - lowProgress`)
  - `lowText` / `highText` — 페이지가 주지 않으면 `String(low)` / `String(high)`
  - 그리고 `low ≤ high` 및 `minDistance` 보정
  을 파생하여 fieldRender에 위임한다.
- 드래그/키보드 조작은 **두 개의 `input[type=range]`** 네이티브가 처리한다. 커스텀 드래그 없음.
- **신규 Mixin은 만들지 않는다.** Basic/Centered와 동일 패턴, 파생값이 2세트로 늘어난 형태.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| slider        | `.slider`                           | 루트 — `data-disabled` 대상 + 이벤트 매핑 컨테이너 |
| label         | `.slider__label`                    | 라벨 텍스트 (textContent) |
| lowText       | `.slider__value-label--low`         | 낮은 값 표시 (textContent) |
| highText      | `.slider__value-label--high`        | 높은 값 표시 (textContent) |
| lowInput      | `.slider__input--low`               | low용 `input[type=range]` — 이벤트 대상 |
| highInput     | `.slider__input--high`              | high용 `input[type=range]` — 이벤트 대상 |
| lowInputMin   | `.slider__input--low`               | low input의 `min` 속성 (elementAttrs) |
| lowInputMax   | `.slider__input--low`               | low input의 `max` 속성 (elementAttrs) |
| lowInputStep  | `.slider__input--low`               | low input의 `step` 속성 (elementAttrs) |
| low           | `.slider__input--low`               | low input의 `value` 속성 (elementAttrs) |
| highInputMin  | `.slider__input--high`              | high input의 `min` 속성 (elementAttrs) |
| highInputMax  | `.slider__input--high`              | high input의 `max` 속성 (elementAttrs) |
| highInputStep | `.slider__input--high`              | high input의 `step` 속성 (elementAttrs) |
| high          | `.slider__input--high`              | high input의 `value` 속성 (elementAttrs) |
| lowProgress   | `.slider__track-active`             | 활성 트랙 좌측 좌표 — `style.left = N%` (styleAttrs) |
| progress      | `.slider__track-active`             | 활성 트랙 너비 — `style.width = N%` (styleAttrs) |

> `label` ↔ `lowInput` 라벨 연결은 HTML에서 고정 id(`slider-range-input-low`)로 처리하므로 KEY로 관리하지 않는다.
> `lowProgress`와 `progress`는 **같은 DOM 요소의 서로 다른 스타일 속성** — 두 핸들 사이 구간을 표현하기 위한 두 파생값 (Centered의 `progressLeft`/`progress` 패턴 재사용).
> `lowInputMin`/`highInputMin` 등 분리된 KEY는 두 input이 같은 min/max/step을 공유하지만 FieldRenderMixin이 cssSelectors의 KEY 하나당 한 요소만 지정하므로, 동일 값을 양쪽에 모두 바인딩하기 위해 분리한 것이다.

### datasetAttrs

(없음 — `disabled` 플래그는 커스텀 매핑으로 `.slider` 루트 요소의 `data-disabled`, 두 input의 `.disabled`에 직접 반영한다. Basic/Centered와 동일 처리.)

### elementAttrs

| KEY | VALUE (HTML attribute) |
|-----|-----------------------|
| lowInputMin    | `min`   |
| lowInputMax    | `max`   |
| lowInputStep   | `step`  |
| low            | `value` |
| highInputMin   | `min`   |
| highInputMax   | `max`   |
| highInputStep  | `step`  |
| high           | `value` |

### styleAttrs

| KEY | VALUE |
|-----|-------|
| lowProgress | `{ property: 'left',  unit: '%' }` |
| progress    | `{ property: 'width', unit: '%' }` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `updateSliderValue({ response: data })` | 페이지가 publish한 `{ label, low, high, min, max, step, minDistance?, disabled, lowText?, highText? }`에서 `lowProgress`/`progress(highProgress - lowProgress)`/`lowText`/`highText`를 파생하고, `min ≤ low ≤ high ≤ max` 및 `minDistance` 불변식을 보정한 뒤, selector KEY에 맞춘 객체(lowInputMin/Max/Step, low, highInputMin/Max/Step, high, lowProgress, progress, label, lowText, highText)를 만들어 `this.fieldRender.renderData`에 위임한다. `disabled` 플래그는 `.slider` 루트의 `data-disabled` + 두 input의 `.disabled`에 직접 반영한다. |

파생 규칙:

```
min  = Number.isFinite(data.min)  ? data.min  : 0
max  = Number.isFinite(data.max)  ? data.max  : 100
step = Number.isFinite(data.step) ? data.step : 1
rawLow  = Number.isFinite(data.low)  ? data.low  : min
rawHigh = Number.isFinite(data.high) ? data.high : max
minDist = Math.max(0, Number.isFinite(data.minDistance) ? data.minDistance : 0)

// 1) 개별 clamp
low  = clamp(rawLow,  min, max)
high = clamp(rawHigh, min, max)

// 2) 순서 보정 (low > high면 swap)
if (low > high) [low, high] = [high, low]

// 3) minDistance 보정 (high 우선 밀어냄, max 초과시 low를 당김)
if (high - low < minDist) {
    if (low + minDist <= max)      high = low + minDist
    else { high = max; low = max - minDist }  // low < min 이어도 다음 clamp에서 잘림
}
low  = clamp(low,  min, max)
high = clamp(high, min, max)

// 4) 파생 %
span = max - min
lowProgress  = span > 0 ? ((low  - min) / span) * 100 : 0
highProgress = span > 0 ? ((high - min) / span) * 100 : 0
progress     = highProgress - lowProgress   // activeTrack width

// 5) 표시 문자열
lowText  = data.lowText  ?? String(low)
highText = data.highText ?? String(high)
```

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| sliderInfo | `this.updateSliderValue` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| input | `lowInput`  (fieldRender.cssSelectors) | `@sliderChanged` |
| input | `highInput` (fieldRender.cssSelectors) | `@sliderChanged` |

> `input` 이벤트는 드래그/키보드 연속 발화. 페이지 핸들러는 `event.target.dataset.handle`(`'low'` 또는 `'high'`)을 읽어 어느 핸들이 움직였는지 판단한다.
> 페이지는 새 low/high를 계산하여 `sliderInfo`를 재publish한다 (low > high 방지는 컴포넌트가 보정하므로 페이지가 신경 쓰지 않아도 된다).

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('sliderInfo', this)──> [Range Slider] 렌더링
         publish data: { label: 'Price', low: 200, high: 800, min: 0, max: 1000, step: 10, minDistance: 50, disabled: false }
                       → activeTrack: left=20%, width=60%; lowText='200', highText='800'

[Range Slider] ──@sliderChanged──> [페이지]
               event.target.dataset.handle === 'low'  → state.low  = event.target.value
               event.target.dataset.handle === 'high' → state.high = event.target.value
               → sliderInfo 재publish (low > high 조합이어도 컴포넌트가 보정)
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플 tonal, Pretendard, 그라디언트 활성 구간 + pill 핸들 2개, 라벨/값 한 줄 |
| 02_material    | B: Material Elevated | 라이트 블루 Filled, Roboto, 원형 핸들 + shadow elevation, 값 라벨 양 끝 분리 |
| 03_editorial   | C: Minimal Editorial | 웜 그레이 라이트, Georgia 세리프 라벨, 샤프 각진 핸들 + 얇은 선 트랙, 값 라벨 중앙 위 |
| 04_operational | D: Dark Operational  | 다크 시안 컴팩트, JetBrains Mono 값 표시, 사각 핸들 + 미세 테두리, low/high 인라인 표기 |

### 결정사항

- **drag/keyboard 는 네이티브**. 두 개의 `input[type=range]`가 각자 드래그/키보드/터치/ARIA를 처리한다. 커스텀 드래그 없음.
- **두 input 겹치기 방식**. track을 relative로 두고 두 input을 `position: absolute; inset: 0;`로 겹쳐둔다. track 자체는 투명하고, thumb만 `pointer-events: auto`로 활성화하고, `::-webkit-slider-runnable-track`은 투명하게 처리한다. z-index로 high input을 앞에 두고, 두 thumb이 매우 가까울 때 low가 "아래"에 깔려 클릭이 안 되는 문제를 피하기 위해 dynamic `z-index` 전환은 하지 않고 **`pointer-events`를 `slider-runnable-track`에서 `none`으로 두어 thumb 위에서만 드래그**하게 한다. (MDN 권장 패턴.)
- **activeTrack 양방향 확장** — `.slider__track-active` 하나의 div에 `left%`와 `width%`를 동시에 제어. Centered의 `progressLeft`/`progress` 패턴을 그대로 차용하되 의미가 "두 핸들 사이 구간"으로 바뀜.
- **불변식 보정 위치**: `updateSliderValue`에서 `low ≤ high`와 `minDistance`를 컴포넌트가 보정한다. 페이지는 원시 값을 그대로 publish해도 되며, 컴포넌트가 항상 정합성 있는 상태를 렌더한다.
- **lowText/highText 오버라이드**: 페이지가 단위/포매팅이 필요하면 (`'$200'`, `'8 h'`) `data.lowText`/`data.highText`를 같이 publish한다.
- **양방향 값 흐름**: 컴포넌트는 상태를 소유하지 않는다. 두 input 중 하나의 input 이벤트 → 페이지가 새 low/high 결정 → `sliderInfo` 재publish. `data-handle="low|high"`로 어느 쪽이 움직였는지 구분.
- **신규 Mixin 금지 준수**. Basic/Centered와 같은 FieldRenderMixin + 커스텀 메서드 조합.
