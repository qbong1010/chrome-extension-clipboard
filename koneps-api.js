/**
 * ═══════════════════════════════════════════════════════════════════
 *  koneps-api.js — 조달청 나라장터(KONEPS) Open API 통합 모듈
 * ═══════════════════════════════════════════════════════════════════
 *
 *  공공데이터포털(data.go.kr)에서 제공하는 나라장터 4개 서비스를
 *  모듈화하여 관리합니다. 각 서비스는 업무유형(물품/용역/공사/외자)별
 *  엔드포인트를 제공합니다.
 *
 *  ┌──────────────────┬──────────────────────────────────────────────┐
 *  │ 서비스           │ 설명                                         │
 *  ├──────────────────┼──────────────────────────────────────────────┤
 *  │ bid              │ 입찰공고정보서비스 (25개 엔드포인트)            │
 *  │ award            │ 낙찰정보서비스 (23개 엔드포인트)               │
 *  │ contract         │ 계약정보서비스 (21개 엔드포인트)               │
 *  │ prespec          │ 사전규격정보서비스 (20개 엔드포인트)            │
 *  └──────────────────┴──────────────────────────────────────────────┘
 *
 *  사용법:
 *    import { KonepsAPI } from './koneps-api.js';
 *
 *    const api = new KonepsAPI(serviceKey);
 *    const result = await api.bid.getList('goods', { ... });
 */

// ─────────────────────────────────────────────────────────
//  1. 서비스별 Base URL
// ─────────────────────────────────────────────────────────

const BASE_URLS = Object.freeze({
  bid:      "http://apis.data.go.kr/1230000/ad/BidPublicInfoService",
  award:    "http://apis.data.go.kr/1230000/as/ScsbidInfoService",
  contract: "http://apis.data.go.kr/1230000/ao/CntrctInfoService",
  prespec:  "https://apis.data.go.kr/1230000/ao/HrcspSsstndrdInfoService",
});

// ─────────────────────────────────────────────────────────
//  2. 업무유형 코드 매핑
// ─────────────────────────────────────────────────────────

/**
 * 업무유형 한글-영문 매핑
 * UI에서 사용하는 한글 키 → 엔드포인트 suffix 매핑
 */
export const WORK_TYPES = Object.freeze({
  goods:        { label: "물품", suffix: "Thng" },
  service:      { label: "용역", suffix: "Servc" },
  construction: { label: "공사", suffix: "Cnstwk" },
  foreign:      { label: "외자", suffix: "Frgcpt" },
});

export const WORK_TYPE_KEYS = Object.keys(WORK_TYPES);

// ─────────────────────────────────────────────────────────
//  3. 에러 코드 정의
// ─────────────────────────────────────────────────────────

export const ERROR_CODES = Object.freeze({
  "00": "정상",
  "01": "애플리케이션 에러",
  "03": "데이터 없음",
  "10": "잘못된 요청 파라미터",
  "11": "필수 파라미터 누락",
  "20": "서비스 접근 거부",
  "22": "서비스 요청 제한 횟수 초과",
  "30": "미등록 서비스키",
  "31": "활용기간 만료",
  "99": "기타 에러",
});

// ─────────────────────────────────────────────────────────
//  4. 엔드포인트 레지스트리
// ─────────────────────────────────────────────────────────
//
//  각 서비스의 모든 엔드포인트를 카테고리별로 정리합니다.
//  `{type}` 플레이스홀더는 WORK_TYPES의 suffix로 치환됩니다.
//

/**
 * @typedef {Object} EndpointDef
 * @property {string} path         - URL 경로 (Base URL 뒤에 붙음)
 * @property {string} description  - 엔드포인트 설명
 * @property {boolean} [typed]     - true면 {type}을 업무유형 suffix로 치환
 * @property {string[]} [requiredParams] - 추가 필수 파라미터
 * @property {string[]} [optionalParams] - 추가 선택 파라미터
 */

/** 입찰공고정보서비스 엔드포인트 */
const BID_ENDPOINTS = Object.freeze({
  // ── 입찰공고 목록 ──
  getList: {
    path: "/getBidPblancListInfo{type}",
    description: "입찰공고 목록 조회",
    typed: true,
  },
  getListEtc: {
    path: "/getBidPblancListInfoEtc",
    description: "기타(조달청 외 기관) 공고 목록",
    typed: false,
  },

  // ── 기초금액 ──
  getBasisAmount: {
    path: "/getBidPblancListInfo{type}BsisAmount",
    description: "기초금액 정보 조회",
    typed: true,
    supportedTypes: ["goods", "construction", "service"],
  },

  // ── 제한/지역 ──
  getLicenseLimit: {
    path: "/getBidPblancListInfoLicenseLimit",
    description: "면허제한 정보 조회",
    typed: false,
  },
  getRegion: {
    path: "/getBidPblancListInfoPrtcptPsblRgn",
    description: "참가가능지역 정보 조회",
    typed: false,
  },

  // ── 구매대상물품 ──
  getPurchaseProduct: {
    path: "/getBidPblancListInfo{type}PurchsObjPrdct",
    description: "구매대상물품 정보 조회",
    typed: true,
    supportedTypes: ["goods", "service", "foreign"],
  },

  // ── 검색조건(PPSSrch) ──
  getListPPS: {
    path: "/getBidPblancListInfo{type}PPSSrch",
    description: "나라장터 검색조건에 의한 입찰공고 조회",
    typed: true,
  },
  getListEtcPPS: {
    path: "/getBidPblancListInfoEtcPPSSrch",
    description: "나라장터 검색조건에 의한 기타 공고 조회",
    typed: false,
  },

  // ── 변경이력 ──
  getChangeHistory: {
    path: "/getBidPblancListInfoChgHstry{type}",
    description: "입찰공고 변경이력 조회",
    typed: true,
    supportedTypes: ["goods", "service", "construction"],
  },

  // ── 기타 ──
  getInnovationFile: {
    path: "/getBidPblancListPPIFnlRfpIssAtchFileInfo",
    description: "혁신장터 최종제안요청서 첨부파일",
    typed: false,
  },
  getPriceFormula: {
    path: "/getBidPblancListBidPrceCalclAInfo",
    description: "입찰가격산식A 정보",
    typed: false,
  },
  getEvalField: {
    path: "/getBidPblancListEvaluationIndstrytyMfrcInfo",
    description: "평가대상 주력분야 정보",
    typed: false,
  },
  getEorderFile: {
    path: "/getBidPblancListInfoEorderAtchFileInfo",
    description: "e발주 첨부파일 정보",
    typed: false,
  },
});

/** 낙찰정보서비스 엔드포인트 */
const AWARD_ENDPOINTS = Object.freeze({
  // ── 낙찰자 현황 ──
  getWinnerStatus: {
    path: "/getScsbidListSttus{type}",
    description: "낙찰자 현황 조회",
    typed: true,
  },

  // ── 개찰결과 ──
  getOpeningResult: {
    path: "/getOpengResultListInfo{type}",
    description: "개찰결과 목록 조회",
    typed: true,
  },

  // ── 예비가격 상세 ──
  getReservePrice: {
    path: "/getOpengResultListInfo{type}PreparPcDetail",
    description: "예비가격 상세 조회",
    typed: true,
  },

  // ── 재입찰/유찰 ──
  getRebid: {
    path: "/getOpengResultListInfoRebid",
    description: "재입찰 목록 조회",
    typed: false,
    requiredParams: ["bidNtceNo"],
  },
  getFailed: {
    path: "/getOpengResultListInfoFailing",
    description: "유찰 목록 조회",
    typed: false,
    requiredParams: ["bidNtceNo", "bidClsfcNo"],
  },

  // ── 개찰완료 ──
  getCompleted: {
    path: "/getOpengResultListInfoOpengCompt",
    description: "개찰완료 목록 조회 (전체)",
    typed: false,
  },

  // ── 검색조건(PPSSrch) — 개찰결과 ──
  getOpeningResultPPS: {
    path: "/getOpengResultListInfo{type}PPSSrch",
    description: "나라장터 검색조건에 의한 개찰결과 조회",
    typed: true,
  },

  // ── 검색조건(PPSSrch) — 낙찰자 ──
  getWinnerStatusPPS: {
    path: "/getScsbidListSttus{type}PPSSrch",
    description: "나라장터 검색조건에 의한 낙찰자 조회",
    typed: true,
  },
});

/** 계약정보서비스 엔드포인트 */
const CONTRACT_ENDPOINTS = Object.freeze({
  // ── 계약 현황 ──
  getList: {
    path: "/getCntrctInfoList{type}",
    description: "계약 현황 조회",
    typed: true,
  },

  // ── 계약 상세 (물품/외자만) ──
  getDetail: {
    path: "/getCntrctInfoList{type}Detail",
    description: "계약 상세 조회",
    typed: true,
    supportedTypes: ["goods", "foreign"],
  },

  // ── 서비스 정보 ──
  getCnstwkServiceInfo: {
    path: "/getCntrctInfoListCnstwkServcInfo",
    description: "공사 서비스 정보 조회",
    typed: false,
  },
  getGnrlServiceInfo: {
    path: "/getCntrctInfoListGnrlServcServcInfo",
    description: "일반 용역 서비스 정보 조회",
    typed: false,
  },
  getTechServiceInfo: {
    path: "/getCntrctInfoListTechServcServcInfo",
    description: "기술 용역 서비스 정보 조회",
    typed: false,
  },

  // ── 변경이력 ──
  getChangeHistory: {
    path: "/getCntrctInfoList{type}ChgHstry",
    description: "계약 변경이력 조회",
    typed: true,
  },

  // ── 삭제이력 ──
  getDeleteHistory: {
    path: "/getCntrctInfoList{type}DltHstry",
    description: "계약 삭제이력 조회",
    typed: true,
  },

  // ── 검색조건(PPSSrch) ──
  getListPPS: {
    path: "/getCntrctInfoList{type}PPSSrch",
    description: "나라장터 검색조건에 의한 계약 조회",
    typed: true,
  },
});

/** 사전규격정보서비스 엔드포인트 */
const PRESPEC_ENDPOINTS = Object.freeze({
  // ── 사전규격 목록 ──
  getList: {
    path: "/getPublicPrcureThngInfo{type}",
    description: "사전규격 목록 조회",
    typed: true,
  },

  // ── 기관별 ──
  getByInstitution: {
    path: "/getInsttAcctoThngListInfo{type}",
    description: "기관별 사전규격 조회",
    typed: true,
  },

  // ── 품목별 상세 ──
  getProductDetail: {
    path: "/getThngDetailMetaInfo{type}",
    description: "품목별 상세 조회",
    typed: true,
  },

  // ── 검색조건(PPSSrch) ──
  getListPPS: {
    path: "/getPublicPrcureThngInfo{type}PPSSrch",
    description: "나라장터 검색조건에 의한 사전규격 조회",
    typed: true,
  },

  // ── 규격서 의견 ──
  getOpinions: {
    path: "/getPublicPrcureThngOpinionInfo{type}",
    description: "규격서 의견 목록 조회",
    typed: true,
  },
});

// ─────────────────────────────────────────────────────────
//  5. 유틸리티 함수
// ─────────────────────────────────────────────────────────

/**
 * 날짜를 API 요청 형식(YYYYMMDDHHMM)으로 변환
 * @param {Date|string} date - Date 객체 또는 'YYYY-MM-DD' 문자열
 * @param {string} [time='0000'] - 시간 (HHMM), 기본값 '0000'
 * @returns {string} YYYYMMDDHHMM 형식 문자열
 */
export function formatDateParam(date, time = "0000") {
  if (typeof date === "string") {
    // 'YYYY-MM-DD' → 'YYYYMMDD'
    return date.replace(/-/g, "") + time;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}${time}`;
}

/**
 * 금액 포맷팅 (원 단위 → 억/만 표시)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatAmount(amount) {
  const num = typeof amount === "string" ? parseInt(amount, 10) : amount;
  if (!num || isNaN(num)) return "-";

  if (num >= 100_000_000) {
    const eok = Math.floor(num / 100_000_000);
    const remainder = num % 100_000_000;
    if (remainder > 0) {
      return `${eok.toLocaleString()}억 ${remainder.toLocaleString()}원`;
    }
    return `${eok.toLocaleString()}억원`;
  }
  return `${num.toLocaleString()}원`;
}

// ─────────────────────────────────────────────────────────
//  6. API 요청 핵심 함수
// ─────────────────────────────────────────────────────────

/**
 * 엔드포인트 경로에서 {type} 플레이스홀더를 치환
 * @param {string} pathTemplate
 * @param {string} [workType] - WORK_TYPES의 키 (goods, service, etc.)
 * @returns {string}
 */
function resolveEndpointPath(pathTemplate, workType) {
  if (!pathTemplate.includes("{type}")) {
    return pathTemplate;
  }
  if (!workType || !WORK_TYPES[workType]) {
    throw new Error(`업무유형이 필요합니다: ${WORK_TYPE_KEYS.join(", ")}`);
  }
  return pathTemplate.replace("{type}", WORK_TYPES[workType].suffix);
}

/**
 * API 호출 공통 함수
 *
 * @param {Object} options
 * @param {string} options.serviceKey    - 공공데이터포털 인증키
 * @param {string} options.baseUrl       - 서비스 Base URL
 * @param {EndpointDef} options.endpoint - 엔드포인트 정의
 * @param {string} [options.workType]    - 업무유형 (typed 엔드포인트에 필수)
 * @param {Object} [options.params]      - 추가 요청 파라미터
 * @param {number} [options.pageNo=1]    - 페이지 번호
 * @param {number} [options.numOfRows=10] - 페이지당 결과 수
 * @returns {Promise<KonepsResponse>}
 */
async function callApi({
  serviceKey,
  baseUrl,
  endpoint,
  workType,
  params = {},
  pageNo = 1,
  numOfRows = 10,
}) {
  if (!serviceKey) {
    throw new KonepsError("SERVICE_KEY_MISSING", "API 키를 먼저 설정해주세요.");
  }

  // 업무유형 지원 여부 검사
  if (endpoint.typed && endpoint.supportedTypes && workType) {
    if (!endpoint.supportedTypes.includes(workType)) {
      const supported = endpoint.supportedTypes
        .map((t) => WORK_TYPES[t].label)
        .join(", ");
      throw new KonepsError(
        "UNSUPPORTED_WORK_TYPE",
        `이 기능은 ${supported}만 지원합니다.`,
      );
    }
  }

  // 필수 파라미터 검사
  if (endpoint.requiredParams) {
    for (const param of endpoint.requiredParams) {
      if (!params[param]) {
        throw new KonepsError(
          "MISSING_PARAM",
          `필수 파라미터가 누락되었습니다: ${param}`,
        );
      }
    }
  }

  const path = resolveEndpointPath(endpoint.path, workType);
  const url = new URL(`${baseUrl}${path}`);

  // 공통 파라미터
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", String(numOfRows));
  url.searchParams.set("type", "json");

  // 추가 파라미터
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new KonepsError(
      "HTTP_ERROR",
      `HTTP ${response.status}: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return parseResponse(data);
}

/**
 * API 응답 파싱 및 정규화
 * @param {Object} raw - API 원본 응답
 * @returns {KonepsResponse}
 */
function parseResponse(raw) {
  const header = raw?.response?.header;
  const body = raw?.response?.body;

  if (!header) {
    throw new KonepsError("INVALID_RESPONSE", "응답 형식이 올바르지 않습니다.");
  }

  const resultCode = header.resultCode;
  if (resultCode !== "00") {
    const message = ERROR_CODES[resultCode] || header.resultMsg || "알 수 없는 에러";
    throw new KonepsError(`API_${resultCode}`, message);
  }

  // items가 단일 객체인 경우 배열로 변환
  let items = body?.items ?? [];
  if (items && !Array.isArray(items)) {
    items = [items];
  }

  return {
    totalCount: body?.totalCount ?? 0,
    pageNo: body?.pageNo ?? 1,
    numOfRows: body?.numOfRows ?? 10,
    items,
  };
}

// ─────────────────────────────────────────────────────────
//  7. 커스텀 에러 클래스
// ─────────────────────────────────────────────────────────

export class KonepsError extends Error {
  /**
   * @param {string} code  - 에러 코드
   * @param {string} message - 에러 메시지
   */
  constructor(code, message) {
    super(message);
    this.name = "KonepsError";
    this.code = code;
  }
}

// ─────────────────────────────────────────────────────────
//  8. 서비스 클래스 팩토리
// ─────────────────────────────────────────────────────────

/**
 * 개별 서비스 래퍼 클래스
 * 엔드포인트 레지스트리를 기반으로 메서드를 자동 생성하지 않고,
 * 명시적으로 call() 메서드를 제공합니다.
 */
class KonepsService {
  /**
   * @param {string} serviceName - 서비스 식별자 (bid, award, contract, prespec)
   * @param {string} baseUrl     - 서비스 Base URL
   * @param {Object} endpoints   - 엔드포인트 레지스트리
   * @param {function} getKey    - serviceKey를 반환하는 함수
   */
  constructor(serviceName, baseUrl, endpoints, getKey) {
    this._name = serviceName;
    this._baseUrl = baseUrl;
    this._endpoints = endpoints;
    this._getKey = getKey;
  }

  /** 등록된 모든 엔드포인트 목록 조회 */
  listEndpoints() {
    return Object.entries(this._endpoints).map(([key, ep]) => ({
      key,
      path: ep.path,
      description: ep.description,
      typed: ep.typed ?? false,
      supportedTypes: ep.supportedTypes ?? (ep.typed ? WORK_TYPE_KEYS : []),
    }));
  }

  /**
   * 엔드포인트 호출
   *
   * @param {string} endpointKey - 엔드포인트 키 (예: 'getList', 'getDetail')
   * @param {Object} [options]
   * @param {string} [options.workType]    - 업무유형 키
   * @param {Object} [options.params]      - 추가 파라미터
   * @param {number} [options.pageNo]      - 페이지 번호
   * @param {number} [options.numOfRows]   - 페이지당 결과 수
   * @returns {Promise<KonepsResponse>}
   */
  async call(endpointKey, { workType, params, pageNo, numOfRows } = {}) {
    const endpoint = this._endpoints[endpointKey];
    if (!endpoint) {
      const available = Object.keys(this._endpoints).join(", ");
      throw new KonepsError(
        "UNKNOWN_ENDPOINT",
        `'${endpointKey}'은(는) 알 수 없는 엔드포인트입니다. 사용 가능: ${available}`,
      );
    }

    return callApi({
      serviceKey: this._getKey(),
      baseUrl: this._baseUrl,
      endpoint,
      workType,
      params,
      pageNo,
      numOfRows,
    });
  }
}

// ─────────────────────────────────────────────────────────
//  9. 메인 API 클래스 (진입점)
// ─────────────────────────────────────────────────────────

/**
 * 나라장터 API 통합 클래스
 *
 * @example
 *   const api = new KonepsAPI('your-service-key');
 *
 *   // 물품 입찰공고 목록 조회
 *   const result = await api.bid.call('getList', {
 *     workType: 'goods',
 *     params: { inqryDiv: '1', inqryBgnDt: '202603010000', inqryEndDt: '202603170000' },
 *     pageNo: 1,
 *     numOfRows: 10,
 *   });
 *
 *   // 공사 낙찰자 현황 조회
 *   const awards = await api.award.call('getWinnerStatus', {
 *     workType: 'construction',
 *     params: { inqryDiv: '1', inqryBgnDt: '202603010000', inqryEndDt: '202603170000' },
 *   });
 *
 *   // 사용 가능한 엔드포인트 확인
 *   console.log(api.bid.listEndpoints());
 */
export class KonepsAPI {
  /**
   * @param {string} serviceKey - 공공데이터포털 인증키
   */
  constructor(serviceKey) {
    this._serviceKey = serviceKey;
    const getKey = () => this._serviceKey;

    /** @type {KonepsService} 입찰공고정보서비스 */
    this.bid = new KonepsService("bid", BASE_URLS.bid, BID_ENDPOINTS, getKey);

    /** @type {KonepsService} 낙찰정보서비스 */
    this.award = new KonepsService("award", BASE_URLS.award, AWARD_ENDPOINTS, getKey);

    /** @type {KonepsService} 계약정보서비스 */
    this.contract = new KonepsService("contract", BASE_URLS.contract, CONTRACT_ENDPOINTS, getKey);

    /** @type {KonepsService} 사전규격정보서비스 */
    this.prespec = new KonepsService("prespec", BASE_URLS.prespec, PRESPEC_ENDPOINTS, getKey);
  }

  /** serviceKey 업데이트 */
  setServiceKey(key) {
    this._serviceKey = key;
  }
}

// ─────────────────────────────────────────────────────────
//  10. 응답 타입 정의 (JSDoc)
// ─────────────────────────────────────────────────────────

/**
 * @typedef {Object} KonepsResponse
 * @property {number} totalCount - 전체 결과 수
 * @property {number} pageNo     - 현재 페이지 번호
 * @property {number} numOfRows  - 페이지당 결과 수
 * @property {Array<Object>} items - 결과 데이터 배열
 */
