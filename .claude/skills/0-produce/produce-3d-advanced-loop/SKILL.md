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

### Phase 1.5. 기존 변형과의 패턴 대조 (Commit 직전 필수)

Phase 1 생산이 끝나면 **커밋 직전에** 아래 체크리스트로 기존 Advanced 변형과의 일관성을 검증한다. 이 단계를 생략하면 사소한 규약 drift가 commit 이후 별도 refactor 커밋(IIFE 제거, destroy 동기화, 축 오인, preview 누락 등)으로 이어진다.

> 대표 사례 — `meshesArea/STATCOM_MMC/Advanced/pipeFlow`는 초기 커밋 이후 IIFE 제거·destroy 규약 동기화·preview destroy 누락·UV 축 u→v 교체·슬라이더 콜백 축 불일치 총 5건의 후행 refactor 커밋이 필요했다. Phase 1.5를 수행했다면 초기 커밋에서 모두 흡수 가능했다.

#### 1. 비교 대상 선정

- **동일 컨테이너 타입**(개별 vs `meshesArea/*`) 중 **가장 가까운 완료 변형** 1개를 기준 파일로 선정
  - 신규가 `meshesArea/X/Advanced/highlight` → 기준: `meshesArea/area_01/Advanced/highlight`
  - 신규가 커스텀 메서드(`this.xxx` 네임스페이스)를 포함 → 기준에 `Mixins/MeshStateMixin.js`의 destroy 패턴 추가 대조
- 신규 커스텀 메서드에 RAF·리소스 Wrap 설정·텍스처 mutation이 있다면 기준 파일은 **최근 완료된 유사 커스텀 변형**(예: `STATCOM_MMC/Advanced/pipeFlow`)까지 포함

#### 2. 대조 체크리스트

| # | 항목 | 관례 |
|---|------|------|
| 1 | **register.js 평탄 작성** | 저장소 전체 register.js는 top-level 평탄 작성이다. IIFE·수동 클로저로 감싸지 않는다(인스턴스마다 새 실행 컨텍스트에서 평가되므로 불필요). |
| 2 | **인스턴스 네임스페이스 self-null** | `this.xxx.destroy()` 내부에서 `this.xxx = null`까지 스스로 수행한다 (MeshStateMixin.destroy 패턴 — `Mixins/MeshStateMixin.js:115`). |
| 3 | **beforeDestroy.js는 호출만** | `this.xxx?.destroy()` 호출만 남기고 null 할당은 생략한다 (destroy가 self-null 하므로 중복 금지). |
| 4 | **preview 내부 attach 함수 destroy 일치** | preview의 `attachXxx` 내부 destroy 콜백도 register.js와 동일 규약(`inst.xxx = null` 포함)을 따른다. "register.js와 동일 로직" 주석이 있다면 실제 구현도 동일해야 한다. |
| 5 | **커스텀 메서드 시그니처 일관성** | 기존 유사 커스텀(`pipeFlow` 등) 및 Mixin API와 동사·인자 형태가 일관된가 (`start/stop/setSpeed(meshName, {u,v})/getMeshNames/destroy`). |
| 6 | **UI ↔ API 인자 축 일치** | preview 슬라이더/버튼이 변경하는 축(u/v·x/y·속도/시간)과 API 호출 인자가 일치한다. 축 불일치는 "0으로 맞춰도 멈추지 않음" 류 버그의 주 원인. |
| 7 | **기본값의 시각적 관찰 가능성** | 실제 텍스처/모델 특성(그라디언트 방향, 반복성, 클립 존재 여부 등)에서 기본값이 화면에 관찰 가능한가. 관찰 불가하면 기본값을 조정하거나 근거를 CLAUDE.md에 명시. |
| 8 | **manifest·ADVANCED_QUEUE·컴포넌트 루트 CLAUDE.md 3중 등록** | 세 곳 모두에 변형이 기재되어 있고 spec/preview 경로가 실제 파일과 일치. |

#### 3. 실패 처리

항목 중 하나라도 drift가 있으면 **커밋 이전**에 정정한다. 커밋 이후 수정은 별도 refactor 커밋으로 git log를 늘리고, 문서의 "기존 변형과 동일" 주장을 사후 거짓으로 만든다.

#### 4. 신규 커스텀 메서드 추가 시

추가로 `ADVANCED_QUEUE.md`의 **"커스텀 메서드 vs 신규 Mixin 판단 규칙"** 섹션에 따라 커스텀/Mixin 선택이 적절한지 재확인한다. 2번째 컴포넌트에서 동일 기법이 요청될 경우의 승격 시나리오를 컴포넌트 CLAUDE.md에 한 줄 메모해두면 미래 혼선을 줄일 수 있다.

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
