# 📱 프론트엔드 문서

> **Paste Right** Chrome 확장 프로그램의 프론트엔드 화면별 구성을 기술합니다.

---

## 목차

1. [전체 구조 개요](#전체-구조-개요)
2. [화면 1: 템플릿 관리 (Template Manager)](#화면-1-템플릿-관리-template-manager)
3. [화면 2: 설정 (Settings)](#화면-2-설정-settings)
4. [화면 3: 건축물대장 조회 (Building Search)](#화면-3-건축물대장-조회-building-search)
5. [모달 1: 템플릿 편집 다이얼로그](#모달-1-템플릿-편집-다이얼로그)
6. [모달 2: 후원하기 QR 다이얼로그](#모달-2-후원하기-qr-다이얼로그)
7. [네비게이션 레일](#네비게이션-레일)
8. [공통 UI 컴포넌트](#공통-ui-컴포넌트)

---

## 전체 구조 개요

| 항목 | 내용 |
|------|------|
| **진입점** | `sidepanel.html` (Chrome Side Panel) |
| **스크립트** | `sidepanel.js` (ES Module) |
| **스타일** | `styles/sidepanel.css` |
| **디자인** | Material Design 3 (MD3) 기반 |
| **아이콘** | Material Symbols Rounded (Google Fonts) |
| **폰트** | Roboto (Google Fonts) |
| **라이브러리** | Sortable.js (드래그앤드롭) |

### 화면 전환 방식
좌측의 **Navigation Rail**을 통해 3개 화면을 `display: block/none`으로 전환합니다.

```
┌──────┬──────────────────────┐
│ Nav  │                      │
│ Rail │   Content Area       │
│      │                      │
│ 📋   │   (3개 View 중 1개)  │
│ ⚙️   │                      │
│ 🔍   │                      │
└──────┴──────────────────────┘
```

---

## 화면 1: 템플릿 관리 (Template Manager)

> **View ID**: `templateManagerView` | **기본 활성 화면**

### 구성 요소

| 요소 | HTML ID/Class | 설명 |
|------|---------------|------|
| 헤더 | `.md3-header` | 타이틀 "🗂️ 규봉봉 간편 도구" + 추가 버튼 |
| ➕ 추가 버튼 | `#addTemplateBtn` | 새 템플릿 추가 (편집 모달 열림) |
| 템플릿 목록 | `#userList` | `<ul>` 리스트, Sortable.js 드래그 정렬 지원 |
| 후원 FAB | `#addBtn` | 하단 FAB 버튼 → 후원 QR 모달 열기 |

### 각 템플릿 항목 (`md3-list-item`) 구조

```
┌─────────────────────────────────────────┐
│ 📋 복사  │  [제목 텍스트]  │  ⋮ 편집    │
└─────────────────────────────────────────┘
```

| 영역 | Class | 기능 |
|------|-------|------|
| 클립보드 복사 버튼 | `.clipboard-copy` | 클릭 시 `template.body` → 클립보드 복사 |
| 제목 텍스트 영역 | `.list-item-content` | 드래그 핸들 겸 제목 표시 |
| 더보기 메뉴 | `.md3-icon-button` (`more_vert`) | 클릭 시 편집 모달 열림 |

### 주요 동작

| 동작 | 함수 | 설명 |
|------|------|------|
| 초기 로드 | `loadTemplates()` | `chrome.storage.local` → `userTemplates` 로드 |
| 렌더링 | `renderTemplates()` | 목록 동적 생성 + Sortable 초기화 |
| 클립보드 복사 | `copyToClipboard(text)` | `navigator.clipboard.writeText()` 사용 |
| 드래그 정렬 | `initSortable()` | Sortable.js `onEnd` → 배열 재정렬 → 저장 |
| 저장 | `saveTemplatesData()` | `chrome.storage.local.set()` + 메뉴 갱신 메시지 전송 |

### 연동 API

| API | 호출 함수 | 용도 |
|-----|----------|------|
| `chrome.storage.local.get(['userTemplates'])` | `loadTemplates()` | 템플릿 데이터 로드 |
| `chrome.storage.local.set({ userTemplates })` | `saveTemplatesData()` | 템플릿 데이터 저장 |
| `chrome.runtime.sendMessage('refresh‑menus')` | `saveTemplatesData()` | 컨텍스트 메뉴 갱신 요청 |
| `fetch('default-templates.json')` | `loadTemplates()` | 기본 템플릿 로드 (최초 실행 시) |
| `navigator.clipboard.writeText()` | `copyToClipboard()` | 클립보드에 텍스트 복사 |

---

## 화면 2: 설정 (Settings)

> **View ID**: `settingsView` | **초기 상태**: `display: none`

### 구성 요소

| 섹션 | 요소 | HTML ID | 설명 |
|------|------|---------|------|
| 일반 | 테마 선택 | `#themeSelect` | `light` / `dark` / `system` |
| 저장소 | 저장소 타입 | `#storageTypeSelect` | `local` / `sync` |
| 저장소 | 동기화 사용량 | `#syncUsage`, `#syncQuota` | 동기화 스토리지 사용량 표시 |
| 권한 | 클립보드 쓰기 | `name="clipboardWrite"` | 허가 / 불허가 (`radio`) |
| 권한 | 클립보드 읽기 | `name="clipboardRead"` | 허가 / 불허가 (`radio`) |

### 화면 레이아웃

```
⚙️ 설정 (아직 개선중)
├── 일반
│   └── 테마: [일반모드 ▼]
├── 저장소
│   ├── 저장소 타입: [로컬 ▼]
│   └── 동기화 저장소 사용량: -- / --
└── 권한
    ├── 클립보드 쓰기: ◉ 허가 ○ 불허가
    └── 클립보드 읽기: ◉ 허가 ○ 불허가
```

### 연동 API

| API | 용도 |
|-----|------|
| `chrome.storage.local` / `chrome.storage.sync` | 설정값 저장/로드 (구현 진행 중) |

> [!NOTE]
> 설정 화면은 현재 "아직 개선중" 상태이며, UI는 구성되어 있으나 일부 기능의 실제 동작 연동이 미완성입니다.

---

## 화면 3: 건축물대장 조회 (Building Search)

> **View ID**: `buildingSearchView` | **초기 상태**: `display: none`

### 구성 요소

#### 1) 주소로 코드 찾기 (아코디언 섹션)

| 요소 | HTML ID | 설명 |
|------|---------|------|
| 아코디언 헤더 | `#finderHeader` | 클릭 시 접기/펼치기 |
| 토글 아이콘 | `#finderToggle` | `expand_more` 아이콘 회전 |
| 주소 검색 입력 | `#addressSearchInput` | 주소 키워드 입력 |
| 검색 버튼 | `#addressSearchBtn` | 주소 검색 실행 |
| 검색 결과 영역 | `#addressSearchResults` | 최대 10건 결과 표시 |
| 결과 목록 | `#addressResultsList` | 동적 생성 리스트 |
| 결과 수 | `#resultsCount` | "N개 결과" 표시 |

#### 2) 직접 코드 입력 섹션

| 요소 | HTML ID | 설명 |
|------|---------|------|
| 시군구코드 | `#sigunguInput` | 5자리 숫자 |
| 법정동코드 | `#bjdongInput` | 5자리 숫자 |
| 대지구분코드 | `#platGbInput` | 1자리 (0=대지, 1=산, 2=블록), 기본값 `0` |
| 본번 | `#bunInput` | 4자리 숫자 |
| 부번 | `#jiInput` | 4자리 숫자, 기본값 `0000` |
| 조회 버튼 | `#searchBtn` | API 조회 실행 |
| 예제 입력 버튼 | `#exampleBtn` | 예제 데이터 자동 입력 |

#### 3) 결과 표시 영역

| 요소 | HTML ID | 설명 |
|------|---------|------|
| 로딩 인디케이터 | `#loadingIndicator` | 스피너 + "조회 중..." |
| 에러 메시지 | `#errorMessage` | 오류 발생 시 표시 |
| 결과 섹션 | `#resultSection` | 간략/상세 뷰 컨테이너 |
| 간략 뷰 토글 | `#simpleViewBtn` | 간략 보기 활성화 |
| 상세 뷰 토글 | `#detailViewBtn` | 상세 보기 활성화 |
| 간략 보기 | `#simpleView` | 카드형 주요 정보 표시 |
| 상세 보기 | `#detailView` | 테이블형 전체 필드 표시 |

### 화면 흐름

```
🏢 건축물대장 조회
├── 📍 주소로 코드 찾기 (아코디언)
│   ├── [주소 검색 ▼]
│   └── 검색 결과 → [선택] → 코드 자동 입력
├── ── 또는 직접 입력 ──
│   ├── 시군구코드: [     ]  법정동코드: [     ]
│   ├── 대지구분코드: [ ]
│   ├── 본번: [    ]  부번: [    ]
│   └── [조회]  [예제 입력]
└── 결과 영역
    ├── [간략 보기] / [상세 보기]
    ├── 📄 간략: 건물명, 주소, 기본정보, 면적/층수, 주요일자
    └── 📋 상세: 50+ 필드 테이블
```

### 주요 동작

| 동작 | 함수 | 설명 |
|------|------|------|
| 주소 데이터 로드 | `loadAddressData()` | `address-codes.json` → 메모리 캐싱 |
| 주소 검색 | `searchAddressByKeyword(keyword)` | 키워드 매칭, 최대 10건 |
| 결과 렌더링 | `renderSearchResults(results)` | 검색 결과 리스트 HTML 생성 |
| 주소 선택 | `selectAddressCode(code)` | 시군구/법정동 코드 자동 입력 |
| 입력값 검증 | `validateAndFormatInputs()` | 자릿수 검증 + 0 패딩 |
| API 조회 | `getBuildingInfo(params)` | 공공 API 호출 |
| 간략 뷰 렌더링 | `renderSimpleView(data)` | 주요 정보 카드 형태 |
| 상세 뷰 렌더링 | `renderDetailView(data)` | 전체 필드 테이블 형태 |
| 예제 입력 | `fillExampleData()` | 남양주시 금곡동 예제 자동 채움 |
| 날짜 포맷 | `formatDate(dateStr)` | `YYYYMMDD` → `YYYY-MM-DD` |

### 연동 API

| API | 호출 함수 | 용도 |
|-----|----------|------|
| `fetch('address-codes.json')` | `loadAddressData()` | 로컬 주소 데이터 로드 |
| 건축물대장 공공 API | `getBuildingInfo()` | 건축물 정보 외부 API 조회 |

---

## 모달 1: 템플릿 편집 다이얼로그

> **Dialog ID**: `editDlg` | `<dialog>` + `.md3-dialog`

### 구성 요소

| 요소 | HTML ID | 설명 |
|------|---------|------|
| 제목 입력 | `#titleInput` | 템플릿 제목 (필수) |
| 본문 입력 | `#bodyInput` | 템플릿 본문 (`<textarea>`, 6행, 필수) |
| 저장 버튼 | `#saveBtn` | 저장 후 모달 닫기 |
| 취소 버튼 | `#cancelBtn` | 모달 닫기 (변경 취소) |
| 폼 | `#templateForm` | `method="dialog"` 기반 제출 |

### 동작 흐름

```
[추가 버튼] or [편집 버튼]
    │
    ▼
 ┌─────────────────────┐
 │   템플릿 편집         │
 │  ┌─────────────────┐ │
 │  │ 제목: [       ] │ │
 │  ├─────────────────┤ │
 │  │ 본문:           │ │
 │  │ [             ] │ │
 │  │ [             ] │ │
 │  └─────────────────┘ │
 │       [취소] [저장]   │
 └─────────────────────┘
    │
    ▼
  saveTemplate() → saveTemplatesData() → renderTemplates()
```

### 연동 API

| API | 용도 |
|-----|------|
| `chrome.storage.local.set({ userTemplates })` | 수정된 템플릿 저장 |
| `chrome.runtime.sendMessage('refresh‑menus')` | 컨텍스트 메뉴 동기화 |

---

## 모달 2: 후원하기 QR 다이얼로그

> **Dialog ID**: `donateQrDlg` | `<dialog>` + `.md3-dialog`

### 구성 요소

| 요소 | HTML ID | 설명 |
|------|---------|------|
| QR 이미지 | `#qrImage` | `./images/donate_qr.jpg` |
| 닫기 버튼 | `#closeDonateBtn` | 모달 닫기 |

### 연동 API

없음 (순수 UI 모달)

---

## 네비게이션 레일

> **Element**: `<nav class="md3-navigation-rail">`

| 인덱스 | 아이콘 | 대상 화면 | HTML ID |
|--------|--------|----------|---------|
| 0 | `link` | 템플릿 관리 | (기본 활성) |
| 1 | `settings` | 설정 | `#navSettings` |
| 2 | `search` | 건축물대장 조회 | `#navSearch` |

### 전환 로직

```javascript
// sidepanel.js 내 네비게이션 전환 로직 (L258-290)
navItems.forEach((item, index) => {
  item.addEventListener('click', () => {
    // active 클래스 토글 + display 전환
  });
});
```

---

## 공통 UI 컴포넌트

### Toast 메시지

| 함수 | 설명 |
|------|------|
| `showToast(message)` | 하단 토스트 표시 (2초 후 자동 소멸) |

- ID: `#toast`, Class: `.md3-toast`
- 기존 토스트 제거 후 새 토스트 생성
- CSS 애니메이션: `.show` 클래스 토글

### 파일 구조

```
chrome-extension-clipboard/
├── sidepanel.html          # 전체 HTML 구조 (3개 View + 2개 Dialog)
├── sidepanel.js            # 프론트엔드 로직 (858줄)
├── styles/
│   └── sidepanel.css       # MD3 기반 스타일
├── libs/
│   └── Sortable.js         # 드래그앤드롭 라이브러리
├── images/
│   └── donate_qr.jpg       # 후원 QR 이미지
├── default-templates.json  # 기본 템플릿 데이터
└── address-codes.json      # 주소-코드 매핑 데이터 (4.7MB)
```
