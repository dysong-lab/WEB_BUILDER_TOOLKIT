# SegmentedButtons — Standard

## 기능 정의

1. **세그먼트 항목 렌더링** — `segmentedButtonItems` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링하고, 개별 항목의 선택 상태를 관리한다
2. **세그먼트 클릭 이벤트** — 세그먼트 클릭 시 `@segmentClicked` 발행

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.segmented-button__list` | 항목이 추가될 부모 (규약) |
| template  | `#segmented-button-item-template` | cloneNode 대상 (규약) |
| segmentid | `.segmented-button__item` | 항목 식별 + 이벤트 매핑 |
| selected  | `.segmented-button__item` | 선택 상태 (data-selected) |
| label     | `.segmented-button__label` | 라벨 텍스트 |
| icon      | `.segmented-button__icon`  | 아이콘 (선택적) |

> **체크마크 처리**: `.segmented-button__check`는 template에 고정 존재하며 `data-selected="true"` 시 CSS로만 표시된다. cssSelectors KEY로 등록하지 않는다 (데이터 바인딩 대상이 아니므로).

### itemKey

segmentid

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| segmentid | segmentid |
| selected  | selected |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| segmentedButtonItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `segmentid` (computed property) | `@segmentClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('segmentedButtonItems', this)──> [SegmentedButtons] 렌더링 ([{ segmentid, label, ... }, ...])

[SegmentedButtons] ──@segmentClicked──> [페이지] ──> single-select: 이전 해제 + 클릭된 항목 선택
                                                    + updateItemState(id, { selected: 'true' })
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | Connected — 다크 퍼플 tonal, Pretendard |
| 02_material    | B: Material Elevated | Connected — outlined, 라이트 블루, Roboto |
| 03_editorial   | C: Minimal Editorial | Connected — 웜 그레이 미니멀, 세리프 |
| 04_operational | D: Dark Operational  | Connected — 컴팩트 다크 시안, 모노스페이스 |
