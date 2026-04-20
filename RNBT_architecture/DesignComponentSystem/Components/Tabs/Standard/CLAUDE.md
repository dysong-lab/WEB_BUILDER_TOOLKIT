# Tabs — Standard

## 기능 정의

1. **탭 항목 렌더링** — 탭 배열을 수평 탭 리스트로 렌더링
2. **단일 선택 유지** — 한 번에 하나의 탭만 선택 상태로 유지
3. **패널 콘텐츠 동기화** — 선택된 탭의 제목, 설명, 본문을 패널에 반영
4. **키보드 탐색 지원** — 방향키, Home, End, Enter, Space로 탭 이동과 선택 지원
5. **탭 변경 이벤트 발행** — 선택 변경 시 `@tabChanged` 이벤트를 발행

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.tabs` | 루트 상태 반영 |
| container | `.tabs__list` | 탭 리스트 컨테이너 |
| template | `#tab-item-template` | 탭 템플릿 |
| item | `.tabs__tab` | 개별 탭 항목 |
| id | `.tabs__tab` | 항목 식별 |
| selected | `.tabs__tab` | 선택 상태 |
| disabled | `.tabs__tab` | 비활성 상태 |
| label | `.tabs__label` | 탭 텍스트 |
| badge | `.tabs__badge` | 보조 카운트 |
| panel | `.tabs__panel` | 콘텐츠 패널 |
| panelEyebrow | `.tabs__panel-eyebrow` | 패널 상단 분류 |
| panelTitle | `.tabs__panel-title` | 패널 제목 |
| panelBody | `.tabs__panel-body` | 패널 본문 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| tabItems | `this.renderTabItems` |

### 이벤트 (customEvents)

없음. 선택 변경은 클릭/키보드 핸들러에서 상태를 갱신한 뒤 직접 `@tabChanged`를 발행한다.

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.getItemElement(id)` | id에 해당하는 탭 요소를 반환 |
| `this.normalizeItems(payload)` | 탭 배열을 렌더링 가능한 형태로 정규화 |
| `this.syncAccessibility()` | role/aria/tabindex를 동기화 |
| `this.renderPanel(item)` | 선택된 탭의 패널 콘텐츠를 갱신 |
| `this.selectItem(id)` | 해당 탭을 선택하고 패널을 갱신 |
| `this.selectAdjacent(step)` | 이전/다음 탭으로 순환 이동 |
| `this.renderTabItems(payload)` | 탭 리스트와 초기 선택 상태를 렌더링 |

### 데이터 계약

```javascript
[
  {
    id: "overview",
    label: "Overview",
    badge: "12",
    selected: "true",
    disabled: "false",
    panelEyebrow: "Operations",
    panelTitle: "Daily status summary",
    panelBody: "Live incidents, deployment health, and active approvals."
  }
]
```

### 표시 규칙

- `selected`가 없는 경우 첫 번째 활성 탭을 기본 선택으로 사용
- `disabled === "true"`인 탭은 클릭/키보드 선택 대상에서 제외
- `badge`가 비어 있으면 숨김 처리
- 패널은 항상 현재 선택된 탭의 정보를 기준으로 갱신

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 글래스 블루 하이라이트 탭 |
| 02_material | B: Material Balance | 밝은 서피스 기반 MD형 탭 |
| 03_editorial | C: Editorial Utility | 타이포그래피 중심의 편집형 탭 |
| 04_operational | D: Operational Console | 어두운 콘솔형 모니터링 탭 |
