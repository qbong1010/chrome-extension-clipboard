# MyLittleAPI — 프로젝트 API 명세서

> 이 문서는 프로젝트에서 사용하는 **모든 공공데이터 API**를 정리합니다.
> 모든 API는 [공공데이터포털](https://www.data.go.kr)에서 serviceKey를 발급받아 사용합니다.

---

## 목차

| # | API | 모듈 파일 | 엔드포인트 수 |
|:---:|:---|:---|:---:|
| 1 | [건축물대장 정보서비스](#1-건축물대장-정보서비스) | `sidepanel.js` (직접 호출) | 1 |
| 2 | [나라장터 입찰공고정보서비스](#2-나라장터-입찰공고정보서비스) | `koneps-api.js` → `bid` | 13 |
| 3 | [나라장터 낙찰정보서비스](#3-나라장터-낙찰정보서비스) | `koneps-api.js` → `award` | 8 |
| 4 | [나라장터 계약정보서비스](#4-나라장터-계약정보서비스) | `koneps-api.js` → `contract` | 8 |
| 5 | [나라장터 사전규격정보서비스](#5-나라장터-사전규격정보서비스) | `koneps-api.js` → `prespec` | 5 |

---

## 공통 요청 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|:---|:---|:---:|:---|
| `serviceKey` | string | ✅ | 공공데이터포털 인증키 |
| `pageNo` | string | ✅ | 페이지 번호 |
| `numOfRows` | string | ✅ | 페이지당 결과 수 |
| `type` | string | ❌ | 응답 형식 (`json` / `xml`) |

## 공통 에러 코드

| 코드 | 메시지 | 설명 |
|:---:|:---|:---|
| 00 | NORMAL SERVICE | 정상 |
| 01 | APPLICATION ERROR | 앱 에러 |
| 03 | NO DATA ERROR | 데이터 없음 |
| 10 | INVALID REQUEST PARAMETER ERROR | 파라미터 오류 |
| 11 | NO MANDATORY PARAMETER ERROR | 필수 파라미터 누락 |
| 20 | SERVICE ACCESS DENIED | 접근 거부 |
| 22 | LIMITED NUMBER OF SERVICE REQUESTS EXCEEDS | 요청 제한 초과 |
| 30 | SERVICE KEY IS NOT REGISTERED ERROR | 미등록 키 |
| 31 | DEADLINE HAS EXPIRED ERROR | 기간 만료 |

---

## 1. 건축물대장 정보서비스

> **설정 키:** `buildingApiKey`
> **Base URL:** `https://apis.data.go.kr/1613000/BldRgstHubService`
> **호출 위치:** `sidepanel.js` → `getBuildingInfo()`

### 엔드포인트

| 메서드 | 경로 | 설명 |
|:---|:---|:---|
| GET | `/getBrTitleInfo` | 건축물대장 표제부 조회 |

### 요청 파라미터

| 파라미터 | 필수 | 설명 |
|:---|:---:|:---|
| `sigunguCd` | ✅ | 시군구코드 (5자리) |
| `bjdongCd` | ✅ | 법정동코드 (5자리) |
| `platGbCd` | ✅ | 대지구분코드 (0=대지, 1=산) |
| `bun` | ✅ | 본번 (4자리) |
| `ji` | ✅ | 부번 (4자리) |

### 주요 응답 필드

| 필드 | 설명 |
|:---|:---|
| `bldNm` | 건물명 |
| `platPlc` | 대지위치 |
| `mainPurpsCdNm` | 주용도 |
| `strctCdNm` | 구조 |
| `totArea` | 연면적 |
| `grndFlrCnt` | 지상 층수 |
| `ugrndFlrCnt` | 지하 층수 |
| `useAprDay` | 사용승인일 |

---

## 2. 나라장터 입찰공고정보서비스

> **설정 키:** `konepsApiKey`
> **Base URL:** `http://apis.data.go.kr/1230000/ad/BidPublicInfoService`
> **모듈:** `koneps-api.js` → `api.bid`

### 엔드포인트 레지스트리

| 키 | 경로 | 업무유형 | 설명 |
|:---|:---|:---:|:---|
| `getList` | `/getBidPblancListInfo{type}` | ✅ | 입찰공고 목록 |
| `getListEtc` | `/getBidPblancListInfoEtc` | ❌ | 기타 공고 목록 |
| `getBasisAmount` | `/getBidPblancListInfo{type}BsisAmount` | 물품/공사/용역 | 기초금액 정보 |
| `getLicenseLimit` | `/getBidPblancListInfoLicenseLimit` | ❌ | 면허제한 정보 |
| `getRegion` | `/getBidPblancListInfoPrtcptPsblRgn` | ❌ | 참가가능지역 |
| `getPurchaseProduct` | `/getBidPblancListInfo{type}PurchsObjPrdct` | 물품/용역/외자 | 구매대상물품 |
| `getListPPS` | `/getBidPblancListInfo{type}PPSSrch` | ✅ | 검색조건 조회 |
| `getListEtcPPS` | `/getBidPblancListInfoEtcPPSSrch` | ❌ | 기타 검색조건 |
| `getChangeHistory` | `/getBidPblancListInfoChgHstry{type}` | 물품/용역/공사 | 변경이력 |
| `getInnovationFile` | `/getBidPblancListPPIFnlRfpIssAtchFileInfo` | ❌ | 혁신장터 첨부파일 |
| `getPriceFormula` | `/getBidPblancListBidPrceCalclAInfo` | ❌ | 입찰가격산식A |
| `getEvalField` | `/getBidPblancListEvaluationIndstrytyMfrcInfo` | ❌ | 평가 주력분야 |
| `getEorderFile` | `/getBidPblancListInfoEorderAtchFileInfo` | ❌ | e발주 첨부파일 |

### 추가 요청 파라미터

| 파라미터 | 설명 |
|:---|:---|
| `inqryDiv` | 조회구분 (1=등록일시, 2=공고번호) |
| `inqryBgnDt` | 시작일시 (YYYYMMDDHHMM) |
| `inqryEndDt` | 종료일시 (YYYYMMDDHHMM) |
| `bidNtceNo` | 입찰공고번호 |

### 주요 응답 필드

`bidNtceNo`(공고번호), `bidNtceNm`(공고명), `ntceInsttNm`(공고기관), `dminsttNm`(수요기관), `bidBeginDt`(입찰개시), `bidClseDt`(입찰마감), `presmptPrce`(추정가격), `bsisAmount`(기초금액)

---

## 3. 나라장터 낙찰정보서비스

> **Base URL:** `http://apis.data.go.kr/1230000/as/ScsbidInfoService`
> **모듈:** `koneps-api.js` → `api.award`

### 엔드포인트 레지스트리

| 키 | 경로 | 업무유형 | 설명 |
|:---|:---|:---:|:---|
| `getWinnerStatus` | `/getScsbidListSttus{type}` | ✅ | 낙찰자 현황 |
| `getOpeningResult` | `/getOpengResultListInfo{type}` | ✅ | 개찰결과 |
| `getReservePrice` | `/getOpengResultListInfo{type}PreparPcDetail` | ✅ | 예비가격 상세 |
| `getRebid` | `/getOpengResultListInfoRebid` | ❌ | 재입찰 목록 |
| `getFailed` | `/getOpengResultListInfoFailing` | ❌ | 유찰 목록 |
| `getCompleted` | `/getOpengResultListInfoOpengCompt` | ❌ | 개찰완료 목록 |
| `getOpeningResultPPS` | `/getOpengResultListInfo{type}PPSSrch` | ✅ | 개찰결과 (검색) |
| `getWinnerStatusPPS` | `/getScsbidListSttus{type}PPSSrch` | ✅ | 낙찰자 (검색) |

### 주요 응답 필드

`bidNtceNo`, `bidNtceNm`, `bidwinnrNm`(낙찰자), `sucsfbidAmt`(낙찰금액), `sucsfbidRate`(낙찰률%), `rlOpengDt`(개찰일시), `opengRank`(순위)

---

## 4. 나라장터 계약정보서비스

> **Base URL:** `http://apis.data.go.kr/1230000/ao/CntrctInfoService`
> **모듈:** `koneps-api.js` → `api.contract`

### 엔드포인트 레지스트리

| 키 | 경로 | 업무유형 | 설명 |
|:---|:---|:---:|:---|
| `getList` | `/getCntrctInfoList{type}` | ✅ | 계약 현황 |
| `getDetail` | `/getCntrctInfoList{type}Detail` | 물품/외자 | 계약 상세 |
| `getCnstwkServiceInfo` | `/getCntrctInfoListCnstwkServcInfo` | ❌ | 공사 서비스 정보 |
| `getGnrlServiceInfo` | `/getCntrctInfoListGnrlServcServcInfo` | ❌ | 일반 용역 정보 |
| `getTechServiceInfo` | `/getCntrctInfoListTechServcServcInfo` | ❌ | 기술 용역 정보 |
| `getChangeHistory` | `/getCntrctInfoList{type}ChgHstry` | ✅ | 변경이력 |
| `getDeleteHistory` | `/getCntrctInfoList{type}DltHstry` | ✅ | 삭제이력 |
| `getListPPS` | `/getCntrctInfoList{type}PPSSrch` | ✅ | 검색조건 조회 |

### 주요 응답 필드

`cntrctNo`(계약번호), `cntrctNm`(계약명), `cntrctCnclsDt`(체결일), `cntrctAmt`(금액), `cntrctInsttNm`(계약기관), `demInsttNm`(수요기관)

---

## 5. 나라장터 사전규격정보서비스

> **Base URL:** `https://apis.data.go.kr/1230000/ao/HrcspSsstndrdInfoService`
> **모듈:** `koneps-api.js` → `api.prespec`

### 엔드포인트 레지스트리

| 키 | 경로 | 업무유형 | 설명 |
|:---|:---|:---:|:---|
| `getList` | `/getPublicPrcureThngInfo{type}` | ✅ | 사전규격 목록 |
| `getByInstitution` | `/getInsttAcctoThngListInfo{type}` | ✅ | 기관별 조회 |
| `getProductDetail` | `/getThngDetailMetaInfo{type}` | ✅ | 품목별 상세 |
| `getListPPS` | `/getPublicPrcureThngInfo{type}PPSSrch` | ✅ | 검색조건 조회 |
| `getOpinions` | `/getPublicPrcureThngOpinionInfo{type}` | ✅ | 규격서 의견 |

### 주요 응답 필드

`bfSpecRgstNo`(등록번호), `prdctClsfcNoNm`(품명), `orderInsttNm`(발주기관), `asignBdgtAmt`(배정예산), `specDocFileUrl1~5`(규격서 파일)

---

## 업무유형 코드 매핑

| 키 | 한글 | API suffix |
|:---|:---|:---|
| `goods` | 물품 | `Thng` |
| `service` | 용역 | `Servc` |
| `construction` | 공사 | `Cnstwk` |
| `foreign` | 외자 | `Frgcpt` |

---

## 코드 사용법

```javascript
import { KonepsAPI } from './koneps-api.js';

const api = new KonepsAPI(serviceKey);

// 물품 입찰공고 조회
const bids = await api.bid.call('getList', {
  workType: 'goods',
  params: { inqryDiv: '1', inqryBgnDt: '202603010000', inqryEndDt: '202603170000' },
  pageNo: 1,
  numOfRows: 10,
});

// 사용 가능한 엔드포인트 확인
console.log(api.bid.listEndpoints());
console.log(api.award.listEndpoints());
```
