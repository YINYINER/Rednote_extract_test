// worker.js

// --- 配置 ---
// 替换成你的 Coze API Token 和 Bot ID
const COZE_API_TOKEN = 'pat_5QA0HWsGtjPGB9EG52bDL9MwQhEDHimTpTbli7iMZnaexhFIwhB7oopanl9TXuv2';
const COZE_BOT_ID = '7496404783675637779';
const COZE_API_URL = 'https://api.coze.cn/v3/chat';

export default {
  async fetch(request, env, ctx) {
    // --- 处理 CORS 预检请求 ---
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // --- 只处理 GET 请求 ---
    if (request.method !== 'GET') {
      return new Response('只接受 GET 请求', { status: 405, headers: corsHeaders() });
    }

    // --- 从 URL 获取用户输入 ---
    const url = new URL(request.url);
    const userInput = url.searchParams.get('data'); // 获取 ?data= 后面的值

    if (!userInput) {
      return new Response('缺少 "data" 查询参数', { status: 400, headers: corsHeaders() });
    }

    // --- 构建 Coze API 请求体 ---
    const requestBody = {
      bot_id: COZE_BOT_ID,
      user_id: 'cf-worker-' + Date.now(), // 使用 Worker 生成的简单用户 ID
      stream: true, // 必须为 true 以获取流式响应
      auto_save_history: true,
      additional_messages: [
        {
          role: 'user',
          content: userInput, // 使用从 URL 获取的用户输入
          content_type: 'text'
        }
      ]
    };

    // --- 调用 Coze API ---
    try {
      const cozeResponse = await fetch(COZE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COZE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream' // 明确接受 SSE 流
        },
        body: JSON.stringify(requestBody)
      });

      // --- 检查 Coze API 响应状态 ---
      if (!cozeResponse.ok) {
        // 尝试读取错误信息并返回
        const errorText = await cozeResponse.text();
        console.error(`Coze API 错误: ${cozeResponse.status}`, errorText);
        return new Response(`Coze API 请求失败: ${cozeResponse.status} - ${errorText}`, {
          status: cozeResponse.status, // 将 Coze API 的错误状态码传回
          headers: corsHeaders() // 添加 CORS 头
        });
      }

      // --- 转发流式响应 ---
      // 创建一个可传递的流 (TransformStream) 来确保正确处理和关闭
      const { readable, writable } = new TransformStream();
      cozeResponse.body.pipeTo(writable); // 将 Coze API 的响应体导入到可写流

      // 返回一个新的 Response，其 body 是可读流，并添加 CORS 头
      return new Response(readable, {
        status: 200,
        headers: {
          ...corsHeaders(), // 添加基础 CORS 头
          'Content-Type': 'text/event-stream; charset=utf-8', // 设置正确的 SSE 内容类型
          'Cache-Control': 'no-cache', // 确保不缓存流
          'Connection': 'keep-alive' // 保持连接
        }
      });

    } catch (error) {
      console.error('Worker 内部错误:', error);
      return new Response(`Worker 内部错误: ${error.message}`, { status: 500, headers: corsHeaders() });
    }
  }
};

// --- CORS 辅助函数 ---
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // 允许任何来源访问，生产环境建议指定具体来源
    'Access-Control-Allow-Methods': 'GET, OPTIONS', // 允许的方法
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', // 允许的请求头
  };
}

// 处理 OPTIONS 预检请求
function handleOptions(request) {
  const headers = request.headers;
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // 处理合法的预检请求
    return new Response(null, {
      headers: corsHeaders()
    });
  } else {
    // 处理不合法的预检请求
    return new Response(null, {
      headers: {
        Allow: 'GET, OPTIONS',
      }
    });
  }
}