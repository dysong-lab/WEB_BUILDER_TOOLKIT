# Basic

## MD3 정의

> Standard sliders allow users to make selections from a range of values.

## 역할

값 범위에서 단일 값을 선택할 수 있게 하는 기본 슬라이더이다.

## 기능 정의

1. **슬라이더 정보 렌더링** — `label`, `value`, `min`, `max`, `step`, `supportingText`를 DOM에 반영
2. **연속 값 선택** — 드래그/키보드 조작 중 현재 값을 즉시 반영
3. **커밋 이벤트 발행** — 조작이 확정되면 현재 값을 이벤트로 알림
4. **시각 상태 동기화** — fill 길이, 출력값, 비활성 상태를 현재 값과 동기화

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.slider` | 루트 요소 |
| eyebrow | `.slider__eyebrow` | 보조 카테고리 텍스트 |
| label | `.slider__label` | 메인 라벨 |
| value | `.slider__value` | 현재 값 출력 |
| input | `.slider__native` | 네이티브 range input |
| fill | `.slider__fill` | 채워진 트랙 영역 |
| minLabel | `.slider__min-label` | 최소값 레이블 |
| maxLabel | `.slider__max-label` | 최대값 레이블 |
| supportingText | `.slider__supporting` | 보조 설명 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| sliderInfo | `this.renderSliderInfo` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| input | `.slider__native` | `@sliderInputChanged` |
| change | `.slider__native` | `@sliderChanged` |

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.getElement(key)` | selector key에 해당하는 DOM 요소를 반환 |
| `this.normalizeSliderInfo(data)` | 렌더링용 숫자/문자열 데이터를 정규화 |
| `this.syncSliderUi()` | fill 길이, 출력값, disabled 상태를 동기화 |
| `this.renderSliderInfo(data)` | 외부 데이터로 슬라이더 상태를 갱신 |

### 데이터 계약

```javascript
{
  eyebrow: "Cooling",
  label: "Output level",
  value: 48,
  min: 0,
  max: 100,
  step: 1,
  minLabel: "0%",
  maxLabel: "100%",
  supportingText: "Match fan output to the active load",
  disabled: false,
  valuePrefix: "",
  valueSuffix: "%"
}
```

### 표시 규칙

- `min`, `max`, `value`, `step`은 숫자로 강제 변환하고 유효하지 않으면 각각 `0`, `100`, `0`, `1`을 기본값으로 사용
- `value`는 항상 `min ~ max` 범위 안으로 clamp
- `valuePrefix`, `valueSuffix`가 없으면 빈 문자열로 처리
- `disabled=true`면 `input.disabled`, `data-disabled`, `aria-disabled`를 함께 반영
- fill 길이는 `(value - min) / (max - min)` 비율로 계산

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 유리 질감과 청록 포인트의 정밀 제어 패널 |
| 02_material | B: Material Balance | MD3 라이트 서피스 중심의 기본 슬라이더 |
| 03_editorial | C: Editorial Utility | 웜 뉴트럴과 큰 숫자 타이포 중심의 편집형 UI |
| 04_operational | D: Operational Console | 어두운 관제 콘솔 톤의 밀도 높은 장비 제어 UI |
