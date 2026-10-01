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
  const support = profile.role === "support";
  const active =
    current === "detail" ? (support ? "queue" : "requests") : current;
  const workspace = support
    ? [
        { path: "home", label: "Ana Sayfa", Icon: DashboardIcon },
        { path: "queue", label: "Ekip Kuyruğu", Icon: ReaderIcon },
      ]
    : [
        { path: "home", label: "Ana Sayfa", Icon: DashboardIcon },
        { path: "assistant", label: "Bilgi Asistanı", Icon: ChatBubbleIcon },
        { path: "new", label: "Yeni Destek Talebi", Icon: PlusIcon },
        { path: "requests", label: "Taleplerim", Icon: ReaderIcon },
      ];
  const account = support
    ? [{ path: "profile", label: "Profil", Icon: PersonIcon }]
    : [
        { path: "notifications", label: "Bildirimler", Icon: BellIcon },
        { path: "profile", label: "Profil", Icon: PersonIcon },
      ];
  return (
    <div className="shell">
      <aside className={`sidebar ${menu ? "show" : ""}`}>
        <a className="brand" href="#/home" onClick={() => setMenu(false)}>
          <span className="brand-mark">K</span> Kurumsal Destek
        </a>
        <nav aria-label="Ana menü">
          <p className="nav-caption">{support ? "EKİP" : "ÇALIŞMA ALANI"}</p>
          {workspace.map(({ path, label, Icon }) => (
            <a
              key={path}
              className={active === path ? "active" : ""}
              href={`#/${path}`}
              onClick={() => setMenu(false)}
            >
              <Icon />
              <span>{label}</span>
            </a>
          ))}
          <p className="nav-caption">HESAP</p>
          {account.map(({ path, label, Icon }) => (
            <a
              key={path}
              className={active === path ? "active" : ""}
              href={`#/${path}`}
              onClick={() => setMenu(false)}
            >
              <Icon />
              <span>{label}</span>
              {path === "notifications" && unread > 0 && <b>{unread}</b>}
            </a>
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
              {support ? "Destek personeli" : "Çalışan portalı"}
              <strong>{PAGE_TITLES[current] || "Kurumsal Destek"}</strong>
            </span>
          </div>
          <div className="topbar-actions">
            {!support && (
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
            )}
            <ThemeToggleButton />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <button
                  className="user-menu"
                  type="button"
                  aria-label={`${profile.name}, hesap menüsü`}
                >
                  <Avatar fallback={profile.initials} size="2" radius="full" />
                  <span className="user-menu-info">
                    <strong>{profile.name}</strong>
                    <small>
                      {support && profile.team
                        ? profile.team
                        : profile.department}
                    </small>
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
