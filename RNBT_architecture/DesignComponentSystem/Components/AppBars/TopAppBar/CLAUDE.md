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

| 파일 | 설명 |
|------|------|
| 01_small | 표준 소형 앱바 (좌측 nav icon + 제목 + 우측 액션) |
| 02_center_aligned | 중앙 정렬 제목 |
| 03_with_avatar | 우측에 사용자 아바타 포함 |
