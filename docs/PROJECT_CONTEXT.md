# Paste Right Manager - Project Context

> **최종 업데이트:** 2026-03-13
> **버전:** 1.5
> **라이선스:** MIT

---

## 1. Project Overview

| 항목 | 내용 |
|------|------|
| **Project Name** | Paste Right Manager |
| **Purpose** | 자주 사용하는 메시지 템플릿을 우클릭 한 번으로 즉시 입력하고, 건축물대장을 간편하게 조회하는 Chrome 확장 프로그램 |
| **Target Users** | 도화엔지니어링 등 건설/엔지니어링 업무 종사자 (반복 업무 메시지 + 건축물 정보 조회 필요) |
| **Core Problem** | 1) 반복되는 업무 메시지(결재의견, 출장정산, 공정보고 등) 수동 입력 비효율 2) 건축물대장 조회 시 복잡한 코드 입력 과정 |
| **Key Features** | 템플릿 CRUD, 우클릭 붙여넣기, 클립보드 복사 정책, 드래그앤드롭 정렬, 설정 기반 local/sync 저장소 전환, 건축물대장 API 조회, 주소→코드 자동 검색 |
| **Current Stage** | **Production** (v1.5, Chrome Web Store 미등록 / 개발자 모드 설치) |

---

## 2. System Architecture

```mermaid
graph TB
    subgraph Chrome Extension [Chrome Extension - MV3]
        BG[background.js<br/>Service Worker]
        SP[sidepanel.html + sidepanel.js<br/>Side Panel UI]
        IC[iframe-content.js<br/>Content Script]
    end

    subgraph Storage
        LS[(Chrome Storage Local<br/>extensionSettings + local templates)]
        SS[(Chrome Storage Sync<br/>sync templates)]
        AJ[(address-codes.json<br/>20,555 법정동)]
        DT[(default-templates.json<br/>기본 템플릿)]
    end

    subgraph External API
        PD[공공데이터포털 API<br/>건축물대장 조회]
    end

    subgraph User Interaction
        CM[Context Menu<br/>우클릭 메뉴]
        WP[Web Page<br/>입력 필드]
    end

    SP -->|설정 저장| LS
    SP -->|템플릿 CRUD (active area)| LS
    SP -->|템플릿 CRUD (active area)| SS
    SP -->|refresh-menus| BG
    BG -->|rebuildMenus| CM
    CM -->|클릭 시 insertText| WP
    BG -->|executeScript| WP
    IC -->|editable 감지| WP
    SP -->|주소 검색| AJ
    SP -->|건축물 조회| PD
    SP -->|초기 로드| DT
```

### 데이터 흐름

1. **템플릿 붙여넣기 흐름:**
   - Side Panel에서 템플릿 CRUD → 현재 `templateStorageArea`가 가리키는 `chrome.storage.local` 또는 `chrome.storage.sync`에 저장 → `background.js`에 `refresh-menus` 메시지 → Context Menu 재생성 → 사용자가 우클릭으로 선택 → `chrome.scripting.executeScript`로 active element에 텍스트 삽입

2. **건축물대장 조회 흐름:**
   - 주소 검색(address-codes.json 로컬 매칭) → 시군구/법정동 코드 자동 입력 → 공공데이터포털 API 호출 → 간략/상세 뷰 렌더링

3. **클립보드 복사 흐름:**
   - 설정의 `clipboardWriteEnabled` 확인 → 허용 시 `navigator.clipboard.writeText()` → 토스트 메시지 표시

---

## 3. Tech Stack

| 분류 | 기술 |
|------|------|
| **Platform** | Chrome Extension (Manifest V3) |
| **Frontend** | HTML5, CSS3 (Material Design 3), JavaScript ES6+ |
| **Typography** | Google Fonts - Roboto |
| **Icons** | Material Symbols Rounded |
| **Libraries** | Sortable.js (드래그앤드롭) |
| **API** | Chrome Extension APIs (`contextMenus`, `storage`, `scripting`, `sidePanel`, `tabs`, `activeTab`) |
| **External API** | 공공데이터포털 - 건축물대장 표제부 조회 (`BldRgstHubService/getBrTitleInfo`) |
| **Data** | 전국 법정동코드 JSON (20,555개, 4.54MB) |
| **Design System** | Material Design 3 (Material You) - 커스텀 CSS 구현 |
| **Test** | Node.js built-in test runner (`node --test`) |
| **Package Manager** | npm |

---

## 4. Repository Structure

```
chrome-extension-clipboard/
├── manifest.json               # Chrome 확장 프로그램 설정 (MV3, 권한, 리소스 정의)
├── package.json                # npm 프로젝트 설정 (최소 구성, test 스크립트만)
├── .gitignore                  # Git 무시 규칙
├── README.md                   # 프로젝트 설명서
│
├── sidepanel.html              # 메인 UI (260줄) - 3개 탭 레이아웃 + 모달 다이얼로그
├── sidepanel.js                # 메인 로직 - 템플릿 관리 + 설정 + 건축물 조회 + 주소 검색
├── storage-utils.js            # 설정/스토리지 라우팅 헬퍼
├── background.js               # Service Worker - 컨텍스트 메뉴 + 활성 저장소 기반 텍스트 삽입
├── iframe-content.js           # Content Script (17줄) - 그룹웨어 iframe 내 editable 감지
│
├── default-templates.json      # 기본 템플릿 데이터 (4개 항목)
├── address-codes.json          # 전국 법정동코드 데이터 (20,555개, ~4.54MB)
│
├── styles/
│   └── sidepanel.css           # Material Design 3 스타일 (751줄)
│
├── libs/
│   └── Sortable.js             # 드래그앤드롭 라이브러리 (벤더)
│
├── images/
│   └── donate_qr.jpg           # 후원 QR 코드 이미지
│
├── docs/
│   ├── api-integration.md      # 프론트엔드-백엔드 API 연동 문서
│   ├── backend.md              # 백엔드/서비스 워커 문서
│   ├── frontend.md             # 프론트엔드 화면 문서
│   ├── CHANGELOG.md            # 변경 이력
│   └── IMPLEMENTATION_COMPLETE.md  # 구현 완료 문서
│
├── tests/
│   └── basic.test.js           # 기본 테스트 (placeholder)
│
├── sample/                     # LevelDB 샘플 데이터 (Chrome Storage 덤프)
│
└── description_image.pptx      # 스토어 설명 이미지 PPT
```

---

## 5. Core Logic

### 5.1 템플릿 관리 로직

| 구분 | 내용 |
|------|------|
| **입력** | 사용자가 Side Panel UI에서 제목(title) + 본문(body) 입력 |
| **처리** | `extensionSettings.templateStorageArea`가 가리키는 `chrome.storage.local` 또는 `chrome.storage.sync`에 `userTemplates` 배열로 저장. 각 템플릿은 `{id, title, body}` 구조이며, ID는 `tpl_${timestamp}_${random}` 형식으로 자동 생성 |
| **출력** | 1) Side Panel 리스트 렌더링 2) Context Menu 하위 항목 갱신 3) 클립보드 복사 가능 |

**주요 함수:**
- `loadTemplates()` — 스토리지에서 템플릿 로드, 없으면 `default-templates.json` fallback
- `saveTemplatesData()` — 저장 + `refresh-menus` 메시지 발송
- `renderTemplates()` — DOM 렌더링 + Sortable 초기화
- `saveTemplate()` — 신규/수정 분기 처리
- `copyToClipboard(text)` — Clipboard API 사용

### 5.2 컨텍스트 메뉴 텍스트 삽입 로직

| 구분 | 내용 |
|------|------|
| **입력** | 사용자가 편집 가능 필드에서 우클릭 → 템플릿 선택 |
| **처리** | `chrome.scripting.executeScript`로 `insertText()` 함수를 탭에 주입. `HTMLInputElement`/`HTMLTextAreaElement`는 `value` 조작, `contentEditable`은 `Selection API` 사용 |
| **출력** | 커서 위치에 텍스트 삽입 + `input` 이벤트 발생 |

**특수 처리:**
- iframe 내부 editable 요소 지원 (`document.execCommand` fallback)
- 도화엔지니어링 그룹웨어(`gw.dohwa.co.kr`) 메일 작성 iframe 전용 content script

### 5.3 건축물대장 조회 로직

| 구분 | 내용 |
|------|------|
| **입력** | 시군구코드(5자리) + 법정동코드(5자리) + 대지구분(1자리) + 본번(4자리) + 부번(4자리) |
| **처리** | 1) `validateAndFormatInputs()`로 입력값 검증 및 zero-padding 2) 공공데이터포털 REST API 호출 (`fetch`) 3) JSON 응답 파싱 |
| **출력** | 간략 보기(카드) — 주소, 용도, 구조, 면적, 층수, 주요일자 / 상세 보기(테이블) — 65+ 필드 전체 표시 |

### 5.4 주소 검색 로직

| 구분 | 내용 |
|------|------|
| **입력** | 사용자가 한글 주소 키워드 입력 (예: "경기도 남양주시 금곡동") |
| **처리** | 1) `address-codes.json` (4.54MB) 최초 1회 로드 후 메모리 캐싱 2) 띄어쓰기 제거 후 `searchText` 필드와 부분 매칭 3) 최대 10개 결과 반환 |
| **출력** | 검색 결과 목록 → 선택 시 시군구/법정동 코드 자동 입력 + 아코디언 자동 접기 + 본번 필드 포커스 이동 |

**성능:** 20,555개 데이터에서 5-10ms 검색 (첫 로드 1-2초)

---

## 6. Database Schema (Chrome Storage)

이 프로젝트는 별도의 DB를 사용하지 않으며, **Chrome Storage Local/Sync API**를 데이터 저장소로 사용합니다.

### 저장 구조

```json
{
  "extensionSettings": {
    "theme": "system",
    "templateStorageArea": "local",
    "clipboardWriteEnabled": true
  },
  "userTemplates": [
    {
      "id": "tpl_1699700000000_abc123def",
      "title": "이메일 도입부 인사",
      "body": "안녕하세요, \n 도화엔지니어링 도시단지1부 정규봉 사원입니다."
    }
  ]
}
```

### 필드 설명

| 키 | 타입 | 설명 |
|----|------|------|
| `extensionSettings` | `Object` | 로컬 설정 객체 (`theme`, `templateStorageArea`, `clipboardWriteEnabled`) |
| `userTemplates` | `Array<Object>` | 사용자 템플릿 배열 |
| `userTemplates[].id` | `string` | 고유 식별자 (`tpl_${timestamp}_${random}`) |
| `userTemplates[].title` | `string` | 템플릿 제목 (컨텍스트 메뉴에 표시) |
| `userTemplates[].body` | `string` | 템플릿 본문 (실제 삽입 텍스트) |

### 정적 데이터

| 파일 | 구조 | 설명 |
|------|------|------|
| `default-templates.json` | `Array<{id, title, body}>` | 초기 설치 시 로드되는 기본 템플릿 4개 |
| `address-codes.json` | `Object<code, {sigunguCd, bjdongCd, fullAddress, searchText}>` | 전국 법정동코드 20,555개 (키: 10자리 코드) |

---

## 7. API Specification

### 내부 메시지 API (Chrome Runtime Message)

| 메시지 | 방향 | 설명 |
|--------|------|------|
| `'refresh‑menus'` | Side Panel → Background | 템플릿 변경 후 컨텍스트 메뉴 재생성 요청 |
| `{ok: true}` | Background → Side Panel | 메뉴 갱신 완료 응답 |

### 외부 API 호출

#### 건축물대장 표제부 조회

```
GET https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `serviceKey` | string | Y | 공공데이터포털 API 키 |
| `sigunguCd` | string(5) | Y | 시군구코드 |
| `bjdongCd` | string(5) | Y | 법정동코드 |
| `platGbCd` | string(1) | N | 대지구분 (0=대지, 1=산, 2=블록) |
| `bun` | string(4) | Y | 본번 |
| `ji` | string(4) | N | 부번 |
| `_type` | string | Y | 응답 형식 (`json`) |

**응답 구조:**
```json
{
  "response": {
    "header": { "resultCode": "00", "resultMsg": "NORMAL SERVICE" },
    "body": {
      "items": {
        "item": {
          "bldNm": "건물명",
          "platPlc": "지번주소",
          "newPlatPlc": "도로명주소",
          "mainPurpsCdNm": "주용도",
          "strctCdNm": "구조",
          "platArea": "대지면적",
          "archArea": "건축면적",
          "totArea": "연면적",
          "grndFlrCnt": "지상층수",
          "..."
        }
      }
    }
  }
}
```

---

## 8. Setup & Run Guide

### 로컬 개발 환경 설정

```bash
# 1. Repository Clone
git clone https://github.com/qbong1010/chrome-extension-clipboard.git
cd chrome-extension-clipboard

# 2. 의존성 설치 (테스트용)
npm install

# 3. .env 설정 — 불필요 (API 키가 sidepanel.js에 하드코딩)
```

### Chrome 확장 프로그램 로드

1. Chrome 브라우저에서 `chrome://extensions/` 접속
2. 우측 상단 **개발자 모드** 활성화
3. **압축해제된 확장 프로그램을 로드합니다** 클릭
4. 프로젝트 폴더 선택
5. 툴바에서 확장 프로그램 아이콘 클릭 → Side Panel 열림

### 테스트 실행

```bash
npm test     # node --test 실행 (basic.test.js)
```

> **주의:** 현재 테스트는 placeholder 수준이며, 실제 기능 테스트는 Chrome 브라우저에서 수동 테스트 필요

---

## 9. Current Development Status

### ✅ Completed

- [x] 템플릿 CRUD (생성, 읽기, 수정, 삭제는 편집으로 대체)
- [x] 우클릭 컨텍스트 메뉴 붙여넣기
- [x] 클립보드 원클릭 복사 + 토스트 메시지
- [x] 드래그앤드롭 순서 변경 (Sortable.js)
- [x] 건축물대장 표제부 조회 (공공데이터 API)
- [x] 주소 검색 → 코드 자동 입력 (20,555개 법정동)
- [x] Material Design 3 UI
- [x] 3탭 네비게이션 (템플릿 / 설정 / 검색)
- [x] 후원하기 QR 모달
- [x] iframe 내 텍스트 삽입 지원 (도화엔지니어링 그룹웨어)

### 🔧 In Progress

- [ ] 템플릿 삭제 기능

### 📋 Planned (미구현)

- [ ] 템플릿 삭제 기능 (현재는 편집만 가능)
- [ ] Chrome Web Store 등록

---

## 10. Known Issues & Technical Debt

### 🔴 보안 이슈

| 이슈 | 심각도 | 위치 |
|------|--------|------|
| **API 키 하드코딩** | 높음 | `sidepanel.js:324-325` — 공공데이터포털 API 키가 소스코드에 노출 |

### 🟡 기능 이슈

| 이슈 | 심각도 | 설명 |
|------|--------|------|
| 템플릿 삭제 불가 | 중간 | 편집 다이얼로그에 삭제 버튼 없음 |
| 설정 후속 견고성 | 낮음 | 저장 성공 후 `refresh-menus` 후속 단계 실패 시 일시적 UI 불일치 가능 |
| 정적 HTML 잔여 | 낮음 | `sidepanel.html`에 하드코딩된 샘플 `<li>` 항목이 JS 렌더링과 중복 |
| `host_permissions: <all_urls>` | 낮음 | 필요 이상 광범위한 호스트 권한 |

### ⚪ 기술 부채

| 항목 | 설명 |
|------|------|
| 단일 파일 구조 | `sidepanel.js` 858줄에 모든 로직 집중 — 모듈 분리 필요 |
| 테스트 확장 필요 | `settings-storage.test.js`로 저장소 로직은 보강됐지만 브라우저 통합 테스트는 아직 없음 |
| 에러 처리 | API 실패 시 기본 에러 메시지만 표시, 재시도 로직 없음 |
| 대용량 JSON | `address-codes.json` 4.54MB가 확장 프로그램에 포함되어 설치 용량 증가 |

---

## 11. Next Development Tasks

### 우선순위 높음

1. **API 키 분리** — `.env` 또는 Chrome Storage에 API 키 관리, 소스코드에서 제거
2. **템플릿 삭제 기능** — 편집 다이얼로그에 삭제 버튼 추가
3. **브라우저 통합 테스트** — 설정 탭/컨텍스트 메뉴의 실제 Chrome 런타임 검증

### 우선순위 중간

4. **코드 모듈화** — `sidepanel.js`를 기능별로 분리 (template-manager.js, building-search.js, address-finder.js)
5. **테스트 코드 작성** — 입력값 검증, 주소 검색 등 핵심 로직 단위 테스트
6. **정적 HTML 정리** — 하드코딩된 샘플 리스트 아이템 제거

### 우선순위 낮음

7. **Chrome Web Store 등록** — 스크린샷, 설명, 아이콘 준비
8. **주소 데이터 최적화** — IndexedDB 활용 또는 서버 기반 검색으로 전환
9. **다국어 지원** — 현재 한국어 하드코딩

---

## 12. References

| 항목 | 링크 / 위치 |
|------|-------------|
| **Chrome Extension MV3 문서** | https://developer.chrome.com/docs/extensions/mv3/ |
| **공공데이터포털 건축물대장 API** | https://www.data.go.kr/data/15044713/openapi.do |
| **Material Design 3** | https://m3.material.io/ |
| **Sortable.js** | https://sortablejs.github.io/Sortable/ |
| **변경 이력** | [docs/CHANGELOG.md](docs/CHANGELOG.md) |
| **구현 완료 문서** | [docs/IMPLEMENTATION_COMPLETE.md](docs/IMPLEMENTATION_COMPLETE.md) |
| **Content Script 대상** | `gw.dohwa.co.kr` — 도화엔지니어링 그룹웨어 메일 작성 |
| **법정동코드 원본** | 행정안전부 법정동코드 전체자료 (https://www.code.go.kr) |
