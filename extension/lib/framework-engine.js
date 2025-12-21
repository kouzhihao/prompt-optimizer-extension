/**
 * 框架匹配引擎
 * 负责框架资源加载、匹配和提示词生成
 */

class FrameworkEngine {
  constructor() {
    this.frameworksSummary = null;
    this.frameworksCache = new Map();
    this.frameworksIndex = null;
  }

  /**
   * 初始化框架引擎
   */
  async initialize() {
    try {
      // 加载框架摘要 JSON 文件
      this.frameworksIndex = await this._loadJsonResource('/resources/Frameworks_Summary.json');
      
      // 补充框架文件路径
      this._enrichFrameworkIndex();
      
      console.log(`框架引擎初始化成功,共 ${this.frameworksIndex.length} 个框架`);
      return true;
    } catch (error) {
      console.error('框架引擎初始化失败:', error);
      return false;
    }
  }

  /**
   * 加载资源文件(文本)
   * @private
   */
  async _loadResource(path) {
    try {
      const url = chrome.runtime.getURL(path);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`加载失败: ${path}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`资源加载错误: ${path}`, error);
      throw error;
    }
  }

  /**
   * 加载 JSON 资源文件
   * @private
   */
  async _loadJsonResource(path) {
    try {
      const url = chrome.runtime.getURL(path);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`加载失败: ${path}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`JSON资源加载错误: ${path}`, error);
      throw error;
    }
  }

  /**
   * 补充框架索引信息(添加文件路径)
   * @private
   */
  _enrichFrameworkIndex() {
    this.frameworksIndex = this.frameworksIndex.map(fw => ({
      ...fw,
      scenarios: fw.scenario, // 兼容旧字段名
      filePath: `/resources/frameworks/${fw.filename}`
    }));
  }

  /**
   * 通过框架名称查找ID
   * @param {string} name - 框架中文名称
   * @param {string} nameEn - 框架英文名称
   * @returns {number|null} - 框架ID，未找到返回null
   */
  findFrameworkIdByName(name, nameEn) {
    if (!this.frameworksIndex) return null;
    
    // 尝试精确匹配
    let framework = this.frameworksIndex.find(f => 
      f.name === name || f.name === nameEn
    );
    
    // 如果精确匹配失败，尝试模糊匹配
    if (!framework) {
      const searchName = (name || nameEn || '').toLowerCase().replace(/[\s_-]/g, '');
      framework = this.frameworksIndex.find(f => {
        const indexName = f.name.toLowerCase().replace(/[\s_-]/g, '');
        return indexName.includes(searchName) || searchName.includes(indexName);
      });
    }
    
    return framework ? framework.id : null;
  }

  /**
   * 加载框架详细信息
   * @param {number} frameworkId - 框架 ID
   * @returns {Promise<Object>}
   */
  async loadFrameworkDetail(frameworkId) {
    // 检查缓存
    if (this.frameworksCache.has(frameworkId)) {
      return this.frameworksCache.get(frameworkId);
    }

    const framework = this.frameworksIndex.find(f => f.id === frameworkId);
    if (!framework) {
      throw new Error(`框架不存在: ${frameworkId}`);
    }

    try {
      const content = await this._loadResource(framework.filePath);
      const detail = this._parseFrameworkDetail(content, framework);
      
      // 缓存
      this.frameworksCache.set(frameworkId, detail);
      
      return detail;
    } catch (error) {
      console.error(`加载框架详情失败: ${frameworkId}`, error);
      throw error;
    }
  }

  /**
   * 解析框架详细信息
   * @private
   */
  _parseFrameworkDetail(content, framework) {
    const lines = content.split('\n');
    const detail = {
      id: framework.id,
      name: framework.name,
      nameEn: '',
      url: '',
      scenarios: [],
      overview: '',
      components: [],
      pros: [],
      cons: [],
      examples: []
    };

    let currentSection = '';
    let currentExample = null;
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 提取英文名称
      if (line.startsWith('# ') && !detail.nameEn) {
        detail.nameEn = line.substring(2).replace(' Framework', '').trim();
      }

      // 提取 URL
      if (line.startsWith('## 网址')) {
        detail.url = lines[i + 1]?.trim() || '';
      }

      // 提取应用场景
      if (line.startsWith('## 应用场景')) {
        currentSection = 'scenarios';
        continue;
      }

      // 提取概述
      if (line.startsWith('## 概述')) {
        currentSection = 'overview';
        continue;
      }

      // 提取框架构成
      if (line.startsWith('## 框架构成')) {
        currentSection = 'components';
        inTable = false;
        continue;
      }

      // 提取优点
      if (line.startsWith('## 优点')) {
        currentSection = 'pros';
        continue;
      }

      // 提取缺点
      if (line.startsWith('## 缺点')) {
        currentSection = 'cons';
        continue;
      }

      // 提取最佳实践
      if (line.startsWith('## 最佳实践')) {
        currentSection = 'examples';
        continue;
      }

      // 处理当前section的内容
      if (currentSection === 'scenarios' && line.startsWith('- ')) {
        detail.scenarios.push(line.substring(2));
      }

      if (currentSection === 'overview' && line && !line.startsWith('#')) {
        detail.overview += line + ' ';
      }

      if (currentSection === 'components') {
        if (line.startsWith('|') && !line.startsWith('|---')) {
          if (!inTable && line.includes('组成部分')) {
            inTable = true;
            continue;
          }
          if (inTable) {
            const parts = line.split('|').map(s => s.trim()).filter(s => s);
            if (parts.length >= 3) {
              detail.components.push({
                nameCn: parts[0],
                nameEn: parts[1],
                description: parts[2]
              });
            }
          }
        }
      }

      if (currentSection === 'pros' && line.startsWith('- ')) {
        detail.pros.push(line.substring(2));
      }

      if (currentSection === 'cons' && line.startsWith('- ')) {
        detail.cons.push(line.substring(2));
      }

      if (currentSection === 'examples') {
        if (line.startsWith('### ')) {
          if (currentExample) {
            detail.examples.push(currentExample);
          }
          currentExample = {
            title: line.substring(4),
            content: ''
          };
        } else if (currentExample && line && !line.startsWith('#')) {
          currentExample.content += line + '\n';
        }
      }
    }

    // 添加最后一个示例
    if (currentExample) {
      detail.examples.push(currentExample);
    }

    detail.overview = detail.overview.trim();
    return detail;
  }

  /**
   * 匹配最佳框架
   * @param {string} userInput - 用户输入
   * @param {Object} serviceConfig - AI 服务配置
   * @returns {Promise<Array>} - 推荐的框架列表
   */
  async matchFrameworks(userInput, serviceConfig) {
    try {
      // 构建匹配提示词
      const systemPrompt = aiService.getFrameworkMatchingSystemPrompt();
      
      const userPrompt = `用户需求: ${userInput}

可用框架列表:
${this._buildFrameworkList()}

请分析用户需求,考虑以下维度:
1. 应用场景匹配度 (权重 40%)
2. 复杂度适配性 (权重 30%)
3. 领域适用性 (权重 20%)
4. 框架流行度 (权重 10%)

推荐最适合的 2 个框架。`;

      const messages = [systemPrompt, { role: 'user', content: userPrompt }];
      
      const response = await aiService.chat(messages, serviceConfig);
      
      // 解析响应
      return this._parseMatchingResponse(response);
    } catch (error) {
      console.error('框架匹配失败:', error);
      throw new Error('框架匹配失败: ' + error.message);
    }
  }

  /**
   * 构建框架列表文本
   * @private
   */
  _buildFrameworkList() {
    return this.frameworksIndex.map(f => 
      `${f.id}. ${f.name} - 应用场景: ${f.scenarios}`
    ).join('\n');
  }

  /**
   * 解析匹配响应
   * @private
   */
  _parseMatchingResponse(response) {
    try {
      // 提取 JSON 部分
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                       response.match(/\{[\s\S]*"frameworks"[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const data = JSON.parse(jsonStr);
        return data.frameworks || [];
      }

      // 如果没有找到JSON,尝试直接解析
      const data = JSON.parse(response);
      return data.frameworks || [];
    } catch (error) {
      console.error('解析匹配响应失败:', error);
      throw new Error('无法解析框架推荐结果');
    }
  }

  /**
   * 生成澄清问题
   * @param {Object} framework - 框架详情
   * @param {string} userInput - 用户输入
   * @param {Object} existingInfo - 已有信息
   * @param {Object} serviceConfig - AI 服务配置
   * @param {number} currentRound - 当前澄清轮数
   * @param {number} maxRounds - 最大澄清轮数
   * @returns {Promise<Object>}
   */
  async generateClarificationQuestions(framework, userInput, existingInfo, serviceConfig, currentRound = 1, maxRounds = 2) {
    try {
      const systemPrompt = aiService.getClarificationSystemPrompt(currentRound, maxRounds);
      
      const remainingRounds = maxRounds - currentRound;
      const roundInfo = remainingRounds > 0 
        ? `（当前第 ${currentRound} 轮，还剩 ${remainingRounds} 轮确认机会）`
        : '（这是最后一轮，请设置 isComplete 为 true）';
      
      const userPrompt = `框架: ${framework.name}
框架元素: ${framework.components.map(c => c.nameCn + '(' + c.nameEn + ')').join(', ')}

用户原始需求: ${userInput}

已收集信息:
${JSON.stringify(existingInfo, null, 2)}

${roundInfo}
请根据框架要求和已有信息,提出最关键的澄清问题，帮助收集缺失的信息。`;

      const messages = [systemPrompt, { role: 'user', content: userPrompt }];
      
      const response = await aiService.chat(messages, serviceConfig);
      
      return this._parseClarificationResponse(response);
    } catch (error) {
      console.error('生成澄清问题失败:', error);
      throw new Error('生成澄清问题失败: ' + error.message);
    }
  }

  /**
   * 解析澄清响应
   * @private
   */
  _parseClarificationResponse(response) {
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                       response.match(/\{[\s\S]*"questions"[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      }

      return JSON.parse(response);
    } catch (error) {
      console.error('解析澄清响应失败:', error);
      throw new Error('无法解析澄清问题');
    }
  }

  /**
   * 生成优化的提示词
   * @param {Object} framework - 框架详情
   * @param {Object} clarificationData - 澄清后的完整信息
   * @param {Object} serviceConfig - AI 服务配置
   * @returns {Promise<string>}
   */
  async generateOptimizedPrompt(framework, clarificationData, serviceConfig) {
    try {
      const systemPrompt = aiService.getPromptGenerationSystemPrompt();
      
      const userPrompt = `请使用 ${framework.name} 框架生成优化的提示词。

框架说明:
${framework.overview}

框架元素:
${framework.components.map((c, i) => `${i + 1}. ${c.nameCn}(${c.nameEn}): ${c.description}`).join('\n')}

用户信息:
- 原始需求: ${clarificationData.originalInput}
- 目标: ${clarificationData.goal || '未指定'}
- 受众: ${clarificationData.audience || '未指定'}
- 上下文: ${clarificationData.context || '未指定'}
- 格式要求: ${clarificationData.formatRequirements || '未指定'}
- 约束条件: ${clarificationData.constraints || '未指定'}
- 补充信息: ${clarificationData.additionalInfo || '无'}

参考示例:
${framework.examples.slice(0, 2).map(e => e.title + '\n' + e.content).join('\n\n')}

请严格按照框架的各个元素,生成一个完整、优化的提示词。输出格式为 markdown。`;

      const messages = [systemPrompt, { role: 'user', content: userPrompt }];
      
      const response = await aiService.chat(messages, serviceConfig);
      
      return response;
    } catch (error) {
      console.error('生成提示词失败:', error);
      throw new Error('生成提示词失败: ' + error.message);
    }
  }

  /**
   * 获取框架复杂度
   * @param {Object} framework - 框架详情
   * @returns {string}
   */
  getFrameworkComplexity(framework) {
    const elementCount = framework.components.length;
    if (elementCount <= 3) return '简单';
    if (elementCount <= 5) return '中等';
    return '复杂';
  }
}

// 导出单例
const frameworkEngine = new FrameworkEngine();
