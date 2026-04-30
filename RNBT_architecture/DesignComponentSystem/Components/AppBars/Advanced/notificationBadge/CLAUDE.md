# AppBars — Advanced / notificationBadge

## 기능 정의

1. **알림 배지 렌더링** — `badgeInfo` 토픽으로 수신한 count/visible/tone 데이터를 AppBar 액션 버튼의 배지로 렌더한다.
2. **제목 렌더링** — `appBarInfo` 토픽으로 수신한 제목 데이터를 렌더한다.
3. **배지 클릭 릴레이** — 배지 액션 버튼 클릭 시 `@badgeClicked`를 발행한다.
4. **네비게이션 트리거** — nav-icon 클릭 시 `@navigationClicked`를 발행한다.
5. **보조 액션 트리거** — utility action 클릭 시 `@actionClicked`를 발행한다.

> Standard와의 분리 정당성: 별도 토픽(`badgeInfo`) 구독, 배지 visible/tone 제어용 커스텀 메서드, `@badgeClicked` 이벤트가 추가되므로 Advanced 구현으로 분리한다.

---

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| title | `.top-app-bar__title` | 제목 텍스트 표시 |
| bar | `.top-app-bar` | 루트 요소, 배지 tone dataset 적용 |
| navIcon | `.top-app-bar__nav-icon` | 네비게이션 아이콘 클릭 이벤트 |
| badgeAction | `.top-app-bar__action--badge` | 배지 액션 버튼 |
| utilityAction | `.top-app-bar__action--utility` | 보조 액션 버튼 |
| badgeCount | `.top-app-bar__badge-count` | 배지 텍스트 |
| badge | `.top-app-bar__badge` | visible/tone dataset 제어 대상 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| appBarInfo | `this.fieldRender.renderData` |
| badgeInfo | `this.renderBadge` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|-------------------|------|
| click | `navIcon` | `@navigationClicked` |
| click | `badgeAction` | `@badgeClicked` |
| click | `utilityAction` | `@actionClicked` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `renderBadge({ response })` | count/tone/visible 데이터를 받아 badge dataset과 text를 갱신한다 |

### 페이지 연결 사례

```
[페이지/서버] ──badgeInfo 토픽──▶ [AppBars/Advanced/notificationBadge]
                                   └─ renderBadge({ count, tone, visible })

[AppBars/Advanced/notificationBadge] ──@badgeClicked──────▶ [페이지]
[AppBars/Advanced/notificationBadge] ──@navigationClicked─▶ [페이지]
[AppBars/Advanced/notificationBadge] ──@actionClicked─────▶ [페이지]
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 브랜드, 색조 회색, glowing badge |
| 02_material | B: Material Elevated | 라이트 서피스, elevation, compact numeric badge |
| 03_editorial | C: Minimal Editorial | 절제된 라벨, 따뜻한 회색, 작은 badge chip |
| 04_operational | D: Dark Operational | 관제형 헤더, 시안 계열 status badge |
