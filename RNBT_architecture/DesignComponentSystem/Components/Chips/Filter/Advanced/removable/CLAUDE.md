# Filter — Advanced / removable

## 기능 정의

1. **Removable 칩 항목 렌더링** — `removableFilterChipItems` 토픽으로 수신한 배열(`[{chipid, label}]`)을 ListRenderMixin이 `<template>` cloneNode로 칩 N개를 렌더한다. 각 칩은 라벨 텍스트 + 우측 × (close) 버튼 두 영역으로 구성된다. Standard와 달리 selected/체크마크 개념이 없으며, 칩이 존재한다는 것 자체가 "선택됨"을 의미한다(태그/필터 토큰형). selected 상태 매핑 없음.
2. **× 버튼 클릭 시 즉시 제거** — 칩의 `removeBtn` 영역 클릭 시 해당 칩을 즉시 DOM에서 분리하고 인스턴스 상태(`_chips: Map<chipid, label>`)에서도 제거한다. 본체(라벨 영역) 클릭과는 명확히 구별된다 — 위임 click delegator가 `e.target.closest(removeBtn)`로 분기한다. 남은 칩 ID 배열을 즉시 갱신한다.
3. **칩 본체 클릭 이벤트 (보조)** — 칩 본체(× 버튼 외부) 클릭 시 `@filterChipClicked` 발행. payload: `{ targetInstance, chipid, label, event }`. Standard의 토글 의미가 아닌 단순 "칩 클릭" 시그널 — 페이지가 상세 보기, 편집 모달 등 도메인별 액션을 자유롭게 결정한다.
4. **Remove 이벤트 발행** — × 클릭으로 칩이 제거되면 `@chipRemoved` 발행. payload: `{ targetInstance, chipid, label, removedAt: ISO, remainingChipIds: [...] }`. `removedAt`은 ISO 문자열 타임스탬프, `remainingChipIds`는 제거 이후의 전체 chipid 배열(페이지가 한 번에 backend 동기화 가능).
5. **외부 publish로 추가/제거/일괄 갱신** — 두 토픽으로 외부 강제 갱신 지원:
   - `removableFilterChipItems` (전체 갱신, 신규 batch는 새 진실 — 이전 칩 제거 후 다시 렌더)
   - `addRemovableFilterChip` (`{chipid, label}` — 단일 칩 append, 중복 ID 무시)
   - `removeRemovableFilterChip` (`{chipid}` — ID 매칭 시 제거 + `@chipRemoved` 발행, 외부에서도 같은 이벤트 시그널)

> **Standard와의 분리 정당성 (5축)**: Standard는 ① 토픽 `filterChipItems` 페이로드 `[{chipid, label, selected?}]` — **selected 정책이 핵심**, ② cssSelectors에 `selected`/체크마크 `data-selected` 분기 — 토글 시각, ③ `itemKey: 'chipid'` + `datasetAttrs.selected` — 페이지가 `updateItemState`로 selected 직접 조작, ④ 이벤트 `@filterChipClicked` 단일(토글 트리거 의미), ⑤ × 버튼 / remove 액션 / chip 제거 정책 없음. removable은 ① 새 토픽 `removableFilterChipItems` (`selected` 필드 없음 — 칩 존재 = 활성), ② cssSelectors에 `removeBtn` KEY 추가 + `data-selected` 제거, ③ `_chips: Map<chipid, label>` 자체 상태가 칩 set을 추적(추가/제거 정책을 컴포넌트가 흡수), ④ 새 이벤트 `@chipRemoved` (payload `chipid` + `removedAt` + `remainingChipIds`) + 보조 `@filterChipClicked` 본체 클릭, ⑤ 두 영역(본체 / removeBtn) 분기 click delegator + DOM 즉시 detach 정책 — 같은 register.js로 표현 불가. 페이지가 매번 × 버튼 selector 등록, closest() 분기, 즉시 detach + remainingIds 추출 + emit 보일러를 재구현해야 하는 부담을 컴포넌트가 흡수.

> **유사 변형과의 비교**: Chips/Assist/Advanced/coloredByType이 type 분류에 따른 색상 자동 분기를 흡수했다면, removable은 "× 버튼 + 제거 정책 + 두 영역 click 분기 + remove 이벤트"를 흡수했다. multiSelectGroup이 `_selectedIdsByGroup: Map<groupId, Set>`로 그룹/선택을 흡수한 것과 동일한 패턴 — "페이지가 매번 똑같이 짜야 하는 영역 분기 + DOM detach + emit 코드"를 컴포넌트로 끌어내림. selected 의미를 **있음/없음**으로 단순화한 토큰형 모델.

> **MD3 / 도메인 근거**: MD3 Input Chips와 유사하게 Filter Chips도 "일단 선택된 필터를 시각적으로 누적 표시 + 사용자가 즉시 제거 가능"한 패턴이 빈번하다. 검색 결과 상단의 활성 필터 표시(예: `[가격: 10~30만 ×] [브랜드: Nike ×]`), 이메일 수신자 토큰(`[user@a ×] [user@b ×]`), 데이터 대시보드의 활성 필터 칩 등이 이에 해당한다. selected 토글이 필요 없는 "활성 필터 토큰" 시나리오에서 Standard는 selected 정책을 강제하므로 부적합 — removable이 토큰형 모델을 정식화한다.

---

## 구현 명세

### Mixin

ListRenderMixin (`itemKey: 'chipid'`) + 자체 메서드 5종(`_renderItems` / `_handleClick` / `_removeChip` / `_addChip` / `_extractRemainingIds`) + 자체 상태 `_chips: Map<chipid, label>`.

> Standard도 ListRenderMixin을 사용하지만, Standard는 `chipid`/`label`/`selected` 매핑 + 페이지가 `updateItemState`로 selected 조작이다. removable은 ListRender를 **칩 항목 렌더에만** 사용하고(`chipid`/`label` 2-key, `selected` 없음), `removeBtn`은 customEvents 매핑 + click delegator 분기 영역으로만 cssSelectors에 등록한다(데이터 바인딩 X). 제거 정책은 자체 메서드가 흡수. Mixin 메서드 재정의 없음. 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container  | `.removable-chip__list`            | 칩이 추가될 부모 (ListRenderMixin 규약) |
| template   | `#removable-chip-item-template`    | 칩 cloneNode 대상 (ListRenderMixin 규약) |
| chipid     | `.removable-chip__item`            | 항목 식별 + 본체 클릭 위임 (data-chipid) |
| label      | `.removable-chip__label`           | 라벨 텍스트 |
| removeBtn  | `.removable-chip__remove`          | × 버튼 — click delegator 분기 영역 (이벤트 매핑 전용) |

> **`removeBtn` 처리**: `removeBtn`은 데이터 바인딩 대상이 아닌 **이벤트 매핑/분기 영역**이다. `cssSelectors`에 등록하여 customEvents에서 computed property로 참조한다. SVG/×는 template에 고정 배치되며 textContent 채움 대상 아님(데이터 KEY로 등록 안 함).

### itemKey

chipid

### datasetAttrs

| KEY | data-* |
|-----|--------|
| chipid | `chipid` |

> Standard와 달리 `selected` dataset 없음 — 토큰형 모델은 칩 존재 자체가 활성 의미.

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_chips` | `Map<chipid: string, label: string>`. 현재 렌더된 칩 set의 진실 소스. `_renderItems`가 새 batch로 교체, `_addChip`/`_removeChip`이 단일 변경. `remainingChipIds` 추출 시 `Map.keys()` 사용. |
| `_clickHandler` | 컨테이너 click delegator의 bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|--------|
| `removableFilterChipItems` | `this._renderItems` | `[{chipid, label}]` — 전체 batch 갱신 (이전 칩 제거 후 새로 렌더) |
| `addRemovableFilterChip` | `this._addChip` | `{chipid, label}` — 단일 칩 append (중복 ID는 무시) |
| `removeRemovableFilterChip` | `this._removeChip` | `{chipid}` — 단일 칩 제거 + `@chipRemoved` 발행 (외부 트리거도 동일 이벤트 시그널) |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `chipid` (cssSelectors) | 칩 본체 영역 클릭 | `@filterChipClicked` (bindEvents가 위임 발행 — Weventbus 채널 등록 보장) |

> **Native click delegator (자체 영역 분기)**: 컨테이너에 단일 `addEventListener('click')`을 부착하고, `e.target.closest(removeBtn)` 매칭 시 `_removeChip(chipid)` 호출 → `@chipRemoved` 명시 payload emit + DOM detach. `removeBtn`이 아닌 본체 영역 클릭은 native delegator에서 `@filterChipClicked` 명시 payload(`{ targetInstance, chipid, label, event }`)를 emit. bindEvents의 위임 발행은 raw event만 전달하므로, 페이지가 chipid + label을 dataset에서 다시 추출하지 않도록 명시 payload 방식 채택.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderItems({ response })` | `removableFilterChipItems` 핸들러. 페이로드 배열을 ListRender selectorKEY(`chipid`/`label`)에 맞게 매핑하여 `listRender.renderData` 호출. `_chips` Map을 새 batch로 교체. |
| `_handleClick(e)` | 컨테이너 native click delegator. `e.target.closest(removeBtn)` 매칭 시 `_removeChip(chipid, 'click')` 호출. 그 외 `e.target.closest(chipid)` 매칭 시 `Weventbus.emit('@filterChipClicked', {...})` 명시 payload 발행. |
| `_removeChip({ response })` 또는 `_removeChip(payload, source)` | `removeRemovableFilterChip` 핸들러 + native delegator 호출 양쪽 지원. chipid 매칭 시 `_chips`에서 delete + DOM 항목 detach + `@chipRemoved` 발행. payload `{ chipid, label, removedAt: ISO, remainingChipIds: [...] }`. |
| `_addChip({ response })` | `addRemovableFilterChip` 핸들러. payload `{chipid, label}` 단일 칩 append. 중복 ID는 silent 무시. ListRender의 template에서 cloneNode하여 컨테이너에 append, `_chips` Map에 추가. |
| `_extractRemainingIds()` | `_chips` Map의 keys 배열을 반환. `@chipRemoved` payload의 `remainingChipIds` 산출용. |

### 페이지 연결 사례

```
[페이지 — 검색 필터 / 이메일 수신자 태그 / 활성 필터 표시]
    │
    └─ fetchAndPublish('removableFilterChipItems', this) 또는 직접 publish
        payload 예: [
          { chipid: 'price-mid',   label: '가격: 10~30만' },
          { chipid: 'brand-nike',  label: '브랜드: Nike' },
          { chipid: 'rating-4plus', label: '평점 4★+' }
        ]

[Chips/Filter/Advanced/removable]
    ├─ ListRender가 3개 칩 cloneNode를 container에 append
    ├─ _chips Map: { 'price-mid'→'가격: 10~30만', 'brand-nike'→'브랜드: Nike', 'rating-4plus'→'평점 4★+' }
    └─ 각 칩은 라벨 + × 버튼 두 영역

[× 클릭 — 'brand-nike' 제거]
    └──@chipRemoved──▶ [페이지]
            payload: {
              targetInstance,
              chipid: 'brand-nike',
              label: '브랜드: Nike',
              removedAt: '2026-05-05T10:30:00.000Z',
              remainingChipIds: ['price-mid', 'rating-4plus']
            }
            → 페이지가 remainingChipIds로 필터 재계산 / backend 동기화

[칩 본체 클릭 — 'price-mid' (× 영역 외)]
    └──@filterChipClicked──▶ [페이지] → 상세보기 모달, 편집 시나리오 등

운영: this.pageDataMappings = [
        { topic: 'removableFilterChipItems', datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'addRemovableFilterChip',    datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'removeRemovableFilterChip', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@chipRemoved':       ({ chipid, remainingChipIds }) => { /* 필터 재계산 */ },
        '@filterChipClicked': ({ chipid, label }) => { /* 상세 보기 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 베이스 + 그라디언트 fill 칩 + 우측 × 미세 hover 강조(rotation/scale) + Pretendard. 칩 = 항상 활성 토큰 시각. | 검색 결과 상단 활성 필터 — 가격대 / 브랜드 / 평점 토큰 누적 표시 |
| `02_material`    | B: Material Elevated | 라이트 그레이 베이스 + tonal `#E3F2FD` filled 칩 + elevation shadow + × 버튼 ripple 영역(원형 hover 배경) + Roboto. | 이메일 수신자 태그 — 이메일 주소를 칩 토큰으로 표시 + 즉시 제거 |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + 1px outline 칩 + Georgia serif 라벨 + × 버튼 점선 underline 정도의 미세 분리 + 라이트 톤. | 매거진 태그 필터 — 카테고리 태그를 활성 필터로 표시 |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 + 시안 stripe 좌측 + JetBrains Mono uppercase + × 버튼 명시적 사각 영역(hover 시 시안 배경) + 칩 카운트 표시 가능. | 데이터 대시보드 활성 필터 — 운영 환경의 적용된 필터 토큰 표시 |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. 4~6개 칩(다양한 라벨 길이) 초기 데이터로 토큰형 + 제거 가능을 한 변형 안에서 시연한다.

### 결정사항

- **selected 개념 제거**: 토큰형 모델에서는 칩 존재 자체가 "활성"을 의미. selected dataset/CSS 분기 없음. 칩 시각도 단일 상태(활성)만 정의.
- **두 영역 click 분기**: 컨테이너 단일 native delegator + `closest(removeBtn)` 우선 매칭 → 본체 클릭은 그 다음. bindEvents의 위임은 본체 클릭 영역(`chipid`)에만 적용하여 `@filterChipClicked` 채널을 등록한다(보일러).
- **× 버튼 SVG 고정**: × 아이콘은 SVG로 template에 고정. cssSelectors KEY로는 `removeBtn`(부모 button) 등록 — 이벤트 영역 식별용.
- **이벤트 발행 분리 이유**: bindEvents 위임 발행은 `{ targetInstance, event }` raw event만 전달하므로, 페이지가 chipid를 dataset에서 다시 추출해야 한다. removable은 chipid + label + remainingChipIds 명시 payload가 본질이므로(필터 재계산 시나리오), native delegator에서 명시 payload emit으로 페이지의 dataset 재추출 부담 제거.
- **외부 토픽 양립**: `removableFilterChipItems`(전체 갱신) + `addRemovableFilterChip`/`removeRemovableFilterChip`(단일 변경) 양쪽 지원. 페이지가 시나리오에 맞게 선택 — 초기 로드는 전체, 사용자 추가 액션은 단일 add, 외부 시스템 sync는 단일 remove 등.
- **`removeRemovableFilterChip` 외부 트리거도 같은 `@chipRemoved` 발행**: 클릭/외부 토픽 양쪽 모두 동일 이벤트 시그널 → 페이지 핸들러가 source 분기 없이 통일된 처리 가능.
