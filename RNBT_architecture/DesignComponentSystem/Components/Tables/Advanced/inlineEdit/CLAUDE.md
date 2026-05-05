# Tables — Advanced / inlineEdit

## 기능 정의

1. **셀 클릭 → 인라인 input 변환 (`_editingCellId: "rowid::col"`)** — 편집 가능한 컬럼의 셀(`.table-ie__cell--col2`/`col3`/...)을 클릭하면 셀 textContent 가 `<input>` element 로 변환된다. 자체 상태 `_editingCellId` (= 단일 진실 출처, `rowid::col` composite 키) + `_editingOldValue` (취소용 원본) + `_editingInput` (DOM ref) + `_pendingFocusKey` (template clone 후 다시 input 으로 복원할 셀 식별자) 4종으로 편집 세션을 기억. 컬럼별 input type 옵션 (`columnTypes: { col5: 'number', col1: 'date' }`) 지원 (기본 `'text'`).
2. **저장 트리거 — blur / Enter** — input blur 또는 Enter 키 → input.value 를 row 데이터에 반영(`_rowData[rowid][col] = newValue`) + 셀 textContent 복원 + `_editingCellId = null` + `@cellEdited` 발행 (payload: `{ rowid, col, oldValue, newValue, targetInstance }`). number 타입은 빈 문자열을 `null` 로, 그 외는 trim. 값 변동 없으면 `@cellEdited` 발행 없이 `@cellEditCancelled` 발행 (실효 변경 없음 시그널).
3. **취소 — Escape 키** — input 표시 중 Escape → input.value 폐기 + 셀 textContent 를 `_editingOldValue` 로 복원 + `_editingCellId = null` + `@cellEditCancelled` 발행 (payload: `{ rowid, col, oldValue, targetInstance }`). 다른 셀 클릭 시 현재 편집 중인 셀은 blur → 저장 (자동 commit, 큐 의미상 blur=save).
4. **편집 가능 컬럼 옵션 — `setEditableCols` 토픽** — 외부 `setEditableCols` 토픽 publish 로 어느 컬럼이 편집 가능한지 동적으로 결정 (`{ cols: ['col2', 'col3', 'col5'] }`). `_editableCols: Set<string>` 자체 상태가 진실 출처 — 미등록 컬럼 셀 클릭은 토글 없음(=Standard 호환 행 클릭으로 흡수). 초기값은 옵션 시드(register 시점에 row 셀 클릭 가능 여부 판단). 빈 배열 publish 시 모든 컬럼 read-only.
5. **편집 시작 이벤트 (`@cellEditStart`)** — 셀이 input 으로 변환되는 순간 1회 발행 (payload: `{ rowid, col, currentValue, targetInstance }`). 페이지가 외부 validation indicator / 보조 UI 노출 가능 (예: "이 값은 영업일 기준만" 토스트).
5b. **편집 완료/취소 이벤트 분리** — `@cellEdited` (실효 변경 발생) ↔ `@cellEditCancelled` (Escape 또는 변경 없는 blur). 페이지가 두 채널을 분기하여 백엔드 PATCH 요청은 `@cellEdited` 만 (네트워크 절약), 임시 편집 표시는 두 이벤트로 정리.
6. **행 클릭 호환 (Standard 호환 시그니처 유지)** — `@tableRowClicked` 도 함께 발행 (bindEvents 위임 — Standard / rowSelectable 시그니처 호환). 단, 편집 중(`_editingCellId !== null`)에는 컨테이너 click delegator 가 행 클릭 분기를 흡수하지 않는다 (bindEvents 위임은 항상 발행 — 페이지가 `targetInstance.appendElement.querySelector('.table-ie__edit-input')` 으로 편집 모드 감지 후 무시 가능). 편집 가능 셀 click 은 `_handleClick` 에서 토글 후 stopPropagation 하지 않음 — bindEvents 도 발행하므로 페이지가 둘 다 받을 수 있다.

> **Standard 와의 분리 정당성**:
> - **새 자체 상태 5종** — `_editingCellId: string|null` (단일 진실), `_editingOldValue: string|null`, `_editingInput: HTMLInputElement|null`, `_pendingFocusKey: string|null` (template re-render 시 복원), `_rowData: Map<rowid, row>` (저장 시 row 객체 갱신 — 페이지가 외부 store 동기화 가능), `_editableCols: Set<string>` (편집 허용 컬럼), `_columnTypes: Object` (컬럼별 input type), `_groupClickHandler` / `_groupKeyDownHandler` / `_groupBlurHandler` (delegator bound ref 3종). Standard 는 stateless.
> - **자체 메서드 7종** — `_renderRows` / `_handleClick` / `_handleKeyDown` / `_handleBlur` / `_startEdit` / `_saveEdit` / `_cancelEdit` / `_setEditableCols`. Standard 는 자체 메서드 0종.
> - **HTML 구조 변경 — input 슬롯 추가 + dataset col 부착** — Standard 는 `.table__cell--col1~col5` 만. inlineEdit 은 `.table-ie__cell--col1~col5` 에 `data-col` 부착(편집 시 col 식별) + 편집 시 `<input class="table-ie__edit-input">` 동적 삽입. 클래스 prefix `table-ie__*` 로 다른 변형(`table__`, `table-rs__`, `table-cr__`, `table-fh__`, `table-sc__`, `table-vs__`)과 분리.
> - **새 토픽 1종** — `setEditableCols`. Standard 는 `tableRows` 1종.
> - **새 이벤트 3종** — `@cellEditStart` / `@cellEdited` / `@cellEditCancelled`. `@tableRowClicked` 는 Standard 호환 유지.
> - **컨테이너 native click + keydown + blur delegator 3종** — 셀 click → input 변환, keydown(Enter/Escape) → save/cancel, blur(focusout) → save. Standard 는 사용 안 함.
>
> 위 6축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가.

> **Tables/Advanced/rowSelectable 직전 답습**: register.js top-level 평탄, 자체 상태/메서드/이벤트/토픽 분리, preview `<script src>` 5단계 깊이 verbatim 복사, demo-label/hint 도메인 컨텍스트 명시. native 컨테이너 delegator 패턴(`_groupXxxHandler` bound ref + addEventListener) 동일 차용.

> **rowSelectable 와의 직교성**: rowSelectable = 행 선택 집합(selection 진실), inlineEdit = 셀 값 편집(데이터 진실). 다섯/여섯 변형 모두 서로 다른 축 — 독립적이다. 동일한 ListRenderMixin 토대 + Standard 호환 KEY(`rowid`/`col1~col5`) 공유. (양립 시 두 변형의 클래스 prefix 가 다르므로 페이지 내 공존 가능.)

> **MD3 / 도메인 근거**: MD3 / Material Web 의 Data Table 명세는 "Editable cells" 를 표준 인터랙션 중 하나로 명시 (셀 클릭 → input/select 변환, blur 또는 Enter 로 저장). 모든 모던 admin 패널 / 스프레드시트 라이브러리(ag-grid `editable: true`, Tabulator `editor: 'input'`, Notion DB 셀, Airtable, Excel) 가 동일 패턴. 실사용: ① **재고 수량 직접 편집** (운영 콘솔 — number 타입), ② **고객 정보 일괄 수정** (admin — text 타입), ③ **일정/마일스톤 일괄 수정** (PM — date 타입), ④ **카탈로그 가격/재고 일괄 수정** (E-commerce 관리자).

---

## 구현 명세

### Mixin

ListRenderMixin (행 데이터 렌더링 — Mixin 은 편집 인지 X) + 자체 메서드 8종(`_renderRows` / `_handleClick` / `_handleKeyDown` / `_handleBlur` / `_startEdit` / `_saveEdit` / `_cancelEdit` / `_setEditableCols`).

> **신규 Mixin 생성 금지** — 큐 설명에 "editingCellId + blur로 저장" 명시. SKILL 규칙상 본 루프에서 새 Mixin 을 만들지 않는다. ListRenderMixin 은 행 배열을 받아 N 개 grid row 를 렌더하고(편집 인지 X), 셀 클릭 → input swap · Enter/Escape 처리 · _rowData 갱신 · 명시 emit 은 컴포넌트 자체 메서드가 전담.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group         | `.table-ie`                       | 그룹 컨테이너 — `role="group"`, `data-editing` dataset 부착(편집 중 시그널) |
| header        | `.table-ie__header`               | 헤더 영역 (제목 + 편집 가능 컬럼 라벨). |
| editingLabel  | `.table-ie__editing-label`        | 현재 편집 중인 셀 표시 라벨(`col2 · evt-3`). `_startEdit` / `_saveEdit` / `_cancelEdit` 가 textContent 갱신. |
| headRow       | `.table-ie__head-row`             | 헤더 행. |
| container     | `.table-ie__body`                 | 행이 추가될 부모 (ListRenderMixin 규약). |
| template      | `#table-ie-row-template`          | `<template>` cloneNode 대상 (ListRenderMixin 규약). |
| rowid         | `.table-ie__row`                  | 렌더된 각 row 루트 — `data-rowid` + click 매핑 (Standard 호환). |
| col1          | `.table-ie__cell--col1`           | 1번 컬럼 셀 — `data-col="col1"`. |
| col2          | `.table-ie__cell--col2`           | 2번 컬럼 셀. |
| col3          | `.table-ie__cell--col3`           | 3번 컬럼 셀. |
| col4          | `.table-ie__cell--col4`           | 4번 컬럼 셀. |
| col5          | `.table-ie__cell--col5`           | 5번 컬럼 셀. |

> **편집 가능 marker / 편집 input 처리**: `.table-ie__editable-mark`(편집 가능 셀에 표시되는 hover 시 펜 아이콘 등) + `.table-ie__edit-input`(편집 중 동적 삽입되는 input)은 CSS / 자체 메서드가 직접 클래스로 다룬다. cssSelectors KEY 로 등록하지 않는다(데이터 바인딩 대상이 아니므로).

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| rowid | `rowid` | 행 click 시 `closest(rowid)?.dataset.rowid` 로 식별 (Standard 호환). |

### itemKey (ListRender)

`rowid` — 일관성 + 향후 `updateItemState` 활용용.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_editingCellId` | `string \| null` | 현재 편집 중 셀의 composite 키 (`rowid::col`). null = 편집 중 아님. 단일 진실 출처. |
| `_editingOldValue` | `string \| null` | Escape 취소용 원본 textContent 보관. |
| `_editingInput` | `HTMLInputElement \| null` | 동적으로 삽입된 input element 참조 (focus / blur listener 부착). |
| `_rowData` | `Map<string, object>` | 가장 최근 페이로드의 row 객체를 rowid 키로 보관. `_saveEdit` 가 새 값으로 갱신 (페이지가 외부 store 동기화 시 참고). |
| `_editableCols` | `Set<string>` | 편집 허용 컬럼 KEY 집합 (`'col2', 'col3', 'col5'`). 초기값 register 옵션 시드, 외부 `setEditableCols` 토픽으로 동적 변경. |
| `_columnTypes` | `Object` | 컬럼별 input type (`{ col5: 'number', col1: 'date' }`). 기본 `'text'`. register 옵션. |
| `_groupClickHandler` | `function \| null` | bound `_handleClick` — beforeDestroy 정확 제거용. |
| `_groupKeyDownHandler` | `function \| null` | bound `_handleKeyDown` (Enter/Escape). |
| `_groupBlurHandler` | `function \| null` | bound `_handleBlur` (focusout — input outside click 감지). |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `tableRows` | `this._renderRows` | `[{ rowid, col1, col2, col3, col4, col5 }]` — 새 batch (이전 누적 X — `_rowData` 통째 재구성, 편집 중이었으면 자동 cancel). |
| `setEditableCols` | `this._setEditableCols` | `{ cols: ['col2', 'col3', 'col5'] }` — 외부에서 편집 가능 컬럼 변경. 빈 배열 허용(전체 read-only). |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `rowid` (ListRender) | 행 클릭 | `@tableRowClicked` (Standard 호환 — `{ targetInstance, event }`). 편집 중이어도 발행 — 페이지가 무시할 수 있도록. |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@cellEditStart` | 편집 가능 셀 클릭 → input 변환 직후 1회 | `{ targetInstance, rowid, col, currentValue }` |
| `@cellEdited` | blur 또는 Enter, 값 실효 변경 시 1회 | `{ targetInstance, rowid, col, oldValue, newValue }` |
| `@cellEditCancelled` | Escape 또는 값 변경 없는 blur 시 1회 | `{ targetInstance, rowid, col, oldValue }` |

> **이벤트 발행 분리 이유**: bindEvents 위임은 `{ targetInstance, event }` 만 전달 → rowid/col/value 가 없다. inlineEdit 은 페이지가 매번 DOM 을 다시 스캔하지 않고도 어떤 셀이 어떤 값으로 바뀌었는지 바로 받을 수 있어야 하므로(예: 백엔드 PATCH 요청 즉시 발사) 자체 native delegator 에서 명시 payload 를 emit. `@tableRowClicked` 위임 발행은 Standard 호환 navigate 채널로 분리.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderRows({ response })` | `({response}) => void` | `tableRows` 핸들러. rows 배열을 ListRender selectorKEY(rowid/col1~col5)에 그대로 전달 (Standard 호환). 편집 중이었다면 (`_editingCellId !== null`) 묵음 cancel — DOM 이 새로 그려지므로 input 자동 폐기. `_rowData` 를 새 Map 으로 통째 재구성 (페이로드의 row 객체를 rowid 키로 저장). 편집 가능 컬럼에 hover 시각 hint 적용 (셀 dataset.editable 부착). emit 없음. |
| `_handleClick(e)` | `(MouseEvent) => void` | 컨테이너 single native click delegator. ① `e.target.closest('.table-ie__edit-input')` → input 자체 클릭(propagation 흡수, no-op — focus 유지). ② `e.target.closest(rowid)` 후 cell 식별(`closest('[data-col]')`) → cell.dataset.col 이 `_editableCols` 에 있으면 `_startEdit(rowid, col, cellEl)` 호출 (단, 이미 편집 중인 동일 셀이면 no-op). ③ 다른 셀 편집 중에 새 편집 가능 셀 클릭 → 기존 셀 `_saveEdit` 후 새 셀 `_startEdit`. ④ 편집 불가 셀 / 행 본체 → 토글 없음 (bindEvents 위임의 `@tableRowClicked` 만 발행). |
| `_handleKeyDown(e)` | `(KeyboardEvent) => void` | 컨테이너 keydown delegator. `_editingInput` 이고 e.target === `_editingInput` 일 때만 처리. Enter → preventDefault + `_saveEdit()`. Escape → preventDefault + `_cancelEdit()`. 그 외 키는 input 기본 동작. |
| `_handleBlur(e)` | `(FocusEvent) => void` | 컨테이너 focusout(blur) delegator. e.target === `_editingInput` 이고 새 focus 가 input 자신이 아니면 `_saveEdit()` 호출. 이미 편집 종료된 후 호출이면 silent return. |
| `_startEdit(rowid, col, cellEl)` | `(string, string, HTMLElement) => void` | 셀을 input 으로 변환. 셀 textContent 를 `_editingOldValue` 에 보관 → cellEl.innerHTML = '' → input 생성(class `table-ie__edit-input`, type = `_columnTypes[col]` ?? 'text', value = oldValue) → cellEl.appendChild → input.focus() + input.select() → `_editingCellId = "rowid::col"`, `_editingInput = input`, group dataset.editing = true, editingLabel textContent 갱신. `Weventbus.emit('@cellEditStart', { rowid, col, currentValue: oldValue, targetInstance })`. |
| `_saveEdit()` | `() => void` | input.value 추출(number 타입은 빈 문자열을 null, 그 외 trim) → input element 제거 후 cellEl.textContent = newValue (null 은 빈 문자열). `_rowData` 의 row 객체에 `[col] = newValue` 갱신. `_editingCellId / _editingOldValue / _editingInput = null`, group dataset.editing 제거, editingLabel 비우기. 값 변동 시(`oldValue !== newValue`) `Weventbus.emit('@cellEdited', { rowid, col, oldValue, newValue, targetInstance })`. 변동 없으면 `@cellEditCancelled` 발행. |
| `_cancelEdit()` | `() => void` | input element 제거 후 cellEl.textContent = `_editingOldValue` 복원. `_editingCellId / _editingOldValue / _editingInput = null`, group dataset.editing 제거, editingLabel 비우기. `Weventbus.emit('@cellEditCancelled', { rowid, col, oldValue, targetInstance })`. |
| `_setEditableCols({ response })` | `({response}) => void` | `setEditableCols` 토픽 핸들러. `response = { cols: [...] }` → `_editableCols = new Set(cols)`. 모든 셀의 dataset.editable 재계산. 편집 중인 셀이 새 set 에 미포함이면 `_cancelEdit()` (강제 취소). emit 없음(외부 publish 는 silent). |

### 페이지 연결 사례

```
[페이지 — 재고 수량 직접 편집(number) / 고객 plan 일괄 수정(text) / 일정 마일스톤 수정(date)]
    │
    └─ fetchAndPublish('tableRows', this) 또는 직접 publish
        payload 예: [
          { rowid: 'sku-001', col1: 'TB-Air-13',  col2: 'Apparel',  col3: 'M', col4: 'In Stock',   col5: '142' },
          { rowid: 'sku-002', col1: 'TB-Pro-14',  col2: 'Apparel',  col3: 'L', col4: 'Low Stock',  col5: '8'   },
          { rowid: 'sku-003', col1: 'TB-Mini-7',  col2: 'Accessory', col3: 'S', col4: 'Out',       col5: '0'   }
        ]
        editableCols: ['col2', 'col3', 'col5']
        columnTypes: { col5: 'number' }

[Tables/Advanced/inlineEdit]
    ├─ ListRender 가 rows 배열을 grid row 로 렌더 (이전 row 전체 replace)
    ├─ _renderRows 가 _rowData = Map(rowid → row) 재구성
    ├─ 편집 가능 컬럼(col2/col3/col5) 셀에 dataset.editable="true"

[사용자가 'sku-002' 행의 col5 셀(값 '8') 클릭]
    ├─ _handleClick → cell.dataset.col === 'col5' && _editableCols.has('col5')
    ├─ _startEdit('sku-002', 'col5', cellEl)
    │     ├─ cellEl 비우고 <input type="number" value="8"> 삽입 + focus
    │     ├─ _editingCellId = 'sku-002::col5', _editingOldValue = '8'
    │     └─ @cellEditStart { rowid: 'sku-002', col: 'col5', currentValue: '8' }

[사용자가 input 에 '24' 입력 후 Enter]
    ├─ _handleKeyDown → Enter → _saveEdit
    │     ├─ input.value '24', type 'number' → '24' (정상)
    │     ├─ cellEl.textContent = '24', input 제거
    │     ├─ _rowData.get('sku-002').col5 = '24'
    │     ├─ _editingCellId / _editingOldValue / _editingInput = null
    │     └─ @cellEdited { rowid: 'sku-002', col: 'col5', oldValue: '8', newValue: '24' }

[사용자가 다른 셀 'sku-003' col2 셀 클릭하여 편집 시작]
    ├─ _handleClick → 편집 중이 아님 → _startEdit('sku-003', 'col2', cellEl)
    └─ ...

[편집 도중 Escape]
    ├─ _handleKeyDown → Escape → _cancelEdit
    │     ├─ cellEl.textContent = _editingOldValue 복원
    │     └─ @cellEditCancelled { rowid, col, oldValue }

[페이지 — setEditableCols publish 로 편집 가능 컬럼 변경 (예: '재고 수량만 수정 모드')]
    └─ instance._setEditableCols({ response: { cols: ['col5'] } })
        → _setEditableCols → _editableCols = Set(['col5'])
        → 모든 셀의 dataset.editable 재계산 → col5 만 'true'
        → 편집 중인 셀이 새 set 에 없으면 _cancelEdit (자동 취소)

운영: this.pageDataMappings = [
        { topic: 'tableRows',       datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setEditableCols', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@cellEditStart':     ({ rowid, col, currentValue }) => { /* 보조 UI */ },
        '@cellEdited':        ({ rowid, col, oldValue, newValue }) => { /* 백엔드 PATCH */ },
        '@cellEditCancelled': ({ rowid, col, oldValue }) => { /* 임시 표시 정리 */ },
        '@tableRowClicked':   ({ event, targetInstance }) => { /* 행 본문 → 상세 진입 */ }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | 편집 시각 차별화 (셀 hover · input · editing label) | 도메인 컨텍스트 예 |
|------|---------|-------------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 호버 / Pretendard / 8/20px 모서리. 편집 가능 셀 hover: 퍼플 outline + ✎ marker fade-in. input: 다크 퍼플 fill + 시안 caret + 8px 모서리. editingLabel: 시안 ring badge. | **재고 SKU 수량 편집 → 즉시 PATCH** (제품/카테고리/사이즈/상태/재고수 — 운영 콘솔 number 타입 col5) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Pretendard+Roboto / 12px 모서리. 편집 가능 셀 hover: secondary container surface(`#E8DEF8`) + Material 펜 아이콘. input: outlined text field 스타일(2px primary). editingLabel: filled chip(`#6750A4`). | **고객 plan / region 직접 수정** (이름/이메일/지역/플랜/MRR — admin 패널 text 타입 col3, col4) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif 헤드라인 / 샤프 구분선. 편집 가능 셀 hover: dotted underline + serif italic ✎ marker. input: 1.5px 다크 갈색 outline + Inter 본문 + 미세 fill 톤. editingLabel: serif italic + underline. | **참고문헌 일괄 수정 — 출판년도(date)/저자명** (연도/저자/제목/장르/페이지 — date 타입 col1) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 시안 / IBM Plex / 각진 2-4px 모서리. 편집 가능 셀 hover: 시안 ring(`box-shadow: 0 0 0 1px #4DD0E1`) + MONO 펜 마커. input: 시안 fill(`rgba(77,208,225,.12)`) + IBM Plex Mono + 2px 모서리. editingLabel: 시안 monospace tag. | **알람 메모 / 임계값 직접 편집** (시각/프로브/사이트/상태/임계값 — 운영 콘솔 number 타입 col5) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-editable="true"]:hover` (편집 가능 셀 hint) + `.table-ie__edit-input` (입력 중) + `.table-ie[data-editing="true"] .table-ie__editing-label` (현재 편집 중 셀 표시) 셀렉터로 시각을 분기.

### 결정사항

- **단일 셀 편집 (다중 X)**: 큐 핵심 의미 그대로 — 한 번에 하나의 셀만 input 으로 변환. 다른 셀 클릭 시 기존 셀 자동 save. 다중 동시 편집은 별도 변형 후보(향후).
- **blur=save (auto-commit)**: 큐 명시 — "blur 또는 Enter로 값 저장. Escape로 취소". 사용자가 input outside 클릭 시 자동 저장 (Notion / Airtable 표준 UX).
- **컬럼별 input type**: 큐 명시 옵션 — `{ col5: 'number', col1: 'date' }` 형태. 기본 'text'. 과한 type 분기(select/textarea)는 별도 변형 후보.
- **`@cellEdited` 단일 이벤트, payload `oldValue/newValue` 명시**: 큐 명시 — 페이지가 변경 전후 값을 한 번에 받아 백엔드 PATCH 발사 가능. 추가 이벤트 분리(`@cellEditStart`/`@cellEditCancelled`)는 페이지 핸들러 책임 명확화 (백엔드 호출은 `@cellEdited` 만, UI 정리는 모두에서).
- **편집 중에도 `@tableRowClicked` 발행 유지**: Standard 호환. 페이지가 `_editingCellId` 또는 `[data-editing="true"]` 셀렉터로 편집 중 감지하여 무시 가능.
- **컨테이너 native delegator 3종 (click + keydown + blur)**: bindEvents 만으로는 keydown 위임 불가 → 자체 delegator. `_groupXxxHandler` bound ref 3종으로 정확 제거.
- **`_rowData: Map<rowid, row>`**: 페이지가 외부 store 동기화할 수 있도록 컴포넌트 측에서도 row 데이터를 보관. `_saveEdit` 가 갱신. 단일 진실은 페이지 store(컴포넌트는 캐시).
- **새 batch 도착 시 편집 자동 취소**: ListRender renderData 가 컨테이너를 비우므로 input 도 자동 사라짐. `_editingCellId` 등은 `_renderRows` 가 명시 null 화.
- **클래스 prefix `.table-ie__*`**: Standard / virtualScroll / sortableColumn / filterableHeader / columnResize / rowSelectable 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **신규 Mixin 생성 금지**: ListRenderMixin + 자체 메서드 8종으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (컨테이너 click/keydown/blur delegator remove → customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tables/Advanced/inlineEdit/preview/...html` → `../`를 5번 = rowSelectable 동일 verbatim 복사)
