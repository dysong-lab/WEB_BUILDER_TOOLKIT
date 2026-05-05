# LeakDetector — Advanced/leakAlarmPulse

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'LeakDetector' Mesh의 두 material(leakEtc, winBody) 색상 일괄 변경 (Standard 승계, `material.color` 채널)
2. **누수 감지 색상 펄스** — `leak === true`일 때 'LeakDetector' mesh의 `material.emissive` 채널을 sine wave 기반 RAF 루프로 주기적으로 변조하여 빨간 펄스 표현 (BATT/alarmPulse 패턴 답습)
   - 누수 감지 시 즉각적인 시선 유도가 필요한 시나리오 (현장 운영자가 모니터링 화면에서 다른 장비를 보고 있어도 급격한 발광 변화로 주의 환기)
   - 펄스는 색상이 아닌 **광휘(emissive)**로 표현되어, 데이터 색상(`material.color`)을 덮어쓰지 않음
3. **누수 방향 화살표 표시** — LeakDetector mesh 위에 자체 합성 화살표(Group: CylinderGeometry 샤프트 + ConeGeometry 헤드)를 띄워 누수 방향(degrees 0~360°)을 시각화 (BATT/chargeFlowArrow 패턴 답습 + 동적 회전)
   - direction(degrees, 0=+X 방향, 시계 반대 방향이 +)에 따라 LeakDetector 중심에서 바깥쪽으로 화살표가 가리킴
   - leak=false 시 화살표 자체 숨김 (visible=false)
4. **외부 명령형 API** — 페이지가 `instance.leakAlarmPulse.setLeak/setPulseOptions/setArrowOffset/start/stop/destroy` 직접 호출하여 누수 상태/방향/펄스 옵션 제어

---

## LeakDetector mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/LeakDetector/01_default/LeakDetector.gltf` |
| mesh 이름 | `LeakDetector` (단일 Mesh Node, 2 primitive × 2 material) |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용. `material`은 배열 `[leakEtcMat, winBodyMat]` |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh: LeakDetector, 2-primitive multi-material)`와 일치. Standard도 `'LeakDetector'` mesh 기반으로 동작 중. 본 변형도 그 규약을 따른다. material 배열 처리는 BATT/alarmPulse의 `collectMaterials` 헬퍼 패턴을 그대로 답습 — 두 서브메시(`leakEtc`, `winBody`)에 동시에 펄스 emissive가 적용된다.

---

## 큐 정의 vs 실제 구현 — Mixin 채택 결정

**큐 설명**: "누수 감지 시 색상 펄스 + 누수 방향 화살표 표시 (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.leakAlarmPulse` (신규 Mixin 없음, AnimationMixin 미사용)

### 결정 근거

1. **펄스는 emissive 변조 + RAF 기반** — BATT/alarmPulse가 검증한 "material.emissive sine wave 변조 + RAF 루프"를 그대로 답습. AnimationMixin은 GLTF 내장 클립 재생용이라 LeakDetector에는 클립이 없어 부적합.
2. **화살표는 자체 mesh 생성 + 동적 회전** — BATT/chargeFlowArrow가 검증한 "Group(Cylinder+Cone) 자체 합성 + RAF 위치 mutation + dispose"를 답습하되, **방향은 mode(charge/discharge) 대신 direction(degrees) 동적 회전**. AnimationMixin은 미리 베이크된 키프레임 기반이라 임의 각도로 부드러운 회전이 부적합.
3. **펄스 + 화살표 통합** — 누수 알람의 두 시각 채널은 한 트리거(`setLeak({ detected: true, direction })`)로 동시 활성화되어야 한다. 각 기능을 독립 Mixin으로 분리하면 페이지가 두 호출을 동기화해야 하는 부담 발생. 단일 커스텀 메서드 네임스페이스로 묶어 통일한다.

### Mixin 승격 후보 메모

본 변형의 "센서 mesh emissive 펄스 + 자체 방향 화살표" 패턴은 **#23 IntrusionDetectionSensor의 alertDirection**(침입 감지 방향), **다수 센서 컴포넌트의 alarm direction** 시나리오에서 거의 동일 기법으로 재사용 예상. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙" 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"에 따라 본 사이클은 커스텀 메서드로 완결. 2번째 컴포넌트(예: #23 IntrusionDetectionSensor) 등록 시점에 다음 신규 Mixin 후보 검토:

- **신규 Mixin 후보 이름**: `LeakAlarmDirectionMixin`(가칭) 또는 `SensorAlarmDirectionMixin`(가칭)
- **API 호환성**: 현 시그니처(`setLeak/setPulseOptions/setArrowOffset/start/stop/destroy`) 그대로 수용 가능. `setLeak`의 `detected/direction` 결합은 일반화 시 `setAlarm({ active, direction })`로 추상화 검토
- **BATT/alarmPulse + chargeFlowArrow 통합 검토**: 두 패턴을 한 Mixin으로 통합하기보다는, `MeshEmissivePulseMixin`(가칭)과 `DirectionalIndicatorArrowMixin`(가칭)으로 **분리**한 뒤 컴포넌트 register에서 두 Mixin을 함께 적용하는 안이 더 직교적. 본 변형은 통합 커스텀이지만 Mixin 승격 시 분리 권장.

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.leakAlarmPulse` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### MeshState 채널과의 충돌 회피 정책

**원칙**: leakAlarmPulse는 `material.emissive`(광휘) 채널 + 별도 자체 생성 화살표 mesh만 사용한다. MeshStateMixin이 사용하는 `material.color`(반사색) 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` (×2 — leakEtcMat + winBodyMat) | 데이터 상태 색상 (Standard 승계) |
| leakAlarmPulse 펄스 (커스텀) | `material.emissive` (+ `material.emissiveIntensity`, ×2 material) | 누수 펄스 광휘 변조 |
| leakAlarmPulse 화살표 (커스텀) | 별도 자체 Group (Cylinder+Cone), LeakDetector material 무관 | 누수 방향 시각화 |

세 채널이 직교 — 펄스 활성화 시 데이터 상태 색상 보존, 화살표는 별도 자원이므로 LeakDetector material 무관, 펄스 정지 시 emissive만 원복하면 된다.

### 펄스 알고리즘 (sine wave — BATT/alarmPulse 답습)

```
t            = performance.now() (ms)
phase        = (t / period) * 2π
intensity    = (sin(phase) + 1) / 2          // 0 ~ 1 정규화
emissiveLerp = lerp(minIntensity, maxIntensity, intensity)

각 material(2개)에 대해:
    material.emissive.setHex(pulseColor)
    material.emissiveIntensity = emissiveLerp
```

| 파라미터 | 기본값 | 설명 |
|---------|-------|-----|
| period | 700 ms | 한 사이클(0 → max → 0) 길이 |
| color | 0xff3030 (적색) | 누수 알람 표준 색상 |
| minIntensity | 0 | sine 위상이 -1일 때 완전 소등 |
| maxIntensity | 1.5 | ACES Filmic 톤매핑(노출 1.2) 환경에서 명확한 시각 변화 |

### 화살표 디자인 (BATT/chargeFlowArrow 답습 + 동적 회전)

화살표는 **CylinderGeometry**(샤프트) + **ConeGeometry**(헤드)를 `THREE.Group`으로 합성한다.

| 부품 | geometry | 크기(LeakDetector boundingBox 기반 동적 결정) |
|------|----------|------------------------------------------------|
| 샤프트 | CylinderGeometry(radius, radius, length, 12) | radius = maxDim × 0.04, length = maxDim × 0.50 |
| 헤드 | ConeGeometry(radius, length, 12) | radius = maxDim × 0.10, length = maxDim × 0.18 |

> `maxDim` = `Math.max(box.size.x, box.size.y, box.size.z)`. LeakDetector의 실제 크기 약 0.95 × 1.31 × 0.27 단위에서 maxDim ≈ 1.31. 화살표 샤프트 길이 ≈ 0.65, 헤드 길이 ≈ 0.24, 총 길이 ≈ 0.89. 헤드는 샤프트 끝(샤프트 +length/2 위치)에 부착되어 진행 방향을 시각적으로 명시.

material: `MeshStandardMaterial`로 `transparent: true, opacity: 0.85`(반투명), `depthWrite: false`, `emissiveIntensity: 0.6` (어두운 환경에서도 시각적으로 명확).

### 화살표 위치/방향 결정

- **앵커 좌표**: LeakDetector mesh의 boundingBox 중심을 기준으로 +Y 방향(위쪽)으로 maxDim × 0.10 만큼 떨어진 지점이 화살표 베이스 위치
- **direction(degrees) 회전 정책**:
  - 화살표는 기본적으로 +X 축 방향을 향한다 (`direction = 0°` → 헤드가 +X 방향)
  - `direction = 90°` → +Z 방향 (시계 반대 방향, 평면 시점에서 위쪽)
  - `direction = 180°` → -X 방향
  - `direction = 270°` → -Z 방향
  - 즉, **XZ 평면(수평면)에서 시계 반대 방향 회전** — 누수가 LeakDetector 중심 기준 어느 방향으로 발생/이동하는지 시각적 표시
- 구현: 기본 ConeGeometry는 +Y 방향이므로 (a) `Z축 -90°`로 +X 방향으로 눕히고, (b) `Y축 direction°`로 회전하여 XZ 평면 방향 결정. 이를 단일 그룹 회전으로 구현:
  - `arrowGroup.rotation.set(0, THREE.MathUtils.degToRad(direction), -Math.PI / 2)`
  - (rotation order는 Three.js 기본 'XYZ' — 먼저 Z(-90°)로 +X 방향으로 눕힌 뒤 Y(direction°) 회전 적용. 실제 구현에서는 `'YXZ'` order를 사용해 의도와 일치시킴)

### 커스텀 네임스페이스 `this.leakAlarmPulse`

| 메서드 | 동작 |
|--------|------|
| `setLeak({ detected, direction })` | 누수 상태/방향 갱신. `detected`(bool)에 따라 펄스 + 화살표 가시성 동시 토글. `direction`(degrees, 0~360)이 변경되면 화살표 group 회전 즉시 갱신 |
| `setPulseOptions({ period, color, minIntensity, maxIntensity })` | 펄스 파라미터 변경 (모두 optional). 활성 펄스 옵션 즉시 반영 |
| `setArrowOffset({ x, y, z })` | 화살표 베이스 위치 미세 조정 (baseY 위로 오프셋 추가) |
| `start()` | RAF 루프 시작. detected=true이면 펄스 + 화살표 가시. detected=false이면 RAF 유지하되 펄스/화살표는 비활성 (가시화는 setLeak로 토글) |
| `stop()` | RAF 정지 + 색상(emissive) 원본 복원 + 화살표 visible=false. mesh/geometry/material은 유지 (재시작 가능) |
| `destroy()` | RAF cancel + 색상/emissive 원본 복원 + 화살표 mesh dispose(geometry/material) + parent에서 remove + 마지막 줄 `this.leakAlarmPulse = null` (self-null) |

#### setLeak 입력 포맷

```javascript
{
    detected:  boolean,   // true → 펄스 + 화살표 ON / false → 둘 다 OFF (emissive 원복)
    direction: number     // degrees [0, 360) — XZ 평면 시계 반대 방향, 0=+X
}
```

`direction`은 number 외에 `{x, y, z}` vector 형태도 받도록 일반화 가능하나, 현 시점은 **degrees 단일 number**로 시작 (페이지가 vector를 받으면 `Math.atan2(z, x)`로 변환). 향후 Mixin 승격 시 vector 입력 옵션 추가.

### 원본 보관/복원 정책 (BATT/alarmPulse 답습)

`_originals: { savedEmissive: [Color, Color], savedIntensity: [number, number] }` — 단일 mesh 한정 (메소드 호출 첫 시점에 1회 보관).

- `start()` 또는 `setLeak({ detected: true })` 첫 호출 시점에 mesh의 두 material(`leakEtc`, `winBody`)에 대해 `emissive.clone()`과 `emissiveIntensity`를 보관
- `stop()` / `setLeak({ detected: false })` / `destroy()` 시 보관된 `emissive`를 `material.emissive.copy(saved)`로 복원, `emissiveIntensity`도 원래 값 복원
- material이 emissive 속성이 없는 타입(MeshBasicMaterial 등)이면 silent skip

> MeshStateMixin이 매 `setMeshState` 호출 시 `material = material.clone()`을 수행하므로, 펄스 동작 중에도 status 갱신이 발생할 수 있다. leakAlarmPulse는 매 RAF tick에서 `mesh.material`을 재조회하여 적용 대상 material을 최신 참조로 사용한다(stale clone 회피).

### parent 결정 우선순위 (화살표)

```
1) this._leakAlarmArrowParent  — 페이지/preview가 직접 주입 (scene 또는 LeakDetector 그룹의 부모)
2) this.appendElement           — GLTF 루트
3) 둘 다 없으면 start no-op (안전 가드)
```

> chargeFlowArrow의 `_chargeFlowArrowParent`/`appendElement` 우선순위와 동일 패턴.

### equipmentStatus 자동 연동

본 변형은 **equipmentStatus를 펄스 트리거로 직접 사용하지 않는다**. equipmentStatus는 Standard 승계로 `meshState.renderData`만 수행하여 색상 채널만 갱신. 누수 감지(leak) 토글은 페이지가 별도 토픽(예: `leakDetected` 또는 BMS 어댑터)을 받아 `instance.leakAlarmPulse.setLeak({...})` 외부 명령형 호출로 위임한다.

> BATT/alarmPulse는 status='error'/'warning'에서 자동 펄스 ON이지만, 본 변형은 누수 감지가 status와 직교한 별도 신호이므로(예: "LeakDetector 자체는 normal이지만 누수가 감지됨") 자동 연동을 도입하지 않는다. 페이지가 명시적으로 토글한다.

### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| detected (시드) | `true` | mount 직후 펄스 + 화살표 즉시 관찰 |
| direction (시드) | `0` (+X 방향) | mount 직후 +X 축 방향으로 화살표 표시 |
| period | 700 ms | 1초 미만 주기로 명확한 펄스 |
| color | 0xff3030 | 누수 알람 표준 빨강 |
| maxIntensity | 1.5 | ACES Filmic + 노출 1.2 환경에서 시각적으로 확실한 변조 |
| autoStart on mount | true | preview/operations 시각 관찰 우선 (chargeFlowArrow / sensorHud 동일 정책) |

> **자동 start 규약**: BATT/alarmPulse는 페이지 명시 토글(equipmentStatus 자동 연동)이지만, 본 변형은 mount 직후 자동 start + detected=true 시드로 즉시 시각 관찰을 우선한다 (Phase 1.5 항목 #7). 페이지가 idle을 원하면 명시적으로 `setLeak({ detected: false })` 또는 `stop()` 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

누수 감지/방향은 페이지가 외부 명령형으로 `setLeak/setPulseOptions/setArrowOffset` 직접 호출 (alarmPulse 외부 명령형 부분과 동일 규약).

### 이벤트 (customEvents)

없음. 개별 단위(meshName='LeakDetector' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.leakAlarmPulse` API 등록 + 기본값 시드 (`detected=true, direction=0`) + (parent 가용 시) **자동 start** + equipmentStatus 구독(`meshState.renderData`)
- 페이지가 추가로 `_leakAlarmArrowParent` 주입 후 `setLeak/setPulseOptions/setArrowOffset` 외부 명령형 호출
- `beforeDestroy.js`: 구독 해제 → `this.leakAlarmPulse?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/leakAlarmPulse |
|------|----------|-------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.leakAlarmPulse` 네임스페이스 | 없음 | `setLeak/setPulseOptions/setArrowOffset/start/stop/destroy` 노출 |
| RAF 루프 | 없음 | leakAlarmPulse 자체 관리 (펄스 변조 + 화살표 회전 갱신) |
| `material.emissive` 채널 사용 | 없음 | 사용 (보관/sine 변조/복원) |
| Three.js geometry/material 자체 자원 | 없음 | CylinderGeometry + ConeGeometry + MeshStandardMaterial 자체 생성/dispose |
| 화살표 (별도 mesh) | 없음 | LeakDetector 위 부유 |
| beforeDestroy | meshState만 정리 | leakAlarmPulse → meshState 역순 정리 |

Standard는 색상 채널만 데이터에 결합한다. Advanced/leakAlarmPulse는 추가로 (a) emissive 채널 sine wave 변조 RAF, (b) 자체 geometry/material 자원 + 동적 회전, (c) `setLeak/setPulseOptions/setArrowOffset` 외부 명령형 API — 세 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 + 자체 mesh 생성 + RAF 라이프사이클이 모두 추가되므로 별도 폴더로 분리한다.

---

## BATT/alarmPulse + BATT/chargeFlowArrow 패턴 결합

| 측면 | BATT/alarmPulse | BATT/chargeFlowArrow | leakAlarmPulse |
|------|------------------|-----------------------|----------------|
| `material.emissive` sine 변조 | ✓ | — | ✓ (alarmPulse 답습) |
| 자체 mesh(Cylinder+Cone) 생성 + dispose | — | ✓ | ✓ (chargeFlowArrow 답습) |
| 동적 위치 mutation (RAF) | — | ✓ (Y축 흐름) | — (위치 정적 — 회전만 동적) |
| 동적 회전 mutation | — | — (mode 3종 고정) | ✓ (degrees 임의각) |
| 외부 명령형 API | ✓ | ✓ | ✓ (통합 setLeak) |
| 자동 start | — (status 자동 연동) | ✓ | ✓ (mount 직후) |

본 변형은 BATT/alarmPulse(emissive 펄스)와 BATT/chargeFlowArrow(자체 화살표 mesh)의 **결합**이다. 두 패턴 모두 단일 컴포넌트 전용 커스텀 메서드로 검증되어 있어 그대로 답습한다. 차이점은 (a) 화살표 위치는 정적이고 회전만 동적, (b) leak 토글이 펄스 + 화살표 가시성을 동시 제어.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.leakInst = wemb.getDesignComponent('LeakDetector');
this.leakInst._leakAlarmArrowParent = wemb.threeElements.scene;   // GLTF 루트가 아니라 scene에 add (선택)
this.leakInst.leakAlarmPulse.start();   // register.js가 자동 start 한 경우 no-op

// 누수 감지 토픽 어댑터
const handleLeakData = (data) => {
    this.leakInst.leakAlarmPulse.setLeak({
        detected: data.leak,                                 // bool
        direction: data.direction || 0                       // degrees, 0~360
    });
};

// 펄스 옵션 외부 변경 (강제 알람 등)
this.leakInst.leakAlarmPulse.setPulseOptions({
    period: 500,
    color: 0xff8000   // 주황색으로 변경
});
```

---

## 모델 주의사항

- `models/LeakDetector/01_default/LeakDetector.gltf`의 단일 메시 이름은 `'LeakDetector'`로 확정. leakAlarmPulse는 `getObjectByName('LeakDetector')`로 추적 대상 mesh를 직접 조회한다.
- LeakDetector mesh의 `material`은 배열 `[leakEtcMat, winBodyMat]` — `collectMaterials` 헬퍼가 두 material을 모두 펄스 대상으로 수집한다. 두 서브메시가 동시에 펄스 emissive를 받는 것이 의도된 동작 (Standard color 변경과 동일한 일괄 적용 정책).
- 화살표 크기는 maxDim(LeakDetector boundingBox 기준) 비례로 결정되므로 모델 크기가 바뀌어도 시각 비율 유지.
- 화살표 베이스 위치는 LeakDetector boundingBox 중심에서 +Y로 maxDim × 0.10 — LeakDetector가 얇고 길쭉한 판상형(0.27 단위 두께)이므로 화살표가 LeakDetector 위에 명확히 부유.
- preview는 ACESFilmic 톤매핑(exposure 1.2) 환경에서 펄스 maxIntensity 1.5와 화살표 emissiveIntensity 0.6이 명확히 관찰됨.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level만, IIFE 없음 |
| 2 | self-null `this.leakAlarmPulse = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.leakAlarmPulse?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachLeakAlarmPulse(inst)` 내부 destroy도 `inst.leakAlarmPulse = null` 포함 + emissive 복원 + 화살표 dispose |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setLeak/setPulseOptions/setArrowOffset/start/stop/destroy` (alarmPulse/chargeFlowArrow/sensorHud 동사 패턴 답습 — set*/start/stop/destroy) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview leak 토글 ↔ `setLeak.detected`, 방향 슬라이더 deg ↔ `setLeak.direction`(deg), period 슬라이더 ms ↔ `setPulseOptions.period`, color picker ↔ `setPulseOptions.color` |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 detected=true + direction=0° + 자동 start로 빨강 펄스 + +X 방향 화살표 즉시 관찰 |
| 8 | manifest + LeakDetector/CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 후보 (강력)**: `LeakAlarmDirectionMixin`(가칭) 또는 `SensorAlarmDirectionMixin`(가칭) — #23 IntrusionDetectionSensor의 alertDirection(침입 화살표 + 원형 펄스)에서 패턴 거의 동일 예상. 2번째 컴포넌트 등록 시점에 승격 검토.
- **API 일반화 검토**: `setLeak({ detected, direction })`은 누수 도메인 전용 시그니처. Mixin 승격 시 `setAlarm({ active, direction })`으로 추상화 권장. `setPulseOptions`는 그대로 일반화 가능.
- **direction vector 입력 옵션**: 현재 `direction`은 degrees 단일 number이지만, `{x, y, z}` vector 입력도 받도록 확장 검토 (페이지가 vector를 변환 없이 전달 가능). `Math.atan2(z, x)`로 내부 변환.
- **펄스 + 화살표 분리 검토**: 두 채널이 동일 트리거에 묶여 있어 통합 커스텀이지만, Mixin 승격 시 `MeshEmissivePulseMixin` + `DirectionalIndicatorArrowMixin`으로 분리하고 컴포넌트 register에서 두 Mixin을 함께 적용하는 안이 더 직교적.
