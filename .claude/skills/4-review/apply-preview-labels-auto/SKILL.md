---
name: apply-preview-labels-auto
description: 이미 생산된 preview.html에 4종 라벨(_shared/preview-area-labeling.md)을 retroactive로 일괄 적용. 컴포넌트 단위 무인 루프, 첫 5 cycle 검수 게이트 후 잔여 처리.
---

# Preview 4종 라벨 retroactive 적용 — 무인 루프

## 목표

`f0711ec7` 커밋 이전에 생산된 365개 preview.html 파일에 [`_shared/preview-area-labeling.md`](../../0-produce/_shared/preview-area-labeling.md) 4종 라벨(`[PREVIEW 인프라]` / `[PAGE]` / `[COMPONENT register.js 본문]` / `[PREVIEW 전용]`)을 retroactive로 일괄 적용한다.

한 번 실행하면 **남은 모든 미처리 컴포넌트**를 순차로 소화한다(5 cycle 검수 게이트 제외). 각 사이클은 **독립된 서브에이전트**가 처리하므로 메인 컨텍스트는 누적되지 않는다.

향후 신규 생산되는 preview는 8개 produce SKILL이 자동으로 라벨을 적용하므로 본 SKILL은 1회성에 가깝다. 다만 누락 발견·재실행 가능성을 위해 SKILL 형태로 유지.

---

## 구조 원칙

```
[메인 루프]
    │
    ├─ Phase 0: 다음 unprocessed 컴포넌트 파악 (카테고리 우선순위 큐)
    ├─ Phase 1: Agent 호출 → 컴포넌트 1개의 모든 preview에 라벨 적용
    ├─ Phase 2: grep 검증 + skipped.md 또는 커밋
    └─ Phase 3: 다음 사이클 (단, cycle == 5 + resume 인자 없음 → 검수 게이트 일시정지)
```

- **매 사이클 새 Agent 호출** — 서브에이전트는 독립 컨텍스트, 완료 후 요약만 반환
- **첫 5 cycle 검수 게이트** — `produce-*-auto`의 완전 무인과 유일한 차이점, 영역 식별 휴리스틱 신뢰도 검증용
- **실패 시 격리, 즉시 중단 X** — 라벨 추가는 의미 중립적이므로 단일 실패가 365 진행을 막지 않음, `skipped.md`에 기록 후 계속

---

## 호출 인자

| 인자 | 의미 |
|------|------|
| 없음 | Phase 0부터 시작. 5 cycle 게이트에 도달하면 자동 일시정지 |
| `resume` | 게이트 우회 + 큐 소진까지 무인 진행 |

호출 예시:
```
/apply-preview-labels-auto         # 첫 5 cycle 처리 후 게이트
/apply-preview-labels-auto resume  # 잔여 큐 무인 처리
```

---

## 메인 루프 절차

### Phase 0. 다음 대상 파악

매 사이클 시작 시 실행한다.

#### 0-1. 진행 상태 로드

`.claude/_data/preview-labeling-progress.json`이 있으면 읽는다(없으면 다음 형식으로 초기화):

```json
{
  "cycleCount": 0,
  "lastProcessedComponent": null,
  "gateCleared": false
}
```

`gateCleared: false`이고 호출 인자가 없으면, `cycleCount`가 5에 도달했을 때 게이트를 발동한다. `resume` 인자가 들어오면 즉시 `gateCleared: true`로 갱신.

#### 0-2. 카테고리 우선순위 큐

작은 그룹부터 처리한다(검증 효율 우선):

```
1. 2D Advanced            (Components/{범주}/{컴포넌트}/Advanced/{변형}/preview/)
2. 3D 컨테이너 Standard   (Components/3D_Components/meshesArea/{컨테이너}/Standard/preview/)
3. 3D 컨테이너 Advanced   (Components/3D_Components/meshesArea/{컨테이너}/Advanced/{변형}/preview/)
4. 3D 개별 Advanced       (Components/3D_Components/{장비}/Advanced/{변형}/preview/, meshesArea 제외)
5. 2D Standard            (Components/{범주}/{컴포넌트}/Standard/preview/)
6. 3D 개별 Standard       (Components/3D_Components/{장비}/Standard/preview/, meshesArea 제외)
```

#### 0-3. unprocessed 컴포넌트 식별

각 컴포넌트의 모든 preview.html을 스캔하여 다음 4종 시작 주석 등장 횟수를 집계:

```
[PREVIEW 인프라]
[PAGE]
[COMPONENT register.js 본문]
[PREVIEW 전용]
```

**unprocessed 판정**: 4종 중 **0개 또는 1개만** 등장하는 파일이 컴포넌트 안에 1개라도 있으면 그 컴포넌트는 unprocessed.

큐 순서대로 unprocessed 첫 컴포넌트를 다음 대상(`{컴포넌트경로}`)으로 결정한다.

모든 컴포넌트가 처리됨 → 전체 종료 후 사용자에게 완료 보고.

#### 0-4. 게이트 판정

- `gateCleared: false` AND `cycleCount >= 5` → 게이트 메시지 출력 후 종료:
  ```
  ⏸  첫 5 cycle 완료. 영역 식별이 의미적으로 올바른지 검수해 주세요.
  처리된 컴포넌트:
    1. {경로1}
    2. {경로2}
    ...
  검수 통과 시 `/apply-preview-labels-auto resume`으로 무인 모드 진입.
  ```

- `gateCleared: true` OR `cycleCount < 5` → Phase 1 진입.

---

### Phase 1. 서브에이전트 호출

`Agent` 도구로 `subagent_type=general-purpose`에 위임한다.

**프롬프트 템플릿** (매 사이클 `{컴포넌트경로}`, `{preview파일목록}` 동적 교체):

```
대상: 컴포넌트 `{컴포넌트경로}`의 모든 preview.html에 4종 라벨을 retroactive로 적용한다.
처리할 파일 목록:
  - {파일1}
  - {파일2}
  ...

## 배경

Renobit 웹빌더의 DesignComponentSystem은 Mixin 기반 컴포넌트 집합이다.
preview/{변형}.html의 <script> 안 코드는 빌더(다른 페이지 개발자)가 컴포넌트 사용법을 학습하는 가이드 역할이다.
너는 이미 생산된 preview에 4종 라벨 주석 블록을 추가하여 코드 영역을 시각적으로 구분한다.

**의미 변경 절대 금지** — 주석만 추가한다. 기존 코드는 1바이트도 수정하지 않는다.

## 필수 읽어야 할 문서 (순서대로)

1. `/.claude/skills/0-produce/_shared/preview-area-labeling.md` — 4종 라벨 SSOT (정확한 시작/종료 주석 텍스트)
2. `RNBT_architecture/DesignComponentSystem/Components/3D_Components/meshesArea/area_01/Advanced/hudInfo/preview/01_default.html` — 4종 라벨이 모두 적용된 첫 기준 예시
3. `{컴포넌트경로}/{Standard|Advanced/{변형}}/scripts/register.js` — `[COMPONENT register.js 본문]` 영역의 1:1 매핑 기준
4. `{컴포넌트경로}/CLAUDE.md` (있으면) — 컴포넌트 구현 명세

## 영역 식별 가이드

### [PREVIEW 인프라] — 운영 무관 보일러플레이트
- `new THREE.Scene()`, `new THREE.PerspectiveCamera`, `new THREE.WebGLRenderer`, `new GLTFLoader()`, `loader.load(...)` (3D)
- `loadComponentAssets(...)` (2D)
- async wrapper IIFE 시작 부분 / `await` 어셋 로드
- mock `instance` 객체 생성 (`{ id: 'preview-...', el: ..., threeElements: ... }`)
- `requestAnimationFrame` 렌더 루프, `OrbitControls`, originalColors 저장
- DOM 컨테이너 ID 획득, 페르소나 변형 라벨 표시 (2D)

### [PAGE] — 페이지 작성자가 운영에서 직접 작성할 코드
- `subscribe(...)` 호출 시뮬레이션
- 페이지 측 데이터 발행 시뮬레이션 — `setInterval(() => instance.method({response: ...}), N)`, `fetchAndApply()` 함수
- HUD/외부 DOM 정적 렌더 시뮬레이션 (mountHudCards 등) + `instance.hudRoot` 같은 외부 자원 주입
- 페이지 측 이벤트 리스너 (예: customEvents 핸들러)
- 페이지가 운영에서 작성하는 마크업 주입

### [COMPONENT register.js 본문] — 페이지는 작성하지 않음, 운영에서는 register.js가 자동 적용
- `applyXxxMixin(instance, {...})` 호출 (모두)
- `instance.커스텀메서드 = (...) => { ... }` 정의
- `subscriptions = {...}` 정의
- 운영에서 `subscribe go(...)` 배선이 들어가는 자리 (preview에서는 시뮬레이션)
- **scripts/register.js 본문과 1:1 대응되는 코드만 포함** — register.js를 직접 비교하여 누락/추가 없도록

### [PREVIEW 전용] — 운영 환경에는 없음
- `demo-btn` / `demo-controls` / `demo-info` / `event-log` 클래스 DOM 조작
- 강제 상태 토글 버튼 (예: "정상→경고→고장 순환", "All Warning", "All Error")
- eventLog/append/timestamp 헬퍼
- 슬라이더, axis 토글, 디버그 패널

## 라벨 시작 주석 (SSOT 정확 인용)

### [PREVIEW 인프라]
```
// ════════════════════════════════════════════════════════════════
//  [PREVIEW 인프라]  {간단 요약 — 예: Three.js Scene/Light/Loader}
//  ─ 아래 블록 전체는 운영 환경과 무관한 preview 전용 보일러플레이트입니다.
// ════════════════════════════════════════════════════════════════
```

### [PAGE]
```
// ════════════════════════════════════════════════════════════════
//  [PAGE]  {간단 요약 — 예: 데이터 발행 / HUD 마운트}
// ────────────────────────────────────────────────────────────────
//  운영: this.pageDataMappings = [
//          { topic: '...', datasetInfo: {...}, refreshInterval: 30000 }
//        ];
//  preview: setInterval + 직접 호출로 시뮬레이션
// ════════════════════════════════════════════════════════════════
```

### [COMPONENT register.js 본문]  ← 시작/종료 양쪽 필수, "— 끝" 표기 필수
```
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

### [PREVIEW 전용]
```
// ════════════════════════════════════════════════════════════════
//  [PREVIEW 전용]  데모 컨트롤 버튼 — 운영 환경에는 없음
// ════════════════════════════════════════════════════════════════
```

## 인라인 토픽 매핑 주석 (선택)

페이지 측 mock 데이터 발행 시뮬레이션 안에서 컴포넌트 핸들러 호출 직후 `// ← subscribe go({토픽})` 명시:

```javascript
instance.meshState.renderData({ response: statusResponse });   // ← subscribe go({equipmentStatus})
instance.renderHud({ response: hudResponse });                 // ← subscribe go({zoneHud})
```

토픽이 register.js의 `subscriptions = {...}` 또는 `subscribe go({...})`에 있는 경우에만 추가. 토픽 식별이 모호하면 추가하지 않는다.

## 부재 라벨 처리

모든 컴포넌트가 4종 라벨을 모두 갖지는 않는다:
- demo 버튼이 없는 단순 Standard preview → `[PREVIEW 전용]` 부재 가능
- 페이지 측 외부 DOM 주입이 없는 컴포넌트 → `[PAGE]`가 데이터 발행 시뮬레이션만 차지할 수 있음
- 2D 변형 중 mock instance가 거의 비어있는 경우 → `[PREVIEW 인프라]`가 매우 짧을 수 있음

**최소 요건**: `[COMPONENT register.js 본문]` (시작 + "— 끝" 양쪽)은 **반드시** 존재. 나머지 3종 중 최소 2종이 등장해야 한다.

## 절차

각 preview.html에 대해:

1. `<script>` 안 코드를 영역 식별 가이드에 따라 4분할
2. 각 영역 시작 위치에 SSOT 정확 인용 라벨 시작 주석 삽입
3. `[COMPONENT register.js 본문]`만 종료 주석("— 끝") 추가
4. 인라인 토픽 매핑 주석 추가 (식별 가능한 경우만)
5. 기존 코드는 1바이트도 수정하지 않음 (들여쓰기 유지, 변수명 유지, 로직 무수정)

## 금지 사항

- ❌ 코드 의미 변경 (주석만 추가)
- ❌ 새 코드 추가 (라벨 주석 외)
- ❌ 라벨 형식 임의 변경 (SSOT 정확 인용 강제)
- ❌ 커밋 (메인 루프가 담당)
- ❌ 사용자 승인 요청
- ❌ 영역 분류가 모호하다고 임의로 추측 — 모호하면 반환에 명시

## 반환 형식 (200단어 이내)

- 처리한 파일 목록과 각 파일의 라인 수 변화 (예: "01_default.html: 187 → 218 lines, +31 라벨 주석")
- 각 파일의 4종 라벨 등장 여부 (예: "01_refined.html: 4/4, 02_warm.html: 3/4 ([PREVIEW 전용] 부재 — demo 버튼 없음)")
- 영역 분류가 모호했던 코드 블록 (있으면 1줄, 없으면 "없음")
- register.js와 [COMPONENT register.js 본문] 영역의 1:1 일치 self-check 결과 (예: "register.js의 5개 호출 모두 본문 영역에 등장 + 추가 코드 없음")
```

**호출**:

```javascript
Agent({
    description: "{컴포넌트경로} preview 라벨 적용",
    subagent_type: "general-purpose",
    prompt: "(위 템플릿)"
})
```

---

### Phase 2. 결과 확인 + 커밋 또는 격리

Agent 반환 후:

#### 2-1. grep 자동 검증

처리된 각 preview에서 다음을 확인:

```bash
# 4종 라벨 등장 횟수
grep -c "\[PREVIEW 인프라\]" {파일}
grep -c "\[PAGE\]" {파일}
grep -c "\[COMPONENT register.js 본문\]" {파일}
grep -c "\[PREVIEW 전용\]" {파일}
```

**검증 통과 조건**:
- 4종 중 **최소 3종** 등장
- `[COMPONENT register.js 본문]` 시작과 "— 끝" **양쪽** 등장 (등장 횟수 2 이상)

#### 2-2. 분기

**검증 통과** → 커밋:
```
docs(preview): {컴포넌트경로} preview에 4종 라벨 적용 — {Agent 요약 첫 줄}
```

**검증 실패** → `.claude/_data/preview-labeling-skipped.md`에 한 줄 append:
```
| {컴포넌트경로} | {파일명} | {실패사유: 라벨 N/4만 등장 또는 종료 주석 누락 등} | {ISO 시각} |
```

다음 사이클 진행. **즉시 중단하지 않는다** — 라벨 추가는 의미 중립적이므로 단일 실패가 전체 진행을 막아서는 안 됨.

#### 2-3. progress.json 갱신

성공/실패 무관하게 갱신:
```json
{
  "cycleCount": (이전 + 1),
  "lastProcessedComponent": "{컴포넌트경로}",
  "gateCleared": (resume이 들어왔으면 true, 아니면 기존 값)
}
```

#### 2-4. 누적 실패 안전장치

`skipped.md`의 행 수가 **50을 초과**하면 메인 루프 중단 권고 메시지 출력 후 종료:
```
⚠️ skipped.md 누적량이 50 초과. 영역 식별 휴리스틱이 광범위하게 실패 중일 가능성.
SKILL.md의 영역 식별 가이드를 보강한 뒤 재시작 권장.
현재까지 처리: N / 245
```

---

### Phase 3. 다음 사이클

- `cycleCount < 5` → 다음 unprocessed 컴포넌트로
- `cycleCount == 5` AND `gateCleared: false` → Phase 0의 게이트 메시지 출력 후 종료
- `cycleCount >= 5` AND `gateCleared: true` → 큐 소진까지 계속

---

## 종료 보고

### 정상 종료

```
✅ Preview 라벨 retroactive 적용 완료.
처리된 컴포넌트: N / 245
누락 (skipped.md): M
커밋: N개

skipped.md를 검토하여 잔여 항목을 수동 처리하세요.
```

### 게이트 일시정지 (cycleCount == 5)

```
⏸  첫 5 cycle 완료. 영역 식별 검수 대기.
처리된 컴포넌트:
  1. {경로1}
  2. {경로2}
  3. {경로3}
  4. {경로4}
  5. {경로5}

각 preview의 4종 라벨이 의미적으로 올바른 위치에 있는지 검토하세요.
오분류 발견 시 SKILL.md의 영역 식별 가이드를 보강한 뒤 진행하는 것을 권장.

검수 통과 시: /apply-preview-labels-auto resume
```

### 안전장치 중단 (skipped > 50)

```
⚠️ 중단: skipped.md 누적량 {N} 초과 (임계값 50)
영역 식별 휴리스틱이 광범위하게 실패 중일 가능성.
SKILL.md의 영역 식별 가이드를 보강한 뒤 재시작하세요.

처리된 컴포넌트: N / 245
```

---

## 금지 사항

- ❌ 사용자 중간 승인 (검수 게이트 외)
- ❌ 한 사이클 안에서 여러 컴포넌트 처리
- ❌ 메인이 직접 라벨 적용 (Agent 위임 강제)
- ❌ Agent 실패를 덮고 무한 진행 (skipped.md 50 임계 안전장치)
- ❌ 라벨 형식 임의 변경 (SSOT 정확 인용 강제)
- ❌ register.js·CLAUDE.md·manifest.json 등 preview 외 파일 수정

---

## 참조 문서

- 4종 라벨 SSOT: `/.claude/skills/0-produce/_shared/preview-area-labeling.md`
- 참조 예제: `RNBT_architecture/DesignComponentSystem/Components/3D_Components/meshesArea/area_01/Advanced/hudInfo/preview/01_default.html`
- 메인 루프 패턴 참고: `/.claude/skills/0-produce/produce-standard-auto/SKILL.md`
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
