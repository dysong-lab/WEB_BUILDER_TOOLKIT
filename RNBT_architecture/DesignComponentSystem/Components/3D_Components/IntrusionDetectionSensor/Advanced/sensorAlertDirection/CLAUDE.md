# IntrusionDetectionSensor — Advanced/sensorAlertDirection

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'IntrusionDetectionSensor' Mesh의 material 색상 변경 (Standard 승계, `material.color` 채널)
2. **침입 방향 화살표 표시** — IntrusionDetectionSensor mesh 위에 자체 합성 화살표(Group: CylinderGeometry 샤프트 + ConeGeometry 헤드)를 띄워 침입 방향(degrees 0~360°)을 시각화 (LeakDetector/leakAlarmPulse 화살표 패턴 답습 + scale 조정)
   - direction(degrees, 0=+X 방향, 시계 반대 방향이 +)에 따라 IntrusionDetectionSensor 중심에서 바깥쪽으로 화살표가 가리킴
   - active=false 시 화살표 자체 숨김 (visible=false)
3. **원형 펄스 웨이브 방사** — 센서 위치를 중심으로 점진적으로 확장하는 반투명 원형 링(`THREE.RingGeometry` + `MeshBasicMaterial`, transparent)을 RAF로 생성/확장/페이드아웃 후 리셋. 다중 ring이 시간차로 방사되어 "웨이브" 시각 효과 (Chiller/fluidFlow 다중 mesh 풀 + 진행도 누적 패턴 답습)
4. **외부 명령형 API** — 페이지가 `instance.sensorAlertDirection.setAlert/setWaveOptions/setArrowOptions/start/stop/destroy` 직접 호출하여 침입 상태/방향/웨이브/화살표 옵션 제어

---

## IntrusionDetectionSensor mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/IntrusionDetectionSensor/01_default/IntrusionDetectionSensor.gltf` |
| mesh 이름 | `IntrusionDetectionSensor` (단일 Mesh Node, 단일 primitive × 단일 material) |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh: IntrusionDetectionSensor)`와 일치. Standard도 `'IntrusionDetectionSensor'` mesh 기반으로 동작 중. 본 변형도 그 규약을 따른다. 텍스처 폴더명은 원본 오타 `textues/`(기본 `textures` 아님) 그대로 유지 — GLTF 내부 `images[].uri`가 이 경로를 참조한다.

---

## 큐 정의 vs 실제 구현 — Mixin 채택 결정

**큐 설명**: "침입 방향 화살표 + 경고 원형 펄스 웨이브 방사 (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.sensorAlertDirection` (신규 Mixin 없음, AnimationMixin 미사용)

### 결정 근거

1. **화살표는 자체 mesh 생성 + 동적 회전** — LeakDetector/leakAlarmPulse가 검증한 "Group(Cylinder+Cone) 자체 합성 + degrees 0~360 동적 회전"을 그대로 답습. AnimationMixin은 미리 베이크된 키프레임 기반이라 임의 각도 회전과 부적합 (chargeFlowArrow / leakAlarmPulse 동일 결정).
2. **원형 펄스 웨이브는 다중 mesh 인스턴스 풀 + RAF 진행도 누적** — Chiller/fluidFlow가 검증한 "다중 자원 풀(Map 기반) + RAF tick에서 buffer mutation + 활성 0개 시 정지 + 일괄 dispose" 패턴을 답습. ringCount만큼 RingGeometry+MeshBasicMaterial을 미리 생성한 뒤 시간차로 progress를 누적·리셋하여 연속 방사 효과를 만든다.
3. **화살표 + 웨이브 통합** — 침입 알람의 두 시각 채널은 한 트리거(`setAlert({ active, direction })`)로 동시 활성화되어야 한다. 각 기능을 독립 Mixin으로 분리하면 페이지가 두 호출을 동기화해야 하는 부담 발생. 단일 커스텀 메서드 네임스페이스로 묶어 통일한다 (LeakDetector/leakAlarmPulse의 `setLeak({ detected, direction })` 통합 트리거 답습).

### Mixin 승격 후보 메모 (강력)

본 변형의 "센서 mesh 위 방향 화살표 + 경보 시각 채널"은 **LeakDetector/leakAlarmPulse**의 동일 패턴이 **2번째**로 적용되는 사이클이다. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"의 **승격 시점 신호**(2번째 컴포넌트 등록)에 도달한 시점이다. 그러나 본 사이클은 **신규 Mixin 금지 정책**(메인 루프 제약)이므로 커스텀 메서드로 완결하고 메모만 남긴다.

- **신규 Mixin 후보 이름**: `SensorAlarmDirectionMixin`(가칭) — LeakDetector/leakAlarmPulse + IntrusionDetectionSensor/sensorAlertDirection 공통 추상화
- **API 호환성**: 두 변형 모두 `set*({ active|detected, direction })`/`setXxxOptions(...)`/`start`/`stop`/`destroy` 동일 골격. `setAlert({ active, direction })` 형태로 일반화 가능
- **분리 권장**: leakAlarmPulse는 emissive 펄스 + 화살표, sensorAlertDirection은 RingGeometry 웨이브 + 화살표. 두 패턴의 시각 채널이 다르므로 통합 Mixin보다는 (a) `DirectionalIndicatorArrowMixin`(가칭) 화살표만 추출 + (b) `MeshEmissivePulseMixin`(가칭) emissive + (c) `RingPulseWaveMixin`(가칭) 링 웨이브로 **3개 독립 Mixin** 분리가 더 직교적
- **차이점**: leakAlarmPulse는 mesh 자체의 emissive를 변조 / sensorAlertDirection은 별도 ring mesh 풀을 외곽으로 방사 (mesh material 무관) → 시각 채널 다름

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.sensorAlertDirection` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### MeshState 채널과의 충돌 회피 정책

**원칙**: sensorAlertDirection은 **자체 생성 mesh만** 사용한다. MeshStateMixin이 사용하는 `material.color`(반사색) 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` (×1 — IntrusionDetectionSensor material) | 데이터 상태 색상 (Standard 승계) |
| sensorAlertDirection 화살표 | 별도 자체 Group (Cylinder+Cone), IntrusionDetectionSensor material 무관 | 침입 방향 시각화 |
| sensorAlertDirection 웨이브 | 별도 자체 Mesh × ringCount (RingGeometry+MeshBasicMaterial), IntrusionDetectionSensor material 무관 | 경보 원형 방사 |

세 채널이 직교 — sensor mesh material 무관한 자체 mesh만 다룬다. 정지 시 단순 visible=false, 종료 시 일괄 dispose.

### 화살표 디자인 (LeakDetector/leakAlarmPulse 답습 + scale 조정)

화살표는 **CylinderGeometry**(샤프트) + **ConeGeometry**(헤드)를 `THREE.Group`으로 합성한다. leakAlarmPulse와 동일한 비율 + length 옵션으로 사용자 조정 가능.

| 부품 | geometry | 크기(IntrusionDetectionSensor boundingBox 기반 동적 결정) |
|------|----------|------------------------------------------------|
| 샤프트 | CylinderGeometry(radius, radius, length, 12) | radius = maxDim × 0.04 × lengthScale, length = maxDim × 0.50 × lengthScale |
| 헤드 | ConeGeometry(radius, length, 12) | radius = maxDim × 0.10 × lengthScale, length = maxDim × 0.18 × lengthScale |

> `maxDim` = `Math.max(box.size.x, box.size.y, box.size.z)`. 화살표는 `arrowOptions.length`(scale factor, 기본 1.0)로 전체 크기를 조정한다 — 침입 감지 거리에 비례한 시각 표현 가능.

material: `MeshStandardMaterial`로 `transparent: true, opacity: 0.85`(반투명), `depthWrite: false`, `emissiveIntensity: 0.6`. 색상은 `arrowOptions.color`(기본 0xff3030).

### 웨이브 ring 디자인 (Chiller/fluidFlow 다중 풀 답습)

`RingGeometry(innerRadius=0.96, outerRadius=1.0, segments=64)` × ringCount개를 미리 생성하여 풀로 관리한다. 모두 동일한 `MeshBasicMaterial(transparent: true, depthWrite: false, side: DoubleSide)`을 공유하지 않고 **각 ring마다 개별 material 인스턴스**(opacity 독립 제어)를 갖는다.

| 항목 | 결정 |
|------|------|
| geometry | RingGeometry(0.96, 1.0, 64) — 단위 원 외곽 얇은 링 (실제 크기는 group.scale로 결정) |
| material | MeshBasicMaterial × ringCount (transparent, depthWrite=false, side=DoubleSide) |
| 자세 | 평면이 XZ 평면(수평면) — `mesh.rotation.x = -Math.PI / 2` 적용 |

각 ring은 `progress`(0~1) 상태를 독립적으로 가지며 RAF tick에서 갱신:

```
scale = lerp(0, maxRadius, progress)
opacity = (1 - progress) * 0.6
mesh.scale.set(scale, scale, scale)   // XY 평면 — XZ로 회전된 후이므로 X·Z·1 동등 효과
mesh.material.opacity = opacity
mesh.visible = progress > 0
```

`progress`가 1.0에 도달하면 0으로 리셋되어 무한 방사. 시간차 시작을 위해 ring i의 초기 progress를 `-(i / ringCount)`로 음수 시드 → tick에서 0 미만은 visible=false 유지하다 0 이상이 되면 보이기 시작 (시간차 효과 = `period / ringCount`).

### 웨이브 알고리즘 (RAF tick)

```
dt = (now - lastTime) / 1000
delta = dt / (period / 1000)            // period(ms) 동안 progress가 0→1

forEach ring i in pool:
    ring.progress += delta              // 시드는 -(i/ringCount)
    if ring.progress >= 1.0:
        ring.progress -= 1.0            // 0~1로 wrap (1.0 빼서 음수 시드 효과 유지 가능)
    
    if ring.progress < 0 or !active or !alertState.active:
        ring.mesh.visible = false
        continue
    
    scale = lerp(0, maxRadius, ring.progress)
    ring.mesh.scale.set(scale, scale, scale)
    ring.mesh.material.opacity = (1 - ring.progress) * 0.6
    ring.mesh.visible = true

활성 ring 0개 (alertState.active=false 등) → RAF 정지 (Chiller/fluidFlow 패턴 답습)
```

| 파라미터 | 기본값 | 설명 |
|---------|-------|-----|
| period | 1500 ms | 한 ring이 0→maxRadius까지 도달하는 시간 |
| maxRadius | maxDim × 2.0 (mount 시점 boundingBox 기반) | ring 최대 반경 |
| ringCount | 4 | 동시에 방사되는 ring 개수 (시간차 = period / ringCount) |
| color | 0xff3030 (적색) | 침입 알람 표준 색상 |

### 위치/방향 결정

- **앵커 좌표(공통)**: IntrusionDetectionSensor mesh의 boundingBox 중심을 기준으로 +Y 방향(위쪽)으로 maxDim × 0.10 만큼 떨어진 지점이 화살표 + ring 베이스 위치
- **화살표 direction(degrees) 회전**:
  - 화살표는 기본적으로 +X 축 방향을 향한다 (`direction = 0°` → 헤드가 +X 방향)
  - `direction = 90°` → +Z 방향 (시계 반대 방향, 평면 시점에서 위쪽)
  - `direction = 180°` → -X 방향
  - `direction = 270°` → -Z 방향
  - 즉, **XZ 평면(수평면)에서 시계 반대 방향 회전** — 침입자가 IntrusionDetectionSensor 중심 기준 어느 방향에서 접근하는지 시각적 표시
- 구현: `arrowGroup.rotation.order = 'YXZ'` + `arrowGroup.rotation.set(0, degToRad(direction), -Math.PI / 2)` (leakAlarmPulse 동일)
- **ring 자세**: 모든 ring은 XZ 평면(수평면)에 평평하게 누운 상태 — `mesh.rotation.x = -Math.PI / 2` 적용. 위치는 화살표 베이스와 동일한 앵커 좌표(센서 위쪽).

### 커스텀 네임스페이스 `this.sensorAlertDirection`

| 메서드 | 동작 |
|--------|------|
| `setAlert({ active, direction })` | 침입 상태/방향 갱신. `active`(bool)에 따라 화살표 + 웨이브 가시성 동시 토글. `direction`(degrees, 0~360)이 변경되면 화살표 group 회전 즉시 갱신. active=false면 모든 ring visible=false + 화살표 visible=false (RAF 정지) |
| `setWaveOptions({ period, maxRadius, ringCount, color })` | 웨이브 파라미터 변경. ringCount 변경 시 풀 재생성(이전 자원 dispose) + 진행 중이면 자동 재시작 |
| `setArrowOptions({ length, color })` | 화살표 크기(scale factor) / 색상 변경. length 변경 시 geometry 재생성 (LeakDetector/leakAlarmPulse 보다 추가된 필드) |
| `start()` | 자원 ensure(화살표 mesh + ring 풀 lazy 생성) + parent에 add + RAF 루프 시작. active=true이면 즉시 시각 관찰 |
| `stop()` | RAF 정지 + 모든 ring visible=false + 화살표 visible=false. mesh/geometry/material은 유지(재시작 가능) |
| `destroy()` | RAF cancel + 모든 ring geometry/material dispose + 화살표 geometry/material dispose + parent에서 remove + 마지막 줄 `this.sensorAlertDirection = null` (self-null) |

#### setAlert 입력 포맷

```javascript
{
    active:    boolean,   // true → 화살표 + 웨이브 ON / false → 둘 다 OFF
    direction: number     // degrees [0, 360) — XZ 평면 시계 반대 방향, 0=+X
}
```

### parent 결정 우선순위

```
1) this._sensorAlertDirectionParent  — 페이지/preview가 직접 주입 (scene 또는 IntrusionDetectionSensor 그룹의 부모)
2) this.appendElement                 — GLTF 루트
3) 둘 다 없으면 start no-op (안전 가드)
```

> Chiller/fluidFlow의 `_fluidFlowParent`/`appendElement` 우선순위 + LeakDetector/leakAlarmPulse의 `_leakAlarmArrowParent` 패턴 동일 답습.

### equipmentStatus 자동 연동

본 변형은 **equipmentStatus를 알람 트리거로 직접 사용하지 않는다**. equipmentStatus는 Standard 승계로 `meshState.renderData`만 수행하여 색상 채널만 갱신. 침입 감지(active) 토글은 페이지가 별도 토픽(예: `intrusionDetected` 또는 BMS 어댑터)을 받아 `instance.sensorAlertDirection.setAlert({...})` 외부 명령형 호출로 위임한다 (LeakDetector/leakAlarmPulse 동일 정책 — 침입 감지가 status와 직교한 별도 신호).

### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| active (시드) | `true` | mount 직후 화살표 + 웨이브 즉시 관찰 |
| direction (시드) | `0` (+X 방향) | mount 직후 +X 축 방향으로 화살표 표시 |
| period | 1500 ms | 1.5초 주기로 시각적으로 명확한 웨이브 |
| ringCount | 4 | 동시 4개 ring 방사 — period/4 = 375ms 시간차 |
| maxRadius | maxDim × 2.0 (mount 시점 boundingBox 기반) | 센서 크기 2배 반경까지 방사 |
| arrow length | 1.0 (scale factor) | leakAlarmPulse 기본과 동일 |
| color (공통) | 0xff3030 | 침입 알람 표준 빨강 |
| autoStart on mount | true | preview/operations 시각 관찰 우선 (chargeFlowArrow / leakAlarmPulse 동일 정책) |

> **자동 start 규약**: BATT/chargeFlowArrow 및 LeakDetector/leakAlarmPulse와 동일하게 mount 직후 자동 start + active=true 시드로 즉시 시각 관찰을 우선한다 (Phase 1.5 항목 #7). 페이지가 idle을 원하면 명시적으로 `setAlert({ active: false })` 또는 `stop()` 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

침입 감지/방향은 페이지가 외부 명령형으로 `setAlert/setWaveOptions/setArrowOptions` 직접 호출.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='IntrusionDetectionSensor' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.sensorAlertDirection` API 등록 + 기본값 시드 (`active=true, direction=0`) + (parent 가용 시) **자동 start** + equipmentStatus 구독(`meshState.renderData`)
- 페이지가 추가로 `_sensorAlertDirectionParent` 주입 후 `setAlert/setWaveOptions/setArrowOptions` 외부 명령형 호출
- `beforeDestroy.js`: 구독 해제 → `this.sensorAlertDirection?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/sensorAlertDirection |
|------|----------|-------------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.sensorAlertDirection` 네임스페이스 | 없음 | `setAlert/setWaveOptions/setArrowOptions/start/stop/destroy` 노출 |
| RAF 루프 | 없음 | sensorAlertDirection 자체 관리 (활성 false 시 정지) |
| Three.js geometry/material 자체 자원 | 없음 | CylinderGeometry + ConeGeometry + RingGeometry × ringCount + 다중 MeshBasicMaterial / MeshStandardMaterial 자체 생성/dispose |
| 화살표 (별도 mesh) | 없음 | 센서 위 부유 |
| 웨이브 ring 풀 | 없음 | 센서 중심 외곽으로 방사 |
| beforeDestroy | meshState만 정리 | sensorAlertDirection → meshState 역순 정리 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/sensorAlertDirection은 추가로 (a) 자체 화살표 mesh 자원, (b) 자체 ring 풀 자원(다중), (c) RAF 진행도 누적 + 시간차 방사 알고리즘, (d) `setAlert/setWaveOptions/setArrowOptions` 외부 명령형 API — 네 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 + 자체 mesh 풀 생성 + RAF 라이프사이클이 모두 추가되므로 별도 폴더로 분리한다.

---

## LeakDetector/leakAlarmPulse + Chiller/fluidFlow + BATT/chargeFlowArrow 패턴 결합

| 측면 | leakAlarmPulse | fluidFlow | chargeFlowArrow | sensorAlertDirection |
|------|----------------|-----------|------------------|----------------------|
| `material.emissive` sine 변조 | ✓ | — | — | — |
| 자체 mesh(Cylinder+Cone) 화살표 | ✓ | — | ✓ | ✓ (leakAlarmPulse 답습 + scale) |
| 다중 mesh 풀 + RAF 진행도 누적 | — | ✓ (Points 파티클 다중) | — | ✓ (Ring 다중) |
| 자체 ring(RingGeometry) 방사 | — | — | — | ✓ (신규 시각 채널) |
| 외부 명령형 API 통합 트리거 | ✓ (setLeak) | — (path 단위) | — (mode 단위) | ✓ (setAlert) |
| 자동 start | ✓ | — | ✓ | ✓ |

본 변형은 LeakDetector/leakAlarmPulse(화살표 + 통합 트리거)와 Chiller/fluidFlow(다중 mesh 풀 + RAF + dispose)의 **결합**이다. 둘 다 단일 컴포넌트 전용 커스텀 메서드로 검증되어 있어 그대로 답습한다. 차이점은 (a) emissive 펄스 대신 RingGeometry 웨이브 방사, (b) 풀 자원이 path-Points가 아닌 Ring × ringCount 개수.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.sensorInst = wemb.getDesignComponent('IntrusionDetectionSensor');
this.sensorInst._sensorAlertDirectionParent = wemb.threeElements.scene;
this.sensorInst.sensorAlertDirection.start();   // register.js 자동 start 한 경우 no-op

// 침입 감지 토픽 어댑터
const handleIntrusionData = (data) => {
    this.sensorInst.sensorAlertDirection.setAlert({
        active: data.detected,                              // bool
        direction: data.direction || 0                      // degrees, 0~360
    });
};

// 웨이브/화살표 옵션 외부 변경
this.sensorInst.sensorAlertDirection.setWaveOptions({
    period: 1000,          // 빠른 알람
    ringCount: 6,          // 더 많은 ring
    color: 0xff8000        // 주황색
});
this.sensorInst.sensorAlertDirection.setArrowOptions({ length: 1.5 });
```

---

## 모델 주의사항

- `models/IntrusionDetectionSensor/01_default/IntrusionDetectionSensor.gltf`의 단일 메시 이름은 `'IntrusionDetectionSensor'`로 확정. sensorAlertDirection은 `getObjectByName('IntrusionDetectionSensor')`로 boundingBox 산출 대상 mesh를 직접 조회.
- 텍스처 폴더명은 원본 오타 `textues/` (리네임 금지) — 본 변형은 자체 mesh만 다루므로 텍스처와 무관.
- 화살표/ring 크기는 maxDim 비례로 결정되므로 모델 크기가 바뀌어도 시각 비율 유지.
- preview는 ACESFilmic 톤매핑(exposure 1.2) 환경에서 화살표 emissiveIntensity 0.6 + ring opacity 0.6이 명확히 관찰됨.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level만, IIFE 없음 |
| 2 | self-null `this.sensorAlertDirection = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.sensorAlertDirection?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachSensorAlertDirection(inst)` 내부 destroy도 `inst.sensorAlertDirection = null` 포함 + 모든 ring dispose + 화살표 dispose |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setAlert/setWaveOptions/setArrowOptions/start/stop/destroy` (leakAlarmPulse/fluidFlow/chargeFlowArrow 동사 패턴 답습 — set*/start/stop/destroy) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview 침입 토글 ↔ `setAlert.active`, 방향 슬라이더 deg ↔ `setAlert.direction`(deg), period 슬라이더 ms ↔ `setWaveOptions.period`(ms), maxRadius 슬라이더 m ↔ `setWaveOptions.maxRadius`, ringCount 슬라이더 ↔ `setWaveOptions.ringCount`, color picker ↔ `setWaveOptions.color` |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 active=true + direction=0° + 자동 start로 빨강 화살표 + 4개 ring 시간차 웨이브 즉시 관찰 |
| 8 | manifest + IntrusionDetectionSensor/CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 후보 (강력, 2번째 적용 시점)**: LeakDetector/leakAlarmPulse + 본 변형(IntrusionDetectionSensor/sensorAlertDirection) 두 컴포넌트에서 "센서 mesh 위 방향 화살표 + 경보 시각 채널" 패턴이 누적되었다. ADVANCED_QUEUE.md 판단 규칙상 신규 Mixin 승격 검토 시점에 도달. 본 사이클은 메인 루프 제약(신규 Mixin 금지)으로 커스텀 메서드 유지. 다음 후보:
  - `DirectionalIndicatorArrowMixin`(가칭) — 두 변형 공통 화살표 부분만 추출
  - `MeshEmissivePulseMixin`(가칭) — leakAlarmPulse 전용 emissive 펄스
  - `RingPulseWaveMixin`(가칭) — sensorAlertDirection 전용 ring 웨이브
- **3번째 컴포넌트 등록 시점에 강제 검토**: 동일 패턴이 3번째 컴포넌트에서 요청되면 메인 루프 외부에서 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 승격 권장.
- **direction vector 입력 옵션**: 현재 `direction`은 degrees 단일 number이지만, `{x, y, z}` vector 입력도 받도록 확장 검토. `Math.atan2(z, x)`로 내부 변환.
- **ring 자세 옵션**: 현재 ring은 XZ 평면(수평) 고정. 일부 시나리오는 XY 평면(수직) 또는 카메라 facing(billboard)이 더 적합할 수 있음 — `setWaveOptions.orientation` 추가 검토.
