# TRADEMARK & MARKETING GUIDELINES

이 문서는 `DesignComponentSystem`을 마케팅·영업·외부 커뮤니케이션에 노출할 때 **제3자 상표(특히 "Material Design")를 어떻게 다뤄야 하는가**에 대한 실무 가이드입니다.

> 법적 효력이 있는 자문이 아닙니다. 구체적 문구가 걱정될 때는 반드시 법무 검토를 받으십시오.

---

## 1. 왜 이 문서가 필요한가

`DesignComponentSystem`은 다음 두 가지 방식으로 Material Design을 참조합니다.

- **범주 분류 체계** — MD3 taxonomy를 그대로 차용
- **페르소나 중 하나(`02_material`)** — MD3 시각 규격을 참조해 디자인

이 때문에 외부 커뮤니케이션에서 "Material Design" 또는 "Google"을 언급하고 싶은 유혹이 생깁니다. 그러나:

- **"Material Design"은 Google LLC의 상표**입니다.
- 상표를 부적절하게 사용하면 **Google과의 제휴·승인·지원 관계가 있다는 오해**를 유발하며, 이는 상표 희석(trademark dilution)이나 부정경쟁행위로 간주될 수 있습니다.
- **미국·한국·EU 모두** 동일한 원칙이 적용됩니다.

결과적으로 **마케팅·영업 자료에서 "Material Design" 언급은 기본적으로 피하는 것이 안전**합니다.

---

## 2. Nominative Fair Use (지시적 공정 사용)

상표법에는 예외적으로 제3자 상표를 **언급**할 수 있는 법리가 있습니다. "Nominative fair use"라 부르며, 다음 3가지 조건을 모두 충족해야 합니다.

1. **필요성** — 해당 상표를 쓰지 않고는 상품·서비스를 설명하기 어려움
2. **최소 사용** — 식별에 필요한 최소한만 사용 (로고·스타일 모방 금지)
3. **오해 방지** — 상표권자와의 후원·제휴 관계가 없음이 명확

본 프로젝트는 **Material Design이라는 상표 없이도 제품 설명이 가능**하므로, 조건 1부터 충족이 어렵습니다. 따라서 마케팅 문구에서 이 상표를 굳이 사용할 실익이 작습니다.

---

## 3. 안전한 표현 vs 위험한 표현

### ✅ 안전한 표현

상표 없이 제품 특징을 기술하는 방식:

- "업계 표준 디자인 시스템 분류 체계를 따릅니다"
- "현대적인 웹 디자인 관행에 기반한 컴포넌트 라이브러리"
- "4가지 디자인 페르소나(Refined / Material / Editorial / Operational)를 제공합니다"
  - → 여기서 "Material"은 페르소나 **식별자**로 사용된 것이므로 허용
- "Google Fonts를 통해 Roboto 폰트를 로드합니다" (객관적 사실 기술)
- "오픈소스 폰트를 활용한 타이포그래피"

### ⚠️ 애매한 표현 (맥락에 따라 문제 소지)

명시적 기술은 맞지만, 소비자가 Google 제휴를 오해할 수 있음:

- "Material Design 3 스타일을 지원합니다"
- "Material Design 가이드라인을 따릅니다"
- "Material Design 호환 컴포넌트"

→ 꼭 필요하면 다음처럼 **중립적 출처 표시**를 덧붙이세요:

> "`02_material` 페르소나는 Google의 Material Design 3 공식 문서를 참조한 시각 규격을 채택합니다.
> 본 제품은 Google LLC와 제휴·후원·승인 관계가 없습니다."

### ❌ 사용 금지 표현

상표권자와의 관계를 **오해하게 만드는 표현**:

- "Google Material Design 기반 솔루션"
- "Material Design Certified / Official / Partner"
- "Google Material Design 공식 지원"
- "Material Design 인증 컴포넌트"
- Material Design 로고 또는 공식 아이콘 세트의 **상표적 사용** (브랜드 자산으로 활용)
- "Google이 권장하는" / "Google 표준의"
- Google 브랜드 컬러·타이포 조합을 제품 로고에 차용

---

## 4. Material Symbols / Google Fonts 언급 시

폰트 자산을 **기능적으로 사용한다는 사실 기술**은 문제없습니다. 다만 다음 구분을 지키세요.

### ✅ 허용
- "Google Fonts의 Roboto 폰트를 본문에 사용합니다"
- "Material Symbols 아이콘 세트를 활용합니다"

### ❌ 금지
- "Google 공식 디자인 자산으로 제작"
- "Google이 지원하는 폰트 시스템"
- 로고나 홍보물에 Google 공식 로고 병기

---

## 5. 페르소나 명칭 사용 가이드

`02_material` 페르소나의 **내부 식별자**는 개발 문서에서는 그대로 사용해도 됩니다. 그러나 **외부 노출 문서(제품 소개, 데모 페이지, 영업 자료)**에서는 다음 두 가지 방식 중 하나를 선택하세요.

### 방식 A — 상표 회피 리네이밍
외부 자료에서만 다른 명칭으로 표기:

| 내부명 | 외부 노출명 (예시) |
|--------|------------------|
| `01_refined` | Refined |
| `02_material` | **Vibrant** / **Cheerful** / **Bright** |
| `03_editorial` | Editorial |
| `04_operational` | Operational |

### 방식 B — 소문자 일반명사로 사용
`material`을 고유명사가 아닌 일반 형용사로 표기하고, **단독 사용을 피하되 문맥으로 감싸기**:

- "material-style persona" (소문자 일반 형용사)
- "a material-inspired theme variant"

두 방식 중 **방식 A가 더 안전**합니다. 법적 리스크를 최소화하려면 외부 자료에서 페르소나명 자체를 변경하십시오.

---

## 6. 체크리스트

마케팅·영업 자료 공개 전 다음 질문에 모두 "예"라고 답할 수 있어야 합니다.

- [ ] Google / Material Design과의 **제휴·후원 관계를 암시하지 않는가?**
- [ ] Google 로고·Material Design 공식 자산(브랜드 마크·컬러 팔레트 등)을 **사용하지 않았는가?**
- [ ] "공식(Official)", "인증(Certified)", "기반(Based on)", "지원(Endorsed)" 등 관계성 단어를 **Google/Material Design과 붙여 쓰지 않았는가?**
- [ ] 페르소나 `02_material`을 외부 노출 시 **대안 명칭으로 바꿨거나** 중립적 맥락으로 감쌌는가?
- [ ] Material Design 언급이 불가피한 경우, **"Google LLC와 제휴·후원 관계 없음"** 면책 문구를 포함했는가?

---

## 7. 참고 자료

- Google 브랜드 사용 지침: https://about.google/brand-resource-center/
- Material Design 라이선스: https://m3.material.io/ (문서는 CC BY 4.0, 코드는 Apache 2.0)
- Google Fonts FAQ: https://developers.google.com/fonts/faq
- 관련 상표 고지: 본 프로젝트의 [NOTICE.md](./NOTICE.md)

---

## 8. 의심되면 법무 검토

이 문서는 실무 가이드이며, **구체적인 마케팅 문구·영업 자료의 법적 안전성을 보장하지 않습니다.**

다음과 같은 경우 **반드시 법무 검토를 받으십시오**:

- 제품 소개 페이지에 "Material Design" 명칭을 표기하고 싶은 경우
- 공식 파트너십·제휴 관계를 언급하려는 경우
- Google/Material 로고 또는 공식 자산을 시각적으로 활용하려는 경우
- 해외(미국·EU·일본 등) 시장 진출 자료에 포함되는 경우

---

*최종 업데이트: 2026-04-13*
