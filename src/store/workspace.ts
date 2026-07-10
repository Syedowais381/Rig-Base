import { create } from 'zustand'
import type { WorkspaceConfig, Profile, TimePeriod } from '@/lib/types'
import type { WorkspaceMembership } from '@/lib/workspace-access'

interface WorkspaceState {
  profile: Profile | null
  workspace: WorkspaceConfig | null
  memberships: WorkspaceMembership[]
  timePeriod: TimePeriod
  sidebarOpen: boolean
  setProfile: (profile: Profile | null) => void
  setWorkspace: (workspace: WorkspaceConfig | null) => void
  setMemberships: (memberships: WorkspaceMembership[]) => void
  setTimePeriod: (period: TimePeriod) => void
  toggleSidebar: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  profile: null,
  workspace: null,
  memberships: [],
  timePeriod: 'month',
  sidebarOpen: true,
  setProfile: (profile) => set({ profile }),
  setWorkspace: (workspace) => set({ workspace }),
  setMemberships: (memberships) => set({ memberships }),
  setTimePeriod: (timePeriod) => set({ timePeriod }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
