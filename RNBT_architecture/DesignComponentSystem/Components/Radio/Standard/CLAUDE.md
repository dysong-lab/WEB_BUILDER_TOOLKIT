# Radio — Standard

## 기능 정의

1. **라디오 항목 렌더링** — `radioItems` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링한다. 각 항목은 라디오 원형 인디케이터 + 라벨로 구성되며, 개별 항목의 선택 상태(selected / unselected)와 비활성 상태(disabled)를 관리한다.
2. **라디오 클릭 이벤트** — 항목 클릭 시 `@radioClicked` 발행 (페이지가 단일 선택 규칙을 적용: 이전 선택 해제 + 클릭된 항목 선택)

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.radio__list` | 항목이 추가될 부모 (규약) |
| template  | `#radio-item-template` | cloneNode 대상 (규약) |
| radioid   | `.radio__item` | 항목 식별 + 이벤트 매핑 |
| selected  | `.radio__item` | 선택 상태 (data-selected: "true"/"false") |
| disabled  | `.radio__item` | 비활성화 상태 (data-disabled) |
| label     | `.radio__label` | 라벨 텍스트 |

> **라디오 원형 인디케이터 처리**: `.radio__circle`(외곽 원)과 `.radio__dot`(내부 중심 점)은 template에 고정 존재하며, `data-selected` 값에 따라 CSS로만 표시/숨김을 제어한다. cssSelectors KEY로 등록하지 않는다 (데이터 바인딩 대상이 아니므로).

### itemKey

radioid

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| radioid  | radioid |
| selected | selected |
| disabled | disabled |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| radioItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `radioid` (computed property) | `@radioClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('radioItems', this)──> [Radio] 렌더링 ([{ radioid, label, selected, ... }, ...])

[Radio] ──@radioClicked──> [페이지] ──> single-select: 이전 해제 + 클릭된 항목 선택
                                        + updateItemState(prevId, { selected: 'false' })
                                        + updateItemState(clickedId, { selected: 'true' })
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 남색 배경, Pretendard, 그라디언트 라디오 인디케이터 |
| 02_material    | B: Material Elevated | 라이트 블루 accent, Roboto, MD3 스타일 원형 링 |
| 03_editorial   | C: Minimal Editorial | 웜 베이지 배경, Georgia 세리프, 얇은 테두리 원 |
| 04_operational | D: Dark Operational  | 컴팩트 다크 시안, JetBrains Mono, 모노톤 기능적 원 |

### 결정사항

- **bi-state** 표현: `data-selected="true" | "false"`. 체크박스의 indeterminate는 라디오에 존재하지 않는다 (MD3 명세: 단일 선택만).
- **라디오 인디케이터**: 외곽 원(`.radio__circle`)은 항상 표시되고, 내부 점(`.radio__dot`)은 `data-selected="true"` 시에만 CSS로 표시한다. SVG가 아닌 div 기반으로 충분히 표현 가능하므로 div로 구성.
- **단일 선택 결정은 페이지에 위임**: Mixin은 순수 렌더링만 수행. 페이지가 이전 선택 해제 + 새 선택 적용을 책임.
- **체크박스와의 핵심 차이**: indeterminate 상태 없음, `selected` 의미가 "하나만 켜짐"(라디오 그룹 내 단일 선택).
