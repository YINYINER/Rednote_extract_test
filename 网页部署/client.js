// client.js

// --- DOM 元素获取 ---
const userInputElement = document.getElementById('userInput');
const responseElement = document.getElementById('response');
const sendButton = document.getElementById('sendButton');

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

// --- 函数：发送请求到 Netlify Function ---
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

    const loadingMessageDiv = addMessage('正在思考中...', 'loading'); // 显示加载提示

    let botMessageDiv = null; // 用于存储机器人回复的 div
    let currentBotContent = ''; // 用于累积机器人回复内容

    try {
        const response = await fetch('/.netlify/functions/coze-proxy?data=' + encodeURIComponent(userInput));

        if (!response.ok) {
            const errorText = await response.text(); // 尝试读取错误文本
            throw new Error(`请求失败 (${response.status}): ${escapeHtml(errorText) || '未知错误'}`);
        }

        // 移除加载提示
        if (loadingMessageDiv) loadingMessageDiv.remove();
        // 创建机器人消息 div
        botMessageDiv = addMessage('', 'bot');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, {stream: true});
            // console.log("Chunk:", chunk); // 调试用
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonData = line.slice(6).trim();
                    if (jsonData) {
                        try {
                            const data = JSON.parse(jsonData);
                            // console.log("Data:", data); // 调试用
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
                            // 可以在这里添加一个错误提示到界面
                        }
                    }
                } else if (line.startsWith('event: error')) {
                     console.error('Received error event from stream');
                     // 可以在这里处理流中的错误事件
                } else if (line.startsWith('event: stream_end')) {
                    console.log('Stream ended event received.');
                    // 可以在这里处理流结束事件，例如确保按钮可用
                }
            }
        }

    } catch (error) {
        console.error('请求失败:', error);
        // 移除加载提示
        if (loadingMessageDiv) loadingMessageDiv.remove();
        // 移除可能已部分显示的机器人回复
        if (botMessageDiv) botMessageDiv.remove();
        addMessage(`请求出错: ${error.message}`, 'error'); // 显示错误消息
    } finally {
        sendButton.disabled = false;
        userInputElement.disabled = false;
        userInputElement.focus();
        // 确保滚动到底部
        responseElement.scrollTop = responseElement.scrollHeight;
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