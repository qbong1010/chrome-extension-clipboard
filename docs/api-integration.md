# 🔗 프론트엔드-백엔드 API 연동 내역

> 각 프론트엔드 화면이 어떤 API를 호출하는지 매핑합니다.

---

## 연동 전체 요약

```mermaid
graph LR
    subgraph Frontend ["프론트엔드 (sidepanel.js)"]
        A[템플릿 관리]
        B[설정]
        C[건축물대장 조회]
        D[편집 모달]
    end

    subgraph Backend ["백엔드 & API"]
        E[chrome.storage.local\nextensionSettings + local templates]
        E2[chrome.storage.sync\nsync templates]
        F[chrome.runtime.sendMessage]
        G[navigator.clipboard]
        H[건축물대장 공공 API]
        I[address-codes.json]
        J[default-templates.json]
    end

    A -->|GET/SET userTemplates\n(active area)| E
    A -->|GET/SET userTemplates\n(active area)| E2
    A -->|refresh-menus| F
    A -->|writeText| G
    A -->|fetch 최초 로드| J

    B -->|SET extensionSettings| E
    B -->|GET/SET userTemplates\n(active area)| E
    B -->|GET/SET userTemplates\n(active area)| E2
    D -->|SET userTemplates\n(active area)| E
    D -->|SET userTemplates\n(active area)| E2
    D -->|refresh-menus| F

    C -->|fetch 조회| H
    C -->|fetch 로드| I
```

---

## 화면별 API 연동 상세

### 1. 템플릿 관리 화면 (`templateManagerView`)

| 사용자 액션 | 호출 함수 | API / 엔드포인트 | Method | 데이터 | 비고 |
|------------|----------|-----------------|--------|--------|------|
| 화면 초기 로드 | `loadTemplates()` | `getActiveTemplateStorageArea()` | GET | `'local' | 'sync'` | DOMContentLoaded 시 |
| 화면 초기 로드 | `loadTemplates()` | `chrome.storage.local.get(['userTemplates'])` / `chrome.storage.sync.get(['userTemplates'])` | GET | `userTemplates[]` | 활성 저장소 기준 |
| 화면 초기 로드 (비어있을 때) | `loadTemplates()` | `fetch('default-templates.json')` | GET | 기본 템플릿 JSON | 최초 사용 시에만 |
| 📋 복사 버튼 클릭 | `copyToClipboard(text)` | `navigator.clipboard.writeText(text)` | — | 템플릿 body 텍스트 | `clipboardWriteEnabled=true`일 때만 |
| 드래그로 순서 변경 | `initSortable()` → `saveTemplatesData()` | `chrome.storage.local.set({ userTemplates })` / `chrome.storage.sync.set({ userTemplates })` | SET | 재정렬된 배열 | 활성 저장소 기준 |
| 드래그로 순서 변경 | `saveTemplatesData()` | `chrome.runtime.sendMessage('refresh‑menus')` | MSG | — | 컨텍스트 메뉴 갱신 |

### 2. 설정 화면 (`settingsView`)

| 사용자 액션 | 호출 함수 | API / 엔드포인트 | Method | 데이터 | 비고 |
|------------|----------|-----------------|--------|--------|------|
| 화면 초기화 | `initializeSettings()` | `chrome.storage.local.get(['extensionSettings'])` | GET | 설정 객체 | `theme`, `templateStorageArea`, `clipboardWriteEnabled` |
| 테마 변경 | `handleThemeChange()` | `chrome.storage.local.set({ extensionSettings })` | SET | `theme` | 즉시 화면 반영 |
| 저장소 타입 변경 | `handleStorageTypeChange()` | `migrateTemplatesToStorageArea()` | GET/SET | `userTemplates[]` | source → target 복사 후 포인터 변경 |
| 저장소 타입 변경 | `updateSyncUsage()` | `chrome.storage.sync.getBytesInUse(null)` | GET | sync 사용량 | 설정 화면 표시 |
| 클립보드 쓰기 변경 | `handleClipboardWriteChange()` | `chrome.storage.local.set({ extensionSettings })` | SET | `clipboardWriteEnabled` | 복사 허용 여부 반영 |

### 3. 건축물대장 조회 화면 (`buildingSearchView`)

| 사용자 액션 | 호출 함수 | API / 엔드포인트 | Method | 데이터 | 비고 |
|------------|----------|-----------------|--------|--------|------|
| 주소 검색 입력 | `performAddressSearch()` → `loadAddressData()` | `fetch('address-codes.json')` | GET | 4.7MB JSON | 최초 1회 로드 후 캐싱 |
| 주소 검색 입력 | `searchAddressByKeyword()` | (로컬 메모리 검색) | — | 최대 10건 | 키워드 포함 매칭 |
| 주소 결과에서 [선택] | `selectAddressCode(code)` | (로컬 데이터 참조) | — | 시군구/법정동 코드 | 입력란 자동 채움 |
| [조회] 버튼 클릭 | `validateAndFormatInputs()` | (로컬 검증) | — | 입력값 포맷팅 | |
| [조회] 버튼 클릭 | `getBuildingInfo(params)` | `apis.data.go.kr/.../getBrTitleInfo` | GET | 건축물대장 데이터 | 공공 API |
| 뷰 전환 (간략/상세) | `simpleViewBtn/detailViewBtn` 이벤트 | (로컬 UI 전환) | — | — | display 토글 |
| [예제 입력] 클릭 | `fillExampleData()` | (로컬) | — | 하드코딩 예제값 | |

### 4. 템플릿 편집 모달 (`editDlg`)

| 사용자 액션 | 호출 함수 | API / 엔드포인트 | Method | 데이터 | 비고 |
|------------|----------|-----------------|--------|--------|------|
| [저장] 클릭 | `saveTemplate()` → `saveTemplatesData()` | `chrome.storage.local.set({ userTemplates })` / `chrome.storage.sync.set({ userTemplates })` | SET | 수정된 배열 | 활성 저장소 기준 |
| [저장] 클릭 | `saveTemplatesData()` | `chrome.runtime.sendMessage('refresh‑menus')` | MSG | — | 메뉴 동기화 |

### 5. 후원하기 모달 (`donateQrDlg`)

| 사용자 액션 | API 연동 |
|------------|---------|
| QR 이미지 표시 | 없음 (로컬 이미지) |

---

## 백그라운드 서비스 워커 (`background.js`) 내부 API 호출

| 트리거 | 함수 | API 호출 | 설명 |
|--------|------|---------|------|
| 확장 설치/업데이트 | `seedIfEmpty()` | `getActiveTemplateStorageArea()` + 해당 storage area `get/set` | 활성 저장소 기준 초기 샘플 데이터 생성 |
| 확장 설치/업데이트 | `rebuildMenus()` | `chrome.contextMenus.removeAll()` + `create()` + 활성 저장소 읽기 | 메뉴 전체 재생성 |
| 사이드패널 메시지 수신 | `rebuildMenus()` | `chrome.contextMenus.removeAll()` + `create()` + 활성 저장소 읽기 | 메뉴 갱신 |
| 컨텍스트 메뉴 클릭 | `onClicked` 핸들러 | 활성 저장소 `get` + `chrome.scripting.executeScript` | 텍스트 삽입 |
| 확장 아이콘 클릭 | `onClicked` | `chrome.sidePanel.open()` | 사이드패널 열기 |

---

## 데이터 흐름 다이어그램

### 템플릿 CRUD 흐름

```
[사용자 액션]
    │
    ├── 추가/수정 ──► editDlg 모달 ──► saveTemplate()
    ├── 순서변경 ──► Sortable onEnd
    └── 복사 ──► copyToClipboard()
                        │
                        ▼
               saveTemplatesData()
               ┌──────────────────────────────────────────┐
               │ 1. getActiveTemplateStorageArea()       │
               │ 2. storage.set() to local or sync       │
               │ 3. sendMessage('refresh-menus')         │
               └──────────────────────────────────────────┘           │
                                               ▼
                                        rebuildMenus()
                                               │
                                               ▼
                                     컨텍스트 메뉴 갱신
```

### 건축물대장 조회 흐름

```
[주소 검색] ──► loadAddressData() ──► address-codes.json (캐싱)
     │                                      │
     ▼                                      ▼
searchAddressByKeyword() ◄──────── 메모리 데이터
     │
     ▼
[코드 선택/직접 입력]
     │
     ▼
validateAndFormatInputs() ──► 검증 실패 시 에러
     │
     ▼ (검증 성공)
getBuildingInfo(params) ──► 공공 API (data.go.kr)
     │
     ├── 성공 ──► renderSimpleView() + renderDetailView()
     └── 실패 ──► errorMessage 표시
```
