// client.js

// --- DOM 元素获取 ---
const userInputElement = document.getElementById('userInput');
const responseElement = document.getElementById('response');
const sendButton = document.getElementById('sendButton');

// --- 函数：发送请求到 Netlify Function ---
async function sendRequest() {
    const userInput = userInputElement.value.trim();
    if (!userInput) {
        responseElement.innerHTML = '<div class="error">请输入内容后再发送。</div>';
        return;
    }

    // --- UI 更新：请求开始 ---
    responseElement.innerHTML = '<div class="loading">正在思考中...</div>';
    sendButton.disabled = true;
    userInputElement.disabled = true;
    userInputElement.value = '';

    try {
        const response = await fetch('/.netlify/functions/coze-proxy?data=' + encodeURIComponent(userInput));
        
        if (!response.ok) {
            throw new Error(`请求失败 (${response.status})`);
        }

        // 创建消息div
        responseElement.innerHTML = '<div class="message"></div>';
        const messageDiv = responseElement.querySelector('.message');

        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, {stream: true});
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                            messageDiv.textContent += data.choices[0].delta.content;
                        }
                    } catch (e) {
                        console.error('解析响应数据失败:', e);
                    }
                }
            }
        }

    } catch (error) {
        console.error('请求失败:', error);
        responseElement.innerHTML = `<div class="error">请求出错: ${error.message}</div>`;
    } finally {
        sendButton.disabled = false;
        userInputElement.disabled = false;
        userInputElement.focus();
    }
}

// --- 事件监听：按钮点击 ---
sendButton.addEventListener('click', sendRequest);

// --- 事件监听：输入框回车 ---
userInputElement.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendRequest();
    }
});