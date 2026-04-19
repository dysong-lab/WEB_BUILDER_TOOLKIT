# Sliders/Basic — Standard

## 기능 정의

1. **슬라이더 상태 렌더링** — `sliderInfo` 토픽으로 수신한 객체(`{ label, value, min, max, step, disabled }`)를
   라벨/값 표시/핸들 위치/활성 트랙 길이에 반영한다.
   - 핸들은 `input[type=range]`로 네이티브 구현하여 드래그와 키보드 조작(←/→/Home/End)을 기본 지원한다.
   - 활성 트랙 길이(`progress`)와 표시값 문자열(`valueText`)은 페이지 입력값에서 파생되므로, 컴포넌트가 내부에서 계산한다.
2. **값 변경 이벤트** — 드래그 또는 키보드로 값이 바뀌는 순간 `@sliderChanged` 발행
   (페이지가 다음 값을 결정하여 `sliderInfo`로 다시 publish하는 양방향 흐름).

---

## 구현 명세

### Mixin

**FieldRenderMixin** + 커스텀 메서드 1개 (`updateSliderValue`).

- FieldRenderMixin — 고정 DOM(label, input, valueLabel, activeTrack) 네 요소에 한 객체의 값들을 매핑한다.
- 커스텀 메서드 — `value/min/max`로부터 `progress`(%) 와 `valueText`(표시 문자열)을 파생하여 fieldRender에 넘긴다.
- 드래그/키보드 조작은 `input[type=range]` 네이티브를 그대로 사용한다. (커스텀 드래그 구현 없음)
- **신규 Mixin은 만들지 않는다.**

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| slider      | `.slider`               | 루트 — `data-disabled` 대상 + 이벤트 매핑 컨테이너 |
| label       | `.slider__label`        | 라벨 텍스트 (textContent) |
| valueText   | `.slider__value-label`  | 포맷된 현재 값 (textContent) |
| input       | `.slider__input`        | `input[type=range]` — value/min/max/step 속성 대상 + input 이벤트 대상 |
| min         | `.slider__input`        | input의 `min` 속성 대상 (elementAttrs) |
| max         | `.slider__input`        | input의 `max` 속성 대상 (elementAttrs) |
| step        | `.slider__input`        | input의 `step` 속성 대상 (elementAttrs) |
| value       | `.slider__input`        | input의 `value` 속성 대상 (elementAttrs) |
| progress    | `.slider__track-active` | 활성 트랙 — `style.width = N%` (styleAttrs) |

> `label` ↔ `input` 라벨 연결(`<label for>`)은 HTML에서 고정 id (`slider-basic-input`)로 처리하므로 KEY로 관리하지 않는다.

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| disabled | `disabled` |

> `cssSelectors`에 `disabled` 전용 KEY는 넣지 않고 `slider` KEY의 요소에 `data-disabled`를 설정하는 방식을 사용하지 않는다.
> 대신 아래 커스텀 매핑으로 처리한다 (아래 "데이터 변환" 참조).

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

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `updateSliderValue({ response: data })` | 페이지가 publish한 `{ label, value, min, max, step, disabled }`에서 `progress`(%) 와 `valueText`(표시 문자열)을 파생하고, selector KEY에 맞춘 객체(`{ label, valueText, value, min, max, step, progress }`)를 만들어 `this.fieldRender.renderData`에 위임한다. `disabled` 플래그는 루트 요소(`.slider`)에 `data-disabled` 속성으로 직접 반영한다. |

파생 규칙:

```
progress = ((value - min) / (max - min)) * 100     // 0~100, clamp
valueText = data.valueText ?? String(value)        // 페이지가 format 결과를 같이 주면 우선
```

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| sliderInfo | `this.updateSliderValue` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| input | `input` (fieldRender.cssSelectors) | `@sliderChanged` |

> `click` 아님. `input` 이벤트는 range/text input에서 드래그/타이핑 중 연속적으로 발생한다.
> 페이지는 핸들러에서 `event.target.value`로 새 값을 읽는다 (`targetInstance`에서 cssSelectors.input으로 요소 조회 가능).

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('sliderInfo', this)──> [Slider] 렌더링
         publish data: { label: 'Brightness', value: 60, min: 0, max: 100, step: 1, disabled: false }

[Slider] ──@sliderChanged──> [페이지] ──> event.target.value 읽어서
                                         state 갱신 + sliderInfo 재publish
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플 tonal, Pretendard, 그라디언트 활성 트랙 + 필(pill) 핸들 |
| 02_material    | B: Material Elevated | 라이트 블루 Filled, Roboto, 굵은 핸들 + shadow elevation |
| 03_editorial   | C: Minimal Editorial | 웜 그레이 라이트, Georgia 세리프 라벨, 샤프 각진 핸들 + 얇은 트랙 |
| 04_operational | D: Dark Operational  | 다크 시안 컴팩트, JetBrains Mono 값 표시, 사각 핸들 + 미세 테두리 |

### 결정사항

- **drag/keyboard 는 네이티브**. `input[type=range]`를 쓰면 드래그, 키보드 ←/→/Home/End, 모바일 터치, 접근성(ARIA)을 브라우저가 이미 처리한다. 커스텀 드래그를 만들 이유가 없다.
- **activeTrack visualization** 은 별도 `div`(`.slider__track-active`)로 표현하고 width %로 제어한다. input 자체는 transparent로 덮어 핸들만 보이게 한다.
- **값 계산 위치**: `progress`와 `valueText`는 컴포넌트 커스텀 메서드 `updateSliderValue`에서 파생한다. 페이지는 원시 `{ label, value, min, max, step, disabled }`만 신경 쓴다.
- **양방향 값 흐름**: 컴포넌트는 상태를 소유하지 않는다. input 이벤트 → 페이지가 새 value 결정 → `sliderInfo` 재publish.
- **valueText 오버라이드**: 페이지가 단위/포매팅이 필요하면(`'60%'`, `'60 °C'`) `data.valueText`를 같이 publish하면 커스텀 메서드가 그 값을 그대로 사용한다.
