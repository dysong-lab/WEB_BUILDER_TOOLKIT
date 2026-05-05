# CoolingTower — Advanced/steamEjection

## 기능 정의

1. **상태 색상 표시 (Standard 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 'CoolingTower' Group 노드(자식 mesh waterTower, waterTowerLadder_A 포함)의 material.color 변경. Standard와 동일한 colorMap 사용.
2. **상승 수증기 파티클 시각화** — CoolingTower mesh 상단(local +Y 오프셋)에 분출구를 두고 `THREE.Points` + `BufferGeometry` 기반 파티클 풀(최대 N=200)을 생성. 매 프레임 RAF에서 alive 입자의 position(Y 상승)/age 갱신. age >= lifetime이면 dead 표시 후 emissionRate 비례로 새 spawn 슬롯에 재활용. 풀 크기는 register 시점에 1회 할당된 BufferGeometry attribute에 in-place mutation만 수행 (재할당 없음).
3. **온도 → 생성률 매핑** — 외부 텔레메트리(`setTemperature(celsius)`)가 들어오면 사전 등록된 매핑(`setTemperatureMap({tempMin, tempMax, rateMin, rateMax})`)에 따라 선형 보간하여 emissionRate(perSec)를 산출. 기본 매핑은 `0°C → 0/s`, `60°C → 80/s`, 즉 30°C 정도면 ~40/s.
4. **RAF idle 일시정지** — emissionRate = 0이면서 alive 파티클 0개일 때 RAF 자체를 stop(비용 0). emissionRate이 다시 > 0이 되거나 아직 alive 파티클이 남아있으면 RAF 재시작. (큐 #32 ai_detectionZone의 만료 RAF idle 패턴, Marker_AICCTV/ai_detectionZone 답습)
5. **외부 명령형 API** — 페이지가 `instance.steamEjection.setEmissionRate/setTemperature/setTemperatureMap/setRiseSpeed/setLifetime/setSpread/setColor/setOpacity/setEmissionOriginOffset/start/stop/isRunning/enable/disable/isEnabled/destroy`를 직접 호출하여 분출 제어.

---

## CoolingTower mesh 구조

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/CoolingTower/01_default/CoolingTower.gltf` |
| 분출 기준 mesh 이름 | `CoolingTower` (GLTF Group 노드 — 자식 waterTower, waterTowerLadder_A 포함, Standard와 동일) |
| 결정 | **단일 group** (Standard와 동일) |

---

## 신규 기법 명시 — Points 풀 + RAF 매 프레임 갱신

본 변형은 **저장소에서 본격적인 THREE.Points 기반 파티클 시스템을 구현하는 첫 사례**다. #29~#33의 mesh 풀(콘/구/박스 mesh × N) 또는 알람 emissive RAF와 다른 **Points 풀 + RAF 매 프레임 in-place attribute mutation** 패턴이다.

답습 모범:

| 답습 | 항목 |
|------|------|
| `Marker_MoveCCTV/Advanced/fieldOfView` | RAF self-null 패턴 + `cancelAnimationFrame(rafId)` + `rafId = null` |
| `BATT/Advanced/alarmPulse` | emissive RAF + `entries.size === 0` 시 RAF stop, ensureLoop 패턴 |
| `meshesArea/STATCOM_MMC/Advanced/pipeFlow` | 텍스처/리소스 mutation + RAF 패턴 (CanvasTexture 활용) |
| `Marker_AICCTV/Advanced/ai_detectionZone` | 만료 RAF idle 일시정지 (markerPool 0개 시 RAF stop) |

**큐 설명**: "상부 수증기 파티클 (온도 비례 생성률) (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.steamEjection` (신규 Mixin **없음**)

### Mixin 승격 메모 (필수)

> **#36 CoolingTower02/steamEjection, #37 CoolingTower03/steamEjection이 동일 기법으로 큐 대기. 본 변형 + 다음 2개 = 3개 임계점 도달 예정. 향후 SteamParticleMixin(또는 더 일반적인 RisingParticleMixin) 승격 강력 검토. 본 사이클은 신규 Mixin 금지 정책으로 커스텀.**

큐 #35(본 변형) + #36(CoolingTower02) + #37(CoolingTower03)에서 동일 기법이 확정적으로 등장한다. 본 사이클은 1차 등장이므로 **단일 컴포넌트 전용 → 커스텀 메서드** 규칙에 따라 커스텀으로 완결하지만, 메인 루프 외부에서 사용자가 #36, #37 완료 후 `create-mixin-spec` → `implement-mixin` 호출로 `SteamParticleMixin`(또는 `RisingParticleMixin`) 승격을 강력 권장.

- **승격 후보 이름**: `SteamParticleMixin` 또는 더 일반적인 `RisingParticleMixin`
- **흡수할 메서드**: `setEmissionRate/setTemperature/setTemperatureMap/setRiseSpeed/setLifetime/setSpread/setColor/setOpacity/setEmissionOriginOffset/start/stop/isRunning/enable/disable/isEnabled/destroy`
- **#38 Pump/dynamicRpm**: 회전 패턴(다른 기법) — 본 그룹에 포함되지 않음

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.steamEjection` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습)

### MeshState 채널과의 충돌 회피 정책

**원칙**: steamEjection은 **자체 생성 `THREE.Points` mesh와 BufferGeometry/PointsMaterial만** 사용한다. MeshStateMixin이 사용하는 `material.color`(CoolingTower 그룹의 자식 material) 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` (CoolingTower 그룹의 자식 material) | 데이터 상태 색상 (Standard 승계) |
| steamEjection (커스텀) | 자체 `THREE.Points` (BufferGeometry + PointsMaterial) | 상승 수증기 파티클 시각화 + 온도→생성률 매핑 + RAF 매 프레임 in-place mutation |

두 채널이 직교 — MeshState는 sensor mesh의 색을, steamEjection은 별도 Points mesh를 다룬다. 정지 시 단순 `visible = false`, 종료 시 RAF cancel + Points/Geometry/Material/Texture dispose + `this.steamEjection = null` (self-null).

### 풀 알고리즘

```
풀 크기: N = 200 (고정, register 시점 1회 할당)
attribute:
  - position: Float32Array(N * 3)
  - alpha:    Float32Array(N) (alpha 채널 — 사용자 정의 attribute, 미사용 시 단순 lifetime 페이드)
  - age:      Float32Array(N) (각 입자의 누적 시간)
  - lifetime: Float32Array(N) (각 입자의 lifetime — 약간의 jitter)
  - active:   Uint8Array(N) (1=alive, 0=dead)

매 프레임 (dt = (now - lastTick) / 1000):
  spawnBudget += emissionRate * dt
  활성 입자 갱신: position.y += riseSpeed * dt; age += dt; if age >= lifetime → active=0
  스폰: spawnBudget >= 1 인 동안 dead 슬롯 찾아 재활용 (position 초기화, age=0)
  geometry.attributes.position.needsUpdate = true
  material.opacity = base alpha (PointsMaterial의 sizeAttenuation 활용)

idle 일시정지: emissionRate === 0 && aliveCount === 0 → RAF stop
```

### 분출 spread

`setSpread(radius)`로 분출구 평면 반경을 결정. 새 입자는 분출구 중심에서 `radius` 내 무작위 평면 좌표(local x, z)에서 시작. 상승은 local +Y 방향. age에 따라 alpha가 1 → 0 페이드 (PointsMaterial.opacity는 전체에 곱해지고, age/lifetime 비율을 활용한 부드러운 페이드는 매 프레임 size scale로 시각화).

### 분출구 위치

- `setEmissionOriginOffset({x, y, z})` 외부 조정 (기본: `{x:0, y:2.0, z:0}` — CoolingTower mesh 상단 위)
- 매 프레임 분출 기준 mesh의 worldPosition을 산출하여 `points.position.copy(anchor + offset)`

### material

```javascript
new THREE.PointsMaterial({
    size:            0.15,
    transparent:     true,
    opacity:         0.7,
    color:           0xffffff,    // 흰색 (안개)
    depthWrite:      false,
    sizeAttenuation: true,
    map:             circleTexture   // CanvasTexture 부드러운 점 (선택, 없어도 무방)
});
```

### 온도 → 생성률 매핑

`setTemperatureMap({tempMin, tempMax, rateMin, rateMax})`로 사전 등록. `setTemperature(celsius)` 호출 시 선형 보간:

```
ratio = clamp((celsius - tempMin) / (tempMax - tempMin), 0, 1)
emissionRate = lerp(rateMin, rateMax, ratio)
setEmissionRate(emissionRate)
```

기본 매핑: `{tempMin: 0, tempMax: 60, rateMin: 0, rateMax: 80}`. 즉:
- 0°C → 0/s (분출 정지)
- 30°C → 40/s
- 60°C → 80/s

### parent 결정 우선순위 (scene 직속 강제)

```
1) this._steamEjectionParent  — 페이지/preview 직접 주입 (scene)
2) wemb.threeElements.scene   — 운영 환경 자동
3) this.appendElement         — GLTF 루트 fallback (root scale 영향, 주의)
4) 둘 다 없으면 enable no-op (안전 가드)
```

### 커스텀 네임스페이스 `this.steamEjection`

| 메서드 | 동작 |
|--------|------|
| `setEmissionRate(perSec)` | 초당 생성 입자 수 직접 설정 (외부 매핑 우회) |
| `setTemperature(celsius)` | 외부 텔레메트리 입력. 등록된 매핑으로 emissionRate 산출 후 setEmissionRate |
| `setTemperatureMap({tempMin, tempMax, rateMin, rateMax})` | 매핑 사전 등록 |
| `setRiseSpeed(unitsPerSec)` | 입자 상승 속도 |
| `setLifetime(sec)` | 입자 수명 (s) |
| `setSpread(radius)` | 분출구 반경 (m) |
| `setColor(hex)` | 입자 색상 (number 또는 string) |
| `setOpacity(0~1)` | 입자 alpha 베이스 |
| `setEmissionOriginOffset({x,y,z})` | 분출구 local offset 조정 |
| `start() / stop()` | 명시적 RAF 토글. stop은 spawnBudget=0으로 (alive 입자만 사라짐을 기다림) |
| `isRunning()` | RAF 활성 여부 |
| `enable() / disable() / isEnabled()` | Points mesh visible 토글 |
| `destroy()` | RAF cancel + Points scene.remove + geometry.dispose + material.dispose + texture?.dispose + 모든 reference null + 마지막 줄 `this.steamEjection = null` |

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| poolSize | 200 | 풀 충분 (60Hz × 5s × 80/s = 400 < 200 위험, 그래도 spread 분산 + lifetime jitter로 시각 자연) |
| temperatureMap | `{tempMin:0, tempMax:60, rateMin:0, rateMax:80}` | 외부 매핑 표준 |
| riseSpeed | 1.5 (units/s) | scene 단위 작아 천천히 상승 |
| lifetime | 2.5 (s) | 1.5 × 2.5 = 3.75 단위 상승 후 소멸 (시야 안에 들어옴) |
| spread | 0.3 (m) | CoolingTower 상단 약 0.3 단위 반경 |
| color | 0xffffff (흰색 안개) | 어두운 배경에서 명확히 대비 |
| opacity | 0.7 | 반투명 안개 |
| size (PointsMaterial) | 0.15 | scene 단위에서 가독성 있는 점 크기 |
| emissionOriginOffset | `{x:0, y:2.0, z:0}` | CoolingTower mesh 상단 |
| autoEnable on mount | true | preview 시각 관찰 우선 (#29~#32 동일 정책) |
| 자동 데모 temperature on mount | 50°C → emissionRate ~67/s | preview 로드 직후 분출 즉시 관찰 |

> **자동 데모 정책**: register.js는 _temperature 기반 자동 시작_을 하지 않는다. preview에서 마운트 직후 `setTemperature(50)`을 호출하여 시각 관찰 보장. 운영에서는 페이지가 텔레메트리 데이터로 setTemperature 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

온도/방출률 변경은 페이지가 외부 명령형으로 직접 호출. 별도 구독 없음.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='CoolingTower' 확정)이므로 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.steamEjection` API 등록 + (parent 가용 시) **자동 enable + 풀 생성**(emissionRate=0으로 시작 — RAF idle) + equipmentStatus 구독
- 페이지가 `_steamEjectionParent` 주입 후 `setTemperature(celsius)` 호출로 분출 시작. 또는 `setEmissionRate(perSec)` 직접 호출
- `beforeDestroy.js`: 구독 해제 → `this.steamEjection?.destroy()` (RAF cancel + dispose 포함) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/steamEjection |
|------|----------|------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.steamEjection` 네임스페이스 | 없음 | 노출 |
| 자체 `THREE.Points` (BufferGeometry × N) | 없음 | 자체 생성 + scene attach + dispose |
| RAF 매 프레임 in-place attribute mutation | 없음 | 있음 — emissionRate=0 + alive=0 시 idle 일시정지 |
| 온도 → 생성률 매핑 API | 없음 | 있음 — `setTemperature/setTemperatureMap` |
| parent 결정 우선순위 (`_steamEjectionParent` → scene) | 없음 | 있음 |
| 자동 enable on mount | 없음 (단순 색상만) | 있음 |
| beforeDestroy | meshState만 정리 | steamEjection(RAF cancel 포함) → meshState 역순 정리 |
| 화면 표시 | 단일 색상 cooling tower | 단일 색상 + 상부에서 상승하는 수증기 입자 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/steamEjection은 추가로 (a) 자체 Points/BufferGeometry/PointsMaterial 자원 (b) scene 직속 attach 절차 (c) `setEmissionRate/setTemperature/setRiseSpeed/setLifetime/setSpread/setColor/setOpacity/setEmissionOriginOffset/start/stop/enable/disable` 외부 명령형 API (d) RAF 매 프레임 풀 in-place mutation 루프 — 네 채널을 페이지에 노출한다.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.ctInst = wemb.getDesignComponent('CoolingTower');
this.ctInst._steamEjectionParent = wemb.threeElements.scene;
this.ctInst.steamEjection.enable();

// 매핑 변경(선택)
this.ctInst.steamEjection.setTemperatureMap({
    tempMin: 20, tempMax: 80, rateMin: 5, rateMax: 100
});

// 텔레메트리 토픽 어댑터
const onTemperature = ({ response: data }) => {
    this.ctInst.steamEjection.setTemperature(data.celsius);
};

// 외부 직접 제어
this.ctInst.steamEjection.setRiseSpeed(2.0);
this.ctInst.steamEjection.setLifetime(3.5);
this.ctInst.steamEjection.setColor(0xeeeeff);
this.ctInst.steamEjection.setOpacity(0.5);
```

---

## 모델 주의사항

- `models/CoolingTower/01_default/CoolingTower.gltf`의 분출 기준 노드는 `'CoolingTower'` Group(자식 waterTower, waterTowerLadder_A 포함). Standard와 동일.
- Standard preview의 카메라 거리는 mesh 박스 중심으로부터 `(2, 1, 3)` 오프셋 — Y 단위로 ~2 정도 위쪽까지 보임. emissionOriginOffset Y 기본값 2.0 + spread 0.3으로 분출이 카메라 시야 내에 자연스럽게 보인다.
- **[MODEL_READY] placeholder 사용 안 함** — meshName='CoolingTower' 그룹은 컴포넌트 루트 CLAUDE.md / Standard register.js에서 이미 확정.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#29~#32 답습) |
| 2 | self-null `this.steamEjection = null` + RAF cancel | OK — destroy 마지막 줄 self-null + RAF cancelAnimationFrame + null |
| 3 | beforeDestroy.js는 호출만 | OK — `this.steamEjection?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachSteamEjection(inst)` 내부 destroy도 RAF cancel + `inst.steamEjection = null` 포함 + Points/Geometry/Material/Texture dispose + parent.remove |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setXxx/start/stop/isRunning/enable/disable/isEnabled/destroy` (#29~#32 동사 형태 답습 + alarmPulse의 ensureLoop/idle stop 패턴 답습) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview temperature slider °C ↔ `setTemperature`, spread m ↔ `setSpread`, riseSpeed units/s ↔ `setRiseSpeed`, lifetime s ↔ `setLifetime`, opacity 0~1 ↔ `setOpacity`, emission origin Y slider ↔ `setEmissionOriginOffset({y})` |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 enable + 자동 setTemperature(50) → emissionRate ~67/s + lifetime=2.5s → 흰색 점들이 CoolingTower 상부에서 상승하는 것 명확 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 강력 검토 시점 도달 — #35~#37 = 3개 컴포넌트 동일 기법 큐 확정**: 본 변형은 1차 등장이라 단일 컴포넌트 전용 → 커스텀 규칙으로 완결. 다만 #36 CoolingTower02/steamEjection, #37 CoolingTower03/steamEjection이 동일 기법으로 큐 대기 — 본 변형 + 다음 2개 = **3개 임계점 도달 예정**. 메인 루프 외부에서 #36/#37 완료 후 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 `SteamParticleMixin`(또는 더 일반적인 `RisingParticleMixin`) 승격을 강력 권장.
- **scene parent 강제 정책**: GLTF root 영향이 Points에 전파되지 않도록 반드시 `_steamEjectionParent` 또는 `wemb.threeElements.scene`에 add. appendElement(GLTF 루트) fallback은 안전 가드만.
- **풀 in-place mutation 정책**: register 시점에 BufferGeometry attribute(position/age/lifetime/active)를 1회 할당하고 매 프레임 in-place mutation만. dynamic add/remove는 절대 하지 않는다 (성능 + GC churn 회피).
- **RAF idle 일시정지 정책**: `emissionRate === 0 && aliveCount === 0`일 때 RAF stop. ensureLoop 패턴(alarmPulse 답습)으로 emissionRate 변경 또는 alive 입자 잔존 시 RAF 재시작.
- **RAF 메모리 누수 방지**: destroy에서 반드시 cancelAnimationFrame + null 처리. disable은 visible=false만 (자원 유지). enable은 RAF 재진입 안전(중복 시작 방지).
