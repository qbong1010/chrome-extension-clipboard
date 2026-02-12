// DOM 요소
const userList = document.getElementById("userList");
const addBtn = document.getElementById("addBtn");
const editDlg = document.getElementById("editDlg");
const titleInput = document.getElementById("titleInput");
const bodyInput = document.getElementById("bodyInput");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const donateQrDlg = document.getElementById("donateQrDlg");
const closeDonateBtn = document.getElementById("closeDonateBtn");
const buildingSearchView = document.getElementById("buildingSearchView");

// 현재 편집 중인 템플릿 아이템의 인덱스 (새 아이템일 경우 null)
let editingIndex = null;

// 템플릿 데이터 저장용 변수
let templates = [];

// 초기 로드 함수
async function loadTemplates() {
  try {
    const { userTemplates = [] } = await chrome.storage.local.get([
      "userTemplates",
    ]);
    console.log("로드된 템플릿:", userTemplates);

    // ID가 없는 템플릿에 ID 추가
    templates = userTemplates.map((template) => {
      if (!template.id) {
        return {
          ...template,
          id:
            "tpl_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        };
      }
      return template;
    });

    // 템플릿이 비어있으면 기본 템플릿 추가
    if (templates.length === 0) {
      try {
        const response = await fetch(
          chrome.runtime.getURL("default-templates.json"),
        );
        const defaultTemplates = await response.json();
        templates = defaultTemplates;
      } catch (error) {
        console.error("기본 템플릿 로드 실패:", error);
        // 실패 시 비상용 하드코딩 (선택 사항)
        templates = [
          {
            id: "tpl_default_1",
            title: "기본 템플릿 1",
            body: "내용을 입력하세요.",
          },
        ];
      }

      // 스토리지에 저장
      await saveTemplatesData();
    }

    renderTemplates();
  } catch (err) {
    console.error("템플릿 로드 오류:", err);
  }
}

// 템플릿 데이터 저장 함수
async function saveTemplatesData() {
  try {
    console.log("저장할 템플릿:", templates);

    // userTemplates 저장
    await chrome.storage.local.set({ userTemplates: templates });

    // 백그라운드에 메뉴 갱신 요청
    chrome.runtime.sendMessage("refresh‑menus", (response) => {
      console.log("메뉴 갱신 응답:", response);
    });
  } catch (err) {
    console.error("템플릿 저장 오류:", err);
  }
}

// 템플릿 목록 렌더링 함수
function renderTemplates() {
  userList.innerHTML = "";

  templates.forEach((template, index) => {
    const listItem = document.createElement("li");
    listItem.className = "md3-list-item";
    listItem.setAttribute("draggable", "true");
    listItem.setAttribute("data-index", index);

    const clipboardBtn = document.createElement("div");
    clipboardBtn.className = "clipboard-copy";

    const clipboardIcon = document.createElement("span");
    clipboardIcon.className = "material-symbols-rounded";
    clipboardIcon.textContent = "content_copy";

    clipboardBtn.appendChild(clipboardIcon);

    // 클립보드 복사 기능 추가
    clipboardBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      copyToClipboard(template.body);
    });

    const content = document.createElement("div");
    content.className = "list-item-content";

    const title = document.createElement("span");
    title.className = "list-item-title";
    title.textContent = template.title;

    content.appendChild(title);

    const menuBtn = document.createElement("button");
    menuBtn.className = "md3-icon-button";

    const menuIcon = document.createElement("span");
    menuIcon.className = "material-symbols-rounded";
    menuIcon.textContent = "more_vert";

    menuBtn.appendChild(menuIcon);

    // 메뉴 버튼 클릭 이벤트
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      editTemplate(index);
    });

    listItem.appendChild(clipboardBtn);
    listItem.appendChild(content);
    listItem.appendChild(menuBtn);

    userList.appendChild(listItem);
  });

  // Sortable 초기화 (드래그앤드롭 기능)
  initSortable();
}

// 클립보드에 복사하는 함수
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast("클립보드에 내용이 복사되었습니다.");
    })
    .catch((err) => {
      console.error("클립보드 복사 실패:", err);
    });
}

// 토스트 메시지 표시 함수
function showToast(message) {
  // 기존 토스트가 있으면 제거
  const existingToast = document.getElementById("toast");
  if (existingToast) {
    document.body.removeChild(existingToast);
  }

  // 새 토스트 생성
  const toast = document.createElement("div");
  toast.id = "toast";
  toast.className = "md3-toast";
  toast.textContent = message;

  document.body.appendChild(toast);

  // 애니메이션 효과로 표시
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // 2초 후 사라짐
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 2000);
}

// Sortable.js 초기화 함수 수정
function initSortable() {
  new Sortable(userList, {
    animation: 150,
    handle: ".list-item-content", // drag-handle 제거하고 list-item-content만 드래그 핸들로 지정
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",

    onEnd: function (evt) {
      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;

      if (oldIndex !== newIndex) {
        const movedItem = templates.splice(oldIndex, 1)[0];
        templates.splice(newIndex, 0, movedItem);

        saveTemplatesData();
        renderTemplates();
      }
    },
  });
}

// 템플릿 편집 함수
function editTemplate(index) {
  editingIndex = index;
  const template = templates[index];

  titleInput.value = template.title;
  bodyInput.value = template.body;

  editDlg.showModal();
}

// 새 템플릿 추가 함수
function addTemplate() {
  editingIndex = null;
  titleInput.value = "";
  bodyInput.value = "";

  editDlg.showModal();
}

// 템플릿 저장 함수
async function saveTemplate() {
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title || !body) return;

  if (editingIndex !== null) {
    // 기존 템플릿 수정
    templates[editingIndex].title = title;
    templates[editingIndex].body = body;
  } else {
    // 새 템플릿 추가 (고유 ID 생성)
    const id =
      "tpl_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    templates.push({ id, title, body });
  }

  // 스토리지에 저장
  await saveTemplatesData();

  renderTemplates();
}

//---------------- 네비게이션 아이템 클릭 시 화면 전환 로직 ----------------
const navItems = document.querySelectorAll(".nav-item");
const templateManagerView = document.getElementById("templateManagerView");
const settingsView = document.getElementById("settingsView");
const addTemplateBtn = document.getElementById("addTemplateBtn");

// navItems에 순서대로: 0 -> link, 1 -> settings, 2 -> search
navItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    // 모든 nav-item에서 active 제거
    navItems.forEach((i) => i.classList.remove("active"));
    // 현재 클릭된 아이템에만 active 설정
    item.classList.add("active");

    // 화면 전환
    if (index === 0) {
      // 링크 탭 (기본 템플릿 목록)
      templateManagerView.style.display = "block";
      settingsView.style.display = "none";
      buildingSearchView.style.display = "none";
    } else if (index === 1) {
      // 설정 탭
      templateManagerView.style.display = "none";
      settingsView.style.display = "block";
      buildingSearchView.style.display = "none";
    } else if (index === 2) {
      // 검색 탭 (건축물대장 조회)
      templateManagerView.style.display = "none";
      settingsView.style.display = "none";
      buildingSearchView.style.display = "block";
    }
  });
});

// 템플릿 헤더의 추가 버튼 이벤트
addTemplateBtn.addEventListener("click", addTemplate);

// 이벤트 리스너
saveBtn.addEventListener("click", saveTemplate);
cancelBtn.addEventListener("click", () => {
  editDlg.close("cancel");
});

// 폼 제출 이벤트 처리
document.getElementById("templateForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (titleInput.value.trim() && bodyInput.value.trim()) {
    editDlg.close("save");
  }
});

// 후원하기 모달 표시 함수
function showDonateQR() {
  donateQrDlg.showModal();
}

// 이벤트 리스너 변경
addBtn.addEventListener("click", showDonateQR);
closeDonateBtn.addEventListener("click", () => {
  donateQrDlg.close();
});

// 초기 로드
document.addEventListener("DOMContentLoaded", loadTemplates);

//---------------- 건축물대장 조회 기능 ----------------
const API_KEY =
  "0432b6814606f51e00ba673c512ed8973ff859a6ed723fa5591b736c76be31fb";
const sigunguInput = document.getElementById("sigunguInput");
const bjdongInput = document.getElementById("bjdongInput");
const platGbInput = document.getElementById("platGbInput");
const bunInput = document.getElementById("bunInput");
const jiInput = document.getElementById("jiInput");
const searchBtn = document.getElementById("searchBtn");
const exampleBtn = document.getElementById("exampleBtn");
const loadingIndicator = document.getElementById("loadingIndicator");
const errorMessage = document.getElementById("errorMessage");
const resultSection = document.getElementById("resultSection");
const simpleView = document.getElementById("simpleView");
const detailView = document.getElementById("detailView");
const simpleViewBtn = document.getElementById("simpleViewBtn");
const detailViewBtn = document.getElementById("detailViewBtn");

// 주소 검색 UI 요소
const finderHeader = document.getElementById("finderHeader");
const finderToggle = document.getElementById("finderToggle");
const finderContent = document.getElementById("finderContent");
const addressSearchInput = document.getElementById("addressSearchInput");
const addressSearchBtn = document.getElementById("addressSearchBtn");
const addressSearchResults = document.getElementById("addressSearchResults");
const addressResultsList = document.getElementById("addressResultsList");
const resultsCount = document.getElementById("resultsCount");

// 주소 데이터 저장 변수
let addressData = null;

// 주소 데이터 로드 함수
async function loadAddressData() {
  if (addressData) return addressData;

  try {
    console.log("주소 데이터 로드 중...");
    const response = await fetch(chrome.runtime.getURL("address-codes.json"));
    addressData = await response.json();
    console.log(`주소 데이터 로드 완료: ${Object.keys(addressData).length}개`);
    return addressData;
  } catch (error) {
    console.error("주소 데이터 로드 실패:", error);
    throw new Error("주소 데이터를 불러올 수 없습니다");
  }
}

// 주소 검색 함수
function searchAddressByKeyword(keyword) {
  if (!addressData) {
    throw new Error("주소 데이터가 로드되지 않았습니다");
  }

  // 검색어 정리 (공백 제거, 소문자화)
  const searchKey = keyword.replace(/\s/g, "").toLowerCase();

  if (searchKey.length < 2) {
    return [];
  }

  const results = [];
  const codes = Object.keys(addressData);

  for (const code of codes) {
    const data = addressData[code];

    // searchText로 매칭 (띄어쓰기 제거된 주소)
    if (data.searchText.toLowerCase().includes(searchKey)) {
      results.push({
        code,
        ...data,
      });

      // 최대 10개까지만
      if (results.length >= 10) break;
    }
  }

  return results;
}

// 검색 결과 렌더링
function renderSearchResults(results) {
  addressResultsList.innerHTML = "";

  if (results.length === 0) {
    addressResultsList.innerHTML =
      '<li class="no-results">검색 결과가 없습니다</li>';
    resultsCount.textContent = "0개 결과";
    addressSearchResults.style.display = "block";
    return;
  }

  resultsCount.textContent = `${results.length}개 결과`;
  addressSearchResults.style.display = "block";

  results.forEach((result) => {
    const li = document.createElement("li");
    li.className = "result-item";

    li.innerHTML = `
      <div class="result-item-info">
        <div class="result-item-address">${result.fullAddress}</div>
        <div class="result-item-code">시군구: ${result.sigunguCd} | 법정동: ${result.bjdongCd}</div>
      </div>
      <button class="result-item-select" data-code="${result.code}">선택</button>
    `;

    addressResultsList.appendChild(li);
  });

  // 선택 버튼 이벤트 리스너 추가
  document.querySelectorAll(".result-item-select").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const code = e.target.getAttribute("data-code");
      selectAddressCode(code);
    });
  });
}

// 주소 선택 시 코드 자동 입력
function selectAddressCode(code) {
  const data = addressData[code];

  if (data) {
    sigunguInput.value = data.sigunguCd;
    bjdongInput.value = data.bjdongCd;

    showToast(`"${data.fullAddress}" 선택됨`);

    // 주소 찾기 섹션 접기
    finderContent.classList.add("collapsed");
    finderToggle.classList.remove("rotated");

    // 본번 입력 필드로 포커스 이동
    bunInput.focus();
  }
}

// 주소 검색 실행
async function performAddressSearch() {
  const keyword = addressSearchInput.value.trim();

  if (!keyword) {
    showToast("검색어를 입력해주세요");
    return;
  }

  try {
    // 데이터가 로드되지 않았으면 로드
    if (!addressData) {
      showToast("주소 데이터 로드 중...");
      await loadAddressData();
    }

    const results = searchAddressByKeyword(keyword);
    renderSearchResults(results);
  } catch (error) {
    console.error("검색 오류:", error);
    showToast(error.message);
  }
}

// 아코디언 토글 기능
function toggleFinder() {
  const isCollapsed = finderContent.classList.contains("collapsed");

  if (isCollapsed) {
    finderContent.classList.remove("collapsed");
    finderToggle.classList.add("rotated");
  } else {
    finderContent.classList.add("collapsed");
    finderToggle.classList.remove("rotated");
  }
}

// 예제 데이터 입력 함수
function fillExampleData() {
  sigunguInput.value = "41360";
  bjdongInput.value = "10300";
  platGbInput.value = "0";
  bunInput.value = "0685";
  jiInput.value = "0017";
  showToast("예제 데이터가 입력되었습니다");
}

// 입력값 검증 및 포맷팅
function validateAndFormatInputs() {
  const sigungu = sigunguInput.value.trim().padStart(5, "0");
  const bjdong = bjdongInput.value.trim().padStart(5, "0");
  const platGb = platGbInput.value.trim() || "0";
  const bun = bunInput.value.trim().padStart(4, "0");
  const ji = jiInput.value.trim().padStart(4, "0");

  if (!sigunguInput.value || !bjdongInput.value || !bunInput.value) {
    throw new Error(
      "필수 항목을 모두 입력해주세요 (시군구코드, 법정동코드, 본번)",
    );
  }

  if (
    sigungu.length !== 5 ||
    bjdong.length !== 5 ||
    platGb.length !== 1 ||
    bun.length !== 4 ||
    ji.length !== 4
  ) {
    throw new Error("입력값의 자릿수를 확인해주세요");
  }

  return {
    sigunguCd: sigungu,
    bjdongCd: bjdong,
    platGbCd: platGb,
    bun: bun,
    ji: ji,
  };
}

// 건축물대장 API 호출
async function getBuildingInfo(params) {
  try {
    const url = `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo?serviceKey=${API_KEY}&sigunguCd=${params.sigunguCd}&bjdongCd=${params.bjdongCd}&platGbCd=${params.platGbCd}&bun=${params.bun}&ji=${params.ji}&_type=json`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("건축물대장 API 호출 실패");
    }

    const data = await response.json();

    // API 응답 구조 확인
    if (data.response?.header?.resultCode === "00") {
      const items = data.response.body?.items?.item;

      if (items) {
        return Array.isArray(items) ? items[0] : items;
      }
    }

    throw new Error("건축물 정보를 찾을 수 없습니다");
  } catch (error) {
    console.error("건축물대장 조회 오류:", error);
    throw error;
  }
}

// 간략 보기 렌더링
function renderSimpleView(data) {
  simpleView.innerHTML = `
    <h4>${data.bldNm || "건물명 없음"}</h4>
    
    <div class="card-section">
      <h5>주소 정보</h5>
      <div class="card-info-item">
        <span class="card-info-label">지번 주소</span>
        <span class="card-info-value">${data.platPlc || "-"}</span>
      </div>
      <div class="card-info-item" style="margin-top: 8px;">
        <span class="card-info-label">도로명 주소</span>
        <span class="card-info-value">${data.newPlatPlc || "-"}</span>
      </div>
    </div>
    
    <div class="card-section">
      <h5>기본 정보</h5>
      <div class="card-info-grid">
        <div class="card-info-item">
          <span class="card-info-label">등록 구분</span>
          <span class="card-info-value">${data.regstrGbCdNm || "-"}</span>
        </div>
        <div class="card-info-item">
          <span class="card-info-label">주용도</span>
          <span class="card-info-value">${data.mainPurpsCdNm || "-"}</span>
        </div>
        <div class="card-info-item">
          <span class="card-info-label">구조</span>
          <span class="card-info-value">${data.strctCdNm || "-"}</span>
        </div>
        <div class="card-info-item">
          <span class="card-info-label">지붕</span>
          <span class="card-info-value">${data.roofCdNm || "-"}</span>
        </div>
      </div>
    </div>
    
    <div class="card-section">
      <h5>면적 및 층수</h5>
      <div class="card-info-grid">
        <div class="card-info-item">
          <span class="card-info-label">대지면적</span>
          <span class="card-info-value">${data.platArea ? data.platArea + " ㎡" : "-"}</span>
        </div>
        <div class="card-info-item">
          <span class="card-info-label">건축면적</span>
          <span class="card-info-value">${data.archArea ? data.archArea + " ㎡" : "-"}</span>
        </div>
        <div class="card-info-item">
          <span class="card-info-label">연면적</span>
          <span class="card-info-value">${data.totArea ? data.totArea + " ㎡" : "-"}</span>
        </div>
        <div class="card-info-item">
          <span class="card-info-label">건폐율</span>
          <span class="card-info-value">${data.bcRat ? data.bcRat + " %" : "-"}</span>
        </div>
        <div class="card-info-item">
          <span class="card-info-label">용적률</span>
          <span class="card-info-value">${data.vlRat ? data.vlRat + " %" : "-"}</span>
        </div>
        <div class="card-info-item">
          <span class="card-info-label">지상층수</span>
          <span class="card-info-value">${data.grndFlrCnt ? data.grndFlrCnt + " 층" : "-"}</span>
        </div>
        <div class="card-info-item">
          <span class="card-info-label">지하층수</span>
          <span class="card-info-value">${data.ugrndFlrCnt ? data.ugrndFlrCnt + " 층" : "-"}</span>
        </div>
        <div class="card-info-item">
          <span class="card-info-label">세대수</span>
          <span class="card-info-value">${data.hhldCnt ? data.hhldCnt + " 세대" : "-"}</span>
        </div>
      </div>
    </div>
    
    <div class="card-section">
      <h5>주요 일자</h5>
      <div class="card-info-grid">
        <div class="card-info-item">
          <span class="card-info-label">허가일</span>
          <span class="card-info-value">${formatDate(data.pmsDay)}</span>
        </div>
        <div class="card-info-item">
          <span class="card-info-label">착공일</span>
          <span class="card-info-value">${formatDate(data.stcnsDay)}</span>
        </div>
        <div class="card-info-item">
          <span class="card-info-label">사용승인일</span>
          <span class="card-info-value">${formatDate(data.useAprDay)}</span>
        </div>
      </div>
    </div>
  `;
}

// 상세 보기 렌더링
function renderDetailView(data) {
  // 모든 필드를 테이블로 표시
  const fieldMap = {
    platPlc: "대지위치",
    sigunguCd: "시군구코드",
    bjdongCd: "법정동코드",
    platGbCd: "대지구분코드",
    bun: "번",
    ji: "지",
    mgmBldrgstPk: "관리건축물대장PK",
    regstrGbCd: "대장구분코드",
    regstrGbCdNm: "대장구분명",
    regstrKindCd: "대장종류코드",
    regstrKindCdNm: "대장종류명",
    newPlatPlc: "도로명대지위치",
    bldNm: "건물명",
    splotNm: "특수지명",
    block: "블록",
    lot: "로트",
    bylotCnt: "외필지수",
    naRoadCd: "새주소도로코드",
    naBjdongCd: "새주소법정동코드",
    naUgrndCd: "새주소지상지하코드",
    naMainBun: "새주소본번",
    naSubBun: "새주소부번",
    dongNm: "동명칭",
    mainAtchGbCd: "주부속구분코드",
    mainAtchGbCdNm: "주부속구분명",
    platArea: "대지면적(㎡)",
    archArea: "건축면적(㎡)",
    bcRat: "건폐율(%)",
    totArea: "연면적(㎡)",
    vlRatEstmTotArea: "용적률산정연면적(㎡)",
    vlRat: "용적률(%)",
    strctCd: "구조코드",
    strctCdNm: "구조명",
    etcStrct: "기타구조",
    mainPurpsCd: "주용도코드",
    mainPurpsCdNm: "주용도명",
    etcPurps: "기타용도",
    roofCd: "지붕코드",
    roofCdNm: "지붕명",
    etcRoof: "기타지붕",
    hhldCnt: "세대수(세대)",
    fmlyCnt: "가구수(가구)",
    heit: "높이(m)",
    grndFlrCnt: "지상층수",
    ugrndFlrCnt: "지하층수",
    rideUseElvtCnt: "승용승강기수",
    emgenUseElvtCnt: "비상용승강기수",
    atchBldCnt: "부속건축물수",
    atchBldArea: "부속건축물면적(㎡)",
    totDongTotArea: "총동연면적(㎡)",
    indrMechUtcnt: "옥내기계식대수",
    indrMechArea: "옥내기계식면적(㎡)",
    oudrMechUtcnt: "옥외기계식대수",
    oudrMechArea: "옥외기계식면적(㎡)",
    indrAutoUtcnt: "옥내자주식대수",
    indrAutoArea: "옥내자주식면적(㎡)",
    oudrAutoUtcnt: "옥외자주식대수",
    oudrAutoArea: "옥외자주식면적(㎡)",
    pmsDay: "허가일",
    stcnsDay: "착공일",
    useAprDay: "사용승인일",
    pmsnoYear: "허가번호년",
    pmsnoKikCd: "허가번호기관코드",
    pmsnoKikCdNm: "허가번호기관명",
    pmsnoGbCd: "허가번호구분코드",
    pmsnoGbCdNm: "허가번호구분명",
    hoCnt: "호수(호)",
    engrGrade: "에너지효율등급",
    engrRat: "에너지절감율",
    engrEpi: "EPI점수",
    gnBldGrade: "친환경건축물등급",
    gnBldCert: "친환경건축물인증점수",
    itgBldGrade: "지능형건축물등급",
    itgBldCert: "지능형건축물인증점수",
    crtnDay: "생성일자",
    rserthqkDsgnApplyYn: "내진설계적용여부",
    rserthqkAblty: "내진능력",
  };

  let tableHtml =
    "<table><thead><tr><th>항목</th><th>값</th></tr></thead><tbody>";

  for (const [key, label] of Object.entries(fieldMap)) {
    let value = data[key];

    // 날짜 필드 포맷팅
    if (key.includes("Day") && value) {
      value = formatDate(value);
    }

    // 값이 없거나 공백인 경우 처리
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === " "
    ) {
      value = "-";
    }

    tableHtml += `<tr><td>${label}</td><td>${value}</td></tr>`;
  }

  tableHtml += "</tbody></table>";
  detailView.innerHTML = tableHtml;
}

// 날짜 포맷팅 함수 (YYYYMMDD -> YYYY-MM-DD)
function formatDate(dateStr) {
  if (!dateStr || dateStr === " ") return "-";

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  return `${year}-${month}-${day}`;
}

// 검색 버튼 클릭 이벤트
searchBtn.addEventListener("click", async () => {
  // UI 초기화
  loadingIndicator.style.display = "flex";
  errorMessage.style.display = "none";
  resultSection.style.display = "none";

  try {
    // 1. 입력값 검증 및 포맷팅
    const params = validateAndFormatInputs();
    console.log("입력 파라미터:", params);

    // 2. 건축물대장 조회
    const buildingData = await getBuildingInfo(params);
    console.log("건축물 정보:", buildingData);

    // 3. 결과 렌더링
    renderSimpleView(buildingData);
    renderDetailView(buildingData);

    // UI 업데이트
    loadingIndicator.style.display = "none";
    resultSection.style.display = "block";
  } catch (error) {
    console.error("조회 오류:", error);
    loadingIndicator.style.display = "none";
    errorMessage.textContent = error.message || "조회 중 오류가 발생했습니다";
    errorMessage.style.display = "block";
  }
});

// 뷰 전환 버튼 이벤트
simpleViewBtn.addEventListener("click", () => {
  simpleView.style.display = "block";
  detailView.style.display = "none";
  simpleViewBtn.classList.add("active");
  detailViewBtn.classList.remove("active");
});

detailViewBtn.addEventListener("click", () => {
  simpleView.style.display = "none";
  detailView.style.display = "block";
  simpleViewBtn.classList.remove("active");
  detailViewBtn.classList.add("active");
});

// Enter 키로 검색
[sigunguInput, bjdongInput, platGbInput, bunInput, jiInput].forEach((input) => {
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchBtn.click();
    }
  });
});

// 예제 버튼 이벤트
exampleBtn.addEventListener("click", fillExampleData);

// 주소 검색 이벤트
addressSearchBtn.addEventListener("click", performAddressSearch);
addressSearchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    performAddressSearch();
  }
});

// 아코디언 토글 이벤트
finderHeader.addEventListener("click", toggleFinder);
