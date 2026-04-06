# 3D 컴포넌트 가이드

## 3D 컴포넌트란

GLTF 3D 모델에 데이터 기반 상태(색상), 카메라 인터랙션, 상세 팝업을 부여하는 컴포넌트.
2D 컴포넌트와 동일한 Mixin 아키텍처를 따르되, DOM 대신 Three.js 메시를 조작한다.

---

## 2D vs 3D 차이점

| 항목 | 2D | 3D |
|------|----|----|
| 시각 루트 | DOM HTMLElement | THREE.Group / Object3D |
| 상태 표시 | FieldRenderMixin (텍스트/속성) | MeshStateMixin (메시 색상) |
| 이벤트 | `Wkit.bindEvents()` | `Wkit.bind3DEvents()` (레이캐스팅) |
| 팝업 | ShadowPopupMixin (template → Shadow DOM) | 3DShadowPopupMixin (문자열 → Shadow DOM) |
| 팝업 호스트 | `instance.appendElement` | `instance.page.appendElement` |
| 카메라 | 없음 | CameraFocusMixin |

---

## 3D Mixin 3종

| Mixin | 네임스페이스 | 역할 |
|-------|------------|------|
| MeshStateMixin | `this.meshState` | 상태값 → 메시 색상 변경 |
| CameraFocusMixin | `this.cameraFocus` | 메시 클릭 → 카메라 포커스 이동 |
| 3DShadowPopupMixin | `this.shadowPopup` | 메시 클릭 → Shadow DOM 팝업 표시 |

---

## 3개 변형 (Variant)

모든 3D 컴포넌트는 3개 변형을 가진다. Mixin 누적 조합으로 기능이 확장된다.

### 01_status — 상태만

```
MeshStateMixin
→ subscribe(equipmentStatus)
```

메시 색상만 변경. 인터랙션 없음.

### 02_status_camera — 상태 + 카메라

```
MeshStateMixin + CameraFocusMixin
→ subscribe(equipmentStatus)
→ bind3DEvents(click)
```

클릭 시 카메라가 해당 메시로 포커스 이동.

### 03_status_popup — 상태 + 팝업

```
MeshStateMixin + 3DShadowPopupMixin
→ subscribe(equipmentStatus)
→ bind3DEvents(click)
→ showDetail()
```

클릭 시 상세 정보 팝업. `showDetail()`이 현재 메시 상태를 팝업에 표시.

---

## 컴포넌트 유형

### 단일 메시 (1 GLTF = 1 Mesh)

meshName을 하드코딩. 가장 단순.

**해당**: BATT, Chiller, Panel, UPS, tempHumiTH2B, thermohygrostat

### 컨테이너 (1 GLTF = N Mesh)

`resolveMeshName(event)`로 클릭된 메시를 동적 식별. 레이캐스팅 결과에서 부모 체인을 순회하여 이름 있는 메시를 찾는다.

**해당**: gltf_container, CoolingTower, HV, Generator

---

## 공통 colorMap

모든 3D 컴포넌트가 동일한 색상 매핑을 사용한다.

```javascript
{
    normal:  0x34d399,   // 초록 — 정상
    warning: 0xfbbf24,   // 노랑 — 경고
    error:   0xf87171,   // 빨강 — 에러
    offline: 0x6b7280    // 회색 — 오프라인
}
```

---

## 파일 구조

```
3D_Components/[Name]/
    scripts/
        01_status/
            component/
                register.js
                beforeDestroy.js
            page/
                before_load.js
                loaded.js
                before_unload.js
        02_status_camera/
            component/ ...
            page/ ...
        03_status_popup/
            component/ ...
            page/ ...
    preview/
        01_status.html
        02_status_camera.html
        03_status_popup.html
```

2D와 다른 점:
- `scripts/` 아래에 **변형별 폴더** (01, 02, 03)
- 각 변형에 `component/` (register, beforeDestroy) + `page/` (before_load, loaded, before_unload)
- `views/`, `styles/` 없음 (3D 모델이 시각 표현)

---

## 구현 현황 (2026-04-06 기준)

### 완료: 7개 컴포넌트

| 컴포넌트 | 유형 | 메시 수 | 변형 |
|----------|------|--------|------|
| BATT | 단일 | 1 | 01, 02, 03 |
| Chiller | 단일 | 1 | 01, 02, 03 |
| Panel | 단일 | 1 | 01, 02, 03 |
| UPS | 단일 | 1 | 01, 02, 03 |
| tempHumiTH2B | 단일 | 1 | 01, 02, 03 |
| thermohygrostat | 단일 | 1 | 01, 02, 03 |
| gltf_container | 컨테이너 | N | 01, 02, 03 |

### 미구현: 3개 (GLTF 모델 존재)

CoolingTower (2 메시), Generator (3 메시), HV (6 메시)

> 대량생산 플랜: [PRODUCTION_PLAN.md](./PRODUCTION_PLAN.md) 참조
