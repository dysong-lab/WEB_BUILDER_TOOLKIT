# 3D 컴포넌트 대량생산 플랜

## 목표

10개 GLTF 모델 전체에 3D 컴포넌트를 구현한다.
현재 7/10 완료, 나머지 3개(CoolingTower, Generator, HV)를 추가.

**핵심**: 신규 3개 모두 멀티 메시(컨테이너) 패턴. gltf_container를 참조 템플릿으로 사용.

---

## 1. 3D 아키타입 (3개)

### 3D-A. Status Only

```
applyMeshStateMixin(this, { colorMap })
→ subscribe(equipmentStatus → this.meshState.renderData)
```

- 메시 색상만 변경
- 인터랙션 없음
- register.js ~25줄, beforeDestroy.js ~12줄

### 3D-B. Status + Camera

```
applyMeshStateMixin(this, { colorMap })
→ applyCameraFocusMixin(this, { camera, controls, duration: 1000 })
→ subscribe(equipmentStatus → this.meshState.renderData)
→ bind3DEvents(click → @meshClicked)
```

- 클릭 시 카메라 포커스 이동
- 컨테이너: `resolveMeshName()` 추가
- register.js ~45줄, beforeDestroy.js ~20줄

### 3D-C. Status + Popup

```
applyMeshStateMixin(this, { colorMap })
→ subscribe(equipmentStatus → this.meshState.renderData)
→ apply3DShadowPopupMixin(this, { getHTML, getStyles, onCreated })
→ bind3DEvents(click → @meshClicked)
→ this.showDetail = () => { ... }
```

- 클릭 시 Shadow DOM 팝업
- `showDetail()`이 `meshState.getMeshState()` 결과를 팝업에 표시
- 컨테이너: `resolveMeshName()` + `showDetail(meshName)` 매개변수화
- register.js ~65줄, beforeDestroy.js ~25줄

---

## 2. 현황

### 완료: 7개 × 3변형 = 21개

| 컴포넌트 | 유형 | 참조 SKILL |
|----------|------|-----------|
| BATT, Chiller, Panel, UPS, tempHumiTH2B, thermohygrostat | 단일 메시 | create-3d-component |
| gltf_container | 컨테이너 | create-3d-container-component |

### 미구현: 3개 모델

| 모델 | 메시 수 | 유형 | 참조 패턴 |
|------|--------|------|----------|
| CoolingTower | 2 | 컨테이너 | gltf_container |
| Generator | 3 | 컨테이너 | gltf_container |
| HV | 6 | 컨테이너 | gltf_container |

---

## 3. 신규 컴포넌트 스펙

### CoolingTower (2 메시)

**메시 구성**: GLTF 내 2개의 명명된 메시 (냉각탑 본체 + 팬)

```
변형 01_status:
    colorMap: { normal: 0x34d399, warning: 0xfbbf24, error: 0xf87171, offline: 0x6b7280 }
    subscription: equipmentStatus → meshState.renderData

변형 02_status_camera:
    + CameraFocusMixin({ camera, controls, duration: 1000 })
    + resolveMeshName(event) — 레이캐스팅 결과에서 메시 이름 추출
    + bind3DEvents: click → @meshClicked

변형 03_status_popup:
    + 3DShadowPopupMixin({ getHTML, getStyles, onCreated })
    + showDetail(meshName) — 클릭된 메시의 상태를 팝업에 표시
    + bind3DEvents: click → @coolingTowerClicked
```

### HV (6 메시)

**메시 구성**: GLTF 내 6개의 명명된 메시 (고압 장비 모듈)

CoolingTower와 동일한 패턴. 메시 수가 많아도 `resolveMeshName()`과 `meshState.renderData()`가 배열 기반이므로 코드 변경 없음.

유일한 차이: mock 데이터에 6개 항목.

### Generator (3 메시)

**메시 구성**: GLTF 내 3개의 명명된 메시 (발전기 + 부속)

CoolingTower와 동일한 패턴. 애니메이션이 포함된 경우 별도 핸들링 필요 가능성 있음 → 구현 시 GLTF 내 AnimationClip 존재 여부 확인.

---

## 4. 파일 구조 (컴포넌트당)

```
3D_Components/[Name]/
    scripts/
        01_status/
            component/
                register.js          ← 3D-A 아키타입
                beforeDestroy.js
            page/
                before_load.js       ← (빈 파일 또는 최소)
                loaded.js            ← 데이터 매핑 + fetchAndPublish
                before_unload.js     ← 인터벌 정리
        02_status_camera/
            component/
                register.js          ← 3D-B 아키타입
                beforeDestroy.js
            page/
                before_load.js       ← 레이캐스팅 + 카메라 이벤트 핸들러
                loaded.js
                before_unload.js
        03_status_popup/
            component/
                register.js          ← 3D-C 아키타입
                beforeDestroy.js
            page/
                before_load.js       ← 레이캐스팅 + 팝업 이벤트 핸들러
                loaded.js
                before_unload.js
    preview/
        01_status.html               ← Three.js 씬 + mock 데이터
        02_status_camera.html
        03_status_popup.html
```

**변형당**: component 2개 + page 3개 = 5개 파일
**컴포넌트당**: 5 × 3변형 + 3 preview = **18개 파일**
**총 신규**: 18 × 3컴포넌트 = **54개 파일**

---

## 5. 생산 워크플로우

### 생산 순서

1. **CoolingTower** — 2메시, 가장 단순한 컨테이너
2. **HV** — 6메시, CoolingTower 패턴 재활용
3. **Generator** — 3메시, 애니메이션 확인 필요

### gltf_container → 신규 컴포넌트 변환 절차

1. `gltf_container/scripts/` 전체 복사
2. 이벤트 이름 변경: `@meshClicked` → `@coolingTowerClicked` 등
3. `showDetail()` 내 컴포넌트 이름 변경
4. GLTF 모델에서 실제 메시 이름 확인 (파일 열어서 `"name":` 검색)
5. preview HTML에서 모델 경로 + 메시 이름 업데이트
6. preview로 렌더링 검증

### 메시 이름 확인 방법

```bash
# GLTF 파일에서 메시 이름 추출
grep -o '"name":"[^"]*"' models/CoolingTower/CoolingTower.gltf
```

---

## 6. 검증 체크리스트

### 변형별 검증 (매 변형)

- [ ] register.js가 해당 아키타입(3D-A/B/C) 패턴을 따름
- [ ] beforeDestroy.js가 register.js의 정확한 역순
- [ ] colorMap이 공통 값과 동일
- [ ] subscription topic이 `equipmentStatus`

### 컨테이너 전용 검증

- [ ] `resolveMeshName()`이 구현됨 (02, 03 변형)
- [ ] 부모 체인 순회로 명명된 메시 탐색
- [ ] `showDetail(meshName)` 매개변수화 (03 변형)

### preview 검증

- [ ] Three.js 씬이 에러 없이 렌더링
- [ ] GLTF 모델 로딩 성공
- [ ] mock 데이터로 메시 색상 변경 확인
- [ ] 02: 클릭 시 카메라 이동
- [ ] 03: 클릭 시 팝업 표시/숨김

---

## 7. 요약

| 항목 | 값 |
|------|---|
| 기존 3D 컴포넌트 | 7개 (21개 변형) |
| 신규 | 3개 (9개 변형) |
| 완료 후 | **10개** (30개 변형) |
| 아키타입 | 3개 (3D-A, 3D-B, 3D-C) |
| 신규 파일 | ~54개 |
| 참조 템플릿 | gltf_container |
| 유형 | 전부 컨테이너 (멀티 메시) |
