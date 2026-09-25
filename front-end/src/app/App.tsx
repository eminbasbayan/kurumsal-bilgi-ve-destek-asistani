import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "../components/AppShell";
import { profile } from "../data";
import { AssistantPage } from "../pages/AssistantPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { NewRequestPage } from "../pages/NewRequestPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RequestDetailPage } from "../pages/RequestDetailPage";
import { RequestsPage } from "../pages/RequestsPage";
import type { RequestDraft, SupportRequest } from "../types";
import { STORAGE_KEY, go, readRoute, type AppRoute } from "./navigation";
import { initialStore, type AppStore } from "./store";
import "../styles/app.css";
import "../styles/extra.css";
import "../styles/pages.css";
import "../styles/dark.css";

export default function App() {
  const [store, setStore] = useState<AppStore>(initialStore);
  const [current, setCurrent] = useState<AppRoute>(readRoute);
  const [assistantContext, setAssistantContext] = useState("");
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);
  useEffect(() => {
    const update = () => setCurrent(readRoute());
    window.addEventListener("hashchange", update);
    if (!location.hash) go("home");
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const logout = () => setStore((currentStore) => ({ ...currentStore, loggedIn: false }));
  const create = (draft: RequestDraft) => {
    const id = Math.max(...store.requests.map((item) => item.id)) + 1;
    const number = `DST-2026-${1042 + id - 10}`;
    const stamp = new Date().toLocaleString("tr-TR");
    const item: SupportRequest = {
      ...draft,
      id,
      number,
      status: "Yeni",
      createdAt: stamp,
      updatedAt: stamp,
      team: `${draft.category} Ekibi`,
      messages: [],
      timeline: [{ label: "Talep oluşturuldu", date: stamp }],
    };
    setStore((currentStore) => ({
      ...currentStore,
      requests: [item, ...currentStore.requests],
      notifications: [
        {
          id: Date.now(),
          title: "Talebiniz oluşturuldu",
          text: `${number} numaralı talebiniz kaydedildi.`,
          date: "Şimdi",
          read: false,
          requestId: id,
        },
        ...currentStore.notifications,
      ],
    }));
    setAssistantContext("");
    go(`request/${id}`);
  };
  const addMessage = (id: number, text: string) =>
    setStore((currentStore) => ({
      ...currentStore,
      requests: currentStore.requests.map((item) =>
        item.id === id
          ? {
              ...item,
              updatedAt: "Şimdi",
              messages: [
                ...item.messages,
                {
                  id: Date.now(),
                  author: profile.name,
                  role: "employee",
                  text,
                  date: "Şimdi",
                },
              ],
              timeline: [
                ...item.timeline,
                { label: "Mesaj gönderildi", date: "Şimdi" },
              ],
            }
          : item,
      ),
    }));
  if (!store.loggedIn)
    return (
      <LoginPage
        onLogin={() => {
          setStore((currentStore) => ({ ...currentStore, loggedIn: true }));
          go("home");
        }}
      />
    );
  const pages: Record<string, ReactNode> = {
    home: <HomePage requests={store.requests} />,
    assistant: (
      <AssistantPage
        escalate={(context) => {
          setAssistantContext(context);
          go("new");
        }}
      />
    ),
    new: <NewRequestPage context={assistantContext} create={create} />,
    requests: <RequestsPage items={store.requests} />,
    detail: (
      <RequestDetailPage
        item={store.requests.find((item) => item.id === current.id)}
        addMessage={addMessage}
      />
    ),
    notifications: (
      <NotificationsPage
        items={store.notifications}
        read={(id, requestId) => {
          setStore((currentStore) => ({
            ...currentStore,
            notifications: currentStore.notifications.map((item) =>
              item.id === id ? { ...item, read: true } : item,
            ),
          }));
          if (requestId) go(`request/${requestId}`);
        }}
        readAll={() =>
          setStore((currentStore) => ({
            ...currentStore,
            notifications: currentStore.notifications.map((item) => ({
              ...item,
              read: true,
            })),
          }))
        }
      />
    ),
    profile: <ProfilePage logout={logout} />,
  };
  return (
    <AppShell
      current={current.page}
      unread={store.notifications.filter((item) => !item.read).length}
      logout={logout}
    >
      {pages[current.page] || pages.home}
    </AppShell>
  );
}
