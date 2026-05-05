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

#### 2. 대조 체크리스트 (14항목, 3 카테고리)

14개 항목을 **A/B/C 3 카테고리**로 분류한다. 카테고리별 순차 검증이 단일 14행 리스트 스캔보다 누락이 적다 (관심사 단위 chunking).

##### A. 구조 정합성 (1-5) — register.js / preview attach / beforeDestroy 라이프사이클 일치

| # | 항목 | 관례 |
|---|------|------|
| 1 | **register.js 평탄 작성** | 저장소 전체 register.js는 top-level 평탄 작성이다. IIFE·수동 클로저로 감싸지 않는다(인스턴스마다 새 실행 컨텍스트에서 평가되므로 불필요). |
| 2 | **인스턴스 네임스페이스 self-null** | `this.xxx.destroy()` 내부에서 `this.xxx = null`까지 스스로 수행한다 (MeshStateMixin.destroy 패턴 — `Mixins/MeshStateMixin.js:115`). |
| 3 | **beforeDestroy.js는 호출만** | `this.xxx?.destroy()` 호출만 남기고 null 할당은 생략한다 (destroy가 self-null 하므로 중복 금지). |
| 4 | **preview 내부 attach 함수 destroy 일치** | preview의 `attachXxx` 내부 destroy 콜백도 register.js와 동일 규약(`inst.xxx = null` 포함)을 따른다. "register.js와 동일 로직" 주석이 있다면 실제 구현도 동일해야 한다. |
| 5 | **커스텀 메서드 시그니처 일관성** | 기존 유사 커스텀(`pipeFlow` 등) 및 Mixin API와 동사·인자 형태가 일관된가 (`start/stop/setSpeed(meshName, {u,v})/getMeshNames/destroy`). |

##### B. 데이터·등록 정합성 (6-8) — UI/API 축, 기본값 관찰성, 3중 등록

| # | 항목 | 관례 |
|---|------|------|
| 6 | **UI ↔ API 인자 축 일치** | preview 슬라이더/버튼이 변경하는 축(u/v·x/y·속도/시간)과 API 호출 인자가 일치한다. 축 불일치는 "0으로 맞춰도 멈추지 않음" 류 버그의 주 원인. |
| 7 | **기본값의 시각적 관찰 가능성** | 실제 텍스처/모델 특성(그라디언트 방향, 반복성, 클립 존재 여부 등)에서 기본값이 화면에 관찰 가능한가. 관찰 불가하면 기본값을 조정하거나 근거를 CLAUDE.md에 명시. |
| 8 | **manifest·ADVANCED_QUEUE·컴포넌트 루트 CLAUDE.md 3중 등록** | 세 곳 모두에 변형이 기재되어 있고 spec/preview 경로가 실제 파일과 일치. |

##### C. Preview 시연 완전성 (9-14) — 경로/외부 API/지속 시연/CSS 색/라벨 의미/도메인 컨텍스트

| # | 항목 | 관례 |
|---|------|------|
| 9 | **preview 상대 경로 깊이 일관성** | preview/01_default.html이 사용하는 모든 `../` 상대 경로(`<script src>` Mixin·preview_runtime / `loader.load()` 모델 경로)가 실제 폴더 깊이와 일치한다. **개별 컴포넌트 Advanced(`X/Advanced/Y/preview`)=6단계 / 컨테이너 Advanced(`meshesArea/X/Advanced/Y/preview`)=7단계**. 직전 사이클이 다른 깊이의 컴포넌트라면 그 패턴을 그대로 복사하지 않도록 자체 깊이를 재계산. 회귀 사례: `statcom_powerFlow`(컨테이너)가 직전 사이클 Marker_*(개별 6단계)를 답습해 6단계로 작성 → GLTF 404 + `applyMeshStateMixin is not defined`. |
| 10 | **preview의 외부 명령형 API 시연 완전성** | register.js가 노출하는 모든 외부 명령형 API(`setXxx/getXxx/show/hide/start/stop/...`)가 preview에서 호출 가능하다 — 버튼·슬라이더·자동 데모 중 하나로 시연. `getXxx`류는 readout으로 표시. 회귀 사례: `OHU103/outdoorUnitPerformance`가 `hide/show`를 register.js에 노출하면서 preview 컨트롤은 누락. |
| 11 | **자동 데모의 지속 시연성** | 자동 데모는 페이지 로드 후 30초 이상 관찰해도 컴포넌트가 노출하는 모든 채널이 시연된다 — 1회 단발 setTimeout은 로드 직후 N초를 놓치면 정적 화면이 됨. setInterval 또는 마지막 단계가 자기 자신을 setTimeout으로 재호출하는 무한 순환을 사용. 회귀 사례: `submoduleDetailZoom`이 0.2s/2.2s/4.2s 단발 데모 후 정지 → 4채널(색상·카메라·가시성·라벨) 직교성을 짧게 보여주고 끝나서 사용자가 기능을 파악하기 어려움. |
| 12 | **preview 데모 버튼 CSS 색 완전성** | preview의 모든 `.demo-btn[data-action="..."]` / `.demo-btn[data-status="..."]` / `.demo-btn[data-mode="..."]` 등 attribute selector 버튼은 CSS에 배경색 분기가 정의되어 있어야 한다. `.demo-btn { color: #fff }`만 있고 배경 미정의 시 OS default(흰 회색)에 흰 글자가 겹쳐 식별 불가. **버튼 추가 시점에 CSS 색 분기 추가를 동시에 수행**, 자율검증 시 `grep -oE 'data-(action\|status\|mode)="[^"]*"'` 결과와 `grep -oE '\.demo-btn\[data-(action\|status\|mode)="[^"]*"\]'` 결과를 비교해 누락 없는지 확인. 회귀 사례: OHU103/outdoorUnitPerformance가 `data-state-action` 색 분기 누락(b3574572에서 보정), Marker_*/emergencyZoneRadius가 `data-action="start/stop"` 누락(같은 회귀 반복), zonalHeatmap이 `data-action="clear"` + `data-status` 4종 누락. |
| 13 | **라이프사이클 토글 버튼 의미 명시화** | `Start/Stop` · `Enable/Disable` · `Show/Hide` 같이 일반 동사로만 라벨링된 라이프사이클 토글 버튼은 컴포넌트마다 정확한 의미가 다르다(예: emergencyZoneRadius Start = sphere 생성 + RAF / OHU103 Start = RPM RAF + HUD RAF / zonalHeatmap Start = 활성 토글 + repaint, **RAF 아님**). 사용자가 라벨만 보고 "무엇을 시작/멈추는지" 알 수 없으면 외부 명령형 API의 시연 가치가 떨어진다. **라벨 자체 명시화**(예: `Start (sphere + RAF)`) **+ `title` 속성 한 문장 hover 안내** **+ demo-hint에 동작 의미 한 줄** 세 채널 중 최소 두 개 적용. 회귀 사례: 사용자가 zonalHeatmap의 Start를 emergencyZoneRadius의 Start와 같은 RAF 토글로 오해 — 실제로는 활성 토글 + repaintAll(RAF 아님). retroactive 일괄 작업은 ed495c7f에서 11개 컴포넌트(AHU103/Aircon_Ceiling01/Chiller×2/CoolingTower02·03/Generator·GeneratorSmall/Heatexchanger/STATCOM_MMC/Pump) 32개 버튼 처리 완료. |
| 14 | **demo 라벨/버튼/hint의 도메인 컨텍스트 명시** | preview의 `demo-label`("Detection Markers" 식 일반어), 버튼 라벨("+ Success/Failure"), `demo-hint`가 **컴포넌트가 표현하는 실제 장비/도메인의 의미**를 빠뜨리면 preview를 처음 보는 사람은 "이 sphere/색 변화/마커가 어떤 의미인지" 추론 불가 — 시각화의 가치가 0에 수렴한다(#13이 "verb의 internal mechanism" 의미라면 #14는 "demo UI 전체의 domain semantics"). **세 채널 중 최소 두 개 적용**: ① `demo-label`에 도메인 명시(예: `"Iris Recognition Result (홍채 인식 결과 마커)"` / `"Cell Heatmap (배터리 셀 온도)"` 식) ② 버튼 라벨에 의미 부기(예: `"+ Success (등록자)"` / `"Heat Up (셀 발열)"`)와 `title` hover에 시각 대응 1문장 ③ `demo-hint`에 (a) **컴포넌트의 도메인 정체** (b) **각 type/액션의 시각화 의미** (c) **preview fallback과 운영 명시 좌표/실데이터의 차이**를 1~2문장 명시. 회귀 사례: IRISID_iCAM7/Advanced/detectionMarker preview가 `demo-label="Detection Markers"` / 버튼 `"+ Success"` / hint `"인식 결과 마커 add (position 미지정 → 카메라 forward 1.2m fallback)"`만으로 작성 — 사용자가 *"마커 찍히는게 어떤 의미인지 모르겠다"* 지적. **이 컴포넌트가 IrisID iCAM7 = 홍채 인식 카메라**라는 도메인 정체와 success=등록자/failure=미등록의 의미가 어디에도 드러나지 않았음. 본 사이클(detectionMarker)에서 즉시 보강 + 본 규율 신설 + 3D Advanced preview 전수 retroactive 점검. |

> **항목 간 중복 검토 (2026-05-02 갱신)**: A·B·C 카테고리는 직교 관심사로 항목 간 의미 중복 없음을 확인. 잠재 중복 후보 #6(UI↔API 축) ↔ #13(라벨 명시)은 **correctness vs discoverability**로 다른 차원, #10(외부 API 완전성) ↔ #12(CSS 색)는 **존재 vs 가시성**으로 sequential dependency라 통합 부적절. **#13 ↔ #14는 인접하지만 직교**: #13은 라이프사이클 verb의 *internal mechanism semantics*(RAF? DOM toggle?)를 다루고, #14는 demo UI 전체의 *domain semantics*(어떤 장비? 어떤 결과를 시각화?)를 다룬다 — 한 컴포넌트가 #13만 만족(`Start (RAF)`)해도 #14 미달(`Detection Markers`라는 일반어)이면 사용자는 "무엇이 RAF에 의해 시작되는지" 알 수 없다. 14개 유지.

#### 3. SKILL 자가 보강 규율 — 1번 회귀 = 즉시 일반화 검토

Phase 1.5 항목은 회귀 사례에서 역공학적으로 추가된다. 그러나 **3번째 사고를 기다리지 않는다** — 동일 카테고리 회귀가 1번 관측되면 즉시 일반화 가능성을 검토하여 SKILL 항목으로 승격한다.

**판단 기준**:
- **일반화 가능** (다른 컴포넌트에서 같은 패턴으로 재발 가능 — 예: preview 작성 시 누락 가능한 일반 룰) → 즉시 Phase 1.5 항목 추가 + retroactive 적용 백로그 등록
- **일반화 불가** (단발 사고, 모델/도메인 특이성, 1회성 외부 변경) → commit 메시지에만 기록

**근거 — 이 규율이 없었으면 답습된 회귀**:
- **#12 (preview 데모 버튼 CSS 색 완전성)**: b3574572 OHU103 1차 회귀 → 30d73dbd Marker_* 2차(답습 실패) → 9dc951e5 zonalHeatmap 3차(답습 실패) → 비로소 SKILL 추가. **3 사이클 낭비**. 1차 시점에 일반화 검토했다면 2·3차 차단 가능했음.
- **#13 (라이프사이클 토글 라벨 명시)**: zonalHeatmap Start 의미 오해 1번 발생 → f250c104에서 즉시 일반화 추가 + 본 사이클(ed495c7f) retroactive 11개 일괄 처리. **본 규율 첫 적용 사례**.
- **#14 (demo 도메인 컨텍스트 명시)**: IRISID_iCAM7/Advanced/detectionMarker에서 사용자 *"마커 찍히는게 어떤 의미인지 모르겠다"* 1번 발생 → 즉시 일반화 + 3D Advanced preview 전수 retroactive 점검 백로그 등록. 본 규율 두 번째 적용 사례 — `demo-label`이 "Detection Markers" 같은 일반어, 버튼이 "+ Success"만이고, demo-hint가 도메인(홍채 인식 카메라) 정체와 type 의미를 빠뜨려 preview 단독으로는 시각화의 의미 추론 불가.

**예외**: 기능 추가 사이클 도중 발견된 사고는 그 사이클 commit에서 fix까지만 처리하고, SKILL 추가는 다음 사이클 시작 시점에 일괄 검토한다 (cycle 내부 동선 산만 방지). 단, 다음 사이클 시작 시 누락 없이 검토되어야 한다 — commit 메시지에 "SKILL 보강 후보" 태그를 남겨 추적성 확보.

#### 4. 실패 처리

항목 중 하나라도 drift가 있으면 **커밋 이전**에 정정한다. 커밋 이후 수정은 별도 refactor 커밋으로 git log를 늘리고, 문서의 "기존 변형과 동일" 주장을 사후 거짓으로 만든다.

#### 5. 신규 커스텀 메서드 추가 시

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
