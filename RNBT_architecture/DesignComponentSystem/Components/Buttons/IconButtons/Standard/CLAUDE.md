# IconButtons — Standard

## 기능 정의

1. **아이콘 표시** — 전달된 `icon` 값을 아이콘 텍스트에 렌더링
2. **접근성 속성 동기화** — `ariaLabel` 값을 버튼의 `aria-label`에 반영
3. **클릭 이벤트 발행** — 버튼 클릭 시 `@iconButtonClicked` 이벤트를 발행

---

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY    | VALUE                | 용도               |
| ------ | -------------------- | ------------------ |
| button | `.icon-button`       | 클릭 이벤트 타깃   |
| icon   | `.icon-button__icon` | 아이콘 텍스트 표시 |

### 구독 (subscriptions)

없음

### 이벤트 (customEvents)

| 이벤트 | 선택자         | 발행                 |
| ------ | -------------- | -------------------- |
| click  | `.icon-button` | `@iconButtonClicked` |

### 자체 메서드

| 메서드                            | 설명                               |
| --------------------------------- | ---------------------------------- |
| `this.renderIconButtonInfo(data)` | `icon`, `ariaLabel`을 DOM에 동기화 |

### 데이터 계약

```javascript
{
    icon: 'settings',
    ariaLabel: 'Settings'
}
```

### 디자인 변형

| 파일           | 페르소나             | 설명                             |
| -------------- | -------------------- | -------------------------------- |
| 01_refined     | A: Refined Technical | 글래스 질감의 기술적 아이콘 버튼 |
| 02_material    | B: Material Elevated | MD3 Filled tonal icon button     |
| 03_editorial   | C: Minimal Editorial | 따뜻한 뉴트럴 기반 아이콘 버튼   |
| 04_operational | D: Dark Operational  | HUD 스타일 다크 아이콘 버튼      |
