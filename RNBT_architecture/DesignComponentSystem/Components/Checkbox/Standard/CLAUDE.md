# Checkbox — Standard

## 기능 정의

1. **체크박스 목록 렌더링** — 배열 데이터를 체크박스 목록으로 렌더링
2. **개별 항목 토글** — 클릭한 항목의 `checked` 상태만 반전 (`disabled`면 무시)
3. **상태 반영** — 각 항목의 `checked`, `disabled` 상태를 시각 상태로 표현
4. **선택 이벤트 발행** — 항목 클릭 시 `@checkboxChanged` 이벤트를 발행

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY       | VALUE                        | 용도                         |
| --------- | ---------------------------- | ---------------------------- |
| container | `.checkbox-group`            | 항목 컨테이너                |
| template  | `#checkbox-item-template`    | 항목 템플릿                  |
| item      | `.checkbox-item`             | 클릭 이벤트 타깃             |
| id        | `.checkbox-item`             | 항목 식별자                  |
| checked   | `.checkbox-item`             | 체크 상태                    |
| disabled  | `.checkbox-item`             | 비활성 상태                  |
| label     | `.checkbox-item__label`      | 항목 레이블 텍스트           |

### datasetAttrs

```javascript
{
    id:       "id",
    checked:  "checked",
    disabled: "disabled"
}
```

### 구독 (subscriptions)

| topic         | handler                      |
| ------------- | ---------------------------- |
| checkboxItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자           | 발행               |
| ------ | ---------------- | ------------------ |
| click  | `.checkbox-item` | `@checkboxChanged` |

### 자체 메서드

| 메서드                 | 설명                                                      |
| ---------------------- | --------------------------------------------------------- |
| `this.toggleItem(id)`  | 지정한 항목의 `checked` 상태를 반전한다. `disabled`면 무시 |

### 렌더링 데이터 형식

```javascript
[
    { id: "opt-1", label: "항목 A", checked: "true",  disabled: "false" },
    { id: "opt-2", label: "항목 B", checked: "false", disabled: "false" },
    { id: "opt-3", label: "항목 C", checked: "false", disabled: "true"  }
]
```

### 비고

- 네이티브 `<input type="checkbox">` 미사용 — ListRenderMixin이 `checked` 속성 제어 불가
- 시각적 체크박스는 `<div class="checkbox-item__box">` + `[data-checked="true"]` CSS로 구현
- 실제 체크 상태는 `data-checked` dataset 속성으로 추적
