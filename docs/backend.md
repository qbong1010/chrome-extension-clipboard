# ⚙️ 백엔드 문서

> **Paste Right** Chrome 확장 프로그램의 백엔드(Service Worker + API) 구성을 기술합니다.

---

## 목차

1. [아키텍처 개요](#아키텍처-개요)
2. [Chrome Extension API](#chrome-extension-api)
3. [외부 API: 건축물대장 공공 API](#외부-api-건축물대장-공공-api)
4. [내부 데이터 API](#내부-데이터-api)
5. [메시지 통신 API](#메시지-통신-api)
6. [Content Script](#content-script)

---

## 아키텍처 개요

```
┌────────────────────────────────────────────────┐
│                Chrome Browser                   │
│                                                 │
│  ┌──────────┐    Message     ┌──────────────┐  │
│  │ Side     │ ──────────►   │ Background   │  │
│  │ Panel    │ ◄──────────   │ Service      │  │
│  │ (Front)  │  'refresh‑    │ Worker       │  │
│  │          │   menus'      │ (background  │  │
│  │          │               │  .js)        │  │
│  └──────────┘               └──────┬───────┘  │
│       │                            │           │
│       │                    ┌───────▼────────┐  │
│       │                    │ Context Menu   │  │
│       │                    │ + Scripting    │  │
│       │                    │ API            │  │
│       │                    └───────┬────────┘  │
│       │                            │           │
│  ┌────▼──────────────────────────────────────┐ │
│  │            Active Tab (웹 페이지)          │ │
│  │  ┌───────────────┐                        │ │
│  │  │ iframe        │ ← iframe-content.js    │ │
│  │  │ (gw.dohwa)    │   (Content Script)     │ │
│  │  └───────────────┘                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         chrome.storage.local              │  │
│  │         (userTemplates 데이터)             │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
         │
         │ fetch (HTTPS)
         ▼
┌────────────────────────────────┐
│  공공데이터포털 API             │
│  건축물대장 표제부 조회          │
│  (apis.data.go.kr)             │
└────────────────────────────────┘
```

---

## Chrome Extension API

### API 1: `chrome.storage.local`

> 템플릿 데이터의 로컬 영구 저장소

| 항목 | 내용 |
|------|------|
| **키** | `userTemplates` |
| **데이터 형식** | `Array<{ id: string, title: string, body: string }>` |
| **호출 위치** | `sidepanel.js`, `background.js` |

#### 읽기 (GET)
```javascript
// 템플릿 목록 로드
const { userTemplates = [] } = await chrome.storage.local.get(['userTemplates']);
```

| 호출 위치 | 함수 | 용도 |
|----------|------|------|
| `sidepanel.js` | `loadTemplates()` | 사이드패널 초기 로드 |
| `background.js` | `rebuildMenus()` | 컨텍스트 메뉴 생성 |
| `background.js` | `onClicked` 핸들러 | 클릭된 메뉴 항목의 본문 조회 |

#### 쓰기 (SET)
```javascript
// 템플릿 목록 저장
await chrome.storage.local.set({ userTemplates: templates });
```

| 호출 위치 | 함수 | 용도 |
|----------|------|------|
| `sidepanel.js` | `saveTemplatesData()` | 추가/수정/삭제/정렬 후 저장 |
| `background.js` | `seedIfEmpty()` | 최초 샘플 데이터 초기화 |

#### 데이터 스키마

```json
{
  "userTemplates": [
    {
      "id": "tpl_1709234567890_a1b2c3d4e",
      "title": "이메일 도입부 인사",
      "body": "안녕하세요, \n 도화엔지니어링 도시단지1부 정규봉 사원입니다."
    }
  ]
}
```

---

### API 2: `chrome.contextMenus`

> 우클릭 컨텍스트 메뉴 관리

| 항목 | 내용 |
|------|------|
| **파일** | `background.js` |
| **트리거** | 확장 프로그램 설치, 템플릿 변경 시 |
| **대상** | `editable` 컨텍스트 (입력 필드) |

#### 메뉴 구조

```
[우클릭 컨텍스트 메뉴]
└── 템플릿 붙여넣기  (ROOT_MENU_ID: 'quickTemplateRoot')
    ├── 이메일 도입부 인사    (id: 'official_01')
    ├── 월간공정보고          (id: 'official_02')
    └── 출장정산              (id: 'official_03')
```

#### `removeAll()`
```javascript
await chrome.contextMenus.removeAll();
```
- 모든 기존 메뉴 항목 제거
- `rebuildMenus()` 시작 시 호출

#### `create(properties)`
```javascript
chrome.contextMenus.create({
  id: ROOT_MENU_ID,           // 'quickTemplateRoot'
  title: '템플릿 붙여넣기',
  contexts: ['editable']
});

chrome.contextMenus.create({
  id: tpl.id,                 // 템플릿 고유 ID
  parentId: ROOT_MENU_ID,
  title: tpl.title,
  contexts: ['editable']
});
```

#### `onClicked` 이벤트 핸들러
```javascript
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // 1. 클릭된 menuItemId로 템플릿 조회
  // 2. chrome.scripting.executeScript()로 텍스트 삽입
});
```

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `info.menuItemId` | `string` | 클릭된 메뉴 항목 ID (= 템플릿 ID) |
| `tab.id` | `number` | 현재 활성 탭 ID |

---

### API 3: `chrome.scripting.executeScript`

> 활성 탭에 스크립트 주입하여 텍스트 삽입 실행

```javascript
chrome.scripting.executeScript({
  target: { tabId: tab.id },
  func: insertText,
  args: [tpl.body]
});
```

| 항목 | 내용 |
|------|------|
| **파일** | `background.js` |
| **주입 함수** | `insertText(text)` |
| **대상** | 현재 활성 탭 |

#### `insertText` 함수 동작 흐름

```
insertText(text)
├── 1. insertTextIntoElement(text)  — 현재 문서
│   ├── HTMLInputElement / HTMLTextAreaElement → value 직접 수정
│   ├── contentEditable → Selection API로 삽입
│   └── input 이벤트 dispatch
├── 2. 실패 시 → iframe 순회
│   └── frame.contentWindow.document.execCommand('insertText')
└── 3. 최종 실패 → alert() 안내
```

---

### API 4: `chrome.runtime.onInstalled`

> 확장 프로그램 최초 설치/업데이트 시 실행

```javascript
chrome.runtime.onInstalled.addListener(async () => {
  await seedIfEmpty();    // 샘플 데이터 초기화
  await rebuildMenus();   // 컨텍스트 메뉴 빌드
});
```

---

### API 5: `chrome.runtime.onMessage`

> 사이드패널 ↔ 백그라운드 메시지 통신

```javascript
// background.js (수신측)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === 'refresh‑menus') {
    rebuildMenus().then(() => sendResponse({ ok: true }));
    return true;
  }
});
```

```javascript
// sidepanel.js (발신측)
chrome.runtime.sendMessage('refresh‑menus', (response) => {
  console.log('메뉴 갱신 응답:', response);
});
```

| 방향 | 메시지 | 응답 | 용도 |
|------|--------|------|------|
| Side Panel → Background | `'refresh‑menus'` | `{ ok: true }` | 템플릿 변경 후 컨텍스트 메뉴 갱신 |

---

### API 6: `chrome.sidePanel.open`

> 확장 아이콘 클릭 시 사이드패널 열기

```javascript
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
```

---

## 외부 API: 건축물대장 공공 API

> **제공처**: 공공데이터포털 (data.go.kr)
> **서비스명**: 건축물대장정보 서비스 - 건축물대장 표제부 조회

### 기본 정보

| 항목 | 내용 |
|------|------|
| **Base URL** | `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo` |
| **Method** | `GET` |
| **응답 형식** | JSON (`_type=json`) |
| **인증** | `serviceKey` (API Key) |
| **호출 위치** | `sidepanel.js` → `getBuildingInfo()` |

### 요청 파라미터

| 파라미터 | 필수 | 형식 | 설명 | 예시 |
|---------|------|------|------|------|
| `serviceKey` | ✅ | `string` | API 인증 키 | `0432b681...` |
| `sigunguCd` | ✅ | `string(5)` | 시군구 코드 | `41360` |
| `bjdongCd` | ✅ | `string(5)` | 법정동 코드 | `10300` |
| `platGbCd` | ✅ | `string(1)` | 대지구분 (0=대지, 1=산, 2=블록) | `0` |
| `bun` | ✅ | `string(4)` | 본번 | `0685` |
| `ji` | ✅ | `string(4)` | 부번 | `0017` |
| `_type` | ❌ | `string` | 응답형식 | `json` |

### 요청 예시

```
GET https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo
  ?serviceKey=API_KEY
  &sigunguCd=41360
  &bjdongCd=10300
  &platGbCd=0
  &bun=0685
  &ji=0017
  &_type=json
```

### 응답 구조

```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL SERVICE."
    },
    "body": {
      "items": {
        "item": {
          "platPlc": "경기도 남양주시 금곡동 685-17",
          "newPlatPlc": "...",
          "bldNm": "건물명",
          "mainPurpsCdNm": "주용도",
          "strctCdNm": "구조",
          "platArea": 123.45,
          "archArea": 67.89,
          "totArea": 200.00,
          "bcRat": 55.12,
          "vlRat": 162.34,
          "grndFlrCnt": 3,
          "ugrndFlrCnt": 1,
          "useAprDay": "20150630",
          "...": "... (50+ 필드)"
        }
      }
    }
  }
}
```

### 응답 필드 (주요 50+개)

| 필드명 | 설명 | 비고 |
|--------|------|------|
| `platPlc` | 지번 주소 | |
| `newPlatPlc` | 도로명 주소 | |
| `bldNm` | 건물명 | |
| `regstrGbCdNm` | 대장구분명 | |
| `mainPurpsCdNm` | 주용도명 | |
| `strctCdNm` | 구조명 | |
| `roofCdNm` | 지붕명 | |
| `platArea` | 대지면적 (㎡) | |
| `archArea` | 건축면적 (㎡) | |
| `totArea` | 연면적 (㎡) | |
| `bcRat` | 건폐율 (%) | |
| `vlRat` | 용적률 (%) | |
| `grndFlrCnt` | 지상층수 | |
| `ugrndFlrCnt` | 지하층수 | |
| `hhldCnt` | 세대수 | |
| `pmsDay` | 허가일 | `YYYYMMDD` |
| `stcnsDay` | 착공일 | `YYYYMMDD` |
| `useAprDay` | 사용승인일 | `YYYYMMDD` |
| `rserthqkDsgnApplyYn` | 내진설계 적용여부 | |
| `rserthqkAblty` | 내진능력 | |

> 전체 필드 목록은 `sidepanel.js`의 `renderDetailView()` 내 `fieldMap` 객체 참조 (L671-749)

### 에러 처리

| 상황 | 처리 방식 |
|------|----------|
| HTTP 오류 | `throw new Error('건축물대장 API 호출 실패')` |
| 결과 없음 | `throw new Error('건축물 정보를 찾을 수 없습니다')` |
| 입력값 오류 | `validateAndFormatInputs()` 에서 사전 검증 |

---

## 내부 데이터 API

### 로컬 JSON: `address-codes.json`

> 주소 검색을 위한 시군구/법정동 코드 매핑 데이터

| 항목 | 내용 |
|------|------|
| **파일 크기** | ~4.7 MB |
| **로드 방식** | `fetch(chrome.runtime.getURL('address-codes.json'))` |
| **캐싱** | 메모리 변수 `addressData` (1회 로드 후 재사용) |

#### 데이터 구조

```json
{
  "4136010300": {
    "sigunguCd": "41360",
    "bjdongCd": "10300",
    "fullAddress": "경기도 남양주시 금곡동",
    "searchText": "경기도남양주시금곡동"
  }
}
```

#### 검색 로직

```javascript
function searchAddressByKeyword(keyword) {
  // 1. 검색어 공백 제거 + 소문자 변환
  // 2. 최소 2글자 이상
  // 3. searchText에 포함 여부 확인
  // 4. 최대 10건 반환
}
```

### 로컬 JSON: `default-templates.json`

> 최초 설치 시 기본 템플릿 데이터

```json
[
  { "id": "tpl_approval", "title": "결재의견", "body": "..." },
  { "id": "tpl_expense_comment", "title": "출장정산 상신의견", "body": "..." },
  { "id": "monthly_report_comment", "title": "월간공정보고 상신의견", "body": "..." },
  { "id": "monthly_report", "title": "월간공정보고 제출공문", "body": "..." }
]
```

---

## Content Script

### `iframe-content.js`

> 특정 도메인의 iframe 내에서 편집 가능 여부를 감지하는 콘텐츠 스크립트

| 항목 | 내용 |
|------|------|
| **대상 URL** | `https://gw.dohwa.co.kr/ekp/view/eml/emlMailRegPopup*` |
| **실행 범위** | `all_frames: true` |
| **이벤트** | `contextmenu` (우클릭) |

#### 동작

```javascript
document.addEventListener('contextmenu', function(event) {
  // 편집 가능한 요소(contentEditable, input, textarea) 감지
  // → dataset.isEditable = true 표시
  // → 부모 창에 postMessage 전송
});
```

#### 메시지 형식

```javascript
window.parent.postMessage({
  type: 'editable-context-detected',
  editable: true
}, '*');
```
