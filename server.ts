import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client utility with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Candidate models in preference order with automatic fallback
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest'
];

/**
 * Executes a Gemini API call with:
 * 1. Automatic fallback to supported alternative models if a model is unavailable
 * 2. Exponential backoff retry loop for temporary 503 / 429 / high demand spikes
 * 3. Low thinking latency configuration to avoid timeouts
 */
async function generateWithRetryAndFallback(params: {
  contents: any;
  config?: any;
}) {
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[Gemini] Calling ${modelName} (attempt ${attempt + 1}/${maxRetries})...`);
        const configWithThinking = {
          ...params.config,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        };
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: configWithThinking,
        });

        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTemporary =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('overloaded') ||
          msg.includes('Spikes in demand');

        console.warn(`[Gemini] ${modelName} attempt ${attempt + 1} failed: ${msg.slice(0, 160)}`);

        if (isTemporary && attempt < maxRetries - 1) {
          // Exponential backoff: 800ms, 1600ms, 3200ms
          const backoffMs = Math.min(3500, Math.pow(2, attempt) * 800 + Math.random() * 250);
          console.log(`[Gemini] Retrying in ${Math.round(backoffMs)}ms with exponential backoff...`);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        // If not transient or last retry attempt for this model, move to next fallback model
        break;
      }
    }
  }

  // All retries and models failed
  const isBusy =
    lastError?.message?.includes('503') ||
    lastError?.message?.includes('UNAVAILABLE') ||
    lastError?.message?.includes('high demand') ||
    lastError?.message?.includes('429') ||
    lastError?.message?.includes('RESOURCE_EXHAUSTED');

  const errorObj = new Error(
    isBusy
      ? 'AI is temporarily busy. Please try again in a moment.'
      : (lastError?.message || 'AI is temporarily busy. Please try again in a moment.')
  );
  (errorObj as any).status = isBusy ? 503 : 500;
  throw errorObj;
}

/**
 * Safely parse JSON from LLM output, stripping markdown fences or stray tokens
 */
function safeJsonParse(rawText: string, fallback: any = {}) {
  try {
    let clean = (rawText || '').trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(clean);
  } catch (e) {
    console.warn('safeJsonParse encountered invalid JSON:', e, 'Raw was:', rawText.slice(0, 150));
    return fallback;
  }
}

// 1. Generate active recall quiz & flashcards from study notes, PDF, or website
app.post('/api/gemini/quiz-generator', async (req, res) => {
  try {
    const {
      content,
      pdfBase64,
      topic = 'General Study Topic',
      questionType = 'mcq',
      difficulty = 'Medium',
      count = 5,
    } = req.body;

    if ((!content || content.trim().length === 0) && !pdfBase64) {
      return res.status(400).json({ error: 'Please provide study material, upload a PDF, or paste text to generate questions.' });
    }

    const typeInstruction =
      questionType === 'mcq'
        ? 'Generate ONLY Multiple Choice Questions (type: "mcq"). Each question must have exactly 4 plausible options, with 1 clear correct answer and 3 realistic distractors.'
        : questionType === 'short_answer'
        ? 'Generate ONLY Short Answer conceptual questions (type: "short_answer"). Provide a concise target answer and grading rubric in explanation.'
        : 'Generate a balanced mix of Multiple Choice Questions (type: "mcq") and Short Answer questions (type: "short_answer").';

    const promptText = `You are an elite study tutor and cognitive learning specialist using active recall principles.
Generate exactly ${count} study questions at "${difficulty}" difficulty level.
${typeInstruction}

Subject / Topic: ${topic}
${content ? `\nStudy Material:\n"""\n${content.slice(0, 15000)}\n"""` : '\n(Analyze the attached PDF document to formulate the questions)'}

Requirements:
- For mcq: 'options' array MUST contain 4 clean, distinct choices (e.g. Option A, Option B, etc.). 'correctAnswer' must match one of the options verbatim.
- For short_answer: 'options' can be empty or omitted. 'correctAnswer' must contain a concise, clear model answer.
- Provide a brief, crystal-clear 'explanation' explaining WHY the answer is correct.
- Include a subtle memory 'hint'.`;

    const parts: any[] = [];
    if (pdfBase64) {
      // Clean base64 string if data URL prefix exists
      const cleanData = pdfBase64.includes('base64,') ? pdfBase64.split('base64,')[1] : pdfBase64;
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanData,
        },
      });
    }
    parts.push({ text: promptText });

    const response = await generateWithRetryAndFallback({
      contents: { parts },
      config: {
        systemInstruction: 'You are an educational assessment master who crafts rigorous, intellectually stimulating, and pedagogical study questions.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: { type: Type.STRING, description: 'Engaging title for this study session' },
            topic: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            summary: { type: Type.STRING, description: '1-2 sentence core insight of the study material' },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'mcq or short_answer' },
                  prompt: { type: Type.STRING, description: 'The question prompt' },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '4 options for MCQ, empty for short answer'
                  },
                  correctAnswer: { type: Type.STRING, description: 'The correct option or target answer' },
                  explanation: { type: Type.STRING, description: 'Short, clear explanation' },
                  hint: { type: Type.STRING, description: 'A subtle memory trigger hint' },
                  keyConcept: { type: Type.STRING, description: 'Core concept tag' }
                },
                required: ['id', 'type', 'prompt', 'correctAnswer', 'explanation']
              }
            }
          },
          required: ['quizTitle', 'topic', 'questions']
        }
      }
    });

    const jsonStr = response.text?.trim() || '{}';
    const parsed = safeJsonParse(jsonStr, { quizTitle: 'Study Practice', topic, questions: [] });
    return res.json(parsed);
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    const status = error.status || 500;
    const isBusy = status === 503 || error.message?.includes('503') || error.message?.includes('busy') || error.message?.includes('high demand');
    return res.status(isBusy ? 503 : status).json({
      error: isBusy
        ? 'AI is temporarily busy. Please try again in a moment.'
        : (error.message || 'AI is temporarily busy. Please try again in a moment.')
    });
  }
});

// Endpoint to fetch and extract readable text from a URL/website
app.post('/api/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid website URL.' });
    }

    let parsedUrl = url.trim();
    if (!parsedUrl.startsWith('http://') && !parsedUrl.startsWith('https://')) {
      parsedUrl = 'https://' + parsedUrl;
    }

    const fetchRes = await fetch(parsedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StudySpace/1.0; +https://studyspace.app)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!fetchRes.ok) {
      throw new Error(`Website responded with HTTP status ${fetchRes.status}`);
    }

    const html = await fetchRes.text();
    // Strip scripts, styles, nav, footer, and extract body text
    const textWithoutScripts = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Web Study Material';

    // Strip HTML tags and normalize whitespace
    const plainText = textWithoutScripts
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText.length < 50) {
      throw new Error('Could not extract readable article text from this page. Please paste the text directly.');
    }

    return res.json({
      title,
      text: plainText.slice(0, 12000),
    });
  } catch (error: any) {
    console.error('Error fetching website content:', error);
    return res.status(500).json({
      error: error.message || 'Unable to fetch website content. Please paste the text directly.'
    });
  }
});

// Endpoint to generate active recall flashcards directly from study text, notes, or PDF
app.post('/api/gemini/generate-flashcards', async (req, res) => {
  try {
    const { content, pdfBase64, topic = 'General', count = 5 } = req.body;

    if ((!content || typeof content !== 'string' || content.trim().length === 0) && !pdfBase64) {
      return res.status(400).json({ error: 'Please provide study text or upload a PDF to generate flashcards.' });
    }

    const promptText = `You are an expert cognitive learning specialist creating high-yield active recall flashcards.
Analyze the following study material and generate exactly ${count} clear, punchy flashcards.
Each card must test a core concept, key term, definition, equation, or mechanism.
- The 'front' must be a clear query, concept, or term testing memory retrieval.
- The 'back' must be an accurate, memorable explanation or definition.
- Assign an appropriate 'difficulty' tag: "Easy", "Medium", or "Hard".
- Assign the 'subject' name (e.g. "${topic}").

Subject / Topic: ${topic}
${content ? `\nStudy Material:\n"""\n${content.slice(0, 12000)}\n"""` : '\n(Analyze the attached PDF document to formulate the flashcards)'}`;

    const parts: any[] = [];
    if (pdfBase64) {
      const cleanData = pdfBase64.includes('base64,') ? pdfBase64.split('base64,')[1] : pdfBase64;
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanData,
        },
      });
    }
    parts.push({ text: promptText });

    const response = await generateWithRetryAndFallback({
      contents: { parts },
      config: {
        systemInstruction: 'You craft concise, high-yield active recall flashcard pairs with difficulty ratings.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  front: { type: Type.STRING, description: 'Question or term on front of card' },
                  back: { type: Type.STRING, description: 'Model answer or definition on back' },
                  subject: { type: Type.STRING, description: 'Subject or category name' },
                  difficulty: { type: Type.STRING, description: 'Easy, Medium, or Hard' }
                },
                required: ['id', 'front', 'back', 'subject']
              }
            }
          },
          required: ['topic', 'cards']
        }
      }
    });

    const jsonStr = response.text?.trim() || '{}';
    const parsed = safeJsonParse(jsonStr, { topic, cards: [] });
    return res.json(parsed);
  } catch (error: any) {
    console.error('Flashcard generation error:', error);
    const status = error.status || 500;
    const isBusy = status === 503 || error.message?.includes('503') || error.message?.includes('busy') || error.message?.includes('high demand');
    return res.status(isBusy ? 503 : status).json({
      error: isBusy
        ? 'AI is temporarily busy. Please try again in a moment.'
        : (error.message || 'Failed to generate flashcards with AI.')
    });
  }
});

// 2. Summarize & Extract Key Concepts from Study Notes
app.post('/api/gemini/summarize-notes', async (req, res) => {
  try {
    const { content, title = 'Study Note' } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Please provide note content to summarize.' });
    }

    const prompt = `Summarize and extract high-yield active recall memory frameworks from these notes.
Title: ${title}
Content:
"""
${content.slice(0, 10000)}
"""`;

    const response = await generateWithRetryAndFallback({
      contents: prompt,
      config: {
        systemInstruction: 'You are an accelerated learning strategist synthesizing notes into high-yield cognitive frameworks.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING, description: '2-3 sentence clear summary' },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-6 essential takeaways'
            },
            memoryAids: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Mnemonics, mental models, or analogical memory hooks'
            },
            recommendedReviewQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 prompt questions for active self-testing'
            }
          },
          required: ['executiveSummary', 'keyTakeaways', 'memoryAids', 'recommendedReviewQuestions']
        }
      }
    });

    const jsonStr = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonStr);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Note summarization error:', error);
    const status = error.status || 500;
    const isBusy = status === 503 || error.message?.includes('503') || error.message?.includes('busy') || error.message?.includes('high demand');
    return res.status(isBusy ? 503 : status).json({
      error: isBusy
        ? 'AI is temporarily busy. Please try again in a moment.'
        : (error.message || 'Failed to summarize notes.')
    });
  }
});

// 3. AI Self-Grading & Deep Feedback for Student Answer
app.post('/api/gemini/grade-answer', async (req, res) => {
  try {
    const { questionPrompt, referenceAnswer, studentAnswer } = req.body;

    if (!questionPrompt || !studentAnswer) {
      return res.status(400).json({ error: 'Missing question prompt or student answer.' });
    }

    const prompt = `A student answered the following study question. Evaluate their answer constructively with active recall feedback.
Question: "${questionPrompt}"
Reference Answer / Key Points: "${referenceAnswer}"
Student's Answer: "${studentAnswer}"`;

    const response = await generateWithRetryAndFallback({
      contents: prompt,
      config: {
        systemInstruction: 'You are an encouraging yet rigorous academic mentor providing constructive assessment.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scorePercentage: { type: Type.INTEGER, description: 'Score from 0 to 100' },
            gradeStatus: { type: Type.STRING, description: 'Excellent, Good, Partially Correct, or Needs Review' },
            whatWasAccurate: { type: Type.STRING, description: 'Specific parts the student got right' },
            missingOrMisunderstood: { type: Type.STRING, description: 'Nuances missed or inaccuracies to clarify' },
            modelImprovementTip: { type: Type.STRING, description: 'How to formulate an ideal exam answer' }
          },
          required: ['scorePercentage', 'gradeStatus', 'whatWasAccurate', 'missingOrMisunderstood', 'modelImprovementTip']
        }
      }
    });

    const jsonStr = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonStr);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Answer grading error:', error);
    const status = error.status || 500;
    const isBusy = status === 503 || error.message?.includes('503') || error.message?.includes('busy') || error.message?.includes('high demand');
    return res.status(isBusy ? 503 : status).json({
      error: isBusy
        ? 'AI is temporarily busy. Please try again in a moment.'
        : (error.message || 'Failed to grade answer.')
    });
  }
});

// 4. Quick Analogy & Concept Explainer
app.post('/api/gemini/explain-concept', async (req, res) => {
  try {
    const { term, context = '' } = req.body;

    if (!term) {
      return res.status(400).json({ error: 'Missing concept term.' });
    }

    const prompt = `Explain the concept "${term}" clearly with an intuitive real-world analogy and common pitfalls. Context: ${context}`;

    const response = await generateWithRetryAndFallback({
      contents: prompt,
      config: {
        systemInstruction: 'You are an intuitive educator famous for clear real-world analogies and intuition pumps.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            plainDefinition: { type: Type.STRING, description: '1-sentence intuitive definition' },
            realWorldAnalogy: { type: Type.STRING, description: 'Memorable metaphor or analogy' },
            commonPitfall: { type: Type.STRING, description: 'What students often confuse this with' },
            keyFormulaOrRule: { type: Type.STRING, description: 'Essential rule, equation, or takeaway' }
          },
          required: ['term', 'plainDefinition', 'realWorldAnalogy', 'commonPitfall', 'keyFormulaOrRule']
        }
      }
    });

    const jsonStr = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonStr);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Explain concept error:', error);
    const status = error.status || 500;
    const isBusy = status === 503 || error.message?.includes('503') || error.message?.includes('busy') || error.message?.includes('high demand');
    return res.status(isBusy ? 503 : status).json({
      error: isBusy
        ? 'AI is temporarily busy. Please try again in a moment.'
        : (error.message || 'Failed to explain concept.')
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`StudySpace server running at http://localhost:${port}`);
  });
}

startServer();
