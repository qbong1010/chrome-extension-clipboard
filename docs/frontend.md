# 📱 프론트엔드 문서

> **Paste Right** Chrome 확장 프로그램의 프론트엔드 화면별 구성을 기술합니다.

---

## 목차

1. [전체 구조 개요](#전체-구조-개요)
2. [화면 1: 템플릿 관리 (Template Manager)](#화면-1-템플릿-관리-template-manager)
3. [화면 2: 건축물대장 조회 (Building Search)](#화면-2-건축물대장-조회-building-search)
4. [화면 3: 법정동 코드 찾기 (Legal Dong Code Finder)](#화면-3-법정동-코드-찾기-legal-dong-code-finder)
5. [화면 4: 설정 (Settings)](#화면-4-설정-settings)
6. [모달 1: 템플릿 편집 다이얼로그](#모달-1-템플릿-편집-다이얼로그)
7. [모달 2: 후원하기 QR 다이얼로그](#모달-2-후원하기-qr-다이얼로그)
8. [모달 3: 주소로 코드 찾기 다이얼로그](#모달-3-주소로-코드-찾기-다이얼로그)
9. [네비게이션 레일](#네비게이션-레일)
10. [공통 UI 컴포넌트](#공통-ui-컴포넌트)

---

## 전체 구조 개요

| 항목 | 내용 |
|------|------|
| **진입점** | `sidepanel.html` (Chrome Side Panel) |
| **스크립트** | `sidepanel.js` (ES Module) + `storage-utils.js` |
| **스타일** | `styles/sidepanel.css` |
| **디자인** | Material Design 3 (MD3) 기반 |
| **아이콘** | Material Symbols Rounded (Google Fonts) |
| **폰트** | Roboto (Google Fonts) |
| **라이브러리** | Sortable.js (드래그앤드롭) |

### 화면 전환 방식
좌측의 **Navigation Rail**을 통해 4개 화면을 `display: block/none`으로 전환합니다.

```
┌──────┬──────────────────────┐
│ Nav  │                      │
│ Rail │   Content Area       │
│      │                      │
│ 📋   │   (4개 View 중 1개)  │
│ 🔍   │                      │
│ 🗺️   │                      │
│ ⚙️   │                      │
└──────┴──────────────────────┘
```

---

## 화면 1: 템플릿 관리 (Template Manager)

> **View ID**: `templateManagerView` | **기본 활성 화면**

### 구성 요소

| 요소 | HTML ID/Class | 설명 |
|------|---------------|------|
| 헤더 | `.md3-header` | 타이틀 "🗂️ 도시계획가 스마트 에이전트" + 추가 버튼 |
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
| 초기 로드 | `loadTemplates()` | 현재 활성 저장소(`local`/`sync`)에서 `userTemplates` 로드 |
| 렌더링 | `renderTemplates()` | 목록 동적 생성 + Sortable 초기화 |
| 클립보드 복사 | `copyToClipboard(text)` | `clipboardWriteEnabled` 허용 시 `navigator.clipboard.writeText()` 사용 |
| 드래그 정렬 | `initSortable()` | Sortable.js `onEnd` → 배열 재정렬 → 저장 |
| 저장 | `saveTemplatesData()` | 활성 저장소에 저장 + 메뉴 갱신 메시지 전송 |

### 연동 API

| API | 호출 함수 | 용도 |
|-----|----------|------|
| `getActiveTemplateStorageArea()` | `loadTemplates()`, `saveTemplatesData()` | 현재 템플릿 저장소(`local`/`sync`) 결정 |
| `chrome.storage.local.get(['userTemplates'])` / `chrome.storage.sync.get(['userTemplates'])` | `loadTemplates()` | 활성 저장소에서 템플릿 데이터 로드 |
| `chrome.storage.local.set({ userTemplates })` / `chrome.storage.sync.set({ userTemplates })` | `saveTemplatesData()` | 활성 저장소에 템플릿 데이터 저장 |
| `chrome.runtime.sendMessage('refresh‑menus')` | `saveTemplatesData()` | 컨텍스트 메뉴 갱신 요청 |
| `fetch('default-templates.json')` | `loadTemplates()` | 기본 템플릿 로드 (최초 실행 시) |
| `navigator.clipboard.writeText()` | `copyToClipboard()` | 클립보드에 텍스트 복사 |

---

## 화면 2: 건축물대장 조회 (Building Search)

> **View ID**: `buildingSearchView` | **초기 상태**: `display: none`

### 구성 요소

#### 1) 조회 입력 섹션

| 요소 | HTML ID/Class | 설명 |
|------|---------------|------|
| 안내 카드 | `.search-section-intro` | 건축물 조회 중심 흐름 설명 |
| 코드 입력 그룹 | `.code-inputs-with-help` | 시군구/법정동 입력 + 도움 레일 묶음 |
| 시군구코드 | `#sigunguInput` | 5자리 숫자 |
| 법정동코드 | `#bjdongInput` | 5자리 숫자 |
| 도움 레일 버튼 | `#openCodeLookupBtn` | 주소 기반 코드 조회 모달 열기 |
| 대지구분코드 | `#platGbInput` | 1자리 (0=대지, 1=산, 2=블록), 기본값 `0` |
| 본번 | `#bunInput` | 4자리 숫자 |
| 부번 | `#jiInput` | 4자리 숫자, 기본값 `0000` |
| 조회 버튼 | `#searchBtn` | API 조회 실행 |
| 예제 입력 버튼 | `#exampleBtn` | 예제 데이터 자동 입력 |

#### 2) 결과 표시 영역

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
├── 조회 입력 카드
│   ├── 시군구코드: [     ]
│   ├── 법정동코드: [     ]
│   ├── 도움 레일: [?] 주소로 두 코드 조회
│   ├── 대지구분코드: [ ]
│   ├── 본번: [    ]  부번: [    ]
│   └── [조회]  [예제 입력]
├── 주소 조회 모달
│   └── 주소 검색 → [선택] → 코드 자동 입력 + 본번 포커스
└── 결과 영역
    ├── [간략 보기] / [상세 보기]
    ├── 📄 간략: 건물명, 주소, 기본정보, 면적/층수, 주요일자
    └── 📋 상세: 50+ 필드 테이블
```

### 주요 동작

| 동작 | 함수 | 설명 |
|------|------|------|
| 입력값 검증 | `validateAndFormatInputs()` | 자릿수 검증 + 0 패딩 |
| API 조회 | `getBuildingInfo(params)` | 공공 API 호출 |
| 간략 뷰 렌더링 | `renderSimpleView(data)` | 주요 정보 카드 형태 |
| 상세 뷰 렌더링 | `renderDetailView(data)` | 전체 필드 테이블 형태 |
| 예제 입력 | `fillExampleData()` | 남양주시 금곡동 예제 자동 채움 |
| 날짜 포맷 | `formatDate(dateStr)` | `YYYYMMDD` → `YYYY-MM-DD` |

### 연동 API

| API | 호출 함수 | 용도 |
|-----|----------|------|
| 건축물대장 공공 API | `getBuildingInfo()` | 건축물 정보 외부 API 조회 |

---

## 화면 3: 법정동 코드 찾기 (Legal Dong Code Finder)

> **View ID**: `legalDongCodeView` | **초기 상태**: `display: none`

### 구성 요소

| 요소 | HTML ID/Class | 설명 |
|------|---------------|------|
| 소개 카드 | `.code-finder-intro-card` | 전용 페이지 목적 설명 |
| finder mount | `#legalDongFinderMount` | 공용 주소 검색 UI가 마운트되는 영역 |
| 주소 검색 입력 | `[data-role="address-search-input"]` | 주소 키워드 입력 |
| 검색 버튼 | `[data-role="address-search-button"]` | 주소 검색 실행 |
| 결과 수 | `[data-role="results-count"]` | 결과 건수 표시 |
| 결과 목록 | `[data-role="address-results-list"]` | 동적 결과 목록 |
| 선택 버튼 | `.result-item-select` | 선택 시 건축물 조회 화면 코드 입력 필드 갱신 |

### 주요 동작

| 동작 | 함수 | 설명 |
|------|------|------|
| 주소 데이터 로드 | `loadAddressData()` | `address-codes.json` → 메모리 캐싱 |
| 주소 검색 | `searchAddressByKeyword(addressData, keyword)` | 키워드 매칭, 최대 10건 |
| 결과 렌더링 | `renderSearchResults({ elements, results, handleSelect })` | 검색 결과 리스트 생성 |
| 주소 선택 반영 | `handleAddressSelection({ code, ... })` | 시군구/법정동 코드 자동 입력 |
| 공용 finder 초기화 | `initializeAddressFinder(...)` | 전용 페이지와 모달에서 동일 UI 재사용 |

---

## 화면 4: 설정 (Settings)

> **View ID**: `settingsView` | **초기 상태**: `display: none`

### 구성 요소

| 섹션 | 요소 | HTML ID | 설명 |
|------|------|---------|------|
| 일반 | 테마 선택 | `#themeSelect` | `light` / `dark` / `system` |
| 일반 | 건축물 API 키 | `#buildingApiKeyInput` | 공공데이터포털 `serviceKey` 저장 |
| 일반 | API 키 저장 버튼 | `#saveBuildingApiKeyBtn` | 저장/제거 즉시 반영 |
| 저장소 | 저장소 타입 | `#storageTypeSelect` | `local` / `sync` |
| 저장소 | 동기화 사용량 | `#syncUsage`, `#syncQuota` | 동기화 스토리지 사용량 표시 |
| 권한 | 클립보드 쓰기 | `name="clipboardWrite"` | 허가 / 불허가 (`radio`) |
| 권한 | 클립보드 읽기 | `name="clipboardRead"` | 허가 / 불허가 (`radio`) |

### 화면 레이아웃

```
⚙️ 설정
├── 일반
│   └── 테마: [일반모드 ▼]
│   └── 건축물 API 키: [********] [저장]
├── 저장소
│   ├── 저장소 타입: [로컬 ▼]
│   └── 동기화 저장소 사용량: 0 B / 100 KB
└── 권한
    ├── 클립보드 쓰기: ◉ 허용 ○ 차단
    └── 클립보드 읽기: ○ 허용 ◉ 차단 (비활성)
```

### 주요 동작

| 동작 | 함수 | 설명 |
|------|------|------|
| 초기 설정 로드 | `initializeSettings()` | `extensionSettings`를 읽어 컨트롤 상태와 테마를 초기화 |
| API 키 저장 | `handleBuildingApiKeySave()` | `buildingApiKey`를 저장하고 건축물 조회에 즉시 사용 |
| 테마 변경 | `handleThemeChange()` | `theme`를 저장하고 즉시 화면에 반영 |
| 저장소 타입 변경 | `handleStorageTypeChange()` | `local ↔ sync` 전환 시 템플릿을 복사/검증 후 포인터 변경 |
| 동기화 사용량 표시 | `updateSyncUsage()` | `chrome.storage.sync.getBytesInUse(null)`로 사용량 표시 |
| 클립보드 쓰기 정책 변경 | `handleClipboardWriteChange()` | `clipboardWriteEnabled` 저장 후 복사 허용 여부 반영 |

### 연동 API

| API | 용도 |
|-----|------|
| `chrome.storage.local.get/set(['extensionSettings'])` | 설정 객체(`theme`, `templateStorageArea`, `clipboardWriteEnabled`, `buildingApiKey`) 저장/로드 |
| `chrome.storage.local.get/set(['userTemplates'])` | 로컬 저장소 선택 시 템플릿 저장/로드 |
| `chrome.storage.sync.get/set(['userTemplates'])` | 동기화 저장소 선택 시 템플릿 저장/로드 |
| `chrome.storage.sync.getBytesInUse(null)` | sync 사용량 표시 |
| `chrome.runtime.sendMessage('refresh‑menus')` | 저장소 전환/템플릿 변경 후 컨텍스트 메뉴 재생성 |

> [!NOTE]
> 설정 화면은 현재 실제 동작합니다. 건축물대장 API 키를 저장하면 조회에 즉시 사용되며, 클립보드 읽기 기능은 아직 사용처가 없어 비활성 상태로만 표시됩니다.

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
| `chrome.storage.local.set({ userTemplates })` / `chrome.storage.sync.set({ userTemplates })` | 현재 활성 저장소에 수정된 템플릿 저장 |
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

## 모달 3: 주소로 코드 찾기 다이얼로그

> **Dialog ID**: `codeLookupDlg` | `<dialog>` + `.code-lookup-dialog`

### 구성 요소

| 요소 | HTML ID/Class | 설명 |
|------|---------------|------|
| 다이얼로그 | `#codeLookupDlg` | 건축물 조회 화면에서 여는 주소 검색 모달 |
| 닫기 버튼 | `#closeCodeLookupBtn` | 모달 닫기 |
| finder mount | `#codeLookupFinderMount` | 공용 주소 검색 UI가 마운트되는 영역 |
| 주소 검색 입력 | `[data-role="address-search-input"]` | 주소 키워드 입력 |
| 검색 버튼 | `[data-role="address-search-button"]` | 주소 검색 실행 |
| 선택 버튼 | `.result-item-select` | 선택 시 코드 자동 입력 + 모달 닫기 |

### 주요 동작

| 동작 | 함수 | 설명 |
|------|------|------|
| 모달 열기 | `openCodeLookupBtn.click` | `codeLookupDlg.showModal()` 실행 |
| 모달 닫기 | `closeCodeLookupBtn.click` | `codeLookupDlg.close("cancel")` |
| 선택 후 닫기 | `handleAddressSelection(...)` | 값 입력 후 `codeLookupDlg.close("select")` |
| 포커스 복귀 | `codeLookupDlg.close` 핸들러 | 취소/배경 클릭 시 트리거 복귀, 선택 시 `bunInput` 포커스 |

---

## 네비게이션 레일

> **Element**: `<nav class="md3-navigation-rail">`

| 인덱스 | 아이콘 | 대상 화면 | HTML ID |
|--------|--------|----------|---------|
| 0 | `link` | 템플릿 관리 | (기본 활성) |
| 1 | `search` | 건축물대장 조회 | `#navSearch` |
| 2 | `map` | 법정동 코드 찾기 | `#navCodeFinder` |
| 3 | `settings` | 설정 | `#navSettings` |

### 전환 로직

```javascript
// sidepanel.js 내 네비게이션 전환 로직
navItems.forEach((item) => {
  item.addEventListener('click', () => {
    showView(item.dataset.viewTarget);
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
├── sidepanel.html          # 전체 HTML 구조 (4개 View + 3개 Dialog)
├── sidepanel.js            # 프론트엔드 로직 (설정 + 템플릿 + 건축물 조회 + 공용 finder 초기화)
├── building-code-lookup.js # 주소 검색/코드 반영 공용 로직
├── storage-utils.js        # 설정/스토리지 라우팅 헬퍼
├── styles/
│   └── sidepanel.css       # MD3 기반 스타일
├── libs/
│   └── Sortable.js         # 드래그앤드롭 라이브러리
├── images/
│   └── donate_qr.jpg       # 후원 QR 이미지
├── default-templates.json  # 기본 템플릿 데이터
├── address-codes.json      # 주소-코드 매핑 데이터 (4.7MB)
└── tests/e2e/              # Playwright MV3 런타임 회귀 테스트
```
