# BATT — Advanced/alarmPulse

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'BATT' Mesh 색상 변경 (Standard 승계, `material.color` 채널)
2. **알람 펄스 발광** — 'BATT' mesh의 `material.emissive` 강도를 sine wave 기반 RAF 루프로 주기적으로 변조하여 시각적 펄스 표현
   - 정비/관제 화면에서 status가 `error`/`warning`일 때 즉각적인 시선 유도가 필요할 때 사용
   - 펄스는 색상이 아닌 **광휘(emissive)**로 표현되어, 데이터 색상(`material.color`)을 덮어쓰지 않음
3. **status 자동 연동** — equipmentStatus 핸들러 래퍼가 status에 따라 펄스를 자동 시작/정지
   - `error` → 빨강 펄스 (0xff3030, period 700ms)
   - `warning` → 황색 펄스 (0xffb020, period 1100ms)
   - `normal` / `offline` → 펄스 정지 + emissive 원복
4. **외부 명령형 API** — 페이지가 임의 색상·주기·진폭으로 직접 펄스를 켤 수 있도록 `this.alarmPulse.start/stop/setPeriod/setColor` 노출 (메인터넌스 모드의 강제 알람 등)

---

## BATT mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/BATT/01_default/BATT.gltf` |
| mesh 이름 | `BATT` (단일) |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`와 일치하며 Standard/Advanced/visibility/clipping/highlight/dataHud 등 모든 기존 변형이 단일 'BATT' 메시 기반으로 동작 중. 본 변형도 그 규약을 그대로 따른다.

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.alarmPulse` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### MeshState 채널과의 충돌 회피 정책

**원칙**: alarmPulse는 `material.emissive`(광휘) 채널만 사용한다. MeshStateMixin이 사용하는 `material.color`(반사색) 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` | 데이터 상태 색상 (Standard 승계) |
| alarmPulse (커스텀) | `material.emissive` (+ `material.emissiveIntensity`) | 펄스 광휘 변조 |

이로써 두 채널이 완전히 직교 — 펄스가 활성화되어도 데이터 상태 색상이 보존되고, 펄스 정지 시 emissive만 원복하면 된다. `material.color` 펄스 옵션은 채택하지 않음 (MeshState renderData의 매번 호출 시 덮어쓰기 발생 → 일시 disable 필요 → 복잡도 폭발).

### 펄스 알고리즘 (sine wave)

```
t            = performance.now() (ms)
phase        = (t / period) * 2π
intensity    = (sin(phase) + 1) / 2          // 0 ~ 1 정규화
emissiveLerp = lerp(0, maxIntensity, intensity)

material.emissive.setHex(pulseColor)
material.emissiveIntensity = emissiveLerp
```

- `period`: ms 단위 — 한 사이클(0 → max → 0) 길이. 기본 700ms (error), 1100ms (warning)
- `maxIntensity`: emissiveIntensity 최대값. 기본 1.5 (모델 ACESFilmic 톤매핑에 노출 1.2 환경에서 시각적으로 확실히 변화 관찰 가능)
- `minIntensity`: 기본 0 — sine 위상이 -1일 때 완전 소등

### 커스텀 네임스페이스 `this.alarmPulse`

| 메서드 | 동작 |
|--------|------|
| `start(meshName, options)` | 펄스 시작. options: `{ color, period, minIntensity, maxIntensity }` (모두 optional). 동일 meshName 중복 호출은 옵션만 갱신하고 RAF는 유지. 내부적으로 mesh의 원본 emissive/emissiveIntensity를 1회 보관 |
| `stop(meshName)` | 펄스 정지 + 해당 mesh의 emissive/emissiveIntensity 원본 복원. 활성 펄스 0개가 되면 RAF 정지 |
| `setPeriod(meshName, ms)` | 주기 변경 (실행 중에도 즉시 반영) |
| `setColor(meshName, color)` | 펄스 색상 변경 (THREE.Color hex number 또는 string 허용 — `material.emissive.setHex` 또는 `set` 위임) |
| `getMeshNames()` | 현재 펄스 중인 mesh 이름 배열 |
| `destroy()` | 모든 RAF cancel + 모든 mesh emissive/emissiveIntensity 원본 복원 + `_originals` Map clear + 마지막 줄 `this.alarmPulse = null` (self-null) |

#### options 기본값

| 키 | 기본값 |
|----|--------|
| color | 0xff3030 (적색) |
| period | 700 (ms) |
| minIntensity | 0 |
| maxIntensity | 1.5 |

### 원본 보관/복원 정책

`_originals: Map<meshName, { material: THREE.Material(s), emissive: THREE.Color, emissiveIntensity: number, hadEmissive: boolean }>`

- `start()` 첫 호출 시점에 mesh의 material(또는 multi-material 배열의 각 material)에 대해 `emissive.clone()`과 `emissiveIntensity`를 보관
- material이 emissive 속성이 없는 타입(MeshBasicMaterial 등)이면 `start()`는 silent skip (`_originals`에도 등록하지 않음)
- `stop()` / `destroy()` 시 보관된 `emissive`를 `material.emissive.copy(saved)`로 복원, `emissiveIntensity`도 원래 값 복원

> MeshStateMixin이 매 `setMeshState` 호출 시 `material = material.clone()`을 수행하므로, 펄스 동작 중에도 status 갱신이 발생할 수 있다. alarmPulse는 매 RAF tick에서 `mesh.material`을 재조회하여 적용 대상 material을 최신 참조로 사용한다(stale clone 회피).
>
> 복원 단계에서는 status 갱신으로 material이 클론되었더라도 emissive 채널은 MeshStateMixin이 건드리지 않으므로(원본의 emissive 속성이 그대로 복제됨) `emissive.copy(saved)` 복원이 의미가 있다.

### equipmentStatus 자동 연동

기본 동작은 페이지가 별도 트리거를 호출하지 않아도, equipmentStatus 토픽이 들어오면 status에 따라 펄스가 자동으로 켜지고 꺼지는 것이다. 이를 위해 register.js는 `meshState.renderData`를 그대로 구독하지 않고, **상태별 펄스 자동 토글**을 수행하는 래퍼 핸들러 `this.handleEquipmentStatus`를 등록한다.

| status | 동작 |
|--------|------|
| `error` | `alarmPulse.start('BATT', { color: 0xff3030, period: 700 })` |
| `warning` | `alarmPulse.start('BATT', { color: 0xffb020, period: 1100 })` |
| `normal` / `offline` / 기타 | `alarmPulse.stop('BATT')` |

상태 변환은 자기 자신에 대해 멱등 — 같은 status가 연속으로 들어와도 펄스는 그대로 유지된다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.handleEquipmentStatus` (래퍼: `meshState.renderData` + 상태별 펄스 자동 토글) |

### 이벤트 (customEvents)

없음. 펄스 토글은 자동(equipmentStatus 연동) + 외부 명령형 API(페이지 직접 호출). 개별 단위(meshName 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트는 불필요.

### 라이프사이클

- `register.js`: Mixin 적용 + `this.alarmPulse` API 정의 + `this.handleEquipmentStatus` 래퍼 정의 + `equipmentStatus` 구독 (래퍼 등록)
- 자동 동작: equipmentStatus 데이터 도착 시 핸들러 래퍼가 (a) `meshState.renderData(payload)` 호출(색상 갱신), (b) status 분기로 펄스 start/stop
- 페이지가 추가로 직접 `instance.alarmPulse.start/stop/setPeriod/setColor`를 호출해도 됨 (메인터넌스 강제 알람 등)
- `beforeDestroy.js`: 구독 해제 → `this.alarmPulse?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/alarmPulse |
|------|----------|---------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.alarmPulse` 네임스페이스 | 없음 | `start/stop/setPeriod/setColor/getMeshNames/destroy` 노출 |
| RAF 루프 | 없음 | alarmPulse 자체 관리 (펄스 활성 시에만 유지) |
| `material.emissive` 채널 사용 | 없음 | 사용 (보관/변조/복원) |
| equipmentStatus 핸들러 | `meshState.renderData` 직접 | 래퍼 `handleEquipmentStatus` (renderData 호출 + 펄스 자동 토글) |
| beforeDestroy | meshState만 정리 | alarmPulse → meshState 역순 정리 |

Standard는 색상 채널만 데이터에 결합한다. Advanced/alarmPulse는 추가로 (a) emissive 채널, (b) 시간 기반 RAF 변조, (c) status 자동 연동 래퍼 — 세 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 + 래퍼 핸들러 + RAF 라이프사이클이 모두 추가되므로 별도 폴더로 분리한다.

---

## 다른 BATT Advanced 변형과의 관계

| 변형 | 채널 | 표현 |
|------|------|------|
| visibility | `object.visible` | 메시 전체 on/off |
| clipping | `material.clippingPlanes` | 평면 기준 부분 절단 |
| highlight | `material.emissive` (정적 강도) | 선택 강조 |
| dataHud | DOM 오버레이 + 좌표 RAF | 수치 HUD 카드 |
| **alarmPulse** | **`material.emissive` (시간 변조)** | **알람 발광 펄스** |

> **highlight와의 채널 경합 주의**: 두 변형 모두 `emissive` 채널을 사용한다. 단일 변형 폴더 안에서는 **본 변형(alarmPulse)이 emissive를 독점 사용**하므로 충돌이 없다. 페이지가 BATT highlight + alarmPulse를 동시에 적용한 별도 변형을 만들고자 할 경우, 두 메서드 중 하나가 emissive를 우선하도록 정책을 정해야 한다 (현재 큐에는 그런 변형 없음).

---

## 페이지 측 연동 패턴

### 시나리오 A — 자동 (기본)

```javascript
// 별도 작업 불필요. equipmentStatus 토픽이 발행되면 자동으로:
//   status='error'  → 빨강 펄스 시작
//   status='warning' → 황색 펄스 시작
//   status='normal' → 펄스 정지 + 색상은 normal로 갱신
```

### 시나리오 B — 강제 알람 (수동)

```javascript
// 운영자 수동 알람 토글 등 외부 트리거
this.battInstance = wemb.getDesignComponent('BATT');
this.battInstance.alarmPulse.start('BATT', { color: 0xff00ff, period: 500 });
// 다른 색/주기로 즉시 변경
this.battInstance.alarmPulse.setColor('BATT', 0x00ffff);
this.battInstance.alarmPulse.setPeriod('BATT', 1500);
// 강제 정지
this.battInstance.alarmPulse.stop('BATT');
```

---

## Mixin 승격 시나리오 (메모)

본 변형의 "mesh emissive 채널 시간 변조 펄스" 패턴은 **다수 장비(MCCB/UPS/Chiller/Panel/Pump 등 거의 모든 알람 표시 가능 장비)**에서 동일 기법으로 재사용될 가능성이 매우 높다. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"의 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"에 따라 본 사이클은 커스텀 메서드로 완결하되, 2번째 컴포넌트 등록 시점에 다음을 검토:

- **신규 Mixin 후보 이름**: `MeshEmissivePulseMixin`(가칭) 또는 `AlarmPulseMixin`(가칭)
- **API 호환성**: 현 시그니처(`start/stop/setPeriod/setColor/getMeshNames/destroy`) 그대로 수용 가능
- **자동 status 연동**: Mixin은 순수 emissive 변조만 담당하고, status 자동 연동은 컴포넌트 register에서 래퍼로 유지(컴포넌트마다 status→펄스 매핑 다를 수 있음)

---

## 모델 주의사항

- `models/BATT/01_default/BATT.gltf`의 단일 메시 이름은 `'BATT'`로 확정. alarmPulse는 `getObjectByName('BATT')`로 추적 대상 mesh를 직접 조회한다.
- BATT mesh 또는 그 자식 material이 `MeshStandardMaterial`/`MeshPhysicalMaterial`이면 `emissive` 속성이 존재하므로 펄스 동작. `MeshBasicMaterial` 등 emissive를 지원하지 않는 타입이면 silent skip — `getMeshNames()`로 등록 여부 확인 가능.
- preview는 ACESFilmic 톤매핑(exposure 1.2) 기본 환경에서 `maxIntensity 1.5`가 명확하게 관찰 가능하도록 튜닝됨.

---

## Phase 1.5 자율검증 결과

8항목 통과:
1. register.js 평탄 (IIFE 없음) — 통과
2. `this.alarmPulse.destroy()` 마지막 줄 self-null `this.alarmPulse = null` — 통과
3. beforeDestroy.js는 호출만 (null 할당 없음) — 통과
4. preview attach 함수 destroy도 동일 규약 (`inst.alarmPulse = null` 포함 + emissive 복원) — 통과
5. 커스텀 메서드 시그니처 `start/stop/setXxx/getMeshNames/destroy` 동사 일관성 (pipeFlow/dynamicRpm/dataHud 패턴) — 통과
6. UI ↔ API 인자 축 일치 (preview period 슬라이더 ms ↔ setPeriod ms, color picker ↔ setColor) — 통과
7. 기본값의 시각적 관찰 가능성 — preview 로드 직후 status='normal' 기본 상태에서 펄스 정지 / Error 버튼 클릭 시 즉시 빨강 펄스 관찰 — 통과
8. manifest + BATT/CLAUDE.md 등록 — 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당)
