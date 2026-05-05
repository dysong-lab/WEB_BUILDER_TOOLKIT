# Checkbox — Advanced / indeterminate

## 기능 정의

1. **부모-자식 그룹 체크박스 렌더** — `checkboxGroup` 토픽으로 수신한 페이로드(`{parent: {id, label}, children: [{id, label, selected}]}`)를 받아 ① 고정 DOM 영역에 부모 체크박스(label) 1개를 렌더하고, ② ListRenderMixin이 `<template>` cloneNode로 자식 체크박스 N개를 렌더한다. 자식 체크박스 항목별 `data-checkid`로 식별.
2. **tri-state 종합(cascade up)** — 자식 체크박스의 종합 상태에 따라 부모 체크박스가 자동으로 tri-state로 표시된다: ① 자식이 모두 selected → 부모 `data-state="checked"`, ② 자식이 모두 unselected → 부모 `data-state="unchecked"`, ③ 자식이 일부만 selected → 부모 `data-state="indeterminate"` (시각: 가로 dash bar). HTML5 native `<input type="checkbox">.indeterminate = true` DOM property + dataset `data-state="indeterminate"` 두 채널 동기화(a11y는 native indeterminate, CSS는 `data-state` 셀렉터 분기). 자식이 0개면 부모는 단순 일반 체크박스로 동작(unchecked / checked).
3. **부모 클릭으로 일괄 토글(cascade down)** — 부모 체크박스 클릭 시 모든 자식을 동일 값으로 set한다: 부모 현재 상태가 `checked` 또는 `indeterminate` → 모든 자식 unselected, 부모 `unchecked` → 모든 자식 selected. `_childrenStates: Map<id, boolean>` 자체 상태가 갱신되고 `_renderChildren` + `_recomputeParentState`가 DOM에 일괄 반영.
4. **자식 클릭 토글(부모 재계산)** — 자식 체크박스 클릭 시 해당 자식만 토글되고(`_childrenStates` 갱신) 즉시 부모 상태가 재계산된다(`_recomputeParentState` → all/none/mixed 분기). 다른 자식은 영향 없음.
5. **그룹 변경 이벤트** — selected 집합이 변경될 때 `@checkboxGroupChanged` 발행. payload: `{ targetInstance, parentId, parentState: 'checked' | 'unchecked' | 'indeterminate', childrenIds: [{id, selected}] }`. 페이지가 부모 종합 상태와 함께 모든 자식의 현재 selected를 동시에 수신하여 분기 처리(예: 다중 권한 그룹 일괄 적용, 다중 알림 채널 일괄 토글).

> **Standard와의 분리 정당성**:
> - **새 토픽** — Standard는 `checkboxItems`(평면 배열 `[{checkid, label, checked, disabled}]`). indeterminate는 `checkboxGroup`(중첩 객체 `{parent: {id, label}, children: [{id, label, selected}]}`) — 부모-자식 의미가 페이로드에 명시. 데이터 형태가 직교.
> - **자체 상태 (`_childrenStates: Map<id, boolean>`, `_parentId`, `_parentLabel`)** — Standard는 stateless(페이지가 매 클릭마다 정책 결정 후 `updateItemState` 호출). indeterminate는 cascade(상→하 일괄 토글, 하→상 종합 재계산) 정책을 컴포넌트로 흡수. SegmentedButtons/multiSelect의 `_selectedIds: Set` 패턴을 응용하되 부모 상태 추적이 추가됨.
> - **자체 메서드 6종** — `_renderGroup`, `_renderChildren`, `_recomputeParentState`, `_handleParentClick`, `_handleChildClick`, `_emitChange`. Standard는 자체 메서드 0종.
> - **새 이벤트** — `@checkboxGroupChanged`(parentId + parentState + childrenIds 명시 payload). Standard는 `@checkboxClicked`(단순 click 릴레이)만.
> - **HTML 구조 변경** — Standard는 단일 `.checkbox__list`만. indeterminate는 부모 영역(`.checkbox-group__parent`) + 자식 영역(`.checkbox-group__children` = ListRender container) 2층 구조 + 부모 cascade 영역. 부모는 FieldRender/고정 DOM, 자식은 ListRender N개.
> - **자체 native click delegator** — 부모 click과 자식 click을 분리하여 처리(`_handleParentClick`, `_handleChildClick`). Standard는 단순 위임만.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **SegmentedButtons/multiSelect 차용 + 차이**: SegmentedButtons/multiSelect의 `_selectedIds: Set + 자체 native click delegator + Weventbus 명시 emit + ARIA 의미론` 패턴을 그대로 차용한다. 차이는 ① `Set` 대신 `Map<id, boolean>`(자식 명시적 false도 Map에 보존하여 cascade 일괄 토글의 정확성 확보), ② 부모 항목이 별도 영역(자식 ListRender 바깥)에 존재하여 cascade 양방향 처리 필요, ③ 페이로드가 `{parent, children}` 중첩 구조(평면 배열 아님), ④ 이벤트 페이로드가 `parentState` 종합 + `childrenIds` 배열(단일 변경 추적은 부모 종합 상태로 환원).

> **Cards/Advanced/selectable 차용 + 차이**: selectable의 `_selectedIds: Set + ListRender + ARIA + group dataset` 패턴을 그대로 차용. 차이는 ① cascade 양방향(selectable은 단일 평면 토글만), ② 부모 존재(selectable은 평면 그룹), ③ tri-state(selectable은 binary).

> **MD3 / 도메인 근거**: MD3 Checkbox는 indeterminate 상태를 명시적으로 정의하며("A parent checkbox with one or more children selected can use an indeterminate state to communicate the partial selection state"), 본 변형은 그 표준 패턴을 구현한다. 실사용 예: ① 다중 권한 그룹(전체 권한 = 부모 / Read·Write·Delete = 자식 자동 종합), ② 다중 알림 채널 그룹(전체 알림 = 부모 / SMS·Push·Email = 자식 cascade), ③ 파일 다중 선택의 폴더 부모(폴더 체크 = 모든 파일 토글), ④ 설정 일괄 적용(카테고리 부모 = 카테고리 안 모든 옵션 토글), ⑤ 대량 작업의 헤더 체크(테이블 모든 행 선택 헤더 + 개별 행 자식). HTML5 spec의 `<input type="checkbox">.indeterminate` DOM property는 a11y 계층(스크린리더가 "mixed" 발화)을 보장하는 표준 속성이므로 본 변형이 채택.

---

## 구현 명세

### Mixin

ListRenderMixin (자식 체크박스 배열 렌더) + 자체 메서드(`_renderGroup` / `_renderChildren` / `_recomputeParentState` / `_handleParentClick` / `_handleChildClick` / `_emitChange`).

> Standard도 ListRenderMixin을 사용하지만, Standard는 `itemKey: 'checkid'` + `datasetAttrs.checked` 경로로 페이지가 `updateItemState`를 호출하여 checked를 직접 조작한다. indeterminate는 cascade 정책을 컴포넌트로 흡수하므로 `_childrenStates: Map`이 진실 출처이고, `datasetAttrs.checked`는 사용하지 않는다 (자체 native delegator가 `data-checked`를 토글). Mixin 메서드 재정의는 하지 않는다(`_renderChildren`은 `listRender.renderData` 호출 후 _childrenStates 기준으로 dataset을 일괄 적용하는 wrapper). 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group           | `.checkbox-group`                       | 그룹 컨테이너 — `role="group"`, `data-state` 부착 대상(시각 옵션) |
| parent          | `.checkbox-group__parent`               | 부모 체크박스 root — click 위임 + `data-state="checked\|unchecked\|indeterminate"` 부착 |
| parentInput     | `.checkbox-group__parent-input`         | native `<input type="checkbox">` — `.indeterminate` DOM property 동기화 (a11y) |
| parentLabel     | `.checkbox-group__parent-label`         | 부모 라벨 텍스트 |
| container       | `.checkbox-group__children`             | 자식 항목이 추가될 부모 (ListRenderMixin 규약) |
| template        | `#checkbox-group-child-template`        | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| childItem       | `.checkbox-group__child`                | 렌더된 각 자식 root — click 위임 + `data-checked` 부착 |
| checkid         | `.checkbox-group__child`                | 자식 식별 (data-checkid) |
| label           | `.checkbox-group__child-label`          | 자식 라벨 텍스트 |

> **체크마크/dash 처리**: `.checkbox-group__parent-mark-check`, `.checkbox-group__parent-mark-dash`, `.checkbox-group__child-mark`(자식 체크 SVG)는 template/고정 DOM에 존재하며 `data-state` / `data-checked`에 따라 CSS로만 표시를 제어한다. cssSelectors KEY로 등록하지 않는다 (데이터 바인딩 대상이 아니므로 — 시각 채널 전담).

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| checkid | `checkid` | 자식 click 시 `event.target.closest(childItem)?.dataset.checkid`로 식별. ListRender가 `data-checkid` 속성을 자식에 자동 설정. |

> **note**: checked는 `datasetAttrs`에 등록하지 않는다 — checked 정책을 자체 상태(`_childrenStates: Map`)로 흡수하므로 ListRender의 데이터 바인딩 경로에서는 checked를 다루지 않는다. 초기 checked는 `_renderChildren`이 페이로드 `selected:true` 항목을 `_childrenStates.set(id, true)`로 기록한 뒤 자체적으로 dataset을 일괄 적용한다.

### itemKey

`checkid` (ListRender) — 일관성을 위해 등록. 향후 `updateItemState`/`getItemState`로 개별 자식 강조 등 활용.

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_childrenStates` | 자식 체크 상태 `Map<id, boolean>`. `_handleChildClick`이 toggle, `_renderGroup`이 초기값 결정. |
| `_parentId` | 현재 부모 id (string 또는 null). `_renderGroup`이 설정. |
| `_parentLabel` | 현재 부모 label (string 또는 ''). `_renderGroup`이 설정. |
| `_groupClickHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. 컨테이너에 단일 native click delegator를 부착하여 부모/자식 영역을 closest로 분기. |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `checkboxGroup` | `this._renderGroup` (페이로드 `{parent: {id, label}, children: [{id, label, selected}]}`) — 내부에서 부모 라벨 적용 + 자식 ListRender 호출 + `_childrenStates` 초기화 + `_recomputeParentState` 호출 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `parent` | 부모 체크박스 클릭 | `@checkboxGroupChanged` (bindEvents 위임 발행 — Weventbus 채널 등록 보장 의미) |
| click | `childItem` | 자식 체크박스 클릭 | `@checkboxGroupChanged` (bindEvents 위임 발행) |

> 단, 본 변형은 register.js가 자체 native delegator로 cascade 처리(부모 → 자식 일괄 / 자식 → 부모 재계산) + `_childrenStates` 갱신 + DOM dataset 갱신 사이드이펙트를 함께 수행하고, `Weventbus.emit('@checkboxGroupChanged', { targetInstance, parentId, parentState, childrenIds })`을 직접 호출하여 명시 페이로드를 추가 발행한다. 페이지는 명시 payload(`parentId`, `parentState`, `childrenIds`)를 받는다.

> **이벤트 발행 분리 이유**: bindEvents의 위임 발행은 `{ targetInstance, event }`만 전달하므로 `parentState` 종합과 `childrenIds` 배열이 없다. indeterminate는 페이지가 매번 DOM을 다시 스캔하지 않고도 종합 상태와 모든 자식 상태를 바로 받아야 하므로(예: 다중 권한 일괄 적용, 다중 채널 일괄 토글) 자체 native delegator에서 명시 payload를 emit한다.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderGroup({ response })` | `checkboxGroup` 핸들러. ① `this._parentId = parent.id`, `this._parentLabel = parent.label` 설정 + 부모 라벨 텍스트 렌더(`parentLabel` 셀렉터). ② `_renderChildren(children)` 호출 → ListRender selectorKEY(`checkid`/`label`)에 매핑하여 `listRender.renderData` 호출 + `_childrenStates: Map`을 페이로드 `selected` 기반으로 재구성(새 batch는 새 진실). ③ 모든 자식 dataset.checked 일괄 적용. ④ `_recomputeParentState()` 호출하여 부모 tri-state 결정. |
| `_renderChildren(children)` | items 배열을 ListRender selectorKEY(`checkid`/`label`)에 매핑(`{id → checkid}`)하여 `listRender.renderData` 호출. `_childrenStates` 새 Map으로 재구성 + 모든 자식 dataset에 `data-checked` 일괄 적용. |
| `_recomputeParentState()` | `_childrenStates`의 값들을 종합. ① 자식이 0개 → parentState = 현재 부모 dataset.state 유지(또는 'unchecked'). ② 모두 true → 'checked'. ③ 모두 false → 'unchecked'. ④ 일부 true → 'indeterminate'. 부모 root에 `data-state` 부착 + native input의 `.indeterminate` DOM property 동기화 + native input의 `.checked` 동기화 + 그룹 컨테이너 dataset.state 갱신. 결정된 parentState 반환. |
| `_handleParentClick(e)` | 컨테이너 native click delegator의 부모 분기. `e.target.closest(parent)`로 부모 root 잡힘 → 현재 parentState 종합 → `nextChecked = (state === 'checked' ? false : true)` (indeterminate / unchecked → 모두 true, checked → 모두 false) → `_childrenStates`의 모든 자식을 `nextChecked`로 set + 모든 자식 dataset.checked 일괄 적용 → `_recomputeParentState()` → `_emitChange()`. |
| `_handleChildClick(e)` | 컨테이너 native click delegator의 자식 분기. `e.target.closest(childItem)`로 자식 root 잡힘 → `dataset.checkid` 추출 → `_childrenStates.set(id, !current)` → 해당 자식 dataset.checked 토글 → `_recomputeParentState()` → `_emitChange()`. |
| `_emitChange()` | `@checkboxGroupChanged` 발행. payload: `{ targetInstance: this, parentId: this._parentId, parentState: <_recomputeParentState 결과>, childrenIds: [{id, selected}] (Map.entries 평탄화) }`. |

### 페이지 연결 사례

```
[페이지 — 다중 권한 그룹 / 알림 채널 그룹 / 파일 폴더 / 설정 카테고리]
    │
    └─ fetchAndPublish('checkboxGroup', this) 또는 직접 publish
        payload 예: {
          parent: { id: 'perm-all', label: '모든 권한' },
          children: [
            { id: 'perm-read',   label: '읽기',   selected: true  },
            { id: 'perm-write',  label: '쓰기',   selected: false },
            { id: 'perm-delete', label: '삭제',   selected: true  }
          ]
        }

[Checkbox/Advanced/indeterminate]
    ├─ _renderGroup이 _parentId='perm-all', _parentLabel='모든 권한' 설정 + 부모 라벨 렌더
    ├─ _renderChildren이 ListRender로 자식 3개 렌더
    ├─ _childrenStates = Map { 'perm-read'→true, 'perm-write'→false, 'perm-delete'→true }
    ├─ 자식 dataset.checked 일괄 적용
    └─ _recomputeParentState: 일부 true → 'indeterminate' → 부모 input.indeterminate=true + data-state="indeterminate"
       → 부모 dash bar 표시

[사용자가 부모 체크박스 클릭]
    ├─ _handleParentClick → 현재 'indeterminate' → nextChecked=true → 모든 자식 true로 set
    ├─ _childrenStates = Map { 'perm-read'→true, 'perm-write'→true, 'perm-delete'→true }
    ├─ 자식 dataset.checked='true' 일괄 적용
    ├─ _recomputeParentState: 모두 true → 'checked' → input.checked=true, indeterminate=false
    └─ @checkboxGroupChanged: { parentId: 'perm-all', parentState: 'checked',
                                 childrenIds: [{id:'perm-read',selected:true},
                                               {id:'perm-write',selected:true},
                                               {id:'perm-delete',selected:true}] }

[사용자가 'perm-write' 자식 체크박스 클릭(현재 true)]
    ├─ _handleChildClick → toggle false → _childrenStates.set('perm-write', false)
    ├─ 자식 dataset.checked='false' 적용
    ├─ _recomputeParentState: 일부 true → 'indeterminate' → 부모 dash bar
    └─ @checkboxGroupChanged: { parentId: 'perm-all', parentState: 'indeterminate',
                                 childrenIds: [{id:'perm-read',selected:true},
                                               {id:'perm-write',selected:false},
                                               {id:'perm-delete',selected:true}] }

운영: this.pageDataMappings = [
        { topic: 'checkboxGroup', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@checkboxGroupChanged': ({ parentId, parentState, childrenIds }) => {
          // childrenIds 기준 다중 권한 그룹 일괄 적용 / 알림 채널 동기화 등
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | 부모/자식 시각 차별화 (cascade tri-state) | 도메인 컨텍스트 예 |
|------|---------|------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 부모: 퍼플 fill + 체크/dash. 자식: 들여쓰기(`padding-left: 32px`) + 동일 퍼플 fill. indeterminate 시 부모만 가로 dash bar(2px stroke 두꺼움). 비선택은 transparent border. | 다중 권한 그룹(All Permissions / Read·Write·Delete) — 부모 indeterminate가 부분 권한 상태 시각화 |
| `02_material`    | B: Material Elevated | 부모: secondary container check `#1A73E8` fill + dash. 자식: 들여쓰기 + 동일 fill. indeterminate 시 부모는 dash mark + slight outline tone. 비선택은 흰 배경 + 회색 outline. | 다중 알림 채널(All Notifications / SMS·Push·Email) — 부분 활성 시 부모 dash 표시 |
| `03_editorial`   | C: Minimal Editorial | 부모: outline 1.5px(thicker) + serif 라벨 + 다크 fill. 자식: 들여쓰기 + 미세 outline. indeterminate 시 부모는 dash(serif 느낌의 1px stroke). 비선택은 1px outline + transparent. | 추천 기사 카테고리(Featured / Latest·Popular·Editorial) — 부분 선택 시 dash |
| `04_operational` | D: Dark Operational  | 부모: 시안 box(`#00BCD4`) fill + dash. 자식: 들여쓰기 + 동일 시안 fill + 모노 라벨. indeterminate 시 부모는 시안 dash bar(MONO 2px stroke). 그룹 컨테이너에 `data-state` 기반 컨텍스트(예: 운영 INDETERMINATE 라벨 우상단 작은 인디케이터). | 다중 센서 그룹(All Sensors / Temp·Pressure·Humidity) — 부분 활성 모니터링 채널 표시 |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-state="checked|unchecked|indeterminate"]`(부모) + `[data-checked="true|false"]`(자식) 셀렉터로 시각을 분기. 토글 시 transition 150~250ms로 부드럽게 시각 전환.

### 결정사항

- **tri-state 시각**: 부모는 `data-state="indeterminate"`에서 가로 dash bar(2px stroke)를 단독 표시 (체크 V는 hidden). 자식은 단순 `data-checked="true"` 시 V만 표시(자식은 indeterminate 없음).
- **a11y 채널**: 부모는 `<input type="checkbox">.indeterminate = true` DOM property 직접 설정(스크린리더 "mixed" 발화). 시각 채널은 `data-state` 별도 — 두 채널 직교.
- **페이로드 새 batch는 새 진실**: 새 `checkboxGroup` 페이로드 도착 시 `_childrenStates` Map은 페이로드 `selected` 기반으로 통째 재구성(이전 cascade 결과 누적 X).
- **자식이 0개**: 부모는 단순 binary 체크박스로 동작(unchecked / checked, indeterminate 진입 불가). 부모 클릭 → checked / unchecked 토글만.
