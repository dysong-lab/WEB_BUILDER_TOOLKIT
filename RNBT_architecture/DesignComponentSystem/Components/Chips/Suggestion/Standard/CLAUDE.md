# Suggestion — Standard

## 기능 정의

1. **제안 칩 항목 렌더링** — `suggestionChipItems` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링한다. 각 항목은 선택적 아이콘 + 라벨 텍스트로 구성된다
2. **칩 클릭 이벤트** — 칩 클릭 시 `@suggestionChipClicked` 발행 (페이지가 해당 제안을 적용)

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.suggestion-chip__list` | 칩이 추가될 부모 (규약) |
| template  | `#suggestion-chip-item-template` | cloneNode 대상 (규약) |
| chipid    | `.suggestion-chip__item` | 항목 식별 + 이벤트 매핑 |
| icon      | `.suggestion-chip__icon` | 선행 아이콘 텍스트 |
| label     | `.suggestion-chip__label` | 라벨 텍스트 |

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| chipid | chipid |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| suggestionChipItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `chipid` (computed property) | `@suggestionChipClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('suggestionChipItems', this)──> [SuggestionChip] 렌더링 ([{ chipid, icon, label }, ...])

[SuggestionChip] ──@suggestionChipClicked──> [페이지] ──> 해당 제안 적용
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
- **선택 상태 없음**: Suggestion chip은 Filter chip과 달리 선택/토글 상태가 없다. 클릭은 제안 적용 액션.
- **Assist chip과의 차이**: 구조적으로 동일하나, Suggestion chip은 동적으로 생성된 제안(자동완성, 검색어 추천 등)을 표시하는 용도이며 topic과 이벤트명이 다르다.
