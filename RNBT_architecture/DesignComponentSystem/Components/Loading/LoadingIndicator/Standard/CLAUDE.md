# LoadingIndicator — Standard

## 기능 정의

1. **짧은 대기 상태 표시** — 로딩 인디케이터를 짧은 대기 시간용 시각 요소로 표시한다
2. **레이블 동기화** — 전달된 `label` 값을 보조 텍스트와 접근성 레이블에 반영한다
3. **크기/톤 상태 반영** — `size`, `tone`, `active` 상태를 루트 요소와 인디케이터에 반영한다

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.loading-indicator` | 루트 상태 반영 |
| track | `.loading-indicator__track` | 애니메이션 인디케이터 |
| label | `.loading-indicator__label` | 보조 텍스트 |

### 구독 (subscriptions)

없음

### 이벤트 (customEvents)

없음

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.renderLoadingInfo(data)` | `label`, `size`, `tone`, `active` 값을 루트 상태와 접근성 속성에 반영한다 |

### 데이터 계약

```javascript
{
  label: "Syncing data",
  size: "md",         // "sm" | "md" | "lg"
  tone: "accent",     // "accent" | "neutral" | "success" | "warning"
  active: true
}
```

### 표시 규칙

- `label`이 `null` 또는 `undefined`면 빈 문자열로 처리
- `size`가 유효하지 않으면 `md`로 처리
- `tone`이 유효하지 않으면 `accent`로 처리
- `active`가 `false`면 애니메이션을 멈추고 `aria-busy="false"`로 반영

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 블루 바이올렛 하이라이트, 부드러운 글래스 패널 |
| 02_material | B: Material Elevated | 라이트 서피스, MD3에 가까운 중립형 |
| 03_editorial | C: Minimal Editorial | 종이 질감, 미니멀 타이포 중심 |
| 04_operational | D: Dark Operational | HUD형 다크 패널, 시안 포인트 |
