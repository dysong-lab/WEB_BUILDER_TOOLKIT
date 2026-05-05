# Toolbars — Advanced / groupedActions

## 기능 정의

1. **그룹별 액션 항목 렌더링** — `toolbarItems` 토픽으로 수신한 배열 `[{itemid, group, icon, label, kind:'action'}]` 을 ListRender 가 직접 표시 영역(`.toolbar-ga__list`)에 N 개 렌더한다. ListRender selectorKEY 5종(`itemid`/`disabled`/`icon`/`label`/`group` + `container`/`template`)은 Standard(`actionid`/`disabled`/`icon`/`label`)과 호환 + 큐 설명 표기인 `itemid`/`group`(임의 문자열) 추가. ListRender 자체는 group 구분을 인지하지 않는다 — 자체 메서드(`_handleSetToolbarItems`)가 group 정렬 + divider 항목 삽입 후 ListRender 에 평탄화된 데이터를 넘긴다.
2. **그룹 자동 정렬 + divider 자동 삽입** — `_handleSetToolbarItems` 가 들어온 items 를 group 단위로 정렬한다. 페이지가 `groupOrder` 토픽으로 명시적 순서를 지정하면 그 순서대로, 아니면 자연 등장 순서(group 첫 등장 인덱스)를 유지. 같은 group 끼리 인접하지 않은 입력도 자동으로 인접하게 재배치. 그룹 변경 지점마다 자동으로 `{itemid:'__divider__<gA>__<gB>', kind:'divider', group:<gA>}` 가상 항목을 삽입하여 ListRender 가 동일 template 으로 divider 시각 항목을 그린다(같은 cssSelectors `.toolbar-ga__action[data-kind="divider"]` selector — 같은 노드 자식만 시각 swap). 결과 list 는 `[g1-i1, g1-i2, divider, g2-i1, g2-i2, divider, g3-i1]` 형태로 평탄.
3. **그룹 라벨 옵션 — `setGroupLabels`** — 페이지가 `setGroupLabels` 토픽으로 `{groupid: label}` 매핑을 publish 하면 자체 핸들러 `_handleSetGroupLabels` 가 `_groupLabels` 에 저장 후 다시 렌더. divider 항목의 가상 데이터에 `label: <next-group-label>` 을 함께 채워 ListRender 가 divider 위/옆에 그룹명을 표시 (CSS `[data-kind="divider"] .toolbar-ga__label` 가시화). label 미지정 group 은 divider 만 표시. group 의 첫 등장 시점(첫 그룹은 head divider 없이 `<aria-label>` 만)에 group label 을 그린다.
4. **그룹 순서 변경 옵션 — `setGroupOrder`** — `setGroupOrder` 토픽으로 `{groups: ['file', 'edit', 'format']}` 배열을 받으면 `_groupOrder` 저장 후 다시 정렬 + 렌더. 미지정 group 은 자연 등장 순서로 배열 끝에 부착.
5. **액션 클릭 이벤트 — group 함께 발행** — visible 액션 클릭 시 ListRender 의 `itemid` selector(`.toolbar-ga__action`)에 매핑된 bindEvents 위임 + 자체 emit 추가. 페이지는 `@toolbarItemClicked { itemid, group }` 로 어떤 그룹의 어떤 액션이 클릭되었는지 한 번에 받는다. divider 항목 클릭은 무시(`data-kind="divider"` 가드).
6. **그룹 분포 변경 — `@groupChanged`** — `_handleSetToolbarItems` / `_handleSetGroupOrder` 후속에서 그룹 분포가 변경되면 1회 `{ groups: [{groupid, itemIds, label?}] }` 발행. 페이지가 어떤 그룹에 어떤 액션들이 분포되었는지 추적 (분석/메뉴 미러링/단축키 매핑 등).
7. **명시 데이터 갱신 — `setToolbarItems`** — `toolbarItems` 별칭. 페이지가 외부에서 액션 목록을 명시적으로 갱신할 때 같은 핸들러(`_handleSetToolbarItems`)로 라우팅.

> **Standard 와의 분리 정당성**:
> - **새 자체 상태 5종** — `_allItems: Array`, `_groupLabels: Map<groupid, label>`, `_groupOrder: Array<groupid>`, `_lastGroupSnapshot: Array<{groupid,itemIds}>`, `_gaSelectors: object`. Standard 는 stateless.
> - **자체 메서드 5종** — `_handleSetToolbarItems` / `_handleSetGroupLabels` / `_handleSetGroupOrder` / `_buildFlattened` / `_handleActionClick`. Standard 는 자체 메서드 0종.
> - **HTML 구조 변경 — divider 항목 동일 template + group label slot 추가** — Standard 는 `.toolbar > .toolbar__list > .toolbar__action[]` 만. groupedActions 는 `.toolbar-ga > .toolbar-ga__list > [.toolbar-ga__action(action) | .toolbar-ga__action[data-kind="divider"](divider+group label slot)]` 구조. divider 는 별 element 가 아닌 같은 template 의 동일 노드를 `data-kind="divider"` 로 시각 swap. group label 은 divider 의 `.toolbar-ga__label` 가시 영역으로 재사용. prefix `.toolbar-ga__*` 로 Standard(`.toolbar__*`) 와 분리.
> - **새 토픽 3종** — `toolbarItems` (큐 설명 명시 — `[{itemid,group,...}]` 데이터 모델), `setGroupLabels` (`{groupid: label}`), `setGroupOrder` (`{groups: [groupid]}`). Standard 토픽(`toolbarActions`) 과 호환되지 않음 — group 필드가 필수이고 데이터 모델이 다르다.
> - **새 이벤트 2종** — `@toolbarItemClicked { itemid, group }` (Standard 의 `@toolbarActionClicked { actionid }` 와 ID 키와 group 추가 페이로드 다름), `@groupChanged { groups }` (분포 추적). Standard 는 단일 이벤트.
> - **자체 group 정렬 + divider 가상 삽입 패스** — Standard 는 받은 배열 그대로 ListRender. groupedActions 는 group 정렬 + divider 가상 항목 삽입 후 ListRender. 데이터 모델 변환이 필수 — 동일 register.js 로 Standard 표현 불가.
>
> 위 5축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가.

> **Toolbars/Advanced/overflowMenu 답습**: register.js top-level 평탄, 자체 상태/메서드/이벤트/토픽 분리, preview `<script src>` 5단계 깊이 verbatim 복사, demo-label/hint 도메인 컨텍스트 명시. ListRender container 만 ListRender 가 알고, 자체 보조 selector 는 `_gaSelectors` 로 분리(overflowMenu `_omSelectors` 동일 패턴). 자체 메서드(`_handleSetToolbarItems`)가 ListRender renderData 호출 + 자체 토픽 alias(`setToolbarItems`) 동시 구독 패턴 동일 차용. divider 가상 항목을 ListRender 와 같은 template 으로 그리되 `data-kind="divider"` 로 시각 swap — overflowMenu 의 popup 안 항목 swap 패턴과 유사하지만, groupedActions 는 별 cloneNode 패스가 아닌 ListRender 의 단일 패스에 평탄화된 입력으로 처리.

> **Menus/Standard/contextMenu 답습**: ListRender 로 메뉴 항목 렌더(template + cssSelectors), `divider`/`disabled` data 속성 패턴.

> **MD3 / 도메인 근거**: MD3 Toolbars spec 자체에는 group 구분이 직접 명시되지 않으나, 실제 모든 데스크톱 toolbar 는 행위 카테고리별로 group 을 갖는다 — Word/Notion 의 file/edit/format 그룹, VSCode 의 navigation/edit/run 그룹, Photoshop 의 file/select/transform 그룹, IBM Carbon `Toolbar` group, Microsoft Fluent UI `CommandBar` `farItems`, Polaris `ActionMenu` `groupedActions`, Antd `Menu` ItemGroup 등. group divider 는 시각적/의미적 구분의 보편적 관행. 실사용: ① **텍스트 편집기 toolbar — file/edit/format 그룹** (Save/Open/Export | Undo/Redo/Cut/Copy/Paste | Bold/Italic/Underline — 그룹 사이 divider), ② **데이터 그리드 — query/edit/export 그룹** (Filter/Sort/Group | Add/Edit/Delete | Export/Print/Share), ③ **이미지 편집기 — file/select/transform 그룹** (Open/Save | Marquee/Lasso | Rotate/Flip/Resize), ④ **3D 뷰어 — view/measure/annotate 그룹** (Zoom/Pan/Reset | Distance/Angle | Pin/Note).

---

## 구현 명세

### Mixin

ListRenderMixin (`itemKey` 옵션으로 `disabled` 상태 변경 가능 — 평탄화된 list 전체) + 자체 메서드 5종(`_handleSetToolbarItems` / `_handleSetGroupLabels` / `_handleSetGroupOrder` / `_buildFlattened` / `_handleActionClick`).

> **신규 Mixin 생성 금지** — 큐 설명에 "group 필드 + group divider 렌더" 명시. SKILL 규칙상 본 루프에서 새 Mixin 을 만들지 않는다. ListRenderMixin 은 평탄화된 단일 배열만 받는다 — group 인지 X. group 정렬 · divider 가상 항목 삽입 · group label 매핑 · group order 적용 · group-aware 클릭 이벤트 발행은 컴포넌트 자체 메서드가 전담.

### cssSelectors (ListRenderMixin — 평탄화된 단일 영역)

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.toolbar-ga__list` | 항목이 추가될 부모 (ListRenderMixin 규약). |
| template | `#toolbar-ga-action-template` | `<template>` cloneNode 대상 (action / divider 양쪽 동일 노드). |
| itemid | `.toolbar-ga__action` | 항목 식별 + 이벤트 매핑 (action 클릭 위임 — divider 는 `data-kind="divider"` 가드). |
| disabled | `.toolbar-ga__action` | 비활성 상태 (data-disabled). |
| group | `.toolbar-ga__action` | 항목이 속한 그룹 (data-group — CSS 그룹 hover/highlight 또는 페이지 분석 활용). |
| kind | `.toolbar-ga__action` | 항목 종류 (data-kind: action|divider). |
| icon | `.toolbar-ga__icon` | 아이콘 표시 (Material Symbols 등 — divider 는 `display:none`). |
| label | `.toolbar-ga__label` | 라벨 텍스트 + divider 의 group label 슬롯 재사용. |

> **groupedActions 전용 selector(자체 메서드 전담)**: `.toolbar-ga`(루트 — `data-empty` 토글 대상) 는 cssSelectors KEY 로 등록하지 않는다 — ListRender 가 직접 데이터 바인딩하지 않으며 자체 메서드(`_handleSetToolbarItems`)가 전담.

### itemKey (ListRender)

`itemid` — `updateItemState(itemid, { disabled })` 활용 가능.

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| itemid | `itemid` | 항목 식별 — `closest('.toolbar-ga__action')?.dataset.itemid`. |
| disabled | `disabled` | 비활성 상태 — `[data-disabled="true"]` CSS. |
| group | `group` | 그룹 식별 — `[data-group="<groupid>"]` CSS / 분석 도구. |
| kind | `kind` | 종류 — `[data-kind="divider"]` CSS (divider 시각 swap). |

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_allItems` | `Array` | 마지막으로 받은 toolbarItems 원본(group 정렬 / divider 재생성에 사용). |
| `_groupLabels` | `Object` | groupid → label 매핑(`setGroupLabels` 결과). |
| `_groupOrder` | `Array<string>` | 페이지가 명시한 group 순서(`setGroupOrder` 결과). 미지정 group 은 자연 순서로 끝에 붙임. |
| `_lastGroupSnapshot` | `Array<{groupid,itemIds,label?}> \| null` | 마지막 group 분포 — `@groupChanged` 변경 감지용. |
| `_gaSelectors` | `object` | groupedActions 전용 보조 selector(root). cssSelectors 미등록. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `toolbarItems` | `this._handleSetToolbarItems` | `[{ itemid, group, icon, label, kind:'action', disabled? }]` 또는 `{items:[...]}` — 새 batch 전체 replace. |
| `setToolbarItems` | `this._handleSetToolbarItems` | 동일 페이로드 — 명시 갱신 채널 alias. |
| `setGroupLabels` | `this._handleSetGroupLabels` | `{groupid: label}` 또는 `{labels: {...}}` — group label 매핑 갱신. |
| `setGroupOrder` | `this._handleSetGroupOrder` | `{groups: ['file','edit','format']}` 또는 `['file','edit','format']` — group 순서 갱신. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `itemid` (ListRender — `.toolbar-ga__action`) | action 클릭 | `@toolbarItemClicked` (위임 — `{ targetInstance, event }`) — divider/disabled 는 핸들러에서 가드 |

> **이벤트 통합 처리** — visible action 클릭은 bindEvents 위임으로 1차 발행 후, register.js 가 root 에 native click handler 를 추가하여 `event.target.closest('.toolbar-ga__action')` 으로 itemid + group 을 추출하고 `@toolbarItemClicked { itemid, group, fromKeyboard:false }` 를 자체 emit 으로 추가 발행한다 — 페이지가 group 정보를 별도 DOM 스캔 없이 바로 받게 한다.

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@toolbarItemClicked` | action 클릭 시 (자체 native click delegator — divider/disabled 는 emit X) | `{ targetInstance, itemid, group }` |
| `@groupChanged` | `_handleSetToolbarItems` / `_handleSetGroupOrder` / `_handleSetGroupLabels` 후 group 분포가 직전과 다를 때 1회 | `{ targetInstance, groups: [{groupid, itemIds, label?}] }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_handleSetToolbarItems({ response })` | `({response}) => void` | `toolbarItems` / `setToolbarItems` 토픽 핸들러. `response = [{itemid,group,...}]` 또는 `{items:[...]}` 둘 다 수용. `_allItems` 저장 → `_buildFlattened()` 로 정렬 + divider 가상 삽입 → ListRender renderData → `@groupChanged` 분포 비교/발행. |
| `_handleSetGroupLabels({ response })` | `({response}) => void` | `setGroupLabels` 토픽 핸들러. `response = {groupid:label}` 또는 `{labels: {...}}`. `_groupLabels` 갱신 → `_buildFlattened()` 재계산 → renderData → `@groupChanged` 비교/발행. |
| `_handleSetGroupOrder({ response })` | `({response}) => void` | `setGroupOrder` 토픽 핸들러. `response = {groups: [...]}` 또는 `[...]`. `_groupOrder` 갱신 → `_buildFlattened()` 재계산 → renderData → `@groupChanged` 비교/발행. |
| `_buildFlattened()` | `() => { flat: Array, snapshot: Array }` | `_allItems` 를 group 단위로 정렬(`_groupOrder` 우선 → 자연 등장 순) → 그룹 변경 지점마다 `{itemid:'__divider__<idx>', kind:'divider', group:<groupid>, label:_groupLabels[groupid]}` 가상 항목 삽입 → `flat`(ListRender 입력) + `snapshot`(group 분포 — `@groupChanged` 입력) 반환. label 매핑은 group 의 첫 항목 직전 divider 에만 부착(첫 group 은 divider 없으므로 label 미부착 — group 첫 액션의 `aria-label` 또는 페이지가 별도 표시). 단순화를 위해 본 변형은 group label 을 divider 시각 영역에만 부착(첫 group 은 시각 라벨 없음 — 페이지가 토글). |
| `_handleActionClick(e)` | `(MouseEvent) => void` | root container 클릭 위임 — `closest('.toolbar-ga__action')` 으로 항목 탐색 → `data-kind="divider"` 또는 `data-disabled="true"` 가드 → `@toolbarItemClicked { itemid, group }` 자체 emit. |

### 페이지 연결 사례

```
[페이지 — 텍스트 편집기 / 데이터 그리드 / 이미지 편집기 / 3D 뷰어]
    │
    ├─ fetchAndPublish('toolbarItems', this) 또는 직접 publish
    │   payload 예: [
    │     { itemid: 'save',     group: 'file',   icon: 'save',          label: 'Save',       kind: 'action' },
    │     { itemid: 'open',     group: 'file',   icon: 'folder_open',   label: 'Open',       kind: 'action' },
    │     { itemid: 'export',   group: 'file',   icon: 'ios_share',     label: 'Export',     kind: 'action' },
    │     { itemid: 'undo',     group: 'edit',   icon: 'undo',          label: 'Undo',       kind: 'action' },
    │     { itemid: 'redo',     group: 'edit',   icon: 'redo',          label: 'Redo',       kind: 'action' },
    │     { itemid: 'cut',      group: 'edit',   icon: 'content_cut',   label: 'Cut',        kind: 'action' },
    │     { itemid: 'bold',     group: 'format', icon: 'format_bold',   label: 'Bold',       kind: 'action' },
    │     { itemid: 'italic',   group: 'format', icon: 'format_italic', label: 'Italic',     kind: 'action' },
    │     { itemid: 'link',     group: 'format', icon: 'link',          label: 'Link',       kind: 'action' }
    │   ]
    │
    ├─ (선택) publish('setGroupLabels', { response: { file: 'File', edit: 'Edit', format: 'Format' } })
    │   → divider 위에 group 명 표시 (첫 그룹 file 은 divider 없음)
    │
    └─ (선택) publish('setGroupOrder', { response: { groups: ['format', 'edit', 'file'] } })
        → group 순서 [format, edit, file] 으로 재배치

[Toolbars/Advanced/groupedActions]
    ├─ _handleSetToolbarItems → _buildFlattened
    │   group 정렬: _groupOrder 우선 → 자연 등장 순서
    │   divider 가상 삽입: [save,open,export, divider(edit), undo,redo,cut, divider(format), bold,italic,link]
    ├─ ListRender renderData (평탄화된 list)
    └─ @groupChanged { groups: [
            {groupid:'file',   itemIds:['save','open','export']},
            {groupid:'edit',   itemIds:['undo','redo','cut'],     label:'Edit'},
            {groupid:'format', itemIds:['bold','italic','link'],  label:'Format'}
          ] }

[사용자가 'bold' 클릭]
    ├─ bindEvents 위임 → @toolbarItemClicked { event, targetInstance } (페이지가 closest 로 group 추론)
    └─ root native delegator → @toolbarItemClicked { itemid:'bold', group:'format' } 자체 emit

운영: this.pageDataMappings = [
        { topic: 'toolbarItems',    datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setGroupLabels',  datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setGroupOrder',   datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@toolbarItemClicked':  ({ event, targetInstance, itemid, group }) => {
                                  // 자체 emit 이면 itemid/group 둘 다 있음, bindEvents 위임이면 event 만 있음
                                  const id = (itemid != null) ? itemid
                                           : event.target.closest('.toolbar-ga__action')?.dataset.itemid;
                                  const gp = (group != null) ? group
                                           : event.target.closest('.toolbar-ga__action')?.dataset.group;
                                  if (id) executeAction(id, { group: gp });
                                },
        '@groupChanged':        ({ groups }) => { /* 분석/메뉴 미러링/단축키 매핑 */ }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | divider 시각 차별화 (라인 두께 · 여백 · group label 표기) | 도메인 컨텍스트 예 |
|------|---------|------------------------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 그라디언트 / Pretendard / 8px 모서리. divider 는 시안 1px 라인(`#2A2574`) + 좌우 12px 여백. group label 은 divider 위 11px 시안 small caps. | **텍스트 편집기 toolbar — file/edit/format 그룹** (Save/Open/Export | Undo/Redo/Cut/Copy/Paste | Bold/Italic/Link) |
| `02_material`    | B: Material Elevated | 라이트 / box-shadow elevation / Roboto / 4px 모서리. divider 는 라이트 그레이 1px(`#C2C7CF`) + 좌우 8px 여백. group label 은 divider 위 12px Roboto medium 그레이. | **데이터 그리드 액션 바 — query/edit/export 그룹** (Filter/Sort/Group | Add/Edit/Delete | Export/Print/Share) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif Display 라벨 / 0px 모서리. divider 는 웜 그레이 1px 얇은 라인 + 넓은 24px 여백. group label 은 divider 옆(좌측) 12px DM Serif italic 웜 그레이. | **이미지 편집기 — file/select/transform 그룹** (Open/Save | Marquee/Lasso | Rotate/Flip/Resize) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 시안 / IBM Plex Mono / 2px 모서리. divider 는 시안 1px 점선(`dashed`) + 좌우 4px 여백. group label 은 divider 위 9px Mono uppercase 시안. | **3D 뷰어 — view/measure/annotate 그룹** (Zoom/Pan/Reset | Distance/Angle | Pin/Note) |

각 페르소나는 `.toolbar-ga__action[data-kind="divider"]` selector 로 divider 시각 swap (icon/label 노드는 같지만 `display:none` + 라인 두께/색상 적용). group label 은 divider 항목의 `.toolbar-ga__label` 가시 영역으로 swap (`[data-kind="divider"] .toolbar-ga__label { display: inline; ... }`).

### 결정사항

- **prefix `.toolbar-ga__*`** — Standard `.toolbar__*` / overflowMenu `.toolbar-om__*` 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **3 토픽 동시 구독(`toolbarItems` + `setToolbarItems` + `setGroupLabels` + `setGroupOrder`)** — 큐 설명대로 `toolbarItems` 권장이지만, 3개 명시 채널도 동시 구독.
- **divider 가상 항목 = 같은 template 의 동일 노드** — 별 element 또는 별 template 을 추가하지 않는다. ListRender 는 `[{itemid, kind, ...}]` 평탄 배열만 알며, 시각 분기는 CSS `[data-kind="divider"]` 로 처리.
- **divider 의 itemid 는 `'__divider__<idx>'` 가상값** — `_buildFlattened` 가 매 렌더 순차 인덱스로 생성. itemKey 충돌 방지 + 클릭 가드(`data-kind="divider"` 가드가 1순위).
- **group 정렬 규칙** — `_groupOrder` 가 있으면 그 순서 우선. `_groupOrder` 미지정 group 은 `_allItems` 등장 순서대로 뒤에 붙임. group 안의 항목 순서는 `_allItems` 원본 순서 유지(stable sort).
- **divider 위치** — 첫 group 앞에는 divider 없음(맨 앞 divider 는 시각적 군더더기). 마지막 group 뒤에도 divider 없음(자연 끝 경계). group 사이 경계에만 divider 1개.
- **group label 부착 위치** — group 첫 액션 직전 divider 에만 부착. 첫 group 은 divider 가 없으므로 시각 라벨 없음(페이지가 외부 헤더로 보완 가능). 본 변형은 단순화 — group 첫 액션의 aria-label 부여는 본 변형 범위 외.
- **`@toolbarItemClicked` 이중 발행 — bindEvents 위임 + 자체 emit** — bindEvents 위임은 `{event, targetInstance}` 만 전달 → 페이지가 매번 DOM 스캔 필요. 추가 자체 emit `{ itemid, group }` 으로 페이지 핸들러 단순화. 페이지는 둘 다 같은 핸들러로 받아 `itemid` 유무로 분기.
- **신규 Mixin 생성 금지** — ListRenderMixin (평탄화된 단일 영역) + 자체 메서드 5종 + 자체 group 정렬/divider 가상 삽입 패스로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (root native click delegator remove → customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Toolbars/Advanced/groupedActions/preview/...html` → `../`를 5번 = overflowMenu 동일 verbatim 복사)
