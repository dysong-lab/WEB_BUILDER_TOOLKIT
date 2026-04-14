# FABMenu — Standard

## 기능 정의

1. **트리거 FAB 표시** — 트리거 아이콘/레이블을 표시
2. **액션 목록 렌더링** — 메뉴 항목 배열을 반복 렌더링
3. **열림 상태 제어** — 트리거 클릭 시 `data-open`을 토글
4. **이벤트 발행** — 트리거/항목 클릭 시 각 이벤트를 발행

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY          | VALUE                      | 용도               |
| ------------ | -------------------------- | ------------------ |
| root         | `.fab-menu`                | 열림 상태 루트     |
| trigger      | `.fab-menu__trigger`       | 트리거 버튼        |
| triggerIcon  | `.fab-menu__trigger-icon`  | 트리거 아이콘      |
| triggerLabel | `.fab-menu__trigger-label` | 트리거 레이블      |
| container    | `.fab-menu__list`          | 메뉴 항목 컨테이너 |
| template     | `#fab-menu-item-template`  | 항목 템플릿        |
| item         | `.fab-menu__item`          | 항목 클릭 타깃     |
| id           | `.fab-menu__item`          | 항목 식별자        |
| icon         | `.fab-menu__item-icon`     | 항목 아이콘        |
| label        | `.fab-menu__item-label`    | 항목 레이블        |

### datasetAttrs

```javascript
{
  id: "id"
}
```

### 구독 (subscriptions)

없음

### 이벤트 (customEvents)

| 이벤트 | 선택자               | 발행                  |
| ------ | -------------------- | --------------------- |
| click  | `.fab-menu__trigger` | `@fabMenuToggled`     |
| click  | `.fab-menu__item`    | `@fabMenuItemClicked` |

### 자체 메서드

| 메서드                        | 설명                                                              |
| ----------------------------- | ----------------------------------------------------------------- |
| `this.renderFabMenu(data)`    | 트리거 아이콘/레이블 표시, `data-open` 초기화, 항목 목록 렌더링  |
| `this.toggleMenu(force)`      | `force`가 boolean이면 해당 값으로, 아니면 현재 상태를 반전        |

### 데이터 계약

```javascript
{
    triggerIcon: 'add',
    triggerLabel: 'Create',
    items: [
        { id: 'item-1', icon: 'edit', label: 'Edit' },
        { id: 'item-2', icon: 'share', label: 'Share' }
    ]
}
```
