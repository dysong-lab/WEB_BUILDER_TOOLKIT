# WEB_BUILDER_TOOLKIT 프로젝트 종합 검토 보고서

> 검토일: 2026-03-28

---

## 1. 프로젝트의 정체와 목적

**"Figma 디자인 → 웹 빌더 런타임 컴포넌트"를 자동화하는 도구 모음**

| 항목 | 내용 |
|------|------|
| 최종 소비자 | RENOBIT (웹 빌더 플랫폼) |
| 자동화 주체 | Claude Code (AI가 SKILL을 실행하여 코드 생성) |
| 대상 도메인 | 은행/기업 대시보드 (HANA-BANK, ECO, IBSilon 등) |

### 핵심 파이프라인

```
Figma 디자인
  │
  ▼  [1-figma SKILL: figma-to-html / figma-to-inline-svg]
정적 HTML/CSS (Figma_Conversion/Static_Components/)
  │
  ▼  [2-component SKILL: create-standard-component / create-symbol-state-component]
동적 컴포넌트 (views/ + styles/ + scripts/register.js + beforeDestroy.js)
  │
  ▼  [3-page SKILL: create-project]
완성된 프로젝트 (페이지 + 컴포넌트 + mock서버 + datasetList.json)
```

목적은 명확합니다. Figma에서 디자인하면 → AI가 코드를 생성하여 → RENOBIT 플랫폼에서 실행 가능한 컴포넌트/페이지가 나오는 것. 사람이 직접 코딩하는 대신 SKILL이라는 프롬프트 명세서를 통해 AI가 일관된 코드를 생성하게 만드는 시스템입니다.

---

## 2. 논리적 구성 검토

### 2-1. 아키텍처 설계의 논리성: 우수

```
문제 정의:
  RENOBIT 프레임워크가 상속 체인을 소유 → 개발자는 leaf 클래스만 수정 가능
  → class-based Mixin 패턴 사용 불가 (프레임워크가 인스턴스 생성)

해결:
  Function-based Mixin (인스턴스 데코레이션)
  → _onViewerReady() 시점에 네임스페이스 주입
  → 클로저로 this 바인딩 문제 회피
```

이 설계는 **프레임워크 제약 조건에서 도출된 필연적 선택**입니다. `WHY_MIXIN.md`에서 class factory Mixin이 왜 안 되는지, 왜 function-based여야 하는지를 명확히 논증했고, 실제 구현이 이를 정확히 따릅니다.

### 2-2. 컴포넌트-Mixin 분리의 논리성: 우수

**핵심 공식: "기능 = 목적 + 수단"**

- 같은 목적(데이터를 보여준다) + 다른 수단(필드 렌더링 vs 리스트 렌더링) → 다른 Mixin (`FieldRenderMixin` vs `ListRenderMixin`)
- 다른 시각적 형태(막대 차트 vs 원형 차트) + 같은 수단(ECharts) → 같은 Mixin, 다른 컴포넌트

이 분류 기준은 `FUNCTION_PATTERN.md`에서 순수 함수(map/filter, debounce/throttle)와의 유비로 검증했습니다. **N개 컴포넌트 + M개 Mixin = N×M 조합을 N+M 관리 비용으로** 달성하는 구조는 논리적으로 타당합니다.

### 2-3. 데이터 흐름의 논리성: 우수

```
페이지(오케스트레이터)                     컴포넌트(수동적 구독자)
─────────────────────                    ─────────────────────
pageDataMappings 정의
  → registerMapping()                     subscribe(topic, handler)
  → fetchAndPublish(topic)         ──→    handler(data) = Mixin.renderData
  → setTimeout 체이닝

pageEventBusHandlers 등록                 customEvents → bindEvents
  ← Weventbus.emit('@itemClicked') ──    DOM 이벤트 → Weventbus.emit()
  → pageParams 업데이트
  → fetchAndPublish(topic)         ──→    handler(data) = Mixin.renderData
```

Topic 기반 pub-sub으로 페이지와 컴포넌트가 느슨하게 결합됩니다. 컴포넌트는 자기 topic만 구독하고, 페이지의 내부 구조를 모릅니다. 이 단방향 흐름은 예측 가능하고 디버깅이 쉽습니다.

### 2-4. 라이프사이클의 논리성: 우수

| 생성 순서 | 정리 순서 (정확히 역순) |
|-----------|----------------------|
| 1. Mixin 적용 (네임스페이스 생성) | 3. 이벤트 제거 |
| 2. 구독 연결 (Mixin 메서드 참조) | 2. 구독 해제 |
| 3. 이벤트 바인딩 | 1. Mixin.destroy() |

8개 컴포넌트 전체를 확인한 결과 **모든 register.js와 beforeDestroy.js가 이 순서를 정확히 따릅니다.** 복잡한 EventBrowser(ListRender + ShadowPopup + 중첩 ListRender)도 역순 정리를 올바르게 구현했습니다.

### 2-5. Selector Contract의 논리성: 타당하나 한 가지 긴장

```
cssSelectors: "어디에" (querySelector 인자)
datasetAttrs: "어떻게" (data-* 속성 vs textContent 분기 신호)

→ 같은 KEY를 공유하여 "이 필드의 값을 이 요소에 이 방식으로 적용"을 표현
```

**타당한 점:** Mixin이 HTML 구조를 모르고, CSS가 상태 스타일링을 담당하려면 이 분리가 필요합니다. `SELECTORS_AS_CONTRACT.md`와 `REVIEW_SELECTOR_CONTRACT.md`에서 이를 잘 논증했습니다.

**긴장 지점:** `REVIEW_KEY_SHARING_DESIGN.md`에서 지적된 것처럼, cssSelectors의 KEY가 renderData 순회 · customEvents computed property · 내부 직접 참조 세 가지 역할을 겸합니다. 데이터에 `{container: '...'}` 같은 값이 들어오면 Mixin이 container 요소의 textContent를 덮어쓸 수 있습니다. **현재는 관례로 안전하지만, 코드 보호는 없습니다.** 이것은 기록된 알려진 위험입니다.

---

## 3. 효율성 검토

### 3-1. SKILL 시스템의 효율성: 높음

```
8개 핵심 SKILL:
  1-figma:      figma-to-html, figma-to-inline-svg
  2-component:  create-standard-component, create-symbol-state-component
  3-page:       create-project
  4-review:     audit-project
  5-mixin:      create-mixin-spec, implement-mixin

공통 규칙: SHARED_INSTRUCTIONS.md + CODING_STYLE.md
```

**효율적인 이유:**
- SKILL이 파이프라인 단계별로 분리되어 있어 독립 실행 가능
- `SHARED_INSTRUCTIONS.md`로 중복 규칙을 한 곳에서 관리
- 각 SKILL에 "사전 읽기 목록"이 있어 AI가 필요한 컨텍스트만 로드

### 3-2. 문서 구조의 효율성: 높음 (약간의 중복 존재)

```
docs/
├── architecture/  ← "이것은 무엇이고 왜 이런가" (SKILL이 코드 생성 전 참조)
├── specs/         ← "각 Mixin은 어떻게 만들어졌나" (implement-mixin이 참조)
└── reports/       ← "현재 상태는 괜찮은가" (사용자 의사결정용)
```

**효율적인 이유:** 문서가 소비자별로 분류되어 있습니다 (SKILL용 / Mixin개발용 / 사람용).

**중복 지점:**
- `README.md`(37KB)의 "Component Structure Guide" 섹션과 `Figma_Conversion/PUBLISHING_COMPONENT_STRUCTURE.md`가 컨테이너 패턴을 각각 설명합니다. 내용은 일관되지만, 같은 개념을 두 곳에서 유지해야 합니다.
- Mixin API 문서가 3곳에 존재: `Mixins/*.md` (API 문서) + `docs/specs/MIXIN_SPEC_EXAMPLE_*.md` (명세 예시) + `COMPONENT_SYSTEM_DESIGN.md` (Mixin 목록 테이블). 각각 역할이 다르지만 Mixin이 추가/변경되면 3곳을 동기화해야 합니다.

### 3-3. 예제 대시보드의 효율성: 높음

| 예제 | 목적 |
|------|------|
| Dashboard_Corporate / DarkTech / Minimal | 같은 컴포넌트의 3가지 테마 변형 시연 |
| SimpleDashboard | 커스텀 컴포넌트 개발 패턴 시연 |

SimpleDashboard는 `Components/` 라이브러리가 아닌 자체 컴포넌트(StatusCards, EventLog, DeviceList, SystemInfo, EventBrowser)를 포함하여 "처음부터 만드는 과정"을 보여줍니다.

---

## 4. 정합성(일관성) 검토

### 4-1. ✅ 코드-문서 정합성: 높음

8개 컴포넌트의 register.js/beforeDestroy.js를 전수 확인한 결과:

| 컴포넌트 | Mixin | 네임스페이스 | 3단계 순서 | 역순 정리 |
|----------|-------|-------------|-----------|----------|
| Header | FieldRender | `this.fieldRender` | ✅ | ✅ |
| BarChart | ECharts | `this.echarts` | ✅ | ✅ |
| LineChart | ECharts | `this.echarts` | ✅ | ✅ |
| PieChart | ECharts | `this.echarts` | ✅ | ✅ |
| GaugeChart | ECharts | `this.echarts` | ✅ | ✅ |
| Sidebar | StatefulListRender | `this.statefulList` | ✅ | ✅ |
| Table | Tabulator | `this.tabulator` | ✅ | ✅ |
| EventBrowser | ListRender + ShadowPopup | `this.listRender` + `this.shadowPopup` | ✅ | ✅ |

SimpleDashboard의 5개 커스텀 컴포넌트도 동일한 패턴을 정확히 따릅니다.

### 4-2. ✅ 페이지 스크립트 정합성: 높음

Dashboard_Corporate와 SimpleDashboard의 page_scripts를 비교한 결과:
- `before_load.js`: 둘 다 `onEventBusHandlers` 패턴
- `loaded.js`: 둘 다 `pageDataMappings` → `registerMapping` → `fetchAndPublish` → `startAllIntervals` 패턴
- `before_unload.js`: 둘 다 `stopAllIntervals` → `offEventBusHandlers` → `unregisterMapping` → null 할당 패턴

**생성-정리 매칭이 완벽합니다.** README.md의 "페이지 생성/정리 매칭" 테이블과 실제 코드가 일치합니다.

### 4-3. ✅ SKILL-코드 정합성: 높음

`create-standard-component` SKILL이 지시하는 패턴과 실제 `Components/` 코드가 일치합니다:
- register.js의 3단계 구조 (Mixin → 구독 → 이벤트)
- beforeDestroy.js의 역순 정리
- cssSelectors/datasetAttrs 계약
- preview/ 파일 구조

`create-project` SKILL이 지시하는 패턴과 실제 `Examples/` 코드가 일치합니다:
- page_scripts 3파일 구조
- datasetList.json 형식
- mock_server 구조

### 4-4. ⚠️ 발견된 불일치 사항

#### (A) MIXIN_REVIEW.md의 TabulatorMixin layout 기술 부정확

`TabulatorMixin.js`의 `Object.assign` 순서상 `tabulatorOptions`가 뒤에 오므로 `layout`을 재정의할 수 **있습니다.** 그러나 `MIXIN_REVIEW.md`는 이를 "layout 하드코딩" 제한사항으로 기록했습니다. **리뷰 문서가 실제 코드 동작과 불일치합니다.**

#### (B) Figma 정적 → RNBT 동적 변환 경로의 불연속

- `figma-to-html` SKILL의 출력이 `create-standard-component` SKILL의 입력으로 바로 사용되는 경로가 **실제 예제로 검증되지 않았습니다.**
- `Static_Components/`에 있는 17개 정적 컴포넌트 중 RNBT `Components/`로 변환된 것이 **하나도 없습니다.**
- 파이프라인이 "Figma → 정적 → 동적"이라고 문서화했지만, 이 경로를 실제로 통과한 end-to-end 산출물이 존재하지 않습니다.

**이것은 프로젝트의 가장 큰 구조적 갭입니다.**

#### (C) REVIEW_COMMIT_DIRECTION.md의 자기 진단 (현재도 유효)

> "MEMORY.md 02-07에서 '코드 생성 정확도'를 병목으로 식별했지만, '다음 단계'가 2개월째 미착수"

문서 체계는 정교하게 다듬어져 있지만, **실제 SKILL 실행 → 코드 생성 → 검증**이라는 루프가 아직 돌지 않았다는 증거가 곳곳에 있습니다.

#### (D) `.legacy_ref/docs/` 30+ 문서와 현행 문서의 관계

`README.md` 부록에서 `legacy_ref`를 참조하는 링크가 있어 레거시 문서가 아직 참조 체계 안에 살아 있습니다. 레거시 문서와 현행 문서 간의 내용 충돌 여부는 별도 검증이 필요합니다.

#### (E) CLAUDE.md 날짜 불일치

| 파일 | 기록된 날짜 | 실제 최근 커밋 |
|------|-----------|--------------|
| 루트 `CLAUDE.md` | 2026-01-14 | 2026-03-28 |
| `RNBT_architecture/CLAUDE.md` | 2025-12-19 | 2026-03-28 |

문서 내용이 최근 변경사항을 반영하지만 날짜가 업데이트되지 않았습니다.

---

## 5. 종합 판정

| 항목 | 판정 | 근거 |
|------|------|------|
| 목적 명확성 | ◎ 우수 | Figma → 런타임 컴포넌트 파이프라인 |
| 논리적 구성 | ◎ 우수 | Mixin 설계 근거, 라이프사이클, pub-sub 흐름 모두 논리적 |
| 효율적 구성 | ○ 양호 | SKILL 분리, 문서 분류 적절 (약간의 문서 중복 존재) |
| 코드 정합성 | ◎ 우수 | 8개 컴포넌트 + 5개 커스텀 모두 패턴 완벽 준수 |
| 문서 정합성 | ○ 양호 | 대부분 일치, MIXIN_REVIEW 부정확 1건, 날짜 미갱신 |
| 파이프라인 실증성 | △ 미검증 | Figma → 정적 → 동적 end-to-end 경로의 실제 통과 산출물 부재 |

### 핵심 요약

이 프로젝트는 **설계가 매우 잘 되어 있습니다.** 프레임워크 제약에서 출발한 Mixin 설계, 컴포넌트-페이지 역할 분리, Selector Contract, 라이프사이클 대칭성 — 이 모든 것이 논리적 근거를 가지고 있고, 실제 코드가 문서를 정확히 따릅니다.

**단 하나의 구조적 갭은:** 파이프라인이 아직 end-to-end로 돌아본 적이 없다는 것입니다. Figma 정적 출력물 17개와 RNBT 동적 컴포넌트 8개가 별개의 세계에 존재하며, "정적 → 동적 변환"이라는 핵심 파이프라인을 실제로 통과한 산출물이 없습니다.

**다음으로 의미 있는 작업:** 실제로 `Static_Components/` 중 하나를 골라 `create-standard-component` SKILL을 실행하여, 파이프라인이 실제로 작동하는지 확인하고, 실패 지점을 관찰하는 것입니다.
