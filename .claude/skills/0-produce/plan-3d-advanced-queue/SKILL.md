---
name: plan-3d-advanced-queue
description: 3D 컴포넌트 Advanced 변형 후보를 발굴하여 ADVANCED_QUEUE.md에 등록합니다. 장비 특성·BMS/SCADA 패턴 기반으로 기능을 추론하고, Standard와의 분리 정당성을 검증한 후 사용자 승인을 거쳐 큐에 추가합니다. 생산은 담당하지 않습니다.
---

# 3D Advanced 변형 기획 — ADVANCED_QUEUE.md 등록

## 목표

`Components/3D_Components/` 아래의 Standard가 완료된 컴포넌트를 읽고, 장비 특성 및 업계 BMS/SCADA 패턴에서 Advanced 변형 후보를 발굴하여 `ADVANCED_QUEUE.md`에 "대기" 항목으로 등록한다.

**이 스킬은 큐 등록까지만 담당한다.** 생산은 `produce-3d-advanced-loop`이 처리한다.

> **`{컴포넌트경로}`** = 개별이면 `{장비명}` (예: `BATT`), 컨테이너면 `meshesArea/{컨테이너명}` (예: `meshesArea/area_01`). 3D Standard Phase 0 규칙(`_shared/phase0-3d.md`)과 동일 표기.

### 스킬의 1차 목적: 기능 발굴 (Mixin 조합이 아님)

이 스킬의 목적은 **컴포넌트에 현실적으로 필요한 기능을 발굴하는 것**이다. Mixin 조합은 구현 수단의 하나일 뿐이며 사고의 출발점이 아니다.

- 먼저 "이 장비에 어떤 기능이 필요한가?"를 묻는다.
- 필요한 기능이 기존 Mixin 조합으로 표현 가능하면 → 프리셋 또는 자유 조합으로 기재
- 기존 Mixin으로 표현 불가하면 → **커스텀 메서드** 또는 **신규 Mixin 필요**로 기재 (생산 시 `create-mixin-spec` 선행)

기존 Mixin 목록을 필터로 써서 후보를 한정하지 않는다. Mixin이 없는 기능도 빠짐없이 포함한다.

---

## 2D plan-advanced-queue와의 대칭

| 측면 | 2D (plan-advanced-queue) | 3D (이 문서) |
|------|--------------------------|-------------|
| 후보 소스 | MD3 명세 + 업계 UI 패턴 | 장비 특성 + BMS/SCADA/설비관리 패턴 |
| 탐색 질문 | "이 UI 컴포넌트에 어떤 확장 변형이 의미있는가?" | "이 장비에 어떤 인터랙션이 현실적으로 필요한가?" |
| 분리 기준 | register.js 차이 (Mixin/토픽/메서드/이벤트) | 동일 — Mixin 조합 차이 또는 커스텀 메서드 추가 |
| 큐 파일 | Components/ADVANCED_QUEUE.md | Components/3D_Components/ADVANCED_QUEUE.md |
| 프리셋 | 없음 (컴포넌트별 고유) | 있음 (camera, highlight 등 공통 프리셋 + 자유 조합) |

---

## 입력 모드

| 인수 | 의미 |
|------|------|
| (없음) | 모든 3D 컴포넌트(개별 + 컨테이너)를 일괄 탐색 |
| 컴포넌트경로 (예: `Panel`, `meshesArea/area_01`) | 해당 컴포넌트만 탐색 |

사용자가 컴포넌트경로를 지정하지 않으면 일괄 모드로 진행한다.

---

## 절차

### Step 1. 현황 수집

1. ADVANCED_QUEUE.md 전체 읽기 — 기존 등록 항목(대기/진행 중/완료) 목록화
   ```
   경로: RNBT_architecture/DesignComponentSystem/Components/3D_Components/ADVANCED_QUEUE.md
   ```

2. 대상 컴포넌트별로 다음 확인:
   ```
   Components/3D_Components/{컴포넌트경로}/Standard/           (존재 여부 — 필터 기준)
   Components/3D_Components/{컴포넌트경로}/Standard/CLAUDE.md  (있으면)
   Components/3D_Components/{컴포넌트경로}/Advanced/           (있으면 하위 변형 이름 수집)
   ```

   대상 컴포넌트 목록은 3D Phase 0 규칙(`_shared/phase0-3d.md`)의 순회 스크립트로 수집한다. 개별(예: `BATT`) / 컨테이너(예: `meshesArea/area_01`) 모두 동일 변수로 처리.

**Standard 선행 필터** (중요):
- **Standard 폴더가 없는 컴포넌트는 Advanced 후보 발굴 대상에서 제외한다.**
- Standard 없이 Advanced를 기획하면 MeshState 기반 분리 정당성을 검증할 수 없기 때문.
- 제외된 컴포넌트는 Step 6에서 "Standard 선행 필요 — `produce-3d-standard-loop`로 Standard 생산 후 재실행 권장" 안내와 함께 별도 보고한다.

**제외 대상**:
- **Standard 폴더가 존재하지 않는 컴포넌트** (위 필터)
- 이미 `Advanced/{변형}/` 폴더가 존재하는 변형
- 이미 큐에 "대기"/"진행 중"/"완료"로 등록된 변형

---

### Step 2. 후보 탐색 (Agent 위임)

Explore 에이전트에 위임하여 Advanced 후보를 발굴한다.

**사고 순서** (반드시 이 순서로):

**① 기능 발굴** — "이 장비에 현실적으로 필요한 기능은 무엇인가?"
- 장비 특성, 업계 BMS/SCADA/설비관리 인터랙션 패턴, 컨테이너 공간 분석 요구 등에서 도출
- 이 단계에서는 **Mixin 존재 여부를 고려하지 않는다.** 기능이 먼저, 구현 수단은 그 다음.

**② 구현 수단 매핑** — 각 기능을 다음 중 하나로 분류:
- **프리셋** (camera, popup, highlight, camera_highlight, visibility, animation, clipping) — 해당하면 프리셋명 사용
- **자유 조합** — 여러 기존 Mixin 조합이 필요하면 자유 조합으로 기재 (예: `highlightAnimation: MeshState+MeshHighlight+Animation`)
- **커스텀 메서드** — 기존 Mixin으로 표현 불가, 컴포넌트 내부 메서드로 해결
- **신규 Mixin 필요** — 공통 재사용 가치가 있는 새 기능, 생산 시 `create-mixin-spec` 선행

**위임 프롬프트 구성 요소**:
- 대상 컴포넌트 목록(개별 + 컨테이너)과 각 컴포넌트의 Standard CLAUDE.md 내용
- 제외 목록 (Step 1에서 수집한 기존 변형)
- 컴포넌트 특성에서 추론 가능한 기능 예시 (예: Chiller는 가동/정지 애니메이션, Panel은 전력 계측 데이터 표시, 컨테이너는 단면 분석/구역 강조, 센서는 실시간 측정값 HUD)
- 업계 BMS/SCADA/설비관리 시스템의 장비 인터랙션 패턴
- **Standard와 register.js 수준에서 다른 점이 있는 후보만 수집할 것** (Mixin 조합 차이 또는 커스텀 메서드 추가, 또는 신규 Mixin 필요)

**에이전트 반환 형식**: 각 후보에 대해
- 컴포넌트경로
- 유형 (개별/컨테이너)
- 변형 이름 (프리셋명 또는 camelCase 자유 조합명/기능명)
- **기능 설명** (무엇을 하는가)
- **구현 수단** (프리셋 / 자유 조합 / 커스텀 메서드 / 신규 Mixin 필요 중 하나, 해당 Mixin 조합 또는 메서드 개요 명시)
- Standard와의 차이 (Mixin 조합 차이 / 커스텀 메서드 추가 / 신규 Mixin 도입)

**WebFetch 실패 시**: 학습 데이터 + WebSearch로 대체하고, 결과를 Step 4에서 사용자에게 검증받는다.

---

### Step 3. 분리 정당성 검증

각 후보를 다음 기준으로 평가한다:

| 질문 | 결과 |
|------|------|
| register.js가 Standard와 동일한가? (Mixin 조합이 같고 커스텀 메서드도 없음) | → **제외** |
| Mixin 조합이 다르거나, 커스텀 메서드가 추가되거나, 신규 Mixin이 필요한가? (하나 이상 해당) | → 후보 유지 |

**"Mixin 없음" 자체는 탈락 사유가 아니다.** 커스텀 메서드로 해결하는 후보, 신규 Mixin 개발이 필요한 후보도 동등하게 통과시킨다. 분리의 핵심은 "register.js가 Standard와 다른가" 하나다.

근거가 모호한 후보는 제외한다. "확실히 다른 register.js가 필요한 경우"만 통과시킨다.

---

### Step 4. 사용자 검토 요청

승인 후보를 표로 제시한다. **기능 설명과 구현 수단을 분리**하여 기능 우선으로 읽히게 한다:

```
| # | 컴포넌트경로 | 유형 | 변형 이름 | 기능 설명 | 구현 수단 | 분리 근거 |
|---|-------------|------|----------|----------|----------|----------|
| 1 | Panel | 개별 | highlight | 경고 시 메시 색상 강조 | 프리셋: MeshState + MeshHighlight | Mixin 추가 |
| 2 | meshesArea/area_01 | 컨테이너 | clipping | 단면 분석 뷰 | 프리셋: MeshState + ClippingPlaneMixin | Mixin 추가 |
| 3 | Generator | 개별 | rpmGauge | 회전수 실시간 3D 표시 | 커스텀 메서드 (기존 Mixin 불가) | 커스텀 메서드 추가 |
| 4 | Pump | 개별 | flowTrail | 유체 흐름 경로 시각화 | 신규 Mixin 필요 (FlowTrailMixin) | 신규 Mixin + 커스텀 설정 |
```

사용자에게 다음 중 선택받는다:
- 전체 승인 / 특정 번호만 승인 / 전체 거부
- 변형 이름/설명/Mixin 수정 요청이 있으면 반영한다

**승인 축약 모드**: "ㅇ", "응", "확인", "ㄱ" = 전체 승인. 번호 나열(예: "1,3")은 해당 번호만 승인.

---

### Step 5. 큐 등록

승인된 항목만 ADVANCED_QUEUE.md 생산 대기열 표에 추가한다:

- 순번: 기존 최대 번호 + 1부터 증가
- 상태: `대기`
- 기존 항목은 건드리지 않는다

---

### Step 6. 완료 보고

```
{N}개 항목을 ADVANCED_QUEUE.md에 등록했습니다.
다음 단계: `/produce-3d-advanced-loop`으로 순차 생산 시작.
```

**Standard 미구현 컴포넌트가 있었던 경우** 별도 섹션으로 함께 보고:

```
Standard 선행 필요 (Advanced 후보 발굴 제외):
- AHU, Transformer, meshesArea/area_02, ...

해당 컴포넌트는 `produce-3d-standard-loop`로 Standard를 먼저 생산한 뒤
`plan-3d-advanced-queue`를 재실행하면 Advanced 후보가 발굴됩니다.
```

---

## 참조 문서

- ADVANCED_QUEUE.md: `/RNBT_architecture/DesignComponentSystem/Components/3D_Components/ADVANCED_QUEUE.md`
- 생산 루프: `/.claude/skills/0-produce/produce-3d-advanced-loop/SKILL.md`
- 2D 기획 스킬 (대칭 참조): `/.claude/skills/0-produce/plan-advanced-queue/SKILL.md`
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
- Mixin 카탈로그: `/RNBT_architecture/DesignComponentSystem/Mixins/README.md`
