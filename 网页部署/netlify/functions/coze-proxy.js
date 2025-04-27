// netlify/functions/coze-proxy.js

const API_URL = 'https://api.coze.cn/v3/chat';
// --- 重要：请将下面的值替换为你的真实 Coze Bot ID 和 Token ---
const BOT_ID = '7496404783675637779'; // 替换这里
const TOKEN = 'pat_zYq2Cv9p5icZ2gtGqbTGzTUjWIokjhlvvefbTVW04SRwCMdKMfn3fs83HkTvE3YN'; // 替换这里
// --------------------------------------------------------------

exports.handler = async (event, context) => {
    // 直接使用 Node.js 18+ 内置 fetch
    const userInput = event.queryStringParameters.data;

    if (!userInput) {
        return {
            statusCode: 400,
            body: 'Missing user input in "data" query parameter.',
        };
    }

    // 确保 BOT_ID 和 TOKEN 已被替换
    if (BOT_ID === 'YOUR_COZE_BOT_ID' || TOKEN === 'YOUR_COZE_API_TOKEN') {
         return {
            statusCode: 500,
            body: 'Server configuration error: Coze Bot ID or Token not set in the function code.',
        };
    }

    const cozePayload = {
        bot_id: BOT_ID,
        user_id: 'netlify_user_' + Date.now(),
        stream: true, // 明确要求流式输出
        auto_save_history: false, // 通常在代理中禁用自动保存
        additional_messages: [
            {
                role: 'user',
                content: userInput,
                content_type: 'text'
            }
        ]
    };

    try {
        const cozeResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream', // 必须设置 Accept 为 text/event-stream
                'Connection': 'keep-alive'
            },
            body: JSON.stringify(cozePayload)
        });

        // 检查 Coze API 是否返回错误状态码
        if (!cozeResponse.ok) {
            const errorBody = await cozeResponse.text();
            console.error('Coze API Error:', cozeResponse.status, errorBody);
            // 返回一个明确的错误信息给前端
            return {
                statusCode: cozeResponse.status, // 将 Coze 的错误状态码传递给前端
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                 },
                body: JSON.stringify({ error: `Coze API request failed: ${errorBody}` }),
            };
        }

        // 如果 Coze API 响应成功 (2xx)，直接将流返回给客户端
        // Netlify Functions (v2 runtime and later) 支持直接返回 ReadableStream
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/event-stream', // 告诉浏览器这是 Server-Sent Events
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*' // 允许跨域
            },
            body: cozeResponse.body // 直接传递 Coze 返回的流
        };

    } catch (error) {
        console.error('Error in Netlify function:', error);
        // 返回一个标准的服务器错误
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
             },
            body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
        };
    }
};