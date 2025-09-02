# 정원가꾸기 - somihwang.com

Hugo를 사용한 개발 블로그입니다.

## 🚀 Quick Start

### 로컬 개발

```bash
# PaperMod 테마 설치
git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod

# 개발 서버 실행
hugo server -D
```

### 새 글 작성

```bash
# 새 포스트 생성
hugo new posts/my-new-post.md

# 글 작성 후 배포
git add .
git commit -m "Add new post"
git push origin main
```

## 🔧 기능

- ✅ GitHub Pages 자동 배포
- ✅ 커스텀 도메인 (somihwang.com)
- ✅ HTTPS 자동 활성화
- ✅ RSS 피드 (`/index.xml`)
- ✅ 코드 하이라이팅
- ✅ PaperMod 테마

## 📝 배포 과정

1. `main` 브랜치에 푸시
2. GitHub Actions가 자동으로 Hugo 빌드
3. `gh-pages` 브랜치에 배포
4. `somihwang.com`에서 확인

## 🌐 DNS 설정

도메인 제공업체에서 다음 DNS 레코드를 설정하세요:

```
Type: A
Name: @
Value: 185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153
```

## 📁 프로젝트 구조

```
.
├── archetypes/          # 콘텐츠 템플릿
├── content/            # 블로그 포스트
├── static/             # 정적 파일
├── themes/             # Hugo 테마
├── config.toml         # Hugo 설정
└── .github/workflows/  # GitHub Actions
```
