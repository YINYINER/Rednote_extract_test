// netlify/functions/coze-proxy.js
const fetch = require('node-fetch'); // Netlify Functions 需要显式导入 fetch

// 从环境变量获取敏感信息
const API_URL = 'https://api.coze.cn/v3/chat';
const BOT_ID = process.env.COZE_BOT_ID; // 从 Netlify 环境变量读取
const TOKEN = process.env.COZE_API_TOKEN; // 从 Netlify 环境变量读取

exports.handler = async (event, context) => {
    // 1. 从请求中获取用户输入
    // Netlify Function 通过 event.queryStringParameters 获取 GET 请求的参数
    const userInput = event.queryStringParameters.data;

    if (!userInput) {
        return {
            statusCode: 400,
            body: 'Missing user input in "data" query parameter.',
        };
    }

    // 2. 准备调用 Coze API
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
        // 3. 调用 Coze API (流式)
        const cozeResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream', // Coze 需要这个来触发流式
                'Connection': 'keep-alive'
            },
            body: JSON.stringify(cozePayload)
        });

        // 修改响应处理部分
        if (!cozeResponse.ok) {
            const errorBody = await cozeResponse.text();
            console.error('Coze API Error:', cozeResponse.status, errorBody);
            return {
                statusCode: cozeResponse.status,
                body: `Coze API request failed: ${errorBody}`,
            };
        }

        // 直接返回流式响应
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: cozeResponse.body
        };

    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: `Internal Server Error: ${error.message}`,
        };
    }
};