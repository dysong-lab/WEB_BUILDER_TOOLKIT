# ButtonGroups — Standard

## 기능 정의

1. **버튼 항목 렌더링** — `buttonGroupItems` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링하고, 개별 항목의 선택 상태를 관리한다
2. **버튼 클릭 이벤트** — 버튼 클릭 시 `@buttonClicked` 발행

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.btn-group__list` | 항목이 추가될 부모 (규약) |
| template | `#btn-group-item-template` | cloneNode 대상 (규약) |
| buttonid | `.btn-group__item` | 항목 식별 + 이벤트 매핑 |
| selected | `.btn-group__item` | 선택 상태 (data-selected) |
| label | `.btn-group__label` | 라벨 텍스트 |
| icon | `.btn-group__icon` | 아이콘 (선택적) |

### itemKey

buttonid

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| buttonid | buttonid |
| selected | selected |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| buttonGroupItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `buttonid` (computed property) | `@buttonClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──publish(buttonGroupItems, [...])──> [ButtonGroups] 렌더링

[ButtonGroups] ──@buttonClicked──> [페이지] ──> single-select: 이전 해제 + 클릭된 항목 선택
                                              + updateItemState(id, { selected: 'true' })
                                              또는 multi-select: 해당 항목만 토글
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | Standard 스타일 — 간격 있는 개별 버튼, 다크, Pretendard |
| 02_material | B: Material Elevated | Standard 스타일 — shadow elevation, 라이트, Roboto |
| 03_editorial | C: Minimal Editorial | Connected 스타일 — 버튼이 시각적으로 연결, 라이트, 세리프 |
| 04_operational | D: Dark Operational | Connected 스타일 — 컴팩트 연결, 다크, 모노스페이스 |
