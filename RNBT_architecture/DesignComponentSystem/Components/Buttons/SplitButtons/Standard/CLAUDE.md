# SplitButtons — Standard

## 기능 정의

1. **기본 액션 표시** — primary 버튼 레이블을 표시
2. **메뉴 목록 렌더링** — 관련 액션 목록을 반복 렌더링
3. **메뉴 토글** — toggle 클릭 시 `data-open`을 토글
4. **이벤트 발행** — primary / toggle / item 클릭 시 각 이벤트를 발행

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY          | VALUE                      | 용도               |
| ------------ | -------------------------- | ------------------ |
| root         | `.split-button`            | 열림 상태 루트     |
| primary      | `.split-button__primary`   | 기본 액션 버튼     |
| toggle       | `.split-button__toggle`    | 메뉴 토글 버튼     |
| primaryLabel | `.split-button__label`     | 기본 버튼 레이블   |
| container    | `.split-button__menu`      | 메뉴 항목 컨테이너 |
| template     | `#split-button-item-template` | 항목 템플릿     |
| item         | `.split-button__menu-item` | 항목 클릭 타깃     |
| id           | `.split-button__menu-item` | 항목 식별자        |
| label        | `.split-button__menu-label`| 항목 레이블        |

### datasetAttrs

```javascript
{
    id: 'id'
}
```

### 구독 (subscriptions)

없음

### 이벤트 (customEvents)

| 이벤트 | 선택자                     | 발행                   |
| ------ | -------------------------- | ---------------------- |
| click  | `.split-button__primary`   | `@splitPrimaryClicked` |
| click  | `.split-button__toggle`    | `@splitMenuToggled`    |
| click  | `.split-button__menu-item` | `@splitMenuItemClicked`|

### 자체 메서드

| 메서드                          | 설명                                                             |
| ------------------------------- | ---------------------------------------------------------------- |
| `this.renderSplitButton(data)`  | 레이블 표시, `data-open` 초기화, 메뉴 항목 목록 렌더링           |
| `this.toggleMenu(force)`        | `force`가 boolean이면 해당 값으로, 아니면 현재 상태를 반전       |

### 데이터 계약

```javascript
{
    label: 'Action',
    menuItems: [
        { id: 'menu-1', label: 'Edit' },
        { id: 'menu-2', label: 'Duplicate' },
        { id: 'menu-3', label: 'Delete' }
    ]
}
```
