# IconButtons — Standard

## 기능 정의

1. **아이콘 표시** — iconButtonInfo 토픽으로 수신한 데이터를 아이콘 영역에 렌더
2. **클릭 이벤트** — 아이콘 버튼 클릭 시 @iconButtonClicked 발행

---

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| iconButton | `.icon-button`       | 컨테이너 — 이벤트 매핑 |
| icon       | `.icon-button__icon` | 아이콘 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| iconButtonInfo | `this.fieldRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `iconButton` (cssSelectors) | `@iconButtonClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──publish(iconButtonInfo, { icon })──> [IconButton] 렌더링

[IconButton] ──@iconButtonClicked──> [페이지] ──> 부수적 액션 실행
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | Filled 스타일 — 다크, primary 컨테이너 |
| 02_material | B: Material Elevated | Filled tonal — 라이트, secondary container |
| 03_editorial | C: Minimal Editorial | Standard — 라이트, 컨테이너 없음, 미니멀 |
| 04_operational | D: Dark Operational | Outlined — 다크, 컴팩트, 시안 outline |
