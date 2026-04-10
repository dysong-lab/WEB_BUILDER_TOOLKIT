# Assist — Standard

## 기능 정의

1. **보조 액션 칩 목록 렌더링** — 배열 데이터를 보조 액션 칩 목록으로 렌더링
2. **활성/비활성 상태 반영** — 각 칩의 `disabled` 상태를 시각 상태로 표현
3. **액션 이벤트 발행** — 칩 클릭 시 `@assistChipClicked` 이벤트를 발행

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY         | VALUE                         | 용도               |
| ----------- | ----------------------------- | ------------------ |
| container   | `.assist-chips`               | 항목 컨테이너      |
| template    | `#assist-chip-item-template`  | 항목 템플릿        |
| item        | `.assist-chip`                | 클릭 이벤트 타깃   |
| id          | `.assist-chip`                | 항목 식별자        |
| disabled    | `.assist-chip`                | 비활성 상태        |
| leadingIcon | `.assist-chip__icon`          | 선행 아이콘 텍스트 |
| label       | `.assist-chip__label`         | 칩 레이블 텍스트   |

### datasetAttrs

```javascript
{
    id: "id",
    disabled: "disabled"
}
```

### 구독 (subscriptions)

| topic           | handler                      |
| --------------- | ---------------------------- |
| assistChipItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자         | 발행                 |
| ------ | -------------- | -------------------- |
| click  | `.assist-chip` | `@assistChipClicked` |
