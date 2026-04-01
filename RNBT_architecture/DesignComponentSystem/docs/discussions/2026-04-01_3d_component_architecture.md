# 3D 컴포넌트 아키텍처 설계

> 날짜: 2026-04-01
> 상태: 확정 — BATT 3종 변형 구현 완료
> 관련 커밋: b6a8bca, 18e8067, 25a80a8, d24b640, 60e86a6

---

## 1. 배경

### 1.1 컨테이너 기본값 부재

기존 2D 컴포넌트의 CSS에는 컨테이너 자체의 크기/레이아웃 선언이 없었다. preview HTML에 흩어져 있어 빌더 배치 시 초기 크기를 알 수 없었다.

### 1.2 3D 컴포넌트 부재

DesignComponentSystem에 2D 컴포넌트만 존재했고, 3D 모델(GLTF) 기반 컴포넌트의 디렉토리 컨벤션과 Mixin 조합 패턴이 정의되지 않았다.

### 1.3 3D 팝업 미지원

기존 ShadowPopupMixin은 DOM 기반(appendElement.querySelector)으로 동작하여, appendElement가 THREE.Group인 3D 컴포넌트에서 사용 불가했다.

---

## 2. 결정 사항

### 2.1 컨테이너 기본값 선언 (22개 CSS)

각 컴포넌트 CSS 최상단에 width, height, display, overflow를 명시한다.

```css
#barchart-container {
    width: 700px;
    height: auto;
    display: block;
    overflow: hidden;
}
```

| 결정 | 근거 |
|------|------|
| CSS에 선언 (메타데이터 아님) | 컴포넌트가 자신의 기본 크기를 소유. 별도 파일 불필요 |
| overflow: hidden 통일 | 내부 스크롤을 가진 컴포넌트(Sidebar, EventBrowser, Tabulator)는 내부에서 처리 |
| preview에서 크기 제거 | CSS가 단일 진실 원천. preview는 margin: 0 auto만 유지 |

### 2.2 3D 컴포넌트 디렉토리 구조

**핵심 원칙: 모델이 기준, Mixin 조합이 변형**

```
3D_Components/
└── BATT/
    ├── scripts/
    │   ├── 01_status/              ← MeshStateMixin 단독
    │   │   ├── component/
    │   │   │   ├── register.js
    │   │   │   └── beforeDestroy.js
    │   │   └── page/
    │   │       ├── before_load.js
    │   │       ├── loaded.js
    │   │       └── before_unload.js
    │   ├── 02_status_camera/       ← MeshState + CameraFocus
    │   │   ├── component/
    │   │   └── page/
    │   └── 03_status_popup/        ← MeshState + 3DShadowPopup
    │       ├── component/
    │       └── page/
    └── preview/
        ├── 01_status.html
        ├── 02_status_camera.html
        └── 03_status_popup.html
```

| 결정 | 대안 | 채택 근거 |
|------|------|----------|
| 모델 = 디렉토리 | 기능별 범주화(SingleMesh/MultiMesh) | 같은 모델이 Mixin에 따라 분화하므로 모델 기준이 자연스러움 |
| 변형별 폴더 | 플랫 파일(01_status_register.js) | 파일 수 증가 시 가독성. component/page 분리 가능 |
| component/page 분리 | 단일 폴더 | 라이프사이클 역할이 폴더명만으로 명확 |
| 변형 번호 순서 = 복잡도 순서 | 무순서 | 01→02→03으로 학습 경로 제공 |

### 2.3 2D vs 3D 구조 비교

```
2D 컴포넌트                          3D 컴포넌트
────────────────────                ────────────────────
views/  (HTML 템플릿)               (없음 — 모델 자체가 view)
styles/ (CSS 테마)                  (없음 — material이 style)
scripts/                            scripts/{변형}/
  register.js                         component/register.js
  beforeDestroy.js                    component/beforeDestroy.js
                                      page/before_load.js
                                      page/loaded.js
                                      page/before_unload.js
preview/                            preview/
  01_corporate.html                   01_status.html
  02_dark_tech.html                   02_status_camera.html
```

### 2.4 3DShadowPopupMixin 신설

| 항목 | 2D ShadowPopupMixin | 3D 3DShadowPopupMixin |
|------|---------------------|----------------------|
| 콘텐츠 소스 | DOM `<template>` 태그 탐색 | getHTML()/getStyles() 문자열 |
| Host 부착 위치 | instance.appendElement | instance.page.appendElement |
| 네임스페이스 | this.shadowPopup | this.shadowPopup (동일) |
| 인터페이스 | show/hide/query/bindPopupEvents/destroy | 동일 |

**별도 Mixin으로 분리한 이유**: 같은 함수에 옵션으로 2D/3D 모드를 넣으면 사용 시 혼동. 이름만으로 용도가 명확한 것이 낫다.

**팝업 설계 원칙**: Mixin은 팝업 인프라(생성/표시/숨김/쿼리/정리)만 제공. 팝업 내용 구성은 컴포넌트 개발자가 `showDetail` 등에서 `query()`로 직접 구성. cssSelectors/datasetAttrs 객체 매핑은 이 수준에서 과도하다고 판단.

---

## 3. 모델 분석 결과

9종 모델의 메시 구조를 분석하여 향후 확장 기준을 확보했다.

| 모델 | 메시 수 | 애니메이션 | 비고 |
|------|---------|-----------|------|
| BATT | 1 | ✗ | 단일 메시 |
| Chiller | 1 | ✗ | 단일 메시 |
| Panel | 1 | ✗ | 단일 메시 |
| UPS | 1 | ✗ | 단일 메시 |
| tempHumiTH2B | 1 | ✗ | 단일 메시 |
| thermohygrostat | 1 | ✗ | 단일 메시 |
| CoolingTower | 2 | ✗ | waterTower + waterTowerLadder_A |
| HV | 6 | ✗ | DN, DN_cap, UP, UP_cap, sign×2 |
| Generator | 3 | ✓(1) | Generator + mesh_A + blade |

---

## 4. 미결 사항

### 4.1 page 스크립트 중복

01_status, 02_status_camera, 03_status_popup의 page/loaded.js가 거의 동일하다. 데이터 매핑만 다를 때 boilerplate가 반복된다.

→ 변형이 늘어나면 공통 page 템플릿 추출을 검토

### 4.2 다중 메시 모델 패턴

HV(6메시), CoolingTower(2메시)는 부품별 개별 상태 관리가 필요하다. 현재 MeshStateMixin의 renderData가 `[{ meshName, status }]` 배열을 받으므로 구조적으로는 지원 가능하나, 부품별 colorMap이 다를 수 있다.

→ HV 또는 CoolingTower 구현 시 검증 필요

### 4.3 애니메이션 Mixin

Generator는 blade 회전 애니메이션을 보유한다. 현재 Mixins/에 AnimationMixin이 없다.

→ Generator 구현 시 설계

### 4.4 publishCode 관리

3DShadowPopupMixin은 getHTML()/getStyles()로 문자열을 받는다. 실제 운영에서는 `this.properties.publishCode`에 저장되지만, DesignComponentSystem에서는 이 HTML/CSS를 어디에 관리할지 미정이다.

→ 컴포넌트 내 views/ 폴더 활용 또는 별도 popup/ 폴더 검토

### 4.5 CSS 메타데이터 전환 시점

컨테이너 기본값이 CSS에 있으므로 빌더 런타임에서 프로그래밍적으로 읽으려면 CSS 파싱이 필요하다. 빌더 통합 시 JSON 메타데이터가 필요해질 수 있다.

→ 빌더 통합 단계에서 판단

---

## 5. 변경 이력

| 커밋 | 내용 |
|------|------|
| b6a8bca | 컨테이너 기본값 선언 (22개 CSS) |
| 18e8067 | preview 크기 제거 + 3D 모델 에셋 추가 |
| 25a80a8 | Equipment3D/BATT 첫 구현 |
| d24b640 | 3D_Components로 이름 변경 + 변형별 폴더 + component/page 분리 |
| 60e86a6 | 3DShadowPopupMixin + 03_status_popup 변형 |
