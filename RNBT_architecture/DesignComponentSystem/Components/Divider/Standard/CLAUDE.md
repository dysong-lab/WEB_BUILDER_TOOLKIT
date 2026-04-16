# Divider — Standard

## 기능 정의

1. **시각적 구분** — 콘텐츠를 그룹화하는 얇은 구분선을 표시한다. 순수 HTML + CSS로 구현하며, 데이터 바인딩이 필요 없다.

---

## 구현 명세

### Mixin

Mixin 불필요

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| divider | `.divider` | 구분선 요소 |

> cssSelectors는 Mixin이 아닌 자체 계약으로 사용. 외부에서 DOM 접근 시 이 선택자를 통한다.

### 구독 (subscriptions)

없음 (데이터 바인딩 없음)

### 이벤트 (customEvents)

없음 (상호작용 없음)

### 커스텀 메서드

없음

### 페이지 연결 사례

```
Divider는 데이터나 이벤트 없이 HTML/CSS만으로 동작한다.
페이지에 배치하면 자동으로 구분선을 표시한다.
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 배경, 그라디언트 구분선, 퍼플 톤 |
| 02_material    | B: Material Elevated | 라이트 배경, 중립 회색 실선, 깨끗한 구분 |
| 03_editorial   | C: Minimal Editorial | 라이트 배경, 얇고 연한 따뜻한 회색, 넓은 여백 |
| 04_operational | D: Dark Operational  | 다크 배경, 쿨 톤 시안 기운, 컴팩트 밀도 |

### 결정사항

- **Mixin 불필요**: Divider는 순수 시각적 요소로, 데이터 바인딩/이벤트/구독이 모두 불필요하다.
- **Full-width / Inset / Middle 변형**: MD3에서 divider는 full-width(전체 너비), inset(인덴트), middle(양쪽 인덴트) 변형이 있다. Standard에서는 full-width를 기본으로 제공하되, CSS 클래스(`--inset`, `--middle`)로 변형을 표현한다.
- **수직 구분선**: `--vertical` 변형을 CSS 클래스로 지원한다.
