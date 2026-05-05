# BATT — Advanced/chargeFlowArrow

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'BATT' Mesh 색상 변경 (Standard 승계, `material.color` 채널)
2. **충/방전 방향 화살표 표시** — BATT mesh 위에 3D 화살표(자체 합성 mesh: ConeGeometry + CylinderGeometry)를 띄워서 충전/방전 방향을 시각화
   - mode = `'charge'` → 화살표가 위에서 BATT를 향해 **아래** 방향(BATT 안으로 들어감)
   - mode = `'discharge'` → 화살표가 BATT 위에서 **위** 방향(BATT 바깥으로 나감)
   - mode = `'idle'` → 화살표 자체 숨김
3. **흐름 애니메이션** — 화살표가 시작 위치에서 진행 방향으로 이동 + 끝나면 페이드아웃 + 시작 위치로 리셋(루프). RAF 기반.
4. **외부 명령형 API** — 페이지가 `instance.chargeFlowArrow.setMode/setSpeed/setColor/start/stop`을 직접 호출하여 모드/속도/색상 제어 (BMS 충/방전 데이터 토픽 연동은 페이지 책임)

---

## BATT mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/BATT/01_default/BATT.gltf` |
| mesh 이름 | `BATT` (단일) |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`와 일치. Standard / 다른 모든 Advanced 변형이 단일 'BATT' 메시 기반으로 동작 중. 본 변형도 그 규약을 따른다.

---

## 큐 정의 vs 실제 구현 — AnimationMixin 채택 결정

**큐 설명**: "충/방전 방향 화살표 애니메이션 **(AnimationMixin+커스텀 메서드)**"

**실제 채택**: **AnimationMixin 미적용** + 커스텀 메서드 `this.chargeFlowArrow`만 등록

### 결정 근거 (3가지)

1. **BATT.gltf에는 화살표 클립이 없다** — `models/BATT/01_default/BATT.gltf`는 Standard/visibility/clipping/highlight/dataHud/alarmPulse 등 기존 6+ 변형이 정적 mesh 모델임을 전제로 동작한다. 화살표는 GLTF에 내장된 `AnimationClip`으로 존재하지 않는다. AnimationMixin은 `instance.animations` 배열이 비어있으면 `getClipNames()`가 빈 배열을 반환하고 `play()`도 동작하지 않는다 — 즉, AnimationMixin을 등록해도 화살표가 화면에 나타나지 않는다.
2. **충/방전 방향의 동적 전환** — mode를 RAF tick 안에서 부드럽게 전환하려면 화살표의 위치/방향/투명도를 직접 mutate 해야 한다. AnimationMixin의 클립 재생은 미리 베이크된 키프레임 기반이라 동적 mode 전환과 부적합하다.
3. **자체 mesh 생성 + 자체 RAF**가 더 단순 — `Chiller/Advanced/fluidFlow`(자체 BufferGeometry/Points + RAF 직접 mutate) 패턴을 그대로 답습하면 (a) parent 결정 우선순위, (b) dispose 정리, (c) self-null 모두 검증된 규약을 활용 가능.

### 큐 의도와의 정합

큐 설명은 "GLTF 내장 클립 재생을 통한 시각화"가 가능한 시나리오를 우선 검토하라는 가이드였다. 실제 모델에 클립이 없는 것이 확인되면 **(A) 자체 mesh + RAF**로 fallback 한다. 큐의 Mixin 명시는 "1차 후보"이지 "강제"가 아니다 (`커스텀 메서드 vs 신규 Mixin 판단 규칙` 1차 — 모델 가용 자원 기준).

### Mixin 승격 후보 메모

본 변형의 "장비 mesh에 동적 화살표(충/방전·전류·유량 등 방향성) mesh를 띄우고 RAF로 흐름 애니메이션" 패턴은 **다수 컴포넌트(Inverter/PCS의 powerFlowIndicator, Pump/Fan의 flowDirection 등)에서 거의 동일 기법으로 재사용** 가능성이 높다. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙" 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"에 따라 본 사이클은 커스텀 메서드로 완결. 2번째 컴포넌트 등록 시점에 신규 Mixin 후보 검토:

- **신규 Mixin 후보 이름**: `FlowArrowMixin`(가칭) 또는 `DirectionalFlowIndicatorMixin`(가칭)
- **API 호환성**: 현 시그니처(`setMode/setSpeed/setColor/start/stop/destroy`)를 그대로 수용 가능
- **Chiller/fluidFlow와의 통합 검토**: 둘 다 "방향성 흐름 시각화"이지만 fluidFlow는 다중 path Points 기반, chargeFlowArrow는 단일 mesh 기반 → 이질적이므로 통합하지 않고 별도 Mixin으로 분리 검토 (3차 — "같은 기능이라도 기법이 다르면 통합하지 않는다")

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.chargeFlowArrow` (AnimationMixin 미적용 — 위 결정 근거 참조)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### 커스텀 네임스페이스 `this.chargeFlowArrow`

| 메서드 | 동작 |
|--------|------|
| `setMode(mode)` | 모드 전환. `'charge'`(아래 방향, BATT 안으로) / `'discharge'`(위 방향, BATT 바깥으로) / `'idle'`(화살표 숨김). idle이 아니면서 stop 상태이면 자동 start 하지 않음 — 명시 start 필요 |
| `setSpeed(speed)` | 흐름 애니메이션 속도(이동거리/sec). 기본 0.6 |
| `setColor(color)` | 화살표 material.color 변경 (THREE.Color hex number 또는 string) |
| `start()` | RAF 흐름 애니메이션 시작. 화살표 mesh 미생성이면 lazy 생성 + parent에 add. mode='idle'이면 mesh visible=false 유지 |
| `stop()` | RAF 정지 + 화살표 mesh visible=false (mesh/geometry/material은 유지 — 재시작 가능) |
| `destroy()` | RAF cancel + 화살표 mesh dispose(geometry/material) + parent에서 remove + 마지막 줄 `this.chargeFlowArrow = null` (self-null) |

### 화살표 mesh 디자인

화살표는 **CylinderGeometry**(샤프트) + **ConeGeometry**(헤드)를 `THREE.Group`으로 합성한다.

| 부품 | geometry | 크기(상대 — boundingBox 기반 동적 결정) |
|------|----------|-----------------------------------------|
| 샤프트 | CylinderGeometry(radius, radius, length, 12) | radius = maxDim × 0.04, length = maxDim × 0.5 |
| 헤드 | ConeGeometry(radius, length, 12) | radius = maxDim × 0.10, length = maxDim × 0.18 |

> `maxDim` = `Math.max(box.size.x, box.size.y, box.size.z)` (BATT mesh boundingBox). `Chiller/Advanced/clipping`에서 사용한 동일 패턴을 답습.
>
> 헤드는 샤프트 끝(샤프트 +length/2 위치)에 부착되어 진행 방향을 시각적으로 명시.

material: `MeshStandardMaterial`로 `transparent: true`, `depthWrite: false`, `emissiveIntensity: 0.6` (어두운 환경에서도 시각적으로 명확).

### parent 결정 우선순위

```
1) this._chargeFlowArrowParent  — 페이지/preview가 직접 주입 (scene 또는 BATT 그룹의 부모)
2) this.appendElement            — GLTF 루트
3) 둘 다 없으면 start no-op (안전 가드)
```

> Chiller/fluidFlow의 `_fluidFlowParent`/`appendElement` 우선순위와 동일 패턴.

### 위치/방향 결정

- **앵커 좌표**: BATT mesh의 boundingBox 중심을 기준으로 +Y 방향(위쪽)으로 maxDim × 0.6 만큼 떨어진 지점이 화살표의 "기본 위치"
- **방향 회전**:
  - `mode='charge'` → 화살표 헤드가 -Y(아래)를 가리키도록 회전 — `arrowGroup.rotation.x = Math.PI` (기본 ConeGeometry는 +Y 방향)
  - `mode='discharge'` → 헤드가 +Y(위)를 가리키도록 — `arrowGroup.rotation.x = 0`

### 흐름 애니메이션 알고리즘

```
// state: progress in [0, travelDistance]
travelDistance = maxDim × 0.6   // 화살표가 한 사이클 동안 이동하는 거리
fadeTail       = 0.3            // 마지막 30% 구간에서 페이드아웃

매 RAF tick:
    progress += speed × dt × travelDistance
    if progress >= travelDistance:
        progress = 0   // 시작 위치로 리셋
    
    // 위치
    offset = progress (mode='charge' → 아래 방향 -progress / 'discharge' → 위 방향 +progress)
    arrowGroup.position.y = baseY + (mode==='charge' ? -offset : +offset)
    
    // 페이드
    t = progress / travelDistance
    alpha = (t < 1 - fadeTail) ? 1.0 : 1.0 - (t - (1 - fadeTail)) / fadeTail
    material.opacity = alpha
```

이로써 화살표가 "출발 → 끝점 도달 → 페이드아웃 → 시작 위치로 즉시 점프 → 다시 출발"의 무한 루프로 흐름을 표현한다.

### 옵션 기본값

| 옵션 | 기본값 |
|------|--------|
| mode | `'charge'` (mount 직후 충전 방향이 기본) |
| speed | 0.6 (travelDistance/sec) |
| color | 0x60a5fa (밝은 청색 — 충전 시각 코드) |
| autoStart on mount | true (preview/operations에서 즉시 관찰 가능 — `pipeFlow`/`fluidFlow`의 "수동 start 규약"과는 다른 정책) |

> **자동 start 규약**: `fluidFlow`/`pipeFlow`/`dynamicRpm`은 register 시점에 start 하지 않고 페이지가 명시 start 호출하는 외부 명령형 패턴이다. 본 변형은 **mount 직후 mode='charge' + 자동 start**로 시각 관찰성을 우선한다 (Phase 1.5 항목 #7 — "기본값의 시각적 관찰 가능성"). 페이지가 idle 모드를 원하면 `setMode('idle')` 또는 `stop()` 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

충/방전 mode 토글은 별도 구독 토픽 없이 페이지가 외부 명령형으로 `setMode/setSpeed/setColor` 직접 호출 (`fluidFlow`/`dynamicRpm`/`alarmPulse 외부 명령형 부분`과 동일 규약). BMS 토픽이 표준화되면 향후 `battData` 등을 직접 구독하도록 확장 가능.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='BATT' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: Mixin 적용 + `this.chargeFlowArrow` API 등록 + (parent/THREE 사용 가능 시) **자동 start with mode='charge'** — 단, parent가 register 시점에 `null`이면 start는 첫 호출 시 lazy 생성 시도
- 페이지가 추가로 `setMode/setSpeed/setColor` 호출
- `beforeDestroy.js`: 구독 해제 → `this.chargeFlowArrow?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/chargeFlowArrow |
|------|----------|--------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.chargeFlowArrow` 네임스페이스 | 없음 | `setMode/setSpeed/setColor/start/stop/destroy` 노출 |
| Three.js geometry/material 자체 자원 | 없음 | CylinderGeometry + ConeGeometry + MeshStandardMaterial 자체 생성/dispose |
| RAF 루프 | 없음 | chargeFlowArrow 자체 관리 (mode≠'idle' & active일 때만) |
| beforeDestroy | meshState만 정리 | chargeFlowArrow → meshState 역순 정리 |
| 화면 표시 | mesh 단독 | mesh 위에 부유 화살표 + 흐름 |

Standard는 색상 채널만 데이터에 결합한다. Advanced/chargeFlowArrow는 추가로 (a) 자체 geometry/material 자원, (b) RAF 흐름 애니메이션, (c) mode/speed/color 외부 명령형 API — 세 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 + 자체 mesh 생성 + RAF 라이프사이클이 모두 추가되므로 별도 폴더로 분리한다.

---

## 다른 BATT Advanced 변형과의 관계

| 변형 | 채널 | 표현 |
|------|------|------|
| visibility | `object.visible` | 메시 전체 on/off |
| clipping | `material.clippingPlanes` | 평면 기준 부분 절단 |
| highlight | `material.emissive` (정적 강도) | 선택 강조 |
| dataHud | DOM 오버레이 + 좌표 RAF | 수치 HUD 카드 |
| alarmPulse | `material.emissive` (시간 변조) | 알람 발광 펄스 |
| **chargeFlowArrow** | **별도 자체 생성 mesh + 위치 RAF** | **충/방전 방향 화살표 흐름** |

chargeFlowArrow는 BATT mesh 자체의 material을 건드리지 않는다(별도 Group 추가). 따라서 alarmPulse(emissive) / highlight(emissive) / clipping / visibility 어떤 변형과도 채널 충돌이 없다. 동일 BATT에 chargeFlowArrow + alarmPulse가 동시 활성화된 별도 변형을 만들고자 할 경우에도 두 메서드는 직교한다.

---

## Chiller/fluidFlow와의 기법 차이

| 측면 | Chiller/fluidFlow | BATT/chargeFlowArrow |
|------|-------------------|----------------------|
| 자원 | BufferGeometry + PointsMaterial + Points (다중 파티클) | Group(Cylinder+Cone) + MeshStandardMaterial (단일 mesh) |
| 진행 표현 | 파티클이 path를 따라 흐름 (다중) | 화살표 1개가 직선 이동 + 페이드 + 리셋 |
| path 좌표 | 페이지 책임 (path points) | 자체 결정 (boundingBox 기반 +Y 축) |
| mode 전환 | 없음 | charge/discharge/idle 3가지 |

기법이 다르므로 ADVANCED_QUEUE.md "3차 — 같은 기능이라도 기법이 다르면 통합하지 않는다"에 따라 **별도 이름 · 별도 구현**을 유지. 향후 `FlowArrowMixin`/`DirectionalFlowIndicatorMixin` 신설 시점에 통합 검토.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.battInstance = wemb.getDesignComponent('BATT');

// BMS 데이터 수신 시
const handleBattData = (data) => {
    if (data.current > 0)        this.battInstance.chargeFlowArrow.setMode('charge');
    else if (data.current < 0)   this.battInstance.chargeFlowArrow.setMode('discharge');
    else                         this.battInstance.chargeFlowArrow.setMode('idle');
    
    // 전류 크기에 비례하여 흐름 속도 가변
    this.battInstance.chargeFlowArrow.setSpeed(0.3 + Math.abs(data.current) * 0.1);
};
```

---

## 모델 주의사항

- `models/BATT/01_default/BATT.gltf`의 단일 메시 이름은 `'BATT'`로 확정. chargeFlowArrow는 `getObjectByName('BATT')`로 boundingBox 산출 대상 mesh를 직접 조회.
- 화살표 크기는 maxDim 비례로 결정되므로 모델 크기가 바뀌어도 시각 비율 유지.
- preview는 ACESFilmic 톤매핑 환경에서 emissiveIntensity 0.6 + opacity 페이드가 명확히 관찰됨.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level만, IIFE 없음 |
| 2 | self-null `this.chargeFlowArrow = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.chargeFlowArrow?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachChargeFlowArrow(inst)` 내부 destroy도 `inst.chargeFlowArrow = null` 포함 + dispose |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setMode/setSpeed/setColor/start/stop/destroy` (alarmPulse/fluidFlow/dataHud 동사 패턴 답습) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview mode 토글↔`setMode`, speed 슬라이더↔`setSpeed`, color picker↔`setColor` |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 mode='charge' + 자동 start로 화살표 즉시 표시 |
| 8 | manifest + BATT/CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **AnimationMixin (B) → 자체 RAF (A) fallback**: 큐 명시 AnimationMixin은 BATT.gltf에 화살표 클립이 없어 사용 불가. 자체 mesh + RAF로 구현. CLAUDE.md "큐 정의 vs 실제 구현" 섹션에 결정 근거 명시.
- **Mixin 승격 후보**: `FlowArrowMixin`(가칭) — Inverter/PCS/powerFlowIndicator, Pump/Fan/flowDirection 등 다수 장비에서 동일 기법 예상. 본 사이클은 커스텀 메서드로 완결, 2번째 컴포넌트(예: Inverter powerFlowIndicator) 등록 시점에 승격 검토. Chiller/fluidFlow와는 자원/표현 기법이 달라 별도 Mixin으로 분리 권장.
- **자동 start 규약 차이**: 기존 `fluidFlow`/`pipeFlow`/`dynamicRpm`은 register에서 자동 start 하지 않고 페이지 명시 호출이 규약이지만, 본 변형은 **mount 직후 자동 start with mode='charge'**로 시각 관찰 우선. 페이지가 idle을 원하면 명시적으로 `setMode('idle')` 또는 `stop()` 호출. 향후 Mixin 승격 시 이 규약 차이를 옵션화(`options.autoStart`) 권장.
