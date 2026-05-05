# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh) |
| 기본 Mixin | MeshStateMixin |

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/indoorUnitTemperature | 완료 |

> **CanvasTextureChartMixin 채택 철회.** 초기에 "1번째 채택"으로 ECharts canvas → THREE.CanvasTexture → PlaneGeometry mesh.material.map 매핑을 도입했으나 사이클 내 결함 발견 (texture 보간 흐릿 / 비스듬 각도 가독성 / 줌 영향 / UX 부자연) 후 DOM 차트로 전환. 신기법 자체의 가능성은 보존되나 본 컴포넌트는 후보에서 제거 — 차후 진짜 3D 공간 데이터 시각화가 필요한 컴포넌트(예: 건물 단면도 위 zone heatmap)에서 1번째 채택으로 다시 검토.
>
> **MeshTrackingHudMixin 승격 10번째 채택 — 임계점 명백히 초과 누적**: setData/setOffset/show/hide/start/stop/destroy + `addAnchorTarget/removeAnchorTarget` + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 10개 이상 컴포넌트에서 동일. **메인 외부에서 즉시 승격 강력 권장.** 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지.
