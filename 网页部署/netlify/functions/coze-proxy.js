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

        // 处理流式响应
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            },
            body: cozeResponse.body
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