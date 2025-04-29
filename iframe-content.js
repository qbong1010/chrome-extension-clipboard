// iframe-content.js
document.addEventListener('contextmenu', function(event) {
    // 편집 가능한 요소인지 확인
    const target = event.target;
    if (target.isContentEditable || 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA') {
      // 이 요소가 편집 가능함을 표시
      target.dataset.isEditable = true;
      
      // 부모 창에 메시지 전달 (필요시)
      window.parent.postMessage({
        type: 'editable-context-detected',
        editable: true
      }, '*');
    }
  }, true);