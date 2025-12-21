/**
 * Background Service Worker
 * 处理插件生命周期和侧边栏管理
 */

// 插件安装时
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Prompt Optimizer 已安装', details);
  
  if (details.reason === 'install') {
    // 首次安装,打开侧边栏
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

// 点击插件图标时
chrome.action.onClicked.addListener((tab) => {
  // 打开侧边栏
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// 监听来自侧边栏的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request);
  
  if (request.action === 'openSidePanel') {
    chrome.sidePanel.open({ windowId: sender.tab?.windowId });
    sendResponse({ success: true });
  }
  
  return true; // 保持消息通道开启
});

console.log('Background Service Worker 已启动');
