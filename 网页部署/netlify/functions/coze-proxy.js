// netlify/functions/coze-proxy.js

const API_URL = 'https://api.coze.cn/v3/chat';
const BOT_ID = '7496404783675637779'; // 替换这里
const TOKEN = 'pat_zYq2Cv9p5icZ2gtGqbTGzTUjWIokjhlvvefbTVW04SRwCMdKMfn3fs83HkTvE3YN'; // 替换这里

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
        stream: true,
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
                'Accept': 'text/event-stream',
                'Connection': 'keep-alive'
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

        const reader = cozeResponse.body.getReader();
        const decoder = new TextDecoder();
        let result = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            },
            body: result // 返回完整的字符串
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