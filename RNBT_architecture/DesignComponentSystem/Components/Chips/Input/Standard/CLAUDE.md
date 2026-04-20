# Input — Standard

## 기능 정의

1. **입력 칩 항목 렌더링** — `inputChipItems` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링한다. 각 항목은 라벨 텍스트 + 삭제 버튼(trailing X)으로 구성된다
2. **칩 클릭 이벤트** — 칩 클릭 시 `@inputChipClicked` 발행 (페이지가 상세 표시 등 후속 액션 수행)
3. **칩 삭제 이벤트** — 삭제 버튼(X) 클릭 시 `@inputChipRemoved` 발행 (페이지가 항목 제거 후 재렌더)

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.input-chip__list` | 칩이 추가될 부모 (규약) |
| template  | `#input-chip-item-template` | cloneNode 대상 (규약) |
| chipid    | `.input-chip__item` | 항목 식별 + 클릭 이벤트 매핑 |
| label     | `.input-chip__label` | 라벨 텍스트 |
| removeBtn | `.input-chip__remove` | 삭제 버튼 이벤트 매핑 |

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| chipid | chipid |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| inputChipItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `chipid` (computed property) | `@inputChipClicked` |
| click | `removeBtn` (computed property) | `@inputChipRemoved` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('inputChipItems', this)──> [InputChip] 렌더링 ([{ chipid, label }, ...])

[InputChip] ──@inputChipClicked──> [페이지] ──> 해당 칩 상세 표시
[InputChip] ──@inputChipRemoved──> [페이지] ──> 항목 제거 후 재렌더
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플, 그라디언트 호버, Pretendard, trailing X |
| 02_material    | B: Material Elevated | 라이트, elevation shadow, Roboto, trailing X |
| 03_editorial   | C: Minimal Editorial | 웜 그레이, 세리프 라벨, 미니멀 테두리, trailing X |
| 04_operational | D: Dark Operational  | 컴팩트 다크 시안, 모노스페이스, 각진 모서리, trailing X |

### 결정사항

- **삭제 버튼**: 인라인 SVG 'X' 아이콘을 template에 고정 배치. cssSelectors에 `removeBtn`으로 등록하여 이벤트 매핑에 사용.
- **선택 상태 없음**: Input chip은 Filter chip과 달리 선택/토글 상태가 없다. 칩은 사용자가 입력한 정보를 표현하며, 삭제만 가능하다.
- **삭제 이벤트 분리**: 칩 바디 클릭(`@inputChipClicked`)과 삭제 버튼 클릭(`@inputChipRemoved`)을 분리하여 페이지가 의도를 구분할 수 있다.
