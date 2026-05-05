# area_01 — Advanced/zonalHeatmap

## 기능 정의

1. **상태 색상 표시 (제한적 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 다수 zone Mesh 색상 변경 (Standard 승계, `material.color` 채널). 단, **zonalHeatmap 활성 시 status 색상은 시각적으로 묻힌다** — zonalHeatmap이 동일 `material.color` 채널을 점유하기 때문 (자세한 정책은 아래 "MeshState 채널과의 충돌 회피 정책" 참조).
2. **구역별 스칼라 데이터 → color gradient 매핑** — 각 zone mesh에 (점유율/온도/위험도 등) 1개의 스칼라 데이터를 외부에서 받아, `[min, max]` 범위로 정규화한 후 graident stops를 보간한 색상으로 `mesh.material.color`를 갱신한다.
   - 그라디언트 정의: `setGradient(stops)` 또는 기본 5단계 (cool→hot)
   - 단일 값 갱신: `setZoneValue(meshName, value)`
   - 다중 값 일괄 갱신: `setZoneValues({ meshName: value, ... })`
   - 정규화 범위 변경: `setRange({ min, max })`
   - 단일 zone 원본 색상 복원: `clear(meshName)`, 전체 복원: `clearAll()`
   - 외부 명령형 API — 페이지가 점유율/온도/위험도 등 실 데이터 토픽을 직접 매핑

3. **활성/비활성 토글** — `start()` / `stop()` 메서드로 zonalHeatmap 적용 여부를 런타임에 토글. stop 시 모든 zone의 원본 material.color를 복원하여 다른 변형(visibility/highlight/animation 등)과 채널 공존 가능.

---

## 컨테이너 mesh 구조 — 동적 식별

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/meshesArea/area_01/01_default/area_01.gltf` |
| mesh 이름 | **사전 미확정 (동적 식별)** |
| 식별 방법 | `instance.appendElement.traverse(child => child.isMesh && child.name)` 으로 모든 mesh 이름 수집 |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 컨테이너 (1 GLTF = N Mesh)`와 일치. `getMeshNames()` 메서드는 `appendElement` traverse 결과를 캐시하여 반환한다.

### 컨테이너 mesh 단위 색상 매핑 — 단일 mesh와의 차이

`BATT/cellHeatmap`은 **단일 mesh**에 셀이 분리되어 있지 않아 `CanvasTexture` + `material.map` 채널을 사용해 우회 매핑한다. 본 변형은 **컨테이너에 다수의 zone mesh가 이미 분리**되어 있으므로, **각 zone mesh의 `material.color`를 직접 칠하는** mesh-level color 매핑 방식을 채택한다 (cellHeatmap의 향후 확장 시나리오 mode='meshColor'와 동일).

| 항목 | BATT/cellHeatmap | meshesArea/area_01/zonalHeatmap |
|------|------------------|---------------------------------|
| mesh 구조 | 단일 'BATT' | 다수 zone mesh (동적 식별) |
| 색상 채널 | `material.map` (CanvasTexture) | `material.color` (직접 set) |
| MeshState 충돌 | enable 동안 흰색 강제 reset | start 동안 status 색상 시각적으로 묻힘 (channel 동일) |
| 데이터 단위 | 셀 (row, col) | zone (meshName) |

---

## 큐 정의 vs 실제 구현 — Mixin 승격 금지 + 커스텀 메서드 채택

**큐 설명**: "구역별 점유율/온도/위험도 color gradient 매핑 **(신규 Mixin: ZonalHeatmapMixin)**"

**실제 채택**: **신규 Mixin 미생성** + MeshState applyMixin + 커스텀 메서드 `this.zonalHeatmap`만 등록

### 결정 근거

본 사이클은 **메인 루프 정책에 따라 신규 Mixin 생성이 금지**된다. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙" 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"와 정합. 본 변형은 zone mesh 단위 color gradient 매핑 패턴의 **1차 등장**이다 (메인 루프가 사전 검증).

## Mixin 승격 후보 — ZonalHeatmapMixin (1차 사례)

- 본 사이클(#65 meshesArea/area_01)은 1차 등장이므로 ADVANCED_QUEUE 1차 규칙(단일 컴포넌트 전용 → 커스텀 메서드)에 따라 커스텀으로 구현.
- 2번째 컨테이너에서 동일 기법(zone별 color gradient + 외부 데이터 매핑)이 요청되면 ZonalHeatmapMixin 승격 검토.
- 후보 시그니처: `setZoneValue(meshName, value)` / `setZoneValues({})` / `setRange({ min, max })` / `setGradient(stops)` / `clear(meshName)` / `clearAll()` / `start()` / `stop()` / `destroy()` / `getMeshNames()`
- 분리 검토: `BATT/cellHeatmap`(셀 단위 단일 mesh의 sub-zone)은 기법(자식 mesh 동적 식별이 아닌 CanvasTexture)이 다르므로 통합하지 않는다 — ADVANCED_QUEUE 3차 규칙. 두 변형의 API 시그니처는 비슷하지만 구현 자원(Canvas vs `material.color` map)과 정리 순서가 다르다.

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.zonalHeatmap` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### MeshState 채널과의 충돌 회피 정책 — 핵심 결정

**문제**: MeshStateMixin은 `material.color`를 status별 색상으로 갱신한다. zonalHeatmap도 `material.color` 채널에 gradient 색상을 칠한다. 동일 채널이므로 **나중에 갱신된 값이 시각적으로 우선**된다.

**채택 정책**: MeshState와 zonalHeatmap은 **시간 순으로 한 채널을 공유**한다. zonalHeatmap이 `start()` 활성 동안 `setZoneValue`/`setZoneValues`로 색상을 칠하면 status 색상은 묻힌다. 페이지가 status 색상도 보고 싶으면 zonalHeatmap.stop() 후 status 갱신 또는 별도 outline 강조(MeshHighlight)를 활용한다.

| Mixin / API | 채널 | 활성 시점 정책 |
|-------------|------|-----------------|
| MeshStateMixin | `material.color` | renderData 호출 시점 갱신 |
| zonalHeatmap (커스텀) | `material.color` | start 동안 setZoneValue/setZoneValues 호출 시점 갱신 |

> **MeshState renderData가 매번 material.clone()을 수행한다**. 따라서 zonalHeatmap은 호출마다 mesh의 현재 material을 다시 조회하고 칠한다. zone별 원본 색상 캐시는 mesh 객체 자체에 매핑(WeakMap → meshName → hex)으로 보관하여 clone에 영향받지 않는다.

### 그라디언트 알고리즘

```
init / setRange({min, max}):
    range = { min, max }

setGradient(stops):
    gradient = stops.slice()  // [{t:0, c:'#3b6cff'}, ...]

setZoneValue(meshName, value):
    if !zoneValues   zoneValues = {}
    zoneValues[meshName] = value
    repaintZone(meshName)

setZoneValues(map):
    Object.entries(map).forEach(([meshName, value]) =>
        zoneValues[meshName] = value
        repaintZone(meshName)
    )

repaintZone(meshName):
    mesh = appendElement.getObjectByName(meshName)
    if !mesh || !mesh.material || mesh.material.color == null  return
    // 원본 색상 1회 캐시
    if !originalColors.has(meshName):
        originalColors.set(meshName, mesh.material.color.getHex())
    v = zoneValues[meshName]
    span = range.max - range.min
    t = span > 0 ? clamp((v - range.min) / span, 0, 1) : 0
    hex = interpolateStops(gradient, t)
    mesh.material.color.setHex(hex)

clear(meshName):
    if originalColors.has(meshName):
        mesh.material.color.setHex(originalColors.get(meshName))
        originalColors.delete(meshName)
    delete zoneValues[meshName]

clearAll():
    each meshName in originalColors: clear(meshName)
    zoneValues = {}

interpolateStops(stops, t):
    // [{t: 0, c: '#3b6cff'}, {t: 0.5, c: '#f6e96b'}, {t: 1, c: '#ff3030'}]
    // t∈[stop_i.t, stop_{i+1}.t] 구간에서 RGB 선형 보간 → number(hex)
```

별도 RAF 없음 — 데이터 도착 시점에만 zone별 repaint.

### 커스텀 네임스페이스 `this.zonalHeatmap`

| 메서드 | 동작 |
|--------|------|
| `start()` | 활성 토글 ON. `appendElement` traverse로 모든 zone mesh 이름 수집 → `meshNames` 캐시. originalColors는 repaintZone 시점에 lazy 캐시 |
| `stop()` | `clearAll()` 호출 (모든 zone 원본 색상 복원) → 활성 토글 OFF |
| `setZoneValue(meshName, value)` | 단일 zone 값 갱신 + 즉시 repaint |
| `setZoneValues(map)` | 다중 zone 일괄 갱신 (`{meshName: value}`) + 각 zone repaint |
| `setRange({min, max})` | 정규화 범위 변경 → 활성 모든 zone repaint |
| `setGradient(stops)` | 그라디언트 stops 배열 (`[{t, c}]`) 변경 → 활성 모든 zone repaint. 사전 정의 preset 지원 (`setGradient('cool-hot')`) |
| `clear(meshName)` | 단일 zone 원본 색상 복원 + zoneValues에서 제거 |
| `clearAll()` | 모든 zone 원본 색상 복원 + zoneValues clear |
| `getMeshNames()` | `appendElement` traverse 결과 (활성 시점 캐시 반환). 미마운트 시 즉석 traverse |
| `isActive()` | 활성 여부 |
| `getRange()` | `{ min, max }` 반환 |
| `destroy()` | `stop()` 호출 + originalColors/zoneValues/meshNames clear + 마지막 줄 `this.zonalHeatmap = null` (self-null) |

#### 옵션 기본값

| 키 | 기본값 |
|----|--------|
| range | `{ min: 0, max: 1 }` (정규화 0~1 가정 — 점유율) |
| gradient | `[{t:0, c:'#3b82f6'}, {t:0.25, c:'#10b981'}, {t:0.5, c:'#f59e0b'}, {t:0.75, c:'#ef4444'}, {t:1.0, c:'#7f1d1d'}]` (5단계 cool→hot) |
| autoStart on mount | **true** (parent 가용 시 즉시 start + 모든 zone에 mid-range 시드 데이터 적용 — Phase 1.5 항목 #7 "기본값 시각적 관찰 가능성") |

#### Gradient Preset (선택)

| 이름 | stops |
|------|-------|
| `cool-hot` (기본) | 5단계 파랑 → 녹 → 노랑 → 빨강 → 진빨강 |
| `traffic` | 3단계 녹(0) → 노랑(0.5) → 빨강(1) |
| `mono` | 2단계 짙회(0) → 흰(1) |

### 원본 색상 보관/복원 정책

`originalColors: Map<meshName, hex>` — `repaintZone` 첫 호출 시 lazy 보관. `clear(meshName)` / `clearAll()` 시 복원 후 entry 삭제. `start`→`stop`→`start` 반복 시 stop에서 모두 복원되고 다음 start 시 다시 lazy 보관.

> **MeshState renderData와의 상호작용**: MeshState가 매 `setMeshState` 호출 시 `material = material.clone()` 수행. zonalHeatmap의 originalColors Map은 meshName → hex로 키잉되므로 clone에 영향받지 않는다. clone된 새 material.color는 status 색이지만 zonalHeatmap이 다음 setZoneValue 호출 시 즉시 덮어쓴다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

zone별 스칼라 데이터 토픽(예: `zoneOccupancy`, `zoneTemperature`, `zoneRiskScore`)은 본 사이클에서 별도로 구독하지 않는다. 페이지가 외부 명령형으로 `instance.zonalHeatmap.setZoneValue` / `setZoneValues` 직접 호출 (BMS·BAS·SCADA UI에서 zone 단위 텔레메트리 폴링/구독 후 직접 주입). 이는 `pipeFlow/dynamicRpm/chargeFlowArrow/cellHeatmap` 외부 명령형 규약과 동일.

### 이벤트 (customEvents)

없음. zonalHeatmap은 데이터 표시 전용 — 클릭 인터랙션 없음.

### 라이프사이클

- `register.js`: Mixin 적용 (MeshState) + `this.zonalHeatmap` API 등록 + (parent 가용 시) **자동 start + 모든 zone에 mid-range 시드 데이터 적용** (mount 직후 시각 관찰 우선)
- 페이지가 `setZoneValue/setZoneValues/setRange/setGradient/clear/clearAll/start/stop` 호출하여 그리드/데이터/색상 스케일 갱신
- `beforeDestroy.js`: 구독 해제 → `this.zonalHeatmap?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/zonalHeatmap |
|------|----------|------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.zonalHeatmap` 네임스페이스 | 없음 | `setZoneValue/setZoneValues/setRange/setGradient/clear/clearAll/start/stop/getMeshNames/isActive/getRange/destroy` 노출 |
| 그라디언트 보간 로직 | 없음 | RGB 선형 보간 (parseHexColor + interpolateStops) |
| 원본 색상 캐시 | 없음 | `originalColors: Map<meshName, hex>` lazy 캐시 |
| `material.color` 강제 갱신 | status별 |  zone value별 (status를 덮어씀) |
| beforeDestroy | meshState만 정리 | zonalHeatmap → meshState 역순 정리 |
| 화면 표시 | 단일 status 색상 | zone 단위 그라디언트 분포 |

Standard는 `material.color` 채널만 status에 결합한다. Advanced/zonalHeatmap은 추가로 (a) zone 단위 스칼라 데이터 입력, (b) 그라디언트 보간 로직, (c) MeshState color 채널과의 동일 채널 공유 정책, (d) 원본 색상 lazy 캐시 + 복원 — 네 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 + 색상 라이프사이클이 모두 추가되므로 별도 폴더로 분리한다.

---

## 다른 area_01 Advanced 변형과의 관계

| 변형 | 채널 | 표현 |
|------|------|------|
| camera | 카메라 위치/거리 | 클릭된 mesh로 카메라 포커스 |
| popup | DOM 오버레이 (Shadow) | 클릭된 mesh 상세 정보 팝업 |
| highlight | `material.emissive` | 선택 강조 |
| camera_highlight | 카메라 + emissive | 포커스 + 강조 |
| visibility | `object.visible` | zone 단위 show/hide |
| animation | GLTF animation clip | 시간 기반 애니메이션 |
| clipping | `material.clippingPlanes` | 평면 기준 절단 |
| hudInfo | DOM 오버레이 (HUD 카드) | 구역별 텍스트 HUD |
| **zonalHeatmap** | **`material.color` (gradient set)** | **zone 단위 그라디언트 색상** |

zonalHeatmap은 `material.color` 채널만 점유한다. emissive 채널은 건드리지 않으므로 highlight/camera_highlight와 직교 — 동일 zone에 zonalHeatmap + highlight 동시 적용 가능 (그라디언트 색상 + 노란 emissive 강조). visibility/clipping/카메라/animation/hudInfo와도 직교.

> **MeshStateMixin과의 채널 경합 주의**: zonalHeatmap이 활성 동안 setZoneValue 호출 시 status 색상이 덮어쓰인다. 페이지가 status도 함께 보고 싶으면 (a) zonalHeatmap.stop() 후 status 갱신, 또는 (b) emissive 채널을 사용하는 outline 강조(MeshHighlight) 별도 적용 필요. 현 사이클에서는 별도 변형을 만들지 않는다.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.areaInstance = wemb.getDesignComponent('area_01');

// 점유율 텔레메트리 수신
const handleZoneOccupancy = (data) => {
    // data: { 'zoneA': 0.42, 'zoneB': 0.78, ... }
    this.areaInstance.zonalHeatmap.setZoneValues(data);
};

// 위험도 점수 (0~100) 수신 — 정규화 범위 변경
this.areaInstance.zonalHeatmap.setRange({ min: 0, max: 100 });
this.areaInstance.zonalHeatmap.setZoneValues({ HV-CTTS1: 35, HV-CTTS2: 82 });

// 그라디언트 preset 변경
this.areaInstance.zonalHeatmap.setGradient('traffic');   // 녹→노랑→빨강

// 임계값 초과 시 zonalHeatmap 정지 + alarmPulse 우선
const handleCriticalAlarm = (zone) => {
    if (zone.score > 90) {
        this.areaInstance.zonalHeatmap.stop();
        // 별도 alarm 변형 활성화 (해당 변형 존재 시)
    }
};
```

---

## 모델 주의사항

- `models/meshesArea/area_01/01_default/area_01.gltf`의 zone mesh 이름은 GLTF 빌드 시점에 결정되며 **사전에 확정되지 않는다**. `getMeshNames()`로 동적 조회.
- 페이지가 발행하는 `setZoneValues({})` 키의 meshName은 GLTF의 실제 mesh 이름과 일치해야 한다. 미존재 mesh는 silent skip.
- mesh의 material이 `MeshStandardMaterial`/`MeshPhysicalMaterial`/`MeshBasicMaterial` 등 `color` 속성을 가진 타입이면 zonalHeatmap 동작. 미지원 타입이면 silent skip.
- preview는 ACESFilmic 톤매핑 환경에서 색상 그라디언트(파랑→녹→노랑→빨강→진빨강)가 명확히 관찰 가능.

---

## Phase 1.5 자율검증 결과 (기준=area_01/highlight + BATT/cellHeatmap)

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level만, IIFE 없음 |
| 2 | self-null `this.zonalHeatmap = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.zonalHeatmap?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachZonalHeatmap(inst)` 내부 destroy도 `inst.zonalHeatmap = null` 포함 + clearAll로 모든 mesh 원본 색상 복원 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setZoneValue/setZoneValues/setRange/setGradient/clear/clearAll/start/stop/getMeshNames/isActive/getRange/destroy` (cellHeatmap의 `set*` getter/setter, `enable/disable` 토글, `destroy` self-null 패턴 답습 — 단 컨테이너 도메인에 맞게 `start/stop`으로 명명, mesh-level 단위로 `clear(meshName)`/`clearAll()` 추가) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview zone 선택 + value 슬라이더 ↔ `setZoneValue(meshName, value)`, range min/max 슬라이더 ↔ `setRange({min, max})`, gradient preset 선택 ↔ `setGradient(preset)`, "Random All" 버튼 ↔ `setZoneValues({...})` |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 자동 start + 모든 zone에 분포된 시드 값 (0~1 그라디언트) 자동 주입으로 즉시 색상 분포 관찰 |
| 8 | manifest + area_01/CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **MeshState color 채널 동일 채널 공유 정책**: zonalHeatmap이 활성 동안 status 색상이 덮어쓰인다. cellHeatmap처럼 강제 reset 정책이 아니라 시간 순 우선 정책 — 페이지가 stop/start 토글로 정책 결정.
- **신규 Mixin (ZonalHeatmapMixin) 생성 금지** — 메인 루프 정책에 따라 본 사이클은 커스텀 메서드로 완결.
- **Mixin 승격 후보**: ZonalHeatmapMixin (1차 등장) — 2번째 컨테이너에서 동일 기법 요청 시 승격 검토. cellHeatmap(셀 단위 단일 mesh)과는 기법이 다르므로 통합하지 않는다 (ADVANCED_QUEUE 3차 규칙).
- **mesh 이름 변종 호환성**: 새 모델 변종 도입 시 기존 mesh 이름 규약을 유지해야 페이지 코드(`setZoneValues({...})`) 수정 불필요.
