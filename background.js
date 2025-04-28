/* background.js – Chrome MV3 service worker */

const ROOT_MENU_ID = 'quickTemplateRoot';

/* ───────── 최초 설치/업데이트 ───────── */
chrome.runtime.onInstalled.addListener(async () => {
  await seedIfEmpty();
  await rebuildMenus();
});

/* ───────── 사이드패널 → 메뉴 갱신 요청 ───────── */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === 'refresh‑menus') {
    console.log('메뉴 갱신 요청 받음');
    rebuildMenus().then(() => sendResponse({ ok: true }));
    return true; // keep port open
  }
});

/* ───────── 컨텍스트 메뉴 클릭 ───────── */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === ROOT_MENU_ID) return;

  const { userTemplates = [] } = await chrome.storage.local.get(['userTemplates']);

  const tpl = userTemplates.find(t => t.id === info.menuItemId);
  if (!tpl) return;
  
  /* 로그 추가 */
  console.log("Tab ID:", tab.id);
  console.log("Template:", tpl);
   
  if (!tab.id) {
    console.error("Invalid tab ID");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: insertText,
    args: [tpl.body]
  }).then(() => {
    console.log("Script executed successfully");
  }).catch((err) => {
    console.error("Script execution error:", err);
  });
});

/* ───────── 메뉴 (재)생성 ───────── */
async function rebuildMenus() {
  try {
    // 기존 메뉴 모두 제거
    await chrome.contextMenus.removeAll();

    // 루트 메뉴 생성
    chrome.contextMenus.create({
      id: ROOT_MENU_ID,
      title: '템플릿 붙여넣기',
      contexts: ['editable']
    });

    // 스토리지에서 템플릿 데이터 가져오기
    const { userTemplates = [] } = await chrome.storage.local.get(['userTemplates']);
    
    console.log('로드된 템플릿:', userTemplates);

    // 각 템플릿에 대한 메뉴 항목 생성
    for (const tpl of userTemplates) {
      if (!tpl.id) continue; // ID가 없는 템플릿은 건너뜀
      
      try {
        chrome.contextMenus.create({
          id: tpl.id,
          parentId: ROOT_MENU_ID,
          title: tpl.title,
          contexts: ['editable']
        });
      } catch (err) {
        console.error('메뉴 항목 생성 오류:', err, tpl);
      }
    }
  } catch (err) {
    console.error('메뉴 리빌드 오류:', err);
  }
}

/* ───────── 탭 컨텍스트: 텍스트 삽입 ───────── */
function insertText(text) {
  const el = document.activeElement;
  const isInput = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
  const isEditable = el?.isContentEditable;

  if (!isInput && !isEditable) {
    alert('여기에 템플릿을 삽입할 수 없습니다.');
    return;
  }

  if (isInput) {
    const start = el.selectionStart ?? el.value.length;
    const end   = el.selectionEnd   ?? el.value.length;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
  } else {
    const sel = window.getSelection();
    if (!sel.rangeCount) { el.innerText += text; return; }
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/* ───────── 초기 샘플 데이터 ───────── */
async function seedIfEmpty() {
  const { userTemplates } = await chrome.storage.local.get(['userTemplates']);
  if (userTemplates && userTemplates.length > 0) return;

  const sample = {
    id: 'sample_hello',
    title: '안녕하세요',
    body: '안녕하세요, 문의해 주셔서 감사합니다!'
  };
  
  await chrome.storage.local.set({
    userTemplates: [sample]
  });
}

/* ───────── 아이콘 클릭 → 사이드패널 열기 ───────── */
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
