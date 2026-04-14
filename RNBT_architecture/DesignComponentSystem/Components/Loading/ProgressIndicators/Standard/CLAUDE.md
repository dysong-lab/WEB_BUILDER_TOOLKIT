# ProgressIndicators — Standard

## 기능 정의

1. **진행 상태 표시** — 선형 또는 원형 진행 상태를 determinate/indeterminate 형태로 표시한다
2. **진행 값 반영** — `value`, `max` 값을 기준으로 진행 비율과 텍스트를 갱신한다
3. **유형/톤 상태 전환** — `kind`, `tone`, `indeterminate` 상태에 따라 표시 형태와 색상을 전환한다
4. **접근성 값 동기화** — `role="progressbar"`와 관련 `aria-*` 속성을 현재 상태와 동기화한다

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.progress-indicator` | 루트 상태 반영 |
| label | `.progress-indicator__label` | 라벨 텍스트 |
| value | `.progress-indicator__value` | 진행 값 텍스트 |
| linearFill | `.progress-indicator__linear-fill` | 선형 진행 채움 |
| circularMeter | `.progress-indicator__circular-meter` | 원형 진행 채움 |

### 구독 (subscriptions)

없음

### 이벤트 (customEvents)

없음

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.renderProgressInfo(data)` | `kind`, `value`, `max`, `indeterminate`, `label`, `tone` 값을 현재 진행 표시 상태에 반영한다 |

### 데이터 계약

```javascript
{
  kind: "linear",        // "linear" | "circular"
  value: 42,
  max: 100,
  indeterminate: false,
  label: "Deployment",
  tone: "accent"         // "accent" | "neutral" | "success" | "warning"
}
```

### 표시 규칙

- `kind`가 유효하지 않으면 `linear`로 처리
- `max`가 0 이하이거나 숫자가 아니면 `100`으로 처리
- `value`는 `0 ~ max` 범위로 보정
- `indeterminate`가 `true`면 `aria-valuenow`를 제거하고 애니메이션 상태만 유지
- `tone`이 유효하지 않으면 `accent`로 처리

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 발광형 선형/원형 진행 표시 |
| 02_material | B: Material Elevated | MD3 기반 라이트 프로그레스 바 |
| 03_editorial | C: Minimal Editorial | 미니멀 편집형 진행 상태 표시 |
| 04_operational | D: Dark Operational | HUD형 선형/링 진행 표시 |
