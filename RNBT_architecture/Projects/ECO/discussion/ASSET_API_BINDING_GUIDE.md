# 3D 모델 기반 Asset API 바인딩 가이드

## 핵심 개념

AssetTreePanel에서 장비를 하나씩 드래그하여 배치하지 않아도, **완성된 GLTF 모델의 메쉬에 assetKey만 입력하면 Asset API의 모든 데이터를 활용할 수 있습니다.**

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  기존 방식 (AssetTreePanel)                                   │
│    트리에서 장비 드래그 → 6개 필드 바인딩 → 컴포넌트 자동 생성   │
│                                                              │
│  완성 모델 방식 (이 가이드)                                     │
│    GLTF 로드 → 메쉬에 assetKey 1개 입력 → API 데이터 연결      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**assetKey 하나로 접근 가능한 API:**

| API | 엔드포인트 | 조회 내용 |
|-----|-----------|----------|
| 자산 상세 | `POST /api/v1/ast/gx` | 기본정보 + 동적 속성 (이름, 타입, 상태, 위치 등) |
| 실시간 메트릭 | `POST /api/v1/mh/gl` | 최근 1분 센서 데이터 (온도, 습도 등) |
| 메트릭 통계 | `POST /api/v1/mhs/l` | 기간별 통계 (평균, 최대, 최소) |

---

## 작업 흐름

### 1. 에디터에서 assetKey 할당

1. 3D 인스턴스 **더블클릭** → 메쉬 편집 모드
2. GUI 패널 `object3d` 폴더의 **assetKey** 필드에 자산 키 입력
3. 저장 → `threeJsProperties`에 자동 영속화

```
▼ pump_motor_001
  ▼ object3d
    name: pump_motor_001
    assetKey: ups-0001          ← Asset API의 assetKey
```

GUI 검색창에서 assetKey로도 메쉬를 검색할 수 있습니다.

### 2. 런타임에서 데이터 접근

저장된 assetKey는 뷰어에서 `mesh.userData.assetKey`로 자동 복원됩니다.

```javascript
// 컴포넌트 스크립트 (register.js) 내부
const { fetchData } = Wkit;

// this.appendElement: 현재 인스턴스의 3D 루트 오브젝트
this.appendElement.traverse((mesh) => {
  if (!mesh.userData?.assetKey) return;

  const { assetKey } = mesh.userData;

  // assetKey 하나로 모든 자산 데이터에 접근 가능
  fetchData(this.page, 'assetDetailUnified', { baseUrl: BASE_URL, assetKey, locale: 'ko' });
  fetchData(this.page, 'metricLatest', { baseUrl: BASE_URL, assetKey });
});
```

---

## AssetTreePanel 드래그 vs assetKey 직접 입력

| 항목 | AssetTreePanel (드래그) | assetKey 직접 입력 |
|------|------------------------|-------------------|
| 사용 시점 | 빈 씬에 장비를 개별 배치 | 완성 모델에 데이터 매핑 |
| 바인딩 정보 | 6개 필드 | **assetKey 1개** |
| 컴포넌트 매핑 | 자동 (UPS, PDU, CRAC 등) | 불필요 (이미 ModelLoader) |
| 트리 연동 | 배치됨 표시, 클릭 시 선택 | 없음 |
| 적합한 상황 | 장비별 개별 배치 | **대규모 모델 일괄 바인딩** |

AssetTreePanel은 "어떤 3D 컴포넌트를 생성할지"까지 결정합니다. 완성 모델 방식은 이미 모든 메쉬가 로드되어 있으므로, **assetKey만으로 API 데이터를 연결**하면 됩니다.

---

## 주의사항

1. **assetKey는 Asset API의 고유 키와 정확히 일치해야 합니다** — 오타 시 API 404 에러
2. **메쉬 이름과 assetKey는 독립** — 메쉬 이름은 3D 모델 내 식별용, assetKey는 API 연동용
3. **Ctrl+C/V 복제 시 assetKey도 복사됨** — 필요 시 복제 후 변경

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| `API_SPEC.md` | Asset API 전체 명세 (요청/응답 구조) |
| `datasetList.json` | 데이터셋 정의 (WScript에서 사용할 API 등록) |
| ECO 컴포넌트 (`UPS/`, `PDU/` 등) | fetchData + 렌더링 실제 구현 참고 |
