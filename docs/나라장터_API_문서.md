# 조달청 나라장터(KONEPS) Open API 종합 문서

> **제공기관:** 조달청 · 조달데이터관리팀 (☎ 042-724-7685)
> **응답 포맷:** JSON / XML · **인증:** 공공데이터포털 서비스키 필수
> **이용허락:** 제한 없음

---

## 목차

1. [공통 사항](#1-공통-사항)
2. [입찰공고정보서비스](#2-입찰공고정보서비스) (25개 엔드포인트)
3. [낙찰정보서비스](#3-낙찰정보서비스) (23개 엔드포인트)
4. [계약정보서비스](#4-계약정보서비스) (21개 엔드포인트)
5. [사전규격정보서비스](#5-사전규격정보서비스) (20개 엔드포인트)
6. [에러 코드](#6-에러-코드)
7. [사용 예시](#7-사용-예시)

---

## 1. 공통 사항

### 1.1 인증

모든 API는 [공공데이터포털](https://www.data.go.kr)에서 활용 신청 후 발급받은 **서비스키(serviceKey)** 가 필요합니다.

### 1.2 공통 요청 파라미터

| 파라미터명 | 타입 | 필수 | 설명 |
|:---|:---|:---:|:---|
| `serviceKey` | string | ✅ | 공공데이터포털에서 발급받은 인증키 (URL Encoding) |
| `pageNo` | string | ✅ | 페이지 번호 (기본: 1) |
| `numOfRows` | string | ✅ | 한 페이지 결과 수 (기본: 10) |
| `type` | string | ❌ | 응답 형식 — `json` 또는 `xml` (기본: xml) |
| `inqryDiv` | string | ✅ | 조회구분 (1: 등록일시, 2: 공고번호 등 — API별 상이) |

### 1.3 공통 응답 구조

```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL SERVICE"
    },
    "body": {
      "items": [ { /* 개별 데이터 */ } ],
      "totalCount": 100,
      "pageNo": 1,
      "numOfRows": 10
    }
  }
}
```

### 1.4 날짜 형식

- 조회 기간 파라미터: **`YYYYMMDDHHMM`** (예: `202603170000`)
- 응답 날짜 필드: **`YYYY/MM/DD HH:MM`** 또는 **`YYYYMMDD`**

---

## 2. 입찰공고정보서비스

> **Base URL:** `http://apis.data.go.kr/1230000/ad/BidPublicInfoService`
> **데이터 범위:** 1995년 10월 ~ 현재 · **포털 페이지:** [data.go.kr/15129394](https://www.data.go.kr/data/15129394/openapi.do)

물품, 용역, 공사, 외자의 입찰공고 목록, 상세정보, 기초금액, 면허제한, 참가가능지역, 변경이력 등을 제공합니다.

### 2.1 주요 요청 파라미터 (공통 외 추가)

| 파라미터명 | 타입 | 필수 | 설명 |
|:---|:---|:---:|:---|
| `inqryBgnDt` | string | ❌ | 조회 시작일시 (YYYYMMDDHHMM) |
| `inqryEndDt` | string | ❌ | 조회 종료일시 (YYYYMMDDHHMM) |
| `bidNtceNo` | string | ❌ | 입찰공고번호 |

### 2.2 엔드포인트 목록 (25개)

#### 📋 입찰공고 목록 조회

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 1 | `/getBidPblancListInfoThng` | 물품 입찰공고 목록 |
| 2 | `/getBidPblancListInfoServc` | 용역 입찰공고 목록 |
| 3 | `/getBidPblancListInfoCnstwk` | 공사 입찰공고 목록 |
| 4 | `/getBidPblancListInfoFrgcpt` | 외자 입찰공고 목록 |
| 5 | `/getBidPblancListInfoEtc` | 기타(조달청 외 기관) 공고 목록 |

#### 💰 기초금액 정보

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 6 | `/getBidPblancListInfoThngBsisAmount` | 물품 기초금액 정보 |
| 7 | `/getBidPblancListInfoCnstwkBsisAmount` | 공사 기초금액 정보 |
| 8 | `/getBidPblancListInfoServcBsisAmount` | 용역 기초금액 정보 |

#### 🔒 제한 및 지역 정보

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 9 | `/getBidPblancListInfoLicenseLimit` | 면허제한 정보 |
| 10 | `/getBidPblancListInfoPrtcptPsblRgn` | 참가가능지역 정보 |

#### 🛒 구매대상물품 정보

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 11 | `/getBidPblancListInfoThngPurchsObjPrdct` | 물품 구매대상물품 |
| 12 | `/getBidPblancListInfoServcPurchsObjPrdct` | 용역 구매대상물품 |
| 13 | `/getBidPblancListInfoFrgcptPurchsObjPrdct` | 외자 구매대상물품 |

#### 🔍 나라장터 검색조건 조회 (PPSSrch)

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 14 | `/getBidPblancListInfoThngPPSSrch` | 물품공고 (검색조건) |
| 15 | `/getBidPblancListInfoServcPPSSrch` | 용역공고 (검색조건) |
| 16 | `/getBidPblancListInfoCnstwkPPSSrch` | 공사공고 (검색조건) |
| 17 | `/getBidPblancListInfoFrgcptPPSSrch` | 외자공고 (검색조건) |
| 18 | `/getBidPblancListInfoEtcPPSSrch` | 기타공고 (검색조건) |

#### 📝 변경이력

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 19 | `/getBidPblancListInfoChgHstryThng` | 물품 변경이력 |
| 20 | `/getBidPblancListInfoChgHstryServc` | 용역 변경이력 |
| 21 | `/getBidPblancListInfoChgHstryCnstwk` | 공사 변경이력 |

#### 📎 기타

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 22 | `/getBidPblancListPPIFnlRfpIssAtchFileInfo` | 혁신장터 최종제안요청서 첨부파일 |
| 23 | `/getBidPblancListBidPrceCalclAInfo` | 입찰가격산식A 정보 |
| 24 | `/getBidPblancListEvaluationIndstrytyMfrcInfo` | 평가대상 주력분야 정보 |
| 25 | `/getBidPblancListInfoEorderAtchFileInfo` | e발주 첨부파일 정보 |

### 2.3 주요 응답 필드

| 필드명 | 설명 |
|:---|:---|
| `bidNtceNo` | 입찰공고번호 |
| `bidNtceNm` | 공고명 |
| `ntceInsttNm` | 공고기관명 |
| `dminsttNm` | 수요기관명 |
| `bidBeginDt` | 입찰개시일시 |
| `bidClseDt` | 입찰마감일시 |
| `opengDt` | 개찰일시 |
| `presmptPrce` | 추정가격 |
| `bsisAmount` | 기초금액 |
| `sucsfbidMthdNm` | 낙찰방법명 |

---

## 3. 낙찰정보서비스

> **Base URL:** `http://apis.data.go.kr/1230000/as/ScsbidInfoService`
> **데이터 범위:** 1995년 10월 ~ 현재 · **포털 페이지:** [data.go.kr/15129397](https://www.data.go.kr/data/15129397/openapi.do)

개찰결과를 물품, 공사, 용역, 외자별로 제공. 최종낙찰자, 개찰순위, 복수예비가, 예비가격 정보 포함.

### 3.1 주요 요청 파라미터 (공통 외 추가)

| 파라미터명 | 타입 | 필수 | 설명 |
|:---|:---|:---:|:---|
| `inqryBgnDt` | string | ❌ | 조회 시작일시 |
| `inqryEndDt` | string | ❌ | 조회 종료일시 |
| `bidNtceNo` | string | ❌ | 입찰공고번호 |
| `bidClsfcNo` | string | ❌ | 입찰분류번호 (일부 API 필수) |

### 3.2 엔드포인트 목록 (23개)

#### 🏆 낙찰자 현황 조회

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 1 | `/getScsbidListSttusThng` | 물품 낙찰 현황 |
| 2 | `/getScsbidListSttusCnstwk` | 공사 낙찰 현황 |
| 3 | `/getScsbidListSttusServc` | 용역 낙찰 현황 |
| 4 | `/getScsbidListSttusFrgcpt` | 외자 낙찰 현황 |

#### 📊 개찰결과 목록

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 5 | `/getOpengResultListInfoThng` | 물품 개찰결과 |
| 6 | `/getOpengResultListInfoCnstwk` | 공사 개찰결과 |
| 7 | `/getOpengResultListInfoServc` | 용역 개찰결과 |
| 8 | `/getOpengResultListInfoFrgcpt` | 외자 개찰결과 |

#### 💲 예비가격 상세

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 9 | `/getOpengResultListInfoThngPreparPcDetail` | 물품 예비가격 상세 |
| 10 | `/getOpengResultListInfoCnstwkPreparPcDetail` | 공사 예비가격 상세 |
| 11 | `/getOpengResultListInfoServcPreparPcDetail` | 용역 예비가격 상세 |
| 12 | `/getOpengResultListInfoFrgcptPreparPcDetail` | 외자 예비가격 상세 |

#### 🔄 재입찰 / 유찰

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 13 | `/getOpengResultListInfoRebid` | 재입찰 목록 |
| 14 | `/getOpengResultListInfoFailing` | 유찰 목록 |

#### ✅ 개찰완료

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 15 | `/getOpengResultListInfoOpengCompt` | 개찰완료 목록 (전체) |

#### 🔍 나라장터 검색조건 조회 (PPSSrch) — 개찰결과

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 16 | `/getOpengResultListInfoThngPPSSrch` | 물품 개찰결과 (검색조건) |
| 17 | `/getOpengResultListInfoCnstwkPPSSrch` | 공사 개찰결과 (검색조건) |
| 18 | `/getOpengResultListInfoServcPPSSrch` | 용역 개찰결과 (검색조건) |
| 19 | `/getOpengResultListInfoFrgcptPPSSrch` | 외자 개찰결과 (검색조건) |

#### 🔍 나라장터 검색조건 조회 (PPSSrch) — 낙찰자

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 20 | `/getScsbidListSttusThngPPSSrch` | 물품 낙찰자 (검색조건) |
| 21 | `/getScsbidListSttusCnstwkPPSSrch` | 공사 낙찰자 (검색조건) |
| 22 | `/getScsbidListSttusServcPPSSrch` | 용역 낙찰자 (검색조건) |
| 23 | `/getScsbidListSttusFrgcptPPSSrch` | 외자 낙찰자 (검색조건) |

### 3.3 PPSSrch 추가 파라미터

| 파라미터명 | 설명 |
|:---|:---|
| `bidNtceNm` | 입찰공고명 |
| `ntceInsttCd` | 공고기관코드 |
| `dminsttCd` | 수요기관코드 |
| `refNo` | 참조번호 |
| `indstrytyCd` | 업종코드 |
| `presmptPrceBgn` | 추정가격 시작 |
| `presmptPrceEnd` | 추정가격 종료 |

### 3.4 주요 응답 필드

| 필드명 | 설명 |
|:---|:---|
| `bidNtceNo` | 입찰공고번호 |
| `bidNtceNm` | 공고명 |
| `bidwinnrNm` | 낙찰자명 |
| `sucsfbidAmt` | 낙찰금액 |
| `sucsfbidRate` | 낙찰률 (%) |
| `dminsttNm` | 수요기관명 |
| `rlOpengDt` | 실개찰일시 |
| `opengRank` | 개찰순위 |
| `preparPrce` | 예비가격 |

---

## 4. 계약정보서비스

> **Base URL:** `http://apis.data.go.kr/1230000/ao/CntrctInfoService`
> **데이터 범위:** 2004년 7월 ~ 현재 · **포털 페이지:** [data.go.kr/15129427](https://www.data.go.kr/data/15129427/openapi.do)

나라장터 체결 계약의 목록, 상세, 변경이력, 삭제이력을 물품/공사/용역/외자별로 제공.

### 4.1 주요 요청 파라미터 (공통 외 추가)

| 파라미터명 | 타입 | 필수 | 설명 |
|:---|:---|:---:|:---|
| `inqryBgnDt` | string | ❌ | 조회 시작일시 |
| `inqryEndDt` | string | ❌ | 조회 종료일시 |
| `untyCntrctNo` | string | ❌ | 통합계약번호 |

### 4.2 엔드포인트 목록 (21개)

#### 📦 물품 계약

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 1 | `/getCntrctInfoListThng` | 물품 계약 현황 |
| 2 | `/getCntrctInfoListThngDetail` | 물품 계약 상세 |
| 3 | `/getCntrctInfoListThngChgHstry` | 물품 계약 변경이력 |
| 4 | `/getCntrctInfoListThngDltHstry` | 물품 계약 삭제이력 |
| 5 | `/getCntrctInfoListThngPPSSrch` | 물품 계약 (검색조건) |

#### 🏗️ 공사 계약

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 6 | `/getCntrctInfoListCnstwk` | 공사 계약 현황 |
| 7 | `/getCntrctInfoListCnstwkServcInfo` | 공사 서비스 정보 |
| 8 | `/getCntrctInfoListCnstwkChgHstry` | 공사 계약 변경이력 |
| 9 | `/getCntrctInfoListCnstwkDltHstry` | 공사 계약 삭제이력 |
| 10 | `/getCntrctInfoListCnstwkPPSSrch` | 공사 계약 (검색조건) |

#### 📋 용역 계약

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 11 | `/getCntrctInfoListServc` | 용역 계약 현황 |
| 12 | `/getCntrctInfoListGnrlServcServcInfo` | 일반 용역 서비스 정보 |
| 13 | `/getCntrctInfoListTechServcServcInfo` | 기술 용역 서비스 정보 |
| 14 | `/getCntrctInfoListServcChgHstry` | 용역 계약 변경이력 |
| 15 | `/getCntrctInfoListServcDltHstry` | 용역 계약 삭제이력 |
| 16 | `/getCntrctInfoListServcPPSSrch` | 용역 계약 (검색조건) |

#### 🌐 외자 계약

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 17 | `/getCntrctInfoListFrgcpt` | 외자 계약 현황 |
| 18 | `/getCntrctInfoListFrgcptDetail` | 외자 계약 상세 |
| 19 | `/getCntrctInfoListFrgcptChgHstry` | 외자 계약 변경이력 |
| 20 | `/getCntrctInfoListFrgcptDltHstry` | 외자 계약 삭제이력 |
| 21 | `/getCntrctInfoListFrgcptPPSSrch` | 외자 계약 (검색조건) |

### 4.3 PPSSrch 추가 파라미터

| 파라미터명 | 설명 |
|:---|:---|
| `cntrctCnclsDt` | 계약체결일자 |
| `cnfrmCntrctNo` | 확정계약번호 |
| `rqstNo` | 요청번호 |
| `bidNtceNo` | 공고번호 |
| `cntrctInsttNm` | 계약기관명 |
| `dminsttNm` | 수요기관명 |
| `prdctNm` | 품명 |
| `cntrctMthdNm` | 계약방법 |
| `cntrctRefNo` | 계약참조번호 |

### 4.4 주요 응답 필드

| 필드명 | 설명 |
|:---|:---|
| `untyCntrctNo` | 통합계약번호 |
| `cntrctNm` | 계약명 |
| `cntrctCnclsDate` | 계약체결일자 |
| `totCntrctAmt` | 총계약금액 |
| `cntrctInsttNm` | 계약기관명 |
| `demInsttNm` | 수요기관명 |
| `corpList` | 계약업체 목록 |
| `cntrctDtlInfoUrl` | 나라장터 상세 URL |

---

## 5. 사전규격정보서비스

> **Base URL:** `https://apis.data.go.kr/1230000/ao/HrcspSsstndrdInfoService`
> **포털 페이지:** [data.go.kr/15129437](https://www.data.go.kr/data/15129437/openapi.do)

나라장터 공개 사전규격 정보를 물품/용역/공사/외자별로 제공. 규격등록번호, 품명, 배정예산액, 규격서파일, 의견 등 포함.

### 5.1 주요 요청 파라미터 (공통 외 추가)

| 파라미터명 | 타입 | 필수 | 설명 |
|:---|:---|:---:|:---|
| `inqryBgnDt` | string | ❌ | 조회 시작일시 |
| `inqryEndDt` | string | ✅ | 조회 종료일시 (일부 API 필수) |
| `bfSpecRgstNo` | string | ❌ | 사전규격등록번호 |

### 5.2 엔드포인트 목록 (20개)

#### 📋 사전규격 목록 조회

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 1 | `/getPublicPrcureThngInfoThng` | 물품 사전규격 목록 |
| 2 | `/getPublicPrcureThngInfoServc` | 용역 사전규격 목록 |
| 3 | `/getPublicPrcureThngInfoCnstwk` | 공사 사전규격 목록 |
| 4 | `/getPublicPrcureThngInfoFrgcpt` | 외자 사전규격 목록 |

#### 🏢 기관별 조회

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 5 | `/getInsttAcctoThngListInfoThng` | 물품 — 기관별 |
| 6 | `/getInsttAcctoThngListInfoServc` | 용역 — 기관별 |
| 7 | `/getInsttAcctoThngListInfoCnstwk` | 공사 — 기관별 |
| 8 | `/getInsttAcctoThngListInfoFrgcpt` | 외자 — 기관별 |

#### 🏷️ 품목별 상세

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 9 | `/getThngDetailMetaInfoThng` | 물품 — 품목별 상세 |
| 10 | `/getThngDetailMetaInfoServc` | 용역 — 품목별 상세 |
| 11 | `/getThngDetailMetaInfoCnstwk` | 공사 — 품목별 상세 |
| 12 | `/getThngDetailMetaInfoFrgcpt` | 외자 — 품목별 상세 |

#### 🔍 나라장터 검색조건 조회 (PPSSrch)

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 13 | `/getPublicPrcureThngInfoThngPPSSrch` | 물품 (검색조건) |
| 14 | `/getPublicPrcureThngInfoServcPPSSrch` | 용역 (검색조건) |
| 15 | `/getPublicPrcureThngInfoCnstwkPPSSrch` | 공사 (검색조건) |
| 16 | `/getPublicPrcureThngInfoFrgcptPPSSrch` | 외자 (검색조건) |

#### 💬 규격서 의견 목록

| # | 엔드포인트 | 설명 |
|:---:|:---|:---|
| 17 | `/getPublicPrcureThngOpinionInfoThng` | 물품 규격서 의견 |
| 18 | `/getPublicPrcureThngOpinionInfoServc` | 용역 규격서 의견 |
| 19 | `/getPublicPrcureThngOpinionInfoCnstwk` | 공사 규격서 의견 |
| 20 | `/getPublicPrcureThngOpinionInfoFrgcpt` | 외자 규격서 의견 |

### 5.3 PPSSrch 추가 파라미터

| 파라미터명 | 설명 |
|:---|:---|
| `ntceInsttNm` | 공고기관명 |
| `dminsttNm` | 수요기관명 |
| `swBizObjYn` | SW사업대상여부 (Y/N) |
| `dtilPrdctClsfcNo` | 세부품명번호 |

### 5.4 주요 응답 필드

| 필드명 | 설명 |
|:---|:---|
| `bfSpecRgstNo` | 사전규격등록번호 |
| `prdctClsfcNoNm` | 품명 |
| `orderInsttNm` | 발주기관명 |
| `rlDminsttNm` | 실수요기관명 |
| `asignBdgtAmt` | 배정예산금액 |
| `specDocFileUrl1~5` | 규격문서 파일 URL (최대 5개) |
| `rgstDt` | 등록일시 |
| `chgDt` | 변경일시 |

### 5.5 의견 응답 필드

| 필드명 | 설명 |
|:---|:---|
| `opninTitl` | 의견 제목 |
| `opninCntnts` | 의견 내용 |
| `mkngCorpNm` | 작성업체명 |
| `mkrNm` | 작성자명 |
| `specDocOpninFileUrl1~5` | 의견 첨부파일 URL (최대 5개) |

---

## 6. 에러 코드

> 4개 서비스 공통으로 사용됩니다.

| 코드 | 메시지 | 설명 |
|:---:|:---|:---|
| `00` | NORMAL SERVICE | 정상 처리 |
| `01` | APPLICATION ERROR | 애플리케이션 에러 |
| `03` | NO DATA ERROR | 데이터 없음 |
| `10` | INVALID REQUEST PARAMETER ERROR | 잘못된 요청 파라미터 |
| `11` | NO MANDATORY PARAMETER ERROR | 필수 파라미터 누락 |
| `20` | SERVICE ACCESS DENIED | 서비스 접근 거부 |
| `22` | LIMITED NUMBER OF SERVICE REQUESTS EXCEEDS | 요청 제한 횟수 초과 |
| `30` | SERVICE KEY IS NOT REGISTERED ERROR | 미등록 서비스키 |
| `31` | DEADLINE HAS EXPIRED ERROR | 활용기간 만료 |
| `99` | ETC ERROR | 기타 에러 |

---

## 7. 사용 예시

### 7.1 물품 입찰공고 목록 조회 (JSON)

```
GET http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoThng
    ?serviceKey={YOUR_SERVICE_KEY}
    &pageNo=1
    &numOfRows=10
    &inqryDiv=1
    &inqryBgnDt=202603010000
    &inqryEndDt=202603170000
    &type=json
```

### 7.2 공사 낙찰 현황 조회 (JSON)

```
GET http://apis.data.go.kr/1230000/as/ScsbidInfoService/getScsbidListSttusCnstwk
    ?serviceKey={YOUR_SERVICE_KEY}
    &pageNo=1
    &numOfRows=10
    &inqryDiv=1
    &inqryBgnDt=202603010000
    &inqryEndDt=202603170000
    &type=json
```

### 7.3 용역 계약 현황 조회 (JSON)

```
GET http://apis.data.go.kr/1230000/ao/CntrctInfoService/getCntrctInfoListServc
    ?serviceKey={YOUR_SERVICE_KEY}
    &pageNo=1
    &numOfRows=10
    &inqryDiv=1
    &inqryBgnDt=202603010000
    &inqryEndDt=202603170000
    &type=json
```

### 7.4 물품 사전규격 목록 조회 (JSON)

```
GET https://apis.data.go.kr/1230000/ao/HrcspSsstndrdInfoService/getPublicPrcureThngInfoThng
    ?serviceKey={YOUR_SERVICE_KEY}
    &pageNo=1
    &numOfRows=10
    &inqryDiv=1
    &inqryEndDt=202603170000
    &type=json
```

### 7.5 JavaScript (fetch) 예시

```javascript
const SERVICE_KEY = 'YOUR_SERVICE_KEY';
const BASE_URL = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService';

async function getBidAnnouncements() {
  const params = new URLSearchParams({
    serviceKey: SERVICE_KEY,
    pageNo: '1',
    numOfRows: '10',
    inqryDiv: '1',
    inqryBgnDt: '202603010000',
    inqryEndDt: '202603170000',
    type: 'json'
  });

  const res = await fetch(`${BASE_URL}/getBidPblancListInfoThng?${params}`);
  const data = await res.json();

  if (data.response.header.resultCode === '00') {
    const items = data.response.body.items;
    console.log(`총 ${data.response.body.totalCount}건`);
    items.forEach(item => {
      console.log(`[${item.bidNtceNo}] ${item.bidNtceNm}`);
    });
  }
}
```

---

## 참고 링크

| 서비스 | 포털 페이지 | Base URL |
|:---|:---|:---|
| 입찰공고정보 | [data.go.kr/15129394](https://www.data.go.kr/data/15129394/openapi.do) | `http://apis.data.go.kr/1230000/ad/BidPublicInfoService` |
| 낙찰정보 | [data.go.kr/15129397](https://www.data.go.kr/data/15129397/openapi.do) | `http://apis.data.go.kr/1230000/as/ScsbidInfoService` |
| 계약정보 | [data.go.kr/15129427](https://www.data.go.kr/data/15129427/openapi.do) | `http://apis.data.go.kr/1230000/ao/CntrctInfoService` |
| 사전규격정보 | [data.go.kr/15129437](https://www.data.go.kr/data/15129437/openapi.do) | `https://apis.data.go.kr/1230000/ao/HrcspSsstndrdInfoService` |
