import { useState, type ReactNode } from "react";
import { Avatar, DropdownMenu, IconButton, Tooltip } from "@radix-ui/themes";
import {
  BellIcon,
  ChatBubbleIcon,
  DashboardIcon,
  ExitIcon,
  HamburgerMenuIcon,
  PersonIcon,
  PlusIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import type { Employee } from "../types";
import { go, PAGE_TITLES } from "../app/navigation";
import { ThemeToggleButton } from "./ThemeToggleButton";

export function AppShell({
  children,
  current,
  profile,
  unread,
  logout,
}: {
  children: ReactNode;
  current: string;
  profile: Employee;
  unread: number;
  logout: () => void | Promise<void>;
}) {
  const [menu, setMenu] = useState(false);
  const active = current === "detail" ? "requests" : current;
  const nav = [
    { path: "home", label: "Ana Sayfa", Icon: DashboardIcon },
    { path: "assistant", label: "Bilgi Asistanı", Icon: ChatBubbleIcon },
    { path: "new", label: "Yeni Destek Talebi", Icon: PlusIcon },
    { path: "requests", label: "Taleplerim", Icon: ReaderIcon },
    { path: "notifications", label: "Bildirimler", Icon: BellIcon },
    { path: "profile", label: "Profil", Icon: PersonIcon },
  ] as const;
  return (
    <div className="shell">
      <aside className={`sidebar ${menu ? "show" : ""}`}>
        <a className="brand" href="#/home" onClick={() => setMenu(false)}>
          <span className="brand-mark">K</span> Kurumsal Destek
        </a>
        <nav aria-label="Ana menü">
          <p className="nav-caption">ÇALIŞMA ALANI</p>
          {nav.map(({ path, label, Icon }, index) => (
            <div key={path}>
              {index === 4 && <p className="nav-caption">HESAP</p>}
              <a
                className={active === path ? "active" : ""}
                href={`#/${path}`}
                onClick={() => setMenu(false)}
              >
                <Icon />
                <span>{label}</span>
                {path === "notifications" && unread > 0 && <b>{unread}</b>}
              </a>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span>DEMO ORTAMI</span>
          <p>Kurumsal veriler örnek içeriktir.</p>
        </div>
      </aside>
      {menu && (
        <button
          className="scrim"
          aria-label="Menüyü kapat"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-wrap">
        <div className="topbar">
          <div className="topbar-title">
            <IconButton
              className="mobile-menu"
              variant="ghost"
              aria-label="Menüyü aç"
              onClick={() => setMenu(true)}
            >
              <HamburgerMenuIcon />
            </IconButton>
            <span>
              Çalışan portalı
              <strong>{PAGE_TITLES[current] || "Kurumsal Destek"}</strong>
            </span>
          </div>
          <div className="topbar-actions">
            <Tooltip content="Bildirimler">
              <IconButton
                variant="soft"
                aria-label={`Bildirimler, ${unread} okunmamış`}
                onClick={() => go("notifications")}
              >
                <BellIcon />
                {unread > 0 && <i className="bell-dot" />}
              </IconButton>
            </Tooltip>
            <ThemeToggleButton />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <button className="user-menu">
                  <Avatar fallback={profile.initials} size="2" radius="full" />
                  <span>
                    <strong>{profile.name}</strong>
                    <small>{profile.department}</small>
                  </span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item onSelect={() => go("profile")}>
                  <PersonIcon /> Profil
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item color="red" onSelect={() => void logout()}>
                  <ExitIcon /> Çıkış yap
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
