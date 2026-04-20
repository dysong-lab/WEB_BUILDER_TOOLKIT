# Checkbox — Standard

## 기능 정의

1. **체크박스 항목 렌더링** — `checkboxItems` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링한다. 각 항목은 체크박스 박스 + 라벨로 구성되며, 개별 항목의 체크 상태(checked / unchecked / indeterminate)를 관리한다
2. **체크박스 클릭 이벤트** — 항목 클릭 시 `@checkboxClicked` 발행 (페이지가 다음 상태를 결정)

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.checkbox__list` | 항목이 추가될 부모 (규약) |
| template  | `#checkbox-item-template` | cloneNode 대상 (규약) |
| checkid   | `.checkbox__item` | 항목 식별 + 이벤트 매핑 |
| checked   | `.checkbox__item` | 체크 상태 (data-checked: "true"/"false"/"indeterminate") |
| disabled  | `.checkbox__item` | 비활성화 상태 (data-disabled) |
| label     | `.checkbox__label` | 라벨 텍스트 |

> **체크마크/인디터미네이트 처리**: `.checkbox__check-mark`(체크 아이콘)와 `.checkbox__indeterminate-mark`(대시 아이콘)는 template에 고정 존재하며 `data-checked` 값에 따라 CSS로만 표시를 제어한다. cssSelectors KEY로 등록하지 않는다 (데이터 바인딩 대상이 아니므로).

### itemKey

checkid

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| checkid  | checkid |
| checked  | checked |
| disabled | disabled |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| checkboxItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `checkid` (computed property) | `@checkboxClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('checkboxItems', this)──> [Checkbox] 렌더링 ([{ checkid, label, checked, ... }, ...])

[Checkbox] ──@checkboxClicked──> [페이지] ──> 다음 상태 결정(toggle)
                                              + updateItemState(id, { checked: next })
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플 tonal, Pretendard, 그라디언트 체크박스 |
| 02_material    | B: Material Elevated | outlined 둥근 모서리, 라이트 블루, Roboto |
| 03_editorial   | C: Minimal Editorial | 웜 그레이, Georgia 세리프, 미니멀 사각 |
| 04_operational | D: Dark Operational  | 컴팩트 다크 시안, JetBrains Mono, 각진 모서리 |

### 결정사항

- **tri-state** 표현: `data-checked="true" | "false" | "indeterminate"`. CSS가 각 상태에 맞는 아이콘(check 또는 dash)을 표시한다.
- **체크마크 아이콘**: 인라인 SVG (체크 `✓` 모양)와 대시 SVG (`─` 모양)를 template에 고정 배치. 상태별 visibility는 CSS에서만 제어한다.
- **선택/토글 결정은 페이지에 위임**: Mixin은 순수 렌더링만 수행한다.
