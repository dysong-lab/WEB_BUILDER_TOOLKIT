# 컴포넌트 네이밍 및 재설계

> 날짜: 2026-03-31
> 상태: 설계 중
> 근거: Material Design 3 범주화 채택에 따른 컴포넌트 성격 정립

---

## 1. 문제

기존 컴포넌트 이름이 일반적이고, 범주의 성격과 구현이 일치하지 않는다.

| 현재 | 문제 |
|------|------|
| AppBars/Header | "Header"는 무엇이든 될 수 있음. AppBar의 성격(타이틀+액션)과 실제 구현(순수 데이터 표시)이 다름 |
| Navigation/Sidebar | "Sidebar"는 형태명. Navigation의 성격(열고/닫기+탐색)과 실제 구현(고정 메뉴)이 부분 일치 |
| Charts/BarChart | 이름은 구체적이지만 ECharts 기반임이 드러나지 않음 |
| Tables/Table | "Table"은 범주명과 동일. Tabulator 기반임이 드러나지 않음 |

---

## 2. 네이밍 원칙

### 라이브러리 기반 컴포넌트

외부 라이브러리에 의존하는 컴포넌트는 라이브러리명을 접두어로 붙인다.
같은 범주에서 다른 라이브러리를 사용하는 컴포넌트가 공존할 수 있기 때문이다.

```
Charts/
├── EChartsBar/          ← ECharts 기반 막대 차트
├── EChartsLine/         ← ECharts 기반 라인 차트
├── EChartsPie/          ← ECharts 기반 파이 차트
├── EChartsGauge/        ← ECharts 기반 게이지 차트
├── D3Sankey/            ← 향후 D3.js 기반 Sankey 다이어그램
└── ChartJsRadar/        ← 향후 Chart.js 기반 레이더 차트

Tables/
├── TabulatorDataTable/  ← Tabulator 기반 데이터 테이블
├── TabulatorPivot/      ← 향후 Tabulator 기반 피벗 테이블
└── GridJsTable/         ← 향후 Grid.js 기반 테이블
```

### Mixin 기반 컴포넌트

자체 Mixin만 사용하는 컴포넌트는 MD3 용어 + 구체적 용도로 네이밍한다.

```
AppBars/TopAppBar            ← MD3 용어
Cards/StatusCard             ← 용도 구체화
Navigation/NavigationDrawer  ← MD3 용어
Navigation/NavigationSidebar ← 현재 Sidebar의 정확한 명칭
Lists/EventBrowser           ← 이미 구체적 ✅
```

---

## 3. 기존 컴포넌트 재설계

### 3-1. AppBars/Header → 분리 재설계

현재 Header는 두 가지 역할을 해야 하지만, 하나만 하고 있다.

**현재 구현 (순수 데이터 표시):**
```javascript
applyFieldRenderMixin(this, {
    cssSelectors: {
        name: '.header__name',
        statusLabel: '.header__status',
        version: '.header__version'
    },
    datasetAttrs: { status: 'status' }
});
// → 시스템 이름, 상태, 버전만 렌더링
// → 액션 버튼, 네비게이션 아이콘 없음
```

**재설계 안:**

```
Cards/StatusCard (신규) ← 현재 Header의 실제 역할
  Mixin: FieldRenderMixin
  기능: 시스템 이름, 상태, 버전 등 정보를 카드 형태로 표시
  이벤트: 없음 (순수 데이터 표시)

AppBars/TopAppBar (재설계) ← MD3 AppBar 성격
  Mixin: FieldRenderMixin + customEvents
  기능: 타이틀 표시 + 액션 버튼 (메뉴 토글, 검색, 알림, 설정)
  이벤트: @menuToggle, @searchClicked, @notificationClicked, @settingsClicked
```

**TopAppBar HTML 구조 (설계):**

```html
<div class="top-app-bar">
    <button class="top-app-bar__nav-icon">☰</button>
    <span class="top-app-bar__title">-</span>
    <div class="top-app-bar__actions">
        <button class="top-app-bar__action-search">🔍</button>
        <button class="top-app-bar__action-notifications">🔔</button>
        <button class="top-app-bar__action-settings">⚙</button>
    </div>
</div>
```

**TopAppBar register.js (설계):**

```javascript
applyFieldRenderMixin(this, {
    cssSelectors: {
        title:         '.top-app-bar__title',
        navIcon:       '.top-app-bar__nav-icon',
        searchBtn:     '.top-app-bar__action-search',
        notifications: '.top-app-bar__action-notifications',
        settingsBtn:   '.top-app-bar__action-settings'
    },
    datasetAttrs: {
        notifications: 'badge-count'
    }
});

this.customEvents = {
    click: {
        [this.fieldRender.cssSelectors.navIcon]:       '@menuToggle',
        [this.fieldRender.cssSelectors.searchBtn]:     '@searchClicked',
        [this.fieldRender.cssSelectors.notifications]: '@notificationClicked',
        [this.fieldRender.cssSelectors.settingsBtn]:   '@settingsClicked'
    }
};
```

---

### 3-2. Navigation/Sidebar → 분리 유지

현재 Sidebar는 "항상 보이는 고정 메뉴"다. MD3에서는 이것과 "열고 닫는 서랍"이 별개 컴포넌트다.

```
Navigation/NavigationSidebar (현재 Sidebar 리네이밍)
  Mixin: ListRenderMixin + itemKey
  기능: 항상 표시되는 세로 메뉴, 항목별 활성 상태 관리
  행동: 고정 (열고/닫기 없음)
  이벤트: @menuItemClicked

Navigation/NavigationDrawer (신규)
  Mixin: ListRenderMixin + itemKey + customEvents
  기능: 슬라이드로 열고 닫는 패널 메뉴
  행동: 토글 (data-drawer-state="open"/"closed" + CSS 트랜지션)
  이벤트: @menuItemClicked, @drawerClose
  연동: TopAppBar의 @menuToggle 이벤트로 열림
```

**NavigationDrawer HTML 구조 (설계):**

```html
<div class="nav-drawer" data-drawer-state="closed">
    <div class="nav-drawer__overlay"></div>
    <nav class="nav-drawer__panel">
        <div class="nav-drawer__header">
            <span class="nav-drawer__title">Menu</span>
        </div>
        <div class="nav-drawer__list"></div>

        <template id="nav-drawer-item-template">
            <div class="nav-drawer__item" data-menuid="" data-active="">
                <span class="nav-drawer__item-icon"></span>
                <span class="nav-drawer__item-label"></span>
            </div>
        </template>
    </nav>
</div>
```

**NavigationDrawer CSS 핵심 (설계):**

```css
.nav-drawer[data-drawer-state="closed"] .nav-drawer__panel {
    transform: translateX(-100%);
}
.nav-drawer[data-drawer-state="open"] .nav-drawer__panel {
    transform: translateX(0);
}
.nav-drawer__panel {
    transition: transform 0.3s ease;
}
```

---

### 3-3. Charts — ECharts 접두어 추가

현재 차트 4개의 register.js는 동일한 구조(EChartsMixin + option)이며, option만 다르다.

```
현재                    → 변경
Charts/BarChart/        → Charts/EChartsBar/
Charts/LineChart/       → Charts/EChartsLine/
Charts/PieChart/        → Charts/EChartsPie/
Charts/GaugeChart/      → Charts/EChartsGauge/
```

register.js 변경 없음. 폴더명과 JSDoc만 변경.

향후 다른 라이브러리 차트:
```
Charts/D3Sankey/         ← D3.js 기반 (FlowDiagramMixin 또는 별도)
Charts/D3Treemap/        ← D3.js 기반
Charts/ChartJsRadar/     ← Chart.js 기반
```

---

### 3-4. Tables — Tabulator 접두어 + 형태 구체화

현재 Table의 구현을 분석:

```javascript
applyTabulatorMixin(this, {
    cssSelectors: { container: '.tabular__body' },
    columns: [
        { title: 'ID', field: 'id', width: 80 },
        { title: 'Name', field: 'name', minWidth: 120 },
        { title: 'Status', field: 'status', width: 100 },
        ...
    ]
});
```

- 행 데이터 배열을 받아 표시하는 **데이터 테이블**
- 컬럼 정의, 정렬, 필터 가능 (Tabulator 내장)
- Tabulator가 DOM을 직접 관리 (HTML은 빈 컨테이너만 제공)

```
현재                → 변경
Tables/Table/       → Tables/TabulatorDataTable/
```

Tabulator로 만들 수 있는 다른 테이블 형태:
```
Tables/TabulatorPivot/      ← 피벗 테이블
Tables/TabulatorTreeTable/  ← 트리 + 테이블 조합
Tables/TabulatorEditTable/  ← 인라인 편집 가능 테이블
```

Mixin을 쓰지 않는 테이블 (순수 ListRender):
```
Tables/SimpleTable/         ← ListRenderMixin으로 <tr> 반복 생성
```

---

## 4. 변경 요약

| 현재 경로 | 새 경로 | 성격 변경 |
|----------|---------|----------|
| AppBars/Header | **삭제** — 두 컴포넌트로 분리 | |
| (신규) | AppBars/TopAppBar | 타이틀 + 액션 버튼 (MD3 AppBar) |
| (신규) | Cards/StatusCard | 시스템 정보 표시 (현재 Header의 실제 역할) |
| Navigation/Sidebar | Navigation/NavigationSidebar | 이름만 변경 (고정 메뉴) |
| (신규) | Navigation/NavigationDrawer | 열고/닫는 서랍 메뉴 |
| Charts/BarChart | Charts/EChartsBar | ECharts 접두어 |
| Charts/LineChart | Charts/EChartsLine | ECharts 접두어 |
| Charts/PieChart | Charts/EChartsPie | ECharts 접두어 |
| Charts/GaugeChart | Charts/EChartsGauge | ECharts 접두어 |
| Lists/EventBrowser | Lists/EventBrowser | 변경 없음 ✅ |
| Tables/Table | Tables/TabulatorDataTable | Tabulator 접두어 + 형태 구체화 |

---

## 5. 구현 순서 (제안)

```
Phase 1 — 리네이밍 (기능 변경 없음)
  ① Charts 4개: ECharts 접두어 추가
  ② Tables/Table → TabulatorDataTable
  ③ Navigation/Sidebar → NavigationSidebar
  ④ AppBars/Header → Cards/StatusCard 이동

Phase 2 — 신규 컴포넌트 구현
  ⑤ AppBars/TopAppBar (타이틀 + 액션)
  ⑥ Navigation/NavigationDrawer (열고/닫기 + 트랜지션)
```

---

*최종 업데이트: 2026-03-31*
