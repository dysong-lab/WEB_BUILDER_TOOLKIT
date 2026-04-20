# Switch — Standard

## 기능 정의

1. **스위치 목록 렌더링** — 배열 데이터를 독립 토글 가능한 스위치 목록으로 렌더링
2. **개별 항목 토글** — 클릭 또는 키보드 조작 시 대상 항목의 `checked` 상태를 반전
3. **상태 반영** — 각 항목의 `checked`, `disabled` 상태를 시각 상태와 접근성 속성에 반영
4. **선택 이벤트 발행** — 항목이 토글될 때 `@switchChanged` 이벤트를 발행
5. **키보드 접근성** — `Space`, `Enter`로 현재 스위치를 토글

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.switch-group` | 항목 컨테이너 |
| template | `#switch-item-template` | 항목 템플릿 |
| item | `.switch-item` | 클릭/키보드 이벤트 타깃 |
| id | `.switch-item` | 항목 식별자 |
| checked | `.switch-item` | 토글 상태 |
| disabled | `.switch-item` | 비활성 상태 |
| label | `.switch-item__label` | 항목 레이블 텍스트 |
| supportingText | `.switch-item__supporting` | 보조 설명 텍스트 |

### datasetAttrs

```javascript
{
    id: "id",
    checked: "checked",
    disabled: "disabled"
}
```

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| switchItems | `this.renderSwitchItems` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `.switch-item` | `@switchChanged` |

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.getItemElement(id)` | 지정한 항목 element를 반환 |
| `this.syncAccessibility()` | 각 항목의 `role`, `aria-*`, `tabindex`를 동기화 |
| `this.toggleItem(id)` | 지정한 항목의 `checked` 상태를 반전하고 비활성 항목은 무시 |
| `this.renderSwitchItems(payload)` | 렌더링용 데이터를 정규화한 뒤 ListRenderMixin에 전달 |

### 렌더링 데이터 형식

```javascript
[
  { id: "wifi", label: "Wi-Fi", supportingText: "Keep devices reachable", checked: "true", disabled: "false" },
  { id: "alerts", label: "Alert routing", supportingText: "Escalate to on-call channel", checked: "false", disabled: "false" },
  { id: "lock", label: "Remote override", supportingText: "Managed by security policy", checked: "true", disabled: "true" }
]
```

### 비고

- 네이티브 `<input type="checkbox">`는 사용하지 않고, 커스텀 UI + dataset 상태로 제어
- 각 항목은 `role="switch"`와 `aria-checked`를 가진다
- 실제 상태는 `data-checked` dataset 속성으로 추적한다

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 유리 질감과 시안 포인트의 정밀 토글 리스트 |
| 02_material | B: Material Balance | MD3 라이트 서피스 기반 기본 스위치 리스트 |
| 03_editorial | C: Editorial Utility | 넓은 타이포 대비를 가진 편집형 토글 패널 |
| 04_operational | D: Operational Console | 상태 판독이 빠른 콘솔형 스위치 목록 |
