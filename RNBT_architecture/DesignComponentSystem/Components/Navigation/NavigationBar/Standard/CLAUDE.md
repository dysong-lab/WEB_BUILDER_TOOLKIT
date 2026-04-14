# NavigationBar — Standard

## 기능 정의

1. **항목 렌더링** — `navigationMenu` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링하고, 개별 항목의 활성 상태를 관리한다
2. **항목 클릭 이벤트** — 내비게이션 항목 클릭 시 `@navItemClicked` 발행

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.nav-bar__list` | 항목이 추가될 부모 (규약) |
| template | `#nav-bar-item-template` | cloneNode 대상 (규약) |
| menuid | `.nav-bar__item` | 항목 식별 + 이벤트 매핑 |
| active | `.nav-bar__item` | 활성 상태 (data-active) |
| icon | `.nav-bar__icon` | 아이콘 표시 |
| label | `.nav-bar__label` | 라벨 텍스트 |

### itemKey

menuid

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| menuid | menuid |
| active | active |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| navigationMenu | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `menuid` (computed property) | `@navItemClicked` |

### 페이지 연결 사례

```
[NavigationBar] ──@navItemClicked──> [페이지] ──> 라우팅 / 뷰 전환
                                               + updateItemState로 활성 항목 변경
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 팔레트, 그라디언트 깊이, 다크, Pretendard |
| 02_material | B: Material Elevated | 블루 팔레트, shadow elevation, 라이트, Roboto |
| 03_editorial | C: Minimal Editorial | 웜 그레이, 세리프 제목, 라이트, 넓은 여백 |
| 04_operational | D: Dark Operational | 시안 팔레트, 모노스페이스, 다크, 컴팩트 |
