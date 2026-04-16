# Assist — Standard

## 기능 정의

1. **어시스트 칩 항목 렌더링** — `assistChipItems` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링한다. 각 항목은 선택적 아이콘 + 라벨 텍스트로 구성된다
2. **칩 클릭 이벤트** — 칩 클릭 시 `@assistChipClicked` 발행 (페이지가 액션을 수행)

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.assist-chip__list` | 칩이 추가될 부모 (규약) |
| template  | `#assist-chip-item-template` | cloneNode 대상 (규약) |
| chipid    | `.assist-chip__item` | 항목 식별 + 이벤트 매핑 |
| icon      | `.assist-chip__icon` | 선행 아이콘 텍스트 |
| label     | `.assist-chip__label` | 라벨 텍스트 |

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| chipid | chipid |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| assistChipItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `chipid` (computed property) | `@assistChipClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('assistChipItems', this)──> [AssistChip] 렌더링 ([{ chipid, icon, label }, ...])

[AssistChip] ──@assistChipClicked──> [페이지] ──> 해당 칩의 액션 수행
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플, 그라디언트 호버, Pretendard |
| 02_material    | B: Material Elevated | 라이트, elevation shadow, Roboto |
| 03_editorial   | C: Minimal Editorial | 웜 그레이, 세리프 라벨, 미니멀 테두리 |
| 04_operational | D: Dark Operational  | 컴팩트 다크 시안, 모노스페이스, 각진 모서리 |

### 결정사항

- **아이콘**: 텍스트 기반 (이모지 또는 심볼 문자). icon 필드가 비어있으면 아이콘 영역이 CSS로 숨겨진다.
- **선택 상태 없음**: Assist chip은 Filter chip과 달리 선택/토글 상태가 없다. 클릭은 일회성 액션 트리거.
