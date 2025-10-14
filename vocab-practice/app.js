// 应用状态管理
class VocabularyApp {
    constructor() {
        this.vocabulary = [];
        this.currentWordIndex = 0;
        this.userProgress = {};
        this.currentTest = null;
        this.testQuestions = [];
        this.currentQuestionIndex = 0;
        this.testScore = 0;
        this.testSettings = {
            questionCount: 10,
            questionType: 'choice' // 'choice' or 'fill'
        };
        this.studySettings = {
            order: 'sequential', // 'sequential' 或 'random'
            category: 'all' // 'all' 或具体分类名称
        };
        this.shuffledIndices = []; // 存储随机排序的索引
        
        // 当前分类的词汇列表
        this.filteredVocabulary = [];
        
        // 云同步设置
        this.syncSettings = {
            enabled: false,
            gistId: null,
            accessToken: null,
            lastSyncTime: null,
            autoSync: false
        };
        this.loadSyncSettings();
        this.init();
    }

    async init() {
        await this.loadVocabulary();
        this.loadUserProgress();
        this.updateStats();
        this.setupEventListeners();
        this.renderWordList();
        this.populateCategorySelect(); // 填充分类选择器
        
        // 启动时进行自动同步
        setTimeout(() => {
            this.autoSync();
        }, 2000);
    }

    // 加载词汇数据
    async loadVocabulary() {
        try {
            const response = await fetch('vocabulary.json');
            const jsonData = await response.text();
            this.parseJSON(jsonData);
        } catch (error) {
            console.error('加载词汇数据失败:', error);
            // 如果无法加载JSON，尝试加载CSV作为备用
            try {
                const csvResponse = await fetch('300.csv');
                const csvText = await csvResponse.text();
                this.parseCSV(csvText);
            } catch (csvError) {
                console.error('加载CSV备用数据也失败:', csvError);
                // 使用示例数据
                this.vocabulary = [
                    { id: 1, chinese: '习近平新时代中国特色社会主义思想', english: 'Xi Jinping Thought on Socialism with Chinese Characteristics for a New Era', category: '政治理论', status: 'unknown' },
                    { id: 2, chinese: '中国共产党', english: 'the Communist Party of China (the CPC)', category: '党建组织', status: 'unknown' },
                    { id: 3, chinese: '中国梦', english: 'Chinese Dream', category: '综合概念', status: 'unknown' }
                ];
            }
        }
    }

    // 解析JSON数据
    parseJSON(jsonText) {
        try {
            const data = JSON.parse(jsonText);
            this.vocabulary = data.vocabulary || [];
            this.metadata = data.metadata || {};
            console.log(`成功加载 ${this.vocabulary.length} 个词汇`);
            console.log('分类统计:', this.metadata.categories);
        } catch (error) {
            console.error('解析JSON数据失败:', error);
            this.vocabulary = [];
        }
    }

    // 解析CSV数据（备用方法）
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        this.vocabulary = [];
        
        for (let i = 1; i < lines.length; i++) { // 跳过标题行
            const line = lines[i].trim();
            if (line) {
                const columns = line.split(',');
                // 获取中文和英文，去除空白字符
                const chinese = columns[0] ? columns[0].trim() : '';
                const english = columns[1] ? columns[1].trim() : '';
                
                // 只要中文和英文都不为空就添加
                if (chinese && english) {
                    this.vocabulary.push({
                        id: i - 1,
                        chinese: chinese,
                        english: english,
                        category: '综合概念', // CSV模式下默认分类
                        status: 'unknown'
                    });
                }
            }
        }
        
        console.log(`成功加载 ${this.vocabulary.length} 个词汇（CSV格式）`);
    }

    // 加载用户学习进度
    loadUserProgress() {
        const saved = localStorage.getItem('vocabularyProgress');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // 检查数据版本和结构
                if (data.version && data.userProgress) {
                    this.userProgress = data.userProgress;
                    this.progressVersion = data.version;
                    this.lastSaved = data.lastSaved;
                } else {
                    // 兼容旧版本数据
                    this.userProgress = data;
                    this.progressVersion = '1.0';
                    this.lastSaved = new Date().toISOString();
                }
            } catch (error) {
                console.error('加载用户进度失败:', error);
                this.initializeDefaultProgress();
            }
        } else {
            this.initializeDefaultProgress();
        }
        
        // 确保所有词汇都有进度记录
        this.ensureAllWordsHaveProgress();
    }

    // 初始化默认进度
    initializeDefaultProgress() {
        this.userProgress = {};
        this.progressVersion = '1.1';
        this.lastSaved = new Date().toISOString();
        this.vocabulary.forEach(word => {
            this.userProgress[word.id] = {
                status: 'unknown', // unknown, learning, known
                reviewCount: 0,
                lastReviewed: null,
                createdAt: new Date().toISOString()
            };
        });
    }

    // 确保所有词汇都有进度记录
    ensureAllWordsHaveProgress() {
        let hasNewWords = false;
        this.vocabulary.forEach(word => {
            if (!this.userProgress[word.id]) {
                this.userProgress[word.id] = {
                    status: 'unknown',
                    reviewCount: 0,
                    lastReviewed: null,
                    createdAt: new Date().toISOString()
                };
                hasNewWords = true;
            }
        });
        
        if (hasNewWords) {
            this.saveUserProgress();
        }
    }

    // 保存用户进度
    saveUserProgress() {
        try {
            const progressData = {
                version: '1.1',
                lastSaved: new Date().toISOString(),
                userProgress: this.userProgress,
                totalWords: this.vocabulary.length,
                categories: this.metadata ? Object.keys(this.metadata.categories || {}) : []
            };
            
            localStorage.setItem('vocabularyProgress', JSON.stringify(progressData));
            this.lastSaved = progressData.lastSaved;
            
            // 同时保存一个备份副本
            localStorage.setItem('vocabularyProgress_backup', JSON.stringify(progressData));
        } catch (error) {
            console.error('保存用户进度失败:', error);
            // 如果localStorage空间不足，尝试清理旧数据
            this.cleanupOldData();
        }
    }

    // 清理旧数据
    cleanupOldData() {
        try {
            // 移除可能的旧版本数据
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('vocab_') && key !== 'vocabularyProgress' && key !== 'vocabularyProgress_backup') {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // 重新尝试保存
            const progressData = {
                version: '1.1',
                lastSaved: new Date().toISOString(),
                userProgress: this.userProgress
            };
            localStorage.setItem('vocabularyProgress', JSON.stringify(progressData));
        } catch (error) {
            console.error('清理数据后仍无法保存:', error);
        }
    }

    // 加载云同步设置
    loadSyncSettings() {
        const saved = localStorage.getItem('vocabularySyncSettings');
        if (saved) {
            try {
                this.syncSettings = { ...this.syncSettings, ...JSON.parse(saved) };
            } catch (error) {
                console.error('加载同步设置失败:', error);
            }
        }
    }

    // 保存云同步设置
    saveSyncSettings() {
        try {
            localStorage.setItem('vocabularySyncSettings', JSON.stringify(this.syncSettings));
        } catch (error) {
            console.error('保存同步设置失败:', error);
        }
    }

    // 上传进度到GitHub Gist
    async uploadToGist() {
        if (!this.syncSettings.accessToken) {
            throw new Error('请先配置GitHub访问令牌');
        }

        const progressData = {
            version: '1.1',
            lastSaved: new Date().toISOString(),
            userProgress: this.userProgress,
            totalWords: this.vocabulary.length,
            categories: this.metadata ? Object.keys(this.metadata.categories || {}) : [],
            deviceInfo: {
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            }
        };

        try {
            let response;
            
            if (this.syncSettings.gistId) {
                // 更新现有Gist
                response = await fetch(`https://api.github.com/gists/${this.syncSettings.gistId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${this.syncSettings.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        files: {
                            'vocabulary-progress.json': {
                                content: JSON.stringify(progressData, null, 2)
                            }
                        }
                    })
                });
            } else {
                // 创建新Gist
                response = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.syncSettings.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        description: '思政英语词汇学习进度',
                        public: false,
                        files: {
                            'vocabulary-progress.json': {
                                content: JSON.stringify(progressData, null, 2)
                            }
                        }
                    })
                });
            }

            if (!response.ok) {
                throw new Error(`上传失败: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            // 如果是新创建的Gist，保存ID
            if (!this.syncSettings.gistId) {
                this.syncSettings.gistId = result.id;
            }

            this.syncSettings.lastSyncTime = new Date().toISOString();
            this.saveSyncSettings();
            
            return result;
        } catch (error) {
            console.error('上传到Gist失败:', error);
            throw error;
        }
    }

    // 从GitHub Gist下载进度
    async downloadFromGist() {
        if (!this.syncSettings.accessToken) {
            throw new Error('请先配置GitHub访问令牌');
        }
        
        if (!this.syncSettings.gistId) {
            throw new Error('未找到Gist ID，请先上传数据或手动输入Gist ID');
        }

        try {
            const response = await fetch(`https://api.github.com/gists/${this.syncSettings.gistId}`, {
                headers: {
                    'Authorization': `token ${this.syncSettings.accessToken}`,
                }
            });

            if (!response.ok) {
                throw new Error(`下载失败: ${response.status} ${response.statusText}`);
            }

            const gist = await response.json();
            const progressFile = gist.files['vocabulary-progress.json'];
            
            if (!progressFile) {
                throw new Error('Gist中未找到进度文件');
            }

            const progressData = JSON.parse(progressFile.content);
            
            // 合并远程数据和本地数据
            this.mergeProgressData(progressData);
            
            this.syncSettings.lastSyncTime = new Date().toISOString();
            this.saveSyncSettings();
            
            return progressData;
        } catch (error) {
            console.error('从Gist下载失败:', error);
            throw error;
        }
    }

    // 合并进度数据
    mergeProgressData(remoteData) {
        if (!remoteData.userProgress) {
            return;
        }

        // 简单的合并策略：使用最新的复习时间
        Object.keys(remoteData.userProgress).forEach(wordId => {
            const remoteProgress = remoteData.userProgress[wordId];
            const localProgress = this.userProgress[wordId];

            if (!localProgress) {
                // 本地没有这个词汇的记录，直接使用远程数据
                this.userProgress[wordId] = remoteProgress;
            } else {
                // 比较最后复习时间，使用更新的数据
                const remoteTime = new Date(remoteProgress.lastReviewed || 0);
                const localTime = new Date(localProgress.lastReviewed || 0);
                
                if (remoteTime > localTime) {
                    this.userProgress[wordId] = remoteProgress;
                } else if (remoteTime.getTime() === localTime.getTime()) {
                    // 时间相同时，合并复习次数
                    this.userProgress[wordId].reviewCount = Math.max(
                        localProgress.reviewCount || 0,
                        remoteProgress.reviewCount || 0
                    );
                }
            }
        });

        // 保存合并后的数据
        this.saveUserProgress();
        this.updateStats();
    }

    // 自动同步
    async autoSync() {
        if (!this.syncSettings.enabled || !this.syncSettings.autoSync) {
            return;
        }

        try {
            // 先下载远程数据进行合并
            await this.downloadFromGist();
            // 然后上传本地数据
            await this.uploadToGist();
        } catch (error) {
            console.error('自动同步失败:', error);
        }
    }

    // 手动同步
    async manualSync() {
        if (!this.syncSettings.enabled) {
            throw new Error('云同步未启用');
        }

        try {
            // 先下载远程数据进行合并
            await this.downloadFromGist();
            // 然后上传本地数据
            await this.uploadToGist();
            
            return {
                success: true,
                message: '同步成功',
                lastSyncTime: this.syncSettings.lastSyncTime
            };
        } catch (error) {
            console.error('手动同步失败:', error);
            throw error;
        }
    }

    // 更新统计数据
    updateStats() {
        const learned = Object.values(this.userProgress).filter(p => p.status === 'learning').length;
        const mastered = Object.values(this.userProgress).filter(p => p.status === 'known').length;
        const remaining = this.vocabulary.length - learned - mastered;

        document.getElementById('learned-count').textContent = learned;
        document.getElementById('mastered-count').textContent = mastered;
        document.getElementById('remaining-count').textContent = remaining;
        document.getElementById('progress-text').textContent = `${learned + mastered}/${this.vocabulary.length}`;
    }

    // 设置事件监听器
    setupEventListeners() {
        // 搜索功能
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterWords(e.target.value);
            });
        }

        // 筛选按钮
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterWordsByStatus(e.target.dataset.filter);
            });
        });

        // 卡片翻转
        const flashcard = document.getElementById('flashcard');
        if (flashcard) {
            flashcard.addEventListener('click', () => {
                flashcard.classList.toggle('flipped');
            });
        }

        // 测试设置选项监听
        this.setupTestSettingsListeners();
    }

    // 设置测试选项监听器
    setupTestSettingsListeners() {
        // 题目数量选择
        document.querySelectorAll('[data-count]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-count]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.testSettings.questionCount = parseInt(btn.dataset.count);
            });
        });

        // 题型选择
        document.querySelectorAll('[data-type]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.testSettings.questionType = btn.dataset.type;
                
                // 重置测试状态，防止模式切换时出现状态残留
                this.resetTestState();
            });
        });
    }

    // 重置测试状态
    resetTestState() {
        // 重置翻译题输入框状态
        const input = document.getElementById('translation-input');
        if (input) {
            input.value = '';
            input.disabled = false;
            input.className = 'translation-input';
            input.style.borderColor = '#e2e8f0';
            input.placeholder = '请输入答案';
        }
        
        // 隐藏正确答案显示区域
        const correctAnswerSection = document.getElementById('correct-answer-section');
        if (correctAnswerSection) {
            correctAnswerSection.style.display = 'none';
        }
        
        // 隐藏反馈区域
        const feedback = document.getElementById('translation-feedback');
        if (feedback) {
            feedback.style.display = 'none';
        }
        
        // 重置按钮状态
        const submitBtn = document.getElementById('submit-translation-btn');
        if (submitBtn) {
            submitBtn.style.display = 'inline-block';
        }
        
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.style.display = 'none';
        }
    }

    // 显示指定页面
    showSection(sectionName) {
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[onclick="showSection('${sectionName}')"]`).classList.add('active');

        // 显示对应页面
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        // 页面特定初始化
        if (sectionName === 'study') {
            this.initStudyMode();
        } else if (sectionName === 'browse') {
            this.renderWordList();
        } else if (sectionName === 'test') {
            // 初始化测试设置
            document.getElementById('test-settings').style.display = 'block';
            document.getElementById('test-container').style.display = 'none';
            this.resetTestState();
        }
    }

    // 初始化学习模式
    initStudyMode() {
        // 先筛选词汇
        this.filterVocabularyByCategory();
        
        if (this.filteredVocabulary.length === 0) {
            // 如果没有词汇，显示提示信息
            document.querySelector('.flashcard .word').textContent = '该分类暂无词汇';
            document.querySelector('.flashcard .translation').textContent = '';
            document.querySelector('.study-progress').textContent = '0/0';
            return;
        }
        
        // 如果是随机模式且还没有生成随机索引，则生成
        if (this.studySettings.order === 'random' && this.shuffledIndices.length === 0) {
            this.generateShuffledIndices();
        }
        
        // 找到下一个需要学习的词汇
        const unknownWords = this.filteredVocabulary.filter(word => 
            this.userProgress[word.id].status === 'unknown'
        );
        
        if (unknownWords.length > 0) {
            if (this.studySettings.order === 'random') {
                // 随机模式：从随机索引中找到第一个未学习的词汇
                const unknownIndex = this.shuffledIndices.find(index => {
                    const word = this.filteredVocabulary[index];
                    return word && this.userProgress[word.id].status === 'unknown';
                });
                if (unknownIndex !== undefined) {
                    this.currentWordIndex = unknownIndex;
                } else {
                    // 如果随机索引中没有找到未学习的词汇，使用第一个随机索引
                    this.currentWordIndex = this.shuffledIndices.length > 0 ? this.shuffledIndices[0] : 0;
                }
            } else {
                // 顺序模式：按原来的逻辑
                this.currentWordIndex = this.filteredVocabulary.findIndex(word => word.id === unknownWords[0].id);
            }
        } else {
            // 如果没有未学习的词汇，根据模式选择起始位置
            if (this.studySettings.order === 'random') {
                if (this.shuffledIndices.length === 0) {
                    this.generateShuffledIndices();
                }
                this.currentWordIndex = this.shuffledIndices.length > 0 ? this.shuffledIndices[0] : 0;
            } else {
                this.currentWordIndex = 0;
            }
        }
        
        this.displayCurrentWord();
        this.updateStudyProgress();
    }

    // 生成随机索引数组
    generateShuffledIndices() {
        this.shuffledIndices = Array.from({length: this.filteredVocabulary.length}, (_, i) => i);
        // Fisher-Yates 洗牌算法
        for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledIndices[i], this.shuffledIndices[j]] = [this.shuffledIndices[j], this.shuffledIndices[i]];
        }
    }

    // 显示当前单词
    displayCurrentWord() {
        if (this.filteredVocabulary.length === 0) return;
        
        const word = this.filteredVocabulary[this.currentWordIndex];
        if (!word) return;
        
        document.getElementById('word-chinese').textContent = word.chinese;
        document.getElementById('word-english').textContent = word.english;
        
        // 更新类别标签
        const categoryLabelFront = document.getElementById('category-label-front');
        const categoryLabelBack = document.getElementById('category-label-back');
        if (categoryLabelFront) {
            categoryLabelFront.textContent = word.category || '综合概念';
        }
        if (categoryLabelBack) {
            categoryLabelBack.textContent = word.category || '综合概念';
        }
        
        // 重置卡片状态
        const flashcard = document.getElementById('flashcard');
        flashcard.classList.remove('flipped');
    }

    // 更新学习进度显示
    updateStudyProgress() {
        if (this.studySettings.order === 'random') {
            // 随机模式：显示当前在随机序列中的位置
            const currentPosition = this.shuffledIndices.indexOf(this.currentWordIndex) + 1;
            document.getElementById('current-index').textContent = currentPosition;
        } else {
            // 顺序模式：显示实际索引
            document.getElementById('current-index').textContent = this.currentWordIndex + 1;
        }
        document.getElementById('total-words').textContent = this.filteredVocabulary.length;
    }

    // 上一个单词
    previousWord() {
        if (this.filteredVocabulary.length === 0) return;
        
        if (this.studySettings.order === 'random') {
            // 随机模式：在随机序列中移动
            if (this.shuffledIndices.length === 0) {
                this.generateShuffledIndices();
            }
            const currentPosition = this.shuffledIndices.indexOf(this.currentWordIndex);
            if (currentPosition === -1) {
                // 如果当前索引不在随机序列中，重新生成并使用第一个
                this.generateShuffledIndices();
                this.currentWordIndex = this.shuffledIndices.length > 0 ? this.shuffledIndices[0] : 0;
            } else {
                const previousPosition = (currentPosition - 1 + this.shuffledIndices.length) % this.shuffledIndices.length;
                this.currentWordIndex = this.shuffledIndices[previousPosition];
            }
        } else {
            // 顺序模式：按原来的逻辑
            this.currentWordIndex = (this.currentWordIndex - 1 + this.filteredVocabulary.length) % this.filteredVocabulary.length;
        }
        this.displayCurrentWord();
        this.updateStudyProgress();
    }

    // 下一个单词
    nextWord() {
        if (this.filteredVocabulary.length === 0) return;
        
        if (this.studySettings.order === 'random') {
            // 随机模式：在随机序列中移动
            if (this.shuffledIndices.length === 0) {
                this.generateShuffledIndices();
            }
            const currentPosition = this.shuffledIndices.indexOf(this.currentWordIndex);
            if (currentPosition === -1) {
                // 如果当前索引不在随机序列中，重新生成并使用第一个
                this.generateShuffledIndices();
                this.currentWordIndex = this.shuffledIndices.length > 0 ? this.shuffledIndices[0] : 0;
            } else {
                const nextPosition = (currentPosition + 1) % this.shuffledIndices.length;
                this.currentWordIndex = this.shuffledIndices[nextPosition];
            }
        } else {
            // 顺序模式：按原来的逻辑
            this.currentWordIndex = (this.currentWordIndex + 1) % this.filteredVocabulary.length;
        }
        this.displayCurrentWord();
        this.updateStudyProgress();
    }

    // 标记为认识
    markAsKnown() {
        if (this.filteredVocabulary.length === 0) return;
        
        const word = this.filteredVocabulary[this.currentWordIndex];
        if (!word) return;
        
        this.userProgress[word.id].status = 'known';
        this.userProgress[word.id].reviewCount++;
        this.userProgress[word.id].lastReviewed = new Date().toISOString();
        
        this.saveUserProgress();
        this.updateStats();
        
        // 触发自动同步
        this.autoSync();
        
        this.nextWord();
    }

    // 标记为不认识
    markAsUnknown() {
        if (this.filteredVocabulary.length === 0) return;
        
        const word = this.filteredVocabulary[this.currentWordIndex];
        if (!word) return;
        
        this.userProgress[word.id].status = 'learning';
        this.userProgress[word.id].reviewCount++;
        this.userProgress[word.id].lastReviewed = new Date().toISOString();
        
        this.saveUserProgress();
        this.updateStats();
        
        // 触发自动同步
        this.autoSync();
        
        this.nextWord();
    }

    // 设置学习顺序
    setStudyOrder(order) {
        this.studySettings.order = order;
        
        // 更新按钮状态
        document.querySelectorAll('[data-order]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-order="${order}"]`).classList.add('active');
        
        // 如果切换到随机模式，重新生成随机索引
        if (order === 'random') {
            // 确保filteredVocabulary是最新的
            this.filterVocabularyByCategory();
            this.generateShuffledIndices();
        } else {
            // 如果切换到顺序模式，清空随机索引
            this.shuffledIndices = [];
        }
        
        // 重新初始化学习模式
        this.initStudyMode();
    }

    // 填充分类选择器
    populateCategorySelect() {
        const categorySelect = document.getElementById('categorySelect');
        if (!categorySelect || !this.metadata || !this.metadata.categories) return;
        
        // 清空现有选项（保留"全部分类"）
        categorySelect.innerHTML = '<option value="all">全部分类</option>';
        
        // 添加各个分类选项
        const categories = Object.keys(this.metadata.categories);
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = `${category} (${this.metadata.categories[category]}个)`;
            categorySelect.appendChild(option);
        });
    }

    // 设置学习分类
    setStudyCategory(category) {
        this.studySettings.category = category;
        this.filterVocabularyByCategory();
        this.initStudyMode();
    }

    // 根据分类筛选词汇
    filterVocabularyByCategory() {
        if (this.studySettings.category === 'all') {
            this.filteredVocabulary = [...this.vocabulary];
        } else {
            this.filteredVocabulary = this.vocabulary.filter(word => 
                word.category === this.studySettings.category
            );
        }
    }
    renderWordList(filteredWords = null) {
        const wordList = document.getElementById('word-list');
        if (!wordList) return;

        const wordsToShow = filteredWords || this.vocabulary;
        
        wordList.innerHTML = '';
        
        wordsToShow.forEach(word => {
            const progress = this.userProgress[word.id];
            const wordItem = document.createElement('div');
            wordItem.className = `word-item ${progress.status}`;
            
            wordItem.innerHTML = `
                <div class="word-english-text">${word.english}</div>
                <div class="word-chinese-text">${word.chinese}</div>
                <div class="word-category">分类: ${word.category || '综合概念'}</div>
                <span class="word-status status-${progress.status}">
                    ${this.getStatusText(progress.status)}
                </span>
            `;
            
            wordItem.addEventListener('click', () => {
                this.currentWordIndex = this.vocabulary.findIndex(w => w.id === word.id);
                this.showSection('study');
            });
            
            wordList.appendChild(wordItem);
        });
    }

    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            'unknown': '未学习',
            'learning': '学习中',
            'known': '已掌握'
        };
        return statusMap[status] || '未知';
    }

    // 搜索词汇
    filterWords(searchTerm) {
        const filtered = this.vocabulary.filter(word => 
            word.chinese.includes(searchTerm) || 
            word.english.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderWordList(filtered);
    }

    // 按状态筛选词汇
    filterWordsByStatus(status) {
        if (status === 'all') {
            this.renderWordList();
        } else {
            const filtered = this.vocabulary.filter(word => 
                this.userProgress[word.id].status === status
            );
            this.renderWordList(filtered);
        }
    }

    // 开始测试
    startTest() {
        // 隐藏设置界面，显示测试界面
        document.getElementById('test-settings').style.display = 'none';
        document.getElementById('test-container').style.display = 'block';
        
        this.generateTestQuestions();
        this.currentQuestionIndex = 0;
        this.testScore = 0;
        
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('test-result').style.display = 'none';
        document.getElementById('test-total').textContent = this.testSettings.questionCount;
        
        this.showCurrentQuestion();
    }

    // 生成测试题目
    generateTestQuestions() {
        const questionCount = Math.min(this.testSettings.questionCount, this.vocabulary.length);
        const shuffled = [...this.vocabulary].sort(() => Math.random() - 0.5);
        this.testQuestions = shuffled.slice(0, questionCount);
        
        this.testQuestions = this.testQuestions.map(word => {
            let questionData = {
                questionType: this.testSettings.questionType
            };

            // 根据题型生成题目
            if (this.testSettings.questionType === 'choice') {
                // 选择题：随机选择中翻英或英翻中
                const isChineseToEnglish = Math.random() > 0.5;
                const correctAnswer = isChineseToEnglish ? word.english : word.chinese;
                const question = isChineseToEnglish ? word.chinese : word.english;
                
                questionData.question = question;
                questionData.correctAnswer = correctAnswer;
                questionData.isChineseToEnglish = isChineseToEnglish;
                
                // 生成选项
                const wrongOptions = this.generateWrongOptions(correctAnswer, isChineseToEnglish);
                const options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
                questionData.options = options;
            } else if (this.testSettings.questionType === 'cn-to-en') {
                // 中翻英
                questionData.question = word.chinese;
                questionData.correctAnswer = word.english;
                questionData.isChineseToEnglish = true;
            } else if (this.testSettings.questionType === 'en-to-cn') {
                // 英翻中
                questionData.question = word.english;
                questionData.correctAnswer = word.chinese;
                questionData.isChineseToEnglish = false;
            }
            
            return questionData;
        });
    }

    // 生成错误选项
    generateWrongOptions(correctAnswer, isChineseToEnglish) {
        const allOptions = this.vocabulary.map(word => 
            isChineseToEnglish ? word.english : word.chinese
        ).filter(option => option !== correctAnswer);
        
        const shuffled = allOptions.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3);
    }

    // 显示当前题目
    showCurrentQuestion() {
        const question = this.testQuestions[this.currentQuestionIndex];
        if (!question) return;

        document.getElementById('question-text').textContent = question.question;
        document.getElementById('test-current').textContent = this.currentQuestionIndex + 1;

        // 隐藏所有题型界面
        document.getElementById('test-options').style.display = 'none';
        document.getElementById('translation-container').style.display = 'none';

        // 根据题型显示不同的界面
        if (question.questionType === 'choice') {
            // 显示选择题界面
            document.getElementById('test-options').style.display = 'flex';
            
            const optionsContainer = document.getElementById('test-options');
            optionsContainer.innerHTML = '';

            question.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                button.textContent = option;
                button.onclick = () => this.selectOption(button, option, question.correctAnswer);
                optionsContainer.appendChild(button);
            });
        } else if (question.questionType === 'cn-to-en' || question.questionType === 'en-to-cn') {
            // 显示翻译题界面
            document.getElementById('translation-container').style.display = 'flex';
            
            // 直接显示题目文本，不需要提示
            document.getElementById('question-text').textContent = question.question;
            
            const input = document.getElementById('translation-input');
            input.value = '';
            input.className = 'translation-input';
            input.placeholder = '请输入答案';
            
            // 重置反馈区域
            const feedback = document.getElementById('translation-feedback');
            feedback.style.display = 'none';
            feedback.className = 'feedback-area';
            
            // 显示提交按钮，隐藏下一题按钮
            document.getElementById('submit-translation-btn').style.display = 'inline-block';
            document.getElementById('next-btn').style.display = 'none';
            
            input.focus();
            
            // 添加回车键提交功能
            input.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    this.submitTranslation();
                }
            };
        }
    }

    // 选择选项
    selectOption(button, selectedOption, correctAnswer) {
        // 处理多个正确答案（用//分隔）
        const correctAnswers = correctAnswer.split('//').map(answer => answer.trim());
        const isCorrect = correctAnswers.includes(selectedOption);
        
        // 禁用所有选项
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
            // 检查按钮文本是否是任何一个正确答案
            if (correctAnswers.includes(btn.textContent)) {
                btn.classList.add('correct');
            } else if (btn === button && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });
        
        // 更新分数
        if (isCorrect) {
            this.testScore++;
        }
        
        // 显示下一题按钮
        document.getElementById('next-btn').style.display = 'inline-block';
    }

    // 下一题
    nextQuestion() {
        this.currentQuestionIndex++;
        
        // 重置翻译题输入框状态
        const input = document.getElementById('translation-input');
        if (input) {
            input.disabled = false;
        }
        
        // 隐藏正确答案显示区域
        const correctAnswerSection = document.getElementById('correct-answer-section');
        if (correctAnswerSection) {
            correctAnswerSection.style.display = 'none';
        }
        
        // 隐藏反馈区域
        const feedback = document.getElementById('translation-feedback');
        if (feedback) {
            feedback.style.display = 'none';
        }
        
        if (this.currentQuestionIndex >= this.testQuestions.length) {
            this.showTestResult();
        } else {
            this.showCurrentQuestion();
            // 隐藏下一题按钮
            document.getElementById('next-btn').style.display = 'none';
        }
    }

    // 显示测试结果
    showTestResult() {
        document.getElementById('test-container').style.display = 'none';
        document.getElementById('test-result').style.display = 'block';
        
        const percentage = Math.round((this.testScore / this.testQuestions.length) * 100);
        document.getElementById('test-score').textContent = `${this.testScore}/${this.testQuestions.length}`;
        document.getElementById('test-percentage').textContent = `${percentage}%`;
        
        // 根据分数显示不同的评价
        const resultMessage = document.getElementById('result-message');
        if (percentage >= 90) {
            resultMessage.textContent = '优秀！继续保持！';
            resultMessage.style.color = '#4CAF50';
        } else if (percentage >= 70) {
            resultMessage.textContent = '良好！还有提升空间！';
            resultMessage.style.color = '#FF9800';
        } else {
            resultMessage.textContent = '需要加强练习！';
            resultMessage.style.color = '#f44336';
        }
    }

    // 提交填空题答案
    submitTranslation() {
        const input = document.getElementById('translation-input');
        const userAnswer = input.value.trim();
        const question = this.testQuestions[this.currentQuestionIndex];
        const feedback = document.getElementById('translation-feedback');
        const feedbackText = document.getElementById('feedback-text');
        const correctAnswerSection = document.getElementById('correct-answer-section');
        const correctAnswerElement = document.getElementById('correct-answer');
        const submitBtn = document.getElementById('submit-translation-btn');
        
        if (!userAnswer) {
            // 显示输入提示
            input.style.borderColor = '#ef4444';
            input.placeholder = '请输入答案';
            input.focus();
            setTimeout(() => {
                input.placeholder = '请输入答案';
                input.style.borderColor = '#e2e8f0';
            }, 2000);
            return;
        }
        
        const isCorrect = this.checkTranslationAnswer(userAnswer, question.correctAnswer);
        
        // 显示反馈
        feedback.style.display = 'block';
        
        if (isCorrect) {
            input.className = 'translation-input correct';
            feedback.className = 'feedback-area correct';
            feedbackText.textContent = '回答正确！';
            correctAnswerSection.style.display = 'none';
            this.testScore++;
            
            // 正确时：隐藏提交按钮，显示下一题按钮
            submitBtn.style.display = 'none';
            document.getElementById('next-btn').style.display = 'inline-block';
        } else {
            input.className = 'translation-input incorrect';
            feedback.className = 'feedback-area incorrect';
            feedbackText.textContent = '回答错误';
            correctAnswerElement.textContent = question.correctAnswer;
            correctAnswerSection.style.display = 'block';
            
            // 错误时：也隐藏提交按钮，显示下一题按钮
            submitBtn.style.display = 'none';
            document.getElementById('next-btn').style.display = 'inline-block';
        }
        
        // 禁用输入框
        input.disabled = true;
    }

    // 检查翻译题答案
    checkTranslationAnswer(userAnswer, correctAnswer) {
        // 处理多个正确答案（用//分隔）
        const correctAnswers = correctAnswer.split('//').map(answer => answer.trim());
        
        // 对每个可能的正确答案进行检查
        for (const answer of correctAnswers) {
            if (this.checkSingleAnswer(userAnswer, answer)) {
                return true;
            }
        }
        
        return false;
    }
    
    checkSingleAnswer(userAnswer, correctAnswer) {
        // 去除空格并转换为小写进行比较
        const normalizedUser = userAnswer.toLowerCase().replace(/\s+/g, '');
        const normalizedCorrect = correctAnswer.toLowerCase().replace(/\s+/g, '');
        
        // 完全匹配
        if (normalizedUser === normalizedCorrect) {
            return true;
        }
        
        // 对于英文答案，检查是否包含主要单词
        if (/^[a-zA-Z\s]+$/.test(correctAnswer)) {
            const userWords = normalizedUser.split(/[^a-z]+/).filter(w => w.length > 2);
            const correctWords = normalizedCorrect.split(/[^a-z]+/).filter(w => w.length > 2);
            
            // 如果用户答案包含了正确答案的主要单词，也算正确
            return correctWords.some(word => userWords.includes(word));
        }
        
        return false;
    }

    // 处理测试模块的返回逻辑
    handleTestBack() {
        const testContainer = document.getElementById('test-container');
        const testSettings = document.getElementById('test-settings');
        
        // 如果当前在测试进行中，返回到测试设置页面
        if (testContainer.style.display !== 'none') {
            this.backToSettings();
        } else {
            // 如果在测试设置页面，返回到首页
            this.showSection('home');
        }
    }

    // 返回设置界面
    backToSettings() {
        document.getElementById('test-settings').style.display = 'block';
        document.getElementById('test-container').style.display = 'none';
    }

    // 重新开始测试
    restartTest() {
        this.startTest();
    }
}

// 全局函数（供HTML调用）
let app;

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app = new VocabularyApp();
});

// 全局函数
function showSection(sectionName) {
    if (app) {
        app.showSection(sectionName);
    }
}

function previousWord() {
    if (app) {
        app.previousWord();
    }
}

function nextWord() {
    if (app) {
        app.nextWord();
    }
}

function markAsKnown() {
    if (app) {
        app.markAsKnown();
    }
}

function markAsUnknown() {
    if (app) {
        app.markAsUnknown();
    }
}

function setStudyCategory(category) {
    if (app) {
        app.setStudyCategory(category);
    }
}

function setStudyOrder(order) {
    if (app) {
        app.setStudyOrder(order);
    }
}

function startTest() {
    if (app) {
        app.startTest();
    }
}

function nextQuestion() {
    if (app) {
        app.nextQuestion();
    }
}

// 全局函数，供HTML调用
function submitTranslation() {
    if (app) {
        app.submitTranslation();
    }
}

function handleTestBack() {
    if (app) {
        app.handleTestBack();
    }
}

function backToSettings() {
    if (app) {
        app.backToSettings();
    }
}

function restartTest() {
    if (app) {
        app.restartTest();
    }
}

// 云同步相关的全局函数
function saveSyncSettings() {
    const token = document.getElementById('gist-token').value.trim();
    const gistId = document.getElementById('gist-id').value.trim();
    const autoSync = document.getElementById('auto-sync').checked;
    
    if (!token) {
        alert('请输入GitHub访问令牌');
        return;
    }
    
    app.syncSettings.accessToken = token;
    app.syncSettings.gistId = gistId || null;
    app.syncSettings.autoSync = autoSync;
    app.syncSettings.enabled = true;
    
    app.saveSyncSettings();
    updateSyncStatus();
    
    alert('同步设置已保存');
}

function testSync() {
    if (!app.syncSettings.enabled || !app.syncSettings.accessToken) {
        alert('请先配置并保存同步设置');
        return;
    }
    
    // 测试GitHub API连接
    fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `token ${app.syncSettings.accessToken}`
        }
    })
    .then(response => {
        if (response.ok) {
            alert('连接测试成功！');
            updateSyncStatus();
        } else {
            throw new Error(`连接失败: ${response.status}`);
        }
    })
    .catch(error => {
        alert(`连接测试失败: ${error.message}`);
    });
}

function manualSync() {
    if (!app.syncSettings.enabled) {
        alert('请先启用云同步');
        return;
    }
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '同步中...';
    button.disabled = true;
    
    app.manualSync()
        .then(result => {
            alert(result.message);
            updateSyncStatus();
        })
        .catch(error => {
            alert(`同步失败: ${error.message}`);
        })
        .finally(() => {
            button.textContent = originalText;
            button.disabled = false;
        });
}

function updateSyncStatus() {
    const statusText = document.getElementById('sync-status-text');
    const lastSyncTime = document.getElementById('last-sync-time');
    
    if (statusText) {
        if (app.syncSettings.enabled) {
            statusText.textContent = '已配置';
            statusText.style.color = '#059669';
        } else {
            statusText.textContent = '未配置';
            statusText.style.color = '#dc2626';
        }
    }
    
    if (lastSyncTime) {
        if (app.syncSettings.lastSyncTime) {
            const date = new Date(app.syncSettings.lastSyncTime);
            lastSyncTime.textContent = date.toLocaleString('zh-CN');
        } else {
            lastSyncTime.textContent = '从未同步';
        }
    }
}

function loadSyncSettingsUI() {
    const tokenInput = document.getElementById('gist-token');
    const gistIdInput = document.getElementById('gist-id');
    const autoSyncCheckbox = document.getElementById('auto-sync');
    
    if (tokenInput && app.syncSettings.accessToken) {
        tokenInput.value = app.syncSettings.accessToken;
    }
    
    if (gistIdInput && app.syncSettings.gistId) {
        gistIdInput.value = app.syncSettings.gistId;
    }
    
    if (autoSyncCheckbox) {
        autoSyncCheckbox.checked = app.syncSettings.autoSync;
    }
    
    updateSyncStatus();
}

// 在页面加载完成后初始化同步设置UI
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadSyncSettingsUI();
    }, 100);
});