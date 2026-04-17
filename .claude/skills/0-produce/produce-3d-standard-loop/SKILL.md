---
name: produce-3d-standard-loop
description: 3D 컴포넌트의 Standard 변형(MeshState만)을 models/ 알파벳 순서대로 순차 생산합니다. 한 사이클에 하나의 장비를 생산하고, /compact 후 "계속"으로 다음 장비를 생산합니다.
---

# 3D Standard 컴포넌트 순차 생산

## 목표

DesignComponentSystem/Components/3D_Components 아래의 3D 컴포넌트 **Standard 변형(MeshState만)** 을 models/ 알파벳 순서대로 생산한다.
한 사이클에 하나의 장비를 생산하고, 사용자가 `/compact` 후 "계속"을 입력하면 다음 장비를 생산한다.

> **Advanced 변형은 `produce-3d-advanced-loop`을 사용한다.** 이 루프는 Standard가 완료된 장비만 대상으로 한다.

---

## 2D 루프와의 대칭

| 측면 | 2D (produce-standard-loop) | 3D (이 문서) |
|------|---------------------------|-------------|
| 대상 결정 | 폴더 알파벳 순 자동 순회 | models/ 알파벳 순 자동 순회 |
| 완료 판정 | register.js 존재 여부 | register.js 존재 여부 |
| 변형 기반 | CSS 페르소나 | Mixin 조합 (Standard = MeshState 단독) |
| 모델 의존 | 없음 | GLTF 모델 (없을 수 있음) |
| 개발 스킬 | create-2d-component | create-3d-component / create-3d-container-component |

---

## 사이클 절차

### Phase 0. 다음 대상 파악

대상 결정 규칙(입력측 `models/` / 출력측 `Components/3D_Components/` 구분, 개별 vs 컨테이너 유형 분기, 경로 변수 정의, 순회 스크립트, 유형별 개발 스킬 선택)은 [`_shared/phase0-3d.md`](../_shared/phase0-3d.md)를 따른다.

Phase 0 완료 후 **사용자에게 보고**: "다음 대상: {컴포넌트경로}, 유형: {개별/컨테이너}, Standard(MeshState) 생산"

대상이 없으면: "Standard가 누락된 장비가 없습니다. Advanced 변형은 `produce-3d-advanced-loop`을 사용하세요."

---

### Phase 1. produce-component 실행

`produce-component` SKILL.md의 Step 1~5를 따른다. 유형별 개발 스킬 선택은 Phase 0에서 결정된 유형에 따라 [`_shared/phase0-3d.md`](../_shared/phase0-3d.md)의 "유형별 개발 스킬" 표를 적용한다.

**출력 경로**: `Components/3D_Components/{컴포넌트경로}/Standard/`
**Mixin**: MeshState 단독

**중요 — 승인 없이 진행하지 않는다:**
- Step 2 기능 분석 결과 → 사용자 승인
- Step 4 CLAUDE.md → 사용자 승인

**승인 축약 모드**: 사용자가 "ㅇ", "응", "확인", "ㄱ" 등 짧은 긍정 응답을 하면 승인으로 간주하고 다음으로 진행한다.

### 모델 없이 작성하는 경우

모델이 없으면 [MODEL_READY] placeholder를 사용한다.

```javascript
// TODO: [MODEL_READY] 모델의 실제 meshName으로 교체
const MESH_NAME = '장비명';
```

모델 무관 파일은 100% 작성 가능:
- scripts/register.js (meshName만 placeholder)
- scripts/beforeDestroy.js
- page/loaded.js, before_load.js, before_unload.js

모델 도착 시 `grep -r "MODEL_READY"` 로 전수 교체.

---

### Phase 2. 커밋

생산 완료 후 커밋한다.

```
feat: 3D_Components/{컴포넌트경로} 컴포넌트 생산 — {한줄 설명}
```

---

### Phase 3. 사이클 종료

사용자에게 안내:

```
{컴포넌트경로}/Standard 생산 완료.
다음 대상: {다음 컴포넌트경로} ({유형}) — Standard(MeshState)

`/compact` 실행 후 "계속"을 입력해주세요.
```

---

## 디자인 페르소나 & CSS 조달 규칙 (팝업 등 HTML/CSS 생성 시)

3D Standard 변형 자체는 CSS 페르소나 기반이 아니지만, **팝업(`ShadowPopup`) 또는 `publishCode`에서 페르소나 4종을 따르는 HTML/CSS를 생성하는 경우**에는 `produce-component/SKILL.md` **Step 5-1 "디자인 페르소나 & CSS 조달 규칙"**의 원칙을 그대로 따른다.

---

## 참조 문서 (매 사이클 읽기)

- `produce-component` SKILL: `/.claude/skills/0-produce/produce-component/SKILL.md`
- `create-3d-component` SKILL: `/.claude/skills/2-component/create-3d-component/SKILL.md`
- `create-3d-container-component` SKILL: `/.claude/skills/2-component/create-3d-container-component/SKILL.md`
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
- CODING_STYLE: `/.claude/guides/CODING_STYLE.md`
- Mixin 카탈로그: `/RNBT_architecture/DesignComponentSystem/Mixins/README.md`
- 시스템 설계: `/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md`
