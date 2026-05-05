# STATCOM_BD — Advanced/statcom_powerFlow

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 STATCOM_BD 컨테이너 GLTF 내부 다수 Mesh 색상 변경 (Standard 승계, `material.color` 채널)
2. **무효전력(reactive power) 투입 진행 3D 시각화** — 컨테이너 옆/위 3D 공간에 자체 생성한 progress mesh를 두 가지 모드로 표시
   - **bar 모드** (기본): BoxGeometry mesh + scale.y(또는 scale.x)를 percent 비례로 변경하여 솟아오르는 막대로 표현 (Generator/generatorOutput의 BoxGeometry bar 답습)
   - **circular 모드**: TorusGeometry arc(thetaLength = percent/100 × 2π)로 원형 progress 표현
   - 두 모드는 `setMode('bar' | 'circular')`로 동적 전환 (전환 시 이전 mesh dispose 후 새 mesh 생성)
3. **외부 명령형 API** — 페이지가 `instance.statcomPowerFlow.setPercent(percent)` 또는 `setReactivePower({current, target})`로 진행률 입력. `setColor(hex)`/`setMode('bar' | 'circular')`로 시각 속성 동적 변경

---

## 큐 정의 vs 실제 구현 — Mixin 채택 결정

**큐 설명**: "무효전력 투입 진행 3D 바/원형 progress (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.statcomPowerFlow` (신규 Mixin 없음)

### 결정 근거

1. **컨테이너 + 자체 progress mesh** — 동일 컨테이너의 선행 변형 `meshesArea/STATCOM_BD/Advanced/animation`은 GLTF 내장 클립을, 자매 `meshesArea/STATCOM_MMC/Advanced/pipeFlow`는 UV 스크롤을 담당했으나 **자체 mesh 생성 채널**은 본 변형이 컨테이너 도메인에서 처음 도입. AnimationMixin·UV 스크롤은 부적합하며 `Generator/generatorOutput`의 BoxGeometry bar 동적 생성 + `Marker_Firealarm/emergencyZoneRadius`의 자체 SphereGeometry dispose 라이프사이클 결합이 가장 적합.
2. **두 모드 단일 통합 트리거** — bar/circular 두 시각 모드가 단일 도메인(무효전력 투입 진행률)에 종속되며 페이지가 외부 명령형으로 동시 호출(`setPercent` + `setMode`) 가능해야 한다. 단일 `statcomPowerFlow` 네임스페이스로 통합 (generatorOutput 동일 정책).
3. **컨테이너 동적 mesh 식별** — 본 변형은 클릭 이벤트 처리는 없으나 progress mesh 부착 대상 결정에 GLTF 컨테이너의 boundingBox(`Box3.setFromObject(appendElement)`)로 top-center 위 좌표를 동적 계산 — `resolveMeshName`은 클릭 핸들러용이므로 본 변형에는 불필요(컨테이너 standard에서도 부재).

### Mixin 승격 후보 메모

본 변형의 "BoxGeometry/TorusGeometry 동적 생성 + percent 비례 scale/thetaLength + 자체 dispose"는 `Generator/generatorOutput`(#42 — bar)에 이은 2번째 채택이며 큐 후속에서 progress 시각화가 추가로 등장할 가능성 있음. `ProgressBarMixin`(가칭) 또는 `ProgressMeshMixin`(bar/circular 모드 통합) 승격 후보로 메모. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 메서드 유지.

---

## STATCOM_BD 컨테이너 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/meshesArea/STATCOM_BD/01_default/STATCOM_BD.gltf` |
| GLTF 구조 | 루트 Group `STATCOM_BD` → 자식 27개 (mesh 19종 — `metal02`, `Object349`, `Box031`, `win01`, `Cylinder001`~`004`, `ani01` 등) |
| 추적 대상 | **컨테이너 전체** — `appendElement` 자체 (특정 mesh가 아니라 컨테이너 boundingBox 기반 좌표) |
| 결정 | **컨테이너 단위 자체 mesh 부착** — 어느 자식 mesh에도 속하지 않고 컨테이너 group의 자식으로 add (회전·이동 시 함께 따라옴) |

근거: STATCOM_BD는 무효전력을 투입하는 단일 장비 단위(BD = Battery Disconnect/Bay Disconnect)이며 progress는 장비 전체의 행위(투입 진행률)를 표현한다. 개별 mesh(metal02, win01 등)에 부착하면 의미 단위가 어긋난다. `appendElement`(GLTF 루트 = `STATCOM_BD` Group)에 자식으로 add하여 컨테이너 변환을 그대로 상속받는다.

### 자체 mesh 좌표 결정 근거

루트 `STATCOM_BD` Group의 boundingBox를 `Box3.setFromObject(appendElement)`로 mount 시점 1회 계산하여 다음 두 값을 도출:

| 값 | 의미 | 사용 |
|-----|------|------|
| `bbox.center` | 컨테이너 중심 (월드 좌표) | progress mesh의 X/Z 기준점 (컨테이너 위에 정렬) |
| `bbox.size` (`maxX/Y/Z`) | 컨테이너 크기 | bar maxHeight/torus radius의 **scale 적응 계수** |

도출된 mount-time anchor:

```
anchor.center.x = bbox.center.x
anchor.center.z = bbox.center.z
anchor.topY     = bbox.max.y                        // 컨테이너 상단 Y
anchor.maxDim   = max(size.x, size.y, size.z)       // ≈ 80 (STATCOM_BD GLTF 기준)
```

기본 progress mesh 크기는 maxDim 기반:
- bar 기본: `width = maxDim * 0.04`, `depth = maxDim * 0.04`, `maxHeight = maxDim * 0.3`, 위치 = `(center.x, topY + 1, center.z)`
- circular 기본: `radius = maxDim * 0.15`, `tube = maxDim * 0.015`, 위치 = `(center.x, topY + 1, center.z)` (XZ 평면 — y=horizontal로 회전)

> Generator/generatorOutput는 단일 mesh(작은 단위) 옆에 절대 단위 width=1.5 등을 사용했으나 STATCOM_BD는 컨테이너 단위로 maxDim ≈ 80 — 비례 계수로 결정해야 시각 관찰성이 보장된다. (Marker_Firealarm/emergencyZoneRadius도 maxDim×1.5 비례 결정 답습.)

---

## 채널 직교성 정책

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | GLTF 내부 mesh `material.color` (×N) | 데이터 상태 색상 (Standard 승계) |
| statcomPowerFlow (bar) | `bar.scale.y` + `bar.material.color` | percent 비례 막대 높이 + 단일 색상 |
| statcomPowerFlow (circular) | `torus.geometry`(thetaLength 재생성) + `torus.material.color` | percent 비례 호 길이 + 단일 색상 |

세 채널은 완전 직교. 컨테이너 GLTF 내부 mesh의 material에는 절대 손대지 않으며, progress mesh는 별도 자체 자원(BoxGeometry/TorusGeometry + MeshBasicMaterial)이다.

---

## 진행률 알고리즘

```
ratio = clamp(percent / 100, 0, 1)

[bar 모드]
targetScaleY = max(0.001, ratio * barMaxHeight)
bar.scale.y  = targetScaleY                                   // 단순 즉시 적용 (옵션: 보간)
bar.position.y = anchor.topY + barOffsetY + targetScaleY / 2  // 바닥 앵커 유지

[circular 모드]
torus.geometry.dispose()
torus.geometry = new THREE.TorusGeometry(radius, tube, 16, 64, ratio * 2 * Math.PI)
                                                              // thetaLength만 변경 → 호 길이 = percent
```

> bar 모드는 즉시 적용(generatorOutput와 달리 1차 시스템 보간은 옵션 — 본 변형은 단순 즉시 적용으로 시작하며 setReactivePower의 current/target은 동일값으로 setPercent와 등가). 향후 보간 필요 시 `setInertia(sec)` 옵션으로 확장 여지 남김.

---

## 색상

| 항목 | 기본값 |
|------|-------|
| color | `0x4488ff` (파랑 — STATCOM 무효전력 도메인 적합) |

`setColor(hex)`로 동적 변경. progress mesh material에만 적용 (컨테이너 내부 mesh 색상은 MeshState 채널이 담당).

---

## 커스텀 네임스페이스 `this.statcomPowerFlow`

| 메서드 | 동작 |
|--------|------|
| `setPercent(percent)` | 진행률 0~100 설정. 즉시 mesh에 반영 (bar.scale.y 또는 torus.geometry 재생성). 0 미만/100 초과는 clamp |
| `setReactivePower({ current, target })` | 무효전력 단위 입력. `percent = clamp(current/target * 100, 0, 100)`로 변환 후 setPercent 호출 |
| `setMode('bar' \| 'circular')` | 모드 전환. 이전 mesh dispose(geometry+material) → 새 mesh 생성 후 부착. 진행률은 유지 |
| `setColor(colorHex)` | progress mesh 색상 변경 (bar/torus 공통 — material.color.setHex) |
| `setBarGeometry({ width, depth, maxHeight, offsetX, offsetY, offsetZ })` | bar 모드 옵션 (모두 optional) |
| `setCircularGeometry({ radius, tube, offsetX, offsetY, offsetZ })` | circular 모드 옵션 (모두 optional) |
| `getPercent()` | 현재 진행률(0~100) |
| `getMode()` | 현재 모드 ('bar' \| 'circular') |
| `getColor()` | 현재 색상 (hex number) |
| `show()` / `hide()` | progress mesh 표시/숨김 |
| `start()` | progress mesh ensure(lazy 생성) + 컨테이너 자식으로 add. 자동으로 시드 percent(50%) 적용. mount 직후 자동 호출 (Phase 1.5 #7 시각 관찰 우선) |
| `stop()` | progress mesh를 제거하지 않고 유지 (재시작 가능) — 본 변형은 RAF 루프가 없으므로 stop은 사실상 no-op (확장 여지) |
| `destroy()` | 현재 mesh 제거 + geometry/material dispose + 마지막 줄 `this.statcomPowerFlow = null` (self-null) |

### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| percent (시드) | 50 | mount 직후 절반 진행 — bar는 절반 높이, circular는 반원으로 즉시 관찰 |
| mode (시드) | `'bar'` | 큐 정의 "기본 bar 모드" |
| color | `0x4488ff` (파랑) | STATCOM 무효전력 도메인 적합 |
| bar width / depth / maxHeight | maxDim × 0.04 / × 0.04 / × 0.3 | 컨테이너 비례 (≈ 3.2 / 3.2 / 24 단위) |
| bar offsetX / Y / Z | 0 / 1 / 0 | top-center에서 위로 1단위 띄움 |
| circular radius / tube | maxDim × 0.15 / × 0.015 | 컨테이너 비례 (≈ 12 / 1.2 단위) |
| circular offsetX / Y / Z | 0 / 1 / 0 | top-center에서 위로 1단위 |
| autoStart on mount | true (parent 가용 시) | preview 시각 관찰 우선 (emergencyZoneRadius 동일 정책) |

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.statcomPowerFlow` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습)

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

진행률(percent / current·target)은 별도 토픽이 아니라 페이지가 외부 트리거(SCADA·BMS 어댑터)로 `instance.statcomPowerFlow.setPercent/setReactivePower`를 직접 호출 (generatorOutput·emergencyZoneRadius 동일 외부 명령형 규약).

### 이벤트 (customEvents)

없음. 컨테이너이지만 본 변형은 클릭 이벤트를 처리하지 않으므로 `@meshClicked`/`resolveMeshName` 모두 불필요 (Standard·animation 변형도 동일).

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.statcomPowerFlow` API 등록 + 기본값 시드(percent=50, mode='bar', color=0x4488ff) + (THREE / appendElement 가용 시) **자동 start** + equipmentStatus 구독
- 페이지가 추가로 `setPercent/setReactivePower/setMode/setColor` 외부 명령형 호출 가능
- `beforeDestroy.js`: 구독 해제 → `this.statcomPowerFlow?.destroy()` (mesh 제거 + geometry/material dispose + self-null) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/statcom_powerFlow |
|------|----------|----------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.statcomPowerFlow` 네임스페이스 | 없음 | `setPercent/setReactivePower/setMode/setColor/setBarGeometry/setCircularGeometry/getPercent/getMode/getColor/show/hide/start/stop/destroy` 노출 |
| BoxGeometry/TorusGeometry 자체 mesh | 없음 | mount 시 자동 생성, mode 전환 시 dispose+재생성 |
| 자체 material (MeshBasicMaterial) | 없음 | progress 색상 표현용, dispose 라이프사이클 보유 |
| 컨테이너 boundingBox 기반 좌표 결정 | 없음 | mount 시 1회 — `Box3.setFromObject(appendElement)` 중심·topY·maxDim |
| beforeDestroy | meshState만 정리 | statcomPowerFlow → meshState 역순 정리 |
| 화면 표시 | 컨테이너 mesh 색상만 | 컨테이너 mesh 색상 + 위 progress (bar 또는 circular) |

Standard는 컨테이너 내부 mesh의 `material.color` 채널만 데이터에 결합한다. Advanced/statcom_powerFlow는 추가로 (a) 자체 BoxGeometry/TorusGeometry mesh 생성·dispose 라이프사이클 (b) `setPercent/setReactivePower/setMode/setColor` 외부 명령형 API (c) 컨테이너 boundingBox 기반 동적 좌표 결정 — 세 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

기준: `meshesArea/STATCOM_BD/Advanced/animation` (동일 컨테이너) + `Generator/Advanced/generatorOutput` (자체 BoxGeometry bar) + `Marker_Firealarm/Advanced/emergencyZoneRadius` (자체 mesh dispose 라이프사이클)

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level (animation·generatorOutput·emergencyZoneRadius 답습) |
| 2 | self-null `this.statcomPowerFlow = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js 호출만 | OK — `this.statcomPowerFlow?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachStatcomPowerFlow(inst)` 내부 destroy도 mesh remove + geometry/material dispose + `inst.statcomPowerFlow = null` 포함 |
| 5 | 시그니처 일관성 | OK — `setPercent/setReactivePower/setMode/setColor/setBarGeometry/setCircularGeometry/getPercent/getMode/getColor/show/hide/start/stop/destroy` (generatorOutput `setOutput/setData/setBarGeometry/show/hide/start/stop/destroy` 동사 답습 + emergencyZoneRadius `setRadius/setColor/setPulseOptions/show/hide/start/stop/destroy` 답습) |
| 6 | UI ↔ API 축 일치 | OK — preview percent slider 0~100 ↔ `setPercent`, mode 토글 ↔ `setMode`, color picker ↔ `setColor`, current/target sliders ↔ `setReactivePower` |
| 7 | 기본값 시각 관찰 | OK — mount 직후 자동 start + 시드 percent=50 → bar 모드에서 maxHeight 절반(≈12 단위)의 파란 막대가 컨테이너 위 즉시 관찰. mode 토글 시 즉시 반원 progress로 전환 |
| 8 | 3중 등록 | manifest + 컴포넌트 루트 CLAUDE.md 본 사이클 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

**모든 항목 통과.**

---

## 모델 주의사항

- `models/meshesArea/STATCOM_BD/01_default/STATCOM_BD.gltf`은 루트 `STATCOM_BD` Group 아래 27개 자식 노드(19개 mesh)로 구성된 **컨테이너**. 모든 자식의 material은 GLTF 원본 그대로이며 컨테이너 단위 transform(translation [0, 10.81, 0])을 받는다.
- 본 변형의 progress mesh는 컨테이너 GLTF의 mesh가 아니라 **자체 생성** mesh로, `appendElement`(루트 `STATCOM_BD` Group)의 자식으로 add. 컨테이너가 회전·이동·스케일링 되면 progress mesh도 함께 변환을 받는다.
- 컨테이너의 boundingBox는 mount 시 한 번만 측정. 자식 mesh가 동적으로 추가/제거되지 않으므로 안전하다.
- mode 전환 (`setMode`)은 BoxGeometry ↔ TorusGeometry 사이의 **mesh 재생성**으로 처리 (geometry 자체는 재사용 불가). 이전 mesh의 geometry/material은 dispose 후 새 mesh를 add한다 (emergencyZoneRadius `setRadius`의 dispose+재생성 답습).
- **[MODEL_READY] placeholder 사용 안 함** — STATCOM_BD GLTF는 Standard·animation 변형이 이미 사용 중이며 본 변형도 동일 GLTF에서 동작.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.statcomInst = wemb.getDesignComponent('STATCOM_BD');
this.statcomInst.statcomPowerFlow.setMode('bar');     // 또는 'circular'
this.statcomInst.statcomPowerFlow.setColor(0x4488ff); // 도메인 색상
this.statcomInst.statcomPowerFlow.start();            // register.js가 자동 start 한 경우 no-op

// 무효전력 토픽 어댑터
const handleReactivePower = (data) => {
    this.statcomInst.statcomPowerFlow.setReactivePower({
        current: data.currentMVAR,
        target:  data.targetMVAR
    });
    // 또는: setPercent(data.percent)
};
```

---

## 발견한 문제 / Mixin 승격 후보

- **ProgressMeshMixin 승격 후보 (#42 Generator + #58 본 변형 — 2번째 자체 progress mesh 채택)**: BoxGeometry/TorusGeometry 동적 생성 + scale/thetaLength 비례 + dispose 라이프사이클 패턴. 큐 후속에서 다시 등장하면 3번째 채택으로 승격 강력 권장.
- **bar 모드 보간 옵션 부재**: generatorOutput는 1차 시스템 보간(`setInertia`)을 제공하지만 본 변형은 즉시 적용. 무효전력 투입은 빠른 응답이 일반적이므로 보간 부재가 합리적이나, 향후 setInertia 옵션 추가 여지 남김.
- **circular 모드 회전 축**: TorusGeometry는 기본 XY 평면 — 본 변형은 컨테이너 위에서 평면 readable하도록 `rotation.x = -Math.PI / 2` 적용하여 XZ 평면으로 눕힘. 페이지 카메라 각도에 따라 정면 표시가 더 적합한 경우 `setCircularGeometry`로 회전 축 옵션 추가 검토 가능.
