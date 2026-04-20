# 3D Phase 0 — 다음 대상 파악 (공통 규칙)

> 이 문서는 `produce-3d-standard-loop` / `produce-3d-standard-auto`가 공통으로 참조하는 Phase 0 대상 결정 규칙이다. 두 SKILL 모두 이 규칙을 따른다.

## 루프의 입력측 / 출력측

루프 순회 시 입력과 출력을 명확히 구분한다.

- **입력측** — `DesignComponentSystem/models/` 도메인. Phase 0 순회가 이 쪽을 돌며 후보를 결정한다. GLTF/텍스처 위치 결정.
- **출력측** — `DesignComponentSystem/Components/3D_Components/` 도메인. 생산 결과물(register.js, preview 등)이 놓일 위치.

### 경로 변수

- `{모델경로}` **(입력측)** : `models/` 아래 모델 폴더 상대경로.
- `{컴포넌트경로}` **(출력측)** : `Components/3D_Components/` 아래 컴포넌트 루트 상대경로.

현재 폴더 구조상 두 값은 **동일 문자열**로 해결되지만, 의미론적으로는 별개 공간이다. 향후 한쪽만 재편될 수 있으므로 개념을 구분한다.

## 유형 분기

`models/` 는 두 종류의 폴더로 구성된다:

- **개별 장비 모델 폴더** — `models/{장비명}/` (예: `models/BATT/`, `models/CoolingTower02/`)
- **컨테이너 그룹 폴더** — `models/meshesArea/{컨테이너명}/` (예: `models/meshesArea/area_01/`). `meshesArea/` 자체는 장비가 아닌 **그룹 폴더**이므로 순회 대상에서 제외한다.

`{컴포넌트경로}`/`{모델경로}` 해결 규칙:

| 유형 | `{컴포넌트경로}` / `{모델경로}` |
|------|-------------------------------|
| 개별 | `{장비명}` |
| 컨테이너 | `meshesArea/{컨테이너명}` |

유형별 개발 스킬:

| 유형 | 호출 스킬 |
|------|----------|
| 개별 (1 GLTF = 1 Mesh) | `create-3d-component` |
| 컨테이너 (1 GLTF = N Mesh) | `create-3d-container-component` |

## 순회 스크립트

1. **개별 + 컨테이너 후보 수집 (각각 알파벳 순)**:
   ```bash
   # 개별 장비 후보 (meshesArea/ 그룹 폴더 자체는 제외)
   ls -d RNBT_architecture/DesignComponentSystem/models/*/ | grep -v '/meshesArea/$' | sort

   # 컨테이너 후보
   ls -d RNBT_architecture/DesignComponentSystem/models/meshesArea/*/ 2>/dev/null | sort
   ```

2. **두 목록을 순서대로 병합 (개별 → 컨테이너) 후 각 후보에 대해 Standard 완료 여부 확인**:
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/3D_Components/{컴포넌트경로}/Standard/scripts/register.js 2>/dev/null
   ```
   `register.js`가 없는 첫 번째 항목 = **다음 대상**.

3. **유형 결정**:
   - `{컴포넌트경로}`에 `meshesArea/` 포함 → **컨테이너** → `create-3d-container-component` 사용
   - 그 외 → **개별** → `create-3d-component` 사용

4. 남은 대상이 없으면 **전체 루프 종료**.

> 호출 SKILL은 Phase 0 완료 후 사용자에게 `"다음 대상: {컴포넌트경로}, 유형: {개별/컨테이너}, Standard(MeshState) 생산"` 형태로 보고한다.
