document.addEventListener('DOMContentLoaded', function() {
    // 初始内容 (将上面的产品设计方案Markdown文本放在这里)
    const initialContent = `# 政策服务小程序 - “找政策”板块设计方案

**核心目标：** 让企业高效、精准地找到适合自身的政策，并便捷地完成申报，最终享受政策红利，形成服务闭环。

**设计原则：** 用户中心、智能驱动、流程闭环、数据赋能。

---

### 一、 核心功能模块 (基于图片并扩展)

1.  **智能政策中心 (查找与匹配)**
    *   **多维搜索与筛选：**
        *   支持关键词搜索（政策名称、文号、关键词）。
        *   提供多维度筛选（地区、行业、企业类型、政策层级、支持方式、发布时间等）。
        *   **细分专题版块 (图片点4):** 设置如“专精特新”、“高新技术企业”、“人才引进”、“税收优惠”等热门专题入口，方便用户快速定位。
    *   **企业画像构建 (图片点3):**
        *   **数据来源：** 用户自主填写、授权导入（如工商、税务、社保、知识产权、历史申报记录等政务数据接口）。
        *   **画像维度：** 包含基本信息（成立时间、注册资本、行业代码）、经营数据（纳税额、社保人数、研发投入）、资质认证（高新、专精特新等）、历史申报记录等。
        *   **实时更新：** 对接政务数据接口，确保持续更新企业画像。
    *   **精准政策匹配：**
        *   基于企业画像，利用算法模型（如规则引擎、机器学习）自动匹配符合条件的政策。
        *   **匹配度评分：** 对每条政策显示与企业的匹配度得分（例如 0-100分），并简要说明匹配/不匹配的关键原因。
        *   **主动推荐：** 在用户首页或政策中心主动推荐高匹配度的政策。

2.  **政策详情与解读**
    *   **结构化展示：** 清晰展示政策原文、发布机构、发布日期、有效期、支持对象、支持方式、申报条件、申报材料清单、联系方式等。
    *   **丰富专区内容 (图片点2):**
        *   **官方解读/图文解读：** 提供官方或专业机构的政策解读，用图文、视频等形式降低理解门槛。
        *   **申报指南：** 详细的申报流程、时间节点、注意事项。
        *   **公示公告：** 相关的名单公示、补充通知等。
        *   **常见问答 (FAQ):** 收集整理用户常见问题及解答。
    *   **关联推荐：** 推荐相关的配套政策或相似政策。

3.  **在线申报与管理 (图片点1)**
    *   **打通在线申报：**
        *   对于支持在线申报的政策，提供小程序内直接填报入口。
        *   对于暂不支持的，清晰引导至官方申报系统。
    *   **智能填报辅助：**
        *   根据企业画像预填部分表单信息。
        *   提供表单填写校验和提示。
    *   **材料管理：**
        *   支持在线上传、管理申报所需的附件材料（如资质证书、财务报表等）。
        *   建立企业材料库，方便多次复用。
    *   **进度追踪：** 对接申报系统状态，让企业实时了解申报进度（待提交、审核中、已通过、已驳回等）。
    *   **一站式闭环：** 从政策匹配、查阅、理解到在线申报、进度跟踪，形成服务闭环。

4.  **订阅与推送 (图片点5)**
    *   **建立政策订阅机制：**
        *   用户可根据行业、地区、政策类型等维度订阅感兴趣的政策。
        *   系统根据企业画像自动推荐订阅标签。
    *   **个性化消息推送：**
        *   **新政速递：** 推送用户订阅领域或高匹配度的新发布政策。
        *   **申报提醒：** 临近申报截止日期的政策提醒。
        *   **状态变更通知：** 申报进度更新、政策内容变更等通知。
        *   **智能过滤：** 避免无效信息干扰，确保推送精准有效。

5.  **AI 智能引导 (图片点6)**
    *   **智能问答机器人：**
        *   基于政策库和解读内容，7x24小时解答用户关于政策理解、申报条件的疑问。
        *   支持自然语言交互。
    *   **申报资格预评估：** 用户可通过与AI对话或简单问卷，快速判断是否基本符合某项政策的申报条件。
    *   **政策对比分析：** AI 辅助用户对比不同政策的优劣和适用性。
    *   **提升找政策和问政策效率：** 让政策服务更简单、更智能。

### 二、 创新与增值功能

1.  **政策日历：** 以日历形式展示各项政策的关键时间节点（申报开始/截止、公示期等），方便企业规划。
2.  **惠企测算器：** 对于补贴类政策，提供简易测算工具，预估企业可能获得的补贴金额，增加申报动力。
3.  **申报诊断/政策体检：** 企业一键触发，系统根据当前画像全面扫描可申报的政策，并生成诊断报告。
4.  **服务撮合（可选）：** 对于需要专业服务的申报项目（如高企认定辅导），可引入认证服务机构，提供咨询或代理服务（需注意合规性）。
5.  **用户反馈与评价：** 允许用户对政策解读、申报体验进行评价，持续优化产品。

### 三、 功能闭环设计

1.  **发现到匹配：** 用户通过搜索、筛选、专题或首页推荐发现政策 -> 系统基于企业画像进行精准匹配和评分。
2.  **了解到申报：** 用户查阅政策详情、解读、指南 -> 对于符合条件的政策，引导进入在线申报流程。
3.  **申报到追踪：** 用户在线提交申报 -> 系统推送申报状态变更通知。
4.  **订阅到触达：** 用户订阅感兴趣的政策 -> 系统根据订阅和画像推送新政、提醒等消息。
5.  **疑问到解答：** 用户遇到问题 -> 通过AI问答或查阅FAQ获得解答。
6.  **数据驱动优化：** 用户行为数据（浏览、收藏、申报）、企业画像数据、申报结果数据 -> 反哺优化匹配算法、政策推荐、产品功能。

---`; // 注意：这里包含了上面生成的Markdown文本

    let easyMDE;

    try {
        easyMDE = new EasyMDE({
            element: document.getElementById('markdown-editor'),
            spellChecker: false,
            autofocus: true,
            placeholder: '在此输入Markdown格式的内容...',
            toolbar: [
                'bold', 'italic', 'heading', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link', 'image', '|',
                'preview', 'side-by-side', 'fullscreen', '|',
                'guide'
            ],
            initialValue: initialContent,
            minHeight: "600px" // 确保编辑器有足够的高度
        });
    } catch (error) {
        console.error("EasyMDE 初始化失败:", error);
        alert("编辑器加载失败，请检查浏览器控制台获取更多信息。");
        // 提供一个基础的文本区域作为后备
        const editorElement = document.getElementById('markdown-editor');
        if (editorElement && editorElement.tagName !== 'TEXTAREA') {
             const fallbackTextarea = document.createElement('textarea');
             fallbackTextarea.id = 'markdown-editor';
             fallbackTextarea.style.width = '100%';
             fallbackTextarea.style.minHeight = '600px';
             fallbackTextarea.value = initialContent;
             editorElement.parentNode.replaceChild(fallbackTextarea, editorElement);
        } else if (editorElement) {
            editorElement.value = initialContent;
        }
        return; // 阻止后续依赖 easyMDE 的代码执行
    }


    // 更新预览内容
    function updatePreview() {
        try {
            const markdownContent = easyMDE ? easyMDE.value() : document.getElementById('markdown-editor').value;
            // 使用 Marked.js 解析 Markdown
            if (typeof marked !== 'undefined') {
                 document.getElementById('preview-content').innerHTML = marked.parse(markdownContent);
            } else {
                 console.error("Marked.js 未加载");
                 document.getElementById('preview-content').innerText = "预览功能需要Marked.js库";
            }
        } catch (error) {
            console.error("更新预览时出错:", error);
            document.getElementById('preview-content').innerText = "预览生成失败，请检查Markdown内容或浏览器控制台。";
        }
    }

    // 切换到预览标签时更新内容
    const previewTab = document.getElementById('preview-tab');
    if (previewTab) {
        previewTab.addEventListener('shown.bs.tab', updatePreview); // 使用 Bootstrap 5 的事件
    } else {
         // 如果没有使用 Bootstrap Tab，可以监听点击事件，但效果可能不佳
         // document.getElementById('preview-tab').addEventListener('click', updatePreview);
         console.warn("未找到预览标签页或 Bootstrap 未正确加载，预览更新可能不及时。");
    }


    // 保存按钮点击事件
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            try {
                const content = easyMDE ? easyMDE.value() : document.getElementById('markdown-editor').value;
                localStorage.setItem('markdownDesignContent', content);
                alert('内容已保存到浏览器本地存储！');
                // updatePreview(); // 保存后可以选择是否自动更新预览
            } catch (error) {
                console.error("保存内容时出错:", error);
                alert("保存失败，浏览器可能不支持本地存储或已满。");
            }
        });
    }

    // 加载按钮点击事件
    const loadBtn = document.getElementById('load-btn');
     if (loadBtn) {
        loadBtn.addEventListener('click', function() {
            try {
                const savedContent = localStorage.getItem('markdownDesignContent');
                if (savedContent) {
                    if (easyMDE) {
                        easyMDE.value(savedContent);
                    } else {
                         document.getElementById('markdown-editor').value = savedContent;
                    }
                    alert('已从本地存储加载内容！');
                    // updatePreview(); // 加载后可以选择是否自动更新预览
                } else {
                    alert('本地存储中没有找到已保存的内容。');
                }
            } catch (error) {
                console.error("加载内容时出错:", error);
                alert("加载失败，请检查浏览器控制台。");
            }
        });
    }

    // 页面加载时尝试加载一次本地内容（如果存在）
    try {
        const savedContent = localStorage.getItem('markdownDesignContent');
        if (savedContent && easyMDE) { // 确保 easyMDE 已初始化
            easyMDE.value(savedContent);
            console.log("已自动加载上次保存的内容。");
        } else if (savedContent) {
             document.getElementById('markdown-editor').value = savedContent;
             console.log("已自动加载上次保存的内容到文本区域。");
        }
    } catch (error) {
         console.error("自动加载内容时出错:", error);
    }

    // 初始加载时更新一次预览（如果预览标签页是默认激活的）
    // if (document.getElementById('preview').classList.contains('active')) {
    //     updatePreview();
    // }
     // 考虑到编辑页是默认激活，预览内容将在切换时更新
});