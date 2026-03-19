# Changelog

All notable changes to this project will be documented in this file.

## [1.5.2] - 2026-03-16

### Changed

- 🗺️ **주소 기반 코드 조회 UX 분리**
  - `건축물대장 조회` 화면의 인라인 주소 검색 흐름을 분리하고, 시군구코드/법정동코드 옆 도움 영역에서 모달로 진입하도록 조정
  - 좌측 네비게이션에 **법정동 코드 찾기** 전용 페이지를 추가해 기존 주소 검색 UI를 별도 화면으로 유지
  - 설정 아이콘을 네비게이션의 마지막 순서로 재배치

### Added

- 🧪 **Playwright MV3 런타임 스모크 테스트**
  - `tests/e2e/sidepanel-code-lookup.spec.js` 추가
  - `playwright.config.js` 및 확장 로드용 fixture 추가
  - 코드 조회 모달, 전용 페이지, 포커스 복귀, 건축물 조회 submit mock 경로를 자동 검증

### Fixed

- 🎯 **모달 선택 후 포커스 복귀 개선**

  - 코드 선택 후 `bunInput` 포커스가 모달 close 시점 이후에도 유지되도록 조정
- 🔐 **건축물대장 API 키 설정 분리**

  - 소스에 하드코딩된 API 키 대신 설정 화면의 저장 키를 사용하도록 변경
  - 키가 없을 때는 네트워크 호출 전에 명확한 안내 메시지를 표시하도록 조정

### Docs

- `README.md`, `docs/frontend.md`, `docs/IMPLEMENTATION_COMPLETE.md`를 현재 전용 페이지 + 모달 기반 UX와 Playwright 검증 흐름에 맞게 갱신

## [1.5.1] - 2026-03-13

### Added

- ⚙️ **설정 탭 실제 동작 연동**
  - `theme` / `templateStorageArea` / `clipboardWriteEnabled`를 `extensionSettings`로 저장
  - `storage-utils.js`를 추가해 설정 정규화, 활성 저장소 결정, 저장소 전환 로직 분리
  - `tests/settings-storage.test.js`를 추가해 기본 설정, 저장소 전환, sync quota 검증 테스트 보강

### Changed

- 🗂️ **템플릿 저장소 라우팅 개선**

  - 템플릿 데이터 `userTemplates`를 현재 설정된 저장소(`chrome.storage.local` 또는 `chrome.storage.sync`)에 저장하도록 변경
  - 저장소 타입 변경 시 템플릿을 복사하고 검증한 뒤에만 활성 저장소 포인터를 갱신하도록 변경
  - `background.js`의 메뉴 생성/클릭/초기 시드가 모두 활성 저장소를 기준으로 동작하도록 변경
- 🎨 **설정 화면 UI 업데이트**

  - 설정 화면의 "아직 개선중" 문구 제거
  - sync 저장소 사용량 표시 추가
  - 클립보드 읽기 항목을 비활성 표시로 조정

### Fixed

- 🧱 **sync 저장 실패 처리 개선**
  - 일반 템플릿 저장 경로에서도 sync quota를 검사하도록 변경
  - 저장 실패 시 템플릿 추가/수정/정렬 UI를 롤백하도록 보강
  - 기존 ID 없는 템플릿을 로드 시 자동 보정 후 즉시 저장해 컨텍스트 메뉴 누락을 방지

### Docs

- `docs/frontend.md`, `docs/backend.md`, `docs/api-integration.md`, `docs/PROJECT_CONTEXT.md`, `docs/IMPLEMENTATION_COMPLETE.md`를 현재 설정/저장소 구조에 맞게 갱신

## [1.5.0] - 2025-11-11

### Added

- 🏢 **건축물대장 조회 기능**

  - 검색 탭 추가 (네비게이션의 search 아이콘)
  - 시군구코드, 법정동코드, 지번 입력으로 건축물 정보 조회
  - 공공데이터포털 API 연동
  - 간략 보기 (카드 형태) 및 상세 보기 (테이블 형태)
  - 뷰 전환 기능
  - 로딩 인디케이터 및 에러 처리
- 🔍 **주소 검색 기능**

  - 전국 법정동코드 20,555개 데이터 통합
  - 주소 입력으로 시군구/법정동 코드 자동 조회
  - 아코디언 형태의 "주소로 코드 찾기" UI
  - 한글 검색 지원 (띄어쓰기 무시)
  - 검색 결과 최대 10개 표시
  - 선택 시 코드 자동 입력
  - **선택 후 자동 섹션 접기 기능** ⭐
  - Enter 키 검색 지원
  - 자동 포커스 이동
- 📋 **클립보드 복사 기능**

  - 템플릿 항목마다 복사 아이콘 추가
  - 원클릭으로 템플릿 내용 클립보드 복사
  - 토스트 메시지로 복사 완료 확인 (2초 표시)

### Changed

- 🎨 **네비게이션 개선**

  - add 버튼을 네비게이션에서 제거
  - 템플릿 헤더 우측에 + 버튼 배치
  - 3개 탭으로 단순화 (템플릿, 설정, 검색)
  - 기능별 논리적 그룹화
- 🎨 **UI/UX 개선**

  - Material Design 3 일관성 강화
  - 아코디언 애니메이션 추가
  - 섹션 구분선 스타일 개선
  - 버튼 및 입력 필드 레이아웃 최적화

### Technical

- `address-codes.json` 추가 (4.54MB, 20,555개 주소)
- `manifest.json`에 JSON 리소스 추가
- `iconv-lite` 의존성 추가 (EUC-KR 인코딩 처리)
- 약 850줄의 새로운 코드 추가

### Files

- **Added:**

  - `address-codes.json` - 주소 데이터
  - `IMPLEMENTATION_COMPLETE.md` - 구현 완료 문서
- **Modified:**

  - `sidepanel.html` - UI 구조 대폭 변경
  - `sidepanel.js` - 주소 검색, 건축물 조회 기능 추가
  - `styles/sidepanel.css` - 새로운 컴포넌트 스타일 추가
  - `manifest.json` - 리소스 및 버전 업데이트
  - `README.md` - 기능 설명 업데이트
  - `.gitignore` - playwright 디렉토리 추가

---

## [1.4.0] - 이전 버전

### Features

- 템플릿 관리 기본 기능
- 드래그 앤 드롭 정렬
- Material Design 3 스타일
- 우클릭 컨텍스트 메뉴
- 로컬 스토리지 저장

---

## 변경 요약

### 주요 개선사항

1. **편의성 개선:** 주소 검색으로 코드 찾기 자동화
2. **기능 확장:** 건축물대장 조회 추가
3. **UX 개선:** 자동 섹션 접기, 자동 포커스 이동
4. **UI 정리:** 네비게이션 단순화, 버튼 재배치

### 성능

- 검색 속도: 5-10ms (20,555개 데이터)
- 첫 로드: 1-2초
- 이후 검색: 즉시 (캐싱)

### 코드 품질

- Linter 오류 없음
- 모듈화된 함수 구조
- 명확한 변수명
- 주석 추가
