import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_MODEL,
  PRESETS,
  type Attachment,
  type ChatMessage,
  type RuntimeSettings,
  type Sampling,
  type Session,
} from "./types";

type StudioState = {
  sessions: Session[];
  currentId: string;
  sampling: Sampling;
  runtime: RuntimeSettings;
  draft: string;
  draftImage: Attachment | null;
  select: (id: string) => void;
  createSession: () => void;
  deleteSession: (id: string) => void;
  setDraft: (draft: string) => void;
  setDraftImage: (image: Attachment | null) => void;
  setSampling: (patch: Partial<Sampling>) => void;
  applyPreset: (preset: Sampling["preset"]) => void;
  setRuntime: (patch: Partial<RuntimeSettings>) => void;
  pushTurn: (sessionId: string, messages: ChatMessage[]) => void;
  patchMessage: (
    sessionId: string,
    messageId: string,
    patch: Partial<ChatMessage>,
  ) => void;
};

function blankSession(): Session {
  return {
    id: crypto.randomUUID(),
    title: "New thread",
    updatedAt: Date.now(),
    messages: [],
  };
}

const first = blankSession();

function touchTitle(session: Session, messages: ChatMessage[]): string {
  if (session.title !== "New thread") return session.title;
  const user = messages.find((m) => m.role === "user" && m.content.trim());
  if (!user) return session.title;
  const line = user.content.trim().replace(/\s+/g, " ");
  return line.length > 52 ? `${line.slice(0, 52)}…` : line;
}

export const useStudio = create<StudioState>()(
  persist(
    (set) => ({
      sessions: [first],
      currentId: first.id,
      sampling: { preset: "coding", ...PRESETS.coding.sampling },
      runtime: {
        mode: "preview",
        baseUrl: "http://127.0.0.1:8000",
        model: DEFAULT_MODEL,
        apiKey: "",
      },
      draft: "",
      draftImage: null,
      select: (id) => set({ currentId: id }),
      createSession: () =>
        set((state) => {
          const session = blankSession();
          return {
            sessions: [session, ...state.sessions].slice(0, 24),
            currentId: session.id,
            draft: "",
            draftImage: null,
          };
        }),
      deleteSession: (id) =>
        set((state) => {
          const rest = state.sessions.filter((s) => s.id !== id);
          if (rest.length === 0) {
            const session = blankSession();
            return { sessions: [session], currentId: session.id };
          }
          const currentId =
            state.currentId === id ? rest[0]!.id : state.currentId;
          return { sessions: rest, currentId };
        }),
      setDraft: (draft) => set({ draft }),
      setDraftImage: (draftImage) => set({ draftImage }),
      setSampling: (patch) =>
        set((state) => ({ sampling: { ...state.sampling, ...patch } })),
      applyPreset: (preset) =>
        set({ sampling: { preset, ...PRESETS[preset].sampling } }),
      setRuntime: (patch) =>
        set((state) => ({ runtime: { ...state.runtime, ...patch } })),
      pushTurn: (sessionId, messages) =>
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id !== sessionId) return session;
            const next = [...session.messages, ...messages].slice(-40);
            return {
              ...session,
              messages: next,
              title: touchTitle(session, next),
              updatedAt: Date.now(),
            };
          }),
        })),
      patchMessage: (sessionId, messageId, patch) =>
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id !== sessionId) return session;
            return {
              ...session,
              updatedAt: Date.now(),
              messages: session.messages.map((message) =>
                message.id === messageId ? { ...message, ...patch } : message,
              ),
            };
          }),
        })),
    }),
    {
      name: "cyber-tiel-studio",
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions.map((session) => ({
          ...session,
          messages: session.messages.map((message) => ({
            ...message,
            attachments: message.attachments?.map((item) => ({
              name: item.name,
              width: item.width,
              height: item.height,
            })),
          })),
        })),
        currentId: state.currentId,
        sampling: state.sampling,
        runtime: state.runtime,
      }),
    },
  ),
);
