import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

interface WorkspaceContextValue {
  workspaceId: string | null
  setWorkspaceId: (workspaceId: string | null) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const value = useMemo(() => ({ workspaceId, setWorkspaceId }), [workspaceId])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext)
  if (value === null) {
    throw new Error("useWorkspace must be used within WorkspaceProvider")
  }

  return value
}
