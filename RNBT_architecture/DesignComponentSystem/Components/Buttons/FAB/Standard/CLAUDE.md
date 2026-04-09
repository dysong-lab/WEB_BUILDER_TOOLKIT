# FAB — Standard

## 기능 정의

1. **아이콘 표시** — 전달된 `icon` 값을 FAB 아이콘에 렌더링
2. **크기 전환** — `size` 값에 따라 `fab` / `medium` / `large` 상태를 전환
3. **클릭 이벤트 발행** — FAB 클릭 시 `@fabClicked` 이벤트를 발행

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| button | `.fab` | 클릭 이벤트 타깃 |
| icon | `.fab__icon` | 아이콘 텍스트 표시 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `.fab` | `@fabClicked` |

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.renderFabInfo(data)` | icon, ariaLabel, size를 DOM에 동기화 |

### 데이터 계약

```javascript
{
    icon: 'add',
    ariaLabel: 'Create',
    size: 'fab'
}
```
