# Suggestion — Standard

## 기능 정의

1. **추천 칩 목록 렌더링** — 배열 데이터를 추천 칩 목록으로 렌더링
2. **추천 채택 상태 전환** — 클릭한 추천 칩만 `selected=true`로 반영
3. **활성/비활성 상태 반영** — 각 칩의 `selected`, `disabled` 상태를 시각 상태로 표현
4. **추천 선택 이벤트 발행** — 칩 클릭 시 `@suggestionChipClicked` 이벤트를 발행

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY         | VALUE                             | 용도               |
| ----------- | --------------------------------- | ------------------ |
| container   | `.suggestion-chips`               | 항목 컨테이너      |
| template    | `#suggestion-chip-item-template`  | 항목 템플릿        |
| item        | `.suggestion-chip`                | 클릭 이벤트 타깃   |
| id          | `.suggestion-chip`                | 항목 식별자        |
| selected    | `.suggestion-chip`                | 채택 상태          |
| disabled    | `.suggestion-chip`                | 비활성 상태        |
| leadingIcon | `.suggestion-chip__icon`          | 선행 아이콘 텍스트 |
| label       | `.suggestion-chip__label`         | 칩 레이블 텍스트   |

### datasetAttrs

```javascript
{
    id: "id",
    selected: "selected",
    disabled: "disabled"
}
```

### 구독 (subscriptions)

| topic               | handler                      |
| ------------------- | ---------------------------- |
| suggestionChipItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자             | 발행                     |
| ------ | ------------------ | ------------------------ |
| click  | `.suggestion-chip` | `@suggestionChipClicked` |

### 자체 메서드

| 메서드                     | 설명                                               |
| -------------------------- | -------------------------------------------------- |
| `this.acceptSuggestion(id)` | 지정한 추천 칩만 `selected=true`로 반영한다        |
