---
name: produce-3d-advanced-loop
description: 3D 컴포넌트의 Advanced 변형(02~08)을 PRODUCTION_QUEUE.md 순서대로 순차 생산합니다. 한 사이클에 하나의 장비를 생산하고, /compact 후 "계속"으로 다음 장비를 생산합니다.
---

# 3D Advanced 컴포넌트 순차 생산

## 목표

DesignComponentSystem/Components/3D_Components 아래의 3D 컴포넌트 Advanced 변형(02 camera, 03 popup, 04 highlight, 05 camera_highlight, 06 visibility, 07 animation, 08 clipping)을 PRODUCTION_QUEUE.md 순서대로 생산한다.
한 사이클에 하나의 장비에 대해 "추가 대상" 컬럼에 지정된 Advanced 변형들을 생산하고, 사용자가 `/compact` 후 "계속"을 입력하면 다음 장비로 진행한다.

---

## Standard 루프와의 차이

| 측면 | Standard 루프 | Advanced 루프 (이 문서) |
|------|--------------|------------------------|
| 대상 변형 | 01 (status) | 02~08 (camera, popup, highlight, ...) |
| QUEUE 컬럼 | "기존(완료)"의 01이 없거나 | "추가 대상"에 02~가 명시됨 |
| 폴더 출력 | `Standard/` | `Advanced/<변형이름>/` |
| Mixin | MeshState 단독 | MeshState + 추가 Mixin 조합 |

Standard/Advanced 변형 카탈로그는 PRODUCTION_QUEUE.md의 "변형 카탈로그" 섹션을 따른다.

---

## 사이클 절차

### Phase 0. 다음 대상 파악

1. PRODUCTION_QUEUE.md 확인:
   ```
   경로: RNBT_architecture/DesignComponentSystem/Components/3D_Components/PRODUCTION_QUEUE.md
   ```

2. "추가 대상" 컬럼에 값이 있고 상태가 "대기"인 첫 번째 항목 = 다음 대상
   - 예: `BATT | 개별 | 01,02,03 | 04,05 | 대기` → 대상: BATT, 추가 변형 04,05

3. 각 추가 변형의 Advanced 폴더 존재 여부 확인:
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/3D_Components/{장비명}/Advanced/ 2>/dev/null
   ```

4. **사용자에게 보고**: "다음 대상: {장비명}, 유형: {개별/컨테이너}, 추가 Advanced 변형: {04_highlight, 05_camera_highlight, ...}"

---

### Phase 1. produce-component 실행

`produce-component` SKILL.md의 Step 1~5를 따른다.

**유형별 개발 스킬 선택**:

| 유형 | 호출 스킬 |
|------|----------|
| 개별 (1 GLTF = 1 Mesh) | `create-3d-component` |
| 컨테이너 (1 GLTF = N Mesh) | `create-3d-container-component` |

**출력 경로**: `Components/3D_Components/{장비명}/Advanced/{변형이름}/`

**중요 — 승인 없이 진행하지 않는다:**
- Step 2 기능 분석 결과 → 사용자 승인
- Step 4 CLAUDE.md → 사용자 승인

**승인 축약 모드**: 사용자가 "ㅇ", "응", "확인", "ㄱ" 등 짧은 긍정 응답을 하면 승인으로 간주하고 다음으로 진행한다.

### 모델 없이 작성하는 경우

모델이 "미준비" 상태이면 [MODEL_READY] placeholder를 사용한다.

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
feat: 3D_Components/{장비명}/Advanced/{변형명} 컴포넌트 생산 — {한줄 설명}
```

여러 Advanced 변형을 한 사이클에 생산한 경우:
```
feat: 3D_Components/{장비명} Advanced 변형 생산 — {04_highlight, 05_camera_highlight}
```

---

### Phase 3. PRODUCTION_QUEUE.md 업데이트 + 사이클 종료

1. PRODUCTION_QUEUE.md에서 해당 장비의 "기존(완료)" 컬럼에 새 변형 추가, "추가 대상" 컬럼에서 제거, 모두 소진되면 상태를 "완료"로 변경
2. 사용자에게 안내:

```
{장비명} Advanced 생산 완료 (추가: {04, 05}).
다음 대상: {다음 장비명} ({유형}) — {남은 추가 변형}

`/compact` 실행 후 "계속"을 입력해주세요.
```

---

## 변형 카탈로그 (참조용)

| 번호 | 이름 | 세트 | Mixin 조합 |
|------|------|------|-----------|
| 01 | status | Standard | MeshState |
| 02 | camera | Advanced | MeshState + CameraFocus |
| 03 | popup | Advanced | MeshState + 3DShadowPopup |
| 04 | highlight | Advanced | MeshState + MeshHighlight |
| 05 | camera_highlight | Advanced | MeshState + CameraFocus + MeshHighlight |
| 06 | visibility | Advanced | MeshState + MeshVisibility |
| 07 | animation | Advanced | MeshState + AnimationMixin |
| 08 | clipping | Advanced | MeshState + ClippingPlaneMixin |

> 기존 생산된 01~03은 `01_status`, `02_status_camera`, `03_status_popup` 폴더명을 유지한다.
> 신규 생산분(04~)부터 새 명명 규칙을 적용한다.
> 실제 변형은 produce-component Step 3에서 결정한다.

---

## 참조 문서 (매 사이클 읽기)

- `produce-component` SKILL: `/.claude/skills/0-produce/produce-component/SKILL.md`
- `create-3d-component` SKILL: `/.claude/skills/2-component/create-3d-component/SKILL.md`
- `create-3d-container-component` SKILL: `/.claude/skills/2-component/create-3d-container-component/SKILL.md`
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
- CODING_STYLE: `/.claude/guides/CODING_STYLE.md`
- Mixin 카탈로그: `/RNBT_architecture/DesignComponentSystem/Mixins/README.md`
- 시스템 설계: `/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md`
