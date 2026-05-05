# BATT — Advanced/dataHud

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'BATT' Mesh 색상 변경 (Standard 승계)
2. **3D 위치 추적 데이터 HUD** — 'BATT' mesh의 월드 좌표를 카메라 projection으로 화면 좌표로 변환하여, 이를 따라가는 absolute-position된 DOM 카드에 SOC/SOH/전압 등 배터리 핵심 수치를 실시간 표시
   - 운영자가 3D 모델을 자유롭게 회전·줌해도 HUD 카드가 BATT 위에 고정되어 따라온다
   - 카드 내용은 FieldRenderMixin의 선택자 계약(`.batt-soc / .batt-soh / .batt-voltage / .batt-state`)으로 갱신
   - SOC: 충전 잔량(%) / SOH: 잔존 수명(%) / Voltage: 단자 전압(V) / State: charging/discharging/idle/fault
3. **외부 명령형 setData API** — 페이지가 `instance.dataHud.setData({ soc, soh, voltage, state, ... })`로 직접 호출하여 데이터 갱신 (배터리 데이터 토픽이 표준화되기 전 단계)

---

## BATT mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/BATT/01_default/BATT.gltf` |
| mesh 이름 | `BATT` (단일) |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: BATT 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`와 일치하며 Standard/Advanced/visibility/clipping/highlight/camera_highlight 등 모든 기존 변형이 단일 'BATT' 메시 기반으로 동작 중. 본 변형도 그 규약을 그대로 따르며, HUD 카드의 화면 좌표는 `model.getObjectByName('BATT')`의 월드 위치를 기준으로 계산한다.

---

## 구현 명세

### Mixin

MeshStateMixin + FieldRenderMixin (선택자 계약 컨테이너) + 커스텀 메서드 `this.dataHud`

> **FieldRender의 역할 분담**: 3D 컴포넌트의 `instance.appendElement`는 THREE.Object3D이므로 `appendElement.querySelector`가 동작하지 않는다. 따라서 `this.fieldRender.renderData`를 그대로 구독하지 **않고**, FieldRenderMixin이 주입한 `cssSelectors`/`datasetAttrs` **선택자 계약**만 활용한다. DOM 카드 내부 sub 요소 갱신은 커스텀 메서드 `this.dataHud.setData`가 수행한다 — `this.dataHud._cardEl.querySelector(cssSelectors[key])`로 sub 요소를 찾고, FieldRender의 `_applyValue` 분기 규칙(datasetAttrs → data-*, 그 외 → textContent)을 그대로 재현한다. 이 패턴은 컨테이너 변형 `meshesArea/area_01/Advanced/hudInfo`에서 N개 zone 라우팅용으로 도입된 것을 단일 mesh로 단순화한 것이다.

### colorMap (MeshStateMixin)

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### cssSelectors (FieldRenderMixin) — HUD 카드 내부 sub 요소

| KEY | VALUE | 용도 |
|-----|-------|------|
| soc | `.batt-soc` | SOC(%) — 충전 잔량 (textContent) |
| soh | `.batt-soh` | SOH(%) — 잔존 수명 (textContent) |
| voltage | `.batt-voltage` | 단자 전압(V) (textContent) |
| stateLabel | `.batt-state` | 동작 상태 라벨 (textContent) |
| state | `.batt-state` | 동작 상태 키 (data-state — CSS 색상 분기 트리거) |

### datasetAttrs (FieldRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| state | `state` | `<.batt-state>` 요소에 `data-state="<status>"` 부여 (CSS로 색상/배경 분기) |

### 커스텀 네임스페이스 `this.dataHud`

| 메서드 | 동작 |
|--------|------|
| `setData({ soc, soh, voltage, stateLabel, state })` | 수치 갱신. FieldRender 선택자 계약(`cssSelectors` / `datasetAttrs`)을 사용하여 카드 내부 sub 요소에 값 적용. `null` 값은 해당 KEY skip (FieldRender 동등 동작) |
| `setOffset({ x, y })` | DOM 오버레이의 mesh 화면 좌표 기준 픽셀 오프셋 조정 (예: mesh 위쪽으로 60px) |
| `show()` / `hide()` | DOM 오버레이 표시/숨김 (`display: block` / `none`) |
| `start()` | RAF 좌표 추적 루프 시작. 동일 호출 중복은 no-op |
| `stop()` | RAF 좌표 추적 루프 정지. DOM은 유지(재시작 가능) |
| `destroy()` | RAF cancel + DOM remove + 외부 주입 자원(`_renderer`/`_camera`/`_cardEl`/`_hudRoot`) null + 마지막 줄 `this.dataHud = null` (self-null) |

### 외부 주입 자원 (페이지 책임)

| 자원 | 의미 |
|------|------|
| `instance.dataHud._renderer` | THREE.WebGLRenderer (canvas DOM 크기/위치 산출용) — 기본값 `wemb.threeElements.renderer` |
| `instance.dataHud._camera` | THREE.Camera (월드→화면 projection용) — 기본값 `wemb.threeElements.camera` |
| `instance.dataHud._hudRoot` | absolute-position된 DOM 컨테이너 (페이지가 마운트한 overlay div) — `setData`/RAF 동작 전 필수 |

> register.js는 `wemb.threeElements`에서 renderer/camera를 자동으로 끌어오지만, preview·테스트 환경에서는 페이지가 직접 `instance.dataHud._renderer`/`_camera`를 주입할 수 있다. `_hudRoot`는 항상 페이지가 주입한다 (DOM 마운트 시점이 페이지 책임).

#### setData 입력 포맷

```javascript
{
    soc:        number | string | null,   // 0~100
    soh:        number | string | null,   // 0~100
    voltage:    number | string | null,   // V
    stateLabel: string | null,            // '충전 중' / '방전 중' 등
    state:      string | null             // 'normal' | 'warning' | 'error' | 'offline' (자유)
}
```

**처리 분기** (FieldRender `_applyValue` 동등 재현)

| 조건 | 결과 |
|------|------|
| `value == null` | 해당 KEY 건너뜀 |
| `cssSelectors[key]` 없음 | 해당 KEY 건너뜀 |
| `datasetAttrs[key]` 존재 | `el.setAttribute('data-' + datasetAttrs[key], value)` |
| 그 외 | `el.textContent = value` |

#### 좌표 추적 RAF 핵심

```
mesh = appendElement.getObjectByName('BATT')
// 매 프레임:
mesh.getWorldPosition(_tmpVec3)
_tmpVec3.project(_camera)                                   // NDC -3D→2D
canvasRect = _renderer.domElement.getBoundingClientRect()
hudRect    = _hudRoot.getBoundingClientRect()
// canvas 내 픽셀 좌표
xCanvas = (_tmpVec3.x * 0.5 + 0.5) * canvasRect.width
yCanvas = (-_tmpVec3.y * 0.5 + 0.5) * canvasRect.height
// hudRoot 기준 픽셀 좌표 (canvas와 hudRoot가 다른 부모일 때도 정합)
xHud = (canvasRect.left - hudRect.left) + xCanvas + offsetX
yHud = (canvasRect.top  - hudRect.top ) + yCanvas + offsetY
_cardEl.style.transform = `translate(${xHud}px, ${yHud}px) translate(-50%, -100%)`
```

`translate(-50%, -100%)`로 카드의 좌하단이 mesh 화면 좌표에 닿도록 하여 카드가 BATT 위쪽에 띄워진 것처럼 보이게 한다 (offset y=0 기본). 페이지가 `setOffset`으로 추가 위치 조정 가능.

**기본값**: SOC 80, SOH 95, Voltage 48.0, State 'normal' / Label '대기' — preview에서 모델 로드 직후 자동 표시되어 시각적으로 즉시 관찰 가능.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

`SOC/SOH/전압`은 별도 토픽이 아니라 페이지가 외부 트리거(BMS 데이터 수신·계산값)로 `instance.dataHud.setData(...)`를 직접 호출한다. `pipeFlow`/`fluidFlow`/`dynamicRpm` 패턴과 동일한 외부 명령형 API. 향후 `battData` 같은 표준 토픽이 정의되면 페이지가 자체 어댑터에서 `dataHud.setData`로 위임하거나, register에서 직접 구독하도록 확장 가능.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='BATT' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요. HUD는 데이터 표시 전용.

### 라이프사이클

- `register.js`는 Mixin 적용 + `this.dataHud` API 등록 + 기본값 시드(SOC 80 / SOH 95 / V 48.0 / State 'normal' / Label '대기')까지 수행한다.
- 페이지가 `_hudRoot`에 DOM 카드를 마운트하고 `instance.dataHud._hudRoot = root` 주입 후 `start()` 호출
- `setData()`는 `_hudRoot` 마운트 전 호출되면 silent skip (안전 가드 — `_cardEl`이 null)
- `start()`도 `_hudRoot` 미설정 시 RAF만 돌고 DOM 위치 갱신은 skip

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/dataHud |
|------|----------|------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `applyFieldRenderMixin` | ✗ | ✓ (선택자 계약 컨테이너) |
| `this.dataHud` 네임스페이스 | 없음 | `setData/setOffset/show/hide/start/stop/destroy` 노출 |
| RAF 루프 | 없음 | dataHud 자체 관리 (`start/stop`으로 명시 제어) |
| 외부 주입 자원 | 없음 | `_renderer/_camera/_hudRoot` 페이지 책임 |
| beforeDestroy | meshState만 정리 | dataHud → fieldRender → meshState 역순 정리 |

Standard는 색상 채널만 데이터에 결합한다. Advanced/dataHud는 추가로 (a) FieldRender 선택자 계약, (b) 월드→화면 projection RAF, (c) DOM 오버레이 carry-along — 세 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 정의 + DOM/RAF 라이프사이클이 모두 추가되므로 별도 폴더로 분리한다.

---

## 다른 BATT Advanced 변형과의 관계

| 변형 | 채널 | 표현 |
|------|------|------|
| visibility | `object.visible` | 메시 전체 on/off |
| clipping | `material.clippingPlanes` | 평면 기준 부분 절단 |
| highlight | `material.emissive` | 선택 강조 (emissive 채널) |
| **dataHud** | **DOM (별도 overlay) + 좌표 RAF** | **수치 HUD 카드가 mesh 위에 떠 있음** |

dataHud는 다른 변형들과 채널이 직교한다. 동일 BATT 위에 dataHud 카드가 떠 있으면서 visibility로 mesh를 숨기면 카드만 남는데, 이 경우 페이지가 `dataHud.hide()` 또는 `stop()`을 명시적으로 호출하여 카드도 함께 숨길 수 있다 (본 변형은 visibility/clipping과 자동 연동하지 않음 — 단일 책임 유지).

---

## 컨테이너 변형 `meshesArea/area_01/Advanced/hudInfo`와의 관계

본 변형은 hudInfo의 핵심 패턴(FieldRender 선택자 계약 + DOM 오버레이 + 커스텀 메서드 라우팅)을 **단일 mesh로 단순화**한 것이다.

| 측면 | hudInfo (컨테이너) | dataHud (개별 단위) |
|------|-------------------|---------------------|
| mesh 식별 | N개 zone, `data-mesh-name="<zone>"`로 카드 라우팅 | 단일 'BATT', 카드 1개 고정 |
| FieldRender cssSelectors | population/assets/stateLabel/state | soc/soh/voltage/stateLabel/state |
| 좌표 결정 | 페이지 책임 (정적 grid 또는 3D-to-Screen) | dataHud 자체 RAF로 mesh 추적 |
| RAF | 없음 (좌표는 페이지 책임) | 있음 (월드→화면 projection 매 프레임) |
| 외부 주입 자원 | `instance.hudRoot` | `_renderer/_camera/_hudRoot` |
| 커스텀 메서드 | `this.renderHud(payload)` (구독 핸들러형) | `this.dataHud.{setData/start/stop/...}` (외부 명령형 + RAF) |

두 변형 모두 "FieldRender 계약 + 커스텀 메서드 + DOM 오버레이" 패턴이 공통이지만, 좌표 전략(정적 vs RAF 추적)과 식별 전략(다중 라우팅 vs 단일 고정)이 달라 별도 구현을 유지한다.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// 페이지 HTML (정적 마운트)
<div id="batt-hud-overlay" style="position:absolute; inset:0; pointer-events:none;">
    <div class="batt-hud-card" data-mesh-name="BATT">
        <div class="batt-hud-row"><span class="batt-hud-label">SOC</span><span class="batt-soc">-</span></div>
        <div class="batt-hud-row"><span class="batt-hud-label">SOH</span><span class="batt-soh">-</span></div>
        <div class="batt-hud-row"><span class="batt-hud-label">V</span><span class="batt-voltage">-</span></div>
        <div class="batt-hud-row"><span class="batt-state" data-state="">-</span></div>
    </div>
</div>

// loaded.js
const overlay = document.getElementById('batt-hud-overlay');
this.battInstance = wemb.getDesignComponent('BATT');
this.battInstance.dataHud._hudRoot = overlay;
this.battInstance.dataHud.start();

// 데이터 수신 시 (BMS 토픽 어댑터)
this.battInstance.dataHud.setData({
    soc: 78, soh: 94, voltage: 47.8, stateLabel: '방전 중', state: 'normal'
});
```

---

## Mixin 승격 시나리오 (메모)

본 변형의 "단일 mesh를 추적하는 DOM 데이터 HUD" 패턴은 **2번째 컴포넌트(예: GasDetector/sensorHud, tempHumiTH2B/sensorDataHud, MonnitTemperature_sensor/sensorDataHud, OHU103/outdoorUnitPerformance)**에서 거의 동일 기법으로 요구될 가능성이 높다 (큐 #21, #24, #26, #41 등). ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"의 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"에 따라 본 사이클은 커스텀 메서드로 완결하되, 2번째 컴포넌트 등록 시점에 `MeshTrackingHudMixin`(가칭) 또는 `Worldspace2DOverlayMixin`(가칭) 신규 Mixin 신설을 검토한다. 그 시점에 인자 시그니처(`setData/setOffset/start/stop/destroy`)를 그대로 수용 가능하도록 설계.

또한 컨테이너 변형 `meshesArea/area_01/Advanced/hudInfo`의 다중 zone 라우팅 패턴과 통합한다면 `MeshHudOverlayMixin`(가칭)으로 확장 — 단일 mesh / 다중 mesh 모두 옵션으로 지원.

---

## 모델 주의사항

- `models/BATT/01_default/BATT.gltf`의 단일 메시 이름은 `'BATT'`로 확정. dataHud는 `getObjectByName('BATT')`로 추적 대상 mesh를 직접 조회한다.
- 모델 작가가 추후 다중 mesh 모델(랙 외피 + 셀 분리)로 확장할 경우, dataHud는 `BATT` 루트 노드를 추적하므로 그대로 동작한다 (자식 mesh 분해 무관). 만약 셀 단위 HUD가 필요하면 컨테이너 hudInfo 패턴으로 별도 변형 분리.
- `_renderer.domElement`(canvas)와 `_hudRoot`(overlay div)가 서로 다른 부모에 위치해도 `getBoundingClientRect` 차이를 보정하므로 정합. 단, 두 요소 모두 정상 렌더링된 상태(즉, 0 크기가 아님)여야 한다.

---

## 발견한 문제 (Phase 1.5 자율검증 — register/beforeDestroy/preview 작성 후 검증)

- **Mixin 승격 후보**: `MeshTrackingHudMixin`(가칭) — BATT/GasDetector/tempHumiTH2B/MonnitTemperature_sensor/OHU103 등 다수 장비에서 동일 패턴 재사용 예상. 본 사이클은 커스텀 메서드로 완결, 2번째 적용 시점에 승격 검토.
- **`setData` 토픽 표준화 후보**: 현재 페이지가 외부 명령형으로 `setData` 호출하지만, BMS 데이터 토픽이 표준화되면 register에서 `battData` 토픽 직접 구독으로 단순화 가능.

