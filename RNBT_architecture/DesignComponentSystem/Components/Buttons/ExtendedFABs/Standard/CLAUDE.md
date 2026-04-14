# ExtendedFABs — Standard

## 기능 정의

1. **아이콘/라벨 표시** — extendedFabInfo 토픽으로 수신한 데이터를 리딩 아이콘과 라벨 영역에 렌더
2. **클릭 이벤트** — Extended FAB 클릭 시 @extendedFabClicked 발행

---

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| extendedFab | `.extended-fab` | 컨테이너 — 이벤트 매핑 |
| icon        | `.extended-fab__icon` | 리딩 아이콘 |
| label       | `.extended-fab__label` | 라벨 텍스트 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| extendedFabInfo | `this.fieldRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `extendedFab` (cssSelectors) | `@extendedFabClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('extendedFabInfo', this)──> [ExtendedFABs] 렌더링 ({ icon, label })

[ExtendedFABs] ──@extendedFabClicked──> [페이지] ──> 주요 액션 실행
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 다크, Pretendard, primary 그라데이션, elevation |
| 02_material | B: Material Elevated | 라이트, Roboto, surface container, level 3 shadow |
| 03_editorial | C: Minimal Editorial | 라이트, Georgia, outline only, 미니멀 |
| 04_operational | D: Dark Operational | 다크, JetBrains Mono, 컴팩트, 시안 outline |
