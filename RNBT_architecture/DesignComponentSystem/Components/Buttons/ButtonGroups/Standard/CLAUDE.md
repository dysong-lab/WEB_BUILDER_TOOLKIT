# ButtonGroups — Standard

## 기능 정의

1. **항목 목록 렌더링** — 배열 데이터를 버튼 그룹으로 렌더링
2. **단일 선택 전환** — 클릭한 항목만 `selected=true`로 유지
3. **선택 이벤트 발행** — 항목 클릭 시 `@buttonGroupItemClicked` 이벤트를 발행

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.button-group` | 항목 컨테이너 |
| template | `#button-group-item-template` | 항목 템플릿 |
| item | `.button-group__item` | 클릭 이벤트 타깃 |
| id | `.button-group__item` | 항목 식별자 |
| selected | `.button-group__item` | 선택 상태 |
| label | `.button-group__label` | 버튼 텍스트 |

### datasetAttrs

```javascript
{
    id: 'id',
    selected: 'selected'
}
```

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| buttonGroupItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `.button-group__item` | `@buttonGroupItemClicked` |

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.selectItem(id)` | 전체 항목의 선택을 해제하고 지정된 항목만 선택 |
