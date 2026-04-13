# NOTICE — Third-Party Attributions & Licensing

이 문서는 `DesignComponentSystem`이 참조하거나 런타임에 사용하는 외부 리소스와 그 라이선스를 명시합니다.

---

## 1. Design System Taxonomy

### Material Design 3 (MD3)

`DesignComponentSystem`은 컴포넌트 분류 체계로 Google의 **Material Design 3** taxonomy를 차용합니다.

**차용 범위**:
- 컴포넌트 범주명 (예: `FAB`, `ExtendedFABs`, `Chips`, `AppBars`, `NavigationDrawer` 등)
- 하위 범주명 (예: `Chips/Assist`, `Chips/Filter`, `Sliders/Range` 등)
- 각 범주 `CLAUDE.md`의 "MD3 정의" 섹션에 인용된 한 문장 정의
  - 예: *"Buttons help people take actions, such as sending an email, sharing a document, or liking a comment."*

**차용하지 않는 것**:
- MD3의 시각 디자인 토큰(컬러, 타이포, 엘리베이션 등)은 직접 적용하지 않음
- 컴포넌트 동작 로직은 본 프로젝트의 독자 구현 (FieldRenderMixin, ListRenderMixin 등)

**라이선스**:
Material Design 문서는 [Creative Commons Attribution 4.0 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) 하에 배포됩니다.
Copyright © Google LLC. *"Material Design"* is a trademark of Google LLC.
출처: https://m3.material.io/

---

## 2. Typography & Iconography

다음 폰트 자산은 런타임에 외부 CDN(Google Fonts, jsDelivr)에서 로드되어 사용됩니다.

### Material Symbols Outlined

- **용도**: 모든 페르소나의 아이콘 렌더링 (ligature 기반)
- **로드 위치**: Google Fonts
  ```
  https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0
  ```
- **라이선스**: [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- **저작권**: Copyright © Google LLC

### Roboto

- **용도**: `02_material` 페르소나 본문 폰트
- **로드 위치**: Google Fonts
- **라이선스**: Apache License 2.0
- **저작권**: Copyright © Google LLC / Christian Robertson

### JetBrains Mono

- **용도**: `04_operational` 페르소나 본문 폰트
- **로드 위치**: Google Fonts
- **라이선스**: [SIL Open Font License 1.1](https://scripts.sil.org/OFL)
- **저작권**: Copyright © 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono)

### Pretendard

- **용도**: `01_refined` 페르소나 본문 폰트 (한글/영문)
- **로드 위치**: jsDelivr CDN (`orioncactus/pretendard@v1.3.9`)
- **라이선스**: SIL Open Font License 1.1
- **저작권**: Copyright © 2021 Kil Hyung-jin (https://github.com/orioncactus/pretendard)

### Georgia

- **용도**: `03_editorial` 페르소나 본문 폰트
- **비고**: OS에 기본 탑재된 시스템 폰트 (별도 로드 없음)

---

## 3. Design Attribution

`DesignComponentSystem`의 각 컴포넌트는 **4개 페르소나(Persona) 변형**을 제공합니다. 각 페르소나는 서로 다른 디자인 의도를 반영합니다.

| 페르소나 | 디자인 방향 | Material Design 참조 여부 |
|----------|------------|--------------------------|
| `01_refined` | 다크 퍼플 / Pretendard / 정제된 모던 | 참조하지 않음 — 독자 디자인 |
| `02_material` | 라이트 / Roboto / **MD3 시각 언어 구현** | **참조함** — MD3 spec 기반 |
| `03_editorial` | 웜 뉴트럴 / Georgia / 에디토리얼 | 참조하지 않음 — 독자 디자인 |
| `04_operational` | 다크 시안 / JetBrains Mono / 컴팩트 운영 | 참조하지 않음 — 독자 디자인 |

**`02_material` 페르소나**는 Material Design 3의 시각 규격(컬러 팔레트, 엘리베이션, 쉐이프, 타이포 스케일 등)을 참조하여 구현합니다. 단, 공식 MD3 컴포넌트 라이브러리의 코드를 직접 복사하지는 않으며, CSS는 본 프로젝트에서 독자 작성됩니다.

**다른 3개 페르소나**의 디자인(HTML/CSS)은 본 프로젝트의 독자 저작물입니다.

---

## 4. How to Comply

### 현재 배포 방식 (CDN 로드)

모든 폰트 자산은 런타임에 공식 CDN(Google Fonts, jsDelivr)에서 로드됩니다. 이 방식에서는 각 서비스의 이용 약관에 따라 **별도 라이선스 고지 없이도 법적 요구사항이 충족**됩니다.

- Google Fonts 이용 약관: https://developers.google.com/fonts/faq
- jsDelivr 이용 약관: https://www.jsdelivr.com/terms

### 폰트를 번들링 / 재배포하는 경우

폰트 파일을 로컬에 복사하여 함께 배포하는 경우, 다음 조치가 필요합니다.

1. **Apache 2.0 폰트** (Material Symbols, Roboto)
   - 라이선스 원문(`LICENSE` 또는 `LICENSE.txt`)을 폰트 파일과 함께 동봉
   - NOTICE 파일에 저작권 고지 포함 (본 문서가 그 역할)

2. **SIL OFL 1.1 폰트** (JetBrains Mono, Pretendard)
   - 라이선스 원문을 폰트 파일과 함께 동봉
   - 저작권 표시 유지
   - 폰트 파일명에 "Reserved Font Name"이 포함된 경우 해당 이름으로 수정 배포 금지

### Material Design 문서 인용 (CC BY 4.0)

각 범주 `CLAUDE.md`의 "MD3 정의" 섹션은 MD3 공식 문서 문장을 직접 인용합니다. CC BY 4.0 준수를 위해:

- 본 `NOTICE.md`에서 출처(https://m3.material.io/)를 명시함
- 인용 문장은 원문 그대로 유지 (번역/개작하지 않음)

---

## 5. 문의

라이선스 또는 저작권 관련 이슈는 프로젝트 관리자에게 문의하십시오.

*최종 업데이트: 2026-04-13*
