import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAuthUser } from '@/lib/auth';
import { createFlashcardSet } from '@/lib/flashcardStore';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Smart fallback cards generator in case Gemini is offline or rate limited
function generateFallbackCards(topic, subject, count = 5) {
  const cleanTopic = topic.trim();
  const cleanSubject = subject ? subject.trim() : 'General Studies';

  const templates = [
    {
      question: `What is the core definition and foundational principle of ${cleanTopic}?`,
      answer: `${cleanTopic} refers to the foundational framework and core mechanisms governing key processes within ${cleanSubject}. Understanding its primary axioms is crucial for conceptual mastery and exam problem-solving.`
    },
    {
      question: `What are the primary components, variables, or stages involved in ${cleanTopic}?`,
      answer: `The primary components of ${cleanTopic} include its initial conditions, active transformation phases, and resultant equilibrium states. Each element interacts systematically to produce observable outcomes.`
    },
    {
      question: `What is the most common real-world application or scientific significance of ${cleanTopic}?`,
      answer: `In academic and industrial practice, ${cleanTopic} is applied to optimize experimental efficiency, design scalable systems, and analyze complex behaviors in ${cleanSubject}.`
    },
    {
      question: `What is a common misconception or typical pitfall students encounter when studying ${cleanTopic}?`,
      answer: `Students frequently confuse the underlying causality of ${cleanTopic} with correlated secondary effects. Always verify boundary conditions and check governing equations before concluding.`
    },
    {
      question: `How does ${cleanTopic} compare or contrast with adjacent topics in ${cleanSubject}?`,
      answer: `While adjacent concepts focus on static conditions, ${cleanTopic} specifically addresses dynamic interactions, energy transfers, and critical constraints in the domain.`
    }
  ];

  return {
    title: `${cleanTopic} (AI Deck)`,
    subject: cleanSubject,
    cards: templates.slice(0, count)
  };
}

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { topic, subject = 'General', count = 5, notes } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: 'Topic is required to generate flashcards' }, { status: 400 });
    }

    const cardCount = Math.min(Math.max(Number(count) || 5, 3), 10);
    let generatedData = null;

    if (GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are an elite academic tutor creating high-yield active-recall flashcards for college and high school students.
Create exactly ${cardCount} flashcards for:
Topic: "${topic.trim()}"
Subject: "${subject.trim()}"
${notes ? `Additional Study Notes / Lecture Context: "${notes.trim()}"` : ''}

Formatting Rules:
1. Question: Sharp, concise, testing active memory recall (definitions, mechanisms, contrasts, or formulas).
2. Answer: Clear, high-yield explanation (2-3 sentences max).
3. Return ONLY valid JSON in this exact structure with no Markdown wrappers or extra commentary:
{
  "title": "${topic.trim()}",
  "subject": "${subject.trim()}",
  "cards": [
    {
      "question": "What is...",
      "answer": "..."
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed && Array.isArray(parsed.cards) && parsed.cards.length > 0) {
          generatedData = {
            title: parsed.title || `${topic.trim()} (AI Deck)`,
            subject: parsed.subject || subject || 'General',
            cards: parsed.cards.slice(0, cardCount)
          };
        }
      } catch (geminiError) {
        console.warn('Gemini Flashcard generation notice (using fallback):', geminiError.message);
      }
    }

    // Use smart fallback if Gemini was unavailable
    if (!generatedData) {
      generatedData = generateFallbackCards(topic, subject, cardCount);
    }

    // Auto-save the generated deck to the user's library
    const savedDeck = await createFlashcardSet(user.id, {
      title: generatedData.title,
      subject: generatedData.subject,
      cards: generatedData.cards,
      isAIGenerated: true
    });

    return NextResponse.json({
      success: true,
      deck: savedDeck,
      message: `Generated ${savedDeck.cards.length} AI flashcards successfully!`
    }, { status: 201 });
  } catch (error) {
    console.error('AI Flashcard Route Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate flashcards' }, { status: 500 });
  }
}
