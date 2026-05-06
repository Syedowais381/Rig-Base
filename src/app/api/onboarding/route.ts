import { genAI, onboardingModelFallbacks, buildOnboardingSystemPrompt, type ChatMessage } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ONBOARDING_TIMEOUT_MS = 25000

function isModelNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return message.includes('404') || message.includes('not found') || message.includes('model')
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages } = await request.json() as { messages: ChatMessage[] }
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Invalid chat history.' }, { status: 400 })
  }

  const lastMessage = messages[messages.length - 1]
  if (!lastMessage?.parts?.[0]?.text || typeof lastMessage.parts[0].text !== 'string') {
    return NextResponse.json({ error: 'Last message is missing text.' }, { status: 400 })
  }

  try {
    const history = [
      {
        role: 'user' as const,
        parts: [{ text: buildOnboardingSystemPrompt() }],
      },
      {
        role: 'model' as const,
        parts: [{ text: "I understand my role as the Rig Base onboarding agent. I'll ask thoughtful, industry-specific questions to understand this business completely and generate their personalized workspace configuration. I'm ready to begin the conversation." }],
      },
      ...messages.slice(0, -1),
    ]

    let lastError: Error | null = null

    for (const modelName of onboardingModelFallbacks) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const chat = model.startChat({ history })
        const result = await Promise.race([
          chat.sendMessage(lastMessage.parts[0].text),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('ONBOARDING_TIMEOUT')), ONBOARDING_TIMEOUT_MS)
          }),
        ])
        const responseText = result.response.text()
        return NextResponse.json({ response: responseText, model: modelName })
      } catch (error) {
        if (isModelNotFoundError(error)) {
          lastError = error instanceof Error ? error : new Error(String(error))
          continue
        }
        throw error
      }
    }

    throw lastError ?? new Error('No available onboarding model')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Gemini onboarding error:', {
      userId: user.id,
      message,
    })

    if (message.includes('429') || message.toLowerCase().includes('rate')) {
      return NextResponse.json(
        { error: 'AI rate limit reached. Please wait a minute and try again.' },
        { status: 429 }
      )
    }

    if (message === 'ONBOARDING_TIMEOUT') {
      return NextResponse.json(
        { error: 'AI response timed out. Please retry your last message.' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to get AI response. Please retry.' },
      { status: 500 }
    )
  }
}
