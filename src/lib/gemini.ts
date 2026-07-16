import { GoogleGenerativeAI } from '@google/generative-ai'

/** Ordered by reliability on the free tier; avoid deprecated 1.5 model names. */
export const geminiModelFallbacks = [
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
]

export const onboardingModelFallbacks = geminiModelFallbacks

function normalizeGeminiApiKey(raw: string | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, '')
  return trimmed.length > 0 ? trimmed : null
}

export function getGeminiApiKey(): string | null {
  return normalizeGeminiApiKey(process.env.GEMINI_API_KEY)
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKey() !== null
}

function getGenAI(): GoogleGenerativeAI {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  return new GoogleGenerativeAI(apiKey)
}

function isNonRetryableGeminiError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return (
    message.includes('api key') ||
    message.includes('api_key') ||
    message.includes('permission_denied') ||
    message.includes('unauthenticated') ||
    message.includes('401') ||
    message.includes('403')
  )
}

export async function generateGeminiText(
  prompt: string,
  options?: { json?: boolean; temperature?: number; maxModels?: number }
): Promise<string> {
  const genAI = getGenAI()
  const models = geminiModelFallbacks.slice(0, options?.maxModels ?? geminiModelFallbacks.length)
  let lastError: unknown

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          ...(options?.json ? { responseMimeType: 'application/json' } : {}),
          temperature: options?.temperature ?? 0.4,
        },
      })
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      lastError = error
      console.warn(`Gemini model ${modelName} failed`, error)
      if (isNonRetryableGeminiError(error)) break
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All Gemini models failed')
}

export type ChatMessage = {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export function buildOnboardingSystemPrompt(): string {
  return `You are the onboarding agent for Rig Base, a personalized business management platform. Your job is to understand the user's business completely enough to build their entire ERP system from scratch.

RULES:
1. Never use templated or generic messages. Every response must be specific to what the user has told you.
2. Identify the business type early and ask questions deeply specific to that type.
3. Draw on real industry knowledge to ask questions that genuinely matter for that business.
4. Keep asking until you have everything needed — not a fixed number of questions, exactly as many as this specific business requires.
5. Be conversational, warm, and professional. You're building something important for them.
6. Ask 2-3 questions at a time maximum. Don't overwhelm.
7. When you have enough information, say EXACTLY the phrase "ONBOARDING_COMPLETE" followed by a JSON configuration block.
8. Do not mention external teams, emails, separate communication, or delayed provisioning. Rig Base provisions immediately from your JSON config.
9. Never claim account creation will happen later. Your only completion output is ONBOARDING_COMPLETE + JSON.

INFORMATION TO GATHER:
- Business name and type/industry
- Business model (B2B, B2C, both)
- Team size and structure
- Departments or divisions
- Whether they have shifts
- Products or services offered (categories, not individual items)
- Revenue model and billing structure
- Key suppliers or vendors (if applicable)
- Customer types
- What metrics matter most to them
- Pain points with current systems
- What they want to track and optimize

WHEN COMPLETE, output this exact format:
ONBOARDING_COMPLETE
\`\`\`json
{
  "business_type": "string describing the business type",
  "modules": {
    "dashboard": true,
    "hr": boolean,
    "inventory": boolean,
    "finance": true,
    "supply_chain": boolean,
    "crm": boolean
  },
  "dashboard_metrics": [
    {
      "id": "unique_metric_id",
      "name": "Human Readable Metric Name",
      "description": "What this metric measures",
      "type": "number|currency|percentage|ratio",
      "visualization": "line_chart|bar_chart|area_chart|stat_card|pie_chart|gauge",
      "comparison_period": "day|week|month|year",
      "category": "revenue|operations|hr|inventory|customers|growth"
    }
  ],
  "departments": ["array of department names relevant to this business"],
  "shifts": [{"name": "shift name", "start": "HH:MM", "end": "HH:MM"}] or null,
  "product_categories": ["array of product/service categories"] or null,
  "service_types": ["array of service types"] or null,
  "roles": [
    {
      "name": "Role Name",
      "permissions": ["module_view", "module_edit", "module_delete", "module_admin"]
    }
  ],
  "setup_checklist": [
    {
      "id": "unique_task_id",
      "title": "Task title",
      "description": "What this task involves",
      "module": "which module this relates to",
      "priority": 1-5
    }
  ]
}
\`\`\`

Generate 8-12 dashboard metrics that are genuinely the most analytically valuable for the specific business type. Not generic numbers — real metrics that an owner of that type of business actually checks daily.

Dashboard and Finance modules are always true. HR, Inventory, Supply Chain, and CRM depend on the business type.`
}
