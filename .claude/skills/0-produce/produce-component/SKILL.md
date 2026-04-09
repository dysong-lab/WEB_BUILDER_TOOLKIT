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

**매번 다시 읽어야 합니다.**

1. [PRODUCTION_PROCESS.md](/RNBT_architecture/DesignComponentSystem/docs/PRODUCTION_PROCESS.md) — 전체 프로세스
2. [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) — 기능의 정의, 핵심 구조
3. [Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md) — 현재 Mixin 카탈로그

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
| 팝업/오버레이가 필요한가? | ShadowPopupMixin |
| 3D Mesh 색상을 제어하는가? | MeshStateMixin |
| 카메라 포커스가 필요한가? | CameraFocusMixin |
| 기존 Mixin으로 부족한가? | 커스텀 속성/메서드 정의 |
| Mixin 자체가 존재하지 않는가? | → Step 3-1로 |

**분기**:

```
기능별 Mixin 매핑
    │
    ├── 기존 Mixin으로 충분 → Step 4로
    │
    ├── Mixin + 커스텀 속성/메서드 조합 → Step 4로
    │
    └── 신규 Mixin 필요 → Step 3-1
```

#### Step 3-1. 신규 Mixin 구현 (필요 시)

```
create-mixin-spec → 명세서 작성 → 사용자 승인
    → implement-mixin → 구현 + 문서 + 카탈로그 업데이트
    → Step 3로 복귀하여 새 Mixin으로 매핑 확정
```

**사용자에게 보고**: 각 기능의 구현 수단 (Mixin / 커스텀 메서드 / 신규 Mixin)을 제시한다.

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
| Mixin 명세서 작성 | [create-mixin-spec](/.claude/skills/5-mixin/create-mixin-spec/SKILL.md) |
| Mixin 구현 | [implement-mixin](/.claude/skills/5-mixin/implement-mixin/SKILL.md) |

---
