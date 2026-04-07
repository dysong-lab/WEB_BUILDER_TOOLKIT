# 기능이 있는 디자인 컴포넌트 생산 프로세스

## 목적

이 문서는 **"기능이 있는 디자인 컴포넌트"**를 대량 생산하기 위한 확정된 프로세스를 정의한다.

"기능이 있는 디자인 컴포넌트"란, 시각적 디자인(HTML/CSS)에 **데이터 바인딩, 상호작용, 상태 관리 등의 기능(Mixin + 커스텀 속성/메서드)**이 결합된 컴포넌트를 말한다.

---

## 프로세스 개요

```
Phase A: 기반 (1회, 완료)
  Step 1   개념 정의
  Step 2   인터페이스 설계

Phase B: 범주 선택 (반복 시작점) ◀──────────────────────────┐
  Step 3   컴포넌트 범주 목록화/선택                          │
       │                                                     │
Phase C: Standard 기능 (범주당 1회)                           │
  Step 4   기능 분석 + 개별 컴포넌트 세분화                     │
  Step 5   Mixin 매핑 (필요 시 구현)                           │
  Step 6   컴포넌트 개발                                      │
  Step 7   검증                                               │
       │                                                     │
Phase D: Advanced 기능 (프로젝트 요구 시 반복)                  │
  Step 8   Advanced 기능 분석                                 │
  Step 9   Advanced 컴포넌트 개발                              │
  Step 10  검증                                               │
       │                                                     │
  ◀── 다음 범주로 ──────────────────────────────────────────┘
```

**핵심 구조**:
- **Phase C(Standard)는 범주당 1회**. MD3 명세가 정의한 기능을 구현하면 끝. 이후 Standard는 보수(버그 수정, MD3 규격 변경 대응)만 한다.
- **Phase D(Advanced)는 반복**. 프로젝트 요구가 발생할 때마다 진입한다. 모든 확장은 Advanced다.
- **반복의 시작점은 Step 3(범주 선택)**. 한 범주의 Standard를 완료하면 다음 범주로 이동한다.

---

## Phase A: 기반

### Step 1. 개념 정의

> **기능과 컴포넌트란 무엇인가?**

| 항목 | 설명 |
|------|------|
| **입력** | 도메인 분석, 플랫폼 제약 |
| **활동** | "기능"의 정의 수립 (기능 = 보편화된 목적 + 특수한 수단), 컴포넌트와 기능의 관계 정의 (빨간 전화 / 파란 전화 = 다른 컴포넌트, 같은 기능) |
| **출력** | COMPONENT_SYSTEM_DESIGN.md "기능의 정의" 섹션 |
| **완료 기준** | "이것은 기능인가, 목적인가, 메커니즘인가?"를 판단할 수 있는 프레임 존재 |
| **현재 상태** | ✅ 완료 |

**참조**: [COMPONENT_SYSTEM_DESIGN.md](architecture/COMPONENT_SYSTEM_DESIGN.md) §기능의 정의

---

### Step 2. 인터페이스 설계

> **기능은 컴포넌트에 어떻게 입혀지는가?**

| 항목 | 설명 |
|------|------|
| **입력** | Step 1의 개념 정의 + 런타임 프레임워크 제약 (상속 체인 소유) |
| **활동** | Mixin 주입 방식 설계 (네임스페이스, apply 함수), cssSelectors/datasetAttrs 규약 정의, 라이프사이클 정의 (register → subscribe → bindEvents → beforeDestroy) |
| **출력** | COMPONENT_SYSTEM_DESIGN.md "핵심 구조", "10가지 원칙", "선택자 계약" 섹션 + WHY_MIXIN.md + SELECTORS_AS_CONTRACT.md + KEY_AS_CONNECTOR.md |
| **완료 기준** | "Mixin을 어떻게 적용하고, DOM을 어떻게 연결하고, 정리는 어떤 순서로 하는가?"에 대한 답이 코드로 실증됨 |
| **현재 상태** | ✅ 완료 |

**참조**: [COMPONENT_SYSTEM_DESIGN.md](architecture/COMPONENT_SYSTEM_DESIGN.md) §핵심구조, [WHY_MIXIN.md](architecture/WHY_MIXIN.md), [SELECTORS_AS_CONTRACT.md](architecture/SELECTORS_AS_CONTRACT.md), [KEY_AS_CONNECTOR.md](architecture/KEY_AS_CONNECTOR.md)

---

## Phase B: 범주 선택 (반복 시작점)

### Step 3. 컴포넌트 범주 목록화 / 다음 범주 선택

> **어떤 종류의 컴포넌트가 존재하고, 다음에 어떤 범주를 작업할 것인가?**

| 항목 | 설명 |
|------|------|
| **입력** | 업계 표준 (MD3 등), 도메인 요구 |
| **활동** | (최초) 2D: MD3 범주 체계 채택, 3D: 도메인 기반 모델링 단위로 샘플 작성. (반복 시) 다음 작업할 범주를 선택한다. |
| **출력** | `Components/` 하위 카테고리 디렉토리 + 각 카테고리의 CLAUDE.md (MD3 정의 + 역할 + 핵심 특성) |
| **완료 기준** | 범주 목록이 존재하고, 작업할 범주가 선택됨 |
| **현재 상태** | ✅ 목록화 완료 (2D: 25개, 3D: 7종) — Standard 완료 범주: AppBars(부분) |

### 2D와 3D의 경로 차이

| | 2D 컴포넌트 | 3D 컴포넌트 |
|--|------------|------------|
| **범주 기준** | MD3 (업계 표준) | 도메인 (장비 유형) |
| **Standard 기능 기준** | MD3 명세의 행동/상태/상호작용 | 장비 모니터링의 공통 패턴 (상태 표시, 카메라, 팝업) |
| **Advanced 기능 기준** | 프로젝트 요구사항 | 프로젝트 요구사항 |
| **세분화 단위** | MD3 세부 컴포넌트 (TopAppBar, IconButtons 등) | 기능 변형 (01_status, 02_camera, 03_popup) |

이후 Phase C~D의 단계는 2D/3D 모두에 적용되지만, **Standard 기능의 출처**가 다르다.

---

## Phase C: Standard 기능 사이클

> Standard 기능 = MD3 명세에서 정의하는 해당 컴포넌트의 행동, 상태, 상호작용
> (3D의 경우: 도메인에서 정의하는 장비 모니터링의 공통 패턴)
>
> **Standard는 범주당 1회 수행한다.** MD3가 정의한 기능을 구현하면 완료.
> 이후 Standard는 보수(버그 수정, MD3 규격 변경 대응)의 형태로만 수정된다.
> 모든 확장은 Phase D(Advanced)에서 처리한다.

### Step 4. Standard 기능 분석 + 개별 컴포넌트 세분화

> **이 범주는 어떤 기능을 가져야 하고, 그에 따라 어떤 컴포넌트로 나뉘는가?**

기능 분석과 세분화는 분리할 수 없다. 기능을 알아야 scripts가 같은지 다른지 판단할 수 있고, 그래야 컴포넌트를 나눌 수 있다. 따라서 **하나의 단계에서 함께 수행**한다.

| 항목 | 설명 |
|------|------|
| **입력** | Step 3의 범주 CLAUDE.md + MD3 공식 명세 (m3.material.io) |
| **활동** | (1) MD3 명세에서 범주의 세부 컴포넌트/변형을 식별한다. (2) 각 세부 항목의 **행동/상태/상호작용**을 도출한다. (3) 도출된 기능을 "기능의 정의" 프레임으로 검증한다. (4) **기능이 같으면 하나의 컴포넌트**(디자인 변형으로 처리), **기능이 다르면 별도 컴포넌트**로 분리한다. |
| **출력** | 개별 컴포넌트 폴더 + 각 컴포넌트의 CLAUDE.md에 기능 목록 |
| **완료 기준** | "이 범주에 몇 개의 컴포넌트가 있고, 각각 어떤 기능을 하는가?"에 답할 수 있음 |
| **현재 상태** | ⚠️ 부분 — TopAppBar만 완료 |

**기능 분석 절차**:

```
1. MD3 명세(m3.material.io)에서 해당 컴포넌트 페이지를 확인한다

2. 다음 3가지를 도출한다:
   ┌──────────────┬─────────────────────────────────────────┐
   │ 행동 Behavior │ 이 컴포넌트가 하는 것                      │
   │              │ (데이터 표시, 선택, 토글, 네비게이션 등)       │
   ├──────────────┼─────────────────────────────────────────┤
   │ 상태 States   │ 이 컴포넌트가 가지는 시각적/논리적 상태       │
   │              │ (enabled, disabled, selected, focused 등) │
   ├──────────────┼─────────────────────────────────────────┤
   │ 상호작용      │ 사용자 입력에 대한 반응                      │
   │ Interaction  │ (클릭, 스크롤, 스와이프, 키보드 등)           │
   └──────────────┴─────────────────────────────────────────┘

3. 도출된 각 항목을 "기능의 정의"로 검증한다:
   - "목적이 무엇인가?" (보편화된 행위)
   - "수단이 특정되는가?" (어떻게?)
   - 수단이 특정되면 → 기능이다
   - 수단이 특정되지 않으면 → 아직 목적이다, 더 분해한다

4. 기능 목록을 개별 컴포넌트 CLAUDE.md에 기록한다
```

**세분화 판단**:

```
도출된 기능들을 비교:
  → 기능 목록이 같으면 → 하나의 컴포넌트 (HTML/CSS 차이는 디자인 변형)
  → 기능 목록이 다르면 → 별도 컴포넌트 (scripts가 달라야 하므로)
```

> **Step 4 완료 후**: 도출된 개별 컴포넌트 각각에 대해 Step 5 → 6 → 7을 반복한다.
> 즉, Step 4는 범주 단위 1회, Step 5~7은 컴포넌트 단위 반복이다.

### Step 5. Mixin 매핑 (필요 시 구현)

> **도출된 기능은 기존 Mixin으로 커버 가능한가?**

| 항목 | 설명 |
|------|------|
| **입력** | Step 4의 기능 목록 + 현재 Mixin 카탈로그 ([Mixins/README.md](../Mixins/README.md)) |
| **활동** | DOM 패턴 기반으로 Mixin을 선택한다. 기존 Mixin으로 부족한 부분은 **커스텀 속성/메서드**로 정의한다. 여러 컴포넌트에서 동일 패턴이 반복되면 새 Mixin 검토 (`create-mixin-spec` → `implement-mixin`). |
| **출력** | 개별 컴포넌트 CLAUDE.md에 구현 명세 추가 (Mixin 선택 + cssSelectors + 커스텀 메서드) |
| **완료 기준** | "이 컴포넌트의 register.js에 무엇이 들어가는가?"를 CLAUDE.md만 보고 알 수 있음 |
| **현재 상태** | ⚠️ 부분 — TopAppBar만 완료 |

**분기 흐름**:

```
Step 4에서 도출된 기능
    │
    ├── 기존 Mixin으로 커버 가능 → Mixin 선택 → Step 6로
    │
    ├── Mixin + 커스텀 메서드 조합 필요 → 매핑 정의 → Step 6로
    │
    └── 완전히 새로운 기능 패턴
        │
        ├── 이 컴포넌트에서만 필요 → 커스텀 메서드로 처리 → Step 6로
        │
        └── 여러 컴포넌트에서 반복될 패턴
            → create-mixin-spec → implement-mixin
            → Step 4로 돌아가 다른 컴포넌트에도 적용 가능성 검토
```

**TopAppBar에 대입한 예시**:

```
기능 1: "제목을 표시한다"
  DOM 패턴: 고정 DOM에 데이터 매핑
  → FieldRenderMixin 선택
  → cssSelectors: { title: '.top-app-bar__title' }

기능 2: "네비게이션 이벤트를 발행한다"
  DOM 패턴: 클릭 → 이벤트 버스 발행
  → Mixin 불필요, customEvents로 처리
  → cssSelectors에 navIcon 추가: { navIcon: '.top-app-bar__nav-icon' }
```

---

### Step 6. 컴포넌트 개발

> **CLAUDE.md 명세를 코드로 구현한다.**

| 항목 | 설명 |
|------|------|
| **입력** | Step 5의 구현 명세 (CLAUDE.md) + Figma 디자인 또는 디자인 원칙 |
| **활동** | HTML/CSS 작성 (Figma 변환 또는 직접 작성) → register.js + beforeDestroy.js 구현 → 디자인 변형 추가 → preview 작성 |
| **출력** | 완성된 컴포넌트 (views/ + styles/ + scripts/ + preview/) |
| **완료 기준** | register.js가 CLAUDE.md 명세와 일치하고, preview에서 동작 확인 |
| **현재 상태** | ⚠️ TopAppBar 1개 완료, 3D 7종 완료 |

**사용 도구**: `create-standard-component` SKILL, `add-design-variant` SKILL

---

### Step 7. 검증

> **생산된 컴포넌트가 규약을 준수하는가?**

| 항목 | 설명 |
|------|------|
| **입력** | Step 6의 컴포넌트 |
| **활동** | Hook 자동 검증 (P0~P3) + CLAUDE.md ↔ 코드 정합성 확인 + preview 동작 확인 |
| **출력** | Hook 통과 결과 + 정합성 확인 결과 |
| **완료 기준** | 9개 Hook 전부 통과 + CLAUDE.md와 코드 간 불일치 0건 |
| **현재 상태** | ✅ Hook 시스템 가동 중 (SKILL 실행 시 자동 트리거) |

**자동 검증 항목**:

| Hook | 대상 | 검증 내용 |
|------|------|----------|
| cross-register-destroy | 컴포넌트 | register.js ↔ beforeDestroy.js Mixin 수 일치 + 역순 |
| cross-selectors-html | 컴포넌트 | cssSelectors가 HTML에 존재하는지 |
| check-register | 컴포넌트 | register.js 구조 규약 준수 |
| check-beforeDestroy | 컴포넌트 | beforeDestroy.js 정리 패턴 |
| check-p3 | 공통 | rem/em 금지, var 금지 등 코딩 스타일 |
| check-page-before-load | 페이지 | before-load.js 구조 규약 준수 |
| check-page-before-unload | 페이지 | before-unload.js 정리 패턴 |
| check-page-loaded | 페이지 | loaded.js 구조 규약 준수 |
| cross-page-lifecycle | 페이지 | 페이지 라이프사이클 스크립트 간 정합성 |

---

## Phase D: Advanced 기능 사이클

### Step 8. Advanced 기능 분석

> **프로젝트가 요구하는, MD3에 없는 새 컴포넌트는 무엇인가?**

Advanced는 기존 Standard 컴포넌트를 수정하는 것이 아니다. **Standard 컴포넌트는 그대로 유지**한 채, 같은 범주에 **새로운 종류의 컴포넌트를 추가**하는 것이다.

| 항목 | 설명 |
|------|------|
| **입력** | Step 4의 Standard 컴포넌트 목록 + 실제 프로젝트 요구사항 + 도메인 지식 |
| **활동** | 프로젝트에서 필요하지만 MD3 명세에 없는 컴포넌트를 식별한다. 도출된 기능을 Step 1의 프레임으로 검증 (목적 + 수단 특정 여부). 기존 Standard 컴포넌트와 기능이 겹치지 않는지 확인한다. |
| **출력** | Advanced 컴포넌트 목록 + 각 컴포넌트의 기능 정의 (새 컴포넌트 CLAUDE.md) |
| **완료 기준** | 새 컴포넌트가 "기능의 정의"에 부합하고, 기존 Standard 컴포넌트와 기능이 중복되지 않음 |
| **현재 상태** | ❌ 미시작 |

---

### Step 9. Advanced 컴포넌트 개발

> **새 컴포넌트를 Standard와 동일한 프로세스로 구현한다.**

Step 5~6과 동일한 흐름을 따른다. Advanced 컴포넌트도 독립된 컴포넌트이므로, Standard 컴포넌트와 같은 구조(views/ + styles/ + scripts/ + preview/)를 갖는다.

| 항목 | 설명 |
|------|------|
| **입력** | Step 8의 Advanced 컴포넌트 기능 정의 |
| **활동** | Mixin 매핑 (Step 5와 동일) → HTML/CSS + register.js + beforeDestroy.js 구현 → preview 작성 |
| **출력** | 완성된 Advanced 컴포넌트 (기존 Standard 컴포넌트와 독립) |
| **완료 기준** | register.js가 CLAUDE.md 명세와 일치하고, preview에서 동작 확인. 기존 Standard 컴포넌트에 영향 없음 |
| **현재 상태** | ❌ 미시작 |

**원칙**: Standard 컴포넌트의 코드는 수정하지 않는다. Advanced는 항상 새 컴포넌트 폴더로 생성된다.

---

### Step 10. 검증

Step 7과 동일한 검증을 수행한다. Advanced 컴포넌트가 Hook 검사를 통과하는지 확인한다.

---

## 반복 규칙

```
┌─ Step 3 (범주 선택) ◀────────────────────────────────────┐
│                                                           │
│  Step 4 (기능 분석 + 세분화) ─ 범주 단위, 1회              │
│      │                                                    │
│      ├─ 컴포넌트 A ─→ 5 → 6 → 7 ─┐                       │
│      ├─ 컴포넌트 B ─→ 5 → 6 → 7 ─┤  Standard 완료        │
│      └─ 컴포넌트 C ─→ 5 → 6 → 7 ─┘                       │
│                                                           │
│  이후 프로젝트 요구 발생 시:                                │
│      └─ 컴포넌트 D(신규) ─→ 8 → 9 → 10 ─ Advanced (반복)  │
│                                                           │
└── 이 범주 Standard 완료 → 다음 범주로 ───────────────────┘
```

**Standard(Phase C)는 범주당 1회**:
- Step 4에서 범주 전체를 분석하여 개별 컴포넌트를 도출한다.
- 도출된 각 컴포넌트를 Step 5~7로 1회 구현하면 Standard는 완료.
- 이후 Standard는 보수(버그 수정, MD3 규격 변경)로만 수정된다.

**Advanced(Phase D)는 프로젝트 요구 시 반복**:
- Standard 완료 후, 프로젝트에서 MD3에 없는 새 컴포넌트가 필요할 때 진입.
- 기존 Standard 컴포넌트는 수정하지 않고, 같은 범주에 새 컴포넌트를 추가한다.

**새 Mixin이 필요한 경우**: Step 5에서 발견되면 `create-mixin-spec` → `implement-mixin` → Mixin 카탈로그 업데이트 후 Step 5로 복귀.

---

## 현재 위치

```
Phase A: 기반
  Step 1   개념 정의                    ✅ 완료
  Step 2   인터페이스 설계              ✅ 완료

Phase B: 목록화
  Step 3   범주 목록화                  ✅ 완료 (2D: 25개, 3D: 7종)

Phase C: Standard 기능 사이클
  Step 4   기능 분석 + 세분화           ⚠️ TopAppBar만 완료
  Step 5   Mixin 매핑                   ⚠️ TopAppBar만 완료
  Step 6   컴포넌트 개발                ⚠️ 2D: TopAppBar 1개, 3D: 7종(최소 골격)
  Step 7   검증                         ✅ Hook 시스템 가동 중

Phase D: Advanced 기능 사이클
  Step 8~10                             ❌ 미시작
```

**다음 작업**: 다음 범주를 선택하여 Step 4(기능 분석 + 세분화)부터 Standard 사이클을 반복한다.

---

*최종 업데이트: 2026-04-07*
