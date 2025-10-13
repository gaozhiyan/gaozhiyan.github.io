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
        
        this.init();
    }

    async init() {
        await this.loadVocabulary();
        this.loadUserProgress();
        this.updateStats();
        this.setupEventListeners();
        this.renderWordList();
    }

    // 加载词汇数据
    async loadVocabulary() {
        try {
            const response = await fetch('思政词汇300个.csv');
            const csvText = await response.text();
            this.parseCSV(csvText);
        } catch (error) {
            console.error('加载词汇数据失败:', error);
            // 如果无法加载CSV，使用示例数据
            this.vocabulary = [
                { chinese: '习近平新时代中国特色社会主义思想', english: 'Xi Jinping Thought on Socialism with Chinese Characteristics for a New Era' },
                { chinese: '中国共产党', english: 'the Communist Party of China (the CPC)' },
                { chinese: '中国梦', english: 'Chinese Dream' }
            ];
        }
    }

    // 解析CSV数据
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        this.vocabulary = [];
        
        for (let i = 1; i < lines.length; i++) { // 跳过标题行
            const line = lines[i].trim();
            if (line) {
                const columns = line.split(',');
                if (columns.length >= 2 && columns[0] && columns[1]) {
                    this.vocabulary.push({
                        id: i - 1,
                        chinese: columns[0].trim(),
                        english: columns[1].trim()
                    });
                }
            }
        }
    }

    // 加载用户学习进度
    loadUserProgress() {
        const saved = localStorage.getItem('vocabularyProgress');
        if (saved) {
            this.userProgress = JSON.parse(saved);
        } else {
            this.userProgress = {};
            this.vocabulary.forEach(word => {
                this.userProgress[word.id] = {
                    status: 'unknown', // unknown, learning, known
                    reviewCount: 0,
                    lastReviewed: null
                };
            });
        }
    }

    // 保存用户进度
    saveUserProgress() {
        localStorage.setItem('vocabularyProgress', JSON.stringify(this.userProgress));
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
        }
    }

    // 初始化学习模式
    initStudyMode() {
        // 找到下一个需要学习的词汇
        const unknownWords = this.vocabulary.filter(word => 
            this.userProgress[word.id].status === 'unknown'
        );
        
        if (unknownWords.length > 0) {
            this.currentWordIndex = this.vocabulary.findIndex(word => word.id === unknownWords[0].id);
        } else {
            // 如果没有未学习的词汇，随机选择一个
            this.currentWordIndex = Math.floor(Math.random() * this.vocabulary.length);
        }
        
        this.displayCurrentWord();
        this.updateStudyProgress();
    }

    // 显示当前单词
    displayCurrentWord() {
        const word = this.vocabulary[this.currentWordIndex];
        if (word) {
            document.getElementById('word-chinese').textContent = word.chinese;
            document.getElementById('word-english').textContent = word.english;
            
            // 重置卡片状态
            const flashcard = document.getElementById('flashcard');
            flashcard.classList.remove('flipped');
        }
    }

    // 更新学习进度显示
    updateStudyProgress() {
        document.getElementById('current-index').textContent = this.currentWordIndex + 1;
        document.getElementById('total-words').textContent = this.vocabulary.length;
    }

    // 上一个单词
    previousWord() {
        this.currentWordIndex = (this.currentWordIndex - 1 + this.vocabulary.length) % this.vocabulary.length;
        this.displayCurrentWord();
        this.updateStudyProgress();
    }

    // 下一个单词
    nextWord() {
        this.currentWordIndex = (this.currentWordIndex + 1) % this.vocabulary.length;
        this.displayCurrentWord();
        this.updateStudyProgress();
    }

    // 标记为认识
    markAsKnown() {
        const word = this.vocabulary[this.currentWordIndex];
        this.userProgress[word.id].status = 'known';
        this.userProgress[word.id].reviewCount++;
        this.userProgress[word.id].lastReviewed = new Date().toISOString();
        
        this.saveUserProgress();
        this.updateStats();
        this.nextWord();
    }

    // 标记为不认识
    markAsUnknown() {
        const word = this.vocabulary[this.currentWordIndex];
        this.userProgress[word.id].status = 'learning';
        this.userProgress[word.id].reviewCount++;
        this.userProgress[word.id].lastReviewed = new Date().toISOString();
        
        this.saveUserProgress();
        this.updateStats();
        this.nextWord();
    }

    // 渲染词汇列表
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
                <div class="word-chinese-text">${word.chinese}</div>
                <div class="word-english-text">${word.english}</div>
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
        this.generateTestQuestions();
        this.currentQuestionIndex = 0;
        this.testScore = 0;
        
        document.querySelector('.test-controls .btn-primary').style.display = 'none';
        document.getElementById('next-btn').style.display = 'inline-block';
        document.getElementById('test-result').style.display = 'none';
        
        this.showCurrentQuestion();
    }

    // 生成测试题目
    generateTestQuestions() {
        const questionCount = Math.min(10, this.vocabulary.length);
        const shuffled = [...this.vocabulary].sort(() => Math.random() - 0.5);
        this.testQuestions = shuffled.slice(0, questionCount);
        
        this.testQuestions = this.testQuestions.map(word => {
            const isChineseToEnglish = Math.random() > 0.5;
            const correctAnswer = isChineseToEnglish ? word.english : word.chinese;
            const question = isChineseToEnglish ? word.chinese : word.english;
            
            // 生成错误选项
            const wrongOptions = this.generateWrongOptions(correctAnswer, isChineseToEnglish);
            const options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
            
            return {
                question,
                options,
                correctAnswer,
                isChineseToEnglish
            };
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
        
        document.getElementById('question-text').textContent = question.question;
        document.getElementById('test-current').textContent = this.currentQuestionIndex + 1;
        document.getElementById('test-total').textContent = this.testQuestions.length;
        
        const optionsContainer = document.getElementById('test-options');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.addEventListener('click', () => this.selectOption(button, option, question.correctAnswer));
            optionsContainer.appendChild(button);
        });
    }

    // 选择选项
    selectOption(button, selectedOption, correctAnswer) {
        // 禁用所有选项
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            } else if (btn === button && selectedOption !== correctAnswer) {
                btn.classList.add('incorrect');
            }
        });
        
        // 更新分数
        if (selectedOption === correctAnswer) {
            this.testScore++;
        }
        
        // 显示下一题按钮
        document.getElementById('next-btn').style.display = 'inline-block';
    }

    // 下一题
    nextQuestion() {
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.testQuestions.length) {
            this.showTestResult();
        } else {
            this.showCurrentQuestion();
            document.getElementById('next-btn').style.display = 'none';
        }
    }

    // 显示测试结果
    showTestResult() {
        const accuracy = Math.round((this.testScore / this.testQuestions.length) * 100);
        
        document.getElementById('accuracy').textContent = `${accuracy}%`;
        document.getElementById('correct-count').textContent = this.testScore;
        document.getElementById('question-count').textContent = this.testQuestions.length;
        
        document.querySelector('.test-question').style.display = 'none';
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('test-result').style.display = 'block';
    }

    // 重新开始测试
    restartTest() {
        document.querySelector('.test-question').style.display = 'block';
        document.querySelector('.test-controls .btn-primary').style.display = 'inline-block';
        document.getElementById('test-result').style.display = 'none';
        
        // 重置题目显示
        document.getElementById('question-text').textContent = '准备开始测试';
        document.getElementById('test-options').innerHTML = '';
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

function restartTest() {
    if (app) {
        app.restartTest();
    }
}