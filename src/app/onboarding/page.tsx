'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User } from 'lucide-react'
import { toast } from 'sonner'
import { extractOnboardingConfigText, validateOnboardingConfig } from '@/lib/onboarding-config'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const ONBOARDING_DRAFT_KEY = 'rigbase_onboarding_draft_v1'

const GENERATION_STEPS = [
  'Generating your custom ERP system...',
  'Building your workspace...',
  'Configuring your intelligent dashboard...',
]

export default function OnboardingPage() {
  // Same initial state on server and client — hydrate draft from localStorage after mount (avoids hydration mismatch).
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingConfig, setPendingConfig] = useState<unknown | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [generationStepIndex, setGenerationStepIndex] = useState(0)
  const [generationProgress, setGenerationProgress] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  /** Blocks duplicate auto-save and prevents sendMessage + useEffect from both calling handleOnboardingComplete. */
  const lastAutoSavedAssistantIdRef = useRef<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const workspaceRes = await fetch('/api/workspace')
        if (!active) return
        if (workspaceRes.ok) {
          localStorage.removeItem(ONBOARDING_DRAFT_KEY)
          router.replace('/dashboard')
          router.refresh()
          return
        }
      } catch {
        // continue to onboarding
      }

      if (!active) return

      try {
        const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as { messages?: Message[]; pendingConfig?: unknown }
          if (parsed.messages && parsed.messages.length > 0) {
            if (!active) return
            setMessages(parsed.messages)
            if (parsed.pendingConfig !== undefined && parsed.pendingConfig !== null) {
              setPendingConfig(parsed.pendingConfig)
            }
            setInitialLoading(false)
            return
          }
        }
      } catch {
        // fall through
      }

      if (!active) return
      await startConversation()
    })()

    return () => {
      active = false
    }
  }, [router])

  // If draft ends with a valid workspace JSON but save never ran, auto-save once per assistant message (resume / refresh).
  useEffect(() => {
    if (initialLoading || loading || saving) return
    if (messages.length === 0) return

    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastAssistant) return
    if (lastAutoSavedAssistantIdRef.current === lastAssistant.id) return

    const content = lastAssistant.content
    const extracted = extractOnboardingConfigText(content)
    if (!extracted.success) return

    let parsed: unknown
    try {
      parsed = JSON.parse(extracted.data)
    } catch {
      return
    }

    const validation = validateOnboardingConfig(parsed)
    if (!validation.success) return

    const looksLikeFinalConfig =
      content.includes('ONBOARDING_COMPLETE') ||
      /```json/i.test(content) ||
      (content.includes('"setup_checklist"') && content.includes('"roles"') && content.includes('"modules"'))

    if (!looksLikeFinalConfig) return

    lastAutoSavedAssistantIdRef.current = lastAssistant.id
    void handleOnboardingComplete(content)
  }, [messages, initialLoading, loading, saving])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    localStorage.setItem(
      ONBOARDING_DRAFT_KEY,
      JSON.stringify({
        messages,
        pendingConfig,
      })
    )
  }, [messages, pendingConfig])

  useEffect(() => {
    if (!saving) return
    const stepTimer = window.setInterval(() => {
      setGenerationStepIndex((prev) => (prev + 1) % GENERATION_STEPS.length)
    }, 1400)
    const progressTimer = window.setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + 7, 94))
    }, 600)
    return () => {
      window.clearInterval(stepTimer)
      window.clearInterval(progressTimer)
    }
  }, [saving])

  function getOnboardingProgress(): number {
    if (saving) return generationProgress
    const userMessages = messages.filter((msg) => msg.role === 'user').length
    return Math.max(10, Math.min(90, userMessages * 14))
  }

  async function startConversation() {
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', parts: [{ text: 'Hello, I want to set up my business management system.' }] }],
        }),
      })

      const data = await response.json()

      if (data.error) {
        if (response.status === 429) {
          toast.error('AI limit reached. Your answers are saved; continue in a moment.')
        } else {
          toast.error(data.error)
        }
        setInitialLoading(false)
        return
      }

      setMessages([
        { id: '1', role: 'assistant', content: data.response },
      ])
    } catch {
      toast.error('Failed to start conversation. Please refresh.')
    } finally {
      setInitialLoading(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    const chatHistory = [...messages, userMessage].map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      })

      const data = await response.json()

      if (data.error) {
        if (response.status === 429) {
          toast.error('AI limit reached. Your progress is saved. Retry in a minute.')
        } else {
          toast.error(data.error)
        }
        setLoading(false)
        return
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
      }

      const containsConfigJson = extractOnboardingConfigText(data.response).success
      const shouldComplete =
        data.response.includes('ONBOARDING_COMPLETE') || containsConfigJson

      if (shouldComplete) {
        lastAutoSavedAssistantIdRef.current = assistantMessage.id
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (shouldComplete) {
        await handleOnboardingComplete(data.response)
      }
    } catch {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOnboardingComplete(response: string) {
    setGenerationStepIndex(0)
    setGenerationProgress(35)
    setSaving(true)
    setSaveError(null)

    try {
      const jsonText = extractOnboardingConfigText(response)
      if (!jsonText.success) {
        toast.error(jsonText.error)
        setSaving(false)
        return
      }

      const config = JSON.parse(jsonText.data)
      setPendingConfig(config)

      const saved = await saveWorkspaceConfig(config)
      if (!saved) return

      setGenerationProgress(100)
      toast.success('Your workspace is ready!')
      localStorage.removeItem(ONBOARDING_DRAFT_KEY)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    } catch {
      toast.error('Failed to process workspace configuration.')
      setSaveError('Failed to process workspace configuration.')
      setSaving(false)
    }
  }

  async function saveWorkspaceConfig(config: unknown): Promise<boolean> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const saveResponse = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (saveResponse.ok) {
        setPendingConfig(null)
        setSaveError(null)
        return true
      }

      let errorMessage = 'Failed to save workspace. Please try again.'
      try {
        const payload = await saveResponse.json()
        if (payload?.error) errorMessage = payload.error
      } catch {
        // ignore parse errors and keep fallback message
      }

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 700 * attempt))
        continue
      }

      toast.error(errorMessage)
      setSaveError(errorMessage)
      setSaving(false)
      return false
    }
    return false
  }

  async function retrySaveWorkspace() {
    if (!pendingConfig || saving) return
    setGenerationStepIndex(0)
    setGenerationProgress(35)
    setSaving(true)
    const saved = await saveWorkspaceConfig(pendingConfig)
    if (!saved) return

    toast.success('Your workspace is ready!')
    localStorage.removeItem(ONBOARDING_DRAFT_KEY)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 1000)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,#3d8bff2a_0%,transparent_42%),radial-gradient(circle_at_70%_80%,#836dff20_0%,transparent_38%)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 ai-panel rounded-2xl px-8 py-7"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-cyan-glow rounded-xl flex items-center justify-center ai-glow">
            <Bot size={24} className="text-white" />
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Loader2 size={16} className="animate-spin" />
            <span>Preparing your onboarding agent...</span>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_8%,#3d8bff29_0%,transparent_36%),radial-gradient(circle_at_80%_88%,#836dff1f_0%,transparent_35%)]" />
      {/* Header */}
      <header className="border-b border-border-primary bg-bg-primary/70 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-accent to-cyan-glow rounded-xl flex items-center justify-center ai-glow">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <div>
              <span className="text-sm font-medium">Rig Base</span>
              <span className="text-text-tertiary text-sm ml-2">Onboarding</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 min-w-[260px]">
            <div className="w-full h-2 rounded-full bg-bg-tertiary border border-border-primary overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent via-cyan-glow to-purple-energy"
                animate={{ width: `${getOnboardingProgress()}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
            <span className="text-xs text-text-tertiary tabular-nums">{getOnboardingProgress()}%</span>
          </div>
          {saving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-accent"
            >
              <Loader2 size={14} className="animate-spin" />
              {GENERATION_STEPS[generationStepIndex]}
            </motion.div>
          )}
          {!saving && saveError && Boolean(pendingConfig) && (
            <button
              onClick={retrySaveWorkspace}
              className="text-xs px-3 py-1 rounded-md border border-accent/50 text-accent hover:bg-accent/15 transition-colors"
            >
              Retry save
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-accent/15 border border-accent/30 rounded-lg flex items-center justify-center">
                    <Bot size={16} className="text-accent" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-accent to-[#2a74ff] text-white ai-glow'
                      : 'ai-card border border-border-primary'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.role === 'assistant'
                      ? message.content.replace(/ONBOARDING_COMPLETE[\s\S]*/, '').trim() || 'Setting up your workspace...'
                      : message.content}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-bg-tertiary border border-border-primary rounded-lg flex items-center justify-center">
                    <User size={16} className="text-text-secondary" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 bg-accent/15 border border-accent/30 rounded-lg flex items-center justify-center">
                <Bot size={16} className="text-accent" />
              </div>
              <div className="ai-card border border-border-primary rounded-xl px-4 py-3">
                <div className="flex gap-1.5">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                    className="ai-thinking-dot"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                    className="ai-thinking-dot"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                    className="ai-thinking-dot"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border-primary bg-bg-primary/75 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <form onSubmit={sendMessage} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || saving}
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-bg-tertiary/90 border border-border-primary rounded-xl resize-none disabled:opacity-50"
              placeholder={saving ? 'Building your workspace...' : 'Tell me about your business...'}
            />
            <button
              type="submit"
              aria-label="Send message"
              title="Send message"
              disabled={!input.trim() || loading || saving}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-tertiary hover:text-cyan-glow disabled:opacity-30 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-xs text-text-tertiary mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
