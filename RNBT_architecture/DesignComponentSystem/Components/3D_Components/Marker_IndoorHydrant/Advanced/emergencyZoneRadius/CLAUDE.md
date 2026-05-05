# Marker_IndoorHydrant — Advanced/emergencyZoneRadius

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'MarkerIndoorHydrant_A' Mesh의 단일 material(`Material #41`) 색상 변경 (Standard 승계, `material.color` 채널)
2. **보호 영역 반투명 구체 시각화** — Marker_IndoorHydrant 주변에 반투명 구체(`SphereGeometry` + 반투명 `MeshBasicMaterial`)를 자체 생성하여 옥내 소화전의 보호/관할 영역(소화 호스 도달 거리)을 시각화 (GasDetector/sensorHud의 sphere 채널 답습 + Marker_Firealarm/emergencyZoneRadius #62 답습)
   - 반경(`radius`)을 외부 명령형 API로 동적 변경(geometry 재생성 — `dispose` + 새 SphereGeometry 할당)
   - emergency 비활성(idle) 시 정적 반투명 구체 — opacity 0.18 (보호 영역 표시)
3. **비상 시 발광 증가** — emergency 모드 활성 시 두 시각 채널이 함께 sine wave 변조 (LeakDetector/leakAlarmPulse 펄스 패턴 + Marker_Firealarm/emergencyZoneRadius #62 답습)
   - **Marker_IndoorHydrant mesh의 `material.emissive`** sine wave 변조 (emissive 광휘 펄스, emissive color로 비상 색상 발광)
   - **반투명 구체의 `material.opacity`**도 동일 phase로 sine 변조 (idle 0.18 → emergency 시 0.25~0.55 사이 진동) — 보호 영역 자체가 깜빡이며 시선 유도
   - emergency=false 시 emissive 원복(원본 보존/복원) + opacity 정적 0.18로 복귀
4. **외부 명령형 API** — 페이지가 `instance.emergencyZoneRadius.setEmergency/setRadius/setColor/setPulseOptions/show/hide/start/stop/destroy` 직접 호출하여 비상 상태/반경/색상/펄스 옵션 제어

> **#62 Marker_Firealarm/emergencyZoneRadius와 시그니처 100% 동일**. 모델 차이(meshName/material id)만 보정하고 알고리즘·옵션 기본값·라이프사이클은 완전히 답습.

---

## Marker_IndoorHydrant mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/Marker_IndoorHydrant/01_default/Marker_IndoorHydrant.gltf` |
| mesh 이름 | **`MarkerIndoorHydrant_A`** — 폴더명 `Marker_IndoorHydrant`(`Marker` + `_` + `IndoorHydrant`)과 **구분자 위치 + 접미 불일치**. `getObjectByName`은 이름을 그대로 비교하므로 반드시 `'MarkerIndoorHydrant_A'`(언더스코어 제거 + A)로 조회 |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용. material은 단일 객체 (`Material #41`) |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh: MarkerIndoorHydrant_A)`와 일치. Standard도 `'MarkerIndoorHydrant_A'` mesh 기반으로 동작 중. 본 변형도 그 규약을 따른다.

### 모델 스케일 주의 (sphere radius 기본값 결정)

루트 `scale [1000, 1000, 1000]` 적용 후 실제 장면 크기는 약 **5.94 × 6.86 × 0.20 단위** (Marker_Firealarm·Marker 계열 8개 모두 동일 베이스 판 지오메트리 — 동일 수치). maxDim ≈ 6.86. 보호 영역 구체의 기본 반경은 `maxDim * 1.5 ≈ 10.3` 단위로 설정하여 Marker_IndoorHydrant 판을 충분히 둘러싸도록 한다 (#62 동일 공식 — `maxDim × 1.5` 그대로 유지). GasDetector(maxDim ≈ 0.7)와 비교하면 동일 sensorHud 패턴이라도 Marker 계열은 root scale 1000 적용 후 절대 크기가 훨씬 크다.

---

## 큐 정의 vs 실제 구현 — Mixin 채택 결정

**큐 설명**: "보호 영역 반투명 구체 (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.emergencyZoneRadius` (신규 Mixin 없음 — #62 답습)

### 결정 근거

1. **#62 Marker_Firealarm/emergencyZoneRadius 직전 사이클 답습** — 동일 변형명·동일 도메인(emergency zone marker)이므로 시그니처 100% 일치. 신규 Mixin 생성 금지 정책에 따라 커스텀 메서드로 완결.
2. **반투명 구체는 자체 mesh 생성 + 동적 반경** — GasDetector/sensorHud가 검증한 "SphereGeometry + 반투명 MeshBasicMaterial 자체 생성 + setRadius로 geometry 재생성" 패턴을 그대로 답습. AnimationMixin은 GLTF 내장 클립 재생용이라 부적합.
3. **emergency 발광 증가는 emissive sine wave 변조** — LeakDetector/leakAlarmPulse가 검증한 "material.emissive sine wave 변조 + RAF 루프 + 원본 보관/복원" 패턴 답습. 단일 material(Marker 계열은 단일 material)이므로 LeakDetector의 배열 material 처리는 필요 없고 단일 material 경로로 단순화.
4. **구체 + 발광 통합** — 비상 시 두 시각 채널(mesh emissive + sphere opacity)이 단일 트리거(`setEmergency({ active })`)로 동시 활성화되어야 한다. 각 기능을 독립 Mixin으로 분리하면 페이지가 두 호출을 동기화해야 하는 부담 발생. 단일 커스텀 메서드 네임스페이스로 묶어 통일한다.

---

## Mixin 승격 임계점 도달

- **#62 Marker_Firealarm + #63 Marker_IndoorHydrant 동일 시그니처 100% 일치** — 두 변형은 동일 변형명(`emergencyZoneRadius`), 동일 도메인(emergency zone marker), 동일 API(`setEmergency/setRadius/setColor/setPulseOptions/show/hide/start/stop/destroy`), 동일 알고리즘(SphereGeometry 자체 생성 + emissive sine 펄스 + sphere opacity 동기 펄스), 동일 옵션 기본값(period 900ms, idleOpacity 0.18, maxOpacity 0.55, maxEmissive 1.5, color 0xff3030, radius factor 1.5)을 공유한다.
- ADVANCED_QUEUE.md "승격 기준" 4조건 중 (1) 기법 동일성 + (2) API 호환성을 확실히 만족한다.
- **강력 후보**: `EmergencyZoneRadiusMixin` 또는 (`RadiusSphereMixin` + `MeshEmissivePulseMixin`) 분리
- **권장 시점**: #64 Marker_OutdoorHydrant 답습 후 메인 루프 외부에서 수동 승격 (`create-mixin-spec` → `implement-mixin`)
- 본 사이클(#63)은 메인 루프 신규 Mixin 금지 정책으로 커스텀 메서드 유지하되, 승격 임계점 도달 사실을 명시적으로 기록한다.

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.emergencyZoneRadius` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### MeshState 채널과의 충돌 회피 정책

**원칙**: emergencyZoneRadius는 `material.emissive`(광휘) 채널 + 별도 자체 sphere mesh만 사용한다. MeshStateMixin이 사용하는 `material.color`(반사색) 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` (×1 — Marker_IndoorHydrant 단일 material `Material #41`) | 데이터 상태 색상 (Standard 승계) |
| emergencyZoneRadius emissive | `material.emissive` + `material.emissiveIntensity` (×1 material) | 비상 시 mesh 광휘 펄스 |
| emergencyZoneRadius sphere | 별도 자체 SphereGeometry + MeshBasicMaterial (Marker_IndoorHydrant material 무관) | 보호 영역 반투명 시각화 + opacity 펄스 |

세 채널이 직교 — 펄스 활성화 시 데이터 상태 색상 보존, sphere는 별도 자원이므로 mesh material 무관, 펄스 정지 시 emissive만 원복하면 된다.

### sphere 디자인 (GasDetector/sensorHud + #62 답습)

- geometry: `new THREE.SphereGeometry(radius, 32, 16)` — radius는 `setRadius(m)` 또는 기본값 `maxDim * 1.5 ≈ 10.3`
- material: `new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })`
- mesh: `new THREE.Mesh(geometry, material)`
- 위치: Marker_IndoorHydrant mesh의 boundingBox 중심에 `mesh.position.copy(markerCenter)` (mount 시 1회 설정 — Marker는 정적이므로 매 프레임 갱신 불요)
- parent: `_sphereParent` > `appendElement` 우선순위 (sensorHud 답습)
- depthWrite: false → 다른 mesh에 가려져도 wireframe-like 시각 표현 보장
- side: DoubleSide → 카메라가 구체 내부에서 봤을 때도 보임
- frustumCulled: false → 큰 구체 안에 카메라가 들어가도 컬링되지 않음

### 펄스 알고리즘 (sine wave — #62 답습)

```
t                = performance.now() (ms)
phase            = (t / period) * 2π
intensity        = (sin(phase) + 1) / 2          // 0 ~ 1 정규화

[mesh emissive 채널]
emissiveLerp     = lerp(minEmissive, maxEmissive, intensity)
material.emissive.setHex(emergencyColor)
material.emissiveIntensity = emissiveLerp

[sphere opacity 채널]
opacityLerp      = lerp(idleOpacity, maxOpacity, intensity)
sphereMaterial.opacity = opacityLerp
```

| 파라미터 | 기본값 | 설명 |
|---------|-------|-----|
| period | 900 ms | 한 사이클(0 → max → 0) 길이 — leakAlarmPulse 700ms보다 약간 느린 비상 펄스 |
| color (emergencyColor) | 0xff3030 (적색) | 비상 emissive + sphere 색상 표준 빨강 (옥내 소화전도 화재 비상 도메인이므로 #62와 동일) |
| minEmissive | 0 | sine 위상이 -1일 때 완전 소등 |
| maxEmissive | 1.5 | ACES Filmic 톤매핑(노출 1.2) 환경에서 명확한 시각 변화 |
| idleOpacity | 0.18 | sensorHud sphere 기본값과 동일 — emergency 비활성 시 정적 보호 영역 표시 |
| maxOpacity | 0.55 | emergency 시 sphere 깜빡임 상한 (반투명 유지하면서 시선 유도) |

### 원본 보관/복원 정책 (#62 답습 — 단일 material 단순화)

`_originals: { savedEmissive: Color, savedIntensity: number }` — 단일 mesh × 단일 material.

- `start()` 또는 `setEmergency({ active: true })` 첫 호출 시점에 mesh의 단일 material(`Material #41`)에 대해 `emissive.clone()`과 `emissiveIntensity`를 보관
- `stop()` / `setEmergency({ active: false })` / `destroy()` 시 보관된 `emissive`를 `material.emissive.copy(saved)`로 복원, `emissiveIntensity`도 원래 값 복원
- material이 emissive 속성이 없는 타입(MeshBasicMaterial 등)이면 silent skip — 단, `Material #41`은 PBR이므로 emissive 지원

> MeshStateMixin이 매 `setMeshState` 호출 시 `material = material.clone()`을 수행하므로, 펄스 동작 중에도 status 갱신이 발생할 수 있다. emergencyZoneRadius는 매 RAF tick에서 `mesh.material`을 재조회하여 적용 대상 material을 최신 참조로 사용한다(stale clone 회피).

### 커스텀 네임스페이스 `this.emergencyZoneRadius` (#62와 시그니처 100% 동일)

| 메서드 | 동작 |
|--------|------|
| `setEmergency({ active })` | 비상 모드 토글. `active`(bool)에 따라 펄스 + sphere opacity 펄스 동시 ON/OFF. active=false 시 emissive 원복 + opacity 정적 idleOpacity로 복귀 |
| `setRadius(meters)` | 보호 반경 변경. `SphereGeometry` 재생성(`dispose` + `new SphereGeometry(meters, 32, 16)`)하여 mesh에 적용 |
| `setColor(colorHex)` | sphere 색상(MeshBasicMaterial.color) + emergency emissive 색상 동시 변경. 그러나 mesh `material.color`(MeshState 채널)은 건드리지 않음 |
| `setPulseOptions({ period, minEmissive, maxEmissive, idleOpacity, maxOpacity })` | 펄스 파라미터 변경 (모두 optional). 활성 펄스 옵션 즉시 반영 |
| `show()` | sphere 표시 (`mesh.visible = true`) |
| `hide()` | sphere 숨김 (`mesh.visible = false`). 펄스 RAF는 유지 |
| `start()` | sphere mesh ensure(lazy 생성) + parent에 add + RAF 루프 시작. active=true이면 즉시 emissive/opacity 펄스, active=false이면 RAF 정지 (정적 idle 상태) |
| `stop()` | RAF 정지 + emissive 원복 + sphere opacity = idleOpacity. mesh/geometry/material은 유지(재시작 가능) |
| `destroy()` | RAF cancel + emissive 원복 + sphere geometry/material dispose + parent에서 remove + 마지막 줄 `this.emergencyZoneRadius = null` (self-null) |

#### setEmergency 입력 포맷

```javascript
{
    active: boolean   // true → emissive + sphere opacity 펄스 ON / false → 둘 다 OFF (emissive 원복, opacity 정적 idleOpacity)
}
```

### parent 결정 우선순위 (sphere)

```
1) this._sphereParent       — 페이지/preview가 직접 주입 (scene 또는 Marker 그룹의 부모)
2) this.appendElement       — GLTF 루트
3) 둘 다 없으면 start no-op (안전 가드)
```

### equipmentStatus 자동 연동

본 변형은 **equipmentStatus를 emergency 트리거로 직접 사용하지 않는다**. equipmentStatus는 Standard 승계로 `meshState.renderData`만 수행하여 색상 채널만 갱신. emergency(active) 토글은 페이지가 별도 토픽(예: `fireAlarmTrigger` 또는 BMS 어댑터)을 받아 `instance.emergencyZoneRadius.setEmergency({...})` 외부 명령형 호출로 위임한다 (#62와 동일 정책 — 화재 비상은 status와 직교한 별도 신호).

### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| active (시드) | `false` | mount 직후 정적 반투명 구체만 표시 (보호 영역 idle) — 페이지/preview 비상 발생 시점에 setEmergency 호출 |
| radius | `maxDim * 1.5` (mount 시점 boundingBox 기반, ≈ 10.3 단위) | mount 직후 Marker_IndoorHydrant을 둘러싸는 반투명 구체 즉시 표시 |
| color | 0xff3030 | 비상 표준 빨강 (sphere material + emergency emissive) |
| period | 900 ms | 명확하고 약간 느린 비상 펄스 |
| maxEmissive | 1.5 | ACES Filmic + 노출 1.2 환경에서 시각적 변조 |
| idleOpacity | 0.18 | sensorHud 기본값과 동일 |
| maxOpacity | 0.55 | emergency 펄스 상한 |
| autoStart on mount | true | preview/operations 시각 관찰 우선 (#62 동일 정책) |

> **자동 start 규약**: 본 변형은 `setEmergency` 시드를 `active=false`로 두지만 `start()`는 mount 직후 자동 호출하여 정적 반투명 구체를 즉시 시각 관찰 가능하게 한다 (Phase 1.5 항목 #7). emergency 활성은 페이지가 화재 감지 시점에 명시적으로 `setEmergency({ active: true })` 호출. preview에서는 데모 토글로 시뮬레이션. "비상은 평소 OFF" 의미를 시각적으로 명확히 하기 위해 idle을 시드로 한다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

emergency 토글은 페이지가 외부 명령형으로 `setEmergency/setRadius/setColor/setPulseOptions` 직접 호출.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='MarkerIndoorHydrant_A' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.emergencyZoneRadius` API 등록 + 기본값 시드 (`active=false, radius=maxDim*1.5, color=0xff3030`) + (parent 가용 시) **자동 start** + equipmentStatus 구독(`meshState.renderData`)
- 페이지가 추가로 `_sphereParent` 주입 후 `setEmergency/setRadius/setColor/setPulseOptions` 외부 명령형 호출
- `beforeDestroy.js`: 구독 해제 → `this.emergencyZoneRadius?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/emergencyZoneRadius |
|------|----------|------------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.emergencyZoneRadius` 네임스페이스 | 없음 | `setEmergency/setRadius/setColor/setPulseOptions/show/hide/start/stop/destroy` 노출 |
| RAF 루프 | 없음 | emergencyZoneRadius 자체 관리 (active=true 시 펄스, active=false 시 정지) |
| `material.emissive` 채널 사용 | 없음 | 사용 (보관/sine 변조/복원) |
| Three.js geometry/material 자체 자원 | 없음 | SphereGeometry + MeshBasicMaterial 자체 생성/dispose |
| sphere (별도 mesh) | 없음 | Marker_IndoorHydrant 주변 부유 (보호 영역) |
| beforeDestroy | meshState만 정리 | emergencyZoneRadius → meshState 역순 정리 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/emergencyZoneRadius는 추가로 (a) emissive 채널 sine wave 변조 RAF, (b) 자체 SphereGeometry/MeshBasicMaterial 자원, (c) sphere opacity 펄스 채널, (d) `setEmergency/setRadius/setColor/setPulseOptions` 외부 명령형 API — 네 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 + 자체 mesh 생성 + RAF 라이프사이클이 모두 추가되므로 별도 폴더로 분리한다.

---

## #62 Marker_Firealarm 답습 명세 (시그니처 100% 동일)

| 측면 | #62 Marker_Firealarm | #63 Marker_IndoorHydrant (본) |
|------|----------------------|--------------------------------|
| 변형명 | emergencyZoneRadius | emergencyZoneRadius |
| 도메인 | 화재 경보기 (emergency zone marker) | 옥내 소화전 (emergency zone marker) |
| meshName | `MarkerFirealarm_A` | `MarkerIndoorHydrant_A` |
| material id | `Material #38` | `Material #41` |
| root scale | [1000,1000,1000] | [1000,1000,1000] (동일) |
| maxDim | ≈ 6.86 (베이스 판) | ≈ 6.86 (동일 베이스 판) |
| sphere radius factor | 1.5 (≈10.3) | 1.5 (≈10.3) (동일) |
| color | 0xff3030 | 0xff3030 (동일) |
| period | 900 ms | 900 ms (동일) |
| idleOpacity | 0.18 | 0.18 (동일) |
| maxOpacity | 0.55 | 0.55 (동일) |
| maxEmissive | 1.5 | 1.5 (동일) |
| API | setEmergency/setRadius/setColor/setPulseOptions/show/hide/start/stop/destroy | **완전 동일** |
| 자동 start | ✓ (mount 직후) | ✓ (mount 직후, 동일) |
| 시드 active | false | false (동일) |
| material 경로 | 단일 (Array.isArray 안전 가드) | 단일 (동일) |

차이는 **meshName 문자열 + material id 표기뿐**. 알고리즘·옵션·라이프사이클 100% 동일.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.markerInst = wemb.getDesignComponent('Marker_IndoorHydrant');
this.markerInst._sphereParent = wemb.threeElements.scene;   // GLTF 루트가 아니라 scene에 add (선택)
this.markerInst.emergencyZoneRadius.start();   // register.js가 자동 start 한 경우 no-op
this.markerInst.emergencyZoneRadius.setRadius(15.0);    // 옥내 소화전별 호스 도달 거리 조정

// 화재 비상 토픽 어댑터
const handleFireAlarm = (data) => {
    this.markerInst.emergencyZoneRadius.setEmergency({
        active: data.fireDetected   // bool
    });
};

// 펄스 옵션 외부 변경
this.markerInst.emergencyZoneRadius.setPulseOptions({
    period: 600,            // 더 빠른 펄스
    maxEmissive: 2.0,       // 더 강한 발광
    maxOpacity: 0.7         // 더 진한 sphere
});
this.markerInst.emergencyZoneRadius.setColor(0xff8000);   // 주황색 변경
```

---

## 모델 주의사항

- `models/Marker_IndoorHydrant/01_default/Marker_IndoorHydrant.gltf`의 단일 메시 이름은 `'MarkerIndoorHydrant_A'`로 확정 (폴더명 `Marker_IndoorHydrant`과 다름 — 구분자 위치 + 접미 불일치). emergencyZoneRadius는 `getObjectByName('MarkerIndoorHydrant_A')`로 boundingBox 산출 + emissive 변조 대상 mesh를 직접 조회.
- Marker_IndoorHydrant은 root scale [1000,1000,1000] 적용 후 실제 ~5.94 × 6.86 × 0.20 단위 (Marker 계열 8개 모두 동일 베이스 판). maxDim ≈ 6.86. sphere 기본 반경 maxDim × 1.5 ≈ 10.3 단위로 Marker 판을 충분히 둘러싸도록 설정.
- material은 단일 객체(`Material #41`, PBR) — emissive 속성 지원. `roughness 0.450053632`는 emissive 채널과 무관하므로 펄스 동작에 영향 없음.
- sphere는 `_sphereParent` 또는 `appendElement`(GLTF 루트)에 add. preview에서는 scene을 직접 `_sphereParent`로 주입하여 GLTF root scale 1000 변환을 받지 않고 절대 좌표(scene 좌표계)에서 동작 — sphere position은 mesh boundingBox(`Box3.setFromObject`로 변환 적용 후 좌표) 중심을 사용하므로 이미 월드 좌표 기준.
- preview는 ACESFilmic 톤매핑(exposure 1.2) 환경에서 펄스 maxEmissive 1.5 + sphere maxOpacity 0.55가 명확히 관찰됨.
- doubleSide + frustumCulled=false 옵션으로 카메라가 큰 구체 안에 들어가도 정상 렌더.

---

## Phase 1.5 자율검증 결과 (기준 = Marker_Firealarm/Advanced/emergencyZoneRadius #62)

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level만, IIFE 없음 |
| 2 | self-null `this.emergencyZoneRadius = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.emergencyZoneRadius?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachEmergencyZoneRadius(inst)` 내부 destroy도 `inst.emergencyZoneRadius = null` 포함 + emissive 복원 + sphere dispose |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setEmergency/setRadius/setColor/setPulseOptions/show/hide/start/stop/destroy` (#62와 100% 동일) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview emergency 토글 ↔ `setEmergency.active`(bool), radius 슬라이더 m ↔ `setRadius(m)`, period 슬라이더 ms ↔ `setPulseOptions.period`(ms), color picker hex ↔ `setColor(hex)` |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 active=false + 자동 start로 정적 반투명 빨간 구체(반경 maxDim×1.5≈10.3, opacity 0.18) 즉시 관찰 + emergency 토글 시 mesh 발광 펄스 + sphere opacity 펄스 함께 시작 |
| 8 | manifest + Marker_IndoorHydrant/CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 임계점 도달 (재확인)**: #62 Marker_Firealarm + #63 Marker_IndoorHydrant 두 사이클이 동일 시그니처 100% 일치를 입증했다. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"의 (1) 기법 동일성 + (2) API 호환성을 만족하므로 강력한 승격 신호다.
- **승격 후보 이름**: `EmergencyZoneRadiusMixin`(가칭, 통합) 또는 분리 안 (`RadiusSphereMixin` + `MeshEmissivePulseMixin`)
- **승격 시 분리 권장 (재확인)**: GasDetector/sensorHud의 sphere 부분 + LeakDetector/leakAlarmPulse의 emissive 펄스 부분이 직교하므로:
  - (a) `RadiusSphereMixin`(가칭) — 자체 sphere 생성/dispose + setRadius/setColor + 동적 opacity 변조 옵션
  - (b) `MeshEmissivePulseMixin`(가칭) — emissive 채널 sine 변조 + 원본 보관/복원
  - 컴포넌트 register에서 두 Mixin을 함께 적용 + 트리거 통합은 컴포넌트 자체 메서드(`setEmergency`)
- **#64 Marker_OutdoorHydrant 답습 후 수동 승격 권장**: 큐 #64도 동일 `emergencyZoneRadius` 변형명. 본 사이클에서는 메인 루프 신규 Mixin 금지 정책으로 커스텀 메서드 유지하되, #64 답습 완료 후 메인 루프 외부에서 사용자 수동 작업으로 `create-mixin-spec` → `implement-mixin` 호출 권장.
- **sphere position 정책**: 본 변형은 sphere를 mount 시 1회 위치 설정(Marker는 정적). 만약 marker가 페이지 동적 이동 시나리오 추가되면 RAF 매 프레임 위치 갱신 필요 — 현재는 over-engineering 회피로 정적 설정만 한다.
