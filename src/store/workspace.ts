import { create } from 'zustand'
import type { WorkspaceConfig, Profile, TimePeriod } from '@/lib/types'

interface WorkspaceState {
  profile: Profile | null
  workspace: WorkspaceConfig | null
  timePeriod: TimePeriod
  sidebarOpen: boolean
  setProfile: (profile: Profile | null) => void
  setWorkspace: (workspace: WorkspaceConfig | null) => void
  setTimePeriod: (period: TimePeriod) => void
  toggleSidebar: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  profile: null,
  workspace: null,
  timePeriod: 'month',
  sidebarOpen: true,
  setProfile: (profile) => set({ profile }),
  setWorkspace: (workspace) => set({ workspace }),
  setTimePeriod: (timePeriod) => set({ timePeriod }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
