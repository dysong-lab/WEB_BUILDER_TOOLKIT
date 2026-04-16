# Filter — Standard

## 기능 정의

1. **필터 칩 항목 렌더링** — `filterChipItems` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링한다. 각 항목은 선택적 체크마크 + 라벨 텍스트로 구성되며, 개별 항목의 선택 상태(selected / unselected)를 관리한다
2. **칩 클릭 이벤트** — 칩 클릭 시 `@filterChipClicked` 발행 (페이지가 토글 상태를 결정하고 updateItemState로 반영)

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.filter-chip__list` | 칩이 추가될 부모 (규약) |
| template  | `#filter-chip-item-template` | cloneNode 대상 (규약) |
| chipid    | `.filter-chip__item` | 항목 식별 + 이벤트 매핑 |
| selected  | `.filter-chip__item` | 선택 상태 (data-selected: "true"/"false") |
| label     | `.filter-chip__label` | 라벨 텍스트 |

> **체크마크 처리**: `.filter-chip__check` (체크 아이콘 SVG)는 template에 고정 존재하며 `data-selected` 값에 따라 CSS로만 표시를 제어한다. cssSelectors KEY로 등록하지 않는다 (데이터 바인딩 대상이 아니므로).

### itemKey

chipid

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| chipid   | chipid |
| selected | selected |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| filterChipItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `chipid` (computed property) | `@filterChipClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('filterChipItems', this)──> [FilterChip] 렌더링 ([{ chipid, label, selected }, ...])

[FilterChip] ──@filterChipClicked──> [페이지] ──> 상태 토글 결정
                                                  + updateItemState(id, { selected: next })
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플, 그라디언트 깊이, Pretendard, 선택 시 tonal 채움 |
| 02_material    | B: Material Elevated | 라이트, elevation shadow, Roboto, 선택 시 filled 스타일 |
| 03_editorial   | C: Minimal Editorial | 웜 그레이, Georgia 세리프, 선택 시 밑줄/테두리 강조 |
| 04_operational | D: Dark Operational  | 컴팩트 다크 시안, JetBrains Mono, 선택 시 시안 테두리+배경 |

### 결정사항

- **선택 상태**: `data-selected="true" | "false"`. CSS가 선택 시 체크마크 표시 + 배경/테두리 변경을 제어한다.
- **체크마크 아이콘**: 인라인 SVG 체크 마크를 template에 고정 배치. 선택 상태에 따라 CSS visibility로 제어한다.
- **선택/토글 결정은 페이지에 위임**: Mixin은 순수 렌더링만 수행한다. 페이지가 `@filterChipClicked` 수신 후 `updateItemState`로 상태를 변경한다.
