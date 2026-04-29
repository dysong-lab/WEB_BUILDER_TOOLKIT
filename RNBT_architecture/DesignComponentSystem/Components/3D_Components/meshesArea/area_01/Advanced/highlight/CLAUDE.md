# area_01 — Advanced/highlight

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 다수 Mesh 색상 변경
2. **선택 메시 강조** — 클릭된 Mesh에 emissive 발광 적용 (이전 선택은 자동 해제)

---

## 구현 명세

### Mixin

MeshStateMixin + MeshHighlightMixin

### colorMap (MeshStateMixin)

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### highlight 옵션 (MeshHighlightMixin)

| 옵션 | 값 |
|------|-----|
| highlightColor | 0xFFFF00 |
| highlightIntensity | 0.3 |

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

선택 강조는 페이지의 `@meshClicked` 핸들러에서 `instance.meshHighlight.clearAll()` → `instance.meshHighlight.highlight(meshName)` 시퀀스로 처리한다 (이전 선택을 자동으로 해제하고 새 선택 적용). 클릭된 Mesh 이름이 필요하면 `instance.resolveMeshName(event)`로 추출한다.

---

## 두 채널 공존

| Mixin | 채널 | 용도 |
|-------|------|------|
| MeshStateMixin | material.color | 데이터 상태 표현 |
| MeshHighlightMixin | material.emissive | 사용자 선택 피드백 |

상태 색상과 선택 강조가 동일 메시에 동시 적용 가능 (예: warning 노란색 + 주황 발광).
