# LithiumionBattery — Advanced/batteryHierarchyZoom

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 단일 mesh `Lithiumionbattery`(소문자 'b')의 단일 material 색상 변경 (Standard 승계, `material.color` 채널)
2. **계층 레벨 카메라 줌** — 'rack' / 'module' / 'cell' 3단계 시각적 계층을 카메라 거리(boundingBox 기반 비율)로 시뮬레이션 — `goTo(level)`로 한 번에 진입, `next()/prev()`로 인접 레벨 이동 (#16 BATT/hierarchyZoom 답습)
3. **각 레벨 HUD 라벨** — 현재 레벨 명칭(Rack/Module/Cell)과 통계값(예: "12 modules" / "24 cells" / "3.65 V / 25 ℃")을 mesh를 따라가는 absolute-position된 DOM 카드에 표시 (#41 OHU103 + #42 Generator HUD overlay 패턴 답습) — `setLabels(map)` / `setLabelData(level, { title, sub })`로 외부 명령형으로 갱신 가능
4. **외피/모듈 가시성 토글 (확장 대비)** — MeshVisibility를 등록만 해두어 페이지가 `instance.meshVisibility.show/hide/toggle/showOnly`를 직접 호출 가능 (#16 답습 — 향후 모듈/셀 mesh 분리 모델 도입 시 자동 외피 hide / 모듈 show 시퀀스 연동)
5. **외부 명령형 API** — 페이지가 `instance.batteryHierarchyZoom.goTo/next/prev/reset/getLevel/getLevels/setLabels/setLabelData/setMeshName/setOffset/show/hide/start/stop/destroy/...` 직접 호출

---

## LithiumionBattery mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/LithiumionBattery/01_default/LithiumionBattery.gltf` |
| GLTF 구조 | `scene → root(scale [1000,1000,1000]) → "Lithiumionbattery"(mesh 0, 1 primitive, 1 material)` |
| mesh 이름 | **`Lithiumionbattery`** — 폴더명 `LithiumionBattery`(대문자 'B')와 **대소문자 불일치** ('b' 소문자) |
| 추적 대상 | 단일 Mesh `Lithiumionbattery` |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |
| 실제 장면 크기 | root scale [1000,1000,1000] 적용 후 약 **434 × 228 × 108 단위** (본 저장소 개별 3D 컴포넌트 중 최대 규모 계열) |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh: Lithiumionbattery, 단일 primitive × 단일 material)`와 일치. Standard register.js / Standard preview에서 동일한 메시 이름 `'Lithiumionbattery'`(소문자 'b')로 직접 검증 완료. **getObjectByName은 대소문자를 구분**하므로 본 변형의 boundingBox 산출, HUD 추적, 카드 탐색(`data-mesh-name="Lithiumionbattery"`) 모두 소문자 'b'로 통일.

---

## 큐 정의 vs 실제 구현 — 단일 mesh 한계 + HUD 추가 + Mixin 채택 결정

**큐 설명**: "Rack→Module→Cell 계층 확대 + 각 레벨 HUD (MeshVisibility+CameraFocus+커스텀 메서드)"

**실제 채택**: **MeshState + CameraFocus + MeshVisibility(노출만) + FieldRender(HUD 선택자 계약) + 커스텀 `this.batteryHierarchyZoom`**

### 결정 근거

1. **단일 mesh 한계 — 모듈/셀이 별도 mesh로 분리되어 있지 않다.** 따라서 "계층 확대"의 본격 동작은 카메라 거리 단계 진입(rack=원거리, module=중거리, cell=근접)으로 시뮬레이션한다 (#16 BATT/hierarchyZoom 동일 정책). MeshVisibility는 단일 mesh에서는 외피 toggle 정도가 한계 — 계층 단계와 연동된 자동 hide/show 시퀀스는 의미가 없다(끄면 화면 자체가 빈다).
2. **MeshVisibility를 그래도 등록하는 이유** — (a) 큐 명시 Mixin 조합 충실 이행, (b) 페이지가 외부 트리거로 단일 mesh `Lithiumionbattery`를 토글할 수 있는 채널을 유지. 채널 충돌 없음 (object.visible vs camera.position vs DOM HUD).
3. **HUD 추가 (FieldRender + 커스텀 통합)** — 큐 설명의 "각 레벨 HUD" 추가 요구사항을 #41 OHU103/outdoorUnitPerformance + #42 Generator/generatorOutput의 HUD overlay 패턴(MeshState + FieldRender + 외부 주입 자원 + RAF idle 정책 + carry-along)으로 답습한다. FieldRender는 **선택자 계약 컨테이너**로만 사용(3D appendElement는 querySelector 불가하므로 `fieldRender.renderData` 구독 안 함, 커스텀 메서드가 cssSelectors/datasetAttrs 활용해 직접 갱신).
4. **단일 통합 네임스페이스 `this.batteryHierarchyZoom`** — 두 채널(카메라 진입 + HUD 라벨)이 단일 도메인(배터리 계층 진입 표시)에 종속이고 페이지가 동시 호출(`goTo` + `setLabelData`)하므로 단일 네임스페이스로 통합 (#41/#42 답습). #16 BATT/hierarchyZoom은 카메라만 있어 `this.hierarchyZoom` 단일 네임스페이스였으나, 본 변형은 거기에 HUD 채널까지 통합하여 동일 네임스페이스 정책을 유지.
5. **자동 진입 정책 답습 (#16)** — register 시점에 parent/THREE 가용 시 즉시 `goTo('rack')` 호출. 사용자가 마운트 직후 첫 화면을 즉시 관찰할 수 있도록 (Phase 1.5 항목 #7 "기본값 시각 관찰" 우선).

### 큐 권장 distanceRatio vs 실제 채택 비율

큐 가이드는 `{ rack: 2.5, module: 1.2, cell: 0.4 }`를 제시하나, LithiumionBattery는 모델 자체 크기가 매우 커(maxDim=434 단위) 이 비율에 곱하면 거리가 약 1085(rack), 521(module), 174(cell)로 너무 멀어진다. **#16 BATT/hierarchyZoom과 동일한 비율 `{ rack: 1.5, module: 0.7, cell: 0.3 }`을 채택** — distance = maxDim × ratio가 651 / 304 / 130 단위로 시각 차등이 명확하고 카메라 far=5000 프러스텀에 안정적으로 담긴다. (큐 권장값은 모델 크기 보정이 가능한 옵션화 후보 — Mixin 승격 시 `levels` 옵션으로 외부에서 조정 가능하게 함.)

### 확장 시나리오 (모듈/셀 mesh 분리 모델 도입 시)

향후 LithiumionBattery 모델이 다중 mesh(예: `Lithiumionbattery_module_*` / `Lithiumionbattery_cell_*`)로 분리되면, `goTo(level)`이 카메라 진입과 동시에 다음을 수행하도록 확장:

```
goTo('rack')   → cameraFocus.focusOnPosition({...}) + meshVisibility.showOnly(['Lithiumionbattery'])
goTo('module') → cameraFocus.focusOnPosition({...}) + meshVisibility.showOnly(['Lithiumionbattery_module_*'])
goTo('cell')   → cameraFocus.focusOnPosition({...}) + meshVisibility.showOnly(['Lithiumionbattery_cell_*'])
```

이때 본 변형의 시그니처(`this.batteryHierarchyZoom.goTo/next/prev/reset/...`)와 MeshVisibility 등록은 그대로 유지되고, 내부 구현만 `showOnly` 호출이 추가된다 — API 호환성 보존.

### Mixin 승격 메모 (필수)

> **HierarchyZoomMixin / LevelZoomMixin (가칭) — 임계점 도달**: #16 BATT/hierarchyZoom + 본 변형(#52 LithiumionBattery/batteryHierarchyZoom) = 2번째 채택. 두 컴포넌트의 `goTo/next/prev/reset/getLevel/getLevels/destroy` 시그니처가 100% 동일. 옵션화 후보: `levels` 배열(이름·거리비율), `defaultLevel`, `initialLevel`, `useVisibility`(모듈/셀 mesh 분리 모델일 때만 자동 showOnly 시퀀스 활성), `cameraOffsetRatioY`(높이 비율). 다음 채택(예상 #67 STATCOM_Submodule submoduleDetailZoom) 직전에 즉시 승격 권장.

> **MeshTrackingHudMixin — 매우 강력 권장 (HUD 8번째 채택)**: #13 BATT/dataHud + #21 GasDetector/sensorHud + #24/#25/#26 sensorDataHud + #41 OHU103/outdoorUnitPerformance + #42 Generator/generatorOutput + 본 변형(#52 batteryHierarchyZoom HUD 부분) = **8번째 채택**. setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 8개 컴포넌트에서 완전 동일. 임계점 명백히 초과. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 즉시 검토 권장.

---

## 구현 명세

### Mixin

MeshStateMixin + CameraFocusMixin + MeshVisibilityMixin + FieldRenderMixin (선택자 계약 컨테이너) + 커스텀 메서드 `this.batteryHierarchyZoom`

> **FieldRender의 역할 분담**: 3D 컴포넌트의 `instance.appendElement`는 THREE.Object3D이므로 `appendElement.querySelector`가 동작하지 않는다. 따라서 `this.fieldRender.renderData`를 그대로 구독하지 **않고**, FieldRenderMixin이 주입한 `cssSelectors`/`datasetAttrs` **선택자 계약**만 활용한다 (#13/#41/#42 답습). DOM 카드 내부 sub 요소 갱신은 커스텀 메서드 `this.batteryHierarchyZoom.goTo/setLabels/setLabelData`가 수행한다.

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 승계)

### CameraFocus 옵션

| 옵션 | 값 |
|------|-----|
| camera | `wemb.threeElements.camera` |
| controls | `wemb.threeElements.mainControls` |
| duration | 1000 |

### MeshVisibility 옵션

없음. `instance.appendElement`(THREE.Object3D)에서 `getObjectByName('Lithiumionbattery')` 등으로 메시 탐색.

### cssSelectors (FieldRenderMixin) — HUD 카드 내부 sub 요소

| KEY | VALUE | 용도 |
|-----|-------|------|
| title | `.battery-hud-title` | 레벨 명칭 (Rack/Module/Cell — textContent) |
| sub | `.battery-hud-sub` | 레벨 통계값 (예: "12 modules" — textContent) |
| level | `.battery-hud-level` | 레벨 키 (data-level — CSS 색상 분기) |

### datasetAttrs (FieldRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| level | `level` | `<.battery-hud-level>` 요소에 `data-level="<level>"` 부여 |

### 채널 직교성 정책

**원칙**: 세 채널은 완전 직교 — material 색상, 카메라 위치, DOM 좌표는 서로 간섭하지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | 단일 mesh `material.color` | 데이터 상태 색상 (Standard 승계) |
| CameraFocusMixin | `camera.position` + `controls.target` | 카메라 트윈/easing |
| batteryHierarchyZoom (카메라) | distanceRatio 산출 → CameraFocus 위임 | 레벨↔거리·인접 인덱스 관리 |
| batteryHierarchyZoom (HUD) | DOM (`_cardEl.style.transform`) | 월드→화면 projection 매 프레임, 카드 carry-along + 레벨 라벨 데이터 적용 |
| MeshVisibilityMixin | `object.visible` | 외부 명령형 가시성 토글 (등록만) |
| FieldRenderMixin | (선택자 계약만 주입) | DOM textContent / data-attr 적용 분기 규칙 |

### 커스텀 네임스페이스 `this.batteryHierarchyZoom`

| 메서드 | 동작 |
|--------|------|
| `goTo(level)` | `'rack'` / `'module'` / `'cell'` 중 하나로 카메라 진입. 내부에서 `Lithiumionbattery` mesh boundingBox로 maxDim 산출 → 레벨별 distanceRatio 적용 → `cameraFocus.focusOnPosition` 위임. 현재 레벨 갱신 + HUD 라벨 자동 갱신 |
| `next()` | 인접 다음 레벨로 이동(rack→module→cell, cell에서는 cell 유지). 내부에서 `goTo` 호출 |
| `prev()` | 인접 이전 레벨로 이동(cell→module→rack, rack에서는 rack 유지). 내부에서 `goTo` 호출 |
| `reset()` | 초기 카메라 위치로 복귀. `cameraFocus.reset()` 위임 + 현재 레벨을 `null`로 + HUD 라벨 hide |
| `getLevel()` | 현재 레벨 반환 (`'rack'` / `'module'` / `'cell'` / `null`) |
| `getLevels()` | `['rack', 'module', 'cell']` 배열 반환 |
| `setLabels(map)` | 모든 레벨 라벨을 한꺼번에 갱신. `{ rack: { title, sub }, module: {...}, cell: {...} }` |
| `setLabelData(level, { title, sub })` | 특정 레벨의 라벨만 갱신. 현재 레벨이 그 레벨이면 HUD 즉시 재적용 |
| `setMeshName(name)` | HUD 추적 / boundingBox 산출 대상 mesh를 외부에서 지정 (기본 `'Lithiumionbattery'`) |
| `setOffset({ x, y })` | DOM 오버레이의 mesh 화면 좌표 기준 픽셀 오프셋 |
| `show()` / `hide()` | DOM HUD 카드 표시/숨김 |
| `start()` | HUD RAF 시작 (이미 시작되어 있으면 no-op) |
| `stop()` | HUD RAF 정지 (현재 카드 위치 유지) |
| `isRunning()` | HUD RAF 활성 여부 |
| `enable()` / `disable()` / `isEnabled()` | 동적 채널 토글 (HUD는 별도 — `start`/`stop`로 제어) |
| `destroy()` | HUD RAF cancel + 외부 자원 null + 마지막 줄 `this.batteryHierarchyZoom = null` (self-null) |

#### 외부 주입 자원 (페이지 책임 — #41/#42 답습)

| 자원 | 의미 |
|------|------|
| `instance.batteryHierarchyZoom._renderer` | THREE.WebGLRenderer (canvas 좌표 산출용) — 기본값 `wemb.threeElements.renderer` |
| `instance.batteryHierarchyZoom._camera` | THREE.Camera (월드→화면 projection용) — 기본값 `wemb.threeElements.camera` |
| `instance.batteryHierarchyZoom._hudRoot` | absolute-position된 DOM 컨테이너 (페이지가 마운트한 overlay div) — `setLabels`/HUD RAF 동작 전 필수 |

### 레벨 거리 매핑

`maxDim`을 `Lithiumionbattery` mesh boundingBox의 `max(size.x, size.y, size.z)`로 산출. 모델 root scale [1000,1000,1000] 적용 후 약 434 단위:

| 레벨 | distanceRatio | 카메라 거리 (maxDim=434 기준) |
|------|--------------|------------------------------|
| rack | 1.5 | ≈ 651 단위 (전체 가시) |
| module | 0.7 | ≈ 304 단위 (중간 영역) |
| cell | 0.3 | ≈ 130 단위 (근접) |

### 카메라 위치 산정

```
center      = box.getCenter('Lithiumionbattery')
maxDim      = max(size.x, size.y, size.z)
distance    = maxDim * distanceRatio[level]
cameraPos   = (center.x + distance, center.y + distance * 0.7, center.z + distance)
target      = center
cameraFocus.focusOnPosition({ position: cameraPos, target })
```

높이 비율(0.7)은 모델을 약간 위에서 내려다보는 isometric 느낌 유지 (#16 답습). CameraFocusMixin이 동일한 트윈/easing(`easeInOutCubic`)을 위임받아 처리.

### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| meshName | `'Lithiumionbattery'` | 소문자 'b' — Standard 동일 |
| 초기 레벨 | `'rack'` | mount 후 첫 화면이 전체 가시 |
| autoEnter on mount | true | parent/THREE 가용 시 즉시 `goTo('rack')` (#16 답습) |
| HUD offset | `{ x: 0, y: -16 }` | 배터리 위쪽으로 띄움 (#41/#42 동등) |
| labels.rack | `{ title: 'Rack', sub: '12 modules' }` | preview 가시성 |
| labels.module | `{ title: 'Module', sub: '24 cells' }` | preview 가시성 |
| labels.cell | `{ title: 'Cell', sub: '3.65 V / 25 ℃' }` | preview 가시성 |
| 자동 데모 (preview) | rack → 2s → module → 4s → cell → 6s → reset | 시각 관찰 + 라벨 카드 갱신 관찰 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계) |

레벨 전환은 별도 토픽 없이 페이지가 외부 명령형으로 `goTo/next/prev/reset` 직접 호출 (BMS UI의 네비게이션 트리거 — "Rack/Module/Cell" 탭, 키보드 단축키 등에서 호출).

### 이벤트 (customEvents)

없음. 개별 단위(meshName='Lithiumionbattery' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: Mixin 적용(MeshState → CameraFocus → MeshVisibility → FieldRender) + `this.batteryHierarchyZoom` API 등록 + (parent/THREE 가용 시) 자동 `goTo('rack')` (#16 답습)
- 페이지가 `_hudRoot`에 DOM 카드 마운트 + `_hudRoot/_renderer/_camera` 주입 후 `start()` 호출 → HUD RAF 시작 (#41/#42 답습)
- 페이지가 `goTo/next/prev/reset` + `setLabels/setLabelData` 호출
- `beforeDestroy.js`: 구독 해제 → `this.batteryHierarchyZoom?.destroy()` (HUD RAF cancel + 외부 자원 null 포함) → `this.fieldRender?.destroy()` → `this.meshVisibility?.destroy()` → `this.cameraFocus?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/batteryHierarchyZoom |
|------|----------|-------------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `applyCameraFocusMixin` | ✗ | ✓ (추가) |
| `applyMeshVisibilityMixin` | ✗ | ✓ (추가, 등록만) |
| `applyFieldRenderMixin` | ✗ | ✓ (선택자 계약) |
| `this.batteryHierarchyZoom` 네임스페이스 | 없음 | `goTo/next/prev/reset/getLevel/getLevels/setLabels/setLabelData/setMeshName/setOffset/show/hide/start/stop/isRunning/enable/disable/isEnabled/destroy` 노출 |
| 자동 mount 동작 | 없음 | 자동 `goTo('rack')` |
| HUD DOM 오버레이 채널 | 없음 | 사용 (`_cardEl.style.transform` 매 프레임 갱신) |
| RAF 매 프레임 월드→화면 projection | 없음 | 있음 — `_hudRoot` 주입 + `start` 시점에 시작 |
| beforeDestroy | meshState만 정리 | batteryHierarchyZoom(HUD RAF + 외부 자원 null) → fieldRender → meshVisibility → cameraFocus → meshState 역순 정리 |
| 화면 표시 | 단일 색상 mesh | 단일 색상 + 3단계 카메라 줌 + mesh 위 HUD 라벨 카드 |

Standard는 단일 mesh `material.color` 채널만 데이터에 결합한다. Advanced/batteryHierarchyZoom은 추가로 (a) 카메라 트윈 채널, (b) DOM HUD overlay 채널 (carry-along + 레벨 라벨), (c) 가시성 토글 채널(향후 분리 모델 대비), (d) 레벨 네비게이션 + HUD 라벨 외부 명령형 API — 네 채널을 페이지에 노출한다.

---

## #16 BATT/hierarchyZoom과의 비교 — 답습 + HUD 추가 + 통합 네임스페이스

| 항목 | #16 BATT/hierarchyZoom | #52 LithiumionBattery/batteryHierarchyZoom (본) |
|------|------------------------|--------------------------------------------------|
| Mixin 조합 | MeshState + CameraFocus + MeshVisibility | **MeshState + CameraFocus + MeshVisibility + FieldRender** (HUD 선택자 계약 추가) |
| 커스텀 네임스페이스 | `this.hierarchyZoom` | `this.batteryHierarchyZoom` (도메인 네이밍 — Battery 명시) |
| meshName | `'BATT'` | **`'Lithiumionbattery'`** (소문자 'b' — 폴더명과 대소문자 불일치) |
| 모델 크기 | maxDim ~5 단위 (작음) | **maxDim ~434 단위** (크게, root scale 1000 적용) |
| distanceRatio | { rack: 1.5, module: 0.7, cell: 0.3 } | **동일** (큐 권장값 2.5/1.2/0.4 대비 모델 자체 크기를 고려해 1.5/0.7/0.3 채택) |
| HUD overlay | 없음 | **있음** (#41/#42 답습 — title/sub/level 3 sub 요소) |
| HUD RAF | 없음 | **있음** (월드→화면 projection 매 프레임) |
| 통합 네임스페이스 | 카메라만 | **카메라 + HUD** 통합 (#41/#42 답습) |
| 자동 진입 | `goTo('rack')` | **동일** + HUD RAF는 페이지 `_hudRoot` 주입 + `start()` 시점에 시작 |
| 시그니처 일관성 | `goTo/next/prev/reset/getLevel/getLevels/destroy` | **동일** + HUD 메서드 (`setLabels/setLabelData/setOffset/show/hide/start/stop/isRunning`) 추가 |
| 자동 데모 | mount 후 goTo('rack') 한 번만 | **rack → 2s → module → 4s → cell → 6s → reset 순환** (HUD 라벨 갱신 시각 관찰 보장) |

---

## 페이지 측 연동 패턴 (운영)

```javascript
// 페이지 HTML (정적 마운트)
<div id="lithiumionbattery-hud-overlay" style="position:absolute; inset:0; pointer-events:none;">
    <div class="battery-hud-card" data-mesh-name="Lithiumionbattery">
        <div class="battery-hud-header">Battery-01</div>
        <div class="battery-hud-title">-</div>
        <div class="battery-hud-sub">-</div>
        <div class="battery-hud-level" data-level="none">-</div>
    </div>
</div>

// loaded.js
const overlay = document.getElementById('lithiumionbattery-hud-overlay');
this.battInstance = wemb.getDesignComponent('LithiumionBattery');
this.battInstance.batteryHierarchyZoom._hudRoot = overlay;
this.battInstance.batteryHierarchyZoom.start();   // HUD RAF 시작

// BMS UI 탭 클릭 핸들러
const handleHierarchyTab = (level) => {
    this.battInstance.batteryHierarchyZoom.goTo(level);   // 'rack' | 'module' | 'cell'
};

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') this.battInstance.batteryHierarchyZoom.next();
    if (e.key === 'ArrowLeft')  this.battInstance.batteryHierarchyZoom.prev();
    if (e.key === 'Escape')     this.battInstance.batteryHierarchyZoom.reset();
});

// SCADA/BMS 데이터로 라벨 통계값 갱신
const onBmsTelemetry = ({ response: data }) => {
    this.battInstance.batteryHierarchyZoom.setLabels({
        rack:   { title: data.rackName,   sub: `${data.moduleCount} modules` },
        module: { title: data.moduleName, sub: `${data.cellCount} cells` },
        cell:   { title: data.cellName,   sub: `${data.voltage} V / ${data.tempC} ℃` }
    });
};
```

---

## 모델 주의사항

- `models/LithiumionBattery/01_default/LithiumionBattery.gltf`의 단일 mesh 이름은 **`'Lithiumionbattery'`(소문자 'b')** 로 확정. 폴더명 `LithiumionBattery`('B' 대문자)와 **대소문자 불일치** — `getObjectByName`은 대소문자 구분이므로 반드시 소문자 'b'로 조회. 본 변형의 boundingBox 산출, HUD 추적, 카드 탐색(`data-mesh-name="Lithiumionbattery"`) 모두 소문자 'b'로 통일.
- 카메라 거리는 `maxDim` 비례로 결정되므로 모델 크기가 바뀌어도 시각 비율 유지. LithiumionBattery는 root scale [1000,1000,1000]로 실제 크기 ~434×228×108 단위 → distance 651/304/130. preview의 카메라 far=5000으로 프러스텀에 안정적으로 담김.
- HUD 카드는 배터리 위쪽으로 표시 — `setOffset({ y: -16 })` 권장 (#41/#42 동등).
- 모듈/셀 mesh 분리 모델 도입 시 register.js 수정 없이 (a) `goTo` 내부의 mesh name 식별자만 확장, (b) `meshVisibility.showOnly([...])` 추가하여 자동 외피 hide/모듈 show 시퀀스 활성. API 시그니처는 그대로.
- **[MODEL_READY] placeholder 사용 안 함** — meshName='Lithiumionbattery'는 컴포넌트 루트 CLAUDE.md / Standard register.js / Standard preview / GLTF 파일에서 직접 검증으로 이미 확정. 단일 mesh 한계는 본 변형이 카메라 거리 단계로 시뮬레이션하므로 현 모델 그대로 동작.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄, IIFE 없음 (#16/#41/#42 답습) |
| 2 | self-null `this.batteryHierarchyZoom = null` + HUD RAF cancel | OK — destroy 마지막 줄 self-null + cancelAnimationFrame(hudRafId) + 외부 자원 null |
| 3 | beforeDestroy.js는 호출만 | OK — `this.batteryHierarchyZoom?.destroy(); this.fieldRender?.destroy(); this.meshVisibility?.destroy(); this.cameraFocus?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachBatteryHierarchyZoom(inst)` 내부 destroy도 HUD RAF cancel + 외부 자원 null + `inst.batteryHierarchyZoom = null` 포함 |
| 5 | 시그니처 일관 — 가이드 + #16 답습 | OK — 카메라(`goTo/next/prev/reset/getLevel/getLevels`) #16과 동일, HUD(`setLabels/setLabelData/setOffset/show/hide/start/stop/isRunning/destroy`) #41/#42 답습 |
| 6 | UI ↔ API 인자 축 일치 | OK — preview Rack/Module/Cell 버튼↔`goTo('rack'/'module'/'cell')` 1:1, Reset↔`reset()`, Prev/Next↔`prev()/next()`, Status↔`meshState.renderData` |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 `goTo('rack')` + HUD RAF 시작 → 카드가 배터리 위에서 따라감, 자동 데모 rack(0s) → module(2s) → cell(4s) → reset(6s) 순환으로 카메라 진입과 라벨 갱신을 즉시 관찰 가능 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 |

**모든 항목 통과.** 카메라 채널(#16 답습) + HUD 채널(#41/#42 답습) 결합이 8항목 중 어느 것도 깨뜨리지 않음.

---

## 발견한 문제 / Mixin 승격 강력 권장

- **HierarchyZoomMixin / LevelZoomMixin (가칭) — 임계점 도달 (2번째 채택)**: #16 BATT/hierarchyZoom + #52 LithiumionBattery/batteryHierarchyZoom = 시그니처 100% 동일. 다음 채택(예상 #67 STATCOM_Submodule submoduleDetailZoom) 직전에 즉시 승격 권장. 옵션화 후보: `levels` 배열, `defaultLevel`, `initialLevel`, `useVisibility`(자동 showOnly 시퀀스), `cameraOffsetRatioY`(높이 비율), `labels` 옵션화(HUD 통합 시 한 Mixin에서 라벨까지 처리할지 또는 별도 Mixin으로 분리할지 결정 필요).
- **MeshTrackingHudMixin — 매우 강력 권장 (HUD 8번째 채택)**: #13 + #21 + #24/#25/#26 + #41 + #42 + 본 변형(#52 HUD 부분) = 8번째. setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 8개 컴포넌트에서 완전 동일. 임계점 명백히 초과. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 즉시 검토 권장.
- **단일 mesh 한계 + HUD 동시 시각 차등**: LithiumionBattery는 단일 mesh이므로 MeshVisibility의 `showOnly([...])` 시퀀스는 의미가 없다. 본 변형은 카메라 줌(공간 차등) + HUD 라벨(텍스트 차등) 두 채널의 결합으로 단일 mesh 한계 안에서 계층 단계의 명확한 시각 차등을 달성. 모듈/셀 mesh 분리 모델 도입 시 자동 시퀀스 활성화 — 위 "확장 시나리오" 참조.
- **단일 통합 네임스페이스 (#41/#42 답습)**: 카메라 채널 + HUD 채널이 단일 도메인(배터리 계층 진입)에 종속이고 페이지가 동시 호출(`goTo` + `setLabelData`)하므로 단일 `batteryHierarchyZoom` 네임스페이스로 통합. 미래 Mixin 승격 시점에는 두 Mixin이 별도 네임스페이스(`this.hierarchyZoom` + `this.dataHud`)로 분리되어도 무방하나, 도메인 의미상 통합이 자연스러움.
- **자동 데모 사이클**: preview에서 0s rack → 2s module → 4s cell → 6s reset 순환으로 사용자가 mount 직후 모든 레벨 카메라 진입과 HUD 라벨 갱신을 즉시 관찰 가능. (#16은 mount 후 goTo('rack') 한 번만 — 본 변형은 HUD 추가로 시각 관찰 효과를 강화하기 위해 4단계 데모 사이클 채택.)
