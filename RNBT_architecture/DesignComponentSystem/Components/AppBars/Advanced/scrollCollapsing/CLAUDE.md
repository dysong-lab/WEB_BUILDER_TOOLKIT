# AppBars — Advanced / scrollCollapsing

## 기능 정의

1. **스크롤 반응형 높이 전환** — 스크롤 위치가 threshold를 넘으면 AppBar를 collapsed 상태로 전환하고, 다시 올라오면 expanded 상태로 복귀한다.
2. **제목 렌더링** — `appBarInfo` 토픽으로 수신한 제목 데이터를 렌더한다.
3. **네비게이션 트리거** — nav-icon 클릭 시 `@navigationClicked`를 발행한다.
4. **액션 트리거** — action 버튼 클릭 시 `@actionClicked`를 발행한다.

> Standard와의 분리 정당성: `scrollListener`와 `expand/collapse` 커스텀 메서드가 추가되고, AppBar 상태가 스크롤 컨테이너에 종속되므로 별도 Advanced 구현으로 분리한다.

---

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| title | `.top-app-bar__title` | 제목 텍스트 표시 |
| bar | `.top-app-bar` | 루트 요소, collapsed 상태 dataset 적용 |
| navIcon | `.top-app-bar__nav-icon` | 네비게이션 아이콘 클릭 이벤트 |
| action | `.top-app-bar__action` | 액션 버튼 클릭 이벤트 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| appBarInfo | `this.fieldRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|-------------------|------|
| click | `navIcon` | `@navigationClicked` |
| click | `action` | `@actionClicked` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `attachScrollListener({ container, threshold })` | 스크롤 컨테이너에 listener를 붙이고 초기 상태를 동기화한다 |
| `detachScrollListener()` | 기존 scroll listener를 제거한다 |
| `syncScrollState(scrollTop)` | threshold와 현재 scrollTop을 비교해 `collapse()` / `expand()`를 호출한다 |
| `collapse()` | `data-collapsed="true"` 적용 |
| `expand()` | `data-collapsed="false"` 적용 |

### 페이지 연결 사례

```
[페이지 scroll container] ──scroll──▶ [AppBars/Advanced/scrollCollapsing]
                                         └─ attachScrollListener(...)
                                            └─ syncScrollState(scrollTop)
                                               ├─ collapse()
                                               └─ expand()

[AppBars/Advanced/scrollCollapsing] ──@navigationClicked──▶ [페이지]
[AppBars/Advanced/scrollCollapsing] ──@actionClicked──────▶ [페이지]
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 팔레트, 그라디언트 깊이, expanded/collapsed 높이 대비 |
| 02_material | B: Material Elevated | 라이트 서피스, 소프트 쉐도우, MD inspired collapse motion |
| 03_editorial | C: Minimal Editorial | 여백 중심, 세리프 타이포, 절제된 스크롤 축소 |
| 04_operational | D: Dark Operational | 밀집형 관제 바, 쿨 톤, compact collapse |
