# Input — Standard

## 기능 정의

1. **입력 태그 칩 목록 렌더링** — 배열 데이터를 입력 태그 칩 목록으로 렌더링
2. **입력 칩 선택 전환** — 칩 본문 클릭 시 해당 칩의 `selected` 상태를 토글
3. **삭제 가능 상태 반영** — 각 칩의 `selected`, `disabled` 상태와 삭제 버튼을 시각 상태로 표현
4. **삭제 이벤트 발행** — 삭제 버튼 클릭 시 `@inputChipRemoveClicked` 이벤트를 발행

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY        | VALUE                        | 용도               |
| ---------- | ---------------------------- | ------------------ |
| container  | `.input-chips`               | 항목 컨테이너      |
| template   | `#input-chip-item-template`  | 항목 템플릿        |
| item       | `.input-chip`                | 항목 루트          |
| id         | `.input-chip`                | 항목 식별자        |
| selected   | `.input-chip`                | 선택 상태          |
| disabled   | `.input-chip`                | 비활성 상태        |
| avatar     | `.input-chip__avatar`        | 선행 문자/아이콘   |
| label      | `.input-chip__label`         | 칩 레이블 텍스트   |
| removeBtn  | `.input-chip__remove`        | 삭제 이벤트 타깃   |
| removeId   | `.input-chip__remove`        | 삭제 버튼 식별자   |

### datasetAttrs

```javascript
{
    id: "id",
    removeId: "id",
    selected: "selected",
    disabled: "disabled"
}
```

### 구독 (subscriptions)

| topic          | handler                      |
| -------------- | ---------------------------- |
| inputChipItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자                | 발행                       |
| ------ | --------------------- | -------------------------- |
| click  | `.input-chip`         | `@inputChipClicked`        |
| click  | `.input-chip__remove` | `@inputChipRemoveClicked`  |

### 자체 메서드

| 메서드                    | 설명                                  |
| ------------------------- | ------------------------------------- |
| `this.toggleSelection(id)` | 지정한 항목의 `selected` 상태를 토글한다 |
| `this.removeItem(id)`     | 지정한 항목을 DOM에서 제거한다        |
