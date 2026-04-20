# Sliders/Centered — Standard

## 기능 정의

1. **슬라이더 상태 렌더링** — `sliderInfo` 토픽으로 수신한 객체
   (`{ label, value, min, max, step, center?, disabled, valueText? }`)를
   라벨/값 표시/핸들 위치/활성 트랙(중앙 기준 좌/우 확장)에 반영한다.
   - 핸들은 `input[type=range]`로 네이티브 구현하여 드래그와 키보드 조작(←/→/Home/End)을 기본 지원한다.
   - 활성 트랙은 **중앙 기준점**(`center`, 미지정 시 `(min + max) / 2`)에서 현재 `value`까지 확장된다.
     `value > center`면 중앙에서 오른쪽으로, `value < center`면 중앙에서 왼쪽으로 뻗는다.
   - `progressLeft`(%)와 `progress`(%)는 페이지 입력값에서 파생되므로 컴포넌트 내부에서 계산한다.
   - `valueText`가 주어지지 않으면 부호(`+`/`-`)를 붙여 자동 포맷한다 (`center` 기준 오프셋 의미 강조).
2. **값 변경 이벤트** — 드래그 또는 키보드로 값이 바뀌는 순간 `@sliderChanged` 발행
   (페이지가 다음 값을 결정하여 `sliderInfo`로 다시 publish하는 양방향 흐름).

> **MD3 근거**: Material Design 3 "Centered sliders select a value from a positive and negative value range. Use this when zero, or the default value, is in the middle of the range." ([m3.material.io/components/sliders/specs](https://m3.material.io/components/sliders/specs))

---

## 구현 명세

### Mixin

**FieldRenderMixin** + 커스텀 메서드 1개 (`updateSliderValue`).

- FieldRenderMixin — 고정 DOM(label, input, valueLabel, activeTrack) 요소에 한 객체의 값들을 매핑한다.
- 커스텀 메서드 — `value/min/max/center`로부터
  - `progressLeft`(%) = min(value, center) 지점의 left% 좌표
  - `progress`(%)     = |value - center| 을 span으로 정규화한 width%
  - `valueText`       = 페이지가 주지 않으면 `±N` 포맷
  을 파생하여 fieldRender에 넘긴다.
- 드래그/키보드 조작은 `input[type=range]` 네이티브를 그대로 사용한다. (커스텀 드래그 구현 없음)
- **신규 Mixin은 만들지 않는다.** Basic과 동일 패턴, 파생 계산만 변경.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| slider        | `.slider`                  | 루트 — `data-disabled` 대상 + 이벤트 매핑 컨테이너 |
| label         | `.slider__label`           | 라벨 텍스트 (textContent) |
| valueText     | `.slider__value-label`     | 포맷된 현재 값 (textContent, 부호 포함) |
| input         | `.slider__input`           | `input[type=range]` — 속성 대상 + input 이벤트 대상 |
| min           | `.slider__input`           | input의 `min` 속성 (elementAttrs) |
| max           | `.slider__input`           | input의 `max` 속성 (elementAttrs) |
| step          | `.slider__input`           | input의 `step` 속성 (elementAttrs) |
| value         | `.slider__input`           | input의 `value` 속성 (elementAttrs) |
| progress      | `.slider__track-active`    | 활성 트랙 너비 — `style.width = N%` (styleAttrs) |
| progressLeft  | `.slider__track-active`    | 활성 트랙 좌측 좌표 — `style.left  = N%` (styleAttrs) |

> `label` ↔ `input` 라벨 연결(`<label for>`)은 HTML에서 고정 id (`slider-centered-input`)로 처리하므로 KEY로 관리하지 않는다.
> `progress`와 `progressLeft`는 **같은 DOM 요소의 서로 다른 스타일 속성** — 중앙 기준 좌/우 확장을 표현하기 위한 두 파생값.

### datasetAttrs

(없음 — `disabled` 플래그는 커스텀 매핑으로 `.slider` 루트 요소의 `data-disabled`에 직접 반영한다. Basic과 동일 처리.)

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

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `updateSliderValue({ response: data })` | 페이지가 publish한 `{ label, value, min, max, step, center?, disabled, valueText? }`에서 `progressLeft`/`progress`/`valueText`를 파생하고, selector KEY에 맞춘 객체를 만들어 `this.fieldRender.renderData`에 위임한다. `disabled` 플래그는 루트 요소(`.slider`)에 `data-disabled`로, input 요소의 `disabled`에도 직접 반영한다. |

파생 규칙:

```
center     = Number.isFinite(data.center) ? data.center : (min + max) / 2
span       = max - min
leftVal    = min(value, center)                         // 두 지점 중 왼쪽
widthVal   = |value - center|                           // 두 지점 사이 거리
progressLeft = span > 0 ? ((leftVal - min) / span) * 100 : 50
progress     = span > 0 ? (widthVal / span) * 100       : 0
valueText    = data.valueText ?? (
                   value > center ? `+${value - center}` :
                   value < center ? `-${center - value}` :
                   '0'
               )
```

> value=center일 때 width=0 → 활성 트랙은 보이지 않지만 "중앙"이라는 의미는 핸들 위치와 표시값으로 전달된다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| sliderInfo | `this.updateSliderValue` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| input | `input` (fieldRender.cssSelectors) | `@sliderChanged` |

> `input` 이벤트는 드래그/키보드 연속 발화. 페이지는 `event.target.value`로 새 값을 읽고 `sliderInfo`를 재publish한다.

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('sliderInfo', this)──> [Slider] 렌더링
         publish data: { label: 'Pan', value: 20, min: -50, max: 50, step: 1, center: 0, disabled: false }
                      → 활성 트랙이 0(중앙)에서 +20까지 오른쪽으로 확장, valueText='+20'

[Slider] ──@sliderChanged──> [페이지] ──> event.target.value 읽어서
                                         state 갱신 + sliderInfo 재publish
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플 tonal, Pretendard, 그라디언트 활성 트랙 + 중앙 틱 마크 + pill 핸들 |
| 02_material    | B: Material Elevated | 라이트 블루 Filled, Roboto, 굵은 핸들 + shadow elevation + 중앙 수직선 |
| 03_editorial   | C: Minimal Editorial | 웜 그레이 라이트, Georgia 세리프 라벨, 샤프 각진 핸들 + 얇은 트랙 + 중앙 마커 |
| 04_operational | D: Dark Operational  | 다크 시안 컴팩트, JetBrains Mono 값 표시, 사각 핸들 + 미세 테두리 + 중앙 눈금 |

### 결정사항

- **drag/keyboard 는 네이티브**. `input[type=range]`가 드래그/키보드/터치/ARIA를 처리한다. 커스텀 드래그 없음.
- **activeTrack 중앙 기준 확장** — `.slider__track-active` 하나의 div에 `left%`와 `width%`를 동시에 제어. 중앙 기준점(`center`)은 HTML에 정적 중앙 마커(`.slider__track-center`)로 시각화.
- **값 계산 위치**: 파생은 컴포넌트 커스텀 메서드 `updateSliderValue`에서. 페이지는 원시 `{ label, value, min, max, step, center, disabled }`만 신경 쓴다.
- **center 기본값**: 페이지가 `center`를 생략하면 `(min + max) / 2`로 자동 계산. 예: `min=-50, max=50` → center=0.
- **valueText 부호 포맷**: 페이지가 `valueText`를 주지 않으면 컴포넌트가 `center` 기준 오프셋에 `+`/`-` 부호를 붙여 표시. 페이지가 단위가 필요하면 (`'+20dB'`, `'-3°'`) `data.valueText`를 같이 publish.
- **양방향 값 흐름**: 컴포넌트는 상태를 소유하지 않는다. input 이벤트 → 페이지가 새 value 결정 → `sliderInfo` 재publish.
