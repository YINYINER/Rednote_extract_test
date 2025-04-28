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
        // 请求 Coze API
        console.log('请求 Coze API，用户输入:', userInput);
        
        const cozeResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify(cozePayload)
        });

        if (!cozeResponse.ok) {
            const errorBody = await cozeResponse.text();
            console.error('Coze API 请求失败:', cozeResponse.status, errorBody);
            
            return {
                statusCode: cozeResponse.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: `Coze API request failed: ${errorBody}` }),
            };
        }

        // 简单的响应头检查
        console.log('Coze API 响应成功, Content-Type:', cozeResponse.headers.get('Content-Type'));
        
        // 创建初始 SSE 消息，确保客户端开始接收
        const initialMessage = `data: {"type":"stream.start","data":"连接成功，正在等待响应..."}\n\n`;

        // 返回响应，让 Netlify 立即响应，避免超时
        // 不再尝试等待或处理完整响应
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            },
            // 只返回一个初始消息，以确保客户端能接收到响应
            // 实际上 Netlify 不支持真正的流式传输，但这至少能让客户端收到一些响应
            body: initialMessage
        };

    } catch (error) {
        console.error('内部服务器错误:', error);
        
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