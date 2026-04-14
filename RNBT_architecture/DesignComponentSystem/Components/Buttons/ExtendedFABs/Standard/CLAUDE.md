# ExtendedFABs — Standard

## 기능 정의

1. **아이콘과 레이블 표시** — `icon`, `label` 값을 FAB에 렌더링
2. **크기 전환** — `size` 값에 따라 `small` / `medium` / `large` 상태를 전환
3. **클릭 이벤트 발행** — FAB 클릭 시 `@extendedFabClicked` 이벤트를 발행

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY    | VALUE                  | 용도               |
| ------ | ---------------------- | ------------------ |
| button | `.extended-fab`        | 클릭 이벤트 타깃   |
| icon   | `.extended-fab__icon`  | 아이콘 텍스트 표시 |
| label  | `.extended-fab__label` | 레이블 표시        |

### 이벤트 (customEvents)

| 이벤트 | 선택자          | 발행                  |
| ------ | --------------- | --------------------- |
| click  | `.extended-fab` | `@extendedFabClicked` |

### 데이터 계약

```javascript
{
    icon: 'add',
    label: 'Create',
    ariaLabel: 'Create',
    size: 'medium'
}
```
