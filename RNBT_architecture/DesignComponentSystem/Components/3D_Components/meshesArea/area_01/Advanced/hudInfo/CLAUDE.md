# area_01 — Advanced/hudInfo

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 다수 Mesh 색상 변경 (Standard 승계)
2. **구역별 HUD 오버레이** — zoneHud 토픽으로 수신한 구역별 데이터(인원수/자산수/상태)를 각 zone Mesh 위에 떠있는 HUD 카드에 텍스트/아이콘으로 표시
   - 운영자가 3D 모델을 보면서 각 구역의 핵심 정보(현재 인원·관리 자산 수·운영 상태)를 한눈에 파악
   - HUD 카드는 페이지가 렌더링하는 별도 DOM 오버레이 레이어(`instance.hudRoot`)에 위치하며, 카드별로 `[data-mesh-name="<zoneName>"]`로 식별

---

## 구현 명세

### Mixin

MeshStateMixin + FieldRenderMixin (선택자 계약 컨테이너) + 커스텀 메서드 `renderHud`

> **FieldRender의 역할 분담**: 3D 컨테이너의 `instance.appendElement`는 THREE.Object3D이므로 `appendElement.querySelector`가 동작하지 않는다. 따라서 `this.fieldRender.renderData`를 그대로 구독하지 **않고**, FieldRenderMixin이 주입한 `cssSelectors`/`datasetAttrs` **선택자 계약**만 활용한다. 다중 zone 라우팅은 커스텀 메서드 `renderHud`가 수행한다 — `instance.hudRoot.querySelector('[data-mesh-name="<zone>"]')`로 카드를 찾고, 카드 내부에서 cssSelectors VALUE로 sub 요소를 찾아 FieldRender의 `_applyValue` 분기 규칙(datasetAttrs → data-*, 그 외 → textContent)을 그대로 재현한다.

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
| population | `.hud-population` | 현재 인원수 (textContent) |
| assets | `.hud-assets` | 관리 자산 수 (textContent) |
| stateLabel | `.hud-state` | 운영 상태 라벨 (textContent) |
| state | `.hud-state` | 운영 상태 키 (data-state — 색상 분기 트리거) |

### datasetAttrs (FieldRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| state | `state` | `<.hud-state>` 요소에 `data-state="<status>"` 부여 (CSS로 색상/배경 분기) |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |
| zoneHud | `this.renderHud` |

> `equipmentStatus`는 Mesh 색상용 — 배열 `[{ meshName, status }, ...]`
> `zoneHud`는 HUD 오버레이용 — 배열 `[{ meshName, population, assets, stateLabel, state }, ...]`

### 이벤트 (customEvents)

없음. HUD는 데이터 표시 전용이며 Mesh 클릭 인터랙션은 갖지 않는다 (Standard와 동일하게 클릭 이벤트 없음).

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `renderHud({ response })` | zone 배열을 받아 각 카드에 FieldRender 선택자 계약대로 값 적용. `response`가 `null`이면 `[FieldRenderMixin] data is null`과 동일 형식의 Error throw. `instance.hudRoot` 미설정 시 silent skip (페이지가 아직 hudRoot를 마운트하지 않은 시점 안전 가드) |

#### renderHud 입력 포맷

```javascript
{
    response: Array<{
        meshName:   string,   // [data-mesh-name="<value>"]로 카드 식별
        population: number | string | null,
        assets:     number | string | null,
        stateLabel: string | null,
        state:      string | null    // 'normal' | 'warning' | 'error' | 'offline' (자유)
    }>
}
```

| 필드 | 타입 | 필수 | 의미 |
|------|------|------|------|
| `response` | `Array` | ✓ | `null`이면 Error throw |
| `meshName` | string | ✓ | `instance.hudRoot.querySelector([data-mesh-name="..."])` 대상 |
| `population` / `assets` / `stateLabel` / `state` | string\|number\|null | — | `null`이면 해당 KEY 건너뜀(FieldRender와 동일) |

**처리 분기** (FieldRender `_applyValue` 동등 재현)

| 조건 | 결과 |
|------|------|
| `value == null` | 해당 KEY 건너뜀 |
| `cssSelectors[key]` 없음 | 해당 KEY 건너뜀 |
| `datasetAttrs[key]` 존재 | `el.setAttribute('data-' + datasetAttrs[key], value)` |
| 그 외 | `el.textContent = value` |

**반환**: `void`

---

## 페이지 측 연동 패턴

```javascript
// loaded.js — HUD 오버레이 DOM을 마운트하고 instance에 주입
const hudRoot = document.getElementById('hud-overlay-area01');
this.hudInfoInstance = wemb.getDesignComponent('hudInfo');  // 인스턴스 획득 방식은 페이지 환경에 따라 다름
this.hudInfoInstance.hudRoot = hudRoot;

// loaded.js — HUD 데이터 발행 매핑
this.pageDataMappings = [
    { topic: 'equipmentStatus', datasetInfo: { datasetName: 'containerEquipmentStatus', param: {} }, refreshInterval: 30000 },
    { topic: 'zoneHud',         datasetInfo: { datasetName: 'containerZoneHud',         param: {} }, refreshInterval: 30000 }
];
```

HUD 카드 HTML 구조 예시 (페이지가 정적으로 렌더):

```html
<div id="hud-overlay-area01">
    <div class="hud-card" data-mesh-name="zoneA" style="left:120px; top:80px;">
        <span class="hud-population">-</span>
        <span class="hud-assets">-</span>
        <span class="hud-state" data-state="">-</span>
    </div>
    <div class="hud-card" data-mesh-name="zoneB" style="left:340px; top:200px;">...</div>
</div>
```

> 카드의 화면 위치는 페이지가 결정한다 (3D-to-Screen 좌표 변환 또는 정적 좌표). 본 컴포넌트는 카드 식별·내용 갱신만 담당한다.

---

## Standard와의 분리 정당성

Standard는 `applyMeshStateMixin` 단독 + `equipmentStatus` 1개 토픽만 구독한다. Advanced/hudInfo는:

1. **Mixin 조합 차이**: `applyFieldRenderMixin`을 추가 적용하여 HUD 선택자 계약을 인스턴스에 주입
2. **커스텀 메서드 차이**: `this.renderHud` 추가
3. **구독 토픽 차이**: `equipmentStatus` + `zoneHud` 2개 구독

→ register.js의 핵심 3 영역(Mixin / 커스텀 메서드 / subscriptions) 모두 다르므로 별도 변형으로 분리하는 것이 정당하다.

---

## 두 채널 공존

| Mixin | 채널 | 용도 |
|-------|------|------|
| MeshStateMixin | `material.color` | 데이터 상태 표현 (3D Mesh) |
| FieldRenderMixin (선택자 계약) + 커스텀 메서드 | `instance.hudRoot` 하위 DOM | 구역별 텍스트 HUD (2D 오버레이) |

3D 색상 채널과 2D HUD 채널은 완전히 직교 — 색상은 mesh material에, HUD 텍스트는 DOM에 기록되어 서로 간섭하지 않는다. 한 zone에 두 채널이 동시에 적용되면(예: `state=warning`) 3D mesh는 노란색, HUD 카드는 `data-state="warning"` 표식이 동시에 보인다.

---

## Mixin 승격 시나리오 (메모)

본 변형의 "FieldRender 선택자 계약을 meshName으로 라우팅하는 패턴"이 **2번째 컨테이너 컴포넌트(예: `meshesArea/STATCOM_BD/Advanced/hudInfo`)**에서 동일 기법으로 요구될 경우, ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"의 승격 기준에 따라 `FieldRenderRoutedMixin`(가칭) 신규 Mixin 신설을 검토한다. 1차 구현(본 변형)은 커스텀 메서드로 유지한다.

## 모델 주의사항

`area_01.glb`의 zone Mesh 이름(예: `zoneA`, `zoneB`, …)은 페이지가 발행하는 `zoneHud` 데이터의 `meshName` 값과 일치해야 한다. HUD 카드의 `data-mesh-name` 속성도 동일해야 한다 — 세 곳이 일치해야 카드가 정확히 갱신된다. mesh 이름 규약이 변종마다 다르면 HUD 카드 HTML도 변종별로 재작성되어야 하므로, 새 모델 변종은 기존 mesh 이름 규약을 유지해야 한다.
