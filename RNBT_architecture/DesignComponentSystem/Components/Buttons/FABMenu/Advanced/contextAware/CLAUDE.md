# FABMenu — Advanced / contextAware

## 기능 정의

1. **메뉴 토글 이벤트 (Standard 호환)** — FAB 트리거 클릭 시 `@fabMenuToggled` 발행. 페이지가 `.fab-menu`의 `.is-open` 클래스를 토글한다.
2. **컨텍스트 키 + 메뉴 항목 동시 교체** — `menuByContext` 토픽으로 수신한 페이로드(`{ contextKey, items }`)에서 `items` 배열을 ListRenderMixin이 `<template>` cloneNode로 항목 전체를 새로 렌더하고, **동시에** `.fab-menu` 루트의 `data-context-key="<contextKey>"` dataset을 갱신한다. 결과: 항목 수 / 라벨 / 아이콘 / 시각 스킨이 한 cycle에 함께 변한다.
3. **컨텍스트 인지 항목 클릭** — 각 메뉴 항목 클릭 시 `@fabMenuActionClicked` 발행. 페이로드 식별 경로: `event.target.closest('.fab-menu__item')?.dataset.actionId` + `event.target.closest('.fab-menu')?.dataset.contextKey` 두 값을 페이지가 동시에 읽어 어떤 컨텍스트의 어떤 액션이 클릭됐는지 판별 가능.

> **Standard와의 분리 정당성**: Standard는 ① 토픽 `fabMenuItems`(배열만), ② 이벤트 `@fabMenuItemClicked`(actionId만), ③ 컨텍스트 키 개념 자체 없음. contextAware는 ① 새 토픽 `menuByContext`(`{ contextKey, items }` 객체), ② 새 이벤트 `@fabMenuActionClicked`(actionId + contextKey 동시 식별), ③ `_currentContextKey` 자체 상태 + `data-context-key` dataset, ④ ListRender wrapper 메서드(`_renderByContext`)로 `renderData` 호출과 dataset 갱신을 한 사이클에 묶음 — 네 축 모두 Standard register.js와 직교. 같은 register.js로 표현 불가 → 별도 Advanced 변형으로 분리.

> **MD3 / 도메인 근거**: 컨텍스트 인지 액션 메뉴는 모바일/데스크탑 앱에서 화면 영역(상단 nav / 중앙 콘텐츠 / 하단 actions)·편집 모드(읽기/편집/공유)·문서 영역(text / image / table) 등 사용자가 처한 컨텍스트에 따라 다른 액션 셋을 동적으로 노출하는 표준 패턴이다. Notion(블록 타입별 메뉴), Figma(선택 객체별 menu), Google Docs(영역별 toolbar)에서 광범위하게 채택된다. 본 변형은 **외부 결정자(페이지 또는 viewport observer)가 contextKey를 정해 publish하면 메뉴 셋이 즉시 교체**되는 단방향 데이터 흐름을 채택한다(viewport 자동 감지는 옵션 — 페이지가 자체 결정하여 publish하는 방식이 1차 의미).

> **FAB/speedDial · ExtendedFABs/speedDial과의 차이**: 두 speedDial 변형은 메인 FAB 클릭 → 보조 액션 펼침이라는 단일 컨텍스트 토글이 핵심이다. contextAware는 **메뉴 셋 자체가 외부 컨텍스트에 따라 통째로 교체**되는 변형이며 토글/펼침 motion이 아니라 데이터 셰이프(`{ contextKey, items }`)와 `data-context-key` 시각 분기가 본질이다. 따라서 토글은 Standard와 동일하게 페이지가 `.is-open` 클래스로 처리하고, 본 변형은 컨텍스트 교체 동선만 담당한다.

---

## 구현 명세

### Mixin

ListRenderMixin (메뉴 항목 배열 렌더) + 자체 메서드(`_renderByContext`).

> Standard가 ListRenderMixin으로 항목을 처리하므로 동일 Mixin을 재사용한다(template 구조 호환). `_renderByContext`는 `renderData` 호출 + `data-context-key` dataset 갱신을 한 cycle에 묶는 wrapper다. ListRender 메서드를 재정의하지 않고 wrapper로 처리한다(Mixin 메서드 재정의 금지 규칙 준수).

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| menu      | `.fab-menu`                | 열림 상태(`.is-open`) 토글 + `data-context-key` dataset 부착 대상 |
| trigger   | `.fab-menu__trigger`       | FAB 트리거 — 토글 click 위임 |
| container | `.fab-menu__list`          | 항목이 추가될 부모 (ListRenderMixin 규약) |
| template  | `#fab-menu-item-template`  | cloneNode 대상 (ListRenderMixin 규약) |
| item      | `.fab-menu__item`          | 렌더된 항목 — click 위임 |
| actionId  | `.fab-menu__item`          | 항목 식별 (data-action-id) |
| icon      | `.fab-menu__item-icon`     | 아이콘 |
| label     | `.fab-menu__item-label`    | 라벨 |

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| actionId | `action-id` | 항목 click 시 `event.target.closest(item)?.dataset.actionId`로 actionId 추출 |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_currentContextKey` | 현재 적용 중인 컨텍스트 키(string \| null). `_renderByContext`가 갱신. CSS는 `.fab-menu[data-context-key="..."]`로 컨텍스트별 시각 차별화 가능. |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `menuByContext` | `this._renderByContext` (페이로드 `{ contextKey, items }`) — 내부에서 `this.listRender.renderData({ response: items })` 호출 + `.fab-menu` dataset 갱신 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 | payload |
|--------|------------------|------|---------|
| click | `trigger` (ListRender) | `@fabMenuToggled` | — (Standard 호환) |
| click | `item` (ListRender)    | `@fabMenuActionClicked` | `{ event }` — 페이지가 `event.target.closest('.fab-menu__item')?.dataset.actionId` + `event.target.closest('.fab-menu')?.dataset.contextKey` 동시 추출 |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderByContext({ response })` | `menuByContext` 핸들러. `{ contextKey, items }`를 받아 ① `this.listRender.renderData({ response: items })` 호출, ② `.fab-menu` 루트 element를 찾아 `dataset.contextKey = contextKey` 갱신, ③ `this._currentContextKey = contextKey` 갱신. 셋이 한 cycle에 묶여 항목 교체와 시각 컨텍스트 전환이 동시에 일어나도록 보장. |

### 페이지 연결 사례

```
[페이지 — viewport observer 또는 mode store]
    │
    └─ fetchAndPublish('menuByContext', this) 또는 직접 publish
        payload 예: { contextKey: 'edit',  items: [...edit tools] }
                  / { contextKey: 'share', items: [...share menu] }
                  / { contextKey: 'view',  items: [...view options] }

[FABMenu/Advanced/contextAware]
    ├─ ListRender가 items 배열을 항목으로 렌더 (이전 항목 전체 replace)
    ├─ .fab-menu dataset.contextKey = 'edit' (또는 'share' / 'view')
    └─ CSS .fab-menu[data-context-key="edit"]가 시각 컨텍스트(아이콘 색, hue rotate, accent border) 적용

[FABMenu/Advanced/contextAware]
    ├──@fabMenuToggled──▶ [페이지] (.fab-menu에 .is-open toggle)
    └──@fabMenuActionClicked──▶ [페이지]
            ├─ const item = event.target.closest('.fab-menu__item')
            ├─ const ctx  = event.target.closest('.fab-menu')
            └─ const { actionId } = item.dataset, { contextKey } = ctx.dataset
                → 페이지가 contextKey + actionId 조합으로 액션 분기

운영: this.pageDataMappings = [
        { topic: 'menuByContext', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@fabMenuToggled':       ({ targetInstance }) => { ... },
        '@fabMenuActionClicked': ({ event }) => {
          const actionId   = event.target.closest('.fab-menu__item')?.dataset.actionId;
          const contextKey = event.target.closest('.fab-menu')?.dataset.contextKey;
          // (contextKey, actionId) 조합으로 분기
        }
      });
```

> **viewport 자동 감지(옵션)**: 본 변형은 1차 의미인 "외부(페이지)가 contextKey를 결정하여 publish"에 집중한다. viewport 자체 감지(예: `IntersectionObserver` / `matchMedia`로 화면 상/중/하 영역 분기)는 **페이지 책임**으로 분리하여, 페이지가 viewport 신호를 contextKey로 변환해 publish하는 구조를 권장한다(컴포넌트는 "어떤 컨텍스트인가"의 의미를 모르고 항목 셋만 교체). 이로써 contextAware 컴포넌트는 viewport-tied / mode-tied / domain-tied 셋 모두를 동일 토픽으로 수용한다.

---

## 디자인 변형

| 파일 | 페르소나 | 컨텍스트 시각 차별화 방식 | 도메인 예 |
|------|---------|---------------------------|----------|
| `01_refined`     | A: Refined Technical | `data-context-key`별 accent hue rotate — edit/share/view 페르소나 베이스 퍼플에서 hue +0/+120/-60 시프트 + 좌측 accent stripe 색상 변경 | `edit` (편집 도구) / `share` (공유) / `view` (보기 옵션) |
| `02_material`    | B: Material Elevated | `data-context-key`별 surface tint 변경 — primary/secondary/tertiary container 색상 자동 매핑, elevation level 3 유지 | `nav` (네비게이션) / `actions` (페이지 액션) / `selection` (선택 모드) |
| `03_editorial`   | C: Minimal Editorial | `data-context-key`별 좌측 vertical rule 색만 변경 — 본문 타이포/간격은 동일 유지(정적 문서 흐름) | `read` (읽기 모드) / `edit` (편집 모드) / `comment` (코멘트 모드) |
| `04_operational` | D: Dark Operational  | `data-context-key`별 border-color + 시안/엠버/레드 alert 글로우 — 컴팩트, 모노스페이스 라벨, 컨텍스트가 시스템 상태를 의미 | `idle` (대기) / `running` (실행 중) / `alert` (경보 — 즉시 액션) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `.fab-menu[data-context-key="..."]` 셀렉터로 컨텍스트별 시각 차별화가 적용된다. 컨텍스트 교체 시 항목 자체가 unmount/remount되므로 motion은 ListRender 재렌더 cycle과 일치(별도 transition 없음). 토글 motion은 Standard와 동일하게 `.fab-menu.is-open` 처리.
