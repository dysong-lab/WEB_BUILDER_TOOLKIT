# 컴포넌트 가이드

## 컴포넌트를 만드는 기준

**"이 컴포넌트의 시각적 형태가 무엇인가."**

시각적 형태가 기존 컴포넌트와 다르면 새 컴포넌트다. 같으면 기존 컴포넌트의 디자인 변형(views/styles)으로 추가한다.

기능(Mixin)은 컴포넌트를 나누는 기준이 아니다. 같은 Mixin을 사용하더라도 시각적 형태가 다르면 다른 컴포넌트다.

---

## 범주 체계

Material Design 3의 형태/행동 기반 분류를 채택하여, 컴포넌트를 범주별로 정리한다.

> 상세: [component_categorization.md](../docs/discussions/2026-03-31_component_categorization.md) 참조

### 3단계 구조

```
Components/
└── [범주]/                    ← 형태/행동 분류 (폴더)
    └── [컴포넌트명]/           ← 구체적 컴포넌트
        ├── views/             ← 디자인 변형
        ├── styles/
        ├── scripts/           ← 조립 코드 (불변)
        └── preview/
```

### 범주 판단

새 컴포넌트를 만들 때: **"이 컴포넌트는 어떤 형태인가?"**

```
목록이다      → Lists/
표다          → Tables/
차트다        → Charts/
트리다        → Trees/
팝업이다      → Dialogs/ 또는 Sheets/
탐색 메뉴다   → Navigation/
탭이다        → Tabs/
카드다        → Cards/
알림이다      → Snackbar/
상단 바다     → AppBars/
버튼이다      → Buttons/
검색이다      → Search/
토글이다      → Switch/
진행률이다    → Loading/
```

---

## 범주 목록

### 일반 UI (Material Design 기반)

| 범주 | 설명 | 주요 Mixin | 구현 컴포넌트 |
|------|------|-----------|-------------|
| AppBars | 앱 상단/하단 바 | FieldRender | TopAppBar |
| Badges | 카운터/알림 표시 | FieldRender | — |
| Buttons | 사용자 액션 | customEvents + CSS | — |
| Cards | 정보 카드 | FieldRender | StatusCard |
| Chips | 태그/필터 | ListRender | — |
| Dialogs | 모달 팝업 | ShadowPopup | — |
| Lists | 데이터 목록 | ListRender | EventBrowser |
| Loading | 로딩/진행률 | FieldRender + styleAttrs | — |
| Menus | 드롭다운 메뉴 | ListRender + itemKey | — |
| Navigation | 탐색 메뉴 | ListRender + itemKey | NavigationDrawer, NavigationSidebar |
| Search | 검색 입력 | FieldRender + customEvents | — |
| Sheets | 바텀/사이드 시트 | ShadowPopup | — |
| Sliders | 범위 선택 | customEvents + styleAttrs | — |
| Snackbar | 토스트 알림 | FieldRender + datasetAttrs | — |
| Switch | ON/OFF 토글 | customEvents + data-state | — |
| Tabs | 탭 전환 | ListRender + itemKey | — |
| TextFields | 텍스트 입력 | FieldRender + customEvents | — |
| Toolbars | 액션 바 | FieldRender + customEvents | — |
| Tooltips | 호버 정보 | ShadowPopup | — |

### 데이터 시각화 (도메인 확장)

| 범주 | 설명 | 주요 Mixin | 구현 컴포넌트 |
|------|------|-----------|-------------|
| Charts | 차트 시각화 | EChartsMixin | EChartsBar, EChartsLine, EChartsPie, EChartsGauge |
| Tables | 대화형 테이블 | TabulatorMixin | TabulatorDataTable |
| Trees | 트리 구조 | TreeRenderMixin | — |

---

## 디자인 변형의 조건

같은 register.js로 여러 디자인이 동작한다. 조건:

- cssSelectors의 VALUE에 해당하는 요소가 HTML에 존재할 것
- datasetAttrs의 data 속성은 renderData가 설정하므로 HTML에 미리 적을 필요 없음
