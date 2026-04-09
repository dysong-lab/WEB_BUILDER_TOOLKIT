# Buttons — Standard

## 기능 정의

1. **라벨/아이콘 표시** — buttonInfo 토픽으로 수신한 데이터를 버튼의 라벨 텍스트와 아이콘 영역에 렌더
2. **버튼 클릭 이벤트** — 버튼 클릭 시 @buttonClicked 발행

---

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| button | `.button` | 버튼 요소 — 이벤트 매핑 |
| label | `.button__label` | 라벨 텍스트 |
| icon | `.button__icon` | 아이콘 (선택적) |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| buttonInfo | `this.fieldRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `button` (cssSelectors) | `@buttonClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──publish(buttonInfo, { label, icon })──> [Buttons] 렌더링

[Buttons] ──@buttonClicked──> [페이지] ──> 원하는 액션 수행
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | Filled 스타일 — 다크, Pretendard |
| 02_material | B: Material Elevated | Elevated 스타일 — shadow, 라이트, Roboto |
| 03_editorial | C: Minimal Editorial | Text 스타일 — 미니멀, 라이트, 세리프 |
| 04_operational | D: Dark Operational | Outlined 스타일 — 컴팩트, 다크, 모노스페이스 |
