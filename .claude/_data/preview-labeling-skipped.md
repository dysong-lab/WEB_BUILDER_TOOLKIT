# Preview 라벨링 누락 목록

`apply-preview-labels-auto` SKILL이 자동 처리에 실패한 항목. 사람이 수동 검토 후 라벨 적용 + 본 파일에서 행 제거.

기록 형식:
- `컴포넌트경로`: 예) `Components/Buttons/IconButtons` 또는 `Components/3D_Components/BATT/Advanced/highlight`
- `파일명`: 예) `01_refined.html`
- `실패사유`: 예) "라벨 2/4 등장 — [PAGE], [PREVIEW 전용] 누락" 또는 "[COMPONENT register.js 본문] 종료 주석 부재"
- `시각`: ISO 8601

| 컴포넌트경로 | 파일명 | 실패사유 | 시각 |
|-------------|--------|---------|------|
| Components/Divider/Standard | 01_refined.html, 02_material.html, 03_editorial.html, 04_operational.html | `<script>` 블록 자체가 부재 — 시각 전용 컴포넌트, register.js Mixin 불필요. 라벨링 대상 코드 0줄. | 2026-04-28 |
| Components/Loading/LoadingIndicator/Standard | 01_refined.html, 02_material.html, 03_editorial.html, 04_operational.html | `<script>` 블록 자체가 부재 — 시각/CSS 전용 컴포넌트. 라벨링 대상 코드 0줄. | 2026-04-28 |
