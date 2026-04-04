---
name: implement-mixin
description: 승인된 명세서를 기반으로 Mixin 구현체(.js), API 문서(.md)를 작성하고, 관련 문서를 갱신합니다.
---

# Mixin 구현

**승인된 명세서**를 기반으로 Mixin 구현체와 문서를 작성한다.

> 이 SKILL은 명세서가 이미 존재하고 사용자에게 승인된 상태에서 실행한다.
> 명세서가 없으면 create-mixin-spec SKILL을 먼저 진행한다.

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**

1. **승인된 명세서** — `docs/specs/MIXIN_SPEC_EXAMPLE_[MixinName].md`
2. **가장 유사한 기존 Mixin .js** — 구현 패턴 참고용
3. [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) — JS 공통 규칙
4. [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) — 코딩 스타일

---

## 작업 프로세스

### 1단계: 명세서 확인

승인된 명세서를 읽고 다음을 확인한다:

- 네임스페이스 이름 (섹션 4)
- 메서드/속성 목록 (섹션 4)
- destroy 범위 (섹션 5)
- renderData 패턴인지 직접 호출 패턴인지 (섹션 3)

### 2단계: 유사 Mixin 선택

명세서의 패턴에 가장 가까운 기존 Mixin .js를 찾아 읽는다.

| 패턴 | 참고할 Mixin |
|------|-------------|
| cssSelectors + datasetAttrs + renderData | FieldRenderMixin.js, ListRenderMixin.js |
| cssSelectors + 외부 라이브러리 lazy init | EChartsMixin.js, TabulatorMixin.js, HeatmapJsMixin.js |
| 3D (cssSelectors 없음) + renderData | MeshStateMixin.js |
| 3D + 직접 호출 패턴 | CameraFocusMixin.js |
| Shadow DOM + template + bindPopupEvents | ShadowPopupMixin.js |

### 3단계: 구현체 작성 (.js)

```
출력 파일: Mixins/[MixinName].js
```

**구조:**

```javascript
/**
 * [MixinName]
 *
 * [목적 — 명세서 섹션 1에서 가져온다]
 *
 * [기능 설명]
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   apply[MixinName](this, { ... });
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.[namespace]):
 *
 *   [명세서 섹션 4의 메서드/속성 목록]
 *
 * ─────────────────────────────────────────────────────────────
 */

function apply[MixinName](instance, options) {
    // 명세서 섹션 2의 인터페이스에서 옵션 추출
    const { cssSelectors = {}, datasetAttrs = {}, ...rest } = options;

    const ns = {};
    instance.[namespace] = ns;

    // 선택자 보존 (외부 참조용)
    ns.cssSelectors = { ...cssSelectors };
    ns.datasetAttrs = { ...datasetAttrs };

    // 내부 상태
    // ...

    // 메서드 — 명세서 섹션 4의 모든 항목을 구현

    ns.destroy = function() {
        // 명세서 섹션 5의 모든 항목을 정리
        // 모든 메서드를 null 처리
        // instance.[namespace] = null
    };
}
```

**체크리스트:**

- [ ] `const`/`let` 사용 (`var` 금지)
- [ ] spread(`{ ...obj }`)로 선택자 복사 (`for...in` 금지)
- [ ] JSDoc 헤더에 목적, 사용 예시, 주입 목록 포함
- [ ] 명세서 섹션 4의 모든 메서드가 구현되어 있는가
- [ ] destroy에서 명세서 섹션 5의 모든 항목을 정리하는가
- [ ] destroy에서 `instance.[namespace] = null`이 마지막인가
- [ ] 에러 시 throw (catch하지 않음 — 페이지가 처리)

### 4단계: API 문서 작성 (.md)

```
출력 파일: Mixins/[MixinName].md
```

기존 Mixin .md의 구조를 따른다:

```
# [MixinName]

## 설계 의도
[목적 + 기능 설명]

## 인터페이스
[cssSelectors, datasetAttrs, 기타 옵션 테이블]

## 주입되는 네임스페이스
[this.[namespace] — 메서드/속성 테이블]

## 사용 예시
[register.js, 페이지 핸들러 코드]
```

### 5단계: 관련 문서 갱신

새 Mixin이 추가되면 다음 문서를 갱신해야 한다:

| 문서 | 갱신 내용 |
|------|----------|
| [Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md) | 목록 테이블 + 상세 문서 링크에 새 Mixin 추가 |
| [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) | 네임스페이스 규칙 테이블 + Mixin 카탈로그 테이블 + 기능 정의 테이블에 추가. 미구현 후보에 있었으면 제거. |
| [MIXIN_REVIEW.md](/RNBT_architecture/DesignComponentSystem/docs/reports/MIXIN_REVIEW.md) | 새 Mixin 섹션 추가 + 요약 테이블에 추가 |
| [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) | Mixin 문서 확인 규칙 테이블에 추가 |
| [SYSTEM_READINESS_REVIEW.md](/RNBT_architecture/DesignComponentSystem/docs/reports/SYSTEM_READINESS_REVIEW.md) | Mixin 수 갱신 (N개 → N+1개) |

**체크리스트:**

- [ ] Mixins/README.md 목록과 링크
- [ ] COMPONENT_SYSTEM_DESIGN.md 3개 테이블 (네임스페이스, 카탈로그, 기능 정의)
- [ ] MIXIN_REVIEW.md 섹션 + 요약 테이블
- [ ] SHARED_INSTRUCTIONS.md Mixin 문서 링크
- [ ] SYSTEM_READINESS_REVIEW.md Mixin 수

### 6단계: 검증

1. 명세서의 섹션 4 (메서드 테이블)와 .js의 `ns.xxx = function`이 1:1 대응하는가
2. 명세서의 섹션 5 (destroy 범위)와 .js의 destroy 내부가 1:1 대응하는가
3. .md API 문서의 메서드 테이블이 .js와 일치하는가
4. 갱신한 문서들에서 Mixin 수가 전체적으로 일치하는가

---

## 금지 사항

- ❌ 명세서 없이 구현 착수
- ❌ 명세서에 없는 메서드를 임의로 추가 (추가가 필요하면 명세서를 먼저 수정)
- ❌ destroy에서 정리 항목 누락
- ❌ 관련 문서 갱신 누락
- ❌ `var`, `for...in` 사용

---

## P0 자기 검증 — 작성 완료 후 필수 수행

**모든 파일 작성이 완료된 후, 생성한 Mixin .js를 다시 Read로 읽어 아래를 검증한다.**
이 단계를 생략하지 않는다.

### P0-3: Mixin이 HTML 구조를 모르는가?

`Mixins/[MixinName].js`를 읽고 확인:

- ❌ 위반: cssSelectors 계약 밖에서 DOM 탐색 (querySelector, parentNode, children, nextSibling 등을 직접 사용)
- ❌ 위반: 특정 HTML 태그명에 의존 (`el.tagName === 'DIV'`, `el.closest('table')`)
- ✅ 정상: cssSelectors/datasetAttrs로만 DOM 요소에 접근

cssSelectors의 VALUE로 `appendElement.querySelector(selector)`를 호출하는 것은 정상이다.
그 외의 DOM 탐색이 있으면 위반이다.

### P0-5: 다른 Mixin을 모르는가?

같은 파일에서 확인:

- ❌ 위반: `instance.fieldRender`, `instance.listRender` 등 다른 Mixin 네임스페이스 참조
- ❌ 위반: 다른 Mixin의 메서드를 호출하거나 존재를 가정하는 조건문
- ✅ 정상: 자신의 네임스페이스(`ns`)만 사용하고 `instance`에는 네임스페이스 주입/제거만 수행

---

## 관련 자료

| 문서 | 위치 |
|------|------|
| 명세서 작성 SKILL | [create-mixin-spec](/.claude/skills/5-mixin/create-mixin-spec/SKILL.md) |
| 명세서 템플릿 | [MIXIN_SPEC_TEMPLATE.md](/RNBT_architecture/DesignComponentSystem/docs/specs/MIXIN_SPEC_TEMPLATE.md) |
| 공통 규칙 | [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) |
| 코딩 스타일 | [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) |
| 기존 Mixin 구현체 | [Mixins/](/RNBT_architecture/DesignComponentSystem/Mixins/) |

---
