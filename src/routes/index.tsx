import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Studio } from "@/studio/studio";
import { useStudio } from "@/studio/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve(useStudio.persist.rehydrate()).finally(() => {
      if (cancelled) return;
      const { sessions, currentId, select } = useStudio.getState();
      if (!sessions.some((session) => session.id === currentId) && sessions[0]) {
        select(sessions[0].id);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return <Frame />;
  return <Studio />;
}

function Frame() {
  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <header className="flex h-14 items-center border-b border-line px-4">
        <h1 className="text-lg font-medium tracking-tight">Cyber-Tiel</h1>
        <span className="ml-2 text-sm text-muted">Studio</span>
      </header>
    </div>
  );
}
