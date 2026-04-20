# Lists — Standard

## 기능 정의

1. **리스트 항목 렌더링** — `listItems` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링한다. 각 항목은 선행 아이콘 + 헤드라인 + 보조 텍스트로 구성된다
2. **항목 클릭 이벤트** — 항목 클릭 시 `@listItemClicked` 발행 (페이지가 상세/네비게이션 등 후속 액션 수행)

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.list__items` | 항목이 추가될 부모 (규약) |
| template  | `#list-item-template` | cloneNode 대상 (규약) |
| itemid    | `.list__item` | 항목 루트 + 이벤트 매핑 |
| leading   | `.list__leading` | 선행 요소 (아이콘/이모지) |
| headline  | `.list__headline` | 헤드라인 텍스트 |
| supporting | `.list__supporting` | 보조 텍스트 |

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| itemid | itemid |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| listItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `itemid` (computed property) | `@listItemClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('listItems', this)──> [Lists] 렌더링 ([{ itemid, leading, headline, supporting }, ...])

[Lists] ──@listItemClicked──> [페이지] ──> 해당 항목의 액션 수행
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플, 그라디언트 호버, Pretendard |
| 02_material    | B: Material Elevated | 라이트, elevation shadow, Roboto |
| 03_editorial   | C: Minimal Editorial | 웜 그레이, 세리프 헤드라인, 미니멀 구분선 |
| 04_operational | D: Dark Operational  | 컴팩트 다크 시안, 모노스페이스, 각진 모서리 |

### 결정사항

- **선행 요소**: 텍스트 기반 (이모지 또는 심볼 문자). leading 필드가 비어있으면 아이콘 영역이 CSS로 숨겨진다.
- **MD3 기반**: MD3 Lists의 one-line / two-line 구조. supporting이 비어있으면 one-line으로 표시.
- **근거**: MD3 Lists는 배열 데이터를 수직 목록으로 반복 렌더하므로 ListRenderMixin이 적합.
