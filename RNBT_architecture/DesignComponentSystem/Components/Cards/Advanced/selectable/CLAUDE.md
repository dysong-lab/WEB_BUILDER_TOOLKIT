# Cards — Advanced / selectable

## 기능 정의

1. **카드 그룹 동적 렌더** — `cardsList` 토픽으로 수신한 배열(`[{id, title, summary, icon?, selected?}]`)을 ListRenderMixin이 `<template>` cloneNode로 N개의 카드로 렌더한다. 항목별 `data-action-id`로 식별. 카드 본문 옆 좌측에 체크박스 마커가 template에 고정되어 있어 선택/비선택을 시각화한다.
2. **다중 선택(체크박스 의미론)** — 그룹 내 카드 0~N개가 동시에 selected 가능. 카드 본문/체크박스 어느 쪽을 클릭해도 해당 카드만 토글되고 나머지는 영향 없음(누적). 초기 상태는 페이로드의 `selected:true` 항목 전체를 selected로 설정. `_selectedIds: Set<string>` 자체 상태로 추적하며 DOM에는 `data-selected="true|false"` + `aria-selected="true|false"` 두 채널로 반영(CSS 시각 차별화는 두 채널 모두 사용 가능, a11y는 aria-selected 기준 — MD3 카드 선택 패턴).
3. **다중 선택 변경 이벤트** — 선택 집합이 변경될 때 `@cardSelected` 발행. payload: `{ targetInstance, selectedIds, changedId, changedTo }`. 페이지가 새 선택 배열(`selectedIds`)과 함께 어떤 카드가 어떻게 바뀌었는지(`changedId`, `changedTo: 'on' | 'off' | 'bulk'`)까지 동시에 수신하여 분기 처리(예: 단일 변경 카드만 효율적 재계산, bulk 일괄 갱신).
4. **외부 publish로 선택 강제 변경(선택)** — `setSelectedCards` 토픽 publish 시 페이로드 `{ ids: [...] }`로 외부에서 selected 카드 집합을 통째로 강제 지정. 사용자 클릭 외 경로(키보드 단축키, 다른 컴포넌트 동기화, 라우트 변경, "전체 해제" 액션, "전체 선택" 액션 등)로 선택을 갱신하는 통로. 빈 배열도 허용(전체 해제).
5. **ARIA group 의미론** — 컨테이너에 `role="group"`, 각 카드에 `aria-selected="true|false"` 부여. 스크린리더가 다중 선택 카드 그룹임을 인지(라디오 그룹이 아니다 — 단일 선택 강제가 없음). 시각 채널은 `data-selected`, a11y 채널은 `aria-selected`로 직교.

> **Standard와의 분리 정당성**:
> - **새 토픽** — Standard는 `cardInfo`(단일 카드 1개) + `cardActions`(액션 배열). selectable은 `cardsList`(카드 배열 N개) + 보조 토픽 `setSelectedCards`(외부 강제). N:N 패턴이므로 ListRender 단일 사용(Standard는 FieldRender + ListRender 조합).
> - **자체 상태 (`_selectedIds: Set`)** — Standard는 stateless. selectable은 다중 선택 정책(누적)을 컴포넌트로 흡수.
> - **자체 메서드 5종** — `_renderItems`, `_handleSelect`, `_setSelected`, `_applySelection`, `_setSelectedFromTopic`. Standard는 자체 메서드 0종.
> - **새 이벤트** — `@cardSelected`(selectedIds + changedId + changedTo 명시 payload). Standard는 `@cardClicked` + `@cardActionClicked`만.
> - **template 변경** — Standard는 단일 카드(card 루트는 컨테이너 바깥). selectable은 카드 자체가 template 안에 있고 `.card-selectable__check` 체크 마커 + 카드 그룹 컨테이너(`.card-selectable__list`).
> - **자체 native click delegator** — `_selectedIds` 토글 + DOM dataset 갱신 + 명시 emit을 한 cycle에 묶음. Standard는 사용 안 함.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **sortable과의 분리 정당성 (직교성)**:
> - **단위 차이** — sortable은 **순서**(상대 위치) 재배치(`_currentOrder: string[]`, 드래그 → reorder, `@cardReordered`). selectable은 **선택**(상태 집합) 토글(`_selectedIds: Set<string>`, click → 토글, `@cardSelected`).
> - **상호작용 차이** — sortable은 dragstart/over/drop(HTML5 DnD), selectable은 click(체크박스 의미). Native event 자체가 다름.
> - **Mixin 조합 동일하지만 자체 상태/이벤트가 직교** — 둘 다 ListRenderMixin 단일 사용이지만, sortable의 `_currentOrder`(배열, 순서)와 selectable의 `_selectedIds`(집합, 상태)는 의미가 다르고 동시 보유 시 책임이 모호.
> - **dataset 채널 차이** — sortable은 `data-drag-state` + `data-drag-target`(드래그 시각), selectable은 `data-selected` + `aria-selected`(선택 시각/a11y). 시각 의미가 다름.
>
> 그러나 2D Advanced 변형은 단일 컴포넌트 단위로 register.js가 1개. 하나의 카드 그룹이 "순서 재배치"와 "다중 선택"을 동시에 강제하면 register.js가 이중 충돌(상태/이벤트/native event handler 중복) — 별 변형으로 분리. 두 책임이 동시에 필요한 경우는 별도 합성 변형(향후) 또는 페이지 레벨에서 두 컴포넌트를 결합.

> **expandable과의 분리 정당성 (직교성)**:
> - **단위 차이** — expandable은 **단일 카드**의 펼침/접힘(`_isExpanded: boolean`, `cardInfo` 단일 객체, `@cardExpanded`/`@cardCollapsed`). selectable은 **N개 카드 그룹**의 다중 선택(`_selectedIds: Set<string>`, `cardsList` 배열, `@cardSelected`).
> - **Mixin 차이** — expandable은 FieldRenderMixin(고정 DOM 1개에 매핑), selectable은 ListRenderMixin(template N개 cloneNode). 데이터 패턴 자체가 다름.
> - **이벤트 의미 차이** — expandable은 단일 카드 표시 상태(접힘/펼침), selectable은 카드 그룹 선택 집합(0~N 활성). 직교 책임.

> **SegmentedButtons/multiSelect와의 차이 (1줄 핵심)**: SegmentedButtons/multiSelect는 **세그먼트 버튼 항목**(작은 inline button, `@segmentMultiSelected`, label + icon)의 다중 선택, selectable은 **카드 그룹**(큰 카드 컨테이너, `@cardSelected`, title + summary + icon + 체크 마커)의 다중 선택. `_selectedIds: Set` + 자체 click delegator + ARIA 다중 의미론은 동일 차용하되 카드 항목은 더 큰 컨테이너(MD3 표준 카드 크기). 두 변형은 같은 다중 선택 의미론이지만 도메인 단위(button vs card)가 다르고 ARIA도 다름(`aria-pressed`(버튼) vs `aria-selected`(카드)).

> **MD3 / 도메인 근거**: MD3 Cards는 단일 주제의 콘텐츠와 액션을 담는 컨테이너이며, 카드 그룹이 노출될 때 **사용자가 N개를 동시에 선택해 일괄 작업(batch action)을 수행**하는 시나리오는 자연스럽다. 실사용 예: ① 파일/문서 카드 다중 선택 후 일괄 삭제/이동/공유 (Gmail/Drive 패턴), ② 태스크 카드 다중 선택 후 상태 일괄 변경(Trello/Asana), ③ 알림 카드 다중 선택 후 일괄 읽음 처리, ④ 장비 카드 다중 선택 후 일괄 명령 발행(IoT 운영), ⑤ 검색 결과 카드 다중 선택 후 비교/내보내기. WAI-ARIA `aria-selected`는 "selectable" 위젯의 표준 속성으로 카드/리스트박스/그리드 항목에 사용된다. 본 변형은 mouse pointer + 키보드 호환(향후 a11y 확장 변형은 별도)의 표준 다중 선택 구현.

---

## 구현 명세

### Mixin

ListRenderMixin (카드 항목 배열 렌더) + 자체 메서드(`_renderItems` / `_handleSelect` / `_setSelected` / `_applySelection` / `_setSelectedFromTopic`).

> Standard는 FieldRender(단일 카드 본문) + ListRender(액션 배열) 조합이지만, 본 변형은 ① 카드 자체가 배열 항목이므로 ListRenderMixin 단일 사용, ② `_selectedIds: Set` 자체 상태로 다중 선택 누적 강제, ③ 컨테이너 단일 native click delegator를 직접 부착(다중 선택 토글 + DOM `data-selected`/`aria-selected` 갱신 + 명시 emit을 한 cycle에 묶음), ④ 외부 강제 변경 토픽 `setSelectedCards`로 클릭 외 경로 흡수. Mixin 메서드 재정의는 하지 않는다(`_renderItems`는 `listRender.renderData` 호출 후 selected 결정/적용을 한 cycle에 묶는 wrapper). 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group     | `.card-selectable`                   | 그룹 컨테이너 — `role="group"`, `data-selected-count` dataset 부착 대상(시각 옵션) |
| container | `.card-selectable__list`             | 카드가 추가될 부모 (ListRenderMixin 규약) — click 위임 부착 대상 |
| template  | `#card-selectable-item-template`     | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| item      | `.card-selectable__item`             | 렌더된 각 카드 루트 — click 이벤트 매핑 + `data-selected`/`aria-selected` 부착 |
| actionId  | `.card-selectable__item`             | 카드 식별 (data-action-id) |
| icon      | `.card-selectable__icon`             | 카드 미디어 아이콘 (material symbol textContent, 선택) |
| title     | `.card-selectable__title`            | 카드 제목 텍스트 |
| summary   | `.card-selectable__summary`          | 카드 요약 본문 |

> **체크마크 처리**: `.card-selectable__check`는 template에 고정 존재하며 `data-selected="true"` 시 CSS로만 표시된다. cssSelectors KEY로 등록하지 않는다(데이터 바인딩 대상이 아니므로 — 시각 채널 전담).

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| actionId | `action-id` | 카드 click 시 `event.target.closest(item)?.dataset.actionId`로 actionId 추출. ListRender가 `data-action-id` 속성을 카드에 자동 설정. |

> **note**: selected는 `datasetAttrs`에 등록하지 않는다 — selected 정책을 자체 상태(`_selectedIds`)로 흡수하므로 ListRender의 데이터 바인딩 경로에서는 selected를 다루지 않는다. 초기 selected는 `_renderItems`가 페이로드 `selected:true` 항목들을 `_selectedIds`에 누적한 뒤 `_applySelection`이 일괄로 DOM에 적용한다.

### itemKey

`actionId` (ListRender) — 일관성을 위해 등록. 향후 `updateItemState`/`getItemState`로 개별 카드 강조 등이 필요할 때 활용.

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_selectedIds` | 현재 선택된 카드 id의 `Set<string>`. `_setSelected`가 add/delete로 갱신. `_renderItems`가 초기값 결정. |
| `_groupClickHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. (bindEvents가 `@cardSelected`를 위임 발행하지만, 다중 선택 토글 + DOM dataset 갱신 사이드이펙트는 자체 native click delegator가 담당하여 `_selectedIds` 상태 갱신과 `data-selected`/`aria-selected` 일괄 적용을 한 cycle에 묶는다.) |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `cardsList`        | `this._renderItems` (페이로드 `[{ id, title, summary, icon?, selected? }]`) — 내부에서 actionId로 키 변환 후 `this.listRender.renderData({ response })` 호출 + 초기 `_selectedIds` 결정 + `_applySelection` 호출 |
| `setSelectedCards` | `this._setSelectedFromTopic` (페이로드 `{ ids: [...] }`) — 외부에서 강제로 selected 집합 통째로 변경. 빈 배열도 허용(전체 해제). |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `item` (ListRender) | 카드 클릭 | `@cardSelected` (bindEvents가 위임 발행). 페이로드 `{ targetInstance, event }` — 페이지가 `event.target.closest('.card-selectable__item')?.dataset.actionId`로 변경 항목 추출 가능. 단, 본 변형은 register.js가 자체 native delegator로 `_selectedIds` 토글 + DOM `data-selected`/`aria-selected` 갱신 사이드이펙트를 함께 수행하고, `Weventbus.emit('@cardSelected', { targetInstance: this, selectedIds: [...this._selectedIds], changedId, changedTo })`을 직접 호출하여 명시 페이로드를 추가 발행한다. 페이지는 명시 payload(`selectedIds`, `changedId`, `changedTo`)를 받는다. |

> **이벤트 발행 분리 이유**: bindEvents의 위임 발행은 `{ targetInstance, event }`만 전달하므로 `selectedIds` 집합과 변경된 카드 정보가 없다. selectable은 페이지가 매번 DOM을 다시 스캔하지 않고도 현재 선택 집합과 단일 변경 카드를 바로 받을 수 있어야 하므로(예: 다중 선택 후 일괄 작업에서 단일 토글만 효율적으로 적용/해제) 자체 native delegator에서 명시 payload를 emit한다. customEvents의 위임 발행은 본 변형에서는 trigger 알림 의미 + Weventbus 채널 등록 보장 의미로 유지하되, 페이지가 사용하는 페이로드는 명시 emit이 우선한다.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderItems({ response })` | `cardsList` 핸들러. items 배열을 ListRender selectorKEY(`actionId`/`title`/`summary`/`icon`)에 맞게 매핑(`{id → actionId}`)한 후 `listRender.renderData` 호출. 그 다음 ① 페이로드의 `selected:true` 항목들을 `_selectedIds`에 누적, ② `_applySelection()` 호출하여 DOM에 반영. 새 batch가 들어올 때마다 `_selectedIds`는 새 페이로드 기준으로 재구성(이전 선택 누적 X — 새 batch는 새 진실). |
| `_handleSelect(e)` | 컨테이너 native click delegator. `e.target.closest(item)`로 클릭된 카드 찾음 → `dataset.actionId` 추출 → `_setSelected(id, 'toggle')` 호출(현재 상태 반대로). 카드의 어떤 자식을 클릭해도(체크 마커 / 본문 / 아이콘 모두) closest로 카드 루트가 잡혀 토글된다. |
| `_setSelected(id, action)` | `action: 'on' \| 'off' \| 'toggle'`. `'on'` → Set.add, `'off'` → Set.delete, `'toggle'` → 현재 상태 반대. 그룹 안에 실제 존재하는 id인지 확인 후 진행(없으면 silent return). 변경 없으면 silent return. 변경 시 `changedTo` 값을 결정한 후 `_applySelection()` 호출 → `Weventbus.emit('@cardSelected', { targetInstance: this, selectedIds: [...this._selectedIds], changedId: id, changedTo })`. |
| `_applySelection()` | 모든 카드 순회하며 `dataset.selected = (set.has(id) ? 'true' : 'false')`, `setAttribute('aria-selected', ...)` 동기화. 그룹 컨테이너의 `dataset.selectedCount`도 갱신(CSS 컨텍스트 셀렉터 옵션 — 04_operational의 ACTIVE 카운트 뱃지 등). |
| `_setSelectedFromTopic({ response })` | `setSelectedCards` 토픽 핸들러. `response = { ids: [...] }` 페이로드를 받아 `_selectedIds`를 페이로드 ids 집합으로 통째로 교체 → `_applySelection()` 호출 → 일괄 emit 한 번: `{ selectedIds, changedId: null, changedTo: 'bulk' }`. 외부에서 클릭 외 경로로 선택을 강제할 때 사용. 빈 배열은 전체 해제. |

### 페이지 연결 사례

```
[페이지 — 파일 카드 다중 선택 / 태스크 카드 일괄 변경 / 알림 카드 일괄 읽음]
    │
    └─ fetchAndPublish('cardsList', this) 또는 직접 publish
        payload 예: [
          { id: 'doc-001', icon: 'description', title: 'Q4 Report.pdf',  summary: '12.4MB · 2026-04-15', selected: false },
          { id: 'doc-002', icon: 'image',       title: 'Logo Final.png', summary: '2.1MB · 2026-04-12',  selected: true  },
          { id: 'doc-003', icon: 'description', title: 'Notes.md',       summary: '0.4MB · 2026-04-10',  selected: false },
          { id: 'doc-004', icon: 'movie',       title: 'Demo.mp4',       summary: '85MB · 2026-04-08',   selected: true  }
        ]

[Cards/Advanced/selectable]
    ├─ ListRender가 items 배열을 카드로 렌더 (이전 카드 전체 replace)
    ├─ _renderItems가 selected:true 항목들(['doc-002','doc-004'])을 _selectedIds: Set로 설정
    ├─ _applySelection이 모든 카드에 data-selected + aria-selected 부여 + 그룹에 selectedCount=2
    └─ CSS .card-selectable__item[data-selected="true"]가 선택 시각(outline + accent + 체크) 적용

[사용자가 'doc-001' 카드 클릭]
    ├─ 컨테이너 click delegator → _handleSelect → _setSelected('doc-001', 'toggle')
    ├─ Set.add('doc-001'), _selectedIds = {doc-002, doc-004, doc-001}
    ├─ _applySelection이 'doc-001'에 data-selected="true", aria-selected="true" 적용 + selectedCount=3
    └─ @cardSelected: { selectedIds: ['doc-002','doc-004','doc-001'], changedId: 'doc-001', changedTo: 'on' } 발행

[페이지 — 키보드 단축키(Cmd+A 전체 선택) / 액션바의 "전체 해제"]
    └─ instance.subscriptions.setSelectedCards.forEach(h => h.call(instance, { response: { ids: [] } }))
        → _setSelectedFromTopic이 _selectedIds = new Set() 설정
        → @cardSelected: { selectedIds: [], changedId: null, changedTo: 'bulk' } 발행

운영: this.pageDataMappings = [
        { topic: 'cardsList',        datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setSelectedCards', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@cardSelected': ({ selectedIds, changedId, changedTo }) => {
          // selectedIds 기준 액션바 상태 갱신 (선택 카드 수, 일괄 작업 활성화)
          // changedTo === 'bulk' 시 일괄 갱신, 'on'/'off' 시 단일 변경 효율 처리
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | selected 시각 차별화 (체크박스 누적) | 도메인 컨텍스트 예 |
|------|---------|------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | selected 카드: 퍼플 fill(linear-gradient) + 글로우(box-shadow) + 체크 아이콘 표시. 비선택은 transparent + dim border. | 파일/문서 카드 다중 선택(Q4 Report / Logo / Notes / Demo) — 일괄 다운로드/공유 |
| `02_material`    | B: Material Elevated | selected 카드: secondary container surface(`#C0CAFF`) + elevation level 3 + 체크 마커. 비선택은 surface + 회색 outline. | 태스크 카드 다중 선택(Inbox / Today / Upcoming) — 상태 일괄 변경 |
| `03_editorial`   | C: Minimal Editorial | selected 카드: outline 2px 두꺼운 진한 갈색(thicken) + serif 체크 마크 prefix + 미세 배경 톤. 비선택은 1px outline + transparent. | 추천 기사 카드 다중 선택(읽기 목록 추가) |
| `04_operational` | D: Dark Operational  | selected 카드: 시안 ring(`box-shadow: 0 0 0 2px #00E5FF`) + 시안 fill(`rgba(0,229,255,.16)`) + 시안 체크 마커. 그룹 컨테이너에 `data-selected-count` 기반 ACTIVE 카운트 뱃지 표시(운영 임계 동시 활성). | 장비 카드 다중 선택(센서 / 모터 / 펌프 / 밸브) — 일괄 명령 발행 |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-selected="true"]`(또는 `[aria-selected="true"]`) 셀렉터로 선택 시각을 분기. 선택 변경 시 transition 200~300ms로 부드럽게 시각 전환.
