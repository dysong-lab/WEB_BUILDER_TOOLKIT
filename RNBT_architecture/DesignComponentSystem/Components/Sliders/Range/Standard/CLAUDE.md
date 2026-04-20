# Range — Standard

## MD3 정의

> Range sliders allow users to select a range of values using two handles.

## 역할

두 개의 핸들로 최솟값과 최댓값 범위를 선택할 수 있게 하는 슬라이더이다.

## 기능 정의

1. **범위 정보 렌더링** — `startValue`, `endValue`, `min`, `max`, `step`, `supportingText`를 DOM에 반영
2. **양 끝 값 제어** — 두 핸들로 최소/최대 범위를 조정
3. **교차 방지** — 시작 핸들이 끝 핸들을 넘지 않도록 값을 clamp
4. **커밋 이벤트 발행** — 조작 중/조작 완료 시 현재 범위를 이벤트로 알림
5. **선택 구간 시각화** — 전체 트랙 중 선택 구간 fill과 출력값을 동기화

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.range-slider` | 루트 요소 |
| eyebrow | `.range-slider__eyebrow` | 보조 카테고리 텍스트 |
| label | `.range-slider__label` | 메인 라벨 |
| value | `.range-slider__value` | 현재 선택 범위 출력 |
| lowerInput | `.range-slider__input--lower` | 시작값 range input |
| upperInput | `.range-slider__input--upper` | 끝값 range input |
| fill | `.range-slider__fill` | 선택 구간 fill |
| minLabel | `.range-slider__min-label` | 최소값 레이블 |
| maxLabel | `.range-slider__max-label` | 최대값 레이블 |
| supportingText | `.range-slider__supporting` | 보조 설명 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| rangeSliderInfo | `this.renderRangeSliderInfo` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| input | `.range-slider__input--lower` | `@rangeSliderInputChanged` |
| input | `.range-slider__input--upper` | `@rangeSliderInputChanged` |
| change | `.range-slider__input--lower` | `@rangeSliderChanged` |
| change | `.range-slider__input--upper` | `@rangeSliderChanged` |

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.getElement(key)` | selector key에 해당하는 DOM 요소를 반환 |
| `this.normalizeRangeInfo(data)` | 범위 렌더링 데이터를 정규화 |
| `this.syncRangeUi()` | 두 핸들 값, fill 위치, 출력값을 동기화 |
| `this.constrainRange(source)` | lower/upper 값이 교차하지 않도록 보정 |
| `this.renderRangeSliderInfo(data)` | 외부 데이터로 range slider 상태를 갱신 |

### 데이터 계약

```javascript
{
  eyebrow: "Schedule",
  label: "Preferred humidity window",
  startValue: 38,
  endValue: 62,
  min: 0,
  max: 100,
  step: 1,
  minLabel: "0%",
  maxLabel: "100%",
  supportingText: "Keep alerts within the selected target band",
  disabled: false,
  valuePrefix: "",
  valueSuffix: "%"
}
```

### 표시 규칙

- `startValue <= endValue`를 항상 보장
- lower/upper input 모두 동일한 `min`, `max`, `step`을 사용
- 선택 구간 fill은 start/end 비율을 CSS 변수로 저장해 렌더링
- `disabled=true`면 두 input 모두 비활성화하고 루트에 상태를 반영

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 선택 구간을 유리 패널 위에 떠 보이게 한 범위 제어 UI |
| 02_material | B: Material Balance | 밝은 서피스 카드에 맞춘 범위 슬라이더 |
| 03_editorial | C: Editorial Utility | 숫자 범위 표시를 크게 드러낸 편집형 구성 |
| 04_operational | D: Operational Console | 경계값 관리에 초점을 둔 콘솔형 범위 컨트롤 |
