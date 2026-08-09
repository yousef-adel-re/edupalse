// src/lib/ai.js
const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const apiKey = import.meta.env.VITE_AZURE_OPENAI_KEY;
const nanoModel = import.meta.env.VITE_AZURE_DEPLOYMENT_NANO || 'gpt-5.4-nano';
const kimiModel = import.meta.env.VITE_AZURE_DEPLOYMENT_KIMI || 'Kimi-K2.6';

const getCleanEndpoint = () => endpoint ? endpoint.replace(/\/$/, '') : '';

/**
 * Call Azure AI models (Kimi-K2.6 for reasoning/JSON/Vision, gpt-5.4-nano for fast lightweight tasks).
 * Formats system prompts deterministically at the front to maximize Kimi-K2.6 Prompt Context Caching.
 */
export async function callAzureAI(systemPrompt, messagesHistory, customInstructions = "", useKimi = false, isJson = false) {
  try {
    const deploymentName = useKimi ? kimiModel : nanoModel;
    const cleanEndpoint = getCleanEndpoint();
    const url = `${cleanEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;

    const mathRule = isJson ? '' : '\n\n[تعليمات المعادلات: اكتب أي معادلة أو قانون رياضي بأسلوب LaTeX المنسق محاطاً بـ $ للمعادلات المدمجة أو $$ للمعادلات المنفصلة، مثل $E=mc^2$ و $$\\frac{a}{b}$$].';
    const finalSystemPrompt = customInstructions 
      ? `${systemPrompt}${mathRule}\n\nتعليمات صارمة:\n${customInstructions}` 
      : `${systemPrompt}${mathRule}`;

    // Prompt payload structured deterministically to maximize Kimi-K2.6 Prompt Caching hits
    const apiMessages = [
      { role: 'system', content: finalSystemPrompt },
      ...messagesHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: String(msg.content)
      }))
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        messages: apiMessages,
        temperature: isJson ? 0.2 : 0.4,
        max_completion_tokens: isJson ? 16000 : 8000,
        response_format: isJson ? { type: "json_object" } : { type: "text" }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Azure Chat Error Detail:", err);
      throw new Error('Azure API Error');
    }
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI Request Failed:", error);
    return isJson ? '{"cards":[]}' : "عذراً، حدث خطأ في الاتصال.";
  }
}

/**
 * Stream responses from Azure AI models (SSE streaming for real-time word-by-word responses).
 */
export async function streamAzureAI(systemPrompt, messagesHistory, customInstructions = "", useKimi = false, onChunk = null) {
  try {
    const deploymentName = useKimi ? kimiModel : nanoModel;
    const cleanEndpoint = getCleanEndpoint();
    const url = `${cleanEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;

    const mathRule = '\n\n[تعليمات المعادلات: اكتب أي معادلة أو قانون رياضي بأسلوب LaTeX المنسق محاطاً بـ $ للمعادلات المدمجة أو $$ للمعادلات المنفصلة].';
    const finalSystemPrompt = customInstructions 
      ? `${systemPrompt}${mathRule}\n\nتعليمات صارمة:\n${customInstructions}` 
      : `${systemPrompt}${mathRule}`;

    const apiMessages = [
      { role: 'system', content: finalSystemPrompt },
      ...messagesHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      }))
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        messages: apiMessages,
        temperature: 0.4,
        max_completion_tokens: 8000,
        stream: true
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Azure Stream Error Detail:", err);
      throw new Error('Azure API Stream Error');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.substring(6);
          if (dataStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              if (onChunk) onChunk(fullText, content);
            }
          } catch (e) {
            // Ignore parse errors on incomplete chunk lines
          }
        }
      }
    }
    return fullText;
  } catch (error) {
    console.error("AI Stream Request Failed:", error);
    throw error;
  }
}

export function detectTextDirection(text) {

  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text) ? 'rtl' : 'ltr';
}

/**
 * Extract text from images using Kimi-K2.6's multimodal vision capabilities.
 */
export async function extractTextWithVisionModel(base64ImagesArray) {
  try {
    const cleanEndpoint = getCleanEndpoint();
    const url = `${cleanEndpoint}/openai/deployments/${kimiModel}/chat/completions?api-version=2024-02-15-preview`;
    
    const contentArray = [
      { type: "text", text: "استخرج جميع النصوص والمعادلات المكتوبة في هذه الصور بدقة تامة. اكتب أي رموز أو معادلات رياضية بأسلوب LaTeX محاطة بـ $ أو $$ (مثال: $t_{rr}$ و $$t_{rr} = t_a + t_b$$) لتظهر بتنسيق رياضي جميل ومفهوم. أعد النص فقط بدون تعليقات." }
    ];

    base64ImagesArray.forEach(imgBase64 => {
      contentArray.push({
        type: "image_url",
        image_url: { url: imgBase64 }
      });
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        messages: [{ role: 'user', content: contentArray }],
        max_completion_tokens: 8000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("Azure Vision API Error Details:", errorDetails);
      throw new Error('Vision Model Failed');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Vision AI Error:", error);
    return "";
  }
}