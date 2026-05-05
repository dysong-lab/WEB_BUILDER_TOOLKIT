# ExtendedFABs — Advanced / speedDial

## 기능 정의

1. **메인 FAB 아이콘/라벨 표시** — `extendedFabInfo` 토픽으로 수신한 데이터를 메인 ExtendedFAB의 아이콘/라벨에 렌더(Standard와 동일한 1:1 필드 매핑).
2. **보조 액션 항목 동적 렌더** — `speedDialItems` 토픽으로 수신한 배열(`[{id, icon, label}]`)을 ListRenderMixin이 `<template>`을 cloneNode하여 보조 액션 컨테이너 안에 항목으로 렌더한다.
3. **메인 FAB 클릭 → open/close 토글** — 메인 FAB 클릭 시 `_isOpen`을 토글하고 컨테이너의 `data-speed-dial-state="open|closed"`를 갱신. open 상태에서 보조 액션이 vertical fan(메인 FAB 위로 stack)으로 펼쳐짐. CSS의 `nth-child` 기반 staggered transition이 펼침/접힘 motion을 페르소나별로 차별화한다.
4. **보조 액션 클릭 → @speedDialActionClicked 발행** — 보조 항목 click 시 ListRenderMixin의 `cssSelectors.item`을 customEvents로 위임하여 `@speedDialActionClicked` 발행. 페이지 핸들러는 `event.target.closest(item)?.dataset.actionId`로 어떤 보조 액션이 클릭됐는지 판별 가능.
5. **외부 클릭 → 자동 close** — open 상태에서 컨테이너 외부 클릭 감지 시 close. `document.addEventListener('click', handler, true)`(capture phase)에 부착하고, `_isOpen=true`이고 `appendElement.contains(e.target)`이 false일 때만 close.
6. **ESC 키 → 자동 close** — open 상태에서 `document.addEventListener('keydown', handler)`로 `Escape` 키 감지 시 close. open이 아니면 무시.

> **Standard와의 분리 정당성**: Standard는 단일 click → `@extendedFabClicked` 발행이 끝이며 보조 액션 개념 자체가 없다. speedDial은 ① 새 토픽 `speedDialItems` 구독 + ListRenderMixin 추가 (보조 액션 배열 렌더), ② 새 이벤트 `@speedDialActionClicked` (payload `actionId`) — 메인 FAB의 `@extendedFabClicked`는 사용하지 않고 메인 클릭이 토글 토픽이 됨, ③ `_isOpen` 자체 상태 + `data-speed-dial-state` dataset + `_handleMainClick`/`_handleItemClick`/`_handleOutsideClick`/`_handleEscKey` 4종 자체 메서드, ④ document-level outside click + keydown listener — 네 축 모두 Standard register.js와 직교. 따라서 같은 register.js로 표현 불가 → 별도 Advanced 변형으로 분리.

> **Draggable과의 직교성**: draggable은 메인 FAB의 위치를 `transform: translate3d`로 이동시키는 pointer 게스처 변형이고, speedDial은 클릭 시 보조 액션 메뉴를 펼치는 click 토글 변형이다 — 둘은 서로 다른 상호작용 축(이동 vs 펼침)을 다루며 동일 컴포넌트에 결합 가능하나 본 변형은 speedDial 단일 책임만 갖는다.

> **MD3 근거**: MD3 Speed Dial(Material Design "FAB Speed Dial" 패턴)은 메인 FAB을 trigger로 하여 관련 액션 3~6개를 vertical/radial fan으로 노출하는 표준 패턴이다. Gmail Compose, Photos Library, Drive 등 Google 앱에서 광범위하게 채택되며, 컴포넌트 라이브러리(MUI, Vuetify 등)도 동일 패턴을 제공한다.

---

## 구현 명세

### Mixin

FieldRenderMixin (메인 FAB 라벨/아이콘 렌더) + ListRenderMixin (보조 액션 배열 → template 반복) + 커스텀 메서드(`_handleMainClick` / `_handleItemClick` / `_handleOutsideClick` / `_handleEscKey` / `_open` / `_close`).

> Standard가 FieldRenderMixin으로 메인 라벨/아이콘을 처리하므로 동일 Mixin을 재사용한다(`extendedFabInfo` payload 호환성 유지). 보조 액션 배열 렌더는 ListRenderMixin이 template clone으로 처리한다(신규 Mixin 생성은 본 SKILL의 대상이 아님).

### cssSelectors

#### FieldRenderMixin (메인 FAB)

| KEY | VALUE | 용도 |
|-----|-------|------|
| extendedFab | `.extended-fab` | 메인 FAB 컨테이너 — click 이벤트 + FieldRender 매핑 루트 |
| icon        | `.extended-fab__icon`  | 메인 FAB 리딩 아이콘 (FieldRender) |
| label       | `.extended-fab__label` | 메인 FAB 라벨 텍스트 (FieldRender) |

#### ListRenderMixin (보조 액션)

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.speed-dial__items` | 보조 액션이 추가될 부모 (메인 FAB 위쪽) |
| template  | `#speed-dial-item-template` | 보조 액션 template — 항목 1개 구조 |
| item      | `.speed-dial__item` | 각 보조 액션 루트 — customEvents click 위임 대상 |
| actionId  | `.speed-dial__item` | data-action-id 식별자(item과 동일 요소에 dataset) |
| icon      | `.speed-dial__item-icon` | 보조 액션 아이콘 — material-symbols class에 textContent로 아이콘 이름 |
| label     | `.speed-dial__item-label` | 보조 액션 라벨 텍스트 |

#### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| actionId | `action-id` | 항목 click 시 `event.target.closest(item)?.dataset.actionId`로 actionId 추출. ListRender가 `data-action-id` 속성을 항목에 자동 설정. |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_isOpen` | 현재 펼침 상태(boolean). open/close 토글 게이트. |
| `_outsideClickHandler` / `_escKeyHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `extendedFabInfo` | `this.fieldRender.renderData` (Standard와 동일한 페이로드 `{ label, icon }`) |
| `speedDialItems`  | `this.listRender.renderData` (페이로드 `[{ actionId, icon, label }]`) |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | 동작 |
|--------|------------------|-----------|------|
| click | `extendedFab` (FieldRender) | 메인 FAB 클릭 | `_handleMainClick`이 `_isOpen` 토글. 별도 Weventbus 발행 없음(Standard의 `@extendedFabClicked`는 본 변형에서 trigger로만 쓰임). |
| click | `item` (ListRender) | 보조 액션 항목 클릭 | bindEvents 위임 + `@speedDialActionClicked` 발행(payload: `{ targetInstance, event }`). 발행 후 `_close()`로 자동 닫힘. |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_handleMainClick(e)` | 메인 FAB 클릭 핸들러. `bindEvents`의 `@extendedFabClicked` 위임 대신 자체 click 위임으로 처리하여 토글 사이드이펙트만 수행. `_isOpen`이 true면 `_close()`, false면 `_open()`. |
| `_handleItemClick(e)` | 보조 항목 click 핸들러. `bindEvents`가 `@speedDialActionClicked`를 위임 발행한 직후 본 핸들러는 `_close()`만 호출(공통 UX: 액션 선택 = 메뉴 닫기). |
| `_handleOutsideClick(e)` | document capture click 핸들러. `_isOpen=false`면 무시. `appendElement.contains(e.target)`가 false면 `_close()` (자기 자신 클릭은 무시 — 메인 FAB도 자기 자신이므로). |
| `_handleEscKey(e)` | document keydown 핸들러. `_isOpen=false`이거나 `e.key !== 'Escape'`면 무시. 둘 다 만족 시 `_close()`. |
| `_open()` | `_isOpen=true` + `appendElement.firstElementChild.dataset.speedDialState = 'open'` (또는 컨테이너 wrapper에 부착). CSS가 `[data-speed-dial-state="open"] .speed-dial__item`을 staggered transition으로 펼친다. |
| `_close()` | `_isOpen=false` + `dataset.speedDialState = 'closed'`. CSS가 reverse transition으로 접는다. |

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('extendedFabInfo', this)──> [ExtendedFABs/speedDial] 메인 FAB 라벨/아이콘
[페이지] ──fetchAndPublish('speedDialItems', this)───> [ExtendedFABs/speedDial] 보조 액션 N개 렌더

[ExtendedFABs/speedDial] ──@speedDialActionClicked──▶ [페이지]
                                                          └─ event.target.closest('.speed-dial__item')?.dataset.actionId
                                                              ├─ 'newPost' / 'newPhoto' / 'newDraft' (작성)
                                                              ├─ 'sendMail' / 'sendMessage' / 'share'  (전송)
                                                              └─ 'addText' / 'addImage' / 'addLink'    (편집)

운영: this.pageDataMappings = [
        { topic: 'extendedFabInfo', datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'speedDialItems',  datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@speedDialActionClicked': ({ event }) => {
          const id = event.target.closest('.speed-dial__item')?.dataset.actionId;
          // id별 분기 처리
        }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 펼침 motion | 도메인 라벨 예 |
|------|---------|------------|---------------|
| `01_refined`     | A: Refined Technical | Stagger fade-up — 항목별 60ms delay × index, opacity 0→1 + translateY 8px→0 | "Compose" 메인 + 새 글/사진/초안 (작성 도메인) |
| `02_material`    | B: Material Elevated | Stagger scale-up — 항목별 50ms delay × index, scale 0.7→1 + opacity 0→1, level 3 elevation | "Create" 메인 + 문서/스프레드시트/슬라이드 (생성 도메인) |
| `03_editorial`   | C: Minimal Editorial | Cascade slide — 항목별 80ms delay × index, translateY 16px→0 + opacity 0→1, 정적 outline | "Share" 메인 + 메일/링크/내보내기 (공유 도메인) |
| `04_operational` | D: Dark Operational  | Instant snap — 항목 즉시 표시(stagger 없이 동시), 시안 border glow flash | "EXEC" 메인 + RUN/STOP/RESET (제어 도메인) |

각 페르소나는 페르소나 프로파일(SKILL Step 5-1)을 따르며, speedDial의 `data-speed-dial-state="open"` 시각이 Standard click 버튼과 명확히 구분되도록 보조 액션 컨테이너의 가시성/motion을 페르소나별로 차별화한다.
