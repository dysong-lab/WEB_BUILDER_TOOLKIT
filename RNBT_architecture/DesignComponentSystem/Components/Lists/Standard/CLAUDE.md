# Lists — Standard

## 기능 정의

1. **리스트 항목 렌더링** — `listItems` 토픽으로 수신한 배열 데이터를 수직 리스트 항목으로 렌더링한다
2. **항목 선택 전환** — 선택 가능한 항목 클릭 시 해당 항목의 `selected` 상태를 토글한다
3. **항목 클릭 이벤트 발행** — 항목 루트 클릭 시 `@listItemClicked` 이벤트를 발행한다
4. **후행 액션 이벤트 발행** — trailing action 클릭 시 `@listTrailingActionClicked` 이벤트를 발행한다
5. **상태 표시 반영** — 각 항목의 `selected`, `disabled`, `selectable`, leading/trailing 정보를 시각 상태로 반영한다

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.list` | 항목 컨테이너 |
| template | `#list-item-template` | 항목 템플릿 |
| item | `.list-item` | 항목 루트 |
| id | `.list-item` | 항목 식별자 |
| selected | `.list-item` | 선택 상태 |
| disabled | `.list-item` | 비활성 상태 |
| selectable | `.list-item` | 선택 가능 여부 |
| leading | `.list-item__leading` | 선행 비주얼 |
| leadingType | `.list-item__leading` | 선행 비주얼 타입 |
| overline | `.list-item__overline` | 상단 보조 텍스트 |
| headline | `.list-item__headline` | 기본 제목 |
| supporting | `.list-item__supporting` | 보조 설명 |
| trailingText | `.list-item__trailing-text` | 후행 텍스트 |
| trailingAction | `.list-item__trailing-action` | 후행 액션 아이콘/버튼 |
| trailingActionLabel | `.list-item__trailing-action` | 후행 액션 접근성 라벨 |

### itemKey

id

### datasetAttrs

```javascript
{
    id: "id",
    selected: "selected",
    disabled: "disabled",
    selectable: "selectable",
    leadingType: "leading-type"
}
```

### elementAttrs

```javascript
{
    trailingActionLabel: "aria-label"
}
```

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| listItems | `this.renderListItems` |

### 이벤트

| 이벤트 | 트리거 | 발행 |
|--------|--------|------|
| click | `.list-item` native listener | `@listItemClicked` |
| click | `.list-item__trailing-action` native listener | `@listTrailingActionClicked` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `this.renderListItems({ response })` | 입력 배열을 정규화한 뒤 `ListRenderMixin`으로 렌더링한다 |
| `this.getItemElement(id)` | id로 항목 루트 요소를 조회한다 |
| `this.toggleSelection(id)` | `ListRenderMixin.getItemState/updateItemState`로 선택 가능한 항목의 `selected` 상태를 토글한다 |
| `this.setSelected(id, selected)` | `ListRenderMixin.updateItemState`로 지정한 항목의 `selected` 상태를 명시적으로 설정한다 |

### 페이지 연결 사례

```text
[Lists/Standard] --@listItemClicked--> [페이지] --> 상세 패널 열기 / 상태 변경 / 라우팅
[Lists/Standard] --@listTrailingActionClicked--> [페이지] --> 세부 액션 수행
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 보랏빛 블루 톤, 글래스형 패널, 기술형 밀도 |
| 02_material | B: Material Elevated | 라이트 서피스, 로보토, MD3에 가까운 표준형 |
| 03_editorial | C: Minimal Editorial | 웜 그레이, 세리프 헤드라인, 여백 강조 |
| 04_operational | D: Dark Operational | 다크 네이비, 모노스페이스 포인트, 운영 패널형 |
