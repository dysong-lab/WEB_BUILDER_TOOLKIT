# 컴포넌트 대량생산 플랜

## 목표

24개 MD3 범주를 기존 Mixin으로 채우고, 범주 확장까지 포함하여 총 40개 2D 컴포넌트 완성.

**핵심 판단**:
- 새 Mixin **불필요** — 기존 10개 Mixin으로 모든 컴포넌트 커버 가능
- 유틸리티 함수 **1개 추가** — `calcPopupPosition` (Tooltip, Menu용 위치 계산)

---

## 1. 생산 아키타입

모든 컴포넌트는 7개 아키타입 중 하나에 해당한다. register.js 골격이 동일하고 config만 다르다.

### A. FieldRender-Only

가장 단순한 패턴. 단일 객체 → DOM 텍스트/속성 매핑.

```
applyFieldRenderMixin(this, { cssSelectors, datasetAttrs })
→ subscribe
→ bindEvents
```

**참조 컴포넌트**: StatusCard, StatusBadge, TopAppBar

**옵션 변형**:
- `datasetAttrs` — 상태에 따른 CSS 전환 (`data-status`, `data-checked`)
- `styleAttrs` — 값 기반 CSS 속성 (`width`, `left`)
- `elementAttrs` — 요소 속성 (`src`, `fill`)

### B. ListRender + itemKey

배열 → 템플릿 복제 + 개별 항목 상태 관리.

```
applyListRenderMixin(this, { cssSelectors, itemKey, datasetAttrs })
→ subscribe
→ bindEvents (click delegation via cssSelectors computed property)
```

**참조 컴포넌트**: NavigationDrawer, PrimaryTabs, FilterChips

**핵심**: `itemKey`로 `updateItemState`/`getItemState` 활성화.
`customEvents`에서 `[this.listRender.cssSelectors.item]: '@eventName'` 패턴 사용.

### C. ListRender (itemKey 없음)

배열 → 템플릿 복제, 개별 상태 관리 불필요.

```
applyListRenderMixin(this, { cssSelectors })
→ subscribe
→ bindEvents
```

**참조 컴포넌트**: NavigationSidebar

### D. ECharts (기본 매핑)

`{ categories, values }` → xAxis/series 자동 매핑.

```
applyEChartsMixin(this, { cssSelectors, option })
→ subscribe
```

**참조 컴포넌���**: EChartsBar, EChartsLine, EChartsArea

**특징**: `mapData` 없음. 기본 데이터 규약(`categories` → `xAxis.data`, `values[i]` → `series[i].data`)으로 충분.

### E. ECharts (커스텀 mapData)

비표준 데이터 구조 → `mapData` 함수로 커스텀 매핑.

```
applyEChartsMixin(this, { cssSelectors, option, mapData })
→ subscribe
```

**���조 컴포넌트**: EChartsPie, EChartsRadar, EChartsScatter

**특징**: `mapData(data, optionCopy)` 함수가 데이터를 option 형태로 변환.

### F. ShadowPopup-Only

Shadow DOM 팝업. show/hide + 이벤트 바인딩.

```
applyShadowPopupMixin(this, { cssSelectors })
→ bindPopupEvents
→ subscribe
→ bindEvents (외부 트리거)
```

**참조 컴포넌트**: InfoDialog (inner Mixin 제거한 단순 버전)

**특징**: HTML `<template>` 안에 `<style>` 포함 (Shadow DOM 스타일 격��).

### G. ShadowPopup + Inner Mixin

Shadow DOM 팝업 + 내부에 FieldRender/ListRender 적��.

```
applyShadowPopupMixin(this, {
    cssSelectors,
    onCreated: (shadowRoot) => {
        this._popupScope = { appendElement: shadowRoot };
        applyFieldRenderMixin(this._popupScope, { cssSelectors: innerSelectors });
    }
})
→ bindPopupEvents
→ subscribe
→ bindEvents
```

**참조 컴포��트**: InfoDialog

**특징**: `onCreated` 콜백에서 inner Mixin 적용.
`beforeDestroy`에서 inner Mixin → outer Mixin 순서로 정리.

---

## 2. 새 Mixin 필요 여부

### 결론: 불필요

| 후보 패턴 | 반복 횟수 | 판단 | 근거 |
|----------|----------|------|------|
| 위치 계산 (Tooltip, Menu) | 2~3개 | 유틸리티 함수 | 라이프사이클 없음, 순수 계산 |
| 입력 처리 (TextField, Search) | 2개 | register.js 커스텀 | Mixin은 data→DOM 방향, 입력은 역방향 |
| 드래그 (Slider) | 1개 | register.js 커스텀 | 단일 컴포넌트, ���복 기준 미달 |
| 자동 숨김 (Snackbar) | 1개 | setTimeout | register.js에서 직접 처리 |

**Mixin 신규 기준** (COMPONENT_SYSTEM_DESIGN.md):
1. data→rendering 패턴이어야 함
2. 3개 이상 컴포넌트에서 반복
3. 라이프사이클(create/render/destroy) 관리가 필요

### 추가: 유틸리티 함수 1개

```
calcPopupPosition(triggerEl, popupEl, { placement, offset })
→ { top, left }
```

- getBoundingClientRect() + 뷰포트 경계 체크
- Mixin이 아닌 순��� 함수
- 소비자: RichTooltip, DropdownMenu

---

## 3. 배치별 빌드 순서

### 배치 1: 순수 FieldRender — 5개 (아키타입 A)

가장 단순하고 동일한 골격. 병렬 생산 가능.

| # | 컴포넌트 | 범주 | cssSelectors | datasetAttrs | styleAttrs | 이벤트 |
|---|----------|------|-------------|-------------|-----------|--------|
| 19 | StatusToolbar | Toolbars | title, status, action1, action2 | status | — | click: action → @toolbarAction |
| 20 | LinearProgress | Loading | label, bar | — | bar: { property: 'width', unit: '%' } | — |
| 21 | ToggleSwitch | Switch | label, track | track: 'checked' | — | click: track → @switchToggled |
| 22 | MetricCard | Cards | title, value, unit, trend | trend: 'direction' | — | — |
| 23 | DeviceInfoCard | Cards | name, type, ip, status, location | status: 'level' | — | — |

### 배치 2: ListRender + itemKey — 2개 (아키타입 B)

| # | 컴포넌트 | ��주 | itemKey | 이벤트 | 특이사항 |
|---|----------|------|--------|--------|---------|
| 24 | DropdownMenu | Menus | menuid | click: item → @menuItemSelected | 외부 클릭 닫기 (document 이벤트) |
| 25 | ToggleButtonGroup | Buttons | btnid | click: btn → @buttonToggled | updateItemState로 선택 토글 |

### 배�� 3: ShadowPopup 계열 — 3개 + 유틸리티 (아키타입 F, G)

순서 의존성: 유틸리티 → Tooltip.

| 순서 | # | 컴포넌트 | 범주 | 아키타입 | 특이사항 |
|------|---|----------|------|---------|---------|
| 0 | — | calcPopupPosition.js | (유틸리티) | — | 순수 함수 |
| 1 | 26 | BottomSheet | Sheets | F | CSS 슬라이드 애니메이션 |
| 2 | 27 | Snackbar | Snackbar | G | inner FieldRender + setTimeout 자동 숨김 |
| 3 | 28 | RichTooltip | Tooltips | F | calcPopupPosition + mouseenter/leave |

### 배치 4: 입력/인터랙션 — 3개 (커스텀 로직)

각각 고유한 인터랙션. 템플릿화 어려움.

| # | 컴포���트 | 범주 | 접근 방식 |
|---|----------|------|----------|
| 29 | OutlinedTextField | TextFields | Mixin 없음. input → 검증 → @inputChanged |
| 30 | SearchBar | Search | FieldRender(상태) + ListRender(결과) + input 이���트 |
| 31 | ValueSlider | Sliders | FieldRender(styleAttrs: left%) + pointer 이벤트 체인 |

### 배치 5: 차트 & 리스트 확장 — 9개 (아키타입 C, D, E)

기존 패턴의 순수 변형. 대량 병�� 생산 가능.

| # | 컴포넌트 | 범주 | 아키타입 | 참조 대비 차이점 |
|---|----------|------|---------|----------------|
| 32 | EChartsStackedBar | Charts | D | series[].stack: 'total' |
| 33 | EChartsMultiLine | Charts | D | 다중 series + 범례 |
| 34 | EChartsTreemap | Charts | E | type: 'treemap', 계층 데���터 |
| 35 | EChartsFunnel | Charts | E | type: 'funnel', items 배열 |
| 36 | EChartsSankey | Charts | E | type: 'sankey', nodes + links |
| 37 | EChartsHeatmap | Charts | E | type: 'heatmap', [[x, y, value]] |
| 38 | AlarmList | Lists | C | 시간/레벨/메시지/소스 |
| 39 | DeviceList | Lists | G | ListRender + ShadowPopup 상세 |
| 40 | RankingList | Lists | C | 순위/이름/값/변동 |

---

## 4. 컴포넌트별 스펙 상세

### 배치 1 상세

#### 19. StatusToolbar (Toolbars)

**역할**: 상태 정보와 액션 버튼을 포함한 도구 바.

```
cssSelectors:
    title:   '.status-toolbar__title'
    status:  '.status-toolbar__status'
    action1: '.status-toolbar__action[data-action="refresh"]'
    action2: '.status-toolbar__action[data-action="settings"]'

datasetAttrs:
    status: 'level'          → data-level="normal|warning|error"

subscriptions:
    toolbarStatus: [this.fieldRender.renderData]

customEvents:
    click:
        [this.fieldRender.cssSelectors.action1]: '@toolbarRefresh'
        [this.fieldRender.cssSelectors.action2]: '@toolbarSettings'
```

**mock 데이터**: `{ title: 'System Monitor', status: 'normal' }`

#### 20. LinearProgress (Loading)

**역할**: 선형 진행률 바. 확정(determinate) 모드.

```
cssSelectors:
    label: '.linear-progress__label'
    bar:   '.linear-progress__bar'

styleAttrs:
    bar: { property: 'width', unit: '%' }

subscriptions:
    progressData: [this.fieldRender.renderData]

customEvents: {} (없음)
```

**mock 데이터**: `{ label: 'Uploading...', bar: 72 }`

**CSS 핵심**: `.linear-progress__bar`는 높이 고정, `width: 0%`이 초기값.
불확정(indeterminate) 모드는 CSS 애니메이션만으로 구현 (Mixin 불필요).

#### 21. ToggleSwitch (Switch)

**역할**: ON/OFF 토글 스위치.

```
cssSelectors:
    label: '.toggle-switch__label'
    track: '.toggle-switch__track'

datasetAttrs:
    track: 'checked'          → data-checked="true|false"

subscriptions:
    switchState: [this.fieldRender.renderData]

customEvents:
    click:
        [this.fieldRender.cssSelectors.track]: '@switchToggled'
```

**mock 데이터**: `{ label: 'Dark Mode', track: 'true' }`

**CSS 핵심**: `data-checked="true"` → 트랙 배경색 전환 + 썸 위치 이동.

#### 22. MetricCard (Cards 확장)

**역할**: 단일 KPI 수치 카드 (값 + 단위 + 추세).

```
cssSelectors:
    title: '.metric-card__title'
    value: '.metric-card__value'
    unit:  '.metric-card__unit'
    trend: '.metric-card__trend'

datasetAttrs:
    trend: 'direction'        → data-direction="up|down|flat"

subscriptions:
    metricData: [this.fieldRender.renderData]

customEvents: {} (없음)
```

**mock 데이터**: `{ title: 'CPU Usage', value: '72.5', unit: '%', trend: 'up' }`

**CSS 핵심**: `data-direction="up"` → 초록색 화살표, `"down"` → 빨간색 화살표.

#### 23. DeviceInfoCard (Cards 확장)

**역할**: 장비 상세 정보 카드.

```
cssSelectors:
    name:     '.device-info__name'
    type:     '.device-info__type'
    ip:       '.device-info__ip'
    status:   '.device-info__status'
    location: '.device-info__location'

datasetAttrs:
    status: 'level'           → data-level="online|warning|error|offline"

subscriptions:
    deviceInfo: [this.fieldRender.renderData]

customEvents: {} (없음)
```

**mock 데이터**: `{ name: 'UPS-01', type: 'UPS', ip: '192.168.1.10', status: 'online', location: 'B1-Rack03' }`

### 배치 2 상세

#### 24. DropdownMenu (Menus)

**역할**: 드롭다운 메뉴 목록. 트리거 클릭 시 열림, 외부 클릭 시 닫힘.

```
cssSelectors:
    container: '.dropdown-menu__list'
    template:  '#dropdown-menu-item-template'
    menuid:    '.dropdown-menu__item'
    icon:      '.dropdown-menu__item-icon'
    label:     '.dropdown-menu__item-label'

itemKey: 'menuid'

datasetAttrs:
    menuid: 'menuid'
    active: 'active'

subscriptions:
    menuItems: [this.listRender.renderData]

customEvents:
    click:
        [this.listRender.cssSelectors.menuid]: '@menuItemSelected'
```

**register.js 특이사항**:
- `this._onDocumentClick` — document 레벨 클릭 이벤트로 외부 클릭 감지
- `beforeDestroy`에서 `document.removeEventListener` 추가 정리

**mock 데이터**: `[{ menuid: 'edit', icon: '✏', label: 'Edit' }, { menuid: 'delete', icon: '🗑', label: 'Delete' }]`

#### 25. ToggleButtonGroup (Buttons)

**���할**: 토글 버튼 그룹. 여러 버튼 중 하나/다수 선택.

```
cssSelectors:
    container: '.toggle-btn-group__list'
    template:  '#toggle-btn-item-template'
    btnid:     '.toggle-btn-group__btn'
    label:     '.toggle-btn-group__btn-label'

itemKey: 'btnid'

datasetAttrs:
    btnid:    'btnid'
    selected: 'selected'

subscriptions:
    buttonItems: [this.listRender.renderData]

customEvents:
    click:
        [this.listRender.cssSelectors.btnid]: '@buttonToggled'
```

**mock 데이터**: `[{ btnid: 'day', label: 'Day', selected: 'true' }, { btnid: 'week', label: 'Week' }, { btnid: 'month', label: 'Month' }]`

### 배치 3 ��세

#### calcPopupPosition.js (유틸리티)

```javascript
/**
 * 트리거 요소 기준 팝업 위치를 계산한다.
 *
 * @param {Element} triggerEl  - 기준 요소
 * @param {Element} popupEl   - 배치할 팝업 요소
 * @param {Object}  options
 * @param {string}  options.placement - 'top' | 'bottom' | 'left' | 'right' (기본: 'bottom')
 * @param {number}  options.offset    - 간격 px (기본: 8)
 * @returns {{ top: number, left: number }}
 */
```

- `getBoundingClientRect()` 기반
- 뷰포트 경계를 넘으면 반대 방향으로 전환 (flip)
- Mixin이 아닌 순수 함수, 라이프사이클 없음

#### 26. BottomSheet (Sheets)

**역할**: 하단에서 슬라이드업되는 시트 패널.

```
cssSelectors (ShadowPopup):
    template: '#bottom-sheet-popup-template'
    closeBtn: '.sheet-close'
    overlay:  '.sheet-overlay'

subscriptions:
    sheetContent: [this.shadowPopup.show]  (또는 커스텀 핸들러)

customEvents (Shadow DOM 내부 — bindPopupEvents):
    click:
        closeBtn: '@sheetClose'
        overlay:  '@sheetClose'
```

**CSS 핵심**: `transform: translateY(100%)` → `translateY(0)` 애니메이션.

#### 27. Snackbar (Snackbar)

**역할**: 일시적 토스트 알림. 자동 숨김.

```
ShadowPopup cssSelectors:
    template: '#snackbar-popup-template'

Inner FieldRender cssSelectors (onCreated에서 적용):
    message: '.snackbar__message'
    action:  '.snackbar__action'

Shadow DOM 이벤트 (bindPopupEvents):
    click:
        action: '@snackbarAction'
```

**register.js 특이사항**:
- `this._autoHideTimer` — `setTimeout(hide, 4000)`
- `show()` 호출마다 타이머 리셋
- `beforeDestroy`에서 `clearTimeout(this._autoHideTimer)` 정리

#### 28. RichTooltip (Tooltips)

**역할**: 트리거 요소에 호버 시 표시되는 정보 툴팁.

```
ShadowPopup cssSelectors:
    template: '#rich-tooltip-popup-template'
    title:    '.tooltip__title'
    body:     '.tooltip__body'

customEvents (메인 DOM — 트리거 이벤트):
    mouseenter: trigger → show + 위치 계산
    mouseleave: trigger → hide
```

**register.js ���이사항**:
- `calcPopupPosition` 유틸리티 사용
- `mouseenter` 핸들러에서 `show()` 후 `calcPopupPosition(triggerEl, popupHost)` 호출

### 배��� 4 상세

#### 29. OutlinedTextField (TextFields)

**역할**: 외곽선 텍스트 입력 필드. Mixin 없이 순수 이벤트 바인딩.

```
(Mixin 없음)

DOM 접근 (register.js에서 직접):
    input:    this.appendElement.querySelector('.text-field__input')
    label:    this.appendElement.querySelector('.text-field__label')
    helper:   this.appendElement.querySelector('.text-field__helper')

customEvents:
    input:  input → @inputChanged (value 포함)
    focus:  input → 라벨 float 애니메이션
    blur:   input → 라벨 복귀 + 유효성 검사
```

**beforeDestroy**: customEvents 제거만 (Mixin 없음).

#### 30. SearchBar (Search)

**역할**: 검색 입력 + 결과/제안 드롭다운.

```
FieldRender cssSelectors (검색 상태 표시):
    placeholder: '.search-bar__placeholder'
    status:      '.search-bar__status'

ListRender cssSelectors (결과 목록):
    container: '.search-bar__results'
    template:  '#search-result-item-template'
    item:      '.search-bar__result-item'
    title:     '.search-bar__result-title'

customEvents:
    input: input → 검색 트리거
    click: [this.listRender.cssSelectors.item] → @resultSelected
```

**register.js 특이사항**: `input` 이벤트 debounce 처리.

#### 31. ValueSlider (Sliders)

**역할**: 값 선택 슬라이더.

```
FieldRender cssSelectors:
    label:  '.value-slider__label'
    value:  '.value-slider__value'
    thumb:  '.value-slider__thumb'
    fill:   '.value-slider__fill'

styleAttrs:
    thumb: { property: 'left', unit: '%' }
    fill:  { property: 'width', unit: '%' }

customEvents:
    pointerdown: thumb → 드래그 시작
```

**register.js 특이사��**: `pointermove`/`pointerup`은 `pointerdown` 핸들러 내에서 동적 바인딩.

### 배치 5 상세

#### 32~37. Charts 확장

모든 차트는 동일한 5파일 구조. 차이점은 `option` 객체와 `mapData` 함수뿐.

| 컴포넌트 | type | mapData 데이터 형태 |
|----------|------|-------------------|
| EChartsStackedBar | bar | `{ categories, series: [{ name, data, stack }] }` |
| EChartsMultiLine | line | `{ categories, series: [{ name, data }] }` |
| EChartsTreemap | treemap | `{ data: [{ name, value, children }] }` |
| EChartsFunnel | funnel | `{ data: [{ name, value }] }` |
| EChartsSankey | sankey | `{ nodes: [{ name }], links: [{ source, target, value }] }` |
| EChartsHeatmap | heatmap | `{ xAxis, yAxis, data: [[x, y, value]] }` |

#### 38~40. Lists 확장

| 컴��넌트 | Mixin | 템플릿 필드 | 특이사항 |
|----------|-------|------------|---------|
| AlarmList | ListRender | time, level, message, source | datasetAttrs: level |
| DeviceList | ListRender + ShadowPopup | name, type, status + 상세 팝업 | EventBrowser 패턴 재활용 |
| RankingList | ListRender | rank, name, value, change | datasetAttrs: change(direction) |

---

## 5. 생산 워크플로우

### 파일 구조 (컴포넌트당 5개)

```
Components/[Category]/[Name]/
    scripts/register.js        ← 아키타입 골격 + config
    scripts/beforeDestroy.js   ← register.js의 역순
    views/01_standard.html     ← cssSelectors 계약 충족
    styles/01_standard.css     ← 시각 스타일링
    preview/01_standard.html   ← 독립 테스트 페이지
```

### 배치 내 첫 번째 컴포넌트

1. 아키타입 참조 컴포넌트의 register.js 확인
2. cssSelectors, subscription topic, event 이름 변경하여 register.js 작성
3. beforeDestroy.js 역순 작성
4. view HTML (cssSelectors 계약 충족)
5. style CSS (다크 테마, Flexbox, px 단위)
6. preview HTML (mock 데이터)
7. 스크린샷 검증

### 후속 컴포넌트

1. 같은 아키타입이면 register.js에서 config만 변경
2. beforeDestroy.js 거의 동일
3. view/style/preview만 새로 작성

---

## 6. 검증 체크리스트

### L1: 정적 검증 (매 컴포넌트)

- [ ] register.js 3단계 패턴: Mixin 적용 → 구독 → 이벤트
- [ ] beforeDestroy.js 역순 3단계: 이벤트 → 구독 → Mixin
- [ ] cssSelectors의 모든 VALUE가 view HTML에 존재
- [ ] datasetAttrs/styleAttrs/elementAttrs 키가 cssSelectors의 부분집합
- [ ] customEvents에서 cssSelectors computed property 사용 (하드코딩 금지)
- [ ] subscription topic 이름이 고유

### L2: 시각 검증 (매 컴포넌트)

- [ ] preview HTML이 에러 없이 렌더링
- [ ] mock 데이터가 올바르게 표시
- [ ] 인터랙션 이벤트 동작 확인 (해당 시)

### L3: 패턴 검증 (배치 완료 시)

- [ ] 같은 아키타입 컴포넌트 간 register.js diff → config만 차이
- [ ] beforeDestroy.js가 register.js와 정확히 대응

---

## 7. 요약

| 항목 | 값 |
|------|---|
| 현재 컴포넌트 | 18개 (12/24 범주) |
| 신규 예정 | 22개 (5배치) |
| 완료 후 총계 | **40개** (24/24 범주 + 확장) |
| 새 Mixin | 0개 |
| 새 유틸리티 | 1개 (calcPopupPosition) |
| 아키타입 | 7개 (A~G) |
| 템플릿 생산 가능 | 16개 (73%) |
| 커스텀 필요 | 6개 (27%) |
