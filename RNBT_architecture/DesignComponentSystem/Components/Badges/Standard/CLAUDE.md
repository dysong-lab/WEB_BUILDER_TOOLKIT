# Badges — Standard

## 기능 정의

1. **배지 값 표시** — `badgeInfo` 토픽으로 수신한 데이터를 배지 영역에 렌더
   - count/label이 있으면 Large 모드 (텍스트 표시)
   - 없으면 Small 모드 (점 표시)

---

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| badge | `.badge` | 루트 요소, Small/Large 모드 클래스 토글 |
| label | `.badge__label` | 카운트/레이블 텍스트 표시 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| badgeInfo | `updateBadge` (커스텀 메서드) |

### 이벤트 (customEvents)

없음 (정보 표시 전용)

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| updateBadge | badgeInfo 데이터를 받아 Small/Large 모드 전환(CSS 클래스 토글) + `this.fieldRender.renderData` 호출 |

### 페이지 연결 사례

```
[페이지] ──badgeInfo 토픽──> [Badges/Standard] ──> 배지 표시

예:
  before-load.js에서 알림 카운트 구독
  → { count: 3 } → Large 모드, "3" 표시
  → { count: 99 } → Large 모드, "99+" 표시
  → {} 또는 { count: 0 } → Small 모드, 점 표시
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 팔레트, 그라디언트 깊이, 다크, Pretendard |
| 02_material | B: Material Elevated | 블루 팔레트, shadow elevation, 라이트, Roboto |
| 03_editorial | C: Minimal Editorial | 웜 그레이, 세리프 제목, 라이트, 넓은 여백 |
| 04_operational | D: Dark Operational | 시안 팔레트, 모노스페이스, 다크, 상태 펄스 |
