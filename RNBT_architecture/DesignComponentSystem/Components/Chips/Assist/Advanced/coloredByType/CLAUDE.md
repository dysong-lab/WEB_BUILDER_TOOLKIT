# Assist — Advanced / coloredByType

## 기능 정의

1. **type별 색상 자동 적용 칩 렌더링** — `coloredAssistChipItems` 토픽으로 수신한 배열(`[{chipid, type, label, icon?}]`)을 ListRenderMixin이 `<template>` cloneNode로 렌더한다. 각 항목은 `type` 필드(예: `info`, `warning`, `error`, `success`, `neutral`)에 따라 `data-chip-type` 속성이 부여되어 CSS가 type별 색상(테두리/배경/아이콘/라벨)을 자동 적용한다.
2. **type 정규화 (미지의 type → fallback)** — 페이로드 type이 컴포넌트가 인지하는 집합(`info`/`warning`/`error`/`success`/`neutral`)에 없으면 자동으로 `neutral`로 정규화한다. `null`/`undefined`/빈 문자열도 동일. 페이지가 `data-chip-type="random_string"` 같은 미정의 값으로 CSS 적용 실패를 일으키지 않게 한다.
3. **칩 클릭 이벤트 — type 동반 emit** — 칩 클릭 시 `@coloredChipClicked` 발행. 명시 payload: `{ targetInstance, chipid, type }` — 페이지가 변경 항목의 type까지 동시에 받아 분기(예: `error` 칩만 alert 모달, `info` 칩은 단순 로그) 가능. customEvents의 위임 발행은 채널 등록 보장 + raw event 전달 의미로 유지하되, 자체 native delegator가 `dataset.chipid` + `dataset.chipType` 추출 후 명시 payload를 별도 emit한다.

> **Standard와의 분리 정당성 (4축)**: Standard는 ① 토픽 `assistChipItems` 페이로드 `[{chipid, icon, label}]` — type 개념 없음, ② cssSelectors에 `chipid`/`icon`/`label`만, ③ `datasetAttrs: { chipid }`만 — `data-chip-type`이 존재하지 않아 CSS의 type별 색상 분기가 원천적으로 불가능, ④ 이벤트 `@assistChipClicked` payload는 `{ event, targetInstance }`만 — 페이지가 type을 알려면 raw event에서 dataset을 다시 추출해야 함. coloredByType는 ① 새 토픽 `coloredAssistChipItems` (type 강제), ② cssSelectors에 `chipType` 추가, ③ `datasetAttrs: { chipid, chipType }` — ListRender가 `data-chip-type`을 자동 부착, ④ 새 이벤트 `@coloredChipClicked` payload `{ targetInstance, chipid, type }` — 페이지가 type을 즉시 받음. **컴포넌트 자체에 "type별 색상 분류"라는 의미를 흡수** — Standard는 페이지가 매번 type → className 매핑을 수동 적용해야 하는 부담을 컴포넌트가 가져온다. 같은 register.js로 표현 불가.

> **유사 변형과의 비교**: 컴포넌트 자체에 "type별 색상 자동 적용"을 흡수한 첫 사례. Cards/Advanced/swipeAction이 swipe gesture를 흡수, Buttons/SegmentedButtons/Advanced/multiSelect가 다중 선택 정책을 흡수한 것과 같은 패턴 — "페이지가 매번 똑같이 짜야 하는 분기 코드"를 컴포넌트로 끌어내림.

> **MD3 / 도메인 근거**: MD3 Assist Chips는 단일 컬러 토큰으로 정의되어 있으나 실사용에서 **상태 카테고리별 색상 분류**(작업 상태, 알림 카테고리, 우선순위, 시스템 레벨)가 빈번한 패턴이다. 본 변형은 페이지 레벨에서 매번 분기 처리되던 "type → className/style 매핑"을 컴포넌트로 통합한다. 도메인 예: 알림 카테고리(info/warning/error/success), 작업 상태 분류(running/paused/error/done), 우선순위 태그(low/medium/high/critical), 시스템 레벨(debug/info/warning/error).

---

## 구현 명세

### Mixin

ListRenderMixin (칩 항목 배열 렌더) + 자체 메서드 `_renderColoredChips`(type 정규화 + ListRender 호출) + `_handleChipClick`(클릭 시 type 동반 emit).

> Standard도 ListRenderMixin을 사용하지만, Standard는 `chipid`/`icon`/`label` 3-key 매핑이며 type 개념이 없다. coloredByType는 type 필드를 정규화하여 ListRender의 `chipType` 키로 전달, ListRender가 `datasetAttrs.chipType: 'chip-type'` 매핑으로 `data-chip-type` 속성을 자동 부착한다. Mixin 메서드 재정의는 하지 않는다(`_renderColoredChips`는 `listRender.renderData` 호출 wrapper). 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.colored-chip__list` | 칩이 추가될 부모 (ListRenderMixin 규약) |
| template  | `#colored-chip-item-template` | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| chipid    | `.colored-chip__item` | 항목 식별 + click 위임 — `data-chipid` |
| chipType  | `.colored-chip__item` | type별 시각 분기 — `data-chip-type` |
| icon      | `.colored-chip__icon` | 선행 아이콘 텍스트 (이모지/심볼) |
| label     | `.colored-chip__label` | 라벨 텍스트 |

### datasetAttrs

| KEY | data-* | 용도 |
|-----|--------|------|
| chipid   | `chipid`    | 항목 식별. ListRender가 `data-chipid` 자동 부착. |
| chipType | `chip-type` | type별 CSS 분기. ListRender가 `data-chip-type` 자동 부착. CSS는 `[data-chip-type="info"]`, `[data-chip-type="warning"]` 등으로 색상 매핑. |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_KNOWN_TYPES` | 알려진 type 집합 — `Set(['info', 'warning', 'error', 'success', 'neutral'])`. `_renderColoredChips`가 미지의 type을 `'neutral'`로 정규화할 때 참조. |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `coloredAssistChipItems` | `this._renderColoredChips` (페이로드 `[{ chipid, type, label, icon? }]`) — type 정규화 후 `this.listRender.renderData({ response })` 호출 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `chipid` (ListRender) | 항목 클릭 | `@coloredChipClicked` (bindEvents가 위임 발행 — Weventbus 채널 등록 보장). 본 변형은 자체 native click delegator가 `dataset.chipid` + `dataset.chipType` 추출 후 `Weventbus.emit('@coloredChipClicked', { targetInstance, chipid, type })` 명시 payload를 추가 발행한다. 페이지는 명시 payload(`chipid`, `type`)를 받는다. |

> **이벤트 발행 분리 이유**: bindEvents의 위임 발행은 `{ targetInstance, event }`만 전달하므로 페이지가 type을 알려면 raw event에서 dataset을 다시 추출해야 한다. coloredByType은 페이지가 type별 분기 처리하는 시나리오가 본질이므로(예: `error` 칩만 alert), 자체 native delegator에서 명시 payload를 emit하여 페이지의 dataset 재추출 부담을 제거한다.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderColoredChips({ response })` | `coloredAssistChipItems` 핸들러. 배열의 각 항목에서 `type`을 정규화(`_KNOWN_TYPES`에 없거나 null/undefined/빈 문자열이면 `'neutral'`)하여 `chipType` 키로 매핑. `chipid`/`label`/`icon`/`chipType` 4-key 객체로 변환 후 `listRender.renderData({ response })` 호출. |
| `_handleChipClick(e)` | 컨테이너 native click delegator. `e.target.closest(chipid)`로 클릭된 항목 찾음 → `dataset.chipid` + `dataset.chipType` 추출 → `Weventbus.emit('@coloredChipClicked', { targetInstance: this, chipid, type })`. |

### 페이지 연결 사례

```
[페이지 — 알림 카테고리 컨트롤]
    │
    └─ fetchAndPublish('coloredAssistChipItems', this) 또는 직접 publish
        payload 예: [
          { chipid: 'sys_info',  type: 'info',    icon: '\u{2139}',  label: 'System Info' },
          { chipid: 'disk_warn', type: 'warning', icon: '\u{26A0}',  label: 'Disk 80%' },
          { chipid: 'net_err',   type: 'error',   icon: '\u{1F6AB}', label: 'Net Lost' },
          { chipid: 'job_done',  type: 'success', icon: '\u{2705}',  label: 'Job Done' }
        ]

[Chips/Assist/Advanced/coloredByType]
    ├─ _renderColoredChips가 type을 정규화(미지 → 'neutral')
    ├─ ListRender가 항목별 data-chipid + data-chip-type 부착하여 N개 렌더
    └─ CSS .colored-chip__item[data-chip-type="error"] 등으로 type별 색상 자동 적용

[Chips/Assist/Advanced/coloredByType]
    └──@coloredChipClicked──▶ [페이지]
            ├─ payload: { targetInstance, chipid: 'net_err', type: 'error' }
            └─ 페이지가 type 기준으로 분기 (error → alert, warning → toast, info → log...)

운영: this.pageDataMappings = [
        { topic: 'coloredAssistChipItems', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@coloredChipClicked': ({ chipid, type }) => {
          // type 기준 분기 (error → alert, warning → toast, info → log)
        }
      });
```

### 디자인 변형

| 파일 | 페르소나 | type별 색상 매핑 (info / warning / error / success / neutral) | 도메인 컨텍스트 예 |
|------|---------|-------------------------------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | info=`#5BA9FF` / warning=`#FFB546` / error=`#FF5C7A` / success=`#3FE0B5` / neutral=`#7A8AC4` (다크 배경 + 그라디언트 fill, 퍼플 컨테이너 안에 색상 대비) | 알림 카테고리 표시 — 시스템 알림 분류(Info/Warning/Error/Success) |
| `02_material`    | B: Material Elevated | info=`#1976D2` / warning=`#F57C00` / error=`#D32F2F` / success=`#388E3C` / neutral=`#616161` (라이트, MD3 표준 컬러 + 작은 elevation + tonal background) | 작업 상태 분류 — 빌드/배포 잡 상태(Pending/Running/Failed/Success) |
| `03_editorial`   | C: Minimal Editorial | info=`#3D5C7E` / warning=`#A87E2C` / error=`#9E2A2B` / success=`#3E6B3A` / neutral=`#5F5750` (웜 그레이 베이스 + 색상은 텍스트/얇은 좌측 보더로만, 미세 톤 배경) | 우선순위 태그 — 기사/리포트 분류(Featured/Update/Erratum/Verified) |
| `04_operational` | D: Dark Operational  | info=`#4DD0E1` / warning=`#FFD740` / error=`#FF5252` / success=`#69F0AE` / neutral=`#7A8FA5` (다크 + 시안/네온 톤 + 좌측 색상 stripe + 모노스페이스 라벨) | 시스템 레벨 — 로그 레벨/장비 상태 분류(DEBUG/WARN/ERROR/OK/IDLE) |

각 페르소나는 produce-component SKILL Step 5-1의 페르소나 프로파일을 따른다. `[data-chip-type="..."]` 셀렉터로 색상을 분기하며, 5종 type 모두 한 변형 안에 동시에 표시되어 분류 효과를 시연한다.

### 결정사항

- **type 정규화 정책**: 미지의 type / null / undefined / 빈 문자열 → `'neutral'`. 페이지가 잘못된 type을 publish해도 CSS 누락 없이 안전한 fallback이 보장된다.
- **알려진 type 집합**: `info`, `warning`, `error`, `success`, `neutral` 5종. 도메인에 따라 의미 매핑은 페이지가 결정(예: `info`=Pending, `success`=Done). 색상 토큰만 컴포넌트가 보장.
- **선택 상태 없음**: Standard와 동일하게 토글/선택 상태가 없다. 클릭은 일회성 액션 트리거(@coloredChipClicked + type 동반).
- **아이콘**: 텍스트 기반(이모지/심볼 문자). icon 필드가 비어있으면 CSS `:empty`로 영역이 숨겨진다.
