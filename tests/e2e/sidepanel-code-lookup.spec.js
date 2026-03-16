import { expect, openSidepanelPage, test } from "./extension-fixtures.js";

async function mockBuildingApi(sidepanelPage) {
  await sidepanelPage.route("**/1613000/BldRgstHubService/getBrTitleInfo**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        response: {
          header: { resultCode: "00" },
          body: {
            items: {
              item: {
                bldNm: "테스트 빌딩",
                platPlc: "경기도 남양주시 금곡동 685-17",
                newPlatPlc: "경기도 남양주시 테스트로 1",
                regstrGbCdNm: "일반",
                mainPurpsCdNm: "업무시설",
                strctCdNm: "철근콘크리트구조",
                roofCdNm: "평지붕",
                platArea: "100.5",
                archArea: "80.2",
                totArea: "450.7",
                bcRat: "79.8",
                vlRat: "250.1",
                grndFlrCnt: "5",
                ugrndFlrCnt: "1",
                hhldCnt: "0",
                pmsDay: "20200101",
                stcnsDay: "20200201",
                useAprDay: "20201231",
              },
            },
          },
        },
      }),
    });
  });
}

test("fills building code fields from the modal lookup flow", async ({ sidepanelPage }) => {
  await sidepanelPage.locator("#navSearch").click();
  await sidepanelPage.locator("#openCodeLookupBtn").click();

  const dialog = sidepanelPage.locator("#codeLookupDlg");
  await expect(dialog).toBeVisible();

  await dialog.locator('[data-role="address-search-input"]').fill("경기도 남양주시 금곡동");
  await dialog.locator('[data-role="address-search-button"]').click();

  const resultButton = dialog.locator(".result-item-select").first();
  await expect(resultButton).toBeVisible();
  await resultButton.click();

  await expect(sidepanelPage.locator("#sigunguInput")).toHaveValue("41360");
  await expect(sidepanelPage.locator("#bjdongInput")).toHaveValue("10300");
  await expect(sidepanelPage.locator("#bunInput")).toBeFocused();
  await expect(dialog).not.toBeVisible();
});

test("shows zero-result state for short queries and restores focus on Escape", async ({ sidepanelPage }) => {
  await sidepanelPage.locator("#navSearch").click();
  await sidepanelPage.locator("#openCodeLookupBtn").click();

  const dialog = sidepanelPage.locator("#codeLookupDlg");
  await expect(dialog).toBeVisible();

  await dialog.locator('[data-role="address-search-input"]').fill("금");
  await dialog.locator('[data-role="address-search-button"]').click();

  await expect(dialog.locator('[data-role="results-count"]')).toHaveText("0개 결과");
  await expect(dialog.locator(".no-results")).toHaveText("검색 결과가 없습니다");

  await sidepanelPage.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(sidepanelPage.locator("#openCodeLookupBtn")).toBeFocused();
});

test("keeps dedicated-page selection when returning to building search and submits lookup", async ({ sidepanelPage }) => {
  await mockBuildingApi(sidepanelPage);

  await sidepanelPage.locator("#navCodeFinder").click();

  const pageFinder = sidepanelPage.locator("#legalDongFinderMount");
  await pageFinder.locator('[data-role="address-search-input"]').fill("경기도 남양주시 금곡동");
  await pageFinder.locator('[data-role="address-search-button"]').click();
  await expect(pageFinder.locator(".result-item-select").first()).toBeVisible();
  await pageFinder.locator(".result-item-select").first().click();

  await sidepanelPage.locator("#navSearch").click();
  await expect(sidepanelPage.locator("#sigunguInput")).toHaveValue("41360");
  await expect(sidepanelPage.locator("#bjdongInput")).toHaveValue("10300");

  await sidepanelPage.locator("#bunInput").fill("0685");
  await sidepanelPage.locator("#jiInput").fill("0017");

  const loadingIndicator = sidepanelPage.locator("#loadingIndicator");
  const resultSection = sidepanelPage.locator("#resultSection");

  const loadingVisible = expect(loadingIndicator).toBeVisible();
  await sidepanelPage.locator("#searchBtn").click();
  await loadingVisible;
  await expect(resultSection).toBeVisible();
  await expect(sidepanelPage.locator("#simpleView")).toContainText("테스트 빌딩");
});

test("closes the dialog from backdrop click and restores trigger focus", async ({ sidepanelPage }) => {
  await sidepanelPage.locator("#navSearch").click();
  await sidepanelPage.locator("#openCodeLookupBtn").click();

  const dialog = sidepanelPage.locator("#codeLookupDlg");
  await expect(dialog).toBeVisible();

  const box = await dialog.boundingBox();
  const clickX = Math.max(1, Math.floor((box?.x ?? 20) - 10));
  const clickY = Math.max(1, Math.floor((box?.y ?? 20) - 10));
  await sidepanelPage.mouse.click(clickX, clickY);

  await expect(dialog).not.toBeVisible();
  await expect(sidepanelPage.locator("#openCodeLookupBtn")).toBeFocused();
});

test("shows a handled error when the building API key is missing", async ({ context, extensionId }) => {
  const sidepanelPage = await openSidepanelPage(context, extensionId, "");
  let requested = false;

  await sidepanelPage.route("**/1613000/BldRgstHubService/getBrTitleInfo**", async (route) => {
    requested = true;
    await route.abort();
  });

  await sidepanelPage.locator("#navSearch").click();
  await sidepanelPage.locator("#sigunguInput").fill("41360");
  await sidepanelPage.locator("#bjdongInput").fill("10300");
  await sidepanelPage.locator("#bunInput").fill("0685");
  await sidepanelPage.locator("#jiInput").fill("0017");
  await sidepanelPage.locator("#searchBtn").click();

  await expect(sidepanelPage.locator("#errorMessage")).toHaveText("API 키를 먼저 설정해주세요");
  await sidepanelPage.waitForTimeout(300);
  await expect(sidepanelPage.locator("#loadingIndicator")).not.toBeVisible();
  expect(requested).toBe(false);

  await sidepanelPage.close();
});
