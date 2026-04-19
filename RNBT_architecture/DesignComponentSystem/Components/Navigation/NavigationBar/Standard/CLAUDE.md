# NavigationBar — Standard

## 기능 정의

1. **목적지 항목 렌더링** — `navigationBar` 토픽으로 수신한 배열(3~5개)을 template 반복으로 렌더링하고, 개별 항목의 활성 상태(`active`)를 관리한다
2. **항목 클릭 이벤트** — 목적지 항목 클릭 시 `@navBarItemClicked` 발행. 페이지가 수신하여 `updateItemState`로 활성 항목을 전환한다
3. **뱃지 표시** — 항목에 `badge` 값이 있으면 우상단 뱃지로 알림 수를 표시한다 (빈 문자열이면 숨김)

> MD3 정의: "Navigation bars let people switch between UI views on smaller devices."
> 소형 디바이스(하단 고정 수평 바)에서 3~5개의 최상위 목적지 사이를 전환한다. 활성 항목은 라벨/상태 인디케이터로 강조된다.

---

## 구현 명세

### Mixin

ListRenderMixin (`itemKey` 옵션으로 개별 항목 상태 변경 활성화)

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.nav-bar__list` | 항목이 추가될 부모 (규약) |
| template | `#nav-bar-item-template` | cloneNode 대상 (규약) |
| menuid | `.nav-bar__item` | 항목 식별 + 이벤트 매핑 |
| active | `.nav-bar__item` | 활성 상태 (data-active) |
| icon | `.nav-bar__icon` | 아이콘 표시 (Material Symbols 등) |
| label | `.nav-bar__label` | 라벨 텍스트 |
| badge | `.nav-bar__badge` | 뱃지 텍스트 (빈 값이면 `:empty`로 숨김) |

### itemKey

`menuid`

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| menuid | menuid |
| active | active |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| navigationBar | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `menuid` (computed property) | `@navBarItemClicked` |

### 커스텀 메서드

없음 — 페이지가 `targetInstance.listRender.updateItemState(id, { active })`를 직접 호출한다.

### 페이지 연결 사례

```
[NavigationBar] ──@navBarItemClicked──> [페이지] ──> 라우팅 / 뷰 전환
                                                  + updateItemState(prev, { active: 'false' })
                                                  + updateItemState(curr, { active: 'true' })
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 퍼플 팔레트, 그라디언트 깊이, 다크, Pretendard. 활성 항목은 pill 상태 인디케이터 |
| 02_material | B: Material Elevated | 블루 팔레트, elevation shadow, 라이트, Roboto. MD3 표준 56dp pill 인디케이터 |
| 03_editorial | C: Minimal Editorial | 웜 그레이, 세리프 라벨, 라이트, 상단 테두리 + 넓은 여백 |
| 04_operational | D: Dark Operational | 시안 팔레트, IBM Plex Mono, 다크, 각진 사각 인디케이터 (border) |
