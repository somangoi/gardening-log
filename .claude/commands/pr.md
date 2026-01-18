---
description: 
globs: 
alwaysApply: false
---
# Pull Request 보내기

## Pull Request 생성

### 단계별 프로세스

1. **브랜치 설정**
   - 다른 지시가 없다면 `main`을 병합 브랜치로 가정합니다

2. **변경 사항 분석**
   ```bash
   # 현재 브랜치와 main 브랜치 간의 차이점 확인
   git diff origin/main...HEAD | cat
   
   # 커밋 히스토리 확인 (상세 정보 포함)
   git log origin/main..HEAD --oneline --decorate --graph
   
   # 각 커밋의 상세 내용 확인
   git log origin/main..HEAD --pretty=format:"%h - %an, %ar : %s" --stat
   
   # 변경된 파일 목록
   git diff --name-only origin/main...HEAD
   ```

3. **PR 제목 및 내용 생성 (반드시 한글로 작성)**
   - 커밋 메시지들을 기반으로 의미있는 제목 생성
   - 변경 사항을 요약하여 PR 본문 작성
   - 모든 내용은 한글로 작성

4. **PR 생성 (반드시 한글로 작성)**
   ```bash
   # 브랜치 푸시 및 PR 생성
   git push origin HEAD && \
   echo -e "## 변경 사항
   
   {{commit_summary}}
   
   ### 주요 수정 내용
   {{changes_detail}}
   
   ### 커밋 히스토리
   {{commit_history}}
   
   ## 관련 이슈
   {{issue_link}}" | \
   gh pr create --title "{{pr_title}}" --body-file - && \
   gh pr view --web
   ```

### 자동화 스크립트 예시

```bash
#!/bin/bash

# PR 생성 자동화 스크립트
create_pr() {
    # 1. 이슈 링크 확인
    read -p "연관된 이슈 링크가 있나요? (예: #123 또는 URL): " issue_link
    
    # 2. 브랜치 확인
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    target_branch=${1:-main}
    
    echo "현재 브랜치: $current_branch"
    echo "대상 브랜치: $target_branch"
    
    # 3. 커밋 히스토리 수집
    commit_history=$(git log origin/$target_branch..HEAD --oneline)
    commit_count=$(git rev-list --count origin/$target_branch..HEAD)
    
    # 4. 변경된 파일 확인
    changed_files=$(git diff --name-only origin/$target_branch...HEAD)
    
    # 5. PR 제목 생성 (첫 번째 커밋 메시지 기반, 한글로 작성)
    first_commit=$(git log origin/$target_branch..HEAD --oneline | tail -1 | cut -d' ' -f2-)
    pr_title="$first_commit"
    
    # 6. PR 본문 생성 (한글로 작성)
    pr_body="## 변경 사항

이 PR은 $commit_count개의 커밋을 포함합니다.

### 주요 수정 내용
\`\`\`
$changed_files
\`\`\`

### 커밋 히스토리
\`\`\`
$commit_history
\`\`\`

### 변경 사항 상세
\`\`\`diff
$(git diff origin/$target_branch...HEAD --stat)
\`\`\`

## 관련 이슈
$issue_link

## 체크리스트
- [ ] 코드가 프로젝트 스타일 가이드를 따름
- [ ] 자체 코드 리뷰 완료
- [ ] 문서 업데이트 완료 (해당하는 경우)
- [ ] 브레이킹 체인지 없음 (있다면 명시)

⚠️ **중요**: PR 제목과 설명은 반드시 한글로 작성해야 합니다."
    
    # 7. PR 생성
    git push origin HEAD && \
    echo "$pr_body" | gh pr create --title "$pr_title" --body-file - && \
    gh pr view --web
}

# 함수 실행
create_pr $1
```

### 사용법

1. **기본 사용 (main 브랜치 대상)**:
   ```bash
   create_pr
   ```

2. **특정 브랜치 대상**:
   ```bash
   create_pr develop
   ```

3. **Cursor에서 직접 실행**:
   - 위 스크립트를 `.cursor-rules` 파일에 추가
   - 터미널에서 함수 호출

### 템플릿 변수 설명

- `{{commit_summary}}`: 커밋들의 요약
- `{{changes_detail}}`: 변경 사항의 상세 내용
- `{{commit_history}}`: 커밋 히스토리 목록
- `{{issue_link}}`: 연관된 이슈 링크
- `{{pr_title}}`: 자동 생성된 PR 제목

### 추가 기능

- 자동으로 리뷰 가능한 상태로 PR 생성
- 브라우저에서 PR 페이지 자동 열기
- 커밋 히스토리 기반 내용 자동 생성
- 체크리스트 포함으로 리뷰 프로세스 표준화
- **모든 PR 내용을 한글로 작성하여 일관성 유지**