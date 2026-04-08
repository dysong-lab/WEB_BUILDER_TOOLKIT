# TopAppBar

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| title | `.top-app-bar__title` | 제목 텍스트 표시 |
| bar | `.top-app-bar` | 루트 요소 |
| navIcon | `.top-app-bar__nav-icon` | 네비게이션 아이콘 클릭 이벤트 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| appBarInfo | `this.fieldRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `navIcon` (computed property) | `@navigationClicked` |

### 페이지 연결 사례

```
[TopAppBar] ──@navigationClicked──▶ [페이지] ──▶ NavigationDrawer.open()
                                              또는 history.back()
                                              또는 SideSheet.toggle()
```


### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 팔레트, 그라디언트 깊이, 다크, Pretendard |
| 02_material | B: Material Elevated | 블루 팔레트, shadow elevation, 라이트, Roboto |
| 03_editorial | C: Minimal Editorial | 웜 그레이, 세리프 제목, 라이트, 넓은 여백 |
| 04_operational | D: Dark Operational | 시안 팔레트, 모노스페이스, 다크, 상태 펄스 |
