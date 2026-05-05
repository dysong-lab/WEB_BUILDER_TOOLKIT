# Aircon_Ceiling01 — Advanced/indoorUnitTemperature

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'airConditioner' Mesh 색상 변경 (Standard 승계, `material.color` 채널)
2. **모드/설정온도 HUD** — Aircon mesh의 월드 좌표를 카메라 projection으로 화면 좌표로 변환하여, 이를 따라가는 absolute-position된 DOM 카드에 **운전 모드(냉방/난방/송풍/제습)·설정온도(℃)·실내온도(℃)** 정보를 실시간 표시. (#41 OHU103/outdoorUnitPerformance 답습)
3. **실내온도 시계열 mini-chart (HUD 카드 내 DOM 차트)** — ECharts가 HUD 카드 안의 `<div class="aircon-chart">` 컨테이너에 직접 line chart를 렌더링. 카드와 함께 mesh를 따라다니지만 본질적으로 DOM이라 픽셀 정확 + 정면 고정 + 카메라 줌·각도와 무관한 가독성 보장.
4. **외부 명령형 API** — 페이지가 `instance.indoorUnitTemperature.setMode/setSetpoint/setIndoorTemp/pushTempPoint/setData/setOffset/showHud/hideHud/showChart/hideChart/show/hide/start/stop/destroy/...`를 직접 호출하여 HUD/차트 갱신.

> **차트 채널 디자인 결정 — Plane texture 채택 철회**: 초기에는 ECharts canvas → THREE.CanvasTexture → PlaneGeometry mesh.material.map ("CanvasTextureChartMixin 1번째 채택")로 구현했으나, 실 운영에서 (a) texture 보간으로 흐릿, (b) 비스듬한 카메라 각도에서 가독성 급락, (c) 카메라 줌/회전 시 차트 크기 일관성 부재, (d) 천장형 위에 차트 plane이 떠있는 UX 부자연 이라는 결함이 명백. DOM 차트로 전환. plane texture 신기법은 차후 진짜 3D 공간 데이터 시각화가 필요한 컴포넌트(예: 건물 단면도 위 zone heatmap)에서 채택 권장 — 본 변형은 후보에서 제거.

---

## airConditioner mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/Aircon_Ceiling01/01_default/Aircon_Ceiling01.gltf` |
| GLTF 구조 | `root` → `airConditioner` (Mesh Node, mesh 0) — 단일 자식, 단일 mesh × 단일 primitive |
| 추적 대상 mesh 이름 | `airConditioner` (Standard와 동일, 단일 리프 Mesh) |
| 결정 | **단일 mesh — 본체 통합** — 개별 단위(1 GLTF = 1 Mesh) 패턴 |

근거: `Aircon_Ceiling01.gltf`의 `nodes` 배열은 `root` + 자식 1개 `airConditioner`(mesh 0)만 존재. 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`과 일치. HUD 카드 추적 좌표 + 미니차트 plane 부착 기준 좌표 모두 동일 mesh의 월드 좌표를 사용한다. 페이지 운영에서 다른 자식 mesh로 전환이 필요하면 `setMeshName` 1회 호출로 변경 가능.

---

## 답습 모범 — #41 OHU103/outdoorUnitPerformance + HUD 카드 내 ECharts mini-chart

본 변형은 **#41 OHU103/Advanced/outdoorUnitPerformance**의 HUD 추적 패턴을 답습하면서, HUD 카드 안의 mini-chart row에 ECharts를 직접 init하는 단순한 DOM 차트 결합을 채택한다. 회전 채널은 사용하지 않는다(실내기는 회전 없음). 초기 사이클에서 Plane texture(ECharts canvas → CanvasTexture → PlaneGeometry mesh) 신기법을 시도했으나 결함 발견 후 본 방식으로 전환 — 자세한 디자인 결정은 위 "기능 정의 #3" 인용 참조.

| 답습 | 항목 |
|------|------|
| `#41 OHU103/Advanced/outdoorUnitPerformance` | **HUD 추적·setData·외부 주입 자원 패턴 답습** (mesh.getWorldPosition + camera.project + canvasRect/hudRect 보정 + DOM carry-along) |
| `#13 BATT/Advanced/dataHud` | HUD 라벨 매핑 패턴 (간접 — #41이 답습한 원본) |
| `Mixins/EChartsMixin.js` | ECharts init / setOption / dispose 호출 흐름 학습 (단, 본 변형은 EChartsMixin을 적용하지 **않고** raw `echarts.init`만 직접 사용 — chart 컨테이너가 `instance.appendElement`(Object3D) 자손이 아니라 `_hudRoot` 안의 카드 내부 div이고 카드 발견 시점이 lazy해야 하므로 EChartsMixin의 자동 부착 규약과 어긋남) |

### #41 OHU103과의 차이

| 항목 | #41 OHU103/outdoorUnitPerformance | 본 변형 (#42 Aircon_Ceiling01/indoorUnitTemperature) |
|------|----------------------------------|---------------------------------------------------|
| Mixin 조합 | MeshState + FieldRender | **MeshState + FieldRender** (동일) |
| 회전 채널 | mesh.rotation[axis] (RPM) | **없음** (실내기는 회전 안 함) |
| HUD 채널 | DOM (압력/토출온도/state) | **DOM (모드/설정온도/실내온도/state)** |
| **차트 channel** | 없음 | **HUD 카드 내 DOM mini-chart (ECharts → `<div class="aircon-chart">`에 직접 init)** |
| 자동 데모 데이터 | 1.85 MPa, 78℃ | **mode='cooling', setpoint=24, indoor=28, 시계열 5포인트** |
| 두 RAF | 회전 + HUD 좌표 | **HUD 좌표 (회전 없음, 차트는 변경 시 lazy 갱신)** |

실내기(IDU — Indoor Unit) 일반:
- **운전 모드**: 냉방(cooling) / 난방(heating) / 송풍(fan) / 제습(dry)
- **설정온도**: 18~30℃ (사용자 입력)
- **실내온도**: 16~32℃ 운전 범위
- **시계열 mini-chart**: 최근 N개 측정점(예: 최근 1시간 5분 단위 → 12 포인트)

> 자동 데모 정책: register.js는 자동 setMode/setSetpoint를 호출하지 않는다. preview에서 마운트 직후 setMode('cooling') + setSetpoint(24) + setIndoorTemp(28) + setData(5 포인트 시계열)을 호출하여 시각 관찰 보장.

**큐 설명 (#42)**: "모드/설정온도 HUD + 실내온도 미니차트 (MeshState+ECharts+커스텀 메서드)"

**실제 채택**: MeshStateMixin + FieldRenderMixin(선택자 계약 컨테이너) + 커스텀 메서드 `this.indoorUnitTemperature` (#41 HUD 답습 + HUD 카드 내 ECharts mini-chart — 신규 Mixin **없음**)

### Mixin 승격 메모 (필수)

> **`CanvasTextureChartMixin` 채택 철회 — 본 변형이 첫 사례였으나 사이클 내에서 결함 발견 후 DOM 차트로 전환.** ECharts canvas → THREE.CanvasTexture → PlaneGeometry mesh.material.map 매핑은 (a) texture 보간으로 차트가 흐릿, (b) 비스듬한 카메라 각도에서 가독성 급락, (c) 카메라 줌/회전 시 차트 크기 일관성 부재, (d) 천장형 모델 위에 차트 plane이 떠있는 UX 부자연 의 결함이 명백. 신기법 자체의 가능성은 보존되나 본 컴포넌트는 후보에서 제거. 차후 진짜 3D 공간 데이터 시각화가 필요한 컴포넌트(예: 건물 단면도 위 zone heatmap, 실외 공간 분포도)에서 1번째 채택으로 다시 검토.
>
> **`MeshTrackingHudMixin` 승격 10번째 채택 — 임계점 명백히 초과 누적**: setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` + `addAnchorTarget/removeAnchorTarget` 외부 주입 자원 패턴이 10개 컴포넌트에서 동일. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 메인 외부에서 즉시 승격 강력 권장.

- **승격 후보 이름**: `MeshTrackingHudMixin`(HUD)
- **본 변형의 단일 통합 네임스페이스 정당화**: HUD 카드와 그 안의 mini-chart가 단일 도메인(실내기 온도 표시)에 종속되고 페이지가 동시 호출(`setMode`/`setSetpoint`/`setIndoorTemp`/`pushTempPoint`)하므로 단일 `indoorUnitTemperature` 네임스페이스로 통합. 차트가 카드의 일부이므로 별도 라이프사이클 분리 불필요.

---

## 구현 명세

### Mixin

MeshStateMixin + FieldRenderMixin (선택자 계약 컨테이너) + 커스텀 메서드 `this.indoorUnitTemperature` (신규 Mixin 없음 — #41 HUD 답습 + HUD 카드 내 ECharts mini-chart)

> **FieldRender의 역할 분담**: 3D 컴포넌트의 `instance.appendElement`는 THREE.Object3D이므로 `appendElement.querySelector`가 동작하지 않는다. 따라서 `this.fieldRender.renderData`를 그대로 구독하지 **않고**, FieldRenderMixin이 주입한 `cssSelectors`/`datasetAttrs` 선택자 계약만 활용한다. DOM 카드 내부 sub 요소 갱신은 커스텀 `setMode/setSetpoint/setIndoorTemp`가 수행한다 (#41 OHU103/outdoorUnitPerformance 답습).

> **EChartsMixin을 사용하지 않는 이유**: EChartsMixin은 `instance.appendElement.querySelector(container)`로 차트 컨테이너를 찾는다. 본 변형의 차트 컨테이너(`.aircon-chart`)는 `instance.appendElement`(THREE.Object3D)가 아니라 페이지가 마운트한 `_hudRoot` 안의 `_cardEl` 자손이다. 차트 init 시점이 카드 마운트(또는 카드 발견) 이후로 지연되어야 하므로 EChartsMixin의 자동 부착 규약과 어긋난다 — `findCardEl()`을 통한 lazy init이 필요해서 raw `echarts.init`만 직접 사용한다.

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습)

### cssSelectors (FieldRenderMixin) — HUD 카드 내부 sub 요소

| KEY | VALUE | 용도 |
|-----|-------|------|
| mode | `.aircon-mode` | 운전 모드 한글 라벨 (textContent) |
| modeKey | `.aircon-mode-icon` | 모드 키 (data-mode — CSS 색상/아이콘 분기) |
| setpoint | `.aircon-setpoint` | 설정온도(℃) (textContent) |
| indoorTemp | `.aircon-indoor-temp` | 실내온도(℃) (textContent) |
| stateLabel | `.aircon-state-label` | 동작 상태 라벨 (textContent) |
| state | `.aircon-state` | 상태 키 (data-state — CSS 색상 분기) |

### datasetAttrs (FieldRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| modeKey | `mode` | `<.aircon-mode-icon>` 요소에 `data-mode="<key>"` 부여 |
| state | `state` | `<.aircon-state>` 요소에 `data-state="<status>"` 부여 |

### 채널 직교성 정책

**원칙**: 세 채널은 완전 직교 — 색상, HUD DOM 좌표, FieldRender 선택자 계약은 서로 간섭하지 않는다. (mini-chart는 HUD 카드의 일부라 별도 채널이 아님)

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` | 데이터 상태 색상 (Standard 승계) |
| indoorUnitTemperature (HUD) | DOM (`_cardEl.style.transform`) | 월드 → 화면 projection 매 프레임, 카드 carry-along (카드 안에 mini-chart 포함) |
| FieldRenderMixin | (선택자 계약만 주입) | DOM textContent / data-attr 적용 분기 규칙 |

### ECharts mini-chart 핵심 패턴 (HUD 카드 내 직접 init)

```
// 1) HUD 카드 마운트 후 카드 내 chart 컨테이너 lazy 발견
const cardEl = findCardEl();                                    // _hudRoot 안의 [data-mesh-name="airConditioner"]
const chartHost = cardEl.querySelector('.aircon-chart');        // 카드 내부 컨테이너

// 2) ECharts init (canvas renderer, devicePixelRatio 자동 적용)
_chart = echarts.init(chartHost, null, { renderer: 'canvas' });
_chart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 6, right: 6, top: 10, bottom: 6 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: [...] },
    yAxis: { type: 'value', show: false, scale: true },
    series: [{ type: 'line', smooth: true, symbol: 'none', lineStyle: {color:'#60a5fa', width:2}, areaStyle: {...}, data: [...] }],
    animation: false
});

// 3) 데이터 갱신 시
_chart.setOption(buildChartOption());                           // ECharts가 직접 DOM에 그림 (texture 변환 없음)
```

차트는 카드의 일부이므로 카드의 위치/크기/visibility를 따라가며, 별도의 3D scene graph 부착이 필요 없다. ECharts는 devicePixelRatio를 자동 적용해 HD 화면에서도 픽셀 정확.

### 커스텀 네임스페이스 `this.indoorUnitTemperature`

| 메서드 | 동작 |
|--------|------|
| `setMode(modeKey)` | 운전 모드 설정 ('cooling'/'heating'/'fan'/'dry'). HUD 라벨/data-mode 갱신 |
| `setSetpoint(temp)` | 설정온도 갱신. HUD 카드 sub 요소 갱신 |
| `setIndoorTemp(temp)` | 실내온도 갱신. HUD 카드 sub 요소 갱신 |
| `pushTempPoint({ time, value })` | 시계열에 1포인트 푸시. ECharts setOption으로 차트 갱신. 최대 maxPoints(기본 12) 유지 |
| `setData({ categories, values })` | 시계열 일괄 교체. ECharts setOption으로 차트 갱신 |
| `setMaxPoints(n)` | 시계열 최대 포인트 수 (기본 12) |
| `setOffset({ x, y })` | DOM HUD 카드의 mesh 화면 좌표 기준 픽셀 오프셋 |
| `addAnchorTarget(obj)` / `removeAnchorTarget(obj)` | HUD anchor 계산에 포함할 추가 요소 등록/해제 (페이지가 모델 위에 부착한 외부 요소 대응) |
| `showHud()` / `hideHud()` | HUD 카드만 표시/숨김 (차트 컨테이너는 카드 안에 있으므로 함께 토글됨) |
| `showChart()` / `hideChart()` | 카드 내 mini-chart 컨테이너만 별도 토글 (HUD 라벨은 유지) |
| `show()` / `hide()` | HUD 카드 전체 표시/숨김 (호환 유지) |
| `setMeshName(name)` | 추적 대상 mesh 변경 (기본 'airConditioner') |
| `start()` | HUD RAF 시작 + 차트 1회 렌더 |
| `stop()` | HUD RAF stop |
| `getMode()` / `getSetpoint()` / `getIndoorTemp()` / `getSeries()` | 현재 상태 조회 |
| `destroy()` | HUD RAF cancel + chart.dispose() + 외부 자원 null + 마지막 줄 `this.indoorUnitTemperature = null` (self-null) |

#### 외부 주입 자원 (페이지 책임 — #41 답습)

| 자원 | 의미 |
|------|------|
| `instance.indoorUnitTemperature._renderer` | THREE.WebGLRenderer (HUD canvas 좌표 산출용) — 기본값 `wemb.threeElements.renderer` |
| `instance.indoorUnitTemperature._camera` | THREE.Camera (월드→화면 projection용) — 기본값 `wemb.threeElements.camera` |
| `instance.indoorUnitTemperature._hudRoot` | absolute-position된 DOM 컨테이너 (페이지가 마운트한 overlay div, 카드 안에 `.aircon-chart` 컨테이너 포함) |

#### dispose 순서 (DOM 차트 전환 후 단순화)

```
1) HUD RAF cancel              ← 좌표 갱신 중단
2) _chart.dispose()            ← ECharts 인스턴스 해제 (canvas DOM은 카드의 일부 — 페이지가 카드 마운트해제 시 함께 사라짐)
3) 외부 자원 null + _anchorTargets.length = 0
4) this.indoorUnitTemperature = null (self-null)
```

> Plane texture 채택 시기에는 ECharts canvas / THREE.CanvasTexture / PlaneGeometry / chartHost div 4개 자원의 의존성 역순 9단계가 필요했으나, DOM 차트로 전환 후 ECharts 단일 자원만 남아 4단계로 단순화. canvas DOM은 HUD 카드의 자식이므로 카드 마운트해제(페이지 책임)와 함께 자연 정리된다.

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| meshName | 'airConditioner' | Standard 동일 |
| 자동 데모 mode (preview) | 'cooling' (냉방) | preview 가시성 |
| 자동 데모 setpoint (preview) | 24 | 일반 냉방 설정값 |
| 자동 데모 indoorTemp (preview) | 28 | 설정 24 vs 실내 28 — 가동 중 시각 관찰 |
| 자동 데모 시계열 (preview) | [29.5, 29.0, 28.7, 28.3, 28.0] | 5 포인트 — 냉방 가동에 의한 하강 곡선 (시각 관찰) |
| chartCanvas size | 256 × 128 px | ECharts 렌더 해상도 |
| planeWidth × planeHeight | 1.5 × 0.75 (THREE units) | 실내기 옆에 시각 관찰 가능 크기 |
| chartPosition | { x: 0, y: 0.6, z: 0 } | 모델 위쪽으로 약간 띄움 (모델 크기 환경에 맞춰 조정) |
| maxPoints | 12 | 최근 1시간 5분 단위 12 포인트 |
| HUD setOffset (preview) | { x: 0, y: -32 } | 카드를 mesh 위로 띄움 |
| autoStart on mount | false | 페이지가 명시적 start() 호출 (HUD 부터 — `_hudRoot` 주입 후) |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

모드/설정온도/실내온도/시계열은 별도 토픽이 아니라 페이지가 외부 트리거로 `instance.indoorUnitTemperature.setMode/setSetpoint/setIndoorTemp/pushTempPoint`를 직접 호출한다 (#13/#21/#24/#25/#26/#41 동일 외부 명령형 규약).

### 이벤트 (customEvents)

없음. 개별 단위(meshName='airConditioner' 확정).

### 라이프사이클

- `register.js`: MeshStateMixin + FieldRenderMixin 적용 + `this.indoorUnitTemperature` API 등록 + 기본값 시드 + equipmentStatus 구독. ECharts init은 lazy (start 시점에 카드 발견 후 init).
- 페이지가 `_hudRoot`/`_renderer`/`_camera` 주입 후 `start()` → HUD RAF 시작 + 카드 내 `.aircon-chart` div에 ECharts init + 1회 setOption.
- 페이지가 `setMode/setSetpoint/setIndoorTemp/pushTempPoint`로 데이터 갱신.
- `beforeDestroy.js`: 구독 해제 → `this.indoorUnitTemperature?.destroy()` (HUD RAF + chart/texture/plane/host 모두 dispose) → `this.fieldRender?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/indoorUnitTemperature |
|------|----------|--------------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `applyFieldRenderMixin` | ✗ | ✓ (선택자 계약 컨테이너) |
| `this.indoorUnitTemperature` 네임스페이스 | 없음 | `setMode/setSetpoint/setIndoorTemp/pushTempPoint/setData/setMaxPoints/setOffset/addAnchorTarget/removeAnchorTarget/showHud/hideHud/showChart/hideChart/show/hide/setMeshName/start/stop/getMode/getSetpoint/getIndoorTemp/getSeries/destroy` 노출 |
| HUD RAF (월드→화면 projection, anchor union box top) | 없음 | 있음 — `_hudRoot` 주입 후 `start` 시점에 시작 |
| ECharts 인스턴스 | 없음 | 있음 — HUD 카드 내 `.aircon-chart` div에 직접 init |
| beforeDestroy | meshState만 정리 | indoorUnitTemperature(HUD RAF + chart.dispose + 외부 자원 null) → fieldRender → meshState 역순 정리 |
| 화면 표시 | 단일 색상 실내기 본체 | 단일 색상 + mesh를 따라가는 HUD 카드(모드·설정·실내온도·상태 + 시계열 mini-chart) |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/indoorUnitTemperature는 추가로 (a) DOM overlay 채널 (mesh 좌표 추적 + 카드 안 mini-chart) (b) FieldRender 선택자 계약 (c) ECharts 인스턴스 (d) `setMode/setSetpoint/setIndoorTemp/pushTempPoint/...` 외부 명령형 API (e) HUD RAF — 다섯 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#41 OHU103 답습) |
| 2 | self-null `this.indoorUnitTemperature = null` | OK — destroy 마지막 줄 self-null + RAF cancel + chart.dispose + 외부 자원 null + _anchorTargets 비움 (DOM 차트 전환 후 4단계로 단순화) |
| 3 | beforeDestroy.js는 호출만 | OK — `this.indoorUnitTemperature?.destroy(); this.fieldRender?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachIndoorUnitTemperature(inst)` 내부 destroy도 동일한 4단계 dispose + `inst.indoorUnitTemperature = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — HUD(`setOffset/showHud/hideHud/show/hide/start/stop/addAnchorTarget/removeAnchorTarget`) MeshTrackingHud 패턴 동일, 차트(`setData/pushTempPoint/setMaxPoints/showChart/hideChart`) 단순한 ECharts 위임, 도메인 메서드(`setMode/setSetpoint/setIndoorTemp`) Aircon 의미적으로 명확 |
| 6 | UI ↔ API 인자 축 일치 | OK — preview mode 토글 cooling/heating/fan/dry ↔ `setMode`, setpoint slider 18~30℃ ↔ `setSetpoint`, indoor slider 16~32℃ ↔ `setIndoorTemp`, Push 버튼 ↔ `pushTempPoint`, start/stop ↔ `start/stop`, Visibility 토글 ↔ `showHud/hideHud/showChart/hideChart` |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 setMode('cooling') + setSetpoint(24) + setIndoorTemp(28) + setData(5포인트 하강 곡선) → HUD 카드(모드·설정·실내온도·상태 + 시계열 mini-chart) 즉시 표시 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

**모든 항목 통과.** DOM 차트 전환으로 라이프사이클이 plane texture 시기보다 단순해졌고, 8항목 중 어느 것도 깨뜨리지 않음.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// 페이지 HTML (정적 마운트)
<div id="aircon-hud-overlay" style="position:absolute; inset:0; pointer-events:none;">
    <div class="aircon-hud-card" data-mesh-name="airConditioner">
        <div class="aircon-hud-row">
            <span class="aircon-mode-icon" data-mode=""></span>
            <span class="aircon-mode">-</span>
        </div>
        <div class="aircon-hud-row">
            <span class="aircon-hud-label">설정</span>
            <span class="aircon-setpoint">-</span><span class="aircon-hud-unit">℃</span>
        </div>
        <div class="aircon-hud-row">
            <span class="aircon-hud-label">실내</span>
            <span class="aircon-indoor-temp">-</span><span class="aircon-hud-unit">℃</span>
        </div>
        <div class="aircon-hud-row">
            <span class="aircon-state" data-state=""></span>
            <span class="aircon-state-label">-</span>
        </div>
        <div class="aircon-hud-chart">
            <div class="aircon-chart"></div>     <!-- ECharts mini-chart 컨테이너 -->
        </div>
    </div>
</div>

// loaded.js
const overlay = document.getElementById('aircon-hud-overlay');
this.airconInstance = wemb.getDesignComponent('Aircon_Ceiling01');
this.airconInstance.indoorUnitTemperature._hudRoot = overlay;
// _renderer/_camera는 register.js가 wemb.threeElements에서 자동 획득
this.airconInstance.indoorUnitTemperature.start();

// 텔레메트리 토픽 어댑터
const onAirconTelemetry = ({ response: data }) => {
    this.airconInstance.indoorUnitTemperature.setMode(data.mode);
    this.airconInstance.indoorUnitTemperature.setSetpoint(data.setpoint);
    this.airconInstance.indoorUnitTemperature.setIndoorTemp(data.indoorTemp);
    this.airconInstance.indoorUnitTemperature.pushTempPoint({
        time: data.time,
        value: data.indoorTemp
    });
};
```

---

## 모델 주의사항

- `models/Aircon_Ceiling01/01_default/Aircon_Ceiling01.gltf`의 단일 mesh 이름은 `'airConditioner'`로 확정 (Standard register.js와 GLTF 파일 직접 검증).
- HUD 카드는 mesh 위쪽으로 표시 — `setOffset({ y: -32 })` 권장 (anchor는 mesh + 부착 요소 union box top center).
- mini-chart 컨테이너는 HUD 카드의 마지막 row(`.aircon-hud-chart > .aircon-chart`)에 위치. 카드 너비에 따라 자동 fit (CSS `width: 100%; height: 80px`).
- **[MODEL_READY] placeholder 사용 안 함** — meshName='airConditioner'은 Standard register.js / GLTF 파일 직접 검증으로 이미 확정.
- ECharts CDN은 페이지 환경에 글로벌 `echarts`가 이미 있다고 가정. preview에서는 명시적으로 CDN 로드.

---

## 발견한 문제 / Mixin 승격 메모

- **CanvasTextureChartMixin 채택 철회**: 초기 사이클에서 "1번째 채택"으로 도입했으나 사이클 내 결함 발견 (texture 보간으로 흐릿 / 비스듬 각도 가독성 / 줌 영향 / UX 부자연) 후 DOM 차트로 전환. 신기법 자체의 가능성은 보존되나 본 컴포넌트는 후보에서 제거. 차후 진짜 3D 공간 데이터 시각화가 필요한 컴포넌트(예: 건물 단면도 위 zone heatmap)에서 1번째 채택으로 다시 검토.
- **MeshTrackingHudMixin 승격 10번째 채택 — 임계점 명백히 초과 누적**: HUD 추적 패턴(`_renderer/_camera/_hudRoot/_cardEl` 외부 자원 + RAF + `setData/setOffset/show/hide/start/stop/destroy` + `addAnchorTarget/removeAnchorTarget` API)이 10개 이상 컴포넌트에서 동일. **사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 강력 권장.**
- **DOM 차트 전환의 라이프사이클 단순화**: plane texture 시기에는 ECharts canvas / CanvasTexture / PlaneGeometry / hidden host div 4개 자원의 의존성 역순 9단계 dispose가 필요했으나, DOM 차트로는 ECharts 단일 자원만 남아 4단계로 단순화. canvas DOM은 카드의 자식이므로 카드 마운트해제(페이지 책임)와 함께 자연 정리.
- **lazy chart init**: ECharts는 `start()` 시점에 init되며, 그 시점에 `_hudRoot` 주입 + `findCardEl()`로 카드 발견이 선행되어야 한다. 페이지가 `_hudRoot` 주입 전에 `setData/pushTempPoint`를 호출하면 silent skip (다음 호출 시 lazy init).
