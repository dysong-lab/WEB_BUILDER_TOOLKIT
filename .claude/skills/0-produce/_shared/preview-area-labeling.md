# Preview 코드 영역 식별 규약

`preview/{변형}.html`의 `<script>` 내부 코드는 빌더(다른 페이지 개발자)가 컴포넌트 사용법을 학습하는 **가이드** 역할을 한다. 따라서 preview를 읽었을 때 다음이 즉시 구분되어야 한다:

- **페이지 개발자가 운영에서 직접 작성할 코드**
- **컴포넌트 register.js가 자동 처리하는 본문**
- **preview 동작을 위한 보일러플레이트**
- **데모 컨트롤만의 일회성 코드**

이 규약은 2D/3D × Standard/Advanced 4가지 조합 모두에 동일하게 적용된다.

---

## 4종 라벨

| 라벨 | 의미 | 페이지 작성 여부 |
|------|------|----------------|
| `[PREVIEW 인프라]` | preview 동작에 필요하지만 운영과 무관한 보일러플레이트 | ❌ (런타임 자동) |
| `[PAGE]` | 페이지 개발자가 운영에서 직접 작성할 코드 | ✅ |
| `[COMPONENT register.js 본문]` | register.js의 내용을 그대로 옮긴 부분 — 운영에서는 컴포넌트 등록 시점에 자동 적용 | ❌ |
| `[PREVIEW 전용]` | 운영에 존재하지 않는 데모 컨트롤만의 코드 (강제 상태 버튼 등) | ❌ |

---

## 적용 대상 (유형별)

### 3D preview

| 라벨 | 적용 대상 |
|------|----------|
| `[PREVIEW 인프라]` | Three.js scene/camera/light 셋업 · GLTFLoader · model.traverse mesh 이름 수집 · OrbitControls · 카메라 타겟 조정 · originalColors 저장 등 |
| `[PAGE]` | HUD/외부 DOM 정적 렌더 시뮬레이션 함수 (mountHudCards 등) · `instance.hudRoot` / `instance.renderer` 등 외부 자원 주입 · `pageDataMappings` 시뮬레이션 (setInterval + 직접 호출 + Mock 데이터 발행) · 페이지 측 이벤트 리스너 |
| `[COMPONENT register.js 본문]` | `applyMeshStateMixin({...})` · `applyXxxMixin({...})` · `instance.커스텀메서드 = (...) => {...}` 정의 · (필요 시) `subscribe go({...})` 시뮬레이션 |
| `[PREVIEW 전용]` | 강제 상태 버튼 핸들러 (Refresh/All Warning/All Error/All Normal 등) · 디버그 토글 · 슬라이더 컨트롤(컴포넌트의 외부 명령형 API 시연용) |

### 2D preview

| 라벨 | 적용 대상 |
|------|----------|
| `[PREVIEW 인프라]` | Mock instance 생성 · DOM 컨테이너 ID 획득 · 페르소나 변형 라벨 표시 등 (3D보다 보일러가 적음 — 단순 변형은 거의 비어있을 수도) |
| `[PAGE]` | 페이지가 작성할 외부 DOM (필요 시) · 데이터 발행 시뮬레이션(setInterval + Mock 데이터) · 페이지 측 이벤트 리스너 (예: customEvents 핸들러) |
| `[COMPONENT register.js 본문]` | `applyXxxMixin({...})` 호출들 · `instance.커스텀메서드 = ...` 정의 · `subscribe go({...})` 시뮬레이션 |
| `[PREVIEW 전용]` | 디자인 변형 토글, 디버그 패널, 강제 상태 버튼 등 |

---

## 표기 규약 (시각 우선순위 3단계)

1. **████ 두꺼운 블록** — `[COMPONENT register.js 본문]` 블록의 시작과 끝 양쪽에 사용 (가장 강한 강조)
2. **════ 단일선 헤더** — `[PREVIEW 인프라]`, `[PAGE]`, `[PREVIEW 전용]` 구분 (중간 강조)
3. **──── 점선 인라인** — 작은 단계 안에서 부수적 표기 (예: 원본 색상 저장, 카메라 타겟 조정 등)

이 시각 우선순위는 코드를 스크롤할 때 눈에 들어오는 순서가 (a) 컴포넌트 본문 경계 → (b) 페이지/프리뷰 인프라 경계 → (c) 세부 항목 순으로 정렬되도록 설계된 것이다.

### 헤더 형식 예시

```javascript
// ████████████████████████████████████████████████████████████████
//  [COMPONENT register.js 본문]  — 페이지는 작성하지 않습니다
// ────────────────────────────────────────────────────────────────
//  아래 블록은 scripts/register.js의 내용을 그대로 옮긴 것이며,
//  운영 환경에서는 컴포넌트 등록 시점에 자동으로 적용됩니다.
// ████████████████████████████████████████████████████████████████
applyXxxMixin(instance, { ... });
instance.커스텀메서드 = (...) => { ... };
// ████████████████████████████████████████████████████████████████
//  [COMPONENT register.js 본문]  — 끝
// ████████████████████████████████████████████████████████████████
```

```javascript
// ════════════════════════════════════════════════════════════════
//  [PAGE]  데이터 발행 — 페이지가 작성하는 영역
// ────────────────────────────────────────────────────────────────
//  운영: this.pageDataMappings = [
//          { topic: '...', datasetInfo: {...}, refreshInterval: 30000 }
//        ];
//  preview: setInterval + 직접 호출로 시뮬레이션
// ════════════════════════════════════════════════════════════════
function fetchAndApply() { ... }
fetchAndApply();
const interval = setInterval(() => fetchAndApply(), 3000);
```

```javascript
// ════════════════════════════════════════════════════════════════
//  [PREVIEW 전용]  데모 컨트롤 버튼 — 운영 환경에는 없음
// ════════════════════════════════════════════════════════════════
document.querySelector('.demo-btn[data-action="refresh"]').addEventListener('click', () => {...});
```

---

## [COMPONENT register.js 본문] 헤더 필수 문구

해당 블록의 헤더에는 다음 한 줄을 **반드시** 포함한다:

> 아래 블록은 scripts/register.js의 내용을 그대로 옮긴 것이며, 운영 환경에서는 컴포넌트 등록 시점에 자동으로 적용됩니다.

이는 빌더가 코드를 읽을 때 "이 부분은 운영에서 내가 쓸 일이 없는 영역"임을 즉시 학습하도록 하는 핵심 단서다.

---

## 인라인 토픽 매핑 주석

페이지 데이터 발행 시뮬레이션(예: `fetchAndApply`) 안에서 컴포넌트 핸들러 호출 옆에 `← subscribe go({토픽이름})` 형식의 짧은 주석을 붙여 페이지 발행 데이터가 어느 핸들러로 전달되는지 1:1 매핑을 가시화한다:

```javascript
instance.meshState.renderData({ response: statusResponse });   // ← subscribe go({equipmentStatus})
instance.renderHud({ response: hudResponse });                 // ← subscribe go({zoneHud})
```

운영에서는 wemb 런타임의 publish가 자동으로 컴포넌트의 `subscribe go({...})` 핸들러를 호출하지만 preview에서는 직접 호출로 흉내낸다 — 인라인 주석으로 이 매핑을 드러낸다.

---

## 적용 범위

| SKILL | 적용 시점 |
|-------|---------|
| `produce-standard-auto` (2D) | Agent 프롬프트가 산출물 생성 시 본 규약 따름 |
| `produce-standard-loop` (2D) | 사용자 단계별 승인 시 본 규약 적용 검토 |
| `produce-advanced-auto` (2D) | Agent 프롬프트가 산출물 생성 시 본 규약 따름 |
| `produce-advanced-loop` (2D) | 사용자 단계별 승인 시 본 규약 적용 검토 |
| `produce-3d-standard-auto` | Agent 프롬프트가 산출물 생성 시 본 규약 따름 |
| `produce-3d-standard-loop` | 사용자 단계별 승인 시 본 규약 적용 검토 |
| `produce-3d-advanced-auto` | Agent 프롬프트가 산출물 생성 시 본 규약 따름 |
| `produce-3d-advanced-loop` | 사용자 단계별 승인 시 본 규약 적용 검토 |

각 SKILL의 preview 산출물 섹션은 본 문서를 단일 진실 출처로 참조한다.

---

## 참조 사례 (기준 예시)

`Components/3D_Components/meshesArea/area_01/Advanced/hudInfo/preview/01_default.html` — 4종 라벨이 모두 적용된 첫 기준 예시. 신규 변형 작성 시 이 파일의 영역 분리 패턴을 그대로 따른다.

---

## Preview script src 상대경로 — verbatim 복사 강제

`<script src="../...">`의 `../` 개수는 **계산하지 말고 동일 깊이의 기준 변형 첫 두 줄을 verbatim 복사**한다. 폴더 깊이별 정답:

| preview 위치 | ../개수 | 예 |
|----------|---------|---|
| `Components/<범주>/Standard/preview/*.html` | 4 (`../../../../`) | AppBars/Standard |
| `Components/<범주>/Advanced/<변형>/preview/*.html` | 5 (`../../../../../`) | Cards/Advanced/expandable |
| `Components/<범주>/<서브범주>/Advanced/<변형>/preview/*.html` | 6 (`../../../../../../`) | Buttons/Buttons/Advanced/longPress |

`preview_runtime.js`는 `DesignComponentSystem/` 루트, Mixin은 `DesignComponentSystem/Mixins/` 아래.

공식: `src` 안의 `../` 개수 == "Components 이후 segment 수" (파일 자신 포함). preview 폴더 → 점프 → DesignComponentSystem 루트까지.

**위반 시 차단**: Hook `check-preview-script-depth.sh`(P3-5)가 PostToolUse에서 정적 검증하여 exit 2로 즉시 차단한다.

**회귀 사례** (2026-05-04): Cards/Advanced/expandable + swipeAction 8 파일이 4단계로 잘못 작성되어 `loadComponentAssets is not defined` ReferenceError 발생. 사이클 순서와 무관하게 50% 확률로 흩어졌으며(같은 Cards 안에서도 #19 expandable 틀림 → #20 sortable 맞음 → #21 selectable 맞음 → #22 swipeAction 틀림), 원인은 에이전트가 매 사이클 폴더 깊이를 직접 셈하기 때문. 본 규약 + Hook P3-5로 회귀 차단. (commit 954f6ff5에서 retroactive 정정.)
