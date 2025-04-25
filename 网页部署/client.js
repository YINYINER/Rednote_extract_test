// client.js

// --- 配置 ---
// !!! 将下面的 URL 替换为你部署的 Cloudflare Worker 的 URL !!!
const WORKER_URL = 'https://rednote-extract-test.wyc657860729.workers.dev/'; // 例如: https://coze-proxy.yourname.workers.dev

// --- DOM 元素获取 ---
const userInputElement = document.getElementById('userInput');
const responseElement = document.getElementById('response');
const sendButton = document.getElementById('sendButton');

// --- 函数：发送请求到 Worker ---
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
    userInputElement.value = ''; // 清空输入框

    let fullContent = ''; // 用于累积流式响应内容
    let messageDiv = null; // 用于缓存 message div 元素

    try {
        // --- 构建 Worker URL (包含用户输入) ---
        const requestUrl = new URL(WORKER_URL);
        requestUrl.searchParams.append('data', userInput); // 将输入作为 data 参数

        // --- 发送 GET 请求到 Worker ---
        const response = await fetch(requestUrl.toString(), { // 注意这里是 GET 请求
            method: 'GET',
            headers: {
                'Accept': 'text/event-stream' // 明确希望接收 SSE
            }
        });

        // --- 检查 Worker 响应状态 ---
        if (!response.ok) {
            // 如果 Worker 返回错误状态码，尝试读取错误文本
            const errorText = await response.text();
            throw new Error(`请求 Worker 失败 (${response.status}): ${errorText}`);
        }

        // --- 处理来自 Worker 的流式响应 ---
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let currentEventType = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log('Worker stream finished.');
                break; // 读取完成
            }

            const chunk = decoder.decode(value, { stream: true });
            console.log("Received chunk from Worker:", chunk); // <--- 增加日志：原始数据块

            // 按行处理 SSE 数据块
            const lines = chunk.split('\n');
            for (const line of lines) {
                console.log("Processing line:", line); // <--- 增加日志：正在处理的行
                if (line.startsWith('event:')) {
                    currentEventType = line.substring(6).trim();
                    console.log("Detected event type:", currentEventType); // <--- 增加日志：事件类型
                    continue;
                } else if (line.startsWith('data:')) {
                    const jsonData = line.substring(5).trim();
                    console.log("Raw data content:", jsonData); // <--- 增加日志：原始数据内容
                    if (jsonData === '[DONE]') {
                        console.log('Received [DONE] marker from Worker.');
                        currentEventType = null;
                        continue;
                    }
                    if (!jsonData) {
                        currentEventType = null;
                        continue;
                    }

                    try {
                        const data = JSON.parse(jsonData);
                         console.log("Parsed data:", data); // <--- 增加日志：解析后的数据

                        // 只处理 delta 事件中的 content
                        if (currentEventType === 'conversation.message.delta' && data.type === 'answer' && data.content) {
                            console.log("Appending content:", data.content); // <--- 增加日志：追加的内容
                            fullContent += data.content;

                            // 查找或创建 message div (优化：只在第一次创建)
                            if (!messageDiv) {
                                responseElement.innerHTML = '<div class="message"></div>';
                                messageDiv = responseElement.querySelector('.message');
                            }
                            // 更新 textContent
                            if (messageDiv) { // 确保 messageDiv 存在
                                messageDiv.textContent = fullContent;
                            }
                        }
                        // 处理可能的错误事件
                        else if (data.event === 'error' || data.type === 'error' || currentEventType === 'error') {
                            console.error('Worker Stream Error Event:', data, "Event type:", currentEventType);
                            const errorMsg = data.error?.message || data.message || '未知流错误';
                             // 查找或创建 message div 以追加错误
                             if (!messageDiv && !responseElement.querySelector('.error')) {
                                 responseElement.innerHTML = '<div class="message"></div>'; // 可能需要一个基础div来放错误
                             }
                             // 追加错误信息，确保不重复添加
                             if (!responseElement.innerHTML.includes(escapeHtml(errorMsg))) {
                                responseElement.innerHTML += `<div class="error">流处理错误: ${escapeHtml(errorMsg)} (Code: ${data.error?.code || data.code ||'N/A'})</div>`;
                             }
                        }

                    } catch (e) {
                        console.error('JSON Parsing Error:', e, 'Raw JSON:', jsonData, 'Original line:', line); // <--- 增加日志：解析错误
                        // 如果解析失败，可以考虑将原始行显示出来
                        if (!responseElement.innerHTML.includes('解析错误')) {
                             responseElement.innerHTML += `<div class="error">解析流数据时出错，请检查控制台。</div>`;
                        }
                    } finally {
                        currentEventType = null; // 重置事件类型
                    }
                } else if (line.trim() !== '') { // Log unexpected lines
                    console.warn("Received unexpected non-empty line:", line); // <--- 增加日志：意外的行
                    currentEventType = null; // 重置事件类型
                } else {
                     // Empty line, potentially between messages, reset event type
                     currentEventType = null;
                }
            }
            // 滚动到底部
            responseElement.scrollTop = responseElement.scrollHeight;
        }

        // --- 检查最终是否有内容（流结束后） ---
        if (responseElement.querySelector('.loading') && !responseElement.querySelector('.message') && !responseElement.querySelector('.error')) {
            responseElement.innerHTML = '<div class="message">已收到响应，但无文本内容返回。</div>';
        } else if (responseElement.querySelector('.loading')) {
            responseElement.querySelector('.loading').remove();
        }

    } catch (error) {
        console.error('请求或处理 Worker 响应出错:', error);
        responseElement.innerHTML = `<div class="error">请求出错: ${escapeHtml(error.message)}</div>`;
    } finally {
        // --- UI 更新：请求结束 ---
        sendButton.disabled = false; // 重新启用发送按钮
        userInputElement.disabled = false; // 重新启用输入框
        // 确保 loading 提示被移除
        const loadingElement = responseElement.querySelector('.loading');
        if (loadingElement) {
            loadingElement.remove();
        }
        userInputElement.focus(); // 将焦点移回输入框
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

// --- 事件监听：输入框回车 ---
userInputElement.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // 阻止默认的换行行为
        sendRequest(); // 调用发送函数
    }
});