---
name: produce-3d-advanced-auto
description: 3D Advanced 변형을 ADVANCED_QUEUE.md 순서대로 서브에이전트 기반 완전 자동 생산합니다. 메인은 Phase 0(큐 파싱+Standard 선행 필터) → Agent 호출 → Phase 2(검증+커밋+큐업데이트) → 반복.
---

# 3D Advanced 컴포넌트 완전 자동 생산

## 목표

`RNBT_architecture/DesignComponentSystem/Components/3D_Components/ADVANCED_QUEUE.md`에 등록된 3D Advanced 변형을 순번 순서대로 생산한다.
한 번 실행하면 **남은 모든 "대기" 항목**을 순차로 소화한다.
각 사이클은 **독립된 서브에이전트**가 처리하므로 메인 컨텍스트는 누적되지 않는다.

기존 `produce-3d-advanced-loop`(수동, 승인 기반)의 완전 자동 대체 버전.

---

## 2D Advanced auto와의 대칭

| 측면 | 2D (produce-advanced-auto) | 3D (이 문서) |
|------|---------------------------|-------------|
| 큐 파일 | Components/ADVANCED_QUEUE.md | Components/3D_Components/ADVANCED_QUEUE.md |
| 큐 표 형식 | 5열 (순번/경로/변형/설명/상태) | **6열 (순번/경로/유형/변형/설명/상태)** |
| 유형 분기 | 없음 | **개별 / 컨테이너** |
| 개발 스킬 | create-2d-component | create-3d-component (개별) / create-3d-container-component (컨테이너) |
| Standard 선행 필터 | 없음 | **있음 (Standard 폴더 없으면 건너뜀)** |
| Phase 1.5 체크리스트 | 7항목 | **14항목 (3중 등록 + UI↔API 축 일치 + 도메인 컨텍스트 등 추가)** |
| 모델 부재 처리 | N/A | **[MODEL_READY] placeholder 지원** |

---

## 구조 원칙

```
[메인 루프]
    │
    ├─ Phase 0: ADVANCED_QUEUE.md "대기" 첫 항목 추출 → Standard 선행 필터 → {경로}/{유형}/{변형}/{설명}
    ├─ Phase 1: Agent(subagent_type=general-purpose) 호출 → 단일 변형 생산 위임
    ├─ Phase 2: 결과 확인 + 큐 상태 업데이트 + 커밋
    └─ Phase 3: 다음 대상으로 반복 (남은 "대기" 항목이 없을 때까지)
```

- **매 사이클마다 새 Agent 호출**
- **사용자 승인 포인트 없음**
- **Phase 1.5 패턴 대조도 Agent 자율 검증** — 14항목 체크리스트 통째 포함, 기준 변형 자동 선정, 결과 1줄 반환
- **큐 상태 업데이트는 메인이 담당** — Agent는 ADVANCED_QUEUE.md를 직접 수정하지 않는다
- **Standard 선행 필터** — 큐 항목의 컴포넌트가 Standard 폴더 없으면 사용자에게 안내 후 다음 큐 항목 시도
- **실패 시 즉시 중단** — 큐 상태는 "대기"로 유지하여 재실행 가능 보장

---

## 메인 루프 절차

### Phase 0. 다음 대상 파악 + Standard 선행 필터

매 사이클 시작 시 실행한다.

1. ADVANCED_QUEUE.md 읽기:
   ```
   경로: RNBT_architecture/DesignComponentSystem/Components/3D_Components/ADVANCED_QUEUE.md
   ```

2. **표 형식** (6열):
   ```
   | 순번 | 컴포넌트경로 | 유형 | 변형 이름 | 설명 | 상태 |
   ```

3. 표 행 중 **상태가 "대기"인 첫 행**을 다음 대상으로 삼는다. 다음 변수를 추출:
   - `{컴포넌트경로}` — 예: `Chiller`, `meshesArea/area_01`
   - `{유형}` — `개별` 또는 `컨테이너`
   - `{변형이름}` — 예: `highlight`, `dynamicRpm`, `pipeFlow`
   - `{설명}` — 한 줄 요약 (Mixin 조합 정보 포함)

4. **Standard 선행 필터** (필수):
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/3D_Components/{컴포넌트경로}/Standard/scripts/register.js 2>/dev/null
   ```
   - **없으면** → 해당 항목을 건너뛰고 사용자에게 안내:
     ```
     ⚠️ Standard 미생산: {경로} — Advanced 생산 전에 `produce-3d-standard-auto`로 Standard를 먼저 생산해주세요.
     이 항목은 건너뛰고 다음 "대기" 항목을 시도합니다.
     ```
   - 있으면 다음 단계로

5. **유형별 개발 스킬 결정**:
   | 유형 | 호출 스킬 |
   |------|----------|
   | 개별 | `create-3d-component` |
   | 컨테이너 | `create-3d-container-component` |

6. 출력 폴더 사전 점검:
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/3D_Components/{컴포넌트경로}/Advanced/{변형이름}/scripts/register.js 2>/dev/null
   ```
   이미 register.js가 있으면 큐 상태가 잘못된 것으로 판단하고 중단, 사용자에게 "이미 생산됨: 3D_Components/{경로}/Advanced/{변형이름} — 큐 상태가 '대기'인데 파일이 존재합니다. 수동 확인 필요" 보고.

7. **"대기" 항목 없음** (Standard 선행 필터로 모든 항목이 건너뛰어진 경우 포함) → 전체 루프 종료, 사용자에게 완료 보고:
   ```
   ✅ 3D Advanced 전체 생산 완료.
   생산된 변형: N개 / 건너뛴 항목(Standard 미생산): M개 / 커밋: N개
   ```

---

### Phase 1. 서브에이전트 호출

`Agent` 도구로 `subagent_type=general-purpose`에 위임한다.

**프롬프트 템플릿** (매 사이클 `{컴포넌트경로}` / `{유형}` / `{변형이름}` / `{설명}` / `{개발스킬}` 교체):

```
대상: 3D 컴포넌트 `{컴포넌트경로}/Advanced/{변형이름}`를 처음부터 끝까지 생산한다.
유형: {유형} (개별 / 컨테이너)
개발 스킬: {개발스킬}  (create-3d-component / create-3d-container-component)
변형 설명(큐): {설명}

## 배경

Renobit 웹 빌더의 DesignComponentSystem은 Mixin 기반 3D 컴포넌트 집합이다.
너는 단일 Advanced 변형 하나를 완결하여 생산하고 요약만 반환한다.
사용자 승인이 필요 없는 완전 자동 모드로 동작한다.
이 컴포넌트의 Standard 폴더는 이미 존재한다 (메인이 사전 검증).

## 필수 읽어야 할 문서 (순서대로)

1. `/.claude/skills/SHARED_INSTRUCTIONS.md` — 공통 규칙
2. `/.claude/skills/0-produce/produce-component/SKILL.md` — 생산 프로세스
3. `/.claude/skills/0-produce/produce-3d-advanced-loop/SKILL.md` — 3D Advanced의 분리 정당성·Phase 1.5 14항목 체크리스트 원전 (이 프롬프트가 인용)
4. `/.claude/skills/2-component/{개발스킬}/SKILL.md` — 3D 구현
5. `/.claude/guides/CODING_STYLE.md` — 코딩 스타일
6. `/RNBT_architecture/DesignComponentSystem/Mixins/README.md` — Mixin 카탈로그
7. `/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md` — 시스템 설계
8. `Components/3D_Components/{컴포넌트경로}/CLAUDE.md` — 컴포넌트 역할 (이미 존재)
9. `Components/3D_Components/{컴포넌트경로}/Standard/scripts/register.js` — Standard 기준선 (이미 존재)
10. `Components/3D_Components/ADVANCED_QUEUE.md` — 상단 "커스텀 메서드 vs 신규 Mixin 판단 규칙" 섹션

## 산출물 (모두 자동으로 작성)

1. `Advanced/{변형이름}/CLAUDE.md` — 기능 정의 + 구현 명세 + **Standard와의 분리 정당성**(register.js 차이 명시) + Mixin 조합 근거
2. `Advanced/{변형이름}/scripts/register.js` — Mixin 조립 + 이벤트 (top-level 평탄 작성, IIFE 금지)
3. `Advanced/{변형이름}/scripts/beforeDestroy.js` — 정리 코드 (구독 해제 → `removeCustomEvents` → `this.xxx?.destroy()` 호출만, self-null Mixin은 명시 null 생략)
4. `Advanced/{변형이름}/page/loaded.js`, `before_load.js`, `before_unload.js` (필요 시)
5. `Advanced/{변형이름}/preview/` 변형 (preview attach 함수의 destroy 콜백도 register.js와 동일 규약). **`<script>` 내부 코드는 [`_shared/preview-area-labeling.md`](/.claude/skills/0-produce/_shared/preview-area-labeling.md)의 4종 라벨(`[PREVIEW 인프라]` / `[PAGE]` / `[COMPONENT register.js 본문]` / `[PREVIEW 전용]`)로 영역 분리 필수 — 기준 사례: `meshesArea/area_01/Advanced/hudInfo/preview/01_default.html`**
6. `DesignComponentSystem/manifest.json` — 해당 컴포넌트의 `sets[Advanced].items[]`에 항목 추가
7. **컴포넌트 루트 CLAUDE.md** — 세트 현황 표에 "Advanced/{변형이름} | 완료" 행 추가 (3중 등록의 한 축)

## 모델 부재 시 처리

모델이 없으면 [MODEL_READY] placeholder를 사용한다:

```javascript
// TODO: [MODEL_READY] 모델의 실제 meshName으로 교체
const MESH_NAME = '장비명';
```

모델 무관 파일은 100% 작성 가능:
- scripts/register.js (meshName만 placeholder)
- scripts/beforeDestroy.js
- page/loaded.js, before_load.js, before_unload.js

모델 도착 시 `grep -r "MODEL_READY"`로 전수 교체 가능하도록 일관된 형식 유지.

## Phase 1.5 — 기존 변형과의 패턴 대조 (자율 검증, 커밋 직전 필수)

> 대표 사례 — `meshesArea/STATCOM_MMC/Advanced/pipeFlow`는 초기 커밋 이후 IIFE 제거·destroy 규약 동기화·preview destroy 누락·UV 축 u→v 교체·슬라이더 콜백 축 불일치 총 5건의 후행 refactor 커밋이 필요했다. Phase 1.5를 수행했다면 초기 커밋에서 모두 흡수 가능했다.

### 1. 기준 변형 자동 선정

다음 우선순위로 비교 기준 파일을 선택:

1. **동일 컨테이너 타입**(개별 vs `meshesArea/*`) 중 **가장 가까운 완료 변형** 1개를 기준 파일로 선정
   - 신규가 `meshesArea/X/Advanced/highlight` → 기준: `meshesArea/area_01/Advanced/highlight`
2. 신규가 커스텀 메서드(`this.xxx` 네임스페이스)를 포함 → 기준에 `Mixins/MeshStateMixin.js`의 destroy 패턴 추가 대조
3. 신규 커스텀 메서드에 RAF·리소스 Wrap 설정·텍스처 mutation이 있다면 기준 파일은 **최근 완료된 유사 커스텀 변형**(예: `STATCOM_MMC/Advanced/pipeFlow`)까지 포함

`find Components/3D_Components -type d -path "*/Advanced/*"`로 완료 변형 목록 확인 가능.

### 2. 대조 체크리스트 14항목 (3 카테고리)

14개 항목을 **A/B/C 3 카테고리**로 분류. 카테고리별 순차 검증이 단일 14행 스캔보다 누락이 적다 (관심사 단위 chunking).

#### A. 구조 정합성 (1-5) — register.js / preview attach / beforeDestroy 라이프사이클 일치

| # | 항목 | 관례 |
|---|------|------|
| 1 | **register.js 평탄 작성** | top-level 평탄 작성. IIFE/수동 클로저로 감싸지 않는다 (인스턴스마다 새 실행 컨텍스트에서 평가됨) |
| 2 | **인스턴스 네임스페이스 self-null** | `this.xxx.destroy()` 내부에서 `this.xxx = null`까지 스스로 수행 (MeshStateMixin.destroy 패턴 — `Mixins/MeshStateMixin.js:115`) |
| 3 | **beforeDestroy.js는 호출만** | `this.xxx?.destroy()` 호출만 남기고 null 할당은 생략 (destroy가 self-null 하므로 중복 금지) |
| 4 | **preview 내부 attach 함수 destroy 일치** | preview의 `attachXxx` 내부 destroy 콜백도 register.js와 동일 규약 (`inst.xxx = null` 포함). "register.js와 동일 로직" 주석이 있다면 실제 구현도 동일 |
| 5 | **커스텀 메서드 시그니처 일관성** | 기존 유사 커스텀(`pipeFlow` 등) 및 Mixin API와 동사·인자 형태가 일관 (`start/stop/setSpeed(meshName, {u,v})/getMeshNames/destroy`) |

#### B. 데이터·등록 정합성 (6-8) — UI/API 축, 기본값 관찰성, 3중 등록

| # | 항목 | 관례 |
|---|------|------|
| 6 | **UI ↔ API 인자 축 일치** | preview 슬라이더/버튼이 변경하는 축(u/v·x/y·속도/시간)과 API 호출 인자가 일치. 축 불일치는 "0으로 맞춰도 멈추지 않음" 류 버그의 주 원인 |
| 7 | **기본값의 시각적 관찰 가능성** | 실제 텍스처/모델 특성(그라디언트 방향, 반복성, 클립 존재 여부 등)에서 기본값이 화면에 관찰 가능. 관찰 불가하면 기본값 조정 또는 근거를 CLAUDE.md에 명시 |
| 8 | **manifest·ADVANCED_QUEUE·컴포넌트 루트 CLAUDE.md 3중 등록** | 세 곳 중 manifest와 컴포넌트 루트 CLAUDE.md 두 곳에 변형이 기재되어 있고 spec/preview 경로가 실제 파일과 일치. ADVANCED_QUEUE.md는 메인이 업데이트하므로 너는 **수정하지 않는다** (확인만) |

#### C. Preview 시연 완전성 (9-14) — 경로/외부 API/지속 시연/CSS 색/라벨 의미/도메인 컨텍스트

| # | 항목 | 관례 |
|---|------|------|
| 9 | **preview 상대 경로 깊이 일관성** | preview/01_default.html이 사용하는 모든 `../` 상대 경로(`<script src>` Mixin·preview_runtime / `loader.load()` 모델 경로)가 실제 폴더 깊이와 일치. **개별 컴포넌트 Advanced(`X/Advanced/Y/preview`)=6단계 / 컨테이너 Advanced(`meshesArea/X/Advanced/Y/preview`)=7단계**. 직전 사이클이 다른 깊이의 컴포넌트라면 그 패턴을 그대로 복사하지 말고 자체 깊이를 재계산. 회귀 사례: `statcom_powerFlow`(컨테이너)가 직전 Marker_*(개별 6단계) 답습 → GLTF 404 + `applyMeshStateMixin is not defined` |
| 10 | **preview의 외부 명령형 API 시연 완전성** | register.js가 노출하는 모든 외부 명령형 API(`setXxx/getXxx/show/hide/start/stop/...`)가 preview에서 호출 가능 — 버튼·슬라이더·자동 데모 중 하나로 시연. `getXxx`류는 readout으로 표시. 회귀 사례: `OHU103/outdoorUnitPerformance`가 `hide/show`를 노출했으나 preview 컨트롤 누락 |
| 11 | **자동 데모의 지속 시연성** | 자동 데모는 페이지 로드 후 30초 이상 관찰해도 컴포넌트가 노출하는 모든 채널이 시연된다 — 1회 단발 setTimeout은 로드 직후 N초를 놓치면 정적 화면이 됨. setInterval 또는 마지막 단계가 자기 자신을 setTimeout으로 재호출하는 무한 순환 사용. 회귀 사례: `submoduleDetailZoom`이 0.2s/2.2s/4.2s 단발 데모 후 정지 → 4채널 직교성 파악 어려움 |
| 12 | **preview 데모 버튼 CSS 색 완전성** | 모든 `.demo-btn[data-action/status/mode="..."]` attribute selector 버튼은 CSS 배경색 분기가 정의되어 있어야 한다. 미정의 시 OS default(흰 회색) + 흰 글자로 식별 불가. **버튼 추가 시점에 CSS 색 분기 동시 추가**. 자율검증: `grep -oE 'data-(action\|status\|mode)="[^"]*"'` ↔ `grep -oE '\.demo-btn\[data-(action\|status\|mode)="[^"]*"\]'` 비교로 누락 없음 확인. 회귀 사례: OHU103 `data-state-action` 누락(b3574572) → Marker_*/emergencyZoneRadius `data-action="start/stop"` 누락(같은 회귀 반복) → zonalHeatmap `data-action="clear"` + `data-status` 4종 누락. |
| 13 | **라이프사이클 토글 버튼 의미 명시화** | `Start/Stop`·`Enable/Disable`·`Show/Hide` 같은 일반 동사 라벨은 컴포넌트마다 의미가 다르다(emergencyZoneRadius Start=sphere+RAF / OHU103 Start=RPM+HUD RAF / zonalHeatmap Start=활성+repaint, **RAF 아님**). 라벨만으로 "무엇을 시작/멈추는지" 추론 불가하면 외부 명령형 API 시연 가치 저하. 라벨 명시화 + `title` 속성 + demo-hint 동작 안내 중 **최소 두 개 적용**. 회귀 사례: zonalHeatmap의 Start를 RAF 토글로 오해(실제 active=true + repaintAll, RAF 없음). retroactive 11개 컴포넌트는 ed495c7f에서 일괄 처리 완료. |
| 14 | **demo 라벨/버튼/hint의 도메인 컨텍스트 명시** | `demo-label`("Detection Markers" 식 일반어), 버튼 라벨("+ Success/Failure"), `demo-hint`가 컴포넌트가 표현하는 **실제 장비/도메인의 의미**를 빠뜨리면 preview를 처음 보는 사람은 "이 sphere/색/마커가 어떤 의미인지" 추론 불가 — 시각화 가치 0 수렴(#13이 verb의 internal mechanism 의미라면 #14는 demo UI 전체의 domain semantics). **세 채널 중 최소 두 개 적용**: ① `demo-label`에 도메인 명시(예: `"Iris Recognition Result (홍채 인식 결과 마커)"`), ② 버튼 라벨에 의미 부기(예: `"+ Success (등록자)"`) + `title` hover 1문장, ③ `demo-hint`에 (a) 컴포넌트 도메인 정체 (b) 각 type/액션의 시각화 의미 (c) preview fallback과 운영 명시 좌표/실데이터 차이를 1~2문장. 회귀 사례: IRISID_iCAM7/Advanced/detectionMarker preview가 도메인(홍채 인식 카메라) 정체와 type 의미를 빠뜨려 사용자가 "마커 찍히는게 어떤 의미인지 모르겠다" 지적 → 즉시 보강 + 본 규율 신설 + 3D Advanced preview 전수 retroactive 점검. |

> **항목 간 중복 검토 (2026-05-02 갱신)**: A·B·C 카테고리는 직교. #6↔#13은 **correctness vs discoverability**, #10↔#12는 **존재 vs 가시성**, **#13↔#14는 인접하지만 직교**: #13은 verb의 *internal mechanism semantics*(RAF? DOM toggle?), #14는 demo UI 전체의 *domain semantics*(어떤 장비? 어떤 결과를 시각화?) — `Start (RAF)`처럼 #13만 만족해도 demo-label이 "Detection Markers" 일반어면 #14 미달. 14개 유지.

### 3. SKILL 자가 보강 규율 — 1번 회귀 = 즉시 일반화 검토

Phase 1.5 항목은 회귀 사례에서 역공학적으로 추가된다. 그러나 **3번째 사고를 기다리지 않는다** — 동일 카테고리 회귀가 1번 관측되면 즉시 일반화 가능성을 검토하여 SKILL 항목으로 승격한다.

**판단 기준**:
- **일반화 가능** (다른 컴포넌트에서 같은 패턴으로 재발 가능 — preview 작성 시 누락 가능한 일반 룰) → 즉시 Phase 1.5 항목 추가 + retroactive 적용 백로그 등록
- **일반화 불가** (단발 사고, 모델/도메인 특이성, 1회성 외부 변경) → commit 메시지에만 기록

**근거 — 이 규율이 없었으면 답습된 회귀**:
- **#12 (preview 데모 버튼 CSS 색 완전성)**: b3574572 OHU103 1차 → 30d73dbd Marker_* 2차(답습 실패) → 9dc951e5 zonalHeatmap 3차(답습 실패) → 비로소 SKILL 추가. **3 사이클 낭비**. 1차 시점에 일반화 검토했다면 2·3차 차단 가능했음.
- **#13 (라이프사이클 토글 라벨 명시)**: zonalHeatmap Start 의미 오해 1번 → f250c104에서 즉시 일반화 + ed495c7f retroactive 11개 일괄 처리. **본 규율 첫 적용 사례**.

**예외**: 기능 추가 사이클 도중 발견된 사고는 그 사이클 commit에서 fix까지만 처리, SKILL 추가는 다음 사이클 시작 시점에 일괄 검토 (cycle 내부 동선 산만 방지). 단, 다음 사이클 시작 시 누락 없이 검토되어야 한다 — commit 메시지에 "SKILL 보강 후보" 태그를 남겨 추적성 확보.

### 4. 신규 커스텀 메서드 추가 시

추가로 `ADVANCED_QUEUE.md` 상단의 **"커스텀 메서드 vs 신규 Mixin 판단 규칙"**에 따라 커스텀/Mixin 선택이 적절한지 재확인. 2번째 컴포넌트에서 동일 기법이 요청될 경우의 승격 시나리오를 컴포넌트 CLAUDE.md에 한 줄 메모.

### 5. 실패 처리

항목 중 하나라도 drift가 있으면 **반환 직전에** 정정. 정정 불가하면 반환의 "발견한 문제"에 명시.

## 필수 제약

- 컴포넌트 CLAUDE.md의 cssSelectors 계약(있으면)을 HTML과 JS에서 일치시킨다.
- Hook 검증(P0~P3) 통과를 보장한다.
- manifest.json 수정 후 `node -e "JSON.parse(require('fs').readFileSync('RNBT_architecture/DesignComponentSystem/manifest.json','utf8'))"`로 JSON 유효성을 직접 검증한다.
- 기존 완성된 컴포넌트 파일은 수정하지 않는다 (단 컴포넌트 루트 CLAUDE.md의 세트 현황 표에 "Advanced/{변형이름} | 완료" 행 추가는 예외 — 3중 등록 규약).
- 커밋은 하지 않는다 (메인 루프가 커밋한다).
- **ADVANCED_QUEUE.md는 수정하지 않는다** (메인 루프가 상태 업데이트).
- **신규 Mixin 생성 금지.** 큐 설명에 "신규 Mixin: XxxMixin"이라고 명시되어 있어도 이 사이클에서는 커스텀 메서드로 완결하고 반환의 "발견한 문제"에 `Mixin 승격 후보: {설명}`로 기록만 남긴다. `create-mixin-spec` / `implement-mixin` 스킬은 호출하지 않는다.

## 반환 형식 (200단어 이내)

- 생산한 변형 경로
- 선택한 Mixin 조합 + 근거 1줄
- 커스텀 메서드(있으면) 시그니처 + 근거 1줄
- 주요 이벤트 / 구독 토픽 1줄씩
- Standard와의 분리 정당성 1줄
- **Phase 1.5 자율검증 결과 1줄** (예: "기준=meshesArea/area_01/Advanced/highlight, 14항목 통과")
- [MODEL_READY] placeholder 사용 여부 (사용 시 위치 1줄)
- 특이 결정사항
- 발견한 문제/의문점 (있으면)
```

**호출**:

```javascript
Agent({
    description: "{컴포넌트경로}/Advanced/{변형이름} 생산",
    subagent_type: "general-purpose",
    prompt: "(위 템플릿)"
})
```

---

### Phase 2. 결과 확인 + 큐 업데이트 + 커밋

Agent 반환 후 다음 순서로 진행:

1. **생성된 파일 존재 확인**:
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/3D_Components/{컴포넌트경로}/Advanced/{변형이름}/scripts/register.js
   ```
   `register.js`, `beforeDestroy.js`, `CLAUDE.md`가 최소 존재해야 한다. preview/page는 변형 성격에 따라 선택적.

2. **manifest.json JSON 유효성 재확인**:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('RNBT_architecture/DesignComponentSystem/manifest.json','utf8')); console.log('OK')"
   ```

3. **컴포넌트 루트 CLAUDE.md 갱신 확인** (3중 등록):
   - `Components/3D_Components/{컴포넌트경로}/CLAUDE.md` 또는 컨테이너 루트 CLAUDE.md의 세트 현황 표에 "Advanced/{변형이름} | 완료" 행이 추가되었는지 확인.

4. **ADVANCED_QUEUE.md 상태 업데이트**:
   - 해당 행의 마지막 컬럼(`상태`)을 `대기` → `완료`로 Edit (정확한 행 매칭을 위해 `| {순번} | {컴포넌트경로} | {유형} | {변형이름} |` 접두를 포함한 unique한 패턴으로 교체)

5. **커밋**:
   ```
   feat: 3D_Components/{컴포넌트경로}/Advanced/{변형이름} 컴포넌트 자동 생산 — {Agent 요약 첫 줄}
   ```
   커밋에는 산출물 파일 + manifest.json + 컴포넌트 루트 CLAUDE.md + ADVANCED_QUEUE.md를 모두 포함.

6. **실패 감지 — 즉시 중단**:
   - 파일 누락 → "Phase 2 파일 검증 실패: {누락 목록}" 보고
   - JSON 오류 → "manifest.json 파손: {오류}" 보고
   - 컴포넌트 루트 CLAUDE.md 누락 → "3중 등록 누락: 컴포넌트 루트 CLAUDE.md" 보고
   - Agent가 실패를 보고 → Agent 요약 그대로 사용자에게 전달
   - 실패 시 ADVANCED_QUEUE.md 상태는 **변경하지 않는다** (재실행 가능 보장)

---

### Phase 3. 다음 사이클

남은 "대기" 항목이 있으면 Phase 0부터 다시 실행. 없으면 종료.

Standard 선행 필터로 건너뛴 항목은 그대로 "대기" 유지 — 사용자가 `produce-3d-standard-auto`로 Standard를 채운 뒤 본 SKILL을 재실행하면 자동 처리.

---

## 종료 보고

모든 대상 소화 완료 시:

```
✅ 3D Advanced 전체 생산 완료.
생산된 변형: N개
건너뛴 항목 (Standard 미생산): M개  ← 0이 아니면 produce-3d-standard-auto 안내
커밋: N개
```

중단 시:

```
⚠️ 중단: {사유}
현재까지 생산: N개
마지막 대상: 3D_Components/{경로}/Advanced/{변형이름}
큐 상태: "대기" 유지 (재실행 가능)
재개하려면 `/produce-3d-advanced-auto`를 다시 실행하세요.
```

---

## 금지 사항

- ❌ 사용자에게 중간 승인 요청
- ❌ 한 사이클 안에서 여러 변형 생산
- ❌ Agent 호출 없이 메인이 직접 변형 생산
- ❌ Standard 선행 필터를 우회하여 Standard 없는 컴포넌트의 Advanced 생산
- ❌ 실패를 덮고 다음 사이클 진행
- ❌ Agent가 ADVANCED_QUEUE.md를 직접 수정 (메인 전담)
- ❌ 신규 Mixin 생성 (큐 설명에 명시되어 있어도 커스텀 메서드로 완결)

---

## 참조 문서

- 수동 버전: `/.claude/skills/0-produce/produce-3d-advanced-loop/SKILL.md` (승인 기반, 기존 유지)
- Phase 1.5 체크리스트 원전 (3 카테고리, 14항목): 위 문서 lines 120~167
- 큐 후보 발굴: `/.claude/skills/0-produce/plan-3d-advanced-queue/SKILL.md`
- Standard 선행 자동화: `/.claude/skills/0-produce/produce-3d-standard-auto/SKILL.md`
- 생산 프로세스: `/.claude/skills/0-produce/produce-component/SKILL.md`
- 3D 개별 구현: `/.claude/skills/2-component/create-3d-component/SKILL.md`
- 3D 컨테이너 구현: `/.claude/skills/2-component/create-3d-container-component/SKILL.md`
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
