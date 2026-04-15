---
name: produce-3d-standard-loop
description: 3D 컴포넌트의 Standard 변형(01 status)을 PRODUCTION_QUEUE.md 순서대로 순차 생산합니다. 한 사이클에 하나의 장비를 생산하고, /compact 후 "계속"으로 다음 장비를 생산합니다.
---

# 3D Standard 컴포넌트 순차 생산

## 목표

DesignComponentSystem/Components/3D_Components 아래의 3D 컴포넌트 **Standard 변형(01 status)** 을 PRODUCTION_QUEUE.md 순서대로 생산한다.
한 사이클에 하나의 장비를 생산하고, 사용자가 `/compact` 후 "계속"을 입력하면 다음 장비를 생산한다.

> **Advanced 변형(02~08)은 `produce-3d-advanced-loop`을 사용한다.** 이 루프는 "기존 완료" 컬럼에 01이 없는 신규 장비만 대상으로 한다.

---

## 2D 루프와의 차이

| 측면 | 2D | 3D |
|------|-----|-----|
| 대상 결정 | 알파벳 자동 순회 | **PRODUCTION_QUEUE.md 명시적 대기열** |
| 변형 기반 | CSS 페르소나 | **Mixin 조합** (변형마다 register.js가 다름) |
| 모델 의존 | 없음 | GLTF 모델 (없을 수 있음) |
| 개발 스킬 | create-2d-component | **create-3d-component / create-3d-container-component** |

---

## 사이클 절차

### Phase 0. 다음 대상 파악

1. PRODUCTION_QUEUE.md 확인:
   ```
   경로: RNBT_architecture/DesignComponentSystem/Components/3D_Components/PRODUCTION_QUEUE.md
   ```

2. "기존(완료)" 컬럼에 01이 포함되지 않고 상태가 "대기"인 첫 번째 항목 = 다음 대상
   - 현재 큐의 모든 장비(BATT, Chiller, Panel, UPS, tempHumiTH2B, thermohygrostat, gltf_container)는 01이 이미 완료되어 있음
   - 신규 장비 추가 시에만 이 루프가 작동

3. Standard 폴더 존재 여부 확인:
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/3D_Components/{장비명}/Standard/ 2>/dev/null
   ```

4. **사용자에게 보고**: "다음 대상: {장비명}, 유형: {개별/컨테이너}, Standard(01 status) 생산"

   대기 항목이 없으면: "Standard(01)가 누락된 장비가 없습니다. Advanced 변형은 `produce-3d-advanced-loop`을 사용하세요."

---

### Phase 1. produce-component 실행

`produce-component` SKILL.md의 Step 1~5를 따른다.

**유형별 개발 스킬 선택**:

| 유형 | 호출 스킬 |
|------|----------|
| 개별 (1 GLTF = 1 Mesh) | `create-3d-component` |
| 컨테이너 (1 GLTF = N Mesh) | `create-3d-container-component` |

**출력 경로**: `Components/3D_Components/{장비명}/Standard/`
**Mixin**: MeshState (01 status 변형만)

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
feat: 3D_Components/{장비명} 컴포넌트 생산 — {한줄 설명}
```

---

### Phase 3. PRODUCTION_QUEUE.md 업데이트 + 사이클 종료

1. PRODUCTION_QUEUE.md에서 해당 장비의 "기존(완료)" 컬럼에 01 추가. "추가 대상"에 Advanced가 남아 있으면 상태는 "대기" 유지, 남은 항목이 없으면 "완료"로 변경
2. 사용자에게 안내:

```
{장비명} Standard(01) 생산 완료.
다음 대상: {다음 장비명} ({유형}) — Standard(01)

`/compact` 실행 후 "계속"을 입력해주세요.
```

---

## PRODUCTION_QUEUE.md 형식

```markdown
# 3D 컴포넌트 생산 대기열

| 순번 | 장비명 | 유형 | 변형 | 모델 | 상태 |
|------|--------|------|------|------|------|
| 1 | BATT | 개별 | 01,02,03 | 준비 | 완료 |
| 2 | gltf_container | 컨테이너 | 01,02,03 | 준비 | 완료 |
| 3 | AHU | 개별 | 01,04,05 | 미준비 | 대기 |
| 4 | Transformer | 개별 | 01,02 | 미준비 | 대기 |
| ... | ... | ... | ... | ... | ... |
```

**열 설명**:
- **유형**: 개별 (1 GLTF = 1 Mesh) / 컨테이너 (1 GLTF = N Mesh)
- **변형**: CLAUDE.md에 정의할 변형 번호 목록
- **모델**: 준비 / 미준비 (미준비 시 [MODEL_READY] placeholder 사용)
- **상태**: 대기 / 진행 중 / 완료

---

## 세트 구분

| 세트 | 설명 |
|------|------|
| **Standard** | 필수. 모든 3D 컴포넌트의 기본 (MeshState만) |
| **Advanced** | 선택. 필요에 따라 조합하는 확장 기능 |

## 변형 번호 참조

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

## 디자인 페르소나 & CSS 조달 규칙 (팝업 등 HTML/CSS 생성 시)

3D Standard 변형 자체는 CSS 페르소나 기반이 아니지만, **팝업(`03_status_popup` 등 ShadowPopup) 또는 `publishCode`에서 페르소나 4종을 따르는 HTML/CSS를 생성하는 경우**에는 `produce-component/SKILL.md` **Step 5-1 "디자인 페르소나 & CSS 조달 규칙"**의 원칙을 그대로 따른다.

---

## 참조 문서 (매 사이클 읽기)

- `produce-component` SKILL: `/.claude/skills/0-produce/produce-component/SKILL.md`
- `create-3d-component` SKILL: `/.claude/skills/2-component/create-3d-component/SKILL.md`
- `create-3d-container-component` SKILL: `/.claude/skills/2-component/create-3d-container-component/SKILL.md`
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
- CODING_STYLE: `/.claude/guides/CODING_STYLE.md`
- Mixin 카탈로그: `/RNBT_architecture/DesignComponentSystem/Mixins/README.md`
- 시스템 설계: `/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md`
