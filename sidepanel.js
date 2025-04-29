// DOM 요소
const userList = document.getElementById('userList');
const addBtn = document.getElementById('addBtn');
const editDlg = document.getElementById('editDlg');
const titleInput = document.getElementById('titleInput');
const bodyInput = document.getElementById('bodyInput');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const donateQrDlg = document.getElementById('donateQrDlg');
const closeDonateBtn = document.getElementById('closeDonateBtn');

// 현재 편집 중인 템플릿 아이템의 인덱스 (새 아이템일 경우 null)
let editingIndex = null;

// 템플릿 데이터 저장용 변수
let templates = [];

// 초기 로드 함수
async function loadTemplates() {
  try {
    const { userTemplates = [] } = await chrome.storage.local.get(['userTemplates']);
    console.log('로드된 템플릿:', userTemplates);
    
    // ID가 없는 템플릿에 ID 추가
    templates = userTemplates.map(template => {
      if (!template.id) {
        return { ...template, id: 'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) };
      }
      return template;
    });
    
    // 템플릿이 비어있으면 기본 템플릿 추가
    if (templates.length === 0) {
      templates = [
        { id: 'tpl_출장정산', title: '출장정산', body: '출장정산서 내용입니다.' },
        { id: 'tpl_결재의견', title: '결재의견', body: '결재의견 내용입니다.' }
      ];
      
      // 스토리지에 저장
      await saveTemplatesData();
    }
    
    renderTemplates();
  } catch (err) {
    console.error('템플릿 로드 오류:', err);
  }
}

// 템플릿 데이터 저장 함수
async function saveTemplatesData() {
  try {
    console.log('저장할 템플릿:', templates);
    
    // userTemplates 저장
    await chrome.storage.local.set({ userTemplates: templates });
    
    // 백그라운드에 메뉴 갱신 요청
    chrome.runtime.sendMessage('refresh‑menus', response => {
      console.log('메뉴 갱신 응답:', response);
    });
  } catch (err) {
    console.error('템플릿 저장 오류:', err);
  }
}

// 템플릿 목록 렌더링 함수
function renderTemplates() {
  userList.innerHTML = '';
  
  templates.forEach((template, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'md3-list-item';
    listItem.setAttribute('draggable', 'true');
    listItem.setAttribute('data-index', index);
    
    const clipboardBtn = document.createElement('div');
    clipboardBtn.className = 'clipboard-copy';
    
    const clipboardIcon = document.createElement('span');
    clipboardIcon.className = 'material-symbols-rounded';
    clipboardIcon.textContent = 'content_copy';
    
    clipboardBtn.appendChild(clipboardIcon);
    
    // 클립보드 복사 기능 추가
    clipboardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(template.body);
    });
    
    const content = document.createElement('div');
    content.className = 'list-item-content';
    
    const title = document.createElement('span');
    title.className = 'list-item-title';
    title.textContent = template.title;
    
    content.appendChild(title);
    
    const menuBtn = document.createElement('button');
    menuBtn.className = 'md3-icon-button';
    
    const menuIcon = document.createElement('span');
    menuIcon.className = 'material-symbols-rounded';
    menuIcon.textContent = 'more_vert';
    
    menuBtn.appendChild(menuIcon);
    
    // 메뉴 버튼 클릭 이벤트
    menuBtn.addEventListener('click', (e) => {
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
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast('클립보드에 내용이 복사되었습니다.');
    })
    .catch(err => {
      console.error('클립보드 복사 실패:', err);
    });
}

// 토스트 메시지 표시 함수
function showToast(message) {
  // 기존 토스트가 있으면 제거
  const existingToast = document.getElementById('toast');
  if (existingToast) {
    document.body.removeChild(existingToast);
  }
  
  // 새 토스트 생성
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = 'md3-toast';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 애니메이션 효과로 표시
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // 2초 후 사라짐
  setTimeout(() => {
    toast.classList.remove('show');
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
    handle: '.list-item-content', // drag-handle 제거하고 list-item-content만 드래그 핸들로 지정
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    
    onEnd: function(evt) {
      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;
      
      if (oldIndex !== newIndex) {
        const movedItem = templates.splice(oldIndex, 1)[0];
        templates.splice(newIndex, 0, movedItem);
        
        saveTemplatesData();
        renderTemplates();
      }
    }
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
  titleInput.value = '';
  bodyInput.value = '';
  
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
    const id = 'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    templates.push({ id, title, body });
  }
  
  // 스토리지에 저장
  await saveTemplatesData();
  
  renderTemplates();
}

//---------------- 네비게이션 아이템 클릭 시 화면 전환 로직 ----------------
const navItems = document.querySelectorAll('.nav-item');
const templateManagerView = document.getElementById('templateManagerView');
const settingsView = document.getElementById('settingsView');

// navItems에 순서대로: 0 -> link, 1 -> settings, 2 -> search, 3 -> add
navItems.forEach((item, index) => {
  item.addEventListener('click', () => {
    // 모든 nav-item에서 active 제거
    navItems.forEach(i => i.classList.remove('active'));
    // 현재 클릭된 아이템에만 active 설정
    item.classList.add('active');

    // 화면 전환
    if (index === 0) {
      // 링크 탭 (기본 템플릿 목록)
      templateManagerView.style.display = 'block';
      settingsView.style.display = 'none';
    } else if (index === 1) {
      // 설정 탭
      templateManagerView.style.display = 'none';
      settingsView.style.display = 'block';
    } else if (index === 2) {
      // 검색 탭 등 필요시 다른 처리
      console.log('Search 탭 클릭');
    } else if (index === 3) {
      // +버튼 탭 (템플릿 추가)
      // 기존 addBtn과 같은 기능 연결해도 되고, 새 로직을 넣어도 됨
      addTemplate();
    }
  });
});


// 이벤트 리스너
saveBtn.addEventListener('click', saveTemplate);
cancelBtn.addEventListener('click', () => {
  editDlg.close('cancel');
});

// 폼 제출 이벤트 처리
document.getElementById('templateForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (titleInput.value.trim() && bodyInput.value.trim()) {
    editDlg.close('save');
  }
});

// 후원하기 모달 표시 함수
function showDonateQR() {
  donateQrDlg.showModal();
}

// 이벤트 리스너 변경
addBtn.addEventListener('click', showDonateQR);
closeDonateBtn.addEventListener('click', () => {
  donateQrDlg.close();
});

// 초기 로드
document.addEventListener('DOMContentLoaded', loadTemplates);