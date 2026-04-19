# Centered

## MD3 정의

> Centered sliders allow users to select an offset from a center reference point.

## 역할

중앙 기준점으로부터의 오프셋을 선택할 수 있게 하는 슬라이더이다.

## 기능 정의

1. **오프셋 정보 렌더링** — 중심 기준 슬라이더의 `label`, `value`, `min`, `max`, `step`을 DOM에 반영
2. **양방향 오프셋 선택** — 음수/양수 방향으로 값을 조정
3. **커밋 이벤트 발행** — 조작 중/조작 완료 시 현재 offset 값을 이벤트로 알림
4. **중심 기준 시각화** — 중앙 기준선과 좌우 fill 영역을 현재 값에 맞춰 동기화

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.centered-slider` | 루트 요소 |
| eyebrow | `.centered-slider__eyebrow` | 보조 카테고리 텍스트 |
| label | `.centered-slider__label` | 메인 라벨 |
| value | `.centered-slider__value` | 현재 offset 출력 |
| input | `.centered-slider__native` | 네이티브 range input |
| fill | `.centered-slider__fill` | 중심 기준 fill 영역 |
| centerMark | `.centered-slider__center-mark` | 중앙 기준선 |
| negativeLabel | `.centered-slider__negative-label` | 음수 방향 레이블 |
| positiveLabel | `.centered-slider__positive-label` | 양수 방향 레이블 |
| supportingText | `.centered-slider__supporting` | 보조 설명 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| centeredSliderInfo | `this.renderCenteredSliderInfo` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| input | `.centered-slider__native` | `@centeredSliderInputChanged` |
| change | `.centered-slider__native` | `@centeredSliderChanged` |

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.getElement(key)` | selector key에 해당하는 DOM 요소를 반환 |
| `this.normalizeCenteredInfo(data)` | offset 렌더링 데이터를 정규화 |
| `this.syncCenteredUi()` | 중심 기준 fill 위치와 출력값을 동기화 |
| `this.renderCenteredSliderInfo(data)` | 외부 데이터로 centered slider 상태를 갱신 |

### 데이터 계약

```javascript
{
  eyebrow: "Ambient",
  label: "Temperature bias",
  value: -2,
  min: -10,
  max: 10,
  step: 1,
  negativeLabel: "Cooler",
  positiveLabel: "Warmer",
  supportingText: "Offset the baseline temperature target",
  disabled: false,
  valuePrefix: "",
  valueSuffix: "°"
}
```

### 표시 규칙

- 기본 center 값은 `(min + max) / 2`
- 출력 텍스트는 양수일 때 `+` 기호를 붙이고 `valuePrefix`, `valueSuffix`를 함께 사용
- fill 영역은 center를 기준으로 좌/우 어느 쪽으로 이동했는지에 따라 시작점과 길이를 별도 계산
- `disabled=true`면 `input.disabled`, `data-disabled`, `aria-disabled`를 함께 반영

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 중심 기준선을 강조한 정밀 튜닝 패널 |
| 02_material | B: Material Balance | MD3 카드 문맥에 맞춘 오프셋 제어 UI |
| 03_editorial | C: Editorial Utility | 좌우 의미 레이블을 강조한 매거진형 조절기 |
| 04_operational | D: Operational Console | 양극 편차를 빠르게 읽도록 만든 관제 슬라이더 |
