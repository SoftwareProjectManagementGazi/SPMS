// App shell: sidebar (collapsible) + header + main content

const RouterContext = React.createContext(null);
const useRouter = () => React.useContext(RouterContext);
const AppContext = React.createContext(null);
const useApp = () => React.useContext(AppContext);

const SidebarLogo = ({ collapsed }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px 14px 16px", height: 52, borderBottom: "1px solid var(--border)" }}>
    <div style={{
      width: 26, height: 26, borderRadius: 7, background: "var(--primary)",
      color: "var(--primary-fg)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 11, letterSpacing: -0.3,
      boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--primary) 60%, black), 0 1px 2px color-mix(in oklch, var(--primary) 40%, black)",
    }}>SP</div>
    {!collapsed && (
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: -0.2 }}>SPMS</div>
        <div className="mono" style={{ fontSize: 9.5, color: "var(--fg-subtle)", marginTop: 2 }}>v2.4 · acme.co</div>
      </div>
    )}
  </div>
);

const NavItem = ({ icon, label, active, onClick, collapsed, badge, shortcut }) => (
  <button onClick={onClick} title={collapsed ? label : undefined}
    style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: collapsed ? "0 0" : "0 10px", height: 30, width: "100%",
      justifyContent: collapsed ? "center" : "flex-start",
      borderRadius: "var(--radius-sm)",
      color: active ? "var(--fg)" : "var(--fg-muted)",
      background: active ? "var(--accent)" : "transparent",
      fontWeight: active ? 600 : 500, fontSize: 13,
      transition: "background 0.1s, color 0.1s",
      position: "relative",
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-2)"; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
  >
    <span style={{ color: active ? "var(--primary)" : "var(--fg-subtle)", display: "inline-flex" }}>{icon}</span>
    {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{label}</span>}
    {!collapsed && badge != null && <Badge size="xs" tone={active ? "primary" : "neutral"}>{badge}</Badge>}
    {!collapsed && shortcut && <Kbd>{shortcut}</Kbd>}
  </button>
);

const Sidebar = () => {
  const router = useRouter();
  const app = useApp();
  const collapsed = app.sidebarCollapsed;
  const lang = app.language;
  const t = (k) => window.SPMSi18n.t(k, lang);
  const isAdmin = window.SPMSData.CURRENT_USER.role === "Admin";

  const items = [
    { id: "dashboard", icon: <Icons.Dashboard/>, label: t("nav.dashboard"), shortcut: "G D" },
    { id: "projects", icon: <Icons.Folder/>, label: t("nav.projects"), shortcut: "G P", badge: window.SPMSData.PROJECTS.length },
    { id: "my-tasks", icon: <Icons.CheckSquare/>, label: t("nav.myTasks"), shortcut: "G T" },
    { id: "teams", icon: <Icons.Users/>, label: t("nav.teams") },
    { id: "reports", icon: <Icons.Chart/>, label: t("nav.reports") },
    { id: "settings", icon: <Icons.Settings/>, label: t("nav.settings") },
  ];

  return (
    <aside style={{
      width: collapsed ? 56 : 232, flexShrink: 0,
      borderRight: "1px solid var(--border)",
      background: "var(--bg-2)",
      display: "flex", flexDirection: "column",
      transition: "width 0.18s ease",
      height: "100vh", position: "sticky", top: 0,
    }}>
      <SidebarLogo collapsed={collapsed}/>
      <div style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
        {!collapsed && <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.6, textTransform: "uppercase", padding: "8px 10px 4px" }}>{lang === "tr" ? "ÇALIŞMA" : "WORKSPACE"}</div>}
        {items.map((it) => (
          <NavItem key={it.id} {...it} collapsed={collapsed}
            active={router.page === it.id || (it.id === "projects" && router.page.startsWith("project"))}
            onClick={() => router.go(it.id)} />
        ))}
        {isAdmin && (
          <>
            {!collapsed && <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.6, textTransform: "uppercase", padding: "16px 10px 4px" }}>{lang === "tr" ? "YÖNETİM" : "ADMIN"}</div>}
            {collapsed && <div style={{ height: 1, background: "var(--border)", margin: "8px 8px" }}/>}
            <NavItem icon={<Icons.Shield/>} label={t("nav.admin")} collapsed={collapsed}
              active={router.page.startsWith("admin")} onClick={() => router.go("admin")} />
          </>
        )}
      </div>
      <div style={{ borderTop: "1px solid var(--border)", padding: 10, position: "relative" }}>
        <SidebarUserMenu collapsed={collapsed} router={router} lang={lang}/>
      </div>
    </aside>
  );
};

const SidebarUserMenu = ({ collapsed, router, lang }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();
  const user = window.SPMSData.CURRENT_USER;
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: 0, textAlign: "left" }}>
        <Avatar user={user} size={28}/>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{user.role}</div>
          </div>
        )}
        {!collapsed && <Icons.ChevronUp size={12} style={{ color: "var(--fg-subtle)" }}/>}
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: "100%", left: 8, right: 8, marginBottom: 4, background: "var(--surface)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 4, zIndex: 100 }}>
          <button onClick={() => { router.go("user-profile", { userId: user.id }); setOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 5, fontSize: 12.5, textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Icons.Users size={13} style={{ color: "var(--fg-subtle)" }}/>{lang === "tr" ? "Profilim" : "My Profile"}
          </button>
          <button onClick={() => { router.go("settings"); setOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 5, fontSize: 12.5, textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Icons.Settings size={13} style={{ color: "var(--fg-subtle)" }}/>{lang === "tr" ? "Ayarlar" : "Settings"}
          </button>
          {user.role === "Admin" && (
            <button onClick={() => { router.go("admin"); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 5, fontSize: 12.5, textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Icons.Shield size={13} style={{ color: "var(--fg-subtle)" }}/>{lang === "tr" ? "Yönetim Paneli" : "Admin Panel"}
            </button>
          )}
          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }}/>
          <button onClick={() => { router.go("login"); setOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 5, fontSize: 12.5, textAlign: "left", color: "var(--priority-critical)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Icons.LogOut size={13}/>{lang === "tr" ? "Çıkış Yap" : "Sign Out"}
          </button>
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const router = useRouter();
  const app = useApp();
  const lang = app.language;
  const unread = window.SPMSData.NOTIFICATIONS.filter(n => n.unread).length;
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <header style={{
      height: 52, borderBottom: "1px solid var(--border)",
      background: "var(--bg)",
      display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
      position: "sticky", top: 0, zIndex: 30,
    }}>
      <button onClick={() => app.setSidebarCollapsed(!app.sidebarCollapsed)}
        title={lang === "tr" ? "Kenar çubuğu" : "Sidebar"}
        style={{ color: "var(--fg-muted)", padding: 6, borderRadius: 6 }}
      ><Icons.PanelLeft/></button>
      <div style={{ color: "var(--fg-subtle)", fontSize: 13 }}>
        <Breadcrumb/>
      </div>
      <div style={{ flex: 1 }}/>
      <Input icon={<Icons.Search size={14}/>} placeholder={lang === "tr" ? "Her şeyde ara…" : "Search…"} kbdHint="⌘K" style={{ width: 260 }} size="sm"/>
      <Button variant="primary" size="sm" icon={<Icons.Plus size={14}/>} onClick={() => window.__openTaskModal && window.__openTaskModal()}>{lang === "tr" ? "Görev oluştur" : "Create task"}</Button>
      <button style={{ position: "relative", color: "var(--fg-muted)", padding: 6, borderRadius: 6 }}>
        <Icons.Bell/>
        {unread > 0 && <span style={{
          position: "absolute", top: 3, right: 3,
          background: "var(--priority-critical)", color: "#fff",
          fontSize: 9, fontWeight: 700, minWidth: 14, height: 14, padding: "0 3px",
          borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 2px var(--bg)",
        }}>{unread}</span>}
      </button>
      <button style={{ color: "var(--fg-muted)", padding: 6, borderRadius: 6 }} title={lang === "tr" ? "Yardım" : "Help"}><Icons.Help/></button>
      <button onClick={() => app.setLanguage(lang === "tr" ? "en" : "tr")} title="Language toggle"
        style={{ color: "var(--fg-muted)", padding: 6, borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.5 }}>
        {lang.toUpperCase()}
      </button>
    </header>
  );
};

const Breadcrumb = () => {
  const router = useRouter();
  const lang = useApp().language;
  const parts = useMemo(() => {
    const p = router.page;
    if (p === "dashboard") return [{ label: lang === "tr" ? "Panel" : "Dashboard" }];
    if (p === "projects") return [{ label: lang === "tr" ? "Projeler" : "Projects" }];
    if (p === "project-detail") {
      const proj = window.SPMSData.getProject(router.params.projectId);
      return [{ label: lang === "tr" ? "Projeler" : "Projects", onClick: () => router.go("projects") }, { label: proj?.name }];
    }
    if (p === "task-detail") {
      const task = window.SPMSData.TASKS.find(t => t.id === router.params.taskId);
      return [{ label: lang === "tr" ? "Görevler" : "Tasks" }, { label: task?.key }];
    }
    if (p === "workflow-editor") {
      return [{ label: lang === "tr" ? "Projeler" : "Projects", onClick: () => router.go("projects") }, { label: lang === "tr" ? "İş Akışı" : "Workflow" }];
    }
    if (p.startsWith("admin")) {
      const sub = p === "admin" ? null : p.slice(6);
      const labels = { users: lang === "tr" ? "Kullanıcılar" : "Users", roles: lang === "tr" ? "Roller" : "Roles", permissions: lang === "tr" ? "İzinler" : "Permissions", projects: lang === "tr" ? "Projeler" : "Projects", workflows: lang === "tr" ? "Şablonlar" : "Templates", audit: "Audit", stats: lang === "tr" ? "İstatistik" : "Stats" };
      return [{ label: lang === "tr" ? "Yönetim" : "Admin", onClick: () => router.go("admin") }, sub && { label: labels[sub] || sub }].filter(Boolean);
    }
    if (p === "settings") return [{ label: lang === "tr" ? "Ayarlar" : "Settings" }];
    if (p === "my-tasks") return [{ label: lang === "tr" ? "Görevlerim" : "My Tasks" }];
    if (p === "teams") return [{ label: lang === "tr" ? "Takımlar" : "Teams" }];
    if (p === "reports") return [{ label: lang === "tr" ? "Raporlar" : "Reports" }];
    if (p === "notifications") return [{ label: lang === "tr" ? "Bildirimler" : "Notifications" }];
    return [{ label: p }];
  }, [router.page, router.params, lang]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Icons.ChevronRight size={12} style={{ color: "var(--fg-subtle)" }}/>}
          <span onClick={p.onClick} style={{ fontSize: 13, fontWeight: i === parts.length - 1 ? 600 : 500, color: i === parts.length - 1 ? "var(--fg)" : "var(--fg-muted)", cursor: p.onClick ? "pointer" : "default" }}>{p.label}</span>
        </React.Fragment>
      ))}
    </div>
  );
};

Object.assign(window, { RouterContext, AppContext, useRouter, useApp, Sidebar, Header });
