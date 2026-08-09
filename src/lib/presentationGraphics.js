// src/lib/presentationGraphics.js

/**
 * EduPulse Presentation Graphics Generator.
 * Uses Gemini API key to generate topic-aware, customized vector SVG graphics for slides,
 * converting them to 100% reliable Base64 Data URLs for live previews, PPTX exports, and PDFs.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const THEME_COLORS = {
  'ocean-blue': { primary: '#0284C7', secondary: '#38BDF8', bg: '#0F172A' },
  'dark-emerald': { primary: '#059669', secondary: '#34D399', bg: '#022C22' },
  'sunset-orange': { primary: '#EA580C', secondary: '#FB923C', bg: '#1C1917' },
  'cyber-purple': { primary: '#9333EA', secondary: '#C084FC', bg: '#1A102F' },
  'glass-light': { primary: '#2563EB', secondary: '#3B82F6', bg: '#F8FAFC' }
};

/**
 * Generate a topic-specific SVG graphic using Gemini API, fallback to local Canvas graphic.
 */
export async function generateSlideGraphic(slideTitle = '', query = '', themeKey = 'ocean-blue', index = 0) {
  const theme = THEME_COLORS[themeKey] || THEME_COLORS['ocean-blue'];
  const searchPrompt = `${slideTitle} ${query}`.trim() || 'موضوع توضيحي';

  const systemPrompt = `أنت مصمم جرافيك احترافي لمساعد EduPulse.
أنشئ رسمًا توضيحيًا فاخرًا وملونًا بتنسيق SVG متوافقًا تمامًا مع الموضوع التالي: "${searchPrompt}".
الشروط الصارمة:
1- يجب أن يكون المخرج كود SVG خالي تمامًا من أي كلام أو شرح خارجه، يبدأ بـ <svg> وينتهي بـ </svg>.
2- أبعاد العرض: viewBox="0 0 800 500" width="100%" height="100%".
3- استخدم خلفيات مدرجة متناسقة (${theme.bg}) وألوان ثانوية ممتازة (${theme.primary}, ${theme.secondary}).
4- ارسم أيقونات وأشكال إنفوجرافيك وعناصر بصرية (شمس، شبكات، أدمغة، بياني، رسوم، معدات) تناسب الموضوع بدقة.
5- لا تكتب أي كلام ماركداون خارج كود الـ SVG.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    const data = await res.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      let rawText = data.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();

      if (rawText.includes('<svg') && rawText.includes('</svg>')) {
        const b64 = btoa(unescape(encodeURIComponent(rawText)));
        return `data:image/svg+xml;base64,${b64}`;
      }
    }
  } catch (err) {
    console.warn("Fallback to Canvas graphic:", err);
  }

  // Fallback to Canvas Base64 Graphic
  return generateCanvasFallbackGraphic(slideTitle, themeKey, index);
}

/**
 * Client-side Canvas Fallback Graphic Generator (100% Guaranteed Base64 Data URL)
 */
function generateCanvasFallbackGraphic(title, themeKey, index) {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  const theme = THEME_COLORS[themeKey] || THEME_COLORS['ocean-blue'];

  // Background
  const grad = ctx.createLinearGradient(0, 0, 1280, 720);
  grad.addColorStop(0, theme.bg);
  grad.addColorStop(1, '#05070A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);

  // Card Box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.strokeStyle = theme.secondary;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(100, 100, 1080, 520, 32);
  ctx.fill();
  ctx.stroke();

  // Chart / Node Visual
  ctx.fillStyle = theme.secondary;
  const bars = [200, 340, 260, 420, 320];
  bars.forEach((bH, bIdx) => {
    ctx.fillRect(240 + bIdx * 170, 520 - bH, 90, bH);
  });

  // Label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title || 'شريحة EduPulse التفاعلية', 640, 640);

  return canvas.toDataURL('image/png');
}

/**
 * Fetch Base64 Image or generate Gemini SVG
 */
export async function fetchImageAsBase64(imageUrl, slideTitle, query, themeKey, index) {
  if (imageUrl && imageUrl.startsWith('data:image')) {
    return imageUrl;
  }
  return await generateSlideGraphic(slideTitle, query, themeKey, index);
}
