// --- 配置 ---
const API_URL = 'https://api.coze.cn/v3/chat';
const BOT_ID = '7496404783675637779'; // 你的 Bot ID
// 使用您最新提供的 Token
const TOKEN = 'pat_5QA0HWsGtjPGB9EG52bDL9MwQhEDHimTpTbli7iMZnaexhFIwhB7oopanl9TXuv2';

// --- DOM 元素获取 ---
const userInputElement = document.getElementById('userInput');
const responseElement = document.getElementById('response');
const sendButton = document.getElementById('sendButton');

// --- 函数：发送请求 ---
async function sendRequest() {
    const userInput = userInputElement.value.trim();
    if (!userInput) {
        responseElement.innerHTML = '<div class="error">请输入内容后再发送。</div>';
        return;
    }

    // --- UI 更新：请求开始 ---
    responseElement.innerHTML = '<div class="loading">正在思考中...</div>'; // 显示加载提示
    sendButton.disabled = true; // 禁用发送按钮
    userInputElement.disabled = true; // 禁用输入框

    let fullContent = ''; // 用于累积流式响应内容

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': '*/*', // 明确接受任何类型
                'Connection': 'keep-alive' // 保持连接
            },
            body: JSON.stringify({
                bot_id: BOT_ID,
                user_id: 'user_' + Date.now(), // 简单唯一用户ID
                stream: true, // **确保开启流式响应**
                auto_save_history: true,
                additional_messages: [
                    {
                        role: 'user',
                        content: userInput, // 将用户输入放入 content
                        content_type: 'text'
                    }
                ]
            })
        });

        // --- 检查响应状态 ---
        if (!response.ok) {
            let errorBody = `HTTP 错误 ${response.status}`;
            try {
                const errorData = await response.json(); // 尝试解析 JSON 错误体
                errorBody = errorData.msg || JSON.stringify(errorData); // 优先使用 msg 字段
                 // 检查是否是 Token 错误
                 if (response.status === 401 || (errorData.code && errorData.code === 4101)) {
                     errorBody = `令牌(Token)无效或错误 (Code: ${errorData.code || response.status})，请检查 API Token 配置。`;
                 }
            } catch (e) {
                console.warn("无法解析 JSON 错误响应体:", e);
                // 如果无法解析 JSON，保留原始状态码错误
            }
            throw new Error(`请求失败: ${errorBody}`);
        }

        // --- 处理流式响应 ---
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let currentEventType = null; // 用于存储当前行的事件类型

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log('Stream finished.');
                break; // 读取完成
            }

            const chunk = decoder.decode(value, { stream: true });
            // console.log("Received chunk:", chunk); // 调试时取消注释

            // 按行处理 SSE 数据块
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('event:')) {
                    // 记录当前事件类型
                    currentEventType = line.substring(6).trim();
                    continue; // 处理下一行
                } else if (line.startsWith('data:')) {
                    const jsonData = line.substring(5).trim();
                    if (jsonData === '[DONE]') {
                        console.log('Received [DONE] marker.');
                        currentEventType = null; // 重置事件类型
                        continue;
                    }
                    if (!jsonData) {
                        currentEventType = null; // 重置事件类型（空 data 行后）
                        continue; // 跳过空的 data 行
                    }

                    try {
                        const data = JSON.parse(jsonData);
                        // console.log("Parsed data:", data, "Event type:", currentEventType); // 调试时取消注释

                        // *** 修改：只在事件类型是 delta 时处理 content ***
                        if (currentEventType === 'conversation.message.delta' && data.type === 'answer' && data.content) {
                            // 处理 delta 事件中的 content
                            fullContent += data.content;

                            // 查找或创建 message div
                            let messageDiv = responseElement.querySelector('.message');
                            if (!messageDiv) {
                                responseElement.innerHTML = '<div class="message"></div>';
                                messageDiv = responseElement.querySelector('.message');
                            }
                            // 更新 textContent
                            messageDiv.textContent = fullContent;
                        }
                        // 处理可能的错误事件 (保持不变)
                        else if (data.event === 'error' || data.type === 'error' || currentEventType === 'error') { // 检查多种可能的错误标识
                            console.error('API Stream Error Event:', data, "Event type:", currentEventType);
                            const errorMsg = data.error?.message || data.message || '未知流错误';
                             // 查找或创建 message div 以追加错误
                             let messageDiv = responseElement.querySelector('.message');
                              if (!messageDiv && !responseElement.querySelector('.error')) { // 避免重复添加 message div
                                  responseElement.innerHTML = '<div class="message"></div>';
                              }
                             // 追加错误信息，确保不重复添加
                             if (!responseElement.innerHTML.includes(escapeHtml(errorMsg))) {
                                responseElement.innerHTML += `<div class="error">流处理错误: ${escapeHtml(errorMsg)} (Code: ${data.error?.code || data.code ||'N/A'})</div>`;
                             }
                        }
                        // 可以根据需要处理其他事件类型

                    } catch (e) {
                        console.warn('解析 JSON 出错:', e, '原始 JSON 字符串:', jsonData, '原始行:', line);
                    } finally {
                         // 处理完 data 行后重置事件类型，为下一对 event/data 做准备
                         currentEventType = null;
                    }
                } else {
                     // 如果行既不以 event: 也不以 data: 开头，也重置事件类型
                     currentEventType = null;
                }
            }
             // 滚动到底部
             responseElement.scrollTop = responseElement.scrollHeight;
        }

        // --- 检查最终是否有内容（流结束后） ---
        // 如果 loading 还在，并且没有 message 或 error，说明收到了响应但无有效内容
        if (responseElement.querySelector('.loading') && !responseElement.querySelector('.message') && !responseElement.querySelector('.error')) {
            responseElement.innerHTML = '<div class="message">已收到响应，但无文本内容返回。</div>';
        } else if (responseElement.querySelector('.loading')) {
             // 如果有内容了，移除 loading 提示
             responseElement.querySelector('.loading').remove();
        }


    } catch (error) {
        console.error('API 请求或处理出错:', error);
        // 显示错误信息，优先显示解析出的错误，否则显示捕获的错误消息
        responseElement.innerHTML = `<div class="error">请求出错: ${escapeHtml(error.message)}</div>`;
    } finally {
        // --- UI 更新：请求结束 ---
        sendButton.disabled = false; // 重新启用发送按钮
        userInputElement.disabled = false; // 重新启用输入框
        // 确保 loading 提示被移除（以防万一）
        const loadingElement = responseElement.querySelector('.loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
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

// --- 事件监听：按钮点击 ---
sendButton.addEventListener('click', sendRequest);

// --- 事件监听：输入框回车 (优化：仅当 Enter 且非 Shift+Enter 时发送) ---
userInputElement.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // 阻止默认的换行行为
        sendRequest(); // 调用发送函数
    }
});