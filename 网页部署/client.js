// client.js

// --- DOM 元素获取 ---
const userInputElement = document.getElementById('userInput');
const responseElement = document.getElementById('response');
const sendButton = document.getElementById('sendButton');

// 配置 coze token 和 bot id，前端直接请求 Coze API
const COZE_API_URL = 'https://api.coze.cn/v3/chat';
const COZE_BOT_ID = '7496404783675637779';
const COZE_API_TOKEN = 'pat_uPNHfKdabKSn3Nkr6Rc6I6opI7ZndyZqSKseT67tGYmRzfECZas49fDf232aOjpl';

// --- 辅助函数：创建并添加消息 ---
function addMessage(content, type = 'bot') { // type 可以是 'bot', 'user', 'error', 'loading'
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    if (type === 'user') {
        messageDiv.classList.add('user');
        messageDiv.textContent = content; // 用户消息直接设置文本
    } else if (type === 'error') {
        messageDiv.classList.add('error');
        messageDiv.textContent = content;
    } else if (type === 'loading') {
        messageDiv.classList.add('loading');
        messageDiv.textContent = content || '正在思考中...'; // 加载提示
    } else { // 'bot'
        // Bot 消息初始为空，内容通过流式响应填充
        messageDiv.textContent = '';
    }

    // 移除旧的加载提示（如果存在）
    const existingLoading = responseElement.querySelector('.loading');
    if (existingLoading && type !== 'loading') {
        existingLoading.remove();
    }

    // 移除旧的错误提示（如果存在）
    const existingError = responseElement.querySelector('.error');
    if (existingError && type !== 'error') {
        existingError.remove();
    }

    // 移除欢迎消息（如果存在且是第一条用户消息之后）
    const welcomeMessage = responseElement.querySelector('.welcome');
    if (welcomeMessage && (type === 'user' || type === 'bot')) {
        welcomeMessage.remove();
    }


    responseElement.appendChild(messageDiv);
    // 滚动到底部
    responseElement.scrollTop = responseElement.scrollHeight;
    return messageDiv; // 返回创建的元素，用于流式填充
}

// --- 辅助函数：HTML 转义 (防止 XSS) ---
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// --- 修改版：直接调用 Coze API 的函数 ---
async function requestCozeDirectly(userInput) {
    try {
        const loadingMessageDiv = addMessage('正在思考中...', 'loading'); // 显示加载提示
        let botMessageDiv = null; // 用于存储机器人回复的 div
        let currentBotContent = ''; // 用于累积机器人回复内容

        // 构建请求体
        const requestBody = {
            bot_id: COZE_BOT_ID,
            user_id: 'browser-user-' + Date.now(),
            stream: true, // 启用流式响应
            auto_save_history: false,
            additional_messages: [
                {
                    role: 'user',
                    content: userInput,
                    content_type: 'text'
                }
            ]
        };

        // 发起 API 请求
        const response = await fetch(COZE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${COZE_API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Coze API 请求失败 (${response.status}): ${await response.text()}`);
        }

        // 移除加载提示
        if (loadingMessageDiv) loadingMessageDiv.remove();
        // 创建机器人消息 div
        botMessageDiv = addMessage('', 'bot');

        // 读取流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, {stream: true});
            console.log("收到块:", chunk);
            
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonData = line.slice(6).trim();
                    if (jsonData) {
                        try {
                            const data = JSON.parse(jsonData);
                            console.log("解析的数据:", data);
                            
                            if (data.message && data.message.type === 'answer' && data.message.content) {
                                // 这是非流式部分（如果API混合返回）
                                currentBotContent += data.message.content;
                            } else if (data.type === 'stream.text.delta' && data.data) {
                                // Coze 新版流式事件 delta
                                currentBotContent += data.data;
                            } else if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                                // 兼容旧的 OpenAI 格式 delta
                                currentBotContent += data.choices[0].delta.content;
                            }
                            
                            // 更新机器人消息内容
                            if (botMessageDiv) {
                                botMessageDiv.textContent = currentBotContent;
                                // 滚动到底部
                                responseElement.scrollTop = responseElement.scrollHeight;
                            }
                        } catch (e) {
                            console.error('解析响应数据失败:', line, e);
                        }
                    }
                } else if (line.startsWith('event: error')) {
                    console.error('收到错误事件:', line);
                } else if (line.startsWith('event: stream_end')) {
                    console.log('流结束事件收到');
                }
            }
        }

        return true; // 成功完成
    } catch (error) {
        console.error('API 请求出错:', error);
        addMessage(`请求出错: ${error.message}`, 'error');
        return false;
    }
}

// --- 函数：尝试通过 Netlify Function 发送请求 ---
async function requestViaNetlify(userInput) {
    try {
        const response = await fetch('/.netlify/functions/coze-proxy?data=' + encodeURIComponent(userInput));
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`请求失败 (${response.status}): ${escapeHtml(errorText) || '未知错误'}`);
        }
        
        // 这里我们不会处理返回的初始消息，因为它只是一个占位符
        // 我们将立即切换到直接调用 Coze API
        return true;
    } catch (error) {
        console.warn('Netlify 函数请求失败, 切换到直接请求:', error);
        return false;
    }
}

// --- 函数：发送请求 ---
async function sendRequest() {
    const userInput = userInputElement.value.trim();
    if (!userInput) {
        // 可以选择性地给输入框一个抖动提示
        userInputElement.style.animation = 'shake 0.5s ease';
        setTimeout(() => userInputElement.style.animation = '', 500);
        return;
    }

    // --- UI 更新：请求开始 ---
    sendButton.disabled = true;
    userInputElement.disabled = true;
    addMessage(userInput, 'user'); // 显示用户发送的消息
    userInputElement.value = ''; // 清空输入框
    adjustTextareaHeight(); // 重置输入框高度

    try {
        // 先尝试通过 Netlify 函数发送
        const netlifySuccess = await requestViaNetlify(userInput);
        
        // 如果 Netlify 函数失败，直接调用 Coze API
        if (!netlifySuccess) {
            await requestCozeDirectly(userInput);
        }
    } catch (error) {
        console.error('请求处理出错:', error);
        addMessage(`请求出错: ${error.message}`, 'error');
    } finally {
        sendButton.disabled = false;
        userInputElement.disabled = false;
        userInputElement.focus();
    }
}

// --- 函数：动态调整 Textarea 高度 ---
function adjustTextareaHeight() {
    userInputElement.style.height = 'auto'; // 重置高度以获取 scrollHeight
    userInputElement.style.height = (userInputElement.scrollHeight) + 'px'; // 设置为内容的实际高度
}

// --- 事件监听：按钮点击 ---
sendButton.addEventListener('click', sendRequest);

// --- 事件监听：输入框回车 ---
userInputElement.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) { // Shift+Enter 换行
        event.preventDefault(); // 阻止默认的回车换行
        sendRequest();
    }
});

// --- 事件监听：输入框输入时调整高度 ---
userInputElement.addEventListener('input', adjustTextareaHeight);

// --- 初始化调整一次高度 ---
adjustTextareaHeight();

// --- 添加 CSS 动画（可选的输入框抖动） ---
const styleSheet = document.styleSheets[0];
try {
    styleSheet.insertRule(`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `, styleSheet.cssRules.length);
} catch (e) {
    console.warn("Could not insert shake animation rule:", e);
}

// --- 移除初始欢迎消息（如果用户开始输入） ---
userInputElement.addEventListener('input', () => {
    const welcomeMessage = responseElement.querySelector('.welcome');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
}, { once: true }); // 只触发一次