'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, ClipboardList } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { resolveSetupChecklist, getSetupProgress, type SetupDataCounts } from '@/lib/setup-checklist'
import type { WorkspaceConfig } from '@/lib/types'

interface SetupChecklistButtonProps {
  workspace: WorkspaceConfig
  counts: SetupDataCounts
}

export function SetupChecklistButton({ workspace, counts }: SetupChecklistButtonProps) {
  const [open, setOpen] = useState(false)

  const items = useMemo(
    () => resolveSetupChecklist(workspace.setup_checklist, counts, workspace),
    [workspace, counts]
  )
  const progress = useMemo(() => getSetupProgress(items), [items])

  if (items.length === 0 || progress.isComplete) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full ai-panel border border-border-primary shadow-lg hover:border-accent/40 transition-colors text-sm font-medium"
        aria-label="Open setup checklist"
      >
        <ClipboardList size={16} className="text-accent" />
        <span>Setup</span>
        <span className="text-xs text-text-tertiary">
          {progress.completed}/{progress.total}
        </span>
        <span className="w-12 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <span
            className="block h-full bg-accent rounded-full transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Setup checklist">
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs text-text-tertiary mb-2">
            <span>{progress.completed} of {progress.total} completed</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {items.map((task) => (
            <div key={task.id} className="flex items-start gap-3 py-2 border-b border-border-primary/60 last:border-0">
              {task.completed ? (
                <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-0.5" />
              ) : (
                <Circle size={18} className="text-text-tertiary flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm ${task.completed ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                  {task.title}
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">{task.description}</p>
                <p className="text-[10px] uppercase tracking-wide text-text-tertiary mt-1">{task.module}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}
