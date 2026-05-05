# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 2 Mesh: automaticDoor, doorGlass_A) |
| 기본 Mixin | MeshStateMixin |

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/doorOpenClose | 완료 |

> **자동문 도메인 1차 등장 (#55)** — 본 변형은 `doorOpenClose` 도메인의 1차 등장. 4-state machine(closed/opening/open/closing) + easeInOutQuad 슬라이드 + 출입 거부 시 프레임 emissive sine 펄스 결합. SpeedGate 등 후속 출입 통제 컴포넌트가 등장하면 `DoorOpenCloseMixin` 답습 가능성 — 단 1차 등장 단계이므로 임계점 미도달 → 단일 컴포넌트 전용 커스텀 메서드(`this.doorOpenClose`) 채택. 2P 단일 패널 한계(GLTF에 `doorGlass_B` 없음)로 단일 패널 슬라이드 한정.
