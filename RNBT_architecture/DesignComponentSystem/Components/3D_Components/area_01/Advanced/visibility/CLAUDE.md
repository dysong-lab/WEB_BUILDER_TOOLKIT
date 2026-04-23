# area_01 — Advanced/visibility

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 다수 Mesh 색상 변경
2. **선택적 가시성 제어** — 층/구역/타입 단위 show/hide/showOnly/toggle로 장면 구성 조절
   - 층별 분리 보기, X-ray 뷰(외벽 숨김), 구역별 필터링 지원

---

## 구현 명세

### Mixin

MeshStateMixin + MeshVisibilityMixin

### colorMap (MeshStateMixin)

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### MeshVisibilityMixin 옵션

없음. `instance.appendElement`에서 `getObjectByName`으로 메시를 탐색한다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 발행 |
|--------|------|
| click | `@meshClicked` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| resolveMeshName(event) | intersects에서 Mesh 이름 동적 추출 |

가시성 제어는 페이지에서 `instance.meshVisibility.show/hide/showOnly/toggle/showAll/hideAll`을 직접 호출한다.
클릭된 메시를 대상으로 토글하려면 `@meshClicked` 핸들러에서 `resolveMeshName(event)` → `instance.meshVisibility.toggle(meshName)` 시퀀스로 처리한다.

---

## 두 채널 공존

| Mixin | 채널 | 용도 |
|-------|------|------|
| MeshStateMixin | material.color | 데이터 상태 표현 |
| MeshVisibilityMixin | object.visible | 가시성 제어 |

상태 색상은 해당 메시가 숨겨져도 material에 보존되며, 다시 보이면 색상 그대로 복원된다.
