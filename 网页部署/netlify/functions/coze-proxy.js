// netlify/functions/coze-proxy.js

const API_URL = 'https://api.coze.cn/v3/chat';
// 直接写入你的 Coze Bot ID 和 Token
const BOT_ID = '7496404783675637779';
const TOKEN = 'pat_zYq2Cv9p5icZ2gtGqbTGzTUjWIokjhlvvefbTVW04SRwCMdKMfn3fs83HkTvE3YN';

exports.handler = async (event, context) => {
    // 直接使用 Node.js 18+ 内置 fetch
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
        stream: false, // 不用流式，直接拿完整回复
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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cozePayload)
        });

        if (!cozeResponse.ok) {
            const errorBody = await cozeResponse.text();
            return {
                statusCode: cozeResponse.status,
                body: `Coze API request failed: ${errorBody}`,
            };
        }

        const result = await cozeResponse.json();
        // 只返回 Coze 的原始内容
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: `Internal Server Error: ${error.message}`,
        };
    }
};