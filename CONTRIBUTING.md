# CONTRIBUTING.md

## 브랜치 전략

| 브랜치 | 역할 |
|--------|------|
| `main` | 독립 개발 브랜치 — 컴포넌트 및 기능 개발 |
| `sync/upstream-merge` | upstream(JSKIM-90) 문서 트래킹 전용 브랜치 |

### Remote 구성

| Remote | 저장소 |
|--------|--------|
| `origin` | dysong-lab/WEB_BUILDER_TOOLKIT |
| `upstream` | JSKIM-90/WEB_BUILDER_TOOLKIT |

---

## Upstream 동기화 파이프라인

upstream에 문서 변경이 생겼을 때만 실행합니다.
`manifest.json`, `index.html`, `preview_runtime.js` 등 시스템 파일과 `Components/` 디렉토리는 건드리지 않습니다.

### Step 1 — upstream 최신화

```bash
git fetch upstream
```

### Step 2 — sync/upstream-merge 리셋

```bash
git checkout sync/upstream-merge
git reset --hard upstream/main
git push origin sync/upstream-merge --force
```

### Step 3 — main에 문서 적용

```bash
git checkout main

# .claude/ 전체 교체
git rm -r .claude/ --quiet
git checkout upstream/main -- .claude/

# 필요 시 추가 문서 적용
git checkout upstream/main -- RNBT_architecture/DesignComponentSystem/docs/

git commit -m "chore: sync .claude skills and docs from upstream/main"
git push origin main
```

### 주의사항

- `git merge upstream/main` 은 사용하지 않는다 — 컴포넌트 파일이 덮어씌워질 수 있음
- `manifest.json`, `index.html`, `preview_runtime.js`, `package.json` 은 main 버전을 유지한다
- upstream/main과 main의 git 히스토리는 의도적으로 분리되어 있음 ("X commits behind" 표시는 정상)
