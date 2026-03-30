# Mixin 확장 논의

> 날짜: 2026-03-30
> 상태: 진행 중

---

## 1. 논의 배경

새 Mixin 추가 + 이를 바탕으로 컴포넌트 확장을 계획하면서, 기존 구조를 먼저 정확히 파악하고 설계 판단을 검증하는 과정을 기록한다.

---

## 2. 현재 구조 파악

### 2-1. 기존 컴포넌트 유형 (6가지 패턴)

| 유형 | Mixin | 대표 컴포넌트 | 특징 |
|------|-------|-------------|------|
| 단일값 표시 | FieldRender | Header, StatusCards, SystemInfo | cssSelectors key = 데이터 key, textContent 또는 data-* |
| 차트 | ECharts | BarChart, LineChart, PieChart, GaugeChart | 동일 Mixin + 다른 option |
| 반복 목록 | ListRender | EventLog, EventBrowser | `<template>` cloneNode |
| 상태 있는 목록 | StatefulListRender | Sidebar | ListRender + 항목별 상태 변경 |
| 테이블 | Tabulator | Table | 비동기 init → tableBuilt 후 구독 |
| 복합 | ListRender + ShadowPopup | EventBrowser, DeviceList | onCreated 콜백 안에서 팝업 내부에 별도 Mixin 적용 |

### 2-2. 기존 Mixin 분류 (데이터 수신 방식)

| 분류 | Mixin | renderData | 입력 형태 |
|------|-------|-----------|----------|
| 데이터 렌더링 | FieldRender | O | `{ response: { key: value } }` |
| | ListRender | O | `{ response: [{ key: value }, ...] }` |
| | StatefulListRender | O | `{ response: [{ itemKey, ...fields }] }` |
| | ECharts | O | `{ response: { categories, values } }` |
| | Tabulator | O | `{ response: [{ field: value }] }` |
| | HeatmapJs | O | `{ response: { max, points } }` |
| | MeshState | O | `{ response: [{ meshName, status }] }` |
| 명령/제어 | ShadowPopup | X | `show()`, `hide()`, `query()` |
| | CameraFocus | X | `focusOn()`, `focusOnPosition()`, `reset()` |

---

## 3. 설계 판단 검증

### 판단: "어떤 기능을 구현하든, Mixin을 위한 데이터 포맷이 필요하다"

#### 평가 결과

| 항목 | 내용 |
|------|------|
| 방향 | 맞음 |
| 범위 | 과대 — 9개 중 7개에 해당, 2개는 다른 종류의 계약 |
| 실용적 가치 | 높음 |

#### 근거

**renderData 계열 (7/9):** 데이터 포맷이 설계의 시작점이다.

```
mock 서버 → fetchAndPublish → renderData({ response: data })
```

이 경로에서 `data`의 형태가 정의되지 않으면 mock 서버도, 페이지도, Mixin도 만들 수 없다.

**명령/제어 계열 (2/9):** 데이터 포맷이 아니라 메서드 API가 설계의 시작점이다.

- ShadowPopup: `show()`, `hide()` — 데이터를 받아 렌더링하지 않음
- CameraFocus: `focusOn({ meshName, offset })` — 명령 파라미터

#### 보정된 표현

```
원래:  "모든 Mixin에는 데이터 포맷이 필요하다"
보정:  "모든 Mixin에는 입력 계약(input contract)이 필요하다"
       - renderData 계열 → 데이터 포맷이 계약
       - 명령/제어 계열 → 메서드 시그니처가 계약
```

#### 새 Mixin 설계 시 적용

새 Mixin이 어느 계열인지에 따라 첫 번째 설계 대상이 달라진다:

- **데이터를 받아 렌더링하는 Mixin** → 데이터 포맷 먼저 정의
- **명령을 실행하는 Mixin** → 메서드 API 먼저 정의

---

## 4. 디지털 트윈과의 관계

### 4-1. 디지털 트윈이란

물리적 대상의 가상 복제본으로, 실시간 센서 데이터를 통해 물리 세계와 동기화되는 시스템이다.

```
물리적 대상 (건물, 공장, 설비, 도시 등)
    │
    │  센서 / IoT 데이터 (실시간)
    ▼
가상 복제본 (디지털 트윈)
    │
    ├── 현재 상태 모니터링
    ├── 시뮬레이션 / 예측
    └── 제어 명령 → 물리 세계로 피드백
```

일반 시뮬레이션과의 핵심 차이는 **실시간 연결**이다. 시뮬레이션은 사전 정의된 시나리오를 가상에서 실행하지만, 디지털 트윈은 실제 대상과 지속적으로 데이터를 주고받는다.

### 4-2. 웹 기반 디지털 트윈 솔루션의 보편적 기능

| 기능 영역 | 내용 |
|----------|------|
| 실시간 모니터링 | 센서/IoT 데이터를 수집하여 현재 상태를 시각화 |
| 3D/2D 시각화 | 물리적 대상을 3D 모델 또는 2D 도면으로 표현, 상태를 시각적으로 반영 |
| 데이터 통합 | MES, QMS, PLC, IIoT 등 다양한 소스와 연동 |
| 알람/이벤트 | 임계값 초과, 이상 징후 발생 시 알림 |
| 이력 관리 | 시간축 데이터 저장, 과거 상태 조회/비교 |
| AI/분석 | 예측 유지보수, 이상 탐지, 패턴 분석 |
| 시뮬레이션 | 가상 시나리오 실행으로 "만약 ~하면?" 검증 |
| 역할 기반 접근 | 사용자별 권한 관리, 보안 |
| 대시보드 | 핵심 지표(KPI)를 집약하여 의사결정 지원 |

> 출처: [IBM](https://www.ibm.com/think/topics/digital-twin), [McKinsey](https://www.mckinsey.com/featured-insights/mckinsey-explainers/what-is-digital-twin-technology), [Digital Twin Consortium](https://www.digitaltwinconsortium.org/initiatives/the-definition-of-a-digital-twin/), [RT Insights](https://www.rtinsights.com/digital-twins-in-2026-from-digital-replicas-to-intelligent-ai-driven-systems/)

### 4-3. DesignComponentSystem이 이미 다루는 것 / 아직 없는 것

| 구분 | 기능 영역 |
|------|----------|
| 이미 있음 | 대시보드, 차트, 테이블, 실시간 데이터 표시, 3D 메시 상태, 카메라 제어 |
| 아직 없음 | 알람/이벤트 상태 관리, 이력 조회, 시뮬레이션 제어 등 |

---

## 5. 프로젝트 사례 기반 기능 패턴 추출

### 5-1. 조사 대상 도메인

RENOBIT 플랫폼의 실제 구축 사례에서 식별된 도메인:

| 도메인 | 대표 사례 |
|--------|----------|
| 설비관제 | S사 네트워크 설비관제, H사 메가허브 설비관제, H사 차세대 DMS |
| 물리보안/PSIM | S사 통합 물리보안 관제 (2건) |
| 스마트 에너지 | N공사 디지털발전소, L사 전력에너지 관리, AUO 에너지 통합관리 |
| 스마트 방재 | H솔루션 케미칼 스마트방재, D발전사 통합재난안전관리 |
| 스마트 물류 | CJ사 곤지암 Mega-Hub DMS |
| 유역/환경 | H공단 유역하수도 통합정보시스템 |
| 데이터센터 | 대만 재정부 데이터센터, B사 IT센터 수배전반 |
| 스마트빌딩 | Gamania 스마트빌딩 통합관리 |
| IT 인프라 | 국태금융그룹 IT 인프라 통합관리 |
| 철도/교통 | K공사 RAM기반 철도차량 모니터링 |
| 지하전력구 | A사 IoT기반 지하전력구 디지털트윈 |

### 5-2. 도메인별 구체적 기능 (검색 결과 기반)

#### 설비관제

- 설비(PLC/DCS/센서)의 실시간 상태값 수집 및 표시
- 설비별 가동/정지/고장 상태 표현
- 예측 유지보수 (데이터 기반 고장 예측)
- 3D 모델 위에 설비 상태 오버레이
- 설비 계층구조 (사이트 → 건물 → 층 → 설비) 탐색

#### 물리보안/PSIM

- 이기종 보안 시스템(CCTV, 출입통제, 화재경보, 공조) 데이터 통합 표시
- 이벤트 발생 시 위치 기반 알림 + CCTV 자동 연동
- 경보 등급별 분류 (critical/warning/info)
- 보안 이벤트 흐름도(Flow Chart) — 발생 → 확인 → 대응 → 종료
- 구역별 상태 표시 (정상/경계/위험)

#### 스마트 에너지

- 전력 생산량/소비량 실시간 모니터링
- 에너지 소비 예측 (AI 기반)
- 이상 진단 — 비효율 구간 자동 탐지
- 터빈/발전기별 상태 (출력, 진동, 온도) 표시
- 전력 흐름도 시각화 (생산 → 변환 → 배전 → 소비)
- ESG 관련 탄소배출량 지표

#### 스마트 방재

- 센서(가스, 화재연기, 진동) 실시간 수집 및 임계값 경고
- 위험구역 작업자 출입 감지/통제
- 재난 유형별 대응 시나리오 (SOP)
- 지능형 CCTV 영상 연동
- 피난 경로 안내

#### 스마트 물류

- 도크(하역장) 상태 관리 — 점유/가용/예약
- 차량 입출차 현황
- 물량 처리 현황 (입고/피킹/포장/출하)
- 설비 간 실시간 연동 모니터링

#### 유역/환경

- 센서(수위, 유량, 수질) 실시간 표시
- 파이프라인 상태 감시 (핀홀, 누수)
- 침수/재난 경고
- AR 기반 현장 데이터 오버레이

#### 데이터센터(DCIM)

- 서버/스위치/라우터/스토리지 등 장비별 실시간 지표 (CPU, 메모리, 트래픽)
- RACK별 전력 소비 현황 (PDU 모니터링)
- 항온항습기 — 온도/습도 실시간 표시 + 공기흐름도
- 물리적 접근 제어 (출입 이력)
- 에너지 효율 지표 (PUE)

#### 스마트빌딩(BMS)

- HVAC(냉난방/공조) 제어 + 상태 표시
- 조명 제어 (구역별 ON/OFF, 자동 제어)
- 에너지 사용량 분석 (피크 시간 관리)
- 층별/구역별 환경 상태 (온도, 습도, CO2)
- 입출입 보안 관리

#### 철도 차량

- 차량별 운행 상태 모니터링
- RAM 지표 (신뢰성, 가용성, 유지보수성) 대시보드
- 고장 모드 분석 (FMECA)
- 상태 기반 유지보수(CBM) — 시간 기반(TBM)에서 전환
- 3D 디지털트윈 시각화

#### 지하전력구

- 케이블 온도 분포 실시간 감시
- 부분방전 발생 위치 추정
- 침수/화재/비인가 침입 감지 및 경고
- 동적 송전용량 산정
- 구간별 단면도 시각화

### 5-3. 도메인을 관통하는 기능 패턴

위 도메인별 기능에서 반복되는 패턴을 추출한다. 1개 도메인에서만 사용되더라도 기능으로 만든다.

| # | 기능 패턴 | 출현 도메인 | 구체적 행위 |
|---|----------|-----------|-----------|
| A | **경보/알람 관리** | 설비관제, PSIM, 에너지, 방재, 유역, DCIM, 전력구 | 임계값 초과 → 등급 분류(critical/warning/info) → 표시 → 확인/해제 |
| B | **상태 아이콘/색상 전환** | 설비관제, PSIM, 에너지, 물류, BMS, 철도 | 장비/구역의 상태값에 따라 아이콘·색상·배지를 동적 전환 |
| C | **계층 구조 탐색** | 설비관제, PSIM, BMS, DCIM, 유역 | 사이트 → 건물 → 층 → 구역 → 설비의 트리 탐색 + 선택 시 하위 상세 전환 |
| D | **시계열 추이 표시** | 에너지, DCIM, BMS, 철도, 전력구 | 특정 지표의 시간축 변화를 기간 선택과 함께 표시 |
| E | **흐름도/토폴로지 시각화** | 에너지, 설비관제, DCIM, 유역 | 생산 → 변환 → 소비 같은 흐름 경로를 노드-엣지로 시각화 + 각 노드에 실시간 값 |
| F | **구역/영역 상태 맵** | PSIM, BMS, 방재, 물류, DCIM | 2D 평면도 위에 구역별 상태(정상/경계/위험)를 색상으로 오버레이 |
| G | **KPI 집계 카드** | 에너지(ESG), DCIM(PUE), 철도(RAM), 물류 | 핵심 지표를 단일 숫자 + 추이 화살표 + 달성률로 집약 표시 |
| H | **이벤트 타임라인** | PSIM, 방재, 설비관제, 전력구 | 시간순으로 이벤트를 나열 + 각 이벤트의 상태(발생→확인→처리→종료) 추적 |
| I | **임계값 게이지** | 에너지, DCIM, BMS, 전력구 | 현재값을 정상/주의/위험 구간이 표시된 게이지로 시각화 |
| J | **설비/장비 상세 패널** | 전 도메인 공통 | 선택한 설비의 상세 정보(속성, 현재 상태, 이력, 관련 알람)를 패널/팝업으로 표시 |

### 5-4. 추가 기능 패턴 (1~2개 도메인)

5-2에서 열거했지만 A~J에 포함되지 않은 기능을 추가 추출한다.

| # | 기능 패턴 | 출현 도메인 | 구체적 행위 |
|---|----------|-----------|-----------|
| P | **영상 스트리밍 표시** | PSIM, 방재 | CCTV/영상 스트림을 video 요소에 재생 |
| Q | **경로 시각화** | 방재, 유역 | 2D 평면도 위에 피난경로/배관경로를 동적으로 그리고 상태 표시 |
| R | **값의 CSS 속성 시각화** | 물류, 에너지(ESG), DCIM(PUE) | 프로그레스 바/달성률 바 등 값을 style.width 등으로 표현 |
| S | **SOP/단계별 프로세스** | 방재 | 순서가 있는 절차의 진행 상태를 단계별로 표시 |
| T | **토글/스위치 제어** | BMS | 장비의 ON/OFF 상태를 사용자가 직접 변경 |

### 5-5. 기존 Mixin 커버리지 매핑

| 기능 패턴 | 기존 Mixin으로 가능? | 비고 |
|----------|---------------------|------|
| A. 경보/알람 관리 | △ 부분적 | ListRender로 목록 표시는 가능하나, 등급 분류·확인/해제 상태 전환은 미지원 |
| B. 상태 아이콘/색상 전환 | △ 부분적 | FieldRender의 datasetAttrs로 data-* 설정 → CSS 스타일링은 가능하나, 아이콘 교체·SVG 색상 전환은 미지원 |
| C. 계층 구조 탐색 | X | 트리 구조 렌더링 + 확장/축소 + 선택 기능 없음 |
| D. 시계열 추이 표시 | △ 부분적 | EChartsMixin으로 차트는 가능하나, 기간 선택 UI 연동은 조립 코드에서 직접 구현 필요 |
| E. 흐름도/토폴로지 시각화 | X | 노드-엣지 렌더링 + 각 노드에 실시간 값 바인딩 없음 |
| F. 구역/영역 상태 맵 | X | 2D 맵 위 구역별 상태 오버레이 없음 (HeatmapJs는 열분포, MeshState는 3D) |
| G. KPI 집계 카드 | △ 부분적 | FieldRender로 값 표시 가능하나, 추이 화살표·달성률 바·색상 전환 조합은 미지원 |
| H. 이벤트 타임라인 | △ 부분적 | ListRender로 목록 나열 가능하나, 이벤트 상태 전환(발생→확인→처리→종료) 추적은 미지원 |
| I. 임계값 게이지 | O | EChartsMixin의 gauge 타입으로 대응 가능 |
| J. 설비/장비 상세 패널 | O | ShadowPopup + FieldRender/ListRender 복합으로 대응 가능 |

> 출처: [IBM](https://www.ibm.com/think/topics/digital-twin), [한전KDN](https://ns.kdn.com/menu.kdn?mid=a10211050000), [삼성SDS BMS](https://www.samsungsds.com/global/ko/solutions/off/bms/building_mgmt_solution.html), [Schneider DCIM](https://www.se.com/kr/ko/work/solutions/data-centers-and-networks/dcim-software/), [WeMB K공사 사례](https://wemb.co.kr/jp/case/20), [보안뉴스 PSIM](http://www.boannews.com/media/view.asp?idx=28786), [PureStorage DCIM](https://www.purestorage.com/kr/knowledge/what-is-data-center-infrastructure-management.html)

---

## 6. "목적 + 수단" 분해 및 Mixin 경계 판별

### 분석 기준 (COMPONENT_SYSTEM_DESIGN.md에서)

```
- "어떻게?"에 대한 답이 복수 → 아직 목적이지 기능이 아님
- "어떻게?"에 대한 답이 하나로 특정 → 기능 → Mixin 후보
- 같은 목적 + 다른 수단 → 별도 Mixin
- 다른 부분이 옵션으로 분리 가능하면 → 같은 Mixin
- 기능 사이에 응집도가 있으면 → 하나의 Mixin에 담음
```

### 6-1. X (미지원) — 새 Mixin이 필요한 후보

#### C. 계층 구조 탐색

| 항목 | 내용 |
|------|------|
| 목적 | 계층적 데이터를 탐색한다 |
| 수단 | 트리 구조로 렌더링하여 확장/축소/선택한다 |
| "어떻게 계층을 탐색?" | 트리 렌더링 — 하나로 특정됨 → **기능이다** |
| 계열 | renderData (트리 데이터를 받아 렌더링) |
| 기존과의 차이 | ListRender는 flat 배열을 렌더링. 트리는 재귀적 중첩 구조 + 확장/축소 상태 관리가 필요 → **다른 수단** |

```
기대 데이터 형태:
{
  response: [
    {
      id: "site-1", label: "본사", icon: "building",
      children: [
        {
          id: "floor-3", label: "3층", icon: "floor",
          children: [
            { id: "room-301", label: "서버실", icon: "server", status: "normal" },
            { id: "room-302", label: "전기실", icon: "power", status: "warning" }
          ]
        }
      ]
    }
  ]
}
```

**판정: 새 Mixin 필요 → TreeRenderMixin**

핵심 메서드: `renderData`, `expand(id)`, `collapse(id)`, `expandAll()`, `collapseAll()`
이벤트: 노드 선택 시 `@nodeSelected` (customEvents에서 바인딩)

---

#### E. 흐름도/토폴로지 시각화

| 항목 | 내용 |
|------|------|
| 목적 | 데이터의 흐름/연결 관계를 보여준다 |
| 수단 | 노드-엣지 그래프로 시각화하고, 각 노드에 실시간 값을 바인딩한다 |
| "어떻게 흐름을 보여준다?" | 노드-엣지 다이어그램 — 하나로 특정됨 → **기능이다** |
| 계열 | renderData (노드/엣지 데이터를 받아 렌더링) |
| 기존과의 차이 | ECharts는 데이터를 차트로 시각화. 이것은 **관계(엣지)**를 시각화하며, 각 노드가 독립적으로 실시간 값을 갖는다 → **다른 수단** |

```
기대 데이터 형태:
{
  response: {
    nodes: [
      { id: "gen-1", label: "발전기 #1", value: "450MW", status: "normal", x: 100, y: 200 },
      { id: "trans-1", label: "변압기 #1", value: "380kV", status: "normal", x: 300, y: 200 }
    ],
    edges: [
      { from: "gen-1", to: "trans-1", label: "450MW", status: "normal" }
    ]
  }
}
```

**판정: 새 Mixin 필요 → FlowDiagramMixin**

핵심 메서드: `renderData`, `updateNodeValue(id, data)`, `highlightPath(nodeIds)`
구현 수단: SVG 기반 (외부 라이브러리 없이) 또는 Canvas 기반 — 이것은 메커니즘 수준의 선택

---

#### F. 구역/영역 상태 맵

| 항목 | 내용 |
|------|------|
| 목적 | 공간 위의 구역별 상태를 보여준다 |
| 수단 | 2D 평면도(SVG) 위에 구역을 매핑하고, 상태에 따라 색상을 변경한다 |
| "어떻게 구역 상태를 보여준다?" | SVG 평면도의 영역별 fill 색상 변경 — 하나로 특정됨 → **기능이다** |
| 계열 | renderData (구역별 상태 데이터를 받아 SVG에 반영) |
| 기존과의 차이 | MeshState는 3D 메시의 material 색상. 이것은 **2D SVG 영역**의 fill/stroke. HeatmapJs는 연속적 열 분포, 이것은 **이산적 구역**별 상태 → **다른 수단** |

```
기대 데이터 형태:
{
  response: [
    { zoneId: "zone-A", status: "normal", label: "A구역", temperature: 24.5 },
    { zoneId: "zone-B", status: "warning", label: "B구역", temperature: 31.2 },
    { zoneId: "zone-C", status: "critical", label: "C구역", temperature: 42.8 }
  ]
}
```

**판정: 새 Mixin 필요 → ZoneMapMixin**

핵심 메서드: `renderData`, `highlightZone(zoneId)`, `resetHighlight()`
전제: HTML에 SVG 평면도가 포함되어 있고, 각 구역이 `id` 또는 `data-zone-id`로 식별 가능

---

### 6-2. △ (부분 지원) — 기존 Mixin으로 충분한가 판별

#### A. 경보/알람 관리

| 항목 | 내용 |
|------|------|
| 목적 | 경보를 관리한다 |
| 수단 | 경보 목록을 등급별로 표시하고, 각 경보의 상태(발생→확인→해제)를 전환한다 |
| 기존 대안 | StatefulListRenderMixin — 목록 렌더링 + 항목별 상태 변경 |

**기존으로 되는 것:**
- 경보 목록 렌더링 (template 복제) → StatefulListRender의 renderData
- 개별 경보 상태 변경 (data-status="active" → "acknowledged") → StatefulListRender의 updateItemState
- 등급별 CSS 스타일링 (data-severity="critical") → datasetAttrs + CSS

**기존으로 안 되는 것:**
- 등급별 필터링 (critical만 보기, warning 숨기기)
- 경보 카운트 집계 (critical: 3건, warning: 7건)
- 경보 정렬 (최신순, 등급순)

**판정:** StatefulListRender에 **필터/정렬/카운트**를 추가하면 되는가?

→ "필터링한다"와 "목록을 렌더링한다"는 다른 기능이다. 필터/정렬은 **데이터 변환**이지 렌더링이 아니다. 시스템 원칙 5번: "데이터 변환 = Mixin 바깥". 따라서 필터/정렬은 조립 코드(register.js)나 페이지에서 데이터를 가공한 뒤 StatefulListRender에 전달하면 된다.

→ 카운트 집계는 별도의 FieldRender 컴포넌트로 표시할 수 있다.

**결론: 새 Mixin 불필요. StatefulListRender + FieldRender 조합 + 조립 코드에서 필터/정렬**

---

#### B. 상태 아이콘/색상 전환

| 항목 | 내용 |
|------|------|
| 목적 | 상태를 시각적으로 보여준다 |
| 수단 | 상태값에 대응하는 아이콘(이미지/SVG)으로 교체하거나, CSS 클래스를 토글한다 |
| 기존 대안 | StatefulListRenderMixin — 목록 렌더링 + 항목별 상태 변경 |

**기존으로 되는 것:**
- 설비 목록 렌더링 (template 복제) → StatefulListRender의 renderData
- 개별 설비 상태 변경 → updateItemState + data-* + CSS
- 라벨/배지 등 텍스트 필드 → textContent

**기존으로 안 되는 것:**
- `<img>` 태그의 `src` 설정 (상태별 다른 이미지)
- SVG 요소의 `fill` 속성 직접 설정

**분석:**

현재 렌더링 경로는 두 가지뿐이다:
- `datasetAttrs[key]` → `el.setAttribute('data-' + name, value)` — 보이지 않는 데이터
- else → `el.textContent = value` — 보이는 텍스트

`img src`, `svg fill` 같은 **보이는 속성 데이터**를 설정하는 경로가 없다.

**별도 Mixin(IconStateMixin)으로 분리하지 않는 이유:**

1. **데이터 하드코딩 문제** — 설비는 프로젝트마다 다르므로 데이터 기반 생성(배열)이 맞다. cssSelectors에 `'.equipment[data-id="pump1"]'` 같은 데이터 식별자를 하드코딩하는 것은 기존 선택자 계약(구조적 위치만 가리킴)에 위반된다.
2. **이중 생성 또는 비의존 위반** — StatefulListRender가 template 복제로 항목을 생성한다. 별도 Mixin이 같은 항목을 다루려면 (a) 자기도 template 복제를 해야 하거나 (이중 생성), (b) StatefulListRender가 만든 요소에 의존해야 한다 (원칙 8번 위반).
3. **메커니즘 차이일 뿐** — textContent에 넣든, src에 넣든, fill에 넣든 "값을 DOM에 반영한다"는 같은 기능이다. 같은 cssSelectors 순회에서 적용 방식만 다르므로 렌더링 경로 추가가 맞다.

**해결: elementAttrs 옵션으로 렌더링 경로 확장**

사용자가 원하는 속성명을 선언하면 Mixin은 그대로 설정한다:

```javascript
// 확장된 렌더링 경로 (3가지)
if (datasetAttrs[key]) {
    el.setAttribute('data-' + datasetAttrs[key], itemData[key]);  // 보이지 않는 데이터
} else if (elementAttrs[key]) {
    el.setAttribute(elementAttrs[key], itemData[key]);            // 보이는 속성 데이터
} else {
    el.textContent = itemData[key];                                // 보이는 텍스트
}
```

```
사용 예시 (EquipmentStatusBoard — StatefulListRender):

applyStatefulListRenderMixin(this, {
    cssSelectors: {
        container: '.equipment-board__list',
        template:  '#equipment-item-template',
        equipId:   '.equipment__item',
        status:    '.equipment__item',
        icon:      '.equipment__icon',
        label:     '.equipment__label'
    },
    itemKey: 'equipId',
    datasetAttrs: {
        equipId: 'equip-id',
        status:  'status'
    },
    elementAttrs: {
        icon: 'src'
    }
});

데이터: [
    { equipId: 'pump1', status: 'running', icon: '/icons/pump-on.svg', label: 'Pump #1' },
    { equipId: 'pump2', status: 'stopped', icon: '/icons/pump-off.svg', label: 'Pump #2' }
]

결과:
  equipId → data-equip-id="pump1"     (datasetAttrs)
  status  → data-status="running"     (datasetAttrs → CSS가 색상 전환)
  icon    → src="/icons/pump-on.svg"   (elementAttrs)
  label   → textContent="Pump #1"     (기본)
```

**판정: 새 Mixin 불필요. 기존 Mixin의 렌더링 경로에 elementAttrs 추가**

적용 대상: FieldRenderMixin, ListRenderMixin, StatefulListRenderMixin (공통 렌더링 루프를 공유하는 모든 Mixin)

---

#### G. KPI 집계 카드

| 항목 | 내용 |
|------|------|
| 목적 | 핵심 지표를 집약하여 보여준다 |
| 수단 | 현재값 + 추이(↑↓) + 달성률 바 + 상태 색상을 조합 표시 |
| 기존 대안 | FieldRenderMixin |

**기존으로 되는 것:**
- 현재값 표시 → textContent
- 상태 색상 → data-* + CSS

**기존으로 안 되는 것:**
- 달성률 바 (style.width 조작)
- 추이 방향 계산 (이전값 대비 증감)

→ 달성률 바는 `style.width`를 조작해야 한다. FieldRender는 textContent와 data-* 만 다룬다.
→ 추이 방향은 데이터 변환이므로 Mixin 바깥(서버 또는 조립 코드)에서 계산하여 `trend: "up"` 같은 필드로 전달하면, data-trend 속성 + CSS로 화살표 표시 가능.

**분석:**

B(상태 아이콘/색상 전환)에서 동일한 문제를 다뤘다. src/fill 설정이 필요했고, 결론은 "별도 Mixin이 아니라 렌더링 경로 확장(elementAttrs)"이었다. 근거는:

- textContent, data-*, src, fill, style.width 모두 "값을 DOM에 반영한다"는 같은 기능의 메커니즘 차이
- 같은 cssSelectors 순회 안에서 적용 방식만 다름
- 별도 Mixin으로 분리하면 template 이중 생성 또는 Mixin 간 의존 발생

style 조작도 같은 논리가 적용된다. elementAttrs가 `el.setAttribute(attr, value)`라면, styleAttrs는 `el.style[prop] = value + unit`이다. 네 번째 렌더링 경로로 추가하면 된다.

**결론: 새 Mixin 불필요. 기존 Mixin의 렌더링 경로에 styleAttrs 추가**

```javascript
// 확장된 렌더링 경로 (4가지)
if (datasetAttrs[key]) {
    el.setAttribute('data-' + datasetAttrs[key], itemData[key]);   // 보이지 않는 데이터
} else if (elementAttrs[key]) {
    el.setAttribute(elementAttrs[key], itemData[key]);             // 보이는 속성 데이터
} else if (styleAttrs[key]) {
    const { property, unit = '' } = styleAttrs[key];
    el.style[property] = itemData[key] + unit;                     // 보이는 스타일 데이터
} else {
    el.textContent = itemData[key];                                 // 보이는 텍스트
}
```

```
사용 예시 (KPI 카드 — FieldRender):

applyFieldRenderMixin(this, {
    cssSelectors: {
        value:    '.kpi__value',
        trend:    '.kpi__trend',
        progress: '.kpi__progress-bar'
    },
    datasetAttrs: {
        trend: 'trend'
    },
    styleAttrs: {
        progress: { property: 'width', unit: '%' }
    }
});

데이터: { value: '2,450 MWh', trend: 'up', progress: 72 }

결과:
  value    → textContent="2,450 MWh"   (기본)
  trend    → data-trend="up"           (datasetAttrs → CSS가 화살표 전환)
  progress → style.width="72%"         (styleAttrs)
```

---

#### H. 이벤트 타임라인

| 항목 | 내용 |
|------|------|
| 목적 | 이벤트의 시간순 흐름과 상태를 보여준다 |
| 수단 | 시간축 위에 이벤트를 배치하고, 각 이벤트의 상태를 시각화한다 |
| 기존 대안 | StatefulListRenderMixin |

**기존으로 되는 것:**
- 이벤트 목록 렌더링 (시간순 정렬은 서버/페이지가 담당) → renderData
- 개별 이벤트 상태 변경 (발생→확인→처리→종료) → updateItemState + data-*
- 시간축 레이아웃은 CSS로 구현 (timeline 스타일)

**"빨간 전화와 파란 전화" 검증:** 세로 목록으로 보여주든, 시간축 위에 배치하든, **기능(template 복제 + 상태 관리)**은 동일하다. 시각적 차이는 HTML/CSS의 영역이다.

**결론: 새 Mixin 불필요. StatefulListRender + 타임라인 CSS**

---

#### D. 시계열 추이 표시 (참고)

EChartsMixin으로 차트 렌더링은 가능하다. "기간 선택 UI"는 렌더링이 아니라 **사용자 입력 → 데이터 재요청**이므로, 페이지의 이벤트 핸들링(pageEventBusHandlers)에서 처리하는 것이 시스템 원칙에 맞다.

**결론: 새 Mixin 불필요. EChartsMixin + 페이지 이벤트 핸들링**

---

### 6-3. 3D 기능 패턴 — "목적 + 수단" 분해

기존 3D Mixin은 MeshState(색상 변경)와 CameraFocus(카메라 이동) 2개이다.
ModelLoaderMixin은 3D 컴포넌트의 기본 내장이므로 추가 개발 대상이 아니다.

디지털트윈 사례에서 요구되지만 아직 없는 3D 기능을 분석한다.

#### K. 메시 가시성 전환

| 항목 | 내용 |
|------|------|
| 목적 | 3D 장면의 특정 부분을 선택적으로 보여준다 |
| 수단 | 메시의 visible 속성을 토글하여 show/hide한다 |
| "어떻게 선택적으로 보여준다?" | visible 토글 — 하나로 특정됨 → **기능이다** |
| 계열 | 명령/제어 (renderData 없음 — 사용자 조작이나 페이지 핸들러에서 호출) |
| 기존과의 차이 | MeshState는 색상만 변경하고 가시성은 건드리지 않음 → **다른 수단** |

MeshState에 visible 기능을 추가하면 되는가?
→ MeshState의 목적: "데이터를 보여준다 (3D 메시의 시각 상태 변경)"
→ 가시성 전환의 목적: "보여줄 범위를 제어한다"
→ **목적이 다르다** → 별도 Mixin

**판정: 새 Mixin 필요 → MeshVisibilityMixin**

핵심 메서드: `show(meshName)`, `hide(meshName)`, `toggle(meshName)`, `showOnly(meshNames)`, `showAll()`, `hideAll()`

```
사용 예시 — 층별 분리 보기:
  this.meshVisibility.hideAll();
  this.meshVisibility.show('floor-3');

사용 예시 — X-ray 뷰 (외벽 숨기기):
  this.meshVisibility.hide('exterior-wall');
```

---

#### L. 메시 선택/하이라이트

| 항목 | 내용 |
|------|------|
| 목적 | 선택한 대상을 시각적으로 강조한다 |
| 수단 | 메시에 emissive 색상 또는 outline 효과를 적용/해제한다 |
| "어떻게 강조한다?" | emissive/outline — 하나로 특정됨 → **기능이다** |
| 계열 | 명령/제어 (클릭 이벤트 → 하이라이트 적용) |
| 기존과의 차이 | MeshState는 데이터에 따른 material.color 변경. 이것은 **사용자 선택에 따른 시각적 강조** — 목적이 다르다 (상태 표현 vs 선택 피드백) |

MeshState에 하이라이트 기능을 추가하면 되는가?
→ MeshState는 renderData 계열 (데이터 → 색상). 하이라이트는 명령/제어 계열 (사용자 클릭 → 강조).
→ **계열이 다르다** — 데이터 흐름의 방향이 다름
→ 또한 MeshState의 색상과 하이라이트가 동시에 적용되어야 함 (정상 상태 초록색 + 선택 시 발광)
→ 같은 material을 두 Mixin이 독립적으로 조작하려면 별도 채널(color vs emissive)이 필요

**판정: 새 Mixin 필요 → MeshHighlightMixin**

핵심 메서드: `highlight(meshName)`, `unhighlight(meshName)`, `clearAll()`
구현: emissive 채널 사용 (MeshState의 color 채널과 충돌하지 않음)

---

#### M. 3D 라벨/태그 표시

| 항목 | 내용 |
|------|------|
| 목적 | 3D 공간의 특정 위치에 정보를 표시한다 |
| 수단 | 메시 위치에 HTML 라벨(CSS2DRenderer)을 배치하여 실시간 값을 표시한다 |
| "어떻게 3D 위치에 정보를 표시한다?" | CSS2DRenderer 기반 HTML 오버레이 — 하나로 특정됨 → **기능이다** |
| 계열 | renderData (라벨 데이터를 받아 렌더링) |
| 기존과의 차이 | FieldRender는 2D DOM의 textContent. 이것은 **3D 공간 좌표에 고정된 HTML 라벨** → 다른 수단 |

```
기대 데이터 형태:
{
  response: [
    { meshName: "pump-01", label: "72°C", status: "warning" },
    { meshName: "valve-03", label: "정상", status: "normal" },
    { meshName: "tank-01", label: "85%", status: "normal" }
  ]
}

옵션 (apply 시점):
{
  renderer: css2DRenderer,    // CSS2DRenderer 인스턴스
  template: '#label-template', // 라벨 HTML 템플릿
  offset: { x: 0, y: 2, z: 0 } // 메시 위치 대비 오프셋
}
```

**판정: 새 Mixin 필요 → MeshLabelMixin**

핵심 메서드: `renderData`, `showLabel(meshName)`, `hideLabel(meshName)`, `hideAll()`

---

#### N. 3D 애니메이션 재생

| 항목 | 내용 |
|------|------|
| 목적 | 3D 모델의 동작을 재현한다 |
| 수단 | GLTF AnimationClip을 AnimationMixer로 재생/정지/속도 제어한다 |
| "어떻게 동작을 재현한다?" | AnimationMixer 제어 — 하나로 특정됨 → **기능이다** |
| 계열 | 명령/제어 (사용자 조작이나 데이터 상태에 따라 재생/정지) |
| 기존과의 차이 | ModelLoaderMixin이 animation pool을 저장하지만 재생 API는 없음 → 새 기능 |

**판정: 새 Mixin 필요 → AnimationMixin**

핵심 메서드: `play(clipName)`, `stop(clipName)`, `setSpeed(clipName, speed)`, `stopAll()`

---

#### O. 단면 절단 (Clipping)

| 항목 | 내용 |
|------|------|
| 목적 | 3D 모델의 내부를 보여준다 |
| 수단 | ClippingPlane으로 특정 평면 기준 절단면을 표시한다 |
| "어떻게 내부를 보여준다?" | ClippingPlane 제어 — 하나로 특정됨 → **기능이다** |
| 계열 | 명령/제어 (사용자가 절단면 위치/방향 조작) |
| 기존과의 차이 | 기존 3D Mixin 중 유사 기능 없음 |

**판정: 새 Mixin 필요 → ClippingPlaneMixin**

핵심 메서드: `setPlane(axis, position)`, `setPlaneFromPoints(p1, p2, p3)`, `enable()`, `disable()`, `animate(from, to, duration)`

---

### 6-4. 추가 기능 패턴(P~T) — "목적 + 수단" 분해

#### P. 영상 스트리밍 표시

| 항목 | 내용 |
|------|------|
| 목적 | 실시간 영상을 보여준다 |
| 수단 | 영상 스트림(HLS/RTSP/WebRTC)을 `<video>` 요소에 바인딩하여 재생한다 |
| 계열 | renderData (스트림 URL/상태를 받아 재생 제어) |
| 기존과의 차이 | 기존 Mixin은 텍스트/차트/목록/3D를 다룸. 영상 스트림은 없음 → **새 수단** |

**판정: 새 Mixin 필요 → VideoStreamMixin**

핵심 메서드: `renderData`, `play()`, `pause()`, `switchStream(url)`
옵션: `{ cssSelectors: { container: '.video-wrapper' }, protocol: 'hls' | 'webrtc' }`

```
기대 데이터:
{ response: { streamUrl: "wss://...", status: "live", label: "서버실 CCTV #3" } }
```

---

#### Q. 경로 시각화

| 항목 | 내용 |
|------|------|
| 목적 | 공간 위에 경로를 표시한다 |
| 수단 | 2D SVG 위에 경로(polyline/path)를 동적으로 렌더링하고, 상태에 따라 색상/애니메이션 적용 |
| 계열 | renderData (경로 데이터를 받아 SVG에 그림) |
| 기존과의 차이 | ZoneMap은 기존 SVG 영역의 fill 변경(면). 이것은 SVG path를 **동적으로 생성**(선). FlowDiagram은 노드-엣지 다이어그램, 이것은 **지도 위의 좌표 기반 경로** → **다른 수단** |

**판정: 새 Mixin 필요 → PathOverlayMixin**

핵심 메서드: `renderData`, `highlightPath(pathId)`, `clearAll()`
옵션: `{ cssSelectors: { container: '.floor-plan-svg' }, colorMap: { active: '#22c55e', blocked: '#ef4444' } }`

```
기대 데이터:
{
  response: [
    { pathId: "route-1", points: [{ x: 100, y: 200 }, { x: 300, y: 400 }], status: "active", label: "피난경로 A" }
  ]
}
```

---

#### R. 값의 CSS 속성 시각화

| 항목 | 내용 |
|------|------|
| 목적 | 값을 시각적 크기/비율로 보여준다 |
| 수단 | 값에 비례하여 요소의 style 속성(width, height, transform)을 변경한다 |
| 기존 대안 | FieldRenderMixin / StatefulListRenderMixin |

G(KPI 집계 카드)에서 이미 분석 완료. B(상태 아이콘/색상 전환)와 동일한 논리로, style 조작은 "값을 DOM에 반영한다"의 메커니즘 차이이며, styleAttrs 옵션으로 렌더링 경로를 확장하는 것이 맞다.

**판정: 새 Mixin 불필요. 기존 Mixin의 렌더링 경로에 styleAttrs 추가 (G에서 상세 기술)**

---

#### S. SOP/단계별 프로세스 표시

| 항목 | 내용 |
|------|------|
| 목적 | 순서가 있는 절차의 진행 상태를 보여준다 |
| 수단 | 단계 목록을 렌더링하고 현재 단계를 강조 |
| 기존 대안 | StatefulListRenderMixin |

서버/페이지가 각 단계의 상태(완료/진행중/대기)를 계산하여 전달하면, StatefulListRender의 renderData + datasetAttrs로 표현 가능. 원칙 5번: "데이터 변환 = Mixin 바깥".

**결론: 새 Mixin 불필요. StatefulListRender + CSS stepper 시각화**

---

#### T. 토글/스위치 제어

| 항목 | 내용 |
|------|------|
| 목적 | 장비의 상태를 사용자가 직접 변경한다 |
| 수단 | data-* 속성 동기화 + 클릭 시 이벤트 발행 |
| 기존 대안 | FieldRenderMixin + customEvents |

FieldRender로 data-state 설정 → CSS로 토글 시각화, customEvents로 클릭 이벤트 발행 → 페이지 핸들러에서 처리.

**결론: 새 Mixin 불필요. FieldRender + customEvents + CSS**

---

### 6-5. 판별 결과 요약 (2D + 3D + 추가 통합)

#### 2D Mixin — 새로 만드는 것

| 기능 패턴 | Mixin 이름 | 계열 |
|----------|-----------|------|
| C. 계층 구조 탐색 | TreeRenderMixin | renderData |
| E. 흐름도/토폴로지 | FlowDiagramMixin | renderData |
| F. 구역/영역 상태 맵 | ZoneMapMixin | renderData |
| P. 영상 스트리밍 표시 | VideoStreamMixin | renderData |
| Q. 경로 시각화 | PathOverlayMixin | renderData |

#### 2D — 기존 Mixin 렌더링 경로 확장

| 기능 패턴 | 옵션 | 대응 방법 |
|----------|------|----------|
| B. 상태 아이콘/색상 전환 | elementAttrs | `el.setAttribute(attr, value)` — src, fill 등 요소 속성 |
| G. KPI 달성률 바 / R. CSS 속성 시각화 | styleAttrs | `el.style[prop] = value + unit` — width, height 등 스타일 |

#### 2D — 기존 조합으로 대응

| 기능 패턴 | 대응 방법 |
|----------|----------|
| A. 경보/알람 관리 | StatefulListRender + FieldRender |
| H. 이벤트 타임라인 | StatefulListRender + CSS |
| D. 시계열 추이 | EChartsMixin + 페이지 핸들링 |
| S. SOP/단계별 프로세스 | StatefulListRender + CSS stepper |
| T. 토글/스위치 제어 | FieldRender + customEvents + CSS |

#### 3D Mixin — 새로 만드는 것

| 기능 패턴 | Mixin 이름 | 계열 |
|----------|-----------|------|
| K. 메시 가시성 전환 | MeshVisibilityMixin | 명령/제어 |
| L. 메시 선택/하이라이트 | MeshHighlightMixin | 명령/제어 |
| M. 3D 라벨/태그 표시 | MeshLabelMixin | renderData |
| N. 3D 애니메이션 재생 | AnimationMixin | 명령/제어 |
| O. 단면 절단 | ClippingPlaneMixin | 명령/제어 |

---

## 7. 컴포넌트 기능 명세 (새 Mixin + 기존 Mixin 조합)

### 7-1. 2D 컴포넌트

#### 컴포넌트 1. AlarmPanel (경보 패널)

**사용 도메인:** 설비관제, PSIM, 에너지, 방재, DCIM, 전력구
**Mixin:** StatefulListRender(경보 목록 + 상태 전환 + elementAttrs로 등급 아이콘 src) + FieldRender(카운트 요약)

```
topic: alarmList → [{ alarmId, severity, message, source, time, status, icon }, ...]
topic: alarmSummary → { critical: 3, warning: 7, info: 12, total: 22 }
```

사용자 행위: 경보 클릭 → `@alarmSelected`, 확인 버튼 → `@alarmAcknowledged`, 등급 필터 → 조립 코드에서 필터링

#### 컴포넌트 2. EquipmentNavigator (설비 탐색기)

**사용 도메인:** 설비관제, PSIM, BMS, DCIM, 유역
**Mixin:** TreeRender(계층 구조 + elementAttrs로 노드별 상태 아이콘 src)

```
topic: equipmentTree → [{ id, label, type, status, children: [...] }, ...]
```

사용자 행위: 확장/축소, 노드 선택 → `@equipmentSelected` → 다른 컴포넌트 연동

#### 컴포넌트 3. FloorPlanMonitor (평면도 모니터)

**사용 도메인:** PSIM, BMS, 방재, 물류, DCIM
**Mixin:** ZoneMap(구역별 상태 색상) + ShadowPopup(상세 팝업) + FieldRender(팝업 내부)

```
topic: zoneStatus → [{ zoneId, status, label, temperature, humidity }, ...]
HTML 전제: <svg> 안에 <path data-zone-id="zone-A" /> 형태
```

사용자 행위: 구역 클릭 → `@zoneSelected` → 팝업 상세 표시

#### 컴포넌트 4. PowerFlowDiagram (전력 흐름도)

**사용 도메인:** 에너지, 설비관제, DCIM, 유역
**Mixin:** FlowDiagram(노드-엣지 렌더링) + FieldRender(총량 요약)

```
topic: powerFlow → { nodes: [{ id, label, value, status }], edges: [{ from, to, value }] }
topic: powerSummary → { totalGeneration, totalConsumption, efficiency }
```

사용자 행위: 노드 클릭 → `@nodeSelected`, 이상 경로 하이라이트

#### 컴포넌트 5. EquipmentStatusBoard (설비 상태 보드)

**사용 도메인:** 전 도메인 공통
**Mixin:** StatefulListRender(설비 목록 + 상태 전환 + elementAttrs로 아이콘 src) + ShadowPopup(상세 팝업) + FieldRender(팝업 내부)

```
topic: equipmentStatus → [{ equipId, status, icon, label }, ...]
```

사용자 행위: 설비 아이콘 클릭 → `@equipmentClicked` → 상세 팝업

#### 컴포넌트 6. DataCenterRackView (데이터센터 랙 뷰)

**사용 도메인:** DCIM, IT 인프라
**Mixin:** StatefulListRender(슬롯별 장비 + elementAttrs로 장비 아이콘 src) + ECharts(실시간 지표 차트)

```
topic: rackDevices → [{ slotId, deviceName, type, status, cpu, temp }, ...]
topic: deviceMetrics → { categories: [...], values: [[...]] }
```

사용자 행위: 슬롯 선택 → `@deviceSelected` → 하단 차트 전환

#### 컴포넌트 7. SecurityMonitor (보안 관제 모니터)

**사용 도메인:** PSIM, 방재
**Mixin:** VideoStream(CCTV 영상) + ZoneMap(구역 상태) + PathOverlay(피난경로) + StatefulListRender(이벤트 목록)

```
topic: cameraStream → { streamUrl, status, label }
topic: zoneStatus → [{ zoneId, status }, ...]
topic: evacuationRoutes → [{ pathId, points, status, label }, ...]
topic: securityEvents → [{ eventId, type, status, time, source }, ...]
```

사용자 행위: 구역 클릭 → 해당 CCTV 전환, 경보 발생 → 피난경로 자동 표시, 이벤트 클릭 → `@eventSelected`

#### 컴포넌트 8. ProcessProgressPanel (공정 진행 현황)

**사용 도메인:** 물류, 에너지, 설비관제
**Mixin:** StatefulListRender(단계별 항목 + styleAttrs로 프로그레스 바) + FieldRender(요약 수치)

```
topic: processSteps → [{ stepId, label, status, progress }, ...]
topic: processSummary → { completed: 3, total: 5, overallProgress: 60 }
```

사용자 행위: 단계 클릭 → `@stepSelected` → 상세 정보 연동

### 7-2. 3D 컴포넌트

> ModelLoaderMixin은 3D 컴포넌트의 기본 내장. 기존 3D Mixin(MeshState, CameraFocus) + 새 3D Mixin 조합.

#### 컴포넌트 9. FacilityViewer (3D 설비 뷰어)

**사용 도메인:** 설비관제, PSIM, BMS, 에너지, 전력구
**Mixin:** MeshState(상태 색상) + CameraFocus(카메라 이동) + MeshHighlight(선택 강조) + MeshLabel(실시간 라벨)

```
topic: facilityStatus → [{ meshName, status }, ...]
topic: facilityLabels → [{ meshName, label, status }, ...]
```

사용자 행위: 메시 클릭 → `@meshClicked` → 카메라 이동 + 하이라이트 + 상세 연동

#### 컴포넌트 10. BuildingExplorer (3D 건물 탐색기)

**사용 도메인:** BMS, PSIM, 방재, DCIM
**Mixin:** MeshState(구역/층 색상) + MeshVisibility(층별 분리) + ClippingPlane(단면 절단) + CameraFocus(카메라 이동) + MeshHighlight(구역 강조)

```
topic: buildingStatus → [{ meshName, status }, ...]
```

사용자 행위: 층 선택 → 해당 층만 표시 + 카메라 이동, 단면 슬라이더 → 내부 노출, 전체 보기 → 리셋

#### 컴포넌트 11. AnimatedProcessView (3D 공정 애니메이션)

**사용 도메인:** 에너지, 설비관제, 물류
**Mixin:** Animation(재생/정지/속도) + MeshState(상태 색상) + CameraFocus(카메라 이동) + MeshLabel(실시간 RPM/유량)

```
topic: processStatus → [{ meshName, status, rpm, animation, speed }, ...]
```

페이지 핸들러에서 데이터를 MeshState용/Animation용/MeshLabel용으로 분배.

### 7-3. 페이지 구성안

> 페이지는 컴포넌트가 아니다. 여러 컴포넌트를 배치하고 데이터 흐름을 오케스트레이션하는 단위.
> page_scripts/ (before_load.js, loaded.js, before_unload.js)로 구성.

#### 페이지 A. IntegratedDashboard (2D 통합 대시보드)

```
┌────────────────────────────────────────────────────────┐
│  Header (FieldRender)                                   │
├──────────┬─────────────────────────────────┬───────────┤
│ Equipment│  FloorPlanMonitor / FlowDiagram  │ AlarmPanel│
│ Navigator├─────────────────┬───────────────┤           │
│          │ BarChart        │ LineChart     │           │
├──────────┴─────────────────┴───────────────┴───────────┤
│  Table (Tabulator)                                      │
└────────────────────────────────────────────────────────┘
```

연동: Navigator 노드 선택 → FloorPlan 하이라이트 + Chart 데이터 전환 + Table 이력

#### 페이지 B. DigitalTwin3DDashboard (3D 디지털트윈 종합 뷰)

```
┌─────────────────────────────────────────────────────────┐
│  Header (FieldRender)                                    │
├──────────┬──────────────────────────────┬───────────────┤
│ Equipment│  FacilityViewer / Building    │ AlarmPanel    │
│ Navigator│  Explorer (3D)               │               │
├──────────┼───────────────┬──────────────┼───────────────┤
│          │ LineChart     │ GaugeChart   │               │
├──────────┴───────────────┴──────────────┴───────────────┤
│  Table (Tabulator)                                       │
└─────────────────────────────────────────────────────────┘
```

3D↔2D 양방향 연동:
- 3D 메시 클릭 → Navigator 노드 하이라이트 + Chart/Table 데이터 전환 + AlarmPanel 필터
- Navigator 노드 선택 → 3D 카메라 이동 + 하이라이트
- AlarmPanel 경보 선택 → 3D 해당 메시로 이동 + 하이라이트

### 7-4. 컴포넌트-Mixin 매트릭스

#### 2D 컴포넌트

| 컴포넌트 | Field | Stateful | ECharts | Shadow | Tree | Flow | Zone | Video | Path |
|----------|:-----:|:--------:|:-------:|:------:|:----:|:----:|:----:|:-----:|:----:|
| 1. AlarmPanel | O | O | | | | | | | |
| 2. EquipmentNavigator | | | | | O | | | | |
| 3. FloorPlanMonitor | O | | | O | | | O | | |
| 4. PowerFlowDiagram | O | | | | | O | | | |
| 5. EquipmentStatusBoard | O | O | | O | | | | | |
| 6. DataCenterRackView | | O | O | | | | | | |
| 7. SecurityMonitor | | O | | | | | O | O | O |
| 8. ProcessProgressPanel | O | O | | | | | | | |

> elementAttrs, styleAttrs는 별도 Mixin이 아니라 기존 Mixin(Field/List/Stateful)의 옵션이므로 매트릭스 열에 포함하지 않는다. 해당 컴포넌트에서 어떤 옵션을 사용하는지는 각 컴포넌트 명세(7-1, 7-2)를 참조.

#### 3D 컴포넌트

| 컴포넌트 | MeshState | CameraFocus | Highlight | Visibility | Label | Animation | Clipping |
|----------|:---------:|:-----------:|:---------:|:----------:|:-----:|:---------:|:--------:|
| 9. FacilityViewer | O | O | O | | O | | |
| 10. BuildingExplorer | O | O | O | O | | | O |
| 11. AnimatedProcessView | O | O | | | O | O | |

#### 새 Mixin 사용 빈도

| 새 Mixin | 사용 수 | 컴포넌트 |
|----------|--------|---------|
| MeshHighlightMixin | 3 | FacilityViewer, BuildingExplorer, AnimatedProcessView |
| ZoneMapMixin | 2 | FloorPlanMonitor, SecurityMonitor |
| MeshLabelMixin | 2 | FacilityViewer, AnimatedProcessView |
| TreeRenderMixin | 1 | EquipmentNavigator — 통합 대시보드 핵심 네비게이션 |
| FlowDiagramMixin | 1 | PowerFlowDiagram — 에너지/DCIM 핵심 |
| VideoStreamMixin | 1 | SecurityMonitor |
| PathOverlayMixin | 1 | SecurityMonitor |
| MeshVisibilityMixin | 1 | BuildingExplorer — 층별 분리/X-ray 핵심 |
| AnimationMixin | 1 | AnimatedProcessView — 공정 시각화 핵심 |
| ClippingPlaneMixin | 1 | BuildingExplorer — 건물 내부 탐색 핵심 |

#### 기존 Mixin 렌더링 경로 확장

| 옵션 | 역할 | 적용 대상 |
|------|------|----------|
| elementAttrs | 요소 속성 설정 (src, fill 등) | FieldRender, ListRender, StatefulListRender |
| styleAttrs | 스타일 속성 설정 (width, height 등) | FieldRender, ListRender, StatefulListRender |

---

## 8. 전수 커버리지 검증

5-2의 모든 도메인 기능(36개)이 기존 Mixin(9개) + 새 Mixin(10개) + 기존 Mixin 확장(elementAttrs, styleAttrs) + 기존 조합으로 커버되는지 검증한다.

| 도메인 기능 | 대응 | Mixin/조합 |
|------------|------|-----------|
| 실시간 상태값 표시 | 기존 | FieldRender |
| 설비별 가동/정지/고장 상태 | 기존 확장 | StatefulListRender + elementAttrs (아이콘 src) + CSS (상태 색상) |
| 예측 유지보수 | 기존 | ECharts + Tabulator (UI 표현) — AI는 서버 영역 |
| 3D 설비 상태 오버레이 | 기존 | MeshState |
| 설비 계층 탐색 | 새 | TreeRender |
| 이기종 데이터 통합 표시 | 기존 | FieldRender + Tabulator |
| CCTV 영상 연동 | 새 | VideoStream |
| 경보 등급 분류/상태 전환 | 기존 조합 | StatefulListRender + FieldRender + elementAttrs (등급 아이콘 src) |
| 이벤트 흐름도 | 새 | FlowDiagram |
| 구역별 상태 표시 | 새 | ZoneMap |
| 전력 생산/소비 모니터링 | 기존 | FieldRender + ECharts |
| 에너지 소비 예측 | 기존 | ECharts (UI 표현) — AI는 서버 영역 |
| 이상 진단 | 기존 조합 | StatefulListRender + ECharts |
| 터빈/발전기별 상태 | 기존 확장 | StatefulListRender + elementAttrs (상태 아이콘 src) + FieldRender |
| 전력 흐름도 시각화 | 새 | FlowDiagram |
| ESG 탄소배출량 지표 | 기존 확장 | FieldRender + styleAttrs (달성률 바) |
| 센서 임계값 경고 | 기존 조합 | StatefulListRender (경보) |
| 위험구역 출입 감지 | 새 + 기존 | ZoneMap + StatefulListRender (경보) |
| 대응 시나리오(SOP) | 기존 조합 | StatefulListRender + CSS stepper |
| CCTV 영상 연동(방재) | 새 | VideoStream |
| 피난 경로 안내 | 새 | PathOverlay |
| 도크 상태 관리 | 새 + 기존 | ZoneMap 또는 StatefulListRender |
| 차량 입출차 현황 | 기존 | ListRender |
| 물량 처리 현황 | 기존 확장 | StatefulListRender + styleAttrs (진행률 바) |
| 파이프라인 상태 감시 | 새 | FlowDiagram 또는 ZoneMap |
| AR 오버레이 | — | 플랫폼 외부 영역 (대상 아님) |
| 공기흐름도 | 새 | FlowDiagram |
| 물리적 접근 제어 (출입 이력) | 기존 | ListRender / Tabulator |
| HVAC/조명 제어 | 기존 조합 | FieldRender + customEvents + CSS |
| 에너지 사용량 분석 | 기존 | ECharts |
| 고장 모드 분석(FMECA) | 기존 | Tabulator + ECharts |
| 상태 기반 유지보수(CBM) | 기존 | ECharts + Tabulator — 데이터/AI는 서버 영역 |
| 부분방전 위치 추정 | 새 + 기존 | ZoneMap 또는 MeshState (3D) |
| 동적 송전용량 산정 | 기존 | FieldRender (계산은 서버 영역) |
| 구간별 단면도 | 새 | ClippingPlane (3D) |
| 장비별 실시간 지표 | 기존 | FieldRender + ECharts |

**결과: AR 오버레이 1건 제외, 35/36 기능을 커버.**

서버/AI 영역(예측, 이상 진단, CBM 등)은 UI 표현이 기존 Mixin(ECharts, Tabulator)으로 가능하며, 실질적 로직은 서버 측 책임이다.

---

## 9. 다음 단계

### 새 Mixin 총 10개 확정

#### 2D (5개)

| # | Mixin | 계열 |
|---|-------|------|
| 1 | TreeRenderMixin | renderData |
| 2 | FlowDiagramMixin | renderData |
| 3 | ZoneMapMixin | renderData |
| 4 | VideoStreamMixin | renderData |
| 5 | PathOverlayMixin | renderData |

#### 3D (5개)

| # | Mixin | 계열 |
|---|-------|------|
| 6 | MeshVisibilityMixin | 명령/제어 |
| 7 | MeshHighlightMixin | 명령/제어 |
| 8 | MeshLabelMixin | renderData |
| 9 | AnimationMixin | 명령/제어 |
| 10 | ClippingPlaneMixin | 명령/제어 |

### 기존 Mixin 렌더링 경로 확장 2건

| 옵션 | 역할 | 적용 대상 |
|------|------|----------|
| elementAttrs | 요소 속성 설정 — `el.setAttribute(attr, value)` (src, fill 등) | FieldRender, ListRender, StatefulListRender |
| styleAttrs | 스타일 속성 설정 — `el.style[prop] = value + unit` (width, height 등) | FieldRender, ListRender, StatefulListRender |

### 새 컴포넌트 11개 + 페이지 구성안 2개

- [ ] 각 Mixin의 상세 명세(입력 계약, 메서드, 라이프사이클) 작성
- [ ] 기존 Mixin 렌더링 경로 확장(elementAttrs, styleAttrs) 명세 및 구현
- [x] 컴포넌트 기능 명세 작성 (섹션 7)
- [x] 전수 커버리지 검증 (섹션 8)
- [ ] Mixin 구현
- [ ] 컴포넌트 구현
- [ ] 페이지 구성안 구현

---

*최종 업데이트: 2026-03-30*
