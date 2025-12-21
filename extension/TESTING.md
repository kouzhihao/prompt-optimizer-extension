# 快速测试指南

## 测试步骤

### 1. 加载扩展

```bash
# 在 Chrome 浏览器中
1. 打开 chrome://extensions/
2. 启用"开发者模式"(右上角)
3. 点击"加载已解压的扩展程序"
4. 选择项目的 extension 文件夹
5. 确认扩展已加载成功
```

### 2. 验证文件结构

```bash
cd extension
find . -type f -name "*.js" -o -name "*.html" -o -name "*.css" -o -name "*.json" -o -name "*.png" | sort
```

预期输出应包含:
- manifest.json
- background/service_worker.js
- side_panel/index.html
- side_panel/styles.css
- side_panel/app.js
- lib/storage-manager.js
- lib/ai-service.js
- lib/framework-engine.js
- icons/icon16.png
- icons/icon48.png
- icons/icon128.png
- resources/frameworks/ (57个文件)
- resources/Frameworks_Summary.md
- resources/SKILL.md

### 3. 测试基本功能

#### 3.1 打开侧边栏
- 点击浏览器工具栏中的扩展图标
- 验证侧边栏是否正常打开
- 检查界面是否显示配置引导页

#### 3.2 配置 AI 服务
- 点击"开始配置"或设置按钮
- 选择一个 AI 服务(DeepSeek/Kimi/OpenRouter)
- 输入 API Key 和模型名称
- 点击"测试连接"
- 验证连接是否成功
- 保存配置

#### 3.3 测试框架匹配
输入测试需求:
```
我需要为一个健身应用写营销文案,目标用户是25-35岁的上班族,希望强调便利性和效果
```

预期结果:
- 系统应返回 3 个推荐框架
- 应该包含 BAB、SPEAR 等营销类框架
- 框架卡片显示推荐理由、复杂度等信息

#### 3.4 测试框架选择和澄清
- 点击选择其中一个框架
- 系统应提出 1-3 个澄清问题
- 回答问题后继续对话
- 验证澄清流程是否正常

#### 3.5 测试提示词生成
- 完成澄清后,系统应生成优化的提示词
- 检查生成的提示词是否符合框架结构
- 点击"复制"按钮,验证复制功能
- 测试"重新生成"按钮

#### 3.6 测试新对话
- 点击"新对话"按钮
- 验证界面是否重置
- 会话状态是否清空

### 4. 错误处理测试

#### 4.1 测试无效 API Key
- 输入错误的 API Key
- 点击"测试连接"
- 验证是否显示错误提示

#### 4.2 测试网络错误
- 断开网络连接
- 尝试发送请求
- 验证错误提示是否友好

#### 4.3 测试空输入
- 不输入任何内容点击发送
- 验证是否有适当处理

### 5. 性能测试

#### 5.1 框架加载速度
- 打开侧边栏,记录初始化时间
- 应在 1 秒内完成

#### 5.2 响应速度
- 发送请求后记录响应时间
- AI 调用应在 10 秒内返回结果

#### 5.3 内存占用
- 打开 Chrome 任务管理器
- 检查扩展的内存占用
- 正常应在 50MB 以下

### 6. 浏览器控制台检查

打开开发者工具(F12),检查:
- 是否有 JavaScript 错误
- 网络请求是否正常
- 资源文件是否加载成功

### 7. 已知限制

1. **框架匹配准确性依赖 AI 服务质量**
   - 不同的 AI 服务可能给出不同的推荐结果
   - 建议使用清晰、详细的需求描述

2. **澄清问题生成**
   - 当前实现可能不够智能
   - 如果澄清流程过长,可以手动跳过或提供更完整的初始需求

3. **不支持历史记录**
   - 按照设计要求,不保存对话历史
   - 关闭侧边栏后会话数据会清空

4. **框架文件解析**
   - 依赖 markdown 文件格式的一致性
   - 如果某个框架文件格式异常,可能导致解析失败

## 常见问题排查

### 扩展无法加载
- 检查 manifest.json 是否有语法错误
- 验证所有必需文件是否存在
- 查看 Chrome 扩展页面的错误信息

### 侧边栏打不开
- 检查 background/service_worker.js 是否有错误
- 查看浏览器控制台日志
- 尝试重新加载扩展

### 配置保存失败
- 检查 Chrome Storage 权限
- 验证配置数据格式
- 查看 storage-manager.js 的日志

### AI 请求失败
- 验证 API Key 是否正确
- 检查网络连接
- 确认 API 端点是否可访问
- 查看详细错误信息

### 框架匹配返回空
- 检查 resources 目录是否完整
- 验证 Frameworks_Summary.md 是否存在
- 查看框架引擎初始化日志

## 测试清单

- [ ] 扩展成功加载
- [ ] 侧边栏正常打开
- [ ] 配置引导页显示
- [ ] 设置对话框正常
- [ ] 配置保存成功
- [ ] 测试连接功能正常
- [ ] 框架匹配返回 3 个推荐
- [ ] 框架选择功能正常
- [ ] 澄清问题生成
- [ ] 提示词生成成功
- [ ] 复制功能正常
- [ ] 新对话功能正常
- [ ] 错误提示友好
- [ ] 加载提示显示正常
- [ ] Toast 提示正常
- [ ] 响应速度符合要求
- [ ] 无控制台错误
- [ ] 界面样式正常
- [ ] 移动端适配(可选)

## 调试技巧

### 查看扩展日志
```javascript
// 在 background service worker 控制台
console.log('Background logs');

// 在侧边栏页面控制台
console.log('Side panel logs');
```

### 检查存储数据
```javascript
// 在控制台运行
chrome.storage.sync.get('userConfig', (result) => {
  console.log('Current config:', result);
});
```

### 测试 AI 服务
```javascript
// 在控制台运行
const testConfig = {
  service: 'deepseek',
  apiKey: 'your-api-key',
  model: 'deepseek-chat'
};

const messages = [{ role: 'user', content: 'Hello' }];
aiService.chat(messages, testConfig)
  .then(response => console.log('Response:', response))
  .catch(error => console.error('Error:', error));
```

## 性能优化建议

1. **缓存机制**
   - 框架文件加载后缓存到内存
   - 避免重复读取相同文件

2. **请求优化**
   - 合并相似的 AI 请求
   - 实现请求队列管理

3. **UI 优化**
   - 使用虚拟滚动处理长对话
   - 延迟加载非关键资源

4. **错误恢复**
   - 实现自动重试机制
   - 提供降级方案

## 反馈与改进

测试过程中发现的问题请记录:
- 问题描述
- 重现步骤
- 期望行为
- 实际行为
- 浏览器版本
- 错误截图

---

**祝测试顺利!** 🎯
