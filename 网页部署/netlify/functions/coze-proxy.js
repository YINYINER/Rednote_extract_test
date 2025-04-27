// netlify/functions/coze-proxy.js
// const fetch = require('node-fetch'); // <--- 确保这行已被删除或注释掉

const API_URL = 'https://api.coze.cn/v3/chat';
const BOT_ID = process.env.COZE_BOT_ID;
const TOKEN = process.env.COZE_API_TOKEN;

exports.handler = async (event, context) => {
    // 使用动态 import() 加载 node-fetch
    const fetch = (await import('node-fetch')).default;

    const userInput = event.queryStringParameters.data;

    if (!userInput) {
        return {
            statusCode: 400,
            body: 'Missing user input in "data" query parameter.',
        };
    }

    const cozePayload = {
        bot_id: BOT_ID,
        user_id: 'netlify_user_' + Date.now(),
        stream: true,
        auto_save_history: true,
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
                'Accept': 'text/event-stream', // 保持这个，因为我们期望从 Coze 获取流
                'Connection': 'keep-alive'
            },
            body: JSON.stringify(cozePayload)
        });

        if (!cozeResponse.ok) {
            const errorBody = await cozeResponse.text();
            console.error('Coze API Error:', cozeResponse.status, errorBody);
            return {
                statusCode: cozeResponse.status,
                body: `Coze API request failed: ${errorBody}`,
            };
        }

        // 重要：Netlify Functions (v1 runtime) 可能不支持直接返回 ReadableStream
        // 如果动态 import 修复后仍然有问题，尝试将流转换为文本
        // const responseText = await cozeResponse.text(); // 读取流内容

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/event-stream', // 告诉浏览器这是事件流
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*' // 允许跨域
            },
             // 尝试直接传递 Coze 的响应体。Netlify 较新的运行时可能支持。
             // 如果这不起作用，你需要读取流并手动构建 SSE 格式。
            body: cozeResponse.body
            // body: responseText // 备选方案：如果直接返回流不行
        };

    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: `Internal Server Error: ${error.message}`,
        };
    }
};