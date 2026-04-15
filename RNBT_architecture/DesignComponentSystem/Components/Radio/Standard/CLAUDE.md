# Radio — Standard

## 기능 정의

1. **라디오 목록 렌더링** — 배열 데이터를 라디오 옵션 목록으로 렌더링
2. **단일 선택 보장** — 선택한 항목만 `selected="true"`로 유지하고 나머지는 해제
3. **상태 반영** — 각 항목의 `selected`, `disabled` 상태를 시각 상태로 표현
4. **선택 이벤트 발행** — 항목 클릭 또는 키보드 조작 시 `@radioChanged` 이벤트를 발행
5. **키보드 내비게이션** — `Space`, `Enter`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`로 선택 이동 지원

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY       | VALUE                     | 용도                          |
| --------- | ------------------------- | ----------------------------- |
| container | `.radio-group`            | 항목 컨테이너                 |
| template  | `#radio-item-template`    | 항목 템플릿                   |
| item      | `.radio-item`             | 클릭/키보드 이벤트 타깃       |
| id        | `.radio-item`             | 항목 식별자                   |
| selected  | `.radio-item`             | 선택 상태                     |
| disabled  | `.radio-item`             | 비활성 상태                   |
| label     | `.radio-item__label`      | 항목 레이블 텍스트            |

### datasetAttrs

```javascript
{
    id: "id",
    selected: "selected",
    disabled: "disabled"
}
```

### 구독 (subscriptions)

| topic      | handler                    |
| ---------- | -------------------------- |
| radioItems | `this.renderRadioItems`    |

### 이벤트 (customEvents)

| 이벤트 | 선택자        | 발행            |
| ------ | ------------- | --------------- |
| click  | `.radio-item` | `@radioChanged` |

### 자체 메서드

| 메서드                       | 설명 |
| ---------------------------- | ---- |
| `this.getItemElement(id)`    | 지정한 항목 element를 반환 |
| `this.syncAccessibility()`   | 각 항목의 `role`, `aria-*`, `tabindex`를 동기화 |
| `this.selectItem(id)`        | 지정한 항목만 선택 상태로 만들고 비활성 항목은 무시 |
| `this.selectAdjacent(step)`  | 현재 선택 기준으로 이전/다음 enabled 항목을 선택 |
| `this.renderRadioItems()`    | 렌더링용 데이터를 정규화한 뒤 ListRenderMixin에 전달 |

### 렌더링 데이터 형식

```javascript
[
    { id: "opt-1", label: "항목 A", selected: "true",  disabled: "false" },
    { id: "opt-2", label: "항목 B", selected: "false", disabled: "false" },
    { id: "opt-3", label: "항목 C", selected: "false", disabled: "true"  }
]
```

### 비고

- 네이티브 `<input type="radio">` 미사용 — ListRenderMixin 템플릿 렌더링 패턴에 맞춘 커스텀 UI
- 실제 선택 상태는 `data-selected` dataset 속성으로 추적
- 접근성 보강을 위해 렌더링 후 `role="radio"`, `aria-checked`, `aria-disabled`, `tabindex`를 동기화
