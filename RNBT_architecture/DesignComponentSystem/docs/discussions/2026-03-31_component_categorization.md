# Components 범주화 체계

> 날짜: 2026-03-31
> 상태: 확정 — 기존 컴포넌트 재배치 완료
> 근거: Material Design 3 컴포넌트 분류 체계 참조

---

## 1. 배경

컴포넌트 대량 생산을 위해 Components/ 폴더의 범주 체계가 필요하다. 기존 8개 컴포넌트가 평면 나열되어 있었고, 생산량이 늘어나면 어디에 넣을지 판단 기준이 없었다.

### 범주 기준 선택

| 기준 | 장점 | 단점 | 결정 |
|------|------|------|------|
| Mixin 기준 | 기계적 분류 가능 | 하나의 컴포넌트가 여러 Mixin을 사용 | ❌ |
| 용도 기준 | 직관적 | 경계가 모호 (Header = Panel? Navigation?) | ❌ |
| 형태/행동 기준 | Material Design 실증 | 범주 목록이 필요 | ✅ 채택 |

형태/행동 기준: 컴포넌트가 "무엇인가"로 분류한다. "무엇을 위해 쓰이는가"가 아닌.

---

## 2. 3단계 구조

```
Components/
└── [범주]/                    ← 1단계: 형태/행동 분류 (폴더)
    └── [컴포넌트명]/           ← 2단계: 구체적 컴포넌트
        ├── views/
        │   ├── 01_name.html   ← 3단계: 디자인 변형
        │   └── 02_name.html
        ├── styles/
        ├── scripts/
        │   ├── register.js
        │   └── beforeDestroy.js
        └── preview/
```

---

## 3. 범주 목록

Material Design 3의 컴포넌트 분류를 기반으로, 대시보드/디지털트윈 도메인에 맞게 조정.

### 일반 UI 범주 (Material Design 기반)

| 범주 | 설명 | 주요 Mixin | MD3 대응 |
|------|------|-----------|----------|
| AppBars | 앱 상단/하단 바 | FieldRender | App bars |
| Badges | 카운터/알림 표시 | FieldRender | Badges |
| Buttons | 사용자 액션 트리거 | customEvents + CSS | Buttons |
| Cards | 정보를 카드 형태로 표시 | FieldRender | Cards |
| Chips | 태그/필터 항목 | ListRender | Chips |
| Dialogs | 모달 팝업 | ShadowPopup | Dialogs |
| Lists | 데이터 목록 | ListRender | Lists |
| Loading | 로딩/진행률 표시 | FieldRender + styleAttrs | Loading & progress |
| Menus | 드롭다운 메뉴 | ListRender + itemKey | Menus |
| Navigation | 탐색/메뉴 구조 | ListRender + itemKey | Navigation |
| Search | 검색 입력 | FieldRender + customEvents | Search |
| Sheets | 바텀/사이드 시트 | ShadowPopup 변형 | Sheets |
| Sliders | 범위 선택 | customEvents + styleAttrs | Sliders |
| Snackbar | 토스트 알림 | FieldRender + datasetAttrs | Snackbar |
| Switch | ON/OFF 토글 | customEvents + data-state | Switch |
| Tabs | 탭 전환 | ListRender + itemKey | Tabs |
| TextFields | 텍스트 입력 | FieldRender + customEvents | Text fields |
| Toolbars | 액션 바 | FieldRender + customEvents | Toolbars |
| Tooltips | 호버 정보 | ShadowPopup | Tooltips |

### 데이터 시각화 범주 (도메인 확장)

| 범주 | 설명 | 주요 Mixin | MD3 대응 |
|------|------|-----------|----------|
| Charts | 차트 시각화 | EChartsMixin | — |
| Tables | 대화형 테이블 | TabulatorMixin | — |
| Trees | 트리 구조 탐색 | TreeRenderMixin | — |

---

## 4. 기존 컴포넌트 재배치

| 기존 위치 | 새 위치 | 근거 |
|----------|--------|------|
| `Components/Header/` | `Components/AppBars/Header/` | 앱 상단 정보 표시 |
| `Components/Sidebar/` | `Components/Navigation/Sidebar/` | 탐색 메뉴 |
| `Components/BarChart/` | `Components/Charts/BarChart/` | 차트 |
| `Components/LineChart/` | `Components/Charts/LineChart/` | 차트 |
| `Components/PieChart/` | `Components/Charts/PieChart/` | 차트 |
| `Components/GaugeChart/` | `Components/Charts/GaugeChart/` | 차트 |
| `Components/EventBrowser/` | `Components/Lists/EventBrowser/` | 데이터 목록 |
| `Components/Table/` | `Components/Tables/Table/` | 테이블 |

---

## 5. Navigation 하위 구조 (참조: MD3)

```
Navigation/
├── NavigationBar/         ← 가로 하단 탐색 (모바일)
├── NavigationDrawer/      ← 사이드 패널 (= Sidebar)
└── NavigationRail/        ← 세로 아이콘 스트립 (태블릿)

→ 모두 ListRenderMixin + itemKey
→ register.js 동일, HTML/CSS만 다름
```

---

## 6. 범주 판단 기준

새 컴포넌트를 만들 때 어느 범주에 넣을지 판단하는 기준:

```
질문: "이 컴포넌트는 어떤 형태인가?"

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

*최종 업데이트: 2026-03-31*
