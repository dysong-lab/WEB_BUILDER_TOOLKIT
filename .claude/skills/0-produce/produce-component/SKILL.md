---
name: produce-component
description: 컴포넌트 생산 프로세스의 진입점. 범주 확인 → 기능 분석 → Mixin 매핑 → 컴포넌트 CLAUDE.md 작성까지 안내한 후, 적절한 개발 스킬(2D/3D)을 호출합니다.
---

# 컴포넌트 생산

PRODUCTION_PROCESS.md의 Step 3~7을 따라 컴포넌트를 생산한다.

> **프로세스 문서**: [PRODUCTION_PROCESS.md](/RNBT_architecture/DesignComponentSystem/docs/PRODUCTION_PROCESS.md)
> **시스템 설계**: [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md)

---

## 작업 전 필수 확인

1. [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) — 공통 규칙
2. [PRODUCTION_PROCESS.md](/RNBT_architecture/DesignComponentSystem/docs/PRODUCTION_PROCESS.md) — 전체 프로세스
3. [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) — 기능의 정의, 핵심 구조
4. [Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md) — 현재 Mixin 카탈로그

---

## 프로세스

### Step 1. 범주 확인

컴포넌트가 속할 범주의 CLAUDE.md를 읽는다.

```
경로: Components/{범주명}/CLAUDE.md
또는: Components/3D_Components/{범주명}/CLAUDE.md
```

- 범주가 존재하면 → 역할을 파악한다
- 범주가 없으면 → 새로 만든다 (MD3 정의 / 역할)

**사용자에게 보고**: "이 범주의 역할은 [X]입니다. 이 범위 안에서 컴포넌트를 정의하겠습니다."

---

### Step 2. 기능 분석 + 세분화

범주 역할 범위 안에서 컴포넌트의 기능을 분석한다.

**절차**:

1. MD3 명세(2D) 또는 도메인 요구(3D)에서 **행동/상태/상호작용**을 도출한다
   - MD3 WebFetch 실패 시: 학습 데이터 + WebSearch로 대체하고, 결과를 사용자에게 검증받는다
2. 도출된 각 항목을 "기능의 정의"로 검증한다:
   - 목적이 무엇인가? (보편화된 행위)
   - 수단이 특정되는가?
   - 수단이 특정되면 → 기능이다
   - 수단이 특정되지 않으면 → 더 분해한다
3. 기능 목록을 정리한다

```
예: TopAppBar
1. 페이지 제목 표시 — appBarInfo 토픽으로 수신한 데이터를 제목 영역에 렌더
2. 네비게이션 트리거 — nav-icon 클릭 시 @navigationClicked 발행
3. 액션 트리거 — action 버튼 클릭 시 @actionClicked 발행
```

**사용자에게 보고**: 기능 목록을 제시하고 승인을 받는다.

---

### Step 3. Mixin 매핑

승인된 기능 목록에서 구현 수단을 결정한다.

**각 기능에 대해**:

| 질문 | 결과 |
|------|------|
| 고정 DOM에 데이터를 매핑하는가? | FieldRenderMixin |
| 배열을 template으로 반복 렌더하는가? | ListRenderMixin |
| 계층적 데이터를 트리로 렌더하는가? | TreeRenderMixin |
| 팝업/오버레이가 필요한가? | ShadowPopupMixin |
| 3D 팝업/오버레이가 필요한가? | 3DShadowPopupMixin |
| 3D Mesh 색상을 제어하는가? | MeshStateMixin |
| 3D Mesh 선택 강조가 필요한가? | MeshHighlightMixin |
| 3D Mesh 표시/숨김 제어가 필요한가? | MeshVisibilityMixin |
| 카메라 포커스가 필요한가? | CameraFocusMixin |
| 3D 모델 애니메이션이 필요한가? | AnimationMixin |
| 3D 모델 절단면이 필요한가? | ClippingPlaneMixin |
| 기존 Mixin으로 부족한가? | 커스텀 속성/메서드 정의 |
| Mixin 자체가 존재하지 않는가? | → 커스텀 메서드로 처리 (Step 3-1은 수동 전용) |

**분기**:

```
기능별 Mixin 매핑
    │
    ├── 기존 Mixin으로 충분          → Step 4로
    │
    └── Mixin + 커스텀 속성/메서드 조합 → Step 4로
```

> 기존 Mixin으로 완전히 커버되지 않는 새 패턴이어도 이 생산 루프에서는 **커스텀 메서드로 해결**한다. 새 Mixin 생성은 본 SKILL의 대상이 아니다 (Step 3-1 참조).

#### Step 3-1. 신규 Mixin 구현 (수동 전용 — 루프에서 진입하지 않음)

이 단계는 컴포넌트 생산 루프에서 **자동으로 진입하지 않는다**. 반복 패턴이 `audit-project`나 사용자 리뷰로 감지되면, 사용자가 직접 `create-mixin-spec` / `implement-mixin` 스킬을 호출하는 **별도 수동 작업**이다.

```
create-mixin-spec → 명세서 작성 → 사용자 승인
    → implement-mixin → 구현 + 문서 + 카탈로그 업데이트
    → 필요 시 기존 컴포넌트를 수동으로 새 Mixin에 리팩터 (선택)
```

**사용자에게 보고**: 각 기능의 구현 수단 (Mixin / 커스텀 메서드)을 제시한다. 반복 패턴 후보가 의심되면 보고에 메모만 남기고 새 Mixin 생성에 진입하지 않는다.

---

### Step 4. 컴포넌트 CLAUDE.md 작성

기능 정의 + 구현 명세를 컴포넌트 CLAUDE.md에 기록한다.

```
# {컴포넌트명}

## 기능 정의

1. {기능 1} — {설명}
2. {기능 2} — {설명}

---

## 구현 명세

### Mixin

{MixinName} (또는 "Mixin 불필요")

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| ... | ... | ... |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| ... | ... |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| ... | ... | ... |

### 커스텀 메서드 (필요 시)

| 메서드 | 설명 |
|--------|------|
| ... | ... |

### 페이지 연결 사례

...

### 디자인 변형

| 파일 | 설명 |
|------|------|
| ... | ... |
```

**사용자에게 보고**: CLAUDE.md 내용을 제시하고 승인을 받는다.

---

### Step 5. 컴포넌트 개발

CLAUDE.md 명세가 승인되면, 컴포넌트 유형에 따라 개발 스킬을 호출한다.

| 컴포넌트 유형 | 호출 스킬 |
|-------------|----------|
| 2D (HTML/CSS + Mixin) | `create-2d-component` |
| 3D 개별 단위 (1 GLTF = 1 Mesh) | `create-3d-component` |
| 3D GLTF 컨테이너 (1 GLTF = N Mesh) | `create-3d-container-component` |

개발 스킬은 CLAUDE.md 명세를 코드로 변환하는 역할만 한다.

---

### Step 5-1. 디자인 페르소나 & CSS 조달 규칙 (HTML/CSS 생성 시 공통)

HTML/CSS를 생성하는 모든 경로에 **공통 적용**된다. 대상:

- 2D 컴포넌트의 4개 페르소나 변형 (`views/0{1..4}_*.html`, `styles/0{1..4}_*.css`)
- 3D 컴포넌트의 팝업 HTML/CSS (`publishCode` 계열 포함, 팝업이 페르소나 4종을 따르는 경우)

#### 페르소나 4종 — 정의 출처

4개 페르소나의 **유일한 진실 소스**는 [`/.claude/skills/6-design/create-html-css/SKILL.md`](/.claude/skills/6-design/create-html-css/SKILL.md)의 "디자인 페르소나" 섹션이다. 파일명은 루프 약어, 실제 프로파일은 SKILL.md의 Persona A~D:

| 파일명           | SKILL.md 페르소나             |
|------------------|-------------------------------|
| `01_refined`     | Persona A: Refined Technical  |
| `02_material`    | Persona B: Material Elevated  |
| `03_editorial`   | Persona C: Minimal Editorial  |
| `04_operational` | Persona D: Dark Operational   |

각 페르소나의 8가지 경향 프로파일(색상 철학 · 타이포그래피 · 간격 리듬 · 상태 표현 · 레이아웃 · 시각적 깊이 · Border Radius · 모션)은 SKILL.md 표를 직접 따른다.

#### CSS 생성 시 필수 참고 문서

매 CSS 작성 사이클마다 다음을 읽는다 (값 복사가 아니라 경향 체감용):

1. [`/.claude/skills/6-design/create-html-css/SKILL.md`](/.claude/skills/6-design/create-html-css/SKILL.md) — Persona A~D 프로파일 표
2. `/Figma_Conversion/DesignSystemGuide/Design system01-Dark/Design system01-Dark.css`
3. `/Figma_Conversion/DesignSystemGuide/Design system01-Light/Design system01-Light.css`
4. `/Figma_Conversion/DesignSystemGuide/Design system02-Dark/Design system02-Dark.css`
5. `/Figma_Conversion/DesignSystemGuide/Design system02-Light/Design system02-Light.css`

#### 참고 사례 (직전 완성품)의 역할 — 구조적 참고만

기존 완성 컴포넌트의 CSS는 **Mixin 조립 / HTML 구조 / cssSelectors 계약 / 이벤트 패턴**을 참고하기 위한 사례다. 색상·타이포·간격·그림자·모서리 같은 **시각적 토큰은 Persona 프로파일이 최종 근거**이며, 기존 사례 CSS가 프로파일과 어긋나면 새 컴포넌트에서는 프로파일을 따르고 과거 불일치는 무시한다.

#### 제약

- CSS 토큰이 Persona 프로파일과 충돌할 경우 **프로파일을 따른다**.
- 직전 사례 CSS를 복제하지 않는다 (구조는 복제 허용, 시각 토큰은 재해석).
- Persona 프로파일을 **의도적으로** 벗어나는 경우, 그 근거를 CLAUDE.md 또는 루프 반환 요약에 명시한다.

---

### Step 6. 검증

개발 스킬 완료 후:

1. Hook 자동 검증 (P0~P3) 통과 확인
2. CLAUDE.md ↔ 코드 정합성 확인
3. preview 동작 확인

---

## 금지 사항

- ❌ 기능 분석 없이 바로 코드 작성
- ❌ Mixin 매핑 없이 개발 스킬 호출
- ❌ 사용자 승인 없이 다음 단계 진행 (기능 목록, CLAUDE.md 모두 승인 필요)
- ❌ 범주 역할 범위를 벗어난 기능 정의

---

## 관련 자료

| 문서 | 위치 |
|------|------|
| 생산 프로세스 | [PRODUCTION_PROCESS.md](/RNBT_architecture/DesignComponentSystem/docs/PRODUCTION_PROCESS.md) |
| 시스템 설계 | [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) |
| Mixin 카탈로그 | [Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md) |
| 2D 컴포넌트 개발 | [create-2d-component](/.claude/skills/2-component/create-2d-component/SKILL.md) |
| 3D 개별 단위 개발 | [create-3d-component](/.claude/skills/2-component/create-3d-component/SKILL.md) |
| 3D 컨테이너 개발 | [create-3d-container-component](/.claude/skills/2-component/create-3d-container-component/SKILL.md) |
| 3D 대량생산 루프 | [produce-3d-standard-loop](/.claude/skills/0-produce/produce-3d-standard-loop/SKILL.md) |
| Mixin 명세서 작성 | [create-mixin-spec](/.claude/skills/5-mixin/create-mixin-spec/SKILL.md) |
| Mixin 구현 | [implement-mixin](/.claude/skills/5-mixin/implement-mixin/SKILL.md) |

---
