import {
  DEFAULT_SETTINGS,
  getActiveTemplateStorageArea,
  getExtensionSettings,
  getSyncQuotaDetails,
  getTemplatesFromStorage,
  migrateTemplatesToStorageArea,
  resolveAppliedTheme,
  saveExtensionSettings,
  saveTemplatesToStorage,
} from "./storage-utils.js";
import {
  applyAddressSelection,
  createAddressFinderMarkup,
  searchAddressByKeyword,
} from "./building-code-lookup.js";
import {
  KonepsAPI,
  WORK_TYPES,
  formatDateParam,
  formatAmount,
  KonepsError,
} from "./koneps-api.js";

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
const legalDongCodeView = document.getElementById("legalDongCodeView");
const codeLookupDlg = document.getElementById("codeLookupDlg");
const closeCodeLookupBtn = document.getElementById("closeCodeLookupBtn");
const openCodeLookupBtn = document.getElementById("openCodeLookupBtn");
const legalDongFinderMount = document.getElementById("legalDongFinderMount");
const codeLookupFinderMount = document.getElementById("codeLookupFinderMount");

// 현재 편집 중인 템플릿 아이템의 인덱스 (새 아이템일 경우 null)
let editingIndex = null;

// 템플릿 데이터 저장용 변수
let templates = [];

let extensionSettings = { ...DEFAULT_SETTINGS };
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

const themeSelect = document.getElementById("themeSelect");
const storageTypeSelect = document.getElementById("storageTypeSelect");
const buildingApiKeyInput = document.getElementById("buildingApiKeyInput");
const saveBuildingApiKeyBtn = document.getElementById("saveBuildingApiKeyBtn");
const syncUsage = document.getElementById("syncUsage");
const syncQuota = document.getElementById("syncQuota");
const clipboardWriteRadios = document.querySelectorAll(
  'input[name="clipboardWrite"]',
);

async function refreshMenus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage("refresh‑menus", (response) => {
      console.log("메뉴 갱신 응답:", response);
      resolve(response);
    });
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function applyTheme() {
  const theme = resolveAppliedTheme(extensionSettings.theme, systemThemeQuery.matches);
  document.documentElement.dataset.theme = theme;
}

function syncSettingsControls() {
  themeSelect.value = extensionSettings.theme;
  storageTypeSelect.value = extensionSettings.templateStorageArea;
  buildingApiKeyInput.value = extensionSettings.buildingApiKey;

  const konepsInput = document.getElementById("konepsApiKeyInput");
  if (konepsInput) {
    konepsInput.value = extensionSettings.konepsApiKey || "";
  }

  clipboardWriteRadios.forEach((radio) => {
    radio.checked =
      (extensionSettings.clipboardWriteEnabled && radio.value === "allow") ||
      (!extensionSettings.clipboardWriteEnabled && radio.value === "deny");
  });
}

async function updateSyncUsage() {
  const [usedBytes, quotaDetails] = await Promise.all([
    chrome.storage.sync.getBytesInUse(null),
    Promise.resolve(getSyncQuotaDetails()),
  ]);

  syncUsage.textContent = formatBytes(usedBytes);
  syncQuota.textContent = formatBytes(quotaDetails.totalBytes);
}

async function initializeSettings() {
  extensionSettings = await getExtensionSettings();
  syncSettingsControls();
  applyTheme();
  await updateSyncUsage();
}

async function handleThemeChange(event) {
  extensionSettings = await saveExtensionSettings({ theme: event.target.value });
  applyTheme();
  showToast("테마 설정이 저장되었습니다.");
}

async function handleClipboardWriteChange(event) {
  extensionSettings = await saveExtensionSettings({
    clipboardWriteEnabled: event.target.value === "allow",
  });
  syncSettingsControls();
  showToast(
    extensionSettings.clipboardWriteEnabled
      ? "클립보드 복사가 다시 허용되었습니다."
      : "클립보드 복사가 차단되었습니다.",
  );
}

async function handleBuildingApiKeySave() {
  extensionSettings = await saveExtensionSettings({
    buildingApiKey: buildingApiKeyInput.value,
  });
  syncSettingsControls();
  showToast(
    extensionSettings.buildingApiKey
      ? "건축물대장 API 키가 저장되었습니다."
      : "건축물대장 API 키가 제거되었습니다.",
  );
}

async function handleStorageTypeChange(event) {
  const nextStorageType = event.target.value;
  const previousStorageType = extensionSettings.templateStorageArea;

  if (nextStorageType === previousStorageType) {
    return;
  }

  storageTypeSelect.disabled = true;

  try {
    const result = await migrateTemplatesToStorageArea(nextStorageType);
    extensionSettings = result.settings;
    templates = result.migratedTemplates;
    renderTemplates();
    await updateSyncUsage();
    await refreshMenus();
    showToast(
      nextStorageType === "sync"
        ? "템플릿 저장소를 동기화로 변경했습니다."
        : "템플릿 저장소를 로컬로 변경했습니다.",
    );
  } catch (error) {
    storageTypeSelect.value = previousStorageType;
    showToast(error.message || "저장소 전환에 실패했습니다.");
  } finally {
    storageTypeSelect.disabled = false;
  }
}

function bindSettingsEvents() {
  themeSelect.addEventListener("change", handleThemeChange);
  storageTypeSelect.addEventListener("change", handleStorageTypeChange);
  saveBuildingApiKeyBtn.addEventListener("click", handleBuildingApiKeySave);
  buildingApiKeyInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleBuildingApiKeySave();
    }
  });
  clipboardWriteRadios.forEach((radio) => {
    radio.addEventListener("change", handleClipboardWriteChange);
  });

  systemThemeQuery.addEventListener("change", () => {
    if (extensionSettings.theme === "system") {
      applyTheme();
    }
  });
}

// 초기 로드 함수
async function loadTemplates() {
  try {
    const storageArea = await getActiveTemplateStorageArea();
    const userTemplates = await getTemplatesFromStorage(storageArea);
    console.log("로드된 템플릿:", userTemplates, storageArea);
    let hasGeneratedMissingIds = false;

    // ID가 없는 템플릿에 ID 추가
    templates = userTemplates.map((template) => {
      if (!template.id) {
        hasGeneratedMissingIds = true;
        return {
          ...template,
          id:
            "tpl_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        };
      }
      return template;
    });

    if (hasGeneratedMissingIds) {
      await saveTemplatesData();
    }

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
  console.log("저장할 템플릿:", templates);

  const storageArea = await getActiveTemplateStorageArea();
  await saveTemplatesToStorage(storageArea, templates);
  await updateSyncUsage();
  await refreshMenus();
}


// 템플릿 목록 렌더링 함수
function renderTemplates() {
  userList.innerHTML = "";

  templates.forEach((template, index) => {
    const listItem = document.createElement("li");
    listItem.className = "list-item";
    listItem.setAttribute("draggable", "true");
    listItem.setAttribute("data-index", index);

    const clipboardBtn = document.createElement("div");
    clipboardBtn.className = "btn-icon clipboard-copy";

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
    menuBtn.className = "btn-icon";

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
  if (!extensionSettings.clipboardWriteEnabled) {
    showToast("설정에서 클립보드 복사가 차단되어 있습니다.");
    return;
  }

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
  toast.className = "toast-message";
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
    animation: 200,
    handle: ".list-item-content", // drag-handle 제거하고 list-item-content만 드래그 핸들로 지정
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",

    onEnd: function (evt) {
      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;

      if (oldIndex !== newIndex) {
        const previousTemplates = templates.map((template) => ({ ...template }));
        const movedItem = templates.splice(oldIndex, 1)[0];
        templates.splice(newIndex, 0, movedItem);

        saveTemplatesData()
          .then(() => {
            renderTemplates();
          })
          .catch((error) => {
            templates = previousTemplates;
            renderTemplates();
            console.error("템플릿 순서 저장 오류:", error);
            showToast(error.message || "템플릿 순서 저장에 실패했습니다.");
          });
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
  const previousTemplates = templates.map((template) => ({ ...template }));
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
  try {
    await saveTemplatesData();
  } catch (error) {
    templates = previousTemplates;
    console.error("템플릿 저장 오류:", error);
    showToast(error.message || "템플릿 저장에 실패했습니다.");
    return;
  }

  renderTemplates();
}

//---------------- 네비게이션 아이템 클릭 시 화면 전환 로직 ----------------
const navItems = document.querySelectorAll(".nav-item");
const templateManagerView = document.getElementById("templateManagerView");
const settingsView = document.getElementById("settingsView");
const addTemplateBtn = document.getElementById("addTemplateBtn");
const konepsSearchView = document.getElementById("konepsSearchView");
const viewMap = {
  templateManagerView,
  settingsView,
  buildingSearchView,
  legalDongCodeView,
  konepsSearchView,
};

function showView(viewId) {
  Object.entries(viewMap).forEach(([key, view]) => {
    view.style.display = key === viewId ? "flex" : "none";
  });

  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.viewTarget === viewId);
  });
}

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    showView(item.dataset.viewTarget);
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
document.addEventListener("DOMContentLoaded", async () => {
  initializeAddressFinder({
    mount: legalDongFinderMount,
    focusBunInput: false,
  });
  initializeAddressFinder({
    mount: codeLookupFinderMount,
    focusBunInput: true,
    closeDialogOnSelect: true,
  });
  bindCodeLookupDialogEvents();
  showView("templateManagerView");
  await initializeSettings();
  bindSettingsEvents();
  initKoneps();
  await loadTemplates();
});

//---------------- 건축물대장 조회 기능 ----------------
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

// 주소 데이터 저장 변수
let addressData = null;
let lastCodeLookupTrigger = null;

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

function queryAddressFinderElements(mount) {
  return {
    input: mount.querySelector('[data-role="address-search-input"]'),
    button: mount.querySelector('[data-role="address-search-button"]'),
    results: mount.querySelector('[data-role="address-search-results"]'),
    count: mount.querySelector('[data-role="results-count"]'),
    list: mount.querySelector('[data-role="address-results-list"]'),
  };
}

function renderSearchResults({ elements, results, handleSelect }) {
  elements.list.innerHTML = "";

  if (results.length === 0) {
    elements.list.innerHTML = '<li class="no-results">검색 결과가 없습니다</li>';
    elements.count.textContent = "0개 결과";
    elements.results.style.display = "block";
    return;
  }

  elements.count.textContent = `${results.length}개 결과`;
  elements.results.style.display = "block";

  results.forEach((result) => {
    const li = document.createElement("li");
    li.className = "result-item";

    const selectButton = document.createElement("button");
    selectButton.className = "result-item-select";
    selectButton.type = "button";
    selectButton.textContent = "선택";
    selectButton.addEventListener("click", () => {
      handleSelect(result.code);
    });

    li.innerHTML = `
      <div class="result-item-info">
        <div class="result-item-address">${result.fullAddress}</div>
        <div class="result-item-code">시군구: ${result.sigunguCd} | 법정동: ${result.bjdongCd}</div>
      </div>
    `;

    li.appendChild(selectButton);
    elements.list.appendChild(li);
  });
}

function handleAddressSelection({ code, focusBunInput, closeDialogOnSelect }) {
  const shouldFocusImmediately =
    focusBunInput && !(closeDialogOnSelect && codeLookupDlg.open);

  const data = applyAddressSelection({
    addressData,
    code,
    sigunguInput,
    bjdongInput,
    bunInput,
    focusBunInput: shouldFocusImmediately,
  });

  if (!data) {
    return;
  }

  showToast(`"${data.fullAddress}" 선택됨`);

  if (closeDialogOnSelect && codeLookupDlg.open) {
    codeLookupDlg.close("select");
  }
}

function initializeAddressFinder({
  mount,
  focusBunInput,
  closeDialogOnSelect = false,
}) {
  mount.innerHTML = createAddressFinderMarkup();

  const elements = queryAddressFinderElements(mount);

  async function performSearch() {
    const keyword = elements.input.value.trim();

    if (!keyword) {
      showToast("검색어를 입력해주세요");
      return;
    }

    try {
      if (!addressData) {
        showToast("주소 데이터 로드 중...");
        await loadAddressData();
      }

      const results = searchAddressByKeyword(addressData, keyword);
      renderSearchResults({
        elements,
        results,
        handleSelect: (code) =>
          handleAddressSelection({
            code,
            focusBunInput,
            closeDialogOnSelect,
          }),
      });
    } catch (error) {
      console.error("검색 오류:", error);
      showToast(error.message);
    }
  }

  elements.button.addEventListener("click", performSearch);
  elements.input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      performSearch();
    }
  });
}

function bindCodeLookupDialogEvents() {
  openCodeLookupBtn.addEventListener("click", () => {
    lastCodeLookupTrigger = openCodeLookupBtn;
    codeLookupDlg.showModal();
  });

  closeCodeLookupBtn.addEventListener("click", () => {
    codeLookupDlg.close("cancel");
  });

  codeLookupDlg.addEventListener("close", () => {
    if (codeLookupDlg.returnValue === "select") {
      requestAnimationFrame(() => {
        bunInput.focus();
      });
    } else if (lastCodeLookupTrigger) {
      lastCodeLookupTrigger.focus();
    }

    lastCodeLookupTrigger = null;
  });

  codeLookupDlg.addEventListener("click", (event) => {
    const dialogRect = codeLookupDlg.getBoundingClientRect();
    const isBackdropClick =
      event.clientX < dialogRect.left ||
      event.clientX > dialogRect.right ||
      event.clientY < dialogRect.top ||
      event.clientY > dialogRect.bottom;

    if (isBackdropClick) {
      codeLookupDlg.close("dismiss");
    }
  });
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
    const apiKey = extensionSettings.buildingApiKey?.trim();

    if (!apiKey) {
      throw new Error("API 키를 먼저 설정해주세요");
    }

    const url = `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo?serviceKey=${apiKey}&sigunguCd=${params.sigunguCd}&bjdongCd=${params.bjdongCd}&platGbCd=${params.platGbCd}&bun=${params.bun}&ji=${params.ji}&_type=json`;

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

//---------------- 나라장터 조회 기능 ----------------

let konepsApi = null;
let konepsCurrentService = "bid";
let konepsCurrentPage = 1;
const KONEPS_PAGE_SIZE = 10;

const konepsElements = {
  tabs: document.querySelectorAll(".koneps-tab"),
  workType: document.getElementById("konepsWorkType"),
  startDate: document.getElementById("konepsStartDate"),
  endDate: document.getElementById("konepsEndDate"),
  keyword: document.getElementById("konepsKeyword"),
  searchBtn: document.getElementById("konepsSearchBtn"),
  loading: document.getElementById("konepsLoading"),
  error: document.getElementById("konepsError"),
  results: document.getElementById("konepsResults"),
  resultCount: document.getElementById("konepsResultCount"),
  pageInfo: document.getElementById("konepsPageInfo"),
  resultList: document.getElementById("konepsResultList"),
  pagination: document.getElementById("konepsPagination"),
  empty: document.getElementById("konepsEmpty"),
  apiKeyInput: document.getElementById("konepsApiKeyInput"),
  saveApiKeyBtn: document.getElementById("saveKonepsApiKeyBtn"),
};

function initKoneps() {
  // 기본 날짜 설정 (최근 7일)
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  konepsElements.endDate.value = toDateInputValue(today);
  konepsElements.startDate.value = toDateInputValue(weekAgo);

  // API 인스턴스 생성
  if (extensionSettings.konepsApiKey) {
    konepsApi = new KonepsAPI(extensionSettings.konepsApiKey);
  }

  // 탭 이벤트
  konepsElements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      konepsCurrentService = tab.dataset.service;
      konepsElements.tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  // 검색 버튼
  konepsElements.searchBtn.addEventListener("click", () => {
    konepsCurrentPage = 1;
    executeKonepsSearch();
  });

  // Enter 키 검색
  konepsElements.keyword.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      konepsCurrentPage = 1;
      executeKonepsSearch();
    }
  });

  // API 키 저장 이벤트
  konepsElements.saveApiKeyBtn.addEventListener("click", handleKonepsApiKeySave);
  konepsElements.apiKeyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleKonepsApiKeySave();
    }
  });
}

function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function handleKonepsApiKeySave() {
  extensionSettings = await saveExtensionSettings({
    konepsApiKey: konepsElements.apiKeyInput.value,
  });

  if (extensionSettings.konepsApiKey) {
    konepsApi = new KonepsAPI(extensionSettings.konepsApiKey);
    showToast("나라장터 API 키가 저장되었습니다.");
  } else {
    konepsApi = null;
    showToast("나라장터 API 키가 제거되었습니다.");
  }
}

function showKonepsState(state) {
  konepsElements.loading.style.display = state === "loading" ? "flex" : "none";
  konepsElements.error.style.display = state === "error" ? "block" : "none";
  konepsElements.results.style.display = state === "results" ? "block" : "none";
  konepsElements.empty.style.display = state === "empty" ? "flex" : "none";
}

async function executeKonepsSearch() {
  if (!konepsApi) {
    if (!extensionSettings.konepsApiKey) {
      showToast("설정에서 나라장터 API 키를 먼저 등록해주세요.");
      return;
    }
    konepsApi = new KonepsAPI(extensionSettings.konepsApiKey);
  }

  const startDate = konepsElements.startDate.value;
  const endDate = konepsElements.endDate.value;

  if (!startDate || !endDate) {
    showToast("조회 기간을 선택해주세요.");
    return;
  }

  showKonepsState("loading");

  const service = konepsApi[konepsCurrentService];
  const workType = konepsElements.workType.value;
  const keywordValue = konepsElements.keyword.value.trim();
  const hasKeyword = keywordValue.length > 0;
  const endpointKey = resolveKonepsEndpoint(konepsCurrentService, hasKeyword);

  try {
    const fieldMap = getKonepsFieldMap(konepsCurrentService);
    const queryParams = {
      inqryDiv: "1",
      inqryBgnDt: formatDateParam(startDate, "0000"),
      inqryEndDt: formatDateParam(endDate, "2359"),
    };

    if (hasKeyword) {
      const isNumberPattern = /^[0-9\-]+$/.test(keywordValue);
      if (isNumberPattern) {
        queryParams[fieldMap.no] = keywordValue;
      } else {
        queryParams[fieldMap.title] = keywordValue;
      }
    }

    const result = await service.call(endpointKey, {
      workType,
      params: queryParams,
      pageNo: konepsCurrentPage,
      numOfRows: KONEPS_PAGE_SIZE,
    });

    if (result.items.length === 0 && result.totalCount === 0) {
      showKonepsState("empty");
      konepsElements.empty.querySelector("p").textContent = "검색 결과가 없습니다";
      return;
    }

    renderKonepsResults(result);
    showKonepsState("results");
  } catch (error) {
    console.error("나라장터 조회 오류:", error);
    konepsElements.error.textContent =
      error instanceof KonepsError
        ? `[${error.code}] ${error.message}`
        : error.message || "조회 중 오류가 발생했습니다.";
    showKonepsState("error");
  }
}

function resolveKonepsEndpoint(service, hasKeyword = false) {
  if (hasKeyword) {
    switch (service) {
      case "bid":      return "getListPPS";
      case "award":    return "getWinnerStatusPPS";
      case "contract": return "getListPPS";
      case "prespec":  return "getListPPS";
      default:         return "getListPPS";
    }
  }
  switch (service) {
    case "bid":      return "getList";
    case "award":    return "getWinnerStatus";
    case "contract": return "getList";
    case "prespec":  return "getList";
    default:         return "getList";
  }
}

function renderKonepsResults(result) {
  const totalPages = Math.ceil(result.totalCount / KONEPS_PAGE_SIZE);
  konepsElements.resultCount.textContent = `${result.totalCount.toLocaleString()}건`;
  konepsElements.pageInfo.textContent = `${konepsCurrentPage} / ${totalPages} 페이지`;

  konepsElements.resultList.innerHTML = "";

  const fieldMap = getKonepsFieldMap(konepsCurrentService);

  result.items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "koneps-result-card";
    
    // 입찰공고(bid)일 경우에만 확장 가능하도록 처리
    const isBid = konepsCurrentService === "bid";
    if (isBid) {
      card.classList.add("expandable");
    }

    const no = item[fieldMap.no] || "";
    const title = item[fieldMap.title] || "제목 없음";
    const org = item[fieldMap.org] || "";
    const date = item[fieldMap.date] || "";
    const amount = item[fieldMap.amount];
    const serviceLabel = getServiceLabel(konepsCurrentService);

    let html = `
      <div class="koneps-card-header">
        <span class="koneps-card-no">${escapeHtml(no)}</span>
        <span class="koneps-card-badge ${konepsCurrentService}">${serviceLabel}</span>
      </div>
      <div class="koneps-card-title">${escapeHtml(title)}</div>
      <div class="koneps-card-meta">
        <div class="koneps-card-meta-item">
          <span class="material-symbols-rounded">apartment</span>
          <span>${escapeHtml(org)}</span>
        </div>
        <div class="koneps-card-meta-item">
          <span class="material-symbols-rounded">calendar_today</span>
          <span>${escapeHtml(formatKonepsDate(date))}</span>
        </div>
      </div>
      <div class="koneps-card-footer">
        ${amount ? `<span class="koneps-card-amount">${formatAmount(amount)}</span>` : `<span></span>`}
        <button class="koneps-card-copy" data-copy="${escapeAttr(title + "\n" + no)}">
          <span class="material-symbols-rounded">content_copy</span>
          복사
        </button>
      </div>
    `;

    if (isBid) {
      html += `
        <div class="koneps-card-detail" id="detail-${no}">
          <div class="koneps-detail-loader">
            <div class="spinner" style="width:20px; height:20px; border-width:2px;"></div>
            <span>상세정보를 불러오는 중입니다...</span>
          </div>
        </div>
        <div class="koneps-expand-indicator">
          <span class="material-symbols-rounded">expand_more</span>
        </div>
      `;
    }

    card.innerHTML = html;

    // 복사 버튼 이벤트
    const copyBtn = card.querySelector(".koneps-card-copy");
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      copyToClipboard(copyBtn.dataset.copy);
    });

    if (isBid) {
      const detailContainer = card.querySelector(`#detail-${no}`);
      let detailLoaded = false;

      card.addEventListener("click", async (e) => {
        // 기본 클릭 방어 로직: a 태그(다운로드/원문 등) 또는 복사 버튼 등을 눌렀을 땐 확장/축소 동작 막기
        if (e.target.closest("a") || e.target.closest("button")) {
          return;
        }
        
        const isExpanded = card.classList.toggle("expanded");
        if (isExpanded && !detailLoaded) {
          detailLoaded = true;
          try {
            await loadKonepsDetail(no, item, detailContainer);
          } catch (error) {
            detailContainer.innerHTML = `<div class="error-box" style="margin:0;">상세정보를 불러오지 못했습니다. (${error.message})</div>`;
            detailLoaded = false;
          }
        }
      });
    }

    konepsElements.resultList.appendChild(card);
  });

  // 페이지네이션 렌더링
  renderKonepsPagination(totalPages);
}

async function loadKonepsDetail(bidNtceNo, mainItem, containerElement) {
  // 병렬로 기초금액, 참가가능지역 등 추가 정보 조회
  const service = konepsApi.bid;
  const workType = konepsElements.workType.value;
  
  const additionalData = {
    basisAmount: null,
    region: null,
  };

  try {
    const promises = [];
    
    // 기초금액 조회 (지원되는 경우)
    if (["goods", "construction", "service"].includes(workType)) {
      promises.push(
        service.call("getBasisAmount", { workType, params: { bidNtceNo } })
          .then(res => additionalData.basisAmount = res.items[0])
          .catch(e => console.warn("기초금액 조회 실패:", e))
      );
    }
    
    // 참가가능지역 (공통)
    promises.push(
      service.call("getRegion", { params: { bidNtceNo } })
        .then(res => additionalData.region = res.items[0])
        .catch(e => console.warn("참가가능지역 조회 실패:", e))
    );

    await Promise.all(promises);
    
    renderKonepsCardDetail(mainItem, additionalData, containerElement);
  } catch (error) {
    throw error;
  }
}

function renderKonepsCardDetail(main, ext, container) {
  const dtlUrl = main.bidNtceDtlUrl || "";
  
  // 1. 공고 일반
  const generalFields = [
    { label: "게시일시", value: formatKonepsDate(main.bidNtceDt) },
    { label: "참조번호", value: main.refNo },
    { label: "입찰방식", value: main.bidMethdNm },
    { label: "낙찰방법", value: main.sucsfbidMthdNm },
    { label: "낙찰방법세부기준", value: main.sucsfbidMthdCdNm || "-" },
    { label: "계약방법", value: main.cntrctMethdNm },
    { label: "국제입찰구분", value: main.intnlBidYn === "Y" ? "국제입찰" : "국내입찰" },
    { label: "재입찰여부", value: main.rbidPermitYn === "Y" ? "허용" : "불가" },
  ];

  // 2. 가격 관련
  const priceFields = [
    { label: "추정가격", value: main.presmptPrce ? formatAmount(main.presmptPrce) : "-" },
    { label: "배정예산", value: main.asignBdgtAmt ? formatAmount(main.asignBdgtAmt) : "-" },
  ];
  if (ext.basisAmount) {
    priceFields.push({ label: "기초금액", value: ext.basisAmount.bsisAmount ? formatAmount(ext.basisAmount.bsisAmount) : "-" });
  }

  // 3. 자격 관련
  const qualFields = [
    { label: "공동수급", value: main.indstrytyLmtYn === "Y" ? "제한" : "제한없음" }
  ];
  if (ext.region) {
    qualFields.push({ label: "지역제한", value: ext.region.prtcptPsblRgnNm || "-" });
  }

  // 4. 일정 및 개찰 정보
  const scheduleFields = [
    { label: "입찰서접수개시", value: formatKonepsDate(main.bidBeginDt) },
    { label: "입찰서접수마감", value: formatKonepsDate(main.bidEndDt) },
    { label: "개찰(입찰)일시", value: formatKonepsDate(main.opengDt) },
    { label: "개찰장소", value: main.opengPlce },
  ];

  // 5. 담당자 정보
  const managerFields = [
    { label: "공고기관", value: main.ntceInsttNm },
    { label: "수요기관", value: main.dminsttNm || main.ntceInsttNm },
    { label: "담당자명", value: main.ntcedtlPrvnmNm || main.chrgptpnNm },
    { label: "연락처", value: main.ntcedtlPrvnmTelno || "-" },
  ];

  // 6. 입찰참가자격 (긴 텍스트)
  const qualificationText = main.bidPrtcptQualfcnCn || main.indstrytyLmtYn === "Y" ? "공고서 참조 (제한 있음)" : "제한 없음";

  const createTable = (rows) => {
    let rowsHtml = "";
    // 2단 배열
    for (let i = 0; i < rows.length; i += 2) {
      const row1 = rows[i];
      const row2 = rows[i+1];
      rowsHtml += `<tr>
        <th style="width: 20%;">${escapeHtml(row1.label)}</th>
        <td style="width: 30%;">${escapeHtml(row1.value || "-")}</td>
        <th style="width: 20%;">${row2 ? escapeHtml(row2.label) : ""}</th>
        <td style="width: 30%;">${row2 ? escapeHtml(row2.value || "-") : ""}</td>
      </tr>`;
    }
    return `<table class="koneps-detail-table"><tbody>${rowsHtml}</tbody></table>`;
  };

  // 5. 첨부파일 추출 로직 (동적 개선)
  const files = [];
  const urlKeys = Object.keys(main).filter(k => 
    k.toLowerCase().includes('url') && 
    main[k] && 
    typeof main[k] === 'string' && 
    main[k].startsWith('http') &&
    k !== 'bidNtceDtlUrl' && 
    k !== 'bidNtceUrl'
  );

  urlKeys.forEach(urlKey => {
    const urlValue = main[urlKey];
    
    // URL 키명에서 번호 추출 (예: ntceSpecDocUrl1 -> 1)
    const match = urlKey.match(/\d+$/);
    const num = match ? match[0] : "";
    
    // 같은 번호로 끝나는 'Nm'(이름) 관련 키 찾기 (예: ntceSpecFileNm1)
    let fileNm = "첨부파일 다운로드";
    if (num) {
      const nameKey = Object.keys(main).find(k => k.toLowerCase().includes('nm') && k.endsWith(num) && k.toLowerCase().includes('file'));
      if (nameKey) fileNm = main[nameKey];
    } else {
      // 번호가 없는 경우 가장 유사한 이름 키를 찾음 (예: docUrl -> docNm, fileUrl -> fileNm)
      const possibleNameKey = urlKey.replace(/url/i, 'Nm');
      if (main[possibleNameKey]) fileNm = main[possibleNameKey];
    }
    
    files.push({ url: urlValue, name: fileNm });
  });

  // 하드코딩된 일반적인 파일 확장 키명 폴백 처리
  for (let i = 1; i <= 10; i++) {
    const fallbackUrl = main[`ntceSpecDocUrl${i}`] || main[`ntceSpecFileUrl${i}`];
    const fallbackNm = main[`ntceSpecFileNm${i}`] || `첨부파일 ${i}`;
    
    if (fallbackUrl && fallbackUrl.startsWith('http')) {
      // 이미 추가되지 않았다면 추가
      if (!files.find(f => f.url === fallbackUrl)) {
        files.push({ url: fallbackUrl, name: fallbackNm });
      }
    }
  }

  const uniqueFiles = files.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);

  let filesHtml = "";
  if (uniqueFiles.length > 0) {
    filesHtml = `
      <div class="koneps-detail-section">
        <h5><span class="material-symbols-rounded">attach_file</span> 첨부파일 (${uniqueFiles.length}건)</h5>
        <div class="koneps-file-list">
          ${uniqueFiles.map(f => `
            <a href="${escapeAttr(f.url)}" target="_blank" rel="noreferrer" class="koneps-file-link">
              <span class="material-symbols-rounded">download</span>
              ${escapeHtml(f.name)}
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="koneps-detail-section">
      <h5><span class="material-symbols-rounded">article</span> 공고 일반</h5>
      ${createTable(generalFields)}
    </div>
    
    <div class="koneps-detail-section">
      <h5><span class="material-symbols-rounded">gavel</span> 입찰자격 및 가격</h5>
      ${createTable([...qualFields, ...priceFields])}
    </div>
    
    <div class="koneps-detail-section">
      <h5><span class="material-symbols-rounded">schedule</span> 입찰 일정 및 개찰</h5>
      ${createTable(scheduleFields)}
    </div>

    <div class="koneps-detail-section">
      <h5><span class="material-symbols-rounded">contact_mail</span> 담당자 및 수요기관</h5>
      ${createTable(managerFields)}
    </div>

    <div class="koneps-detail-section">
      <h5><span class="material-symbols-rounded">assignment_ind</span> 입찰 참가 자격</h5>
      <div class="koneps-detail-text-block">
        ${escapeHtml(qualificationText)}
      </div>
    </div>

    ${filesHtml}

    ${dtlUrl ? `
      <a href="${dtlUrl}" target="_blank" rel="noreferrer" class="koneps-original-link-btn">
        <span class="material-symbols-rounded">open_in_new</span>
        나라장터 원본상세 보기
      </a>
    ` : ""}
  `;
}

function getKonepsFieldMap(service) {
  switch (service) {
    case "bid":
      return { no: "bidNtceNo", title: "bidNtceNm", org: "ntceInsttNm", date: "bidClseDt", amount: "presmptPrce" };
    case "award":
      return { no: "bidNtceNo", title: "bidNtceNm", org: "dminsttNm", date: "rlOpengDt", amount: "sucsfbidAmt" };
    case "contract":
      return { no: "cntrctNo", title: "cntrctNm", org: "cntrctInsttNm", date: "cntrctCnclsDt", amount: "cntrctAmt" };
    case "prespec":
      return { no: "bfSpecRgstNo", title: "prdctClsfcNoNm", org: "orderInsttNm", date: "rgstDt", amount: "asignBdgtAmt" };
    default:
      return { no: "bidNtceNo", title: "bidNtceNm", org: "ntceInsttNm", date: "bidClseDt", amount: "presmptPrce" };
  }
}

function getServiceLabel(service) {
  const labels = { bid: "입찰공고", award: "낙찰결과", contract: "계약현황", prespec: "사전규격" };
  return labels[service] || service;
}

function formatKonepsDate(dateStr) {
  if (!dateStr) return "-";
  // 다양한 포맷 처리: YYYY/MM/DD HH:MM, YYYYMMDDHHMMSS, YYYYMMDDHHMM 등
  const cleaned = dateStr.replace(/[\/ :]/g, "");
  if (cleaned.length >= 8) {
    const y = cleaned.slice(0, 4);
    const m = cleaned.slice(4, 6);
    const d = cleaned.slice(6, 8);
    const hh = cleaned.slice(8, 10) || "";
    const mm = cleaned.slice(10, 12) || "";
    return hh ? `${y}.${m}.${d} ${hh}:${mm}` : `${y}.${m}.${d}`;
  }
  return dateStr;
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderKonepsPagination(totalPages) {
  konepsElements.pagination.innerHTML = "";
  if (totalPages <= 1) return;

  const maxVisible = 5;
  let startPage = Math.max(1, konepsCurrentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // 이전 버튼
  const prevBtn = createPageBtn("◀", konepsCurrentPage > 1);
  if (konepsCurrentPage > 1) {
    prevBtn.addEventListener("click", () => {
      konepsCurrentPage--;
      executeKonepsSearch();
    });
  }
  konepsElements.pagination.appendChild(prevBtn);

  // 페이지 번호
  for (let i = startPage; i <= endPage; i++) {
    const btn = createPageBtn(String(i), true);
    if (i === konepsCurrentPage) btn.classList.add("active");
    btn.addEventListener("click", () => {
      konepsCurrentPage = i;
      executeKonepsSearch();
    });
    konepsElements.pagination.appendChild(btn);
  }

  // 다음 버튼
  const nextBtn = createPageBtn("▶", konepsCurrentPage < totalPages);
  if (konepsCurrentPage < totalPages) {
    nextBtn.addEventListener("click", () => {
      konepsCurrentPage++;
      executeKonepsSearch();
    });
  }
  konepsElements.pagination.appendChild(nextBtn);
}

function createPageBtn(text, enabled) {
  const btn = document.createElement("button");
  btn.className = "koneps-page-btn";
  btn.textContent = text;
  btn.disabled = !enabled;
  return btn;
}
