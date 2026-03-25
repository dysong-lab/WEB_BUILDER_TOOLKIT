---
name: create-mixin-spec
description: 새로운 Mixin의 명세서를 작성합니다. 모호한 요구사항을 기능의 정의(목적+수단)로 분해하고, 기존 Mixin과의 중복을 확인한 후, 템플릿에 맞춰 명세서를 작성합니다.
---

# Mixin 명세서 작성

모호한 요구사항을 **기능의 정의(목적 + 수단)**로 분해하여 명세서를 작성한다.

> 이 SKILL은 명세서만 작성한다. 구현(.js)은 별도 SKILL(implement-mixin)에서 진행한다.
> 명세서가 사용자에게 승인되기 전에는 구현하지 않는다.

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**
**이전에 읽었더라도 매번 다시 읽어야 합니다.**

1. [COMPONENT_SYSTEM_DESIGN.md — 기능의 정의](/RNBT_architecture/DesignComponentSystem/docs/COMPONENT_SYSTEM_DESIGN.md) — "기능이란 무엇인가" 섹션
2. [MIXIN_SPEC_TEMPLATE.md](/RNBT_architecture/DesignComponentSystem/docs/MIXIN_SPEC_TEMPLATE.md) — 명세서 템플릿
3. [Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md) — 현재 Mixin 전체 목록
4. [MIXIN_REVIEW.md](/RNBT_architecture/DesignComponentSystem/docs/MIXIN_REVIEW.md) — 기존 Mixin 범용성 및 제약

---

## 작업 프로세스

### 1단계: 요구사항을 기능의 정의로 분해

사용자의 요구사항은 대부분 모호하다. "팝업이 필요해", "차트를 보여줘", "상태를 관리해줘" 등.

**"어떻게?"라고 물어서 답이 하나로 특정될 때까지 분해한다.**

```
"팝업이 필요해"
  → 목적: 콘텐츠를 별도 레이어에 표시한다
  → "어떻게?" → Shadow DOM으로 팝업을 만든다
  → 수단이 특정됨 → 이것이 기능이다

"상태를 보여줘"
  → 목적: 데이터를 보여준다
  → "어떻게?" → 텍스트로? 색상으로? 차트로? 목록으로?
  → 아직 복수 → 아직 기능이 아니라 목적이다
  → "3D 메시의 색상으로" → 수단이 특정됨 → 이것이 기능이다
```

이 단계에서 사용자에게 확인한다:
- "목적은 [X]이고, 수단은 [Y]로 이해했습니다. 맞습니까?"
- 목적과 수단이 모호하면 사용자에게 다시 질문한다.

### 2단계: 기존 Mixin과 중복 확인

[Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md)를 읽고:

1. **같은 목적**을 가진 Mixin이 있는가?
2. 있다면, **수단이 다른가?**
   - 수단이 다르면 → 별도 Mixin이 필요 (정상)
   - 수단이 같으면 → 기존 Mixin을 사용하거나 확장
3. [MIXIN_REVIEW.md](/RNBT_architecture/DesignComponentSystem/docs/MIXIN_REVIEW.md)의 "제약"에서 도출된 새 Mixin 후보와 일치하는가?

결과를 사용자에게 보고한다:
- "기존 [X]Mixin과 목적이 같지만 수단이 다릅니다. 별도 Mixin이 필요합니다."
- 또는 "기존 [X]Mixin이 이 요구사항을 이미 커버합니다."

### 3단계: 인터페이스 설계

기능이 확정되면 인터페이스를 설계한다.

**판단 기준:**

| 질문 | 결과 |
|------|------|
| DOM 요소를 찾아야 하는가? | cssSelectors 필요 |
| data-* 속성을 사용하는가? | datasetAttrs 필요 |
| 외부 라이브러리 인스턴스를 관리하는가? | lazy init + getInstance 패턴 |
| renderData로 데이터를 받는가? | renderData 패턴 |
| 직접 호출만 하는가? | 직접 호출 패턴 (CameraFocus, ShadowPopup) |
| Shadow DOM이 필요한가? | ShadowPopupMixin 참고 |
| 3D 메시를 다루는가? | cssSelectors 대신 기타 옵션 |

**기존 Mixin의 인터페이스를 참고한다.** 사용할 Mixin의 .md 파일을 읽어서 패턴을 확인한다.

### 4단계: 명세서 작성

[MIXIN_SPEC_TEMPLATE.md](/RNBT_architecture/DesignComponentSystem/docs/MIXIN_SPEC_TEMPLATE.md)를 읽고, 6개 섹션을 모두 채운다.

```
출력 파일: docs/MIXIN_SPEC_EXAMPLE_[MixinName].md

  섹션 1: 기능 정의 (목적 + 기능 + 기존 Mixin과의 관계)
  섹션 2: 인터페이스 (cssSelectors, datasetAttrs, 기타 옵션)
  섹션 3: renderData 기대 데이터 (또는 "해당 없음" + 직접 호출 파라미터)
  섹션 4: 주입 네임스페이스 (메서드/속성 테이블)
  섹션 5: destroy 범위
  섹션 6: 사용 예시
```

**체크리스트 (빠뜨리기 쉬운 것):**

- [ ] 섹션 1에서 "기존 Mixin과의 관계"를 채웠는가
- [ ] 섹션 2에서 규약 KEY와 사용자 정의 KEY를 구분했는가
- [ ] 섹션 4의 메서드 테이블에 destroy가 포함되어 있는가
- [ ] 섹션 5의 destroy 범위가 섹션 4의 모든 항목을 정리하는가
- [ ] 섹션 6의 사용 예시가 register.js 3단계 패턴을 따르는가
- [ ] 네임스페이스 이름이 기존 Mixin과 충돌하지 않는가

### 5단계: 사용자 승인

명세서를 사용자에게 제시하고 승인을 기다린다.

**승인 전에 구현하지 않는다.**

승인 후 → implement-mixin SKILL로 진행한다.

---

## 금지 사항

- ❌ 요구사항을 받자마자 바로 코드를 작성
- ❌ 기존 Mixin과의 중복 확인 없이 새 Mixin 제안
- ❌ 목적과 수단이 불명확한 상태로 명세서 작성
- ❌ 명세서 승인 전 구현 착수
- ❌ MIXIN_SPEC_TEMPLATE.md의 섹션을 생략

---

## 관련 자료

| 문서 | 위치 |
|------|------|
| 기능의 정의 | [COMPONENT_SYSTEM_DESIGN.md — 기능의 정의](/RNBT_architecture/DesignComponentSystem/docs/COMPONENT_SYSTEM_DESIGN.md#기능의-정의) |
| 명세서 템플릿 | [MIXIN_SPEC_TEMPLATE.md](/RNBT_architecture/DesignComponentSystem/docs/MIXIN_SPEC_TEMPLATE.md) |
| 현재 Mixin 목록 | [Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md) |
| Mixin 범용성 검토 | [MIXIN_REVIEW.md](/RNBT_architecture/DesignComponentSystem/docs/MIXIN_REVIEW.md) |
| 기능 패턴 검증 | [FUNCTION_PATTERN.md](/RNBT_architecture/DesignComponentSystem/docs/FUNCTION_PATTERN.md) |
| 모범답안 (9개) | [docs/MIXIN_SPEC_EXAMPLE_*.md](/RNBT_architecture/DesignComponentSystem/docs/) |

---
