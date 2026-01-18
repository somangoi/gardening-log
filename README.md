# 정원가꾸기 - somihwang.com

Astro + React + Tailwind CSS 기반 개발 블로그입니다.

## Quick Start

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 새 글 작성

`src/content/posts/` 폴더에 마크다운 파일을 추가합니다.

```markdown
---
title: "글 제목"
date: 2025-01-18
draft: false
tags: [태그1, 태그2]
description: "글 설명"
---

본문 내용...
```

## 프로젝트 구조

```
src/
├── pages/              # 페이지 라우팅
│   ├── index.astro     # 메인 페이지
│   ├── about.astro     # About 페이지
│   └── posts/          # 포스트 동적 라우팅
├── content/posts/      # 마크다운 블로그 글
├── layouts/            # 레이아웃 컴포넌트
├── components/         # 재사용 컴포넌트
│   ├── Header.astro
│   ├── PostCard.astro
│   └── Garden3D.tsx    # 3D 정원 (React)
└── styles/             # 글로벌 스타일
```

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 자동으로 빌드 후 GitHub Pages에 배포합니다.
