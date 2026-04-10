# 스킬 공통 인덱스

모든 SKILL이 공통으로 참조하는 가벼운 인덱스다.

## 읽기 정책

- 새 세션 시작 시 1회 읽는다.
- 같은 세션에서는 대상 파일이 바뀌거나 작업 유형이 바뀔 때만 다시 읽는다.
- 실제 코드 작성이 시작되면 `SHARED_PATTERNS.md`를 추가로 읽는다.

## 작업 전 필수 확인

| 스킬 단계 | 기본 확인 문서 |
|-----------|---------------|
| 1-figma | `/Figma_Conversion/README.md`, `/Figma_Conversion/CLAUDE.md`, `/.claude/guides/CODING_STYLE.md` |
| 2-component | `/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md`, `/.claude/guides/CODING_STYLE.md`, 사용할 Mixin 문서 |
| 2-component 디자인 변형 추가 | 대상 `register.js`, `/.claude/guides/CODING_STYLE.md`, 기존 `views/` |
| 3-page | `/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md`, `/.claude/guides/CODING_STYLE.md`, 사용할 Mixin 문서 |
| 6-design | `/.claude/guides/CODING_STYLE.md`, 선택된 페르소나 문서, 필요 시 `design-primitives.md` |

## Mixin 문서

| Mixin | 문서 |
|-------|------|
| FieldRenderMixin | `/RNBT_architecture/DesignComponentSystem/Mixins/FieldRenderMixin.md` |
| ListRenderMixin | `/RNBT_architecture/DesignComponentSystem/Mixins/ListRenderMixin.md` |
| EChartsMixin | `/RNBT_architecture/DesignComponentSystem/Mixins/EChartsMixin.md` |
| TabulatorMixin | `/RNBT_architecture/DesignComponentSystem/Mixins/TabulatorMixin.md` |
| HeatmapJsMixin | `/RNBT_architecture/DesignComponentSystem/Mixins/HeatmapJsMixin.md` |
| MeshStateMixin | `/RNBT_architecture/DesignComponentSystem/Mixins/MeshStateMixin.md` |
| CameraFocusMixin | `/RNBT_architecture/DesignComponentSystem/Mixins/CameraFocusMixin.md` |
| ShadowPopupMixin | `/RNBT_architecture/DesignComponentSystem/Mixins/ShadowPopupMixin.md` |
| 3DShadowPopupMixin | `/RNBT_architecture/DesignComponentSystem/Mixins/3DShadowPopupMixin.md` |
| TreeRenderMixin | `/RNBT_architecture/DesignComponentSystem/Mixins/TreeRenderMixin.md` |

## 공통 원칙 요약

- CSS는 `px` 기준, Flexbox 우선
- 컴포넌트는 데이터 fetch를 직접 하지 않음
- DOM 접근은 selector 계약을 통해서만 수행
- 생성한 상태는 `beforeDestroy.js`에서 역순으로 정리
- 상세 구현 패턴은 `SHARED_PATTERNS.md` 참조
