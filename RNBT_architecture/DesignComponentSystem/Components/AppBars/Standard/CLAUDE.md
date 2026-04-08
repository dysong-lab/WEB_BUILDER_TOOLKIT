# AppBars — Standard

## 기능 정의

1. **페이지 제목 표시** — `appBarInfo` 토픽으로 수신한 데이터를 제목 영역에 렌더
2. **네비게이션 트리거** — nav-icon 클릭 시 `@navigationClicked` 발행
3. **액션 트리거** — action 버튼 클릭 시 `@actionClicked` 발행

---

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| title | `.top-app-bar__title` | 제목 텍스트 표시 |
| bar | `.top-app-bar` | 루트 요소 |
| navIcon | `.top-app-bar__nav-icon` | 네비게이션 아이콘 클릭 이벤트 |
| action | `.top-app-bar__action` | 액션 버튼 클릭 이벤트 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| appBarInfo | `this.fieldRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `navIcon` (computed property) | `@navigationClicked` |
| click | `action` (computed property) | `@actionClicked` |

### 페이지 연결 사례

```
[AppBars/Standard] ──@navigationClicked──▶ [페이지] ──▶ NavigationDrawer.open()
                                              또는 history.back()
                                              또는 SideSheet.toggle()

[AppBars/Standard] ──@actionClicked─────▶ [페이지] ──▶ 검색 열기
                                              또는 알림 패널 열기
                                              또는 설정 페이지 이동
```


### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 팔레트, 그라디언트 깊이, 다크, Pretendard |
| 02_material | B: Material Elevated | 블루 팔레트, shadow elevation, 라이트, Roboto |
| 03_editorial | C: Minimal Editorial | 웜 그레이, 세리프 제목, 라이트, 넓은 여백 |
| 04_operational | D: Dark Operational | 시안 팔레트, 모노스페이스, 다크, 상태 펄스 |
