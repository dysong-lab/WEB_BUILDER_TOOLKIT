# FAB — Advanced / speedDial

## 기능 정의

1. **메인 FAB 아이콘 표시** — `fabInfo` 토픽으로 수신한 데이터를 메인 FAB의 아이콘 영역에 렌더(Standard와 동일한 1:1 필드 매핑). FAB은 라벨이 없는 원형/정사각 아이콘 전용 트리거다.
2. **보조 액션 항목 동적 렌더 + 방사형 좌표 주입** — `speedDialItems` 토픽으로 수신한 배열(`[{actionId, icon, label}]`)을 ListRenderMixin이 `<template>`을 cloneNode하여 보조 액션 컨테이너에 항목으로 렌더한 직후, `_applyRadialAngles()`가 항목 수 N에 맞춰 각도를 등분하고 각 항목에 `--x`/`--y` CSS 변수를 inline style로 주입한다. CSS는 `transform: translate(var(--x), var(--y))`로 항목을 부채꼴로 배치한다(라벨은 항목 옆에 툴팁 형태로 노출, 페르소나에 따라 vertical fan 채택 시 본 단계 noop).
3. **메인 FAB 클릭 → open/close 토글** — 메인 FAB 클릭 시 `_isOpen`을 토글하고 `.speed-dial` wrapper의 `data-speed-dial-state="open|closed"`를 갱신. open 상태에서 보조 액션이 페르소나별 motion(radial scale-up, vertical fan, instant snap 등)으로 펼쳐진다.
4. **보조 액션 클릭 → @speedDialActionClicked 발행** — 보조 항목 click 시 ListRenderMixin의 `cssSelectors.item`을 customEvents로 위임하여 `@speedDialActionClicked` 발행. 페이지 핸들러는 `event.target.closest('.speed-dial__item')?.dataset.actionId`로 어떤 보조 액션이 클릭됐는지 판별 가능. 발행 후 자동 close.
5. **외부 클릭 → 자동 close** — open 상태에서 컨테이너 외부 클릭 감지 시 close. `document.addEventListener('click', handler, true)`(capture phase)에 부착하고, `_isOpen=true`이고 `appendElement.contains(e.target)`이 false일 때만 close.
6. **ESC 키 → 자동 close** — open 상태에서 `document.addEventListener('keydown', handler)`로 `Escape` 키 감지 시 close. open이 아니면 무시.

> **Standard와의 분리 정당성**: Standard는 단일 click → `@fabClicked` 발행이 끝이며 보조 액션 개념 자체가 없다. speedDial은 ① 새 토픽 `speedDialItems` 구독 + ListRenderMixin 추가 (보조 액션 배열 렌더), ② 새 이벤트 `@speedDialActionClicked` (payload `actionId`) — 메인 FAB의 `@fabClicked`는 본 변형에서 사용하지 않고 메인 클릭이 토글 trigger가 됨, ③ `_isOpen` 자체 상태 + `data-speed-dial-state` dataset + `_handleContainerClick`/`_handleOutsideClick`/`_handleEscKey`/`_open`/`_close`/`_applyRadialAngles` 6종 자체 메서드, ④ 항목 수 N에 따라 부채꼴 각도를 등분해 `--x`/`--y` CSS 변수를 inline style로 주입하는 방사형 분포 로직 — 네 축 모두 Standard register.js와 직교. 따라서 같은 register.js로 표현 불가 → 별도 Advanced 변형으로 분리.

> **ExtendedFABs/Advanced/speedDial과의 차이**: 두 변형은 동일 토글 로직(open/close + outside click + ESC)과 동일 Mixin 조합(FieldRender + ListRender)을 공유하지만, **메인 트리거 컴포넌트가 다르다**. ① cssSelectors KEY: `extendedFab`+`icon`+`label` (가로 184px, 라벨 가짐) → `fab`+`icon` (원형 56px, 아이콘만), ② 구독 토픽: `extendedFabInfo` → `fabInfo`, ③ FieldRender payload: `{ icon, label }` → `{ icon }`, ④ **레이아웃 분포**: ExtendedFABs는 가로폭이 넓어 보조 항목도 같은 폭의 가로 카드를 vertical stack(아래→위)으로 쌓는 것이 자연스러우나, FAB은 원형 단일 아이콘이라 메인 FAB 주위에 보조 mini-FAB을 **방사형 부채꼴(radial fan)** 로 분포시키는 것이 시각적으로 자연스럽다. 본 변형은 페르소나 4종 중 **3종(refined, material, operational)에서 radial 분포**를 채택하고, **editorial 페르소나만 vertical fan**을 채택해 정적/문서적 흐름을 표현한다(페르소나 의도 반영). radial 분포 시 `_applyRadialAngles()`가 항목 수 N에 따라 메인 FAB 위쪽 ~180° 부채꼴을 등분하여 각 항목에 `--x`/`--y` 좌표를 주입한다.

> **MD3 근거**: MD3 Speed Dial(Material Design "FAB Speed Dial" 패턴)은 메인 FAB을 trigger로 하여 관련 액션 3~6개를 vertical/radial fan으로 노출하는 표준 패턴이다. 모바일 앱(Gmail Compose, Photos Library, Drive, Maps)에서 광범위하게 채택되며, 컴포넌트 라이브러리(MUI SpeedDial, Vuetify v-speed-dial 등)도 동일 패턴을 제공한다. 원형 FAB의 경우 **vertical 또는 radial 분포** 중 화면 공간/항목 수에 따라 선택한다.

---

## 구현 명세

### Mixin

FieldRenderMixin (메인 FAB 아이콘 렌더) + ListRenderMixin (보조 액션 배열 → template 반복) + 커스텀 메서드(`_handleContainerClick` / `_handleOutsideClick` / `_handleEscKey` / `_open` / `_close` / `_applyRadialAngles`).

> Standard가 FieldRenderMixin으로 메인 아이콘을 처리하므로 동일 Mixin을 재사용한다(`fabInfo` payload 호환성 유지). 보조 액션 배열 렌더는 ListRenderMixin이 template clone으로 처리하고, 방사형 좌표 주입은 자체 메서드 `_applyRadialAngles`로 완결한다(신규 Mixin 생성은 본 SKILL의 대상이 아님).

### cssSelectors

#### FieldRenderMixin (메인 FAB)

| KEY | VALUE | 용도 |
|-----|-------|------|
| fab  | `.fab`       | 메인 FAB 컨테이너 — click 이벤트 + FieldRender 매핑 루트 |
| icon | `.fab__icon` | 메인 FAB 아이콘 (FieldRender) |

#### ListRenderMixin (보조 액션)

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.speed-dial__items` | 보조 액션이 추가될 부모 (메인 FAB 주위) |
| template  | `#speed-dial-item-template` | 보조 액션 template — 항목 1개 구조 |
| item      | `.speed-dial__item` | 각 보조 액션 루트 — customEvents click 위임 대상 + 방사형 inline style 주입 대상 |
| actionId  | `.speed-dial__item` | data-action-id 식별자(item과 동일 요소에 dataset) |
| icon      | `.speed-dial__item-icon` | 보조 액션 아이콘 — material-symbols class에 textContent로 아이콘 이름 |
| label     | `.speed-dial__item-label` | 보조 액션 라벨 텍스트 (radial 페르소나에서는 툴팁 스타일, vertical 페르소나에서는 인라인 텍스트) |

#### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| actionId | `action-id` | 항목 click 시 `event.target.closest(item)?.dataset.actionId`로 actionId 추출. ListRender가 `data-action-id` 속성을 항목에 자동 설정. |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_isOpen` | 현재 펼침 상태(boolean). open/close 토글 게이트. |
| `_radialOptions` | 방사형 분포 매개변수 `{ radius, startAngle, endAngle }` (deg). null이면 vertical fan(좌표 주입 안 함). 페르소나별로 다르게 설정 — refined/material/operational은 radius=110, 부채꼴 200°~340°(위쪽 호); editorial은 null(vertical). |
| `_containerClickHandler` / `_outsideClickHandler` / `_escKeyHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `fabInfo` | `this.fieldRender.renderData` (Standard와 동일한 페이로드 `{ icon }`) |
| `speedDialItems` | `this._renderItems` (페이로드 `[{ actionId, icon, label }]`) — 내부에서 `this.listRender.renderData()` 호출 후 `this._applyRadialAngles()` 호출하여 방사형 좌표 주입 |

> `_renderItems`는 ListRender의 renderData를 그대로 호출 후 좌표 주입을 추가하는 wrapper다. ListRender가 항목을 DOM에 append한 직후 좌표를 inline style로 주입해야 하므로 두 단계가 같은 사이클에 묶여야 한다. ListRender 메서드를 재정의하지 않고 wrapper로 처리한다(Mixin 메서드 재정의 금지 규칙 준수).

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | 동작 |
|--------|------------------|-----------|------|
| click | `fab` (FieldRender) | 메인 FAB 클릭 | bindEvents가 `@fabClicked` 발행(Standard 호환). `_handleContainerClick` 자체 native delegator가 `_isOpen` 토글 수행. |
| click | `item` (ListRender) | 보조 액션 항목 클릭 | bindEvents 위임 + `@speedDialActionClicked` 발행. `_handleContainerClick`이 발행 직후 `_close()` 호출. |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_handleContainerClick(e)` | appendElement에 부착된 단일 native click delegator. 보조 항목 클릭이면 `_close()`. 메인 FAB 클릭이면 `_isOpen` 토글(`_open`/`_close`). bindEvents의 Weventbus 발행과 분리되어 _isOpen 상태 갱신만 전담. |
| `_handleOutsideClick(e)` | document capture click 핸들러. `_isOpen=false`면 무시. `appendElement.contains(e.target)`가 false면 `_close()`. |
| `_handleEscKey(e)` | document keydown 핸들러. `_isOpen=false`이거나 `e.key !== 'Escape'`면 무시. 둘 다 만족 시 `_close()`. |
| `_open()` | `_isOpen=true` + `appendElement.querySelector('.speed-dial').dataset.speedDialState='open'`. CSS가 페르소나별 motion으로 항목을 펼친다. |
| `_close()` | `_isOpen=false` + `dataset.speedDialState='closed'`. CSS가 reverse transition으로 접는다. |
| `_applyRadialAngles()` | `_radialOptions`가 null이면 noop(vertical 페르소나). 아니면 `.speed-dial__item` 전체에 대해 항목 수 N으로 `[startAngle, endAngle]`을 (N=1: 중앙, N>=2: 등분)으로 나눈 각 angle에 대해 `x = radius * cos(angle * π/180)`, `y = radius * sin(angle * π/180)` 계산. CSS 좌표계는 y가 아래로 양수이므로 위쪽 호를 만들기 위해 angle은 200°~340° 범위(또는 startAngle/endAngle 설정)를 사용한다. 각 item에 `style.setProperty('--x', x + 'px')` + `style.setProperty('--y', y + 'px')` 주입. |
| `_renderItems({ response })` | ListRender renderData wrapper. `this.listRender.renderData({ response })` 호출 후 즉시 `this._applyRadialAngles()` 호출. |

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('fabInfo', this)─────────> [FAB/speedDial] 메인 FAB 아이콘
[페이지] ──fetchAndPublish('speedDialItems', this)──> [FAB/speedDial] 보조 액션 N개 렌더 + 방사형 분포

[FAB/speedDial] ──@fabClicked────────────▶ [페이지] (Standard 호환, trigger 의미로 사용 가능)
[FAB/speedDial] ──@speedDialActionClicked─▶ [페이지]
                                                └─ event.target.closest('.speed-dial__item')?.dataset.actionId
                                                    ├─ 'newPost'/'newPhoto'/'newDraft' (작성 도메인)
                                                    ├─ 'sendMail'/'copyLink'/'exportPdf' (공유 도메인)
                                                    └─ 'cmdRun'/'cmdStop'/'cmdReset'    (제어 도메인)

운영: this.pageDataMappings = [
        { topic: 'fabInfo',        datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'speedDialItems', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@speedDialActionClicked': ({ event }) => {
          const id = event.target.closest('.speed-dial__item')?.dataset.actionId;
          // id별 분기 처리
        }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 분포 + 펼침 motion | 도메인 라벨 예 |
|------|---------|-------------------|---------------|
| `01_refined`     | A: Refined Technical | **Radial fan** (radius 110, 200°~340°) — 메인 FAB 45° 회전 + 항목별 60ms × index stagger fade-up + 퍼플 글로우 | `edit` 메인 + 새 글/사진/초안 (작성 도메인) |
| `02_material`    | B: Material Elevated | **Radial fan** (radius 120, 200°~340°) — 메인 FAB 90° 회전 + 항목별 50ms × index stagger scale-up + level 3 elevation | `add` 메인 + 문서/스프레드시트/슬라이드/폼 (생성 도메인) |
| `03_editorial`   | C: Minimal Editorial | **Vertical fan** (radial 좌표 주입 없음) — 메인 FAB 45° 회전 + 항목별 80ms × index cascade slide-up + outline only | `share` 메인 + 메일/링크/내보내기 (공유 도메인 — 정적 문서 흐름) |
| `04_operational` | D: Dark Operational  | **Radial fan** (radius 100, 200°~340°) — 메인 FAB 45° 회전 + 항목 instant snap(stagger 없이 동시) + 시안 border glow | `bolt` 메인 + RUN/STOP/RESET/KILL (제어 도메인) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, speedDial의 `data-speed-dial-state="open"` 시각이 Standard click 버튼과 명확히 구분되도록 보조 액션 컨테이너의 가시성/분포/motion을 페르소나별로 차별화한다. **radial 채택 페르소나(refined/material/operational)에서는 보조 항목이 메인 FAB 위쪽 부채꼴로 동시 분포**하여 원형 FAB의 시각 중심을 강화하고, **editorial은 의도적으로 vertical fan**을 선택해 정적 문서 흐름을 유지한다.
