import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { getProfile, logout as logoutApi } from "../api/auth";
import { ApiError, clearToken, hasToken } from "../api/client";
import { listNotifications } from "../api/notifications";
import { AppShell } from "../components/AppShell";
import {
  AssistantPage,
  type AssistantHandoff,
} from "../pages/AssistantPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { NewRequestPage } from "../pages/NewRequestPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RequestDetailPage } from "../pages/RequestDetailPage";
import { RequestsPage } from "../pages/RequestsPage";
import { SupportHomePage } from "../pages/SupportHomePage";
import { SupportQueuePage } from "../pages/SupportQueuePage";
import { SupportRequestDetailPage } from "../pages/SupportRequestDetailPage";
import type { Employee } from "../types";
import { go, readRoute, type AppRoute } from "./navigation";
import "../styles/app.css";
import "../styles/extra.css";
import "../styles/pages.css";
import "../styles/dark.css";

export default function App() {
  const queryClient = useQueryClient();
  const [current, setCurrent] = useState<AppRoute>(readRoute);
  const [assistantHandoff, setAssistantHandoff] =
    useState<AssistantHandoff | null>(null);
  const [authRevision, setAuthRevision] = useState(0);
  const authenticated = hasToken();

  const profileQuery = useQuery({
    queryKey: ["profile", authRevision],
    queryFn: async () => {
      try {
        return await getProfile();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) clearToken();
        throw error;
      }
    },
    enabled: authenticated,
    retry: false,
  });

  const support = profileQuery.data?.role === "support";
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
    enabled: authenticated && profileQuery.isSuccess && !support,
  });

  useEffect(() => {
    const update = () => setCurrent(readRoute());
    window.addEventListener("hashchange", update);
    if (!location.hash) go("home");
    return () => window.removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    if (!profileQuery.data) return;
    const employeeOnly = ["assistant", "new", "requests", "notifications"];
    if (support && employeeOnly.includes(current.page)) go("home");
    if (!support && current.page === "queue") go("home");
  }, [support, profileQuery.data, current.page]);

  const signedIn = (employee: Employee) => {
    queryClient.clear();
    queryClient.setQueryData(["profile", authRevision + 1], employee);
    setAuthRevision((value) => value + 1);
    go("home");
  };

  const logout = async () => {
    await logoutApi().catch(() => undefined);
    queryClient.clear();
    setAssistantHandoff(null);
    setAuthRevision((value) => value + 1);
    go("home");
  };

  if (!authenticated) return <LoginPage onLogin={signedIn} />;

  if (profileQuery.isPending) {
    return (
      <main className="content">
        <p className="muted">Oturum doğrulanıyor…</p>
      </main>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <LoginPage onLogin={signedIn} />;
  }

  const profile = profileQuery.data;
  const pages: Record<string, ReactNode> = support
    ? {
        home: <SupportHomePage profile={profile} />,
        queue: <SupportQueuePage />,
        detail: (
          <SupportRequestDetailPage id={current.id} profile={profile} />
        ),
        profile: <ProfilePage profile={profile} logout={logout} />,
      }
    : {
        home: <HomePage profile={profile} />,
        assistant: (
          <AssistantPage
            escalate={(handoff) => {
              setAssistantHandoff(handoff);
              go("new");
            }}
          />
        ),
        new: (
          <NewRequestPage
            handoff={assistantHandoff}
            onCreated={() => setAssistantHandoff(null)}
          />
        ),
        requests: <RequestsPage />,
        detail: <RequestDetailPage id={current.id} />,
        notifications: <NotificationsPage />,
        profile: <ProfilePage profile={profile} logout={logout} />,
      };

  return (
    <AppShell
      current={current.page}
      profile={profile}
      unread={notificationsQuery.data?.unread ?? 0}
      logout={logout}
    >
      {pages[current.page] || pages.home}
    </AppShell>
  );
}
