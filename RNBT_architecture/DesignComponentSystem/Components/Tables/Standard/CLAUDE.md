# Tables — Standard

## 기능 정의

1. **행 데이터 렌더링** — `tableRows` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링한다. 각 행은 고정된 5개 컬럼(col1~col5) 셀로 구성된다
2. **행 클릭 이벤트** — 행 클릭 시 `@tableRowClicked` 발행 (페이지가 상세/선택 등 후속 액션 수행)

---

## 구현 명세

### Mixin

ListRenderMixin

### 구조 방침 (Standard 범위)

- 컬럼 수는 **5개로 고정**한다. 헤더는 HTML에 **정적 슬롯**으로 선언되며 런타임 데이터로 바꾸지 않는다 (헤더가 데이터 의존 변동이 필요하면 Advanced 에서 헤더용 ListRenderMixin 을 추가한다).
- 행 셀은 `col1`~`col5` 사용자 정의 KEY 로 매핑되어 ListRenderMixin 하나로 렌더된다.
- 정렬/선택/페이지네이션/필터링은 Standard 범위에서 **제외** — MD3(및 Material Web Table)에서도 이들은 선택적 기능으로 분리된다.
- 헤더 label 은 HTML 에 직접 작성한다. 컴포넌트가 사용처에서 헤더를 바꿔야 할 때는 Advanced 변형(예: `dynamicHeaders`)에서 처리한다.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.table__body` | 행이 추가될 부모 (규약) |
| template  | `#table-row-template` | cloneNode 대상 (규약) |
| rowid     | `.table__row` | 행 루트 + 이벤트 매핑 |
| col1      | `.table__cell--col1` | 1번 컬럼 셀 |
| col2      | `.table__cell--col2` | 2번 컬럼 셀 |
| col3      | `.table__cell--col3` | 3번 컬럼 셀 |
| col4      | `.table__cell--col4` | 4번 컬럼 셀 |
| col5      | `.table__cell--col5` | 5번 컬럼 셀 |

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| rowid | rowid |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| tableRows | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `rowid` (computed property) | `@tableRowClicked` |

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('tableRows', this)──> [Tables] 렌더링 ([{ rowid, col1..col5 }, ...])

[Tables] ──@tableRowClicked──> [페이지] ──> 해당 행의 상세 열기/선택 토글 등
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플, 그라디언트 호버, Pretendard, 8/20px 모서리 |
| 02_material    | B: Material Elevated | 라이트, elevation shadow, Pretendard+Roboto, 8px 모서리 |
| 03_editorial   | C: Minimal Editorial | 웜 그레이, 세리프 헤드라인, 샤프 구분선, 정적 |
| 04_operational | D: Dark Operational  | 컴팩트 다크 시안, IBM Plex, 각진 2-4px 모서리 |

### 결정사항

- **헤더 정적/행 동적**: MD3 Data tables 는 "첫 행이 컬럼 헤더"이고, 헤더는 구조적으로 고정되며 정렬/선택 인디케이터만 동적이다 (근거: [MD1 Data Tables — Structure](https://m1.material.io/components/data-tables.html) · MD3 에서는 공식 범주에서 deprecated 되었으나 MWC Table 구현도 동일 구조). 따라서 Standard 는 헤더=정적, 행=동적 으로 구성한다.
- **컬럼 수 5 고정**: 3~6 범위가 MD1 이 권장하는 전형적 구조. 5개는 Dashboard 의 "시간 · 대상 · 분류 · 상태 · 값" 같은 사용례에 자연스럽게 들어맞는다. 컬럼 수 가변은 Advanced (`flexibleColumns`) 에서 다룬다.
- **MD3 deprecated 처리**: MD3 공식 카탈로그는 Data tables 를 별도 컴포넌트로 유지하지 않으나 (MWC Issue #3867), 대시보드 도메인에서는 여전히 핵심 표시 수단이다. 범주 CLAUDE.md 의 정의도 이를 명시한다.
- **근거**: 배열 데이터를 template 기반으로 반복 렌더하고 행 단위 클릭 이벤트를 전파하는 기능 — `ListRenderMixin` 의 정의(데이터를 보여준다 / template 복제) 와 정확히 일치한다. 셀은 행 template 내부 고정 슬롯(col1~col5)이므로 별도 Mixin 없이 하나의 ListRender 로 충분하다.
