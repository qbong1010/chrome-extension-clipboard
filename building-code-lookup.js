export const ADDRESS_FINDER_MAX_RESULTS = 10;

export function createAddressFinderMarkup({
  placeholder = "예: 경기도 남양주시 금곡동",
  buttonLabel = "검색",
} = {}) {
  return `
    <div class="address-finder-panel" data-role="address-finder-root">
      <div class="md3-field">
        <label>주소 검색</label>
        <input class="md3-input" data-role="address-search-input" type="text" placeholder="${placeholder}">
      </div>
      <button class="md3-filled-button address-search-button" data-role="address-search-button" type="button">
        <span class="material-symbols-rounded">search</span>
        <span>${buttonLabel}</span>
      </button>
      <div class="search-results" data-role="address-search-results" style="display: none;">
        <div class="results-header">
          <span class="results-count" data-role="results-count">0개 결과</span>
        </div>
        <ul class="results-list" data-role="address-results-list"></ul>
      </div>
    </div>
  `;
}

export function searchAddressByKeyword(addressData, keyword) {
  if (!addressData) {
    throw new Error("주소 데이터가 로드되지 않았습니다");
  }

  const searchKey = keyword.replace(/\s/g, "").toLowerCase();

  if (searchKey.length < 2) {
    return [];
  }

  const results = [];
  const codes = Object.keys(addressData);

  for (const code of codes) {
    const data = addressData[code];

    if (data.searchText.toLowerCase().includes(searchKey)) {
      results.push({
        code,
        ...data,
      });
    }

    if (results.length >= ADDRESS_FINDER_MAX_RESULTS) {
      break;
    }
  }

  return results;
}

export function applyAddressSelection({
  addressData,
  code,
  sigunguInput,
  bjdongInput,
  bunInput,
  focusBunInput = true,
  onSelected,
} = {}) {
  const data = addressData?.[code];

  if (!data) {
    return null;
  }

  sigunguInput.value = data.sigunguCd;
  bjdongInput.value = data.bjdongCd;

  if (focusBunInput && typeof bunInput?.focus === "function") {
    bunInput.focus();
  }

  if (typeof onSelected === "function") {
    onSelected(data);
  }

  return data;
}
