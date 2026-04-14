# FAB — Standard

## 기능 정의

1. **아이콘 표시** — fabInfo 토픽으로 수신한 데이터를 아이콘 영역에 렌더
2. **클릭 이벤트** — FAB 클릭 시 @fabClicked 발행

---

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| fab  | `.fab`       | 컨테이너 — 이벤트 매핑 |
| icon | `.fab__icon` | 아이콘 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| fabInfo | `this.fieldRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `fab` (cssSelectors) | `@fabClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('fabInfo', this)──> [FAB] 렌더링 ({ icon })

[FAB] ──@fabClicked──> [페이지] ──> 주요 액션 실행
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 다크, primary 그라데이션, elevation |
| 02_material | B: Material Elevated | 라이트, surface container, level 3 shadow |
| 03_editorial | C: Minimal Editorial | 라이트, outline only, 미니멀 |
| 04_operational | D: Dark Operational | 다크, 컴팩트, 시안 outline |
