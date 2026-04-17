---
name: produce-3d-standard-auto
description: 3D Standard(01 status) 컴포넌트를 서브에이전트 기반으로 한 장비씩 독립 컨텍스트에서 완전 자동 생산합니다. 메인은 Phase 0(models/ 알파벳 순 탐색) → Agent 호출 → Phase 2(커밋) → 반복.
---

# 3D Standard 컴포넌트 완전 자동 생산

## 목표

`DesignComponentSystem/models/` 아래의 모델 폴더를 **알파벳 순서**로 순회하며, 대응하는 `Components/3D_Components/{컴포넌트경로}/Standard`가 없는 장비를 **Standard(01 status)** 생산한다.

> `{컴포넌트경로}` = 개별 장비면 `{장비명}`, 컨테이너면 `meshesArea/{컨테이너명}`.
한 번 실행하면 **남은 모든 3D Standard 대상**을 순차로 소화한다.
각 사이클은 **독립된 서브에이전트**가 처리하므로 메인 컨텍스트는 누적되지 않는다.

기존 `produce-3d-standard-loop`(수동, 승인 기반)의 완전 자동 대체 버전.

---

## 구조 원칙

```
[메인 루프]
    │
    ├─ Phase 0: models/ 알파벳 순 탐색 → Standard 미완료인 첫 번째 장비 선택
    ├─ Phase 1: Agent(subagent_type=general-purpose) 호출 → 단일 장비 Standard 생산 위임
    ├─ Phase 2: 결과 확인 + 커밋
    └─ Phase 3: 다음 대상으로 반복 (남은 대상이 없을 때까지)
```

- **매 사이클마다 새 Agent 호출** — 서브에이전트는 독립된 컨텍스트에서 실행되고, 완료 후 요약만 반환
- **사용자 승인 포인트 없음** — 서브에이전트가 기능 분석/Mixin 매핑/CLAUDE.md/코드/manifest까지 자율 결정
- **실패 시 즉시 중단** — Hook 검증 실패, manifest JSON 오류, Agent 실패 보고 → 메인이 중단하고 사용자에게 알림

---

## 메인 루프 절차

### Phase 0. 다음 대상 파악

매 사이클 시작 시 실행한다.

models/ 는 두 종류의 폴더로 구성된다:
- **개별 장비 모델 폴더** — `models/{장비명}/` (예: `models/BATT/`, `models/CoolingTower/`)
- **컨테이너 그룹 폴더** — `models/meshesArea/{컨테이너명}/` (예: `models/meshesArea/area_01/`)
  `meshesArea/` 자체는 장비가 아닌 **그룹 폴더**이므로 순회 대상에서 제외한다.

1. 개별 장비 후보 수집 (알파벳 순):
   ```bash
   ls -d RNBT_architecture/DesignComponentSystem/models/*/ | grep -v '/meshesArea/$' | sort
   ```

2. 컨테이너 후보 수집 (알파벳 순):
   ```bash
   ls -d RNBT_architecture/DesignComponentSystem/models/meshesArea/*/ 2>/dev/null | sort
   ```

3. 두 목록을 순서대로 병합 (개별 → 컨테이너) 후 각 항목에 대해 Standard 완료 여부 확인:
   - 개별: `Components/3D_Components/{장비명}/Standard/scripts/register.js`
   - 컨테이너: `Components/3D_Components/meshesArea/{컨테이너명}/Standard/scripts/register.js`

   `register.js`가 없는 첫 번째 항목 = 다음 대상.

4. 유형 결정:
   - 경로에 `meshesArea/` 가 포함되면: **컨테이너** → `create-3d-container-component` 사용
   - 그 외: **개별** → `create-3d-component` 사용

남은 대상이 없으면 **전체 루프 종료** 후 사용자에게 완료 보고.

---

### Phase 1. 서브에이전트 호출

`Agent` 도구로 `subagent_type=general-purpose`에 위임한다.

**프롬프트 템플릿** (매 사이클 `{컴포넌트경로}`, `{장비명}`, `{모델경로}`, `{유형}`, `{개발스킬}` 교체):

- `{컴포넌트경로}`: 개별이면 `{장비명}`, 컨테이너면 `meshesArea/{장비명}`
- `{모델경로}`: 개별이면 `{장비명}`, 컨테이너면 `meshesArea/{장비명}`

```
대상: 3D 컴포넌트 `3D_Components/{컴포넌트경로}/Standard`를 처음부터 끝까지 생산한다.
유형: {개별 또는 컨테이너}
변형: Standard (01 status) — MeshState 단독

## 배경

Renobit 웹 빌더의 DesignComponentSystem은 Mixin 기반 3D 컴포넌트 집합이다.
너는 단일 장비 하나의 Standard 변형을 완결하여 생산하고 요약만 반환한다.
사용자 승인이 필요 없는 완전 자동 모드로 동작한다.

## 필수 읽어야 할 문서 (순서대로)

1. `/.claude/skills/SHARED_INSTRUCTIONS.md` — 공통 규칙
2. `/.claude/skills/0-produce/produce-component/SKILL.md` — 생산 프로세스
3. `/.claude/skills/2-component/{개발스킬}/SKILL.md` — 3D 구현 ({개별: create-3d-component / 컨테이너: create-3d-container-component})
4. `/.claude/guides/CODING_STYLE.md` — 코딩 스타일
5. `/RNBT_architecture/DesignComponentSystem/Mixins/README.md` — Mixin 카탈로그
6. `/RNBT_architecture/DesignComponentSystem/Mixins/MeshStateMixin.md` — Standard에서 사용하는 핵심 Mixin
7. `/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md` — 시스템 설계
8. `Components/3D_Components/{컴포넌트경로}/CLAUDE.md` — 장비 정의 (이미 존재하면)

## 참고 사례 (직전 완성품) — 구조적 참고만

> 아래 사례는 **구조적 참고용**(Mixin 적용 · register.js 패턴 · beforeDestroy.js 정리 순서)이다.

- 개별 단위 참고: `Components/3D_Components/BATT/` — 대표 개별 단위 컴포넌트
- 컨테이너 참고: `Components/3D_Components/meshesArea/area_01/` — 대표 컨테이너 컴포넌트

## 산출물 (모두 자동으로 작성)

1. `{컴포넌트경로}/CLAUDE.md` — 장비 정의 (없으면 생성, 있으면 Standard 섹션 추가)
2. `{컴포넌트경로}/Standard/CLAUDE.md` — Standard 변형 구현 명세
3. `{컴포넌트경로}/Standard/scripts/register.js` — MeshState Mixin 적용 + 구독
4. `{컴포넌트경로}/Standard/scripts/beforeDestroy.js` — 정리 코드
5. `{컴포넌트경로}/Standard/preview/01_default.html` — 독립 실행 프리뷰 (모델 있으면 로드, 없으면 placeholder)
6. `DesignComponentSystem/manifest.json` — 해당 장비의 `sets` 배열에 Standard 엔트리 추가 (경로 값도 `{컴포넌트경로}` 반영)

## 모델 참조

모델은 `DesignComponentSystem/models/{모델경로}/01_default/` 아래에 있다.
GLTF 파일을 읽어 meshName을 확인하고 register.js에 반영한다.
컨테이너의 경우 preview HTML의 GLTF 로드 상대 경로는 `meshesArea/` 가 들어가므로 `../`를 한 단계 더 올려야 함에 주의.

## 3D Standard 핵심 — 2D와의 차이

- 디자인 페르소나(4종 CSS 변형) 없음. Standard = MeshState 단독.
- views/styles 폴더 없음. 3D는 GLTF 모델이 시각 표현.
- preview는 모델 변종 기반 (01_default.html).
- 개별 단위: meshName 하드코딩, 장비 고유 이벤트명.
- 컨테이너: resolveMeshName 동적 식별, '@meshClicked' 범용 이벤트.

## 필수 제약

- 컴포넌트 CLAUDE.md의 구현 명세를 코드에서 일치시킨다.
- Hook 검증(P0~P3) 통과를 보장한다.
- manifest.json 수정 후 `node -e "JSON.parse(...)"` 로 JSON 유효성을 직접 검증한다.
- 기존 완성된 컴포넌트 파일은 수정하지 않는다.
- 커밋은 하지 않는다 (메인 루프가 커밋한다).
- **신규 Mixin 생성 금지.** 기존 Mixin + 커스텀 메서드 조합으로만 해결한다. 반복 패턴이 의심되어도 이 사이클에서는 커스텀 메서드로 완결하고, 반환의 "발견한 문제/의문점"에 `반복 패턴 후보: {설명}`으로 기록만 남긴다.

## 반환 형식 (200단어 이내)

- 생산한 컴포넌트 경로
- 유형 (개별/컨테이너) + Mixin (MeshState)
- 주요 구독 토픽
- 이벤트 매핑 (있으면)
- 모델 상태 (meshName 확인 여부)
- 특이 결정사항
- 발견한 문제/의문점 (있으면)
```

**호출**:

```javascript
Agent({
    description: "3D {장비명} Standard 생산",
    subagent_type: "general-purpose",
    prompt: "(위 템플릿)"
})
```

---

### Phase 2. 결과 확인 + 커밋

Agent 반환 후:

1. 생성된 파일 존재 확인:
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/3D_Components/{컴포넌트경로}/Standard/{scripts,preview}/
   ls RNBT_architecture/DesignComponentSystem/Components/3D_Components/{컴포넌트경로}/Standard/scripts/register.js
   ls RNBT_architecture/DesignComponentSystem/Components/3D_Components/{컴포넌트경로}/Standard/scripts/beforeDestroy.js
   ```
   
2. manifest.json JSON 유효성 재확인:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('RNBT_architecture/DesignComponentSystem/manifest.json','utf8')); console.log('OK')"
   ```

3. 커밋:
   ```
   feat: 3D_Components/{컴포넌트경로}/Standard 컴포넌트 자동 생산 — {Agent 요약 첫 줄}
   ```

4. 실패 감지:
   - 파일 누락 → 중단, 사용자에게 "Phase 2 파일 검증 실패: {누락 목록}" 보고
   - JSON 오류 → 중단, 사용자에게 "manifest.json 파손: {오류}" 보고
   - Agent가 실패를 보고 → 중단, Agent 요약 그대로 사용자에게 전달

---

### Phase 3. 다음 사이클

남은 대상이 있으면 Phase 0부터 다시 실행. 없으면 종료.

---

## 종료 보고

모든 대상 소화 완료 시:

```
✅ 3D Standard 전체 생산 완료.
생산된 장비: N개
커밋: N개
```

중단 시:

```
⚠️ 중단: {사유}
현재까지 생산: N개
마지막 대상: {장비명}
재개하려면 `/produce-3d-standard-auto`를 다시 실행하세요.
```

---

## 금지 사항

- ❌ 사용자에게 중간 승인 요청 (완전 자동 모드)
- ❌ 한 사이클 안에서 여러 장비 생산 (Agent는 반드시 1 장비만)
- ❌ Agent 호출 없이 메인이 직접 컴포넌트 생산
- ❌ 실패를 덮고 다음 사이클 진행
- ❌ Advanced 변형 생산 (이 루프는 Standard 전용)

---

## 참조 문서

- 수동 버전: `/.claude/skills/0-produce/produce-3d-standard-loop/SKILL.md` (승인 기반, 기존 유지)
- 생산 프로세스: `/.claude/skills/0-produce/produce-component/SKILL.md`
- 3D 개별 구현: `/.claude/skills/2-component/create-3d-component/SKILL.md`
- 3D 컨테이너 구현: `/.claude/skills/2-component/create-3d-container-component/SKILL.md`
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
