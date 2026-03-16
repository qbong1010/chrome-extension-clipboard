# Chrome Web Store 등록 필수사항 점검 (2026-03-16)

## 점검 결과 요약

- **코드/패키지 관점:** 기본 등록 요건 대부분 충족.
- **등록 준비 관점:** 스토어 콘솔에서 요구되는 메타데이터(아이콘/스크린샷/개인정보처리방침 URL 등) 확인이 추가로 필요.
- **우선 보완 권고:** `host_permissions: ["<all_urls>"]` 권한 사용 사유를 스토어 설명에 명확히 기재하고, 가능하면 범위를 축소.

## 필수사항 체크리스트

| 구분 | 항목 | 상태 | 근거/비고 |
|---|---|---|---|
| 패키지 | 압축 업로드 파일 생성 가능 | ✅ | `npm run package:extension`으로 `dist/paste-right-v1.5.zip` 생성 |
| 패키지 | 업로드 가능한 파일 크기 | ✅ | 결과물 약 `528K` |
| 매니페스트 | Manifest V3 사용 | ✅ | `manifest_version: 3` |
| 매니페스트 | `name`, `version`, `description` 정의 | ✅ | 모두 정의됨 |
| 매니페스트 | 서비스 워커(background) 구성 | ✅ | `background.service_worker` 정의 |
| 매니페스트 | 사이드패널 구성 | ✅ | `side_panel.default_path` 정의 |
| 매니페스트 | 권한 선언 (`permissions`) | ✅ | `contextMenus`, `storage`, `tabs` 등 선언 |
| 매니페스트 | 호스트 권한 선언 (`host_permissions`) | ⚠️ | `<all_urls>` 사용. 심사 시 권한 사유 설명 필요 |
| 런타임 파일 | 패키지에 핵심 파일 포함 | ✅ | `manifest.json`, `sidepanel.*`, `background.js`, `storage-utils.js` 등 포함 |
| 자동화 검증 | 단위 테스트 | ✅ | `npm test` 통과 |
| 자동화 검증 | 정적 문법 검사 | ✅ | `node --check ...` 통과 |
| 자동화 검증 | E2E 테스트 | ⚠️ | Playwright Chromium 미설치로 실행 불가 |
| 스토어 등록 메타 | 확장 프로그램 아이콘(스토어용 128x128) | ⚠️ | 저장소에 `icons/` 디렉터리 없음. 스토어 에셋 별도 준비 필요 |
| 스토어 등록 메타 | 스토어 설명/카테고리/언어 | ⚠️ | 코드 저장소만으로 완료 여부 확인 불가 |
| 스토어 등록 메타 | 스크린샷(필수 제출 항목) | ⚠️ | 저장소에서 스토어 제출용 스크린샷 세트 확인 불가 |
| 정책/법무 | 개인정보처리방침 URL(해당 시 필수) | ⚠️ | 저장소 내 정책 문서/URL 미확인 |

## 현재 코드 기준 리스크 포인트

1. **광범위한 호스트 권한**
   - 현재 `<all_urls>`를 요청합니다.
   - Chrome Web Store 심사에서 "권한 최소화"와 "명확한 기능 연관성" 설명이 중요합니다.

2. **아이콘 리소스 관리 불일치 가능성**
   - 소스 `manifest.json`에는 `web_accessible_resources`에 `icons/*`가 존재하지만,
     패키징 스크립트는 `icons/` 폴더가 없으면 해당 항목을 제거합니다.
   - 결과적으로 업로드 ZIP은 정상이나, 소스/배포 매니페스트 간 차이로 운영 혼선이 생길 수 있습니다.

## 등록 전 권장 액션

1. Chrome Web Store 등록 페이지에 사용할 **128x128 아이콘, 최소 1장 이상의 스크린샷**을 준비.
2. 개인정보/사용자 데이터 처리 여부를 기준으로 **개인정보처리방침 URL 필요 여부**를 확정.
3. `<all_urls>` 권한을 유지한다면, 스토어 설명에 **권한 사용 목적과 동작 범위**를 구체적으로 기재.
4. 가능하면 `host_permissions`를 실제 필요한 도메인 중심으로 축소 후 재검증.
5. CI/로컬에 Playwright 브라우저를 설치해 E2E 증빙을 확보 (`npx playwright install`).

## 점검에 사용한 명령

```bash
npm test
node --check sidepanel.js building-code-lookup.js storage-utils.js background.js tests/building-code-lookup.test.js
npx playwright test tests/e2e/sidepanel-code-lookup.spec.js --project=chromium
npm run package:extension
du -h dist/paste-right-v1.5.zip
unzip -l dist/paste-right-v1.5.zip
unzip -p dist/paste-right-v1.5.zip manifest.json
```
