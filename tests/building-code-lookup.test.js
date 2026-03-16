import assert from "node:assert/strict";
import test from "node:test";

import {
  ADDRESS_FINDER_MAX_RESULTS,
  applyAddressSelection,
  searchAddressByKeyword,
} from "../building-code-lookup.js";

function createAddressData() {
  const entries = {
    "4112310300": {
      sigunguCd: "41360",
      bjdongCd: "10300",
      fullAddress: "경기도 남양주시 금곡동",
      searchText: "경기도남양주시금곡동",
    },
  };

  for (let index = 0; index < 12; index += 1) {
    entries[`50000${index}`] = {
      sigunguCd: `500${String(index).padStart(2, "0")}`,
      bjdongCd: `600${String(index).padStart(2, "0")}`,
      fullAddress: `테스트시 테스트구 테스트동 ${index}`,
      searchText: `테스트시테스트구테스트동${index}`,
    };
  }

  return entries;
}

test("searchAddressByKeyword finds a known address", () => {
  const results = searchAddressByKeyword(
    createAddressData(),
    "경기도 남양주시 금곡동",
  );

  assert.ok(results.length >= 1);
  assert.equal(results[0].sigunguCd, "41360");
  assert.equal(results[0].bjdongCd, "10300");
});

test("searchAddressByKeyword ignores spaces", () => {
  const results = searchAddressByKeyword(createAddressData(), "금 곡 동");

  assert.ok(results.some((result) => result.bjdongCd === "10300"));
});

test("searchAddressByKeyword returns empty array for one-character keyword", () => {
  const results = searchAddressByKeyword(createAddressData(), "금");

  assert.deepEqual(results, []);
});

test("searchAddressByKeyword never returns more than ten results", () => {
  const results = searchAddressByKeyword(createAddressData(), "테스트동");

  assert.equal(results.length, ADDRESS_FINDER_MAX_RESULTS);
});

test("applyAddressSelection fills building inputs and preserves other fields", () => {
  const addressData = createAddressData();
  const sigunguInput = { value: "" };
  const bjdongInput = { value: "" };
  const bunInput = {
    value: "0685",
    focused: false,
    focus() {
      this.focused = true;
    },
  };

  const selected = applyAddressSelection({
    addressData,
    code: "4112310300",
    sigunguInput,
    bjdongInput,
    bunInput,
  });

  assert.equal(sigunguInput.value, "41360");
  assert.equal(bjdongInput.value, "10300");
  assert.equal(bunInput.value, "0685");
  assert.equal(bunInput.focused, true);
  assert.equal(selected.fullAddress, "경기도 남양주시 금곡동");
});

test("applyAddressSelection can skip bun input focus", () => {
  const addressData = createAddressData();
  const sigunguInput = { value: "" };
  const bjdongInput = { value: "" };
  const bunInput = {
    focused: false,
    focus() {
      this.focused = true;
    },
  };

  applyAddressSelection({
    addressData,
    code: "4112310300",
    sigunguInput,
    bjdongInput,
    bunInput,
    focusBunInput: false,
  });

  assert.equal(bunInput.focused, false);
});
