# Inverter — Advanced/powerFlowIndicator

## 기능 정의

1. **상태 색상 표시 (Standard 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 `Inverter` Mesh의 `material.color`를 colorMap에 맞춰 변경. Standard와 동일한 colorMap 사용.
2. **전력 흐름 화살표 시각화** — Inverter mesh를 기준으로 axis(기본 `'y'`) 방향을 따라 부유하는 화살표 mesh 그룹(최대 N=6개)을 동적으로 생성. 각 화살표는 ConeGeometry 단독 mesh로, 정해진 axis 방향으로 등간격 배치되어 부유한다. 끝에 도달하면 반대편으로 wrap-around 리스폰.
3. **충/방전 방향(direction)** — `'in'`(충전, 외부→장비, 화살표 axis 음의 방향) | `'out'`(방전, 장비→외부, axis 양의 방향) | `'none'`(정지, 모든 화살표 invisible). direction 변경 시 화살표 진행 방향이 즉시 토글되고, 색상이 in=cyan(0x4ad6ff), out=orange(0xffa64a)로 갱신된다.
4. **전력량(powerKw) ↔ 화살표 개수/굵기** — `setPowerKw(kw)` 호출 시 `activeCount = floor(powerKw/maxKw * maxArrows)`로 화살표 개수 결정. `thicknessScale = 1 + (powerKw/maxKw) * (maxThicknessScale - 1)` 비율로 화살표 mesh의 `scale.x` 및 `scale.z`(굵기 축)를 갱신, axis 방향 길이는 `scale.y`(또는 axis에 맞는 축)로 `baseScale` 고정. powerKw=0이면 모든 화살표 invisible (direction='none' 동치).
5. **RAF idle 일시정지** — direction='none' 또는 powerKw=0이거나 enable=false일 때 RAF stop(비용 0). direction != 'none' && powerKw > 0이 되면 RAF 재시작.
6. **외부 명령형 API** — 페이지가 `instance.powerFlowIndicator.setDirection/setPowerKw/setMaxKw/setMaxArrows/setArrowAxis/setArrowSpan/setArrowSpacing/setArrowSpeed/setArrowOffset/setBaseScale/setMaxThicknessScale/setColors/setMeshName/getDirection/getPowerKw/getActiveCount/enable/disable/isEnabled/destroy`를 직접 호출하여 충/방전 흐름 제어.

---

## Inverter mesh 구조

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/Inverter/01_default/Inverter.gltf` |
| 분출 기준 mesh 이름 | `Inverter` (단일 Mesh, 자식 없음 — root scale 1000x 아래) |
| 결정 | **단일 mesh** (Standard와 동일) |

화살표 그룹은 Inverter mesh의 자식으로 add — 장비 이동/회전 시 화살표가 그대로 따라온다 (root scale 1000x 영향을 받음, 화살표 옵션 기본값은 root local 단위 기준).

---

## 신규 기법 명시 — 동적 mesh 그룹 + 부유 wrap-around + 굵기 스케일링

본 변형은 저장소에서 **장비 mesh의 자식으로 화살표 mesh 그룹을 동적 생성하여 axis 방향 부유 + wrap-around** 패턴을 구현하는 첫 사례다. CoolingTower/steamEjection의 Points 풀(BufferGeometry attribute mutation)과 달리 **개별 ConeGeometry mesh × N**(N≤6)이며, 각 mesh는 자체 position/scale/visible을 가진다 — 화살표 굵기·방향이 즉시 시각 분간 가능해야 하기 때문에 Points보다 mesh 단위가 자연스럽다.

답습 모범:

| 답습 | 항목 |
|------|------|
| `CoolingTower/Advanced/steamEjection` | 풀(pool) + RAF 매 프레임 in-place mutation + idle 일시정지 + parent scene attach + dispose 규약 |
| `MCCB/Advanced/breaker_leverPosition` | destroy/시그니처 답습 (`setXxx/get*/enable/disable/isEnabled/destroy`, self-null, RAF cancel) |
| `Pump/Advanced/dynamicRpm` (#38) | 1차 시스템 응답이 아닌 **선형 부유 + wrap-around** (continuous motion, RAF 매 프레임) |

**큐 설명 (#50)**: "충/방전 방향 화살표 + 전력량 선 굵기 (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.powerFlowIndicator` (신규 Mixin **없음**)

### Mixin 승격 메모 (#50+#51 예정)

> **PowerFlowIndicatorMixin 승격 후보 (#50+#51 예정)** — 본 변형(#50 Inverter)은 1차 등장. **#51 PCS/powerFlowIndicator가 본 변형 시그니처 100% 답습 예정** (시그니처 일관성이 매우 중요). 2번째 채택(#51) 시점에 PowerFlowIndicatorMixin 승격을 검토하되, 본 사이클은 신규 Mixin 금지 정책으로 단일 컴포넌트 전용 → 커스텀으로 완결.

- **승격 후보 이름**: `PowerFlowIndicatorMixin`
- **흡수할 메서드**: `setDirection/setPowerKw/setMaxKw/setMaxArrows/setArrowAxis/setArrowSpan/setArrowSpacing/setArrowSpeed/setArrowOffset/setBaseScale/setMaxThicknessScale/setColors/setMeshName/getDirection/getPowerKw/getActiveCount/enable/disable/isEnabled/destroy`
- **#51 PCS와의 차이**: meshName(='Inverter' vs 'PCS')과 옵션 기본값(arrowOffset/maxKw 등)만 다를 예정.

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.powerFlowIndicator` (신규 Mixin 없음 — 1차 등장)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습)

### MeshState 채널과의 충돌 회피 정책

**원칙**: powerFlowIndicator는 (a) 자체 생성 `THREE.Group` + N개의 `THREE.Mesh(ConeGeometry)` + 자체 `MeshBasicMaterial`만 사용한다. MeshStateMixin이 사용하는 `Inverter.material.color` 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `Inverter.material.color` | 데이터 상태 색상 (Standard 승계) |
| powerFlowIndicator (커스텀) | 자체 `THREE.Group` + ConeGeometry mesh × N + MeshBasicMaterial | 충/방전 방향 화살표 부유 + 전력량 굵기 |

두 채널 직교 — MeshState는 본체 Inverter mesh의 색을, powerFlowIndicator는 별도 화살표 그룹을 다룬다.

### 화살표 그룹 알고리즘

```
풀 크기: maxArrows (기본 6, 최대 N개)
mesh:
  - geometry: ConeGeometry(0.3, 1.0, 12) — 1회 생성, 모든 화살표가 공유
  - material: MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }) — 1회 생성, 공유
  - mesh × N: 모두 같은 geometry/material 공유, 각자 position/scale/visible 독립

매 프레임 (dt = (now - lastTick) / 1000):
  // 1) 진행 (selfTime 누적, axis 방향)
  selfTime += arrowSpeed * dt
  // 2) 활성 개수 계산
  activeCount = floor(powerKw / maxKw * maxArrows)
  thicknessScale = 1 + (powerKw / maxKw) * (maxThicknessScale - 1)
  // 3) 각 화살표 i의 위치
  for i in 0..maxArrows-1:
      if (i < activeCount && direction != 'none'):
          mesh.visible = true
          // axis 방향 등간격 배치 + wrap-around
          phase_i  = (i * arrowSpacing) — 화살표 간격
          base_t   = (selfTime + phase_i) mod arrowSpan — wrap-around
          // direction='out' = axis 양의 방향, 'in' = 음의 방향
          axis_pos = (direction === 'in')
              ? (arrowSpan/2 - base_t)
              : (-arrowSpan/2 + base_t)
          mesh.position[axis] = arrowOffset[axis] + axis_pos
          // 비-axis 두 축은 offset 그대로
          mesh.position[other] = arrowOffset[other]
          // 굵기: axis 외 두 축 = thicknessScale*baseScale, axis = baseScale
          mesh.scale.set / per-axis ...
      else:
          mesh.visible = false

  // 4) idle 일시정지 — direction='none' || powerKw === 0 || !enabled
  if (direction === 'none' || powerKw === 0 || !enabled):
      RAF stop
```

### 화살표 mesh 생성 (ConeGeometry rotateX 보정)

ConeGeometry는 기본 +Y 방향(원뿔 끝이 +Y)이다. arrowAxis가 `'y'`이면 그대로 사용하고, `'x'`/`'z'`이면 geometry를 한 번 rotate하여 화살표 끝이 axis 양의 방향을 향하게 만든다.

```javascript
const geom = new THREE.ConeGeometry(0.3, 1.0, 12);
if (axis === 'x') geom.rotateZ(-Math.PI / 2);  // +Y → +X
if (axis === 'z') geom.rotateX(Math.PI / 2);   // +Y → +Z
// 'y'는 그대로
```

### 파라미터 기본값 (Inverter root scale 1000x 기반)

> Inverter mesh는 root scale 1000 아래 단위 좌표(약 ~0.1 단위)를 가진다. 화살표 그룹은 Inverter mesh의 자식으로 add → root scale 1000이 그대로 적용된다. 따라서 모든 길이/속도 기본값은 **root local 단위(small numbers)**.

| 옵션 | 기본값 | 의미 |
|------|-------|------|
| `_meshName` | `'Inverter'` | 화살표 그룹 attach 대상 mesh |
| `_direction` | `'none'` | 초기 정지 |
| `_powerKw` | 0 | 초기 0 (idle) |
| `_maxKw` | 100 | 최대 전력량 |
| `_maxArrows` | 6 | direction != 'none' 시 최대 화살표 개수 |
| `_arrowAxis` | `'y'` | Inverter 본체 위쪽으로 흐르도록 |
| `_arrowSpan` | 4.0 | axis 방향 부유 범위 (root local) |
| `_arrowSpacing` | 0.6 | 화살표 간 간격 |
| `_arrowSpeed` | 1.2 | units/sec |
| `_arrowOffset` | `{x:0, y:0, z:0}` | 화살표 그룹 중심 (Inverter mesh local) |
| `_baseScale` | 0.3 | 화살표 기본 크기 |
| `_maxThicknessScale` | 1.6 | powerKw=maxKw 시 굵기 ×1.6 |
| `_colorIn` | 0x4ad6ff | cyan (충전) |
| `_colorOut` | 0xffa64a | orange (방전) |
| `_arrowGroup` | null | THREE.Group, mount 시 생성 + Inverter mesh 자식 add |
| `_arrowPool` | [] | mesh 배열 (1회 생성, 재활용) |
| `_activeCount` | 0 | 현재 표시 중 화살표 수 |
| `_rafId` | null | RAF id |
| autoEnable on mount | true | preview 시각 관찰 우선 (#29~#49 동일 정책) |
| 자동 데모 on mount | `setMaxKw(100); setDirection('in'); setPowerKw(60);` 후 6초 후 `setDirection('out');` | preview 시각 관찰 보장 |

> **자동 데모 정책**: register.js는 mount 직후 자동으로 setMaxKw(100), setDirection('in'), setPowerKw(60) 호출하여 preview에서 즉시 시각 관찰. 6초 후 'out'으로 전환 (charge → discharge 시퀀스). 운영에서는 페이지가 텔레메트리 데이터로 setDirection/setPowerKw 호출.

### 커스텀 네임스페이스 `this.powerFlowIndicator`

| 메서드 | 동작 |
|--------|------|
| `setDirection(dir)` | `'in'`/`'out'`/`'none'` 받아 진행 방향 토글 + material color 갱신(in=cyan, out=orange). RAF idle 시 자동 재시작 |
| `setPowerKw(kw)` | 0 ≤ kw ≤ maxKw로 클램프하여 저장. 화살표 개수/굵기 즉시 반영. RAF idle 시 자동 재시작 |
| `setMaxKw(kw)` | 최대 전력량 갱신 (powerKw도 새 max 내로 클램프) |
| `setMaxArrows(n)` | 최대 화살표 개수 갱신 (mesh 풀 재생성 — dispose 후 재할당) |
| `setArrowAxis(axis)` | `'x'`/`'y'`/`'z'`. ConeGeometry rotate 재적용 (mesh 풀 재생성) |
| `setArrowSpan(span)` | axis 방향 부유 범위 |
| `setArrowSpacing(d)` | 화살표 간 간격 |
| `setArrowSpeed(s)` | units/sec |
| `setArrowOffset(offset)` | 부분 객체 허용 (`{x?, y?, z?}`) — 그룹 중심 이동 |
| `setBaseScale(s)` | 화살표 기본 크기 |
| `setMaxThicknessScale(s)` | powerKw=maxKw 시 굵기 비율 |
| `setColors({in, out})` | in/out 각각 hex/string 허용. material.color 즉시 갱신 |
| `setMeshName(name)` | attach 대상 mesh 변경. 그룹 detach 후 새 부모에 add |
| `getDirection()` | 현재 direction |
| `getPowerKw()` | 현재 powerKw |
| `getActiveCount()` | 현재 표시 중 화살표 수 |
| `enable()` | 그룹 visible + RAF 시작 (조건 만족 시) |
| `disable()` | 그룹 visible = false + RAF stop. 자원은 유지 |
| `isEnabled()` | enable 여부 |
| `destroy()` | RAF cancel + 그룹 parent.remove + 모든 mesh.geometry/material dispose + 풀 비우기 + 모든 reference null + `this.powerFlowIndicator = null` (self-null) |

### parent 결정 정책 (장비 mesh 자식)

```
1) this.appendElement.getObjectByName(meshName) — Inverter mesh
2) 없으면 this.appendElement (GLTF 루트 fallback)
3) 둘 다 없으면 enable no-op (안전 가드)
```

화살표 그룹은 **Inverter mesh의 자식**으로 add — 장비 이동/회전 시 화살표가 그대로 따라온다. CoolingTower/steamEjection이 scene 직속에 attach하는 것과 다른 정책이다 (steam은 worldPosition 기준 scene 직속, arrow는 mesh local 기준 자식).

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

direction/powerKw 변경은 페이지가 외부 명령형으로 직접 호출. 별도 구독 없음.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='Inverter' 확정)이므로 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.powerFlowIndicator` API 등록 + (THREE/parent 가용 시) 자동 enable + 풀 생성 + 자동 데모 시퀀스(setMaxKw(100) → setDirection('in') → setPowerKw(60) → 6초 후 'out')
- 페이지가 `instance.powerFlowIndicator.setDirection('in')` + `setPowerKw(80)` 호출 등으로 시각 제어
- `beforeDestroy.js`: 구독 해제 → `this.powerFlowIndicator?.destroy()` (RAF cancel + 그룹 detach + dispose 포함) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/powerFlowIndicator |
|------|----------|-----------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.powerFlowIndicator` 네임스페이스 | 없음 | 노출 |
| 자체 `THREE.Group` + ConeGeometry mesh × N | 없음 | 자체 생성 + Inverter mesh 자식 attach + dispose |
| RAF 매 프레임 부유 + wrap-around | 없음 | 있음 — direction='none'/powerKw=0/disabled 시 idle 일시정지 |
| direction(in/out/none) ↔ 색상/방향 토글 | 없음 | 있음 |
| powerKw ↔ 화살표 개수/굵기 매핑 | 없음 | 있음 |
| beforeDestroy | meshState만 정리 | powerFlowIndicator(RAF + 그룹 detach + dispose) → meshState 역순 |
| 화면 표시 | 단일 색상 Inverter | 단일 색상 + 본체 위쪽 충/방전 화살표 흐름 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/powerFlowIndicator는 추가로 (a) 자체 Group + ConeGeometry mesh × N 자원 (b) Inverter mesh 자식 attach 절차 (c) `setDirection/setPowerKw/setMaxKw/...` 외부 명령형 API (d) RAF 매 프레임 부유 + wrap-around + 굵기 매핑 (e) idle 일시정지 — 다섯 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#35~#49 답습) |
| 2 | self-null `this.powerFlowIndicator = null` + RAF cancel | OK — destroy 마지막 줄 self-null + cancelAnimationFrame + 그룹 parent.remove + geometry/material dispose |
| 3 | beforeDestroy.js는 호출만 | OK — `this.powerFlowIndicator?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachPowerFlowIndicator(inst)` 내부 destroy도 RAF cancel + 그룹 detach + geometry/material dispose + `inst.powerFlowIndicator = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setXxx/get*/enable/disable/isEnabled/destroy` (#35 steamEjection + #46 breakerLeverPosition 시그니처 그룹 일관) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview Direction 3버튼 ↔ `setDirection('in'/'out'/'none')`, powerKw 슬라이더 0~maxKw ↔ `setPowerKw`, axis 토글 x/y/z ↔ `setArrowAxis` |
| 7 | 기본값 시각 관찰 | OK — 마운트 직후 자동 데모(setMaxKw(100), setDirection('in'), setPowerKw(60), 6초 후 'out')로 충/방전 화살표 흐름 명확 관찰 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 |

**8항목 모두 통과.** 시그니처/RAF 정책/destroy 규약은 #35 steamEjection + #46 breakerLeverPosition 답습 그대로.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.invInst = wemb.getDesignComponent('Inverter');
this.invInst.powerFlowIndicator.setMaxKw(120);

// 충/방전 토픽 어댑터
const onPowerFlow = ({ response: data }) => {
    // data: { direction: 'in'|'out'|'none', powerKw: number }
    this.invInst.powerFlowIndicator.setDirection(data.direction);
    this.invInst.powerFlowIndicator.setPowerKw(data.powerKw);
};

// 외부 직접 제어
this.invInst.powerFlowIndicator.setColors({ in: 0x66ddff, out: 0xff8844 });
this.invInst.powerFlowIndicator.setArrowSpeed(1.8);
```

---

## 모델 주의사항

- `models/Inverter/01_default/Inverter.gltf`는 root(scale 1000x) → Inverter Mesh 단일 구조. 화살표 그룹은 `getObjectByName('Inverter')`로 조회한 mesh의 자식으로 add — root scale 1000 하위에 들어가 부모 좌표계의 root local 단위가 적용된다.
- ConeGeometry는 기본 +Y 방향이다. arrowAxis 변경 시 geometry를 한 번 rotate하여 화살표 끝이 axis 양의 방향을 향하게 한다 (`'x'`이면 rotateZ(-π/2), `'z'`이면 rotateX(π/2), `'y'`는 그대로).
- 화살표 ↔ 본체 시각 분간을 위해 **MeshBasicMaterial(unlit)** 사용 — 라이팅과 무관하게 cyan/orange가 선명하게 보인다. transparent: true + opacity: 0.8로 약간 투명.
- **[MODEL_READY] placeholder 사용 안 함** — meshName='Inverter'는 컴포넌트 루트 CLAUDE.md / Standard register.js에서 이미 확정.

---

## 발견한 문제 / Mixin 승격 메모 (#50+#51)

- **Mixin 승격 후보 (#50+#51 누적 시)**: 본 변형은 1차 등장이므로 단일 컴포넌트 전용 → 커스텀 규칙 + 신규 Mixin 금지 정책으로 완결. **#51 PCS/powerFlowIndicator가 본 변형 시그니처 100% 답습 예정** — 2번째 채택 시점에 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 `PowerFlowIndicatorMixin` 승격을 검토 권장 (시그니처 그대로 흡수 가능, meshName/옵션 기본값만 컴포넌트별 차이).
- **scene 직속이 아닌 mesh 자식 attach 정책**: CoolingTower/steamEjection이 scene 직속에 attach하는 것과 달리, 본 변형은 **Inverter mesh의 자식**으로 attach. 장비 이동/회전 시 화살표가 그대로 따라오는 시각이 자연스럽기 때문. 자식 attach는 root scale 1000을 그대로 받으므로 길이/속도 기본값을 root local 단위(small numbers)로 잡았다.
- **RAF 메모리 누수 방지**: destroy/disable에서 반드시 cancelAnimationFrame + 그룹 parent.remove + geometry.dispose + material.dispose. enable은 RAF 재진입 안전(중복 시작 방지).
- **공유 geometry/material 정책**: maxArrows개의 mesh가 1개의 ConeGeometry + 1개의 MeshBasicMaterial을 공유한다 (개별 instance가 아닌 shared). dispose 시 1번만 호출.
