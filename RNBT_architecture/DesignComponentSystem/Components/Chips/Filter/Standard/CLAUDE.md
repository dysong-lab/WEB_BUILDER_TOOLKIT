# Filter — Standard

## 기능 정의

1. **필터 칩 목록 렌더링** — 배열 데이터를 필터 칩 목록으로 렌더링
2. **개별 칩 토글 선택 전환** — 클릭한 칩의 `selected` 상태만 반전
3. **선택 상태 반영** — 각 칩의 `selected`, `disabled` 상태를 시각 상태로 표현
4. **선택 이벤트 발행** — 항목 클릭 시 `@filterChipClicked` 이벤트를 발행

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY         | VALUE                         | 용도                |
| ----------- | ----------------------------- | ------------------- |
| container   | `.filter-chips`               | 항목 컨테이너       |
| template    | `#filter-chip-item-template`  | 항목 템플릿         |
| item        | `.filter-chip`                | 클릭 이벤트 타깃    |
| id          | `.filter-chip`                | 항목 식별자         |
| selected    | `.filter-chip`                | 선택 상태           |
| disabled    | `.filter-chip`                | 비활성 상태         |
| leadingIcon | `.filter-chip__icon`          | 선행 아이콘 텍스트  |
| label       | `.filter-chip__label`         | 칩 레이블 텍스트    |

### datasetAttrs

```javascript
{
    id: "id",
    selected: "selected",
    disabled: "disabled"
}
```

### 구독 (subscriptions)

| topic           | handler                      |
| --------------- | ---------------------------- |
| filterChipItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자         | 발행                 |
| ------ | -------------- | -------------------- |
| click  | `.filter-chip` | `@filterChipClicked` |

### 자체 메서드

| 메서드                | 설명                                                     |
| --------------------- | -------------------------------------------------------- |
| `this.toggleItem(id)` | 지정한 항목의 `selected` 상태를 반전한다. `disabled`면 무시 |
