# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh) |
| 기본 Mixin | MeshStateMixin |

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/cardAccessFeedback | 완료 |

> **카드 리더 도메인 1차 등장 (#61)** — 본 변형(`Advanced/cardAccessFeedback`)은 카드 태깅 피드백 도메인의 1차 등장. 3-mode LED(granted/denied/waiting) 합성 + tagDenied 시 본체 emissive 적색 sine 펄스 + `@cardAccessSound` 이벤트 emit (페이지 사운드 위임) + setTimeout 기반 auto-revert 결합. SpeedGate(#58~#60 대기) 등 후속 출입 통제 컴포넌트가 등장하면 `CardAccessFeedbackMixin` 답습 가능성 — 단 1차 등장 단계이므로 임계점 미도달 → 단일 컴포넌트 전용 커스텀 메서드(`this.cardAccessFeedback`) 채택. mesh local bbox가 매우 작으므로(±0.00035 × ±0.000771 × ±0.000185, B3F_UPS의 ~1/27) `_ledOffset/_ledRadius/_ledSpacing`을 비례 scale-down 보정.
>
> **MultiLedStateMixin 임계점 3개 도달 (#53 UPS + #54 B3F_UPS + #61 본 변형)** — LED 합성 부분(setMode/setLedXxx/getMode/enable/disable/destroy + LED 옵션값) 시그니처가 3개 컴포넌트에서 동일. 사용자가 메인 외부에서 `create-mixin-spec` → `implement-mixin` 호출로 즉시 승격 검토 강력 권장 (모델 bbox 비례 LED 옵션 scale-down 정책 그대로 흡수). 본 변형은 LED 외에 본체 emissive 펄스 + `tagXxx` 이벤트 emit + auto-revert가 추가되어 시그니처가 #53/#54의 `upsStatus`와 정확히 일치하지는 않음 — LED 합성 부분만 Mixin으로 분리하고 펄스+이벤트+auto-revert는 컴포넌트별 커스텀 메서드로 유지하는 분리 정책이 자연스럽다.
