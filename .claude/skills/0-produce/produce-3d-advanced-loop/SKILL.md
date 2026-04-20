---
name: produce-3d-advanced-loop
description: 3D 컴포넌트의 Advanced 변형을 ADVANCED_QUEUE.md 순서대로 순차 생산합니다. 프리셋 이름 또는 자유 Mixin 조합을 지원하며, 한 사이클에 하나의 변형을 생산하고, /compact 후 "계속"으로 다음 변형을 생산합니다.
---

# 3D Advanced 컴포넌트 순차 생산

## 목표

DesignComponentSystem/Components/3D_Components 아래의 3D 컴포넌트 Advanced 변형을 `ADVANCED_QUEUE.md` 순서대로 생산한다.
한 사이클에 하나의 Advanced 변형을 생산하고, 사용자가 `/compact` 후 "계속"을 입력하면 다음 변형으로 진행한다.

**프리셋 이름**(예: `highlight`, `camera_highlight`) 또는 **자유 Mixin 조합**(예: `highlightAnimation: MeshState+MeshHighlight+Animation`) 양쪽을 지원한다.

---

## 2D Advanced 루프와의 대칭

| 측면 | 2D (produce-advanced-loop) | 3D (이 문서) |
|------|---------------------------|-------------|
| 큐 파일 | Components/ADVANCED_QUEUE.md | Components/3D_Components/ADVANCED_QUEUE.md |
| 대상 결정 | 큐에서 "대기" 첫 항목 | 동일 |
| 변형 성격 | 컴포넌트별 고유 | 프리셋 + 자유 조합 |
| 분리 기준 | register.js 차이 | 동일 — Mixin 조합 차이 또는 커스텀 메서드 |
| 기획 스킬 | plan-advanced-queue | plan-3d-advanced-queue |
| 개발 스킬 | create-2d-component | create-3d-component / create-3d-container-component |

---

### Standard 선행 필터

Standard 폴더가 없는 컴포넌트는 Advanced 대상에서 제외하고 `produce-3d-standard-loop` 선행을 안내한다. Standard 없이 Advanced를 생산하면 MeshState 기반 분리 정당성을 검증할 수 없기 때문이다.

> **`{컴포넌트경로}`** = 개별이면 `{장비명}`, 컨테이너면 `meshesArea/{컨테이너명}`. 3D Standard Phase 0 규칙(`_shared/phase0-3d.md`)과 동일 표기.

---

## 사이클 절차

### Phase 0. 다음 대상 파악

1. ADVANCED_QUEUE.md 확인:
   ```
   경로: RNBT_architecture/DesignComponentSystem/Components/3D_Components/ADVANCED_QUEUE.md
   ```

2. 상태가 "대기"인 첫 번째 항목 = 다음 대상
   - 예(개별): `Panel | 개별 | highlight | MeshState + MeshHighlight | 대기` → 대상: `Panel/Advanced/highlight`
   - 예(컨테이너): `meshesArea/area_01 | 컨테이너 | clipping | MeshState + ClippingPlaneMixin | 대기` → 대상: `meshesArea/area_01/Advanced/clipping`

3. Standard 선행 필터: 해당 컴포넌트의 Standard 폴더 존재 여부 확인
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/3D_Components/{컴포넌트경로}/Standard/scripts/register.js 2>/dev/null
   ```
   없으면 해당 항목을 건너뛰고 `produce-3d-standard-loop` 선행 안내.

4. Advanced 폴더 존재 여부 확인:
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/3D_Components/{컴포넌트경로}/Advanced/{변형이름}/ 2>/dev/null
   ```

5. **사용자에게 보고**: "다음 대상: {컴포넌트경로}/Advanced/{변형이름} — {설명}"

   큐가 비어있거나 "대기" 항목이 없으면: "ADVANCED_QUEUE.md에 대기 중인 항목이 없습니다. 신규 Advanced 변형이 필요하면 `plan-3d-advanced-queue`로 먼저 등록해주세요."

---

### Phase 1. produce-component 실행

`produce-component` SKILL.md의 Step 1~5를 따른다.

**유형별 개발 스킬 선택**:

| 유형 | 호출 스킬 |
|------|----------|
| 개별 (1 GLTF = 1 Mesh) | `create-3d-component` |
| 컨테이너 (1 GLTF = N Mesh) | `create-3d-container-component` |

**출력 경로**: `Components/3D_Components/{컴포넌트경로}/Advanced/{변형이름}/`

**Standard와의 분리 정당성 확인**: Advanced 변형은 Standard와 명백히 다른 register.js(Mixin 조합, 커스텀 메서드 중 하나 이상)를 가져야 한다. Step 2 기능 분석 시 이를 CLAUDE.md에 명시한다.

**중요 — 승인 없이 진행하지 않는다:**
- Step 2 기능 분석 결과 → 사용자 승인
- Step 4 CLAUDE.md → 사용자 승인

**승인 축약 모드**: 사용자가 "ㅇ", "응", "확인", "ㄱ" 등 짧은 긍정 응답을 하면 승인으로 간주하고 다음으로 진행한다.

### 모델 없이 작성하는 경우

모델이 없으면 [MODEL_READY] placeholder를 사용한다.

```javascript
// TODO: [MODEL_READY] 모델의 실제 meshName으로 교체
const MESH_NAME = '장비명';
```

모델 무관 파일은 100% 작성 가능:
- scripts/register.js (meshName만 placeholder)
- scripts/beforeDestroy.js
- page/loaded.js, before_load.js, before_unload.js

모델 도착 시 `grep -r "MODEL_READY"` 로 전수 교체.

---

### Phase 2. 커밋

생산 완료 후 커밋한다.

```
feat: 3D_Components/{컴포넌트경로}/Advanced/{변형명} 컴포넌트 생산 — {한줄 설명}
```

---

### Phase 3. ADVANCED_QUEUE.md 업데이트 + 사이클 종료

1. ADVANCED_QUEUE.md에서 해당 항목의 상태를 "완료"로 변경
2. 사용자에게 안내:

```
{컴포넌트경로}/Advanced/{변형이름} 생산 완료.
다음 대상: {다음 컴포넌트경로}/Advanced/{다음 변형}

`/compact` 실행 후 "계속"을 입력해주세요.
```

---

## 변형 프리셋 (참조용)

자주 쓰이는 Mixin 조합에 이름을 붙여둔 프리셋이며 **고정 목록이 아니다**. 필요 시 자유 조합을 직접 기재한다.

| 프리셋 이름 | Mixin 조합 |
|------------|-----------|
| camera | MeshState + CameraFocus |
| popup | MeshState + 3DShadowPopup |
| highlight | MeshState + MeshHighlight |
| camera_highlight | MeshState + CameraFocus + MeshHighlight |
| visibility | MeshState + MeshVisibility |
| animation | MeshState + AnimationMixin |
| clipping | MeshState + ClippingPlaneMixin |

> 자유 조합 예시: `highlightAnimation: MeshState+MeshHighlight+Animation`, `dataHud: MeshState+FieldRender`(컨테이너용)
> 실제 Mixin 조합 결정은 produce-component Step 3에서 확정한다.

---

## 디자인 페르소나 & CSS 조달 규칙 (팝업 등 HTML/CSS 생성 시)

3D Advanced 변형 자체는 Mixin 조합 기반이지만, **팝업(ShadowPopup)이나 `publishCode`로 페르소나 4종(`01_refined` ~ `04_operational`)을 따르는 HTML/CSS를 생성하는 경우**에는 `produce-component/SKILL.md` **Step 5-1 "디자인 페르소나 & CSS 조달 규칙"**의 원칙을 그대로 따른다.

---

## 참조 문서 (매 사이클 읽기)

- `produce-component` SKILL: `/.claude/skills/0-produce/produce-component/SKILL.md`
- `create-3d-component` SKILL: `/.claude/skills/2-component/create-3d-component/SKILL.md`
- `create-3d-container-component` SKILL: `/.claude/skills/2-component/create-3d-container-component/SKILL.md`
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
- CODING_STYLE: `/.claude/guides/CODING_STYLE.md`
- Mixin 카탈로그: `/RNBT_architecture/DesignComponentSystem/Mixins/README.md`
- 시스템 설계: `/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md`
