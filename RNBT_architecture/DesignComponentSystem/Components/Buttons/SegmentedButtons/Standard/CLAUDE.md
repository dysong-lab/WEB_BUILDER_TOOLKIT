# SegmentedButtons — Standard

## 기능 정의

1. **항목 목록 렌더링** — 아이콘/레이블을 가진 세그먼트 목록을 렌더링
2. **단일 선택 전환** — 클릭한 항목만 `selected=true`로 유지
3. **선택 이벤트 발행** — 항목 클릭 시 `@segmentedButtonClicked` 이벤트를 발행

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY       | VALUE                             | 용도             |
| --------- | --------------------------------- | ---------------- |
| container | `.segmented-buttons`              | 항목 컨테이너    |
| template  | `#segmented-button-item-template` | 항목 템플릿      |
| item      | `.segmented-button`               | 클릭 이벤트 타깃 |
| id        | `.segmented-button`               | 항목 식별자      |
| selected  | `.segmented-button`               | 선택 상태        |
| icon      | `.segmented-button__icon`         | 아이콘 텍스트    |
| label     | `.segmented-button__label`        | 레이블 텍스트    |

### datasetAttrs

```javascript
{
    id: 'id',
    selected: 'selected'
}
```

### 구독 (subscriptions)

| topic                | handler                      |
| -------------------- | ---------------------------- |
| segmentedButtonItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자              | 발행                      |
| ------ | ------------------- | ------------------------- |
| click  | `.segmented-button` | `@segmentedButtonClicked` |
