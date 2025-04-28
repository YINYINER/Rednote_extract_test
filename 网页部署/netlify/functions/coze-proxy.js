// netlify/functions/coze-proxy.js

const API_URL = 'https://api.coze.cn/v3/chat';
const BOT_ID = '7496404783675637779';
const TOKEN = 'pat_uPNHfKdabKSn3Nkr6Rc6I6opI7ZndyZqSKseT67tGYmRzfECZas49fDf232aOjpl';

exports.handler = async (event, context) => {
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
        stream: true, // 开启流式传输
        auto_save_history: false,
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
                'Accept': 'text/event-stream' // 添加 Accept 头以支持流式传输
            },
            body: JSON.stringify(cozePayload)
        });

        if (!cozeResponse.ok) {
            const errorBody = await cozeResponse.text();
            return {
                statusCode: cozeResponse.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: `Coze API request failed: ${errorBody}` }),
            };
        }

        // 获取完整响应文本
        const responseText = await cozeResponse.text();
        
        // 处理响应文本，确保每行都是正确的 SSE 格式
        const formattedLines = responseText
            .split('\n')
            .map(line => {
                if (line.trim() && !line.startsWith('data:') && !line.startsWith('event:')) {
                    try {
                        // 尝试解析为 JSON (如果已经是 JSON 字符串)
                        const parsed = JSON.parse(line.trim());
                        // 添加 data: 前缀并重新序列化为 JSON
                        return `data: ${JSON.stringify(parsed)}`;
                    } catch (e) {
                        // 如果不是 JSON，直接添加 data: 前缀
                        return `data: ${line.trim()}`;
                    }
                }
                return line; // 已经是正确格式的行直接返回
            })
            .join('\n');

        // 处理流式响应
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            },
            body: formattedLines // 返回格式化后的文本
        };

    } catch (error) {
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