# STATCOM_Submodule — Standard

## 기능

- `equipmentStatus` 토픽을 구독하여 `{meshName, status}[]` 배열 수신
- 수신한 데이터에 따라 컨테이너 GLTF 내부 다수 Mesh의 `material.color`를 상태 색상으로 변경

## Mixin

- **MeshStateMixin** 단독

## colorMap

| status | hex |
|--------|-----|
| normal | `0x34d399` |
| warning | `0xfbbf24` |
| error | `0xf87171` |
| offline | `0x6b7280` |

## customEvents

없음.

## 커스텀 메서드

없음.

## 구독

| topic | handler |
|-------|---------|
| `equipmentStatus` | `this.meshState.renderData` |
