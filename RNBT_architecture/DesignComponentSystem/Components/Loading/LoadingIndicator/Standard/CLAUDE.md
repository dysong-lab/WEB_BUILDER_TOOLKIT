# LoadingIndicator — Standard

## 기능 정의

1. **진행 상태 시각 표시** — CSS 애니메이션으로 짧은 대기 시간의 비확정(indeterminate) 진행 상태를 표시한다. 데이터 바인딩 불필요.

---

## 구현 명세

### Mixin

Mixin 불필요

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| indicator | `.loading-indicator` | 인디케이터 컨테이너 |

> cssSelectors는 Mixin이 아닌 자체 계약으로 사용. 외부에서 DOM 접근 시 이 선택자를 통한다.

### 구독 (subscriptions)

없음 (데이터 바인딩 없음)

### 이벤트 (customEvents)

없음 (상호작용 없음)

### 커스텀 메서드

없음

### 페이지 연결 사례

```
LoadingIndicator는 데이터나 이벤트 없이 HTML/CSS만으로 동작한다.
페이지에 배치하면 자동으로 로딩 애니메이션을 표시한다.
페이지에서 표시/숨김을 제어하려면 컨테이너의 display/visibility를 직접 변경한다.
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 다크 배경, 원형 스피너, 퍼플 그라디언트 트랙 |
| 02_material | B: Material Elevated | 라이트 배경, 원형 스피너, elevation shadow |
| 03_editorial | C: Minimal Editorial | 라이트 배경, 3-dot 페이드, 미니멀 세리프 라벨 |
| 04_operational | D: Dark Operational | 다크 배경, 3-dot 펄스, 시안 톤 컴팩트 |

### 결정사항

- **Mixin 불필요**: LoadingIndicator는 순수 시각적 요소로, 외부 데이터나 이벤트가 불필요하다. CSS keyframes 애니메이션만으로 동작한다.
- **비확정(indeterminate) 전용**: MD3 LoadingIndicator는 비확정 진행 표시기의 대체. 확정(determinate) 진행 표시는 ProgressIndicators가 담당한다.
- **Persona D 모션**: Dark Operational 페르소나의 "상태 표시용 모션(펄스, 깜빡임)" 특성을 활용한다.
