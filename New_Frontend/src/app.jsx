// Root app: state management, router, mounting.

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// Router
const useRouterState = () => {
  const getInitial = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("spms.route") || "null");
      if (saved) return saved;
    } catch (e) {}
    return { page: "dashboard", params: {} };
  };
  const [state, setState] = useState(getInitial);
  const go = useCallback((page, params = {}) => {
    setState({ page, params });
  }, []);
  useEffect(() => {
    try { localStorage.setItem("spms.route", JSON.stringify(state)); } catch (e) {}
  }, [state]);
  return { ...state, go };
};

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "preset": "default",
  "mode": "light",
  "language": "tr",
  "density": "cozy",
  "sidebarCollapsed": false,
  "radius": 8,
  "baseSize": 14,
  "fontId": "geist",
  "brandLight": 0.60,
  "brandChroma": 0.17,
  "brandHue": 40,
  "currentUserId": "u1"
}/*EDITMODE-END*/;

const useAppState = () => {
  const load = (k, def) => {
    try { const v = localStorage.getItem("spms." + k); return v !== null ? JSON.parse(v) : def; } catch (e) { return def; }
  };
  const save = (k, v) => { try { localStorage.setItem("spms." + k, JSON.stringify(v)); } catch (e) {} };

  const [preset, setPreset] = useState(() => load("preset", DEFAULTS.preset));
  const [mode, setMode] = useState(() => load("mode", DEFAULTS.mode));
  const [language, setLanguage] = useState(() => load("language", DEFAULTS.language));
  const [density, setDensity] = useState(() => load("density", DEFAULTS.density));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => load("sidebarCollapsed", DEFAULTS.sidebarCollapsed));
  const [radius, setRadius] = useState(() => load("radius", DEFAULTS.radius));
  const [baseSize, setBaseSize] = useState(() => load("baseSize", DEFAULTS.baseSize));
  const [fontId, setFontId] = useState(() => load("fontId", DEFAULTS.fontId));
  const [brandLight, setBrandLight] = useState(() => load("brandLight", DEFAULTS.brandLight));
  const [brandChroma, setBrandChroma] = useState(() => load("brandChroma", DEFAULTS.brandChroma));
  const [brandHue, setBrandHue] = useState(() => load("brandHue", DEFAULTS.brandHue));
  const [customColors, setCustomColors] = useState(() => load("customColors", false));
  const [customPresets, setCustomPresets] = useState(() => load("customPresets", []));
  const [currentUserId, setCurrentUserId] = useState(() => load("currentUserId", DEFAULTS.currentUserId));

  // Persist
  useEffect(() => save("preset", preset), [preset]);
  useEffect(() => save("mode", mode), [mode]);
  useEffect(() => save("language", language), [language]);
  useEffect(() => save("density", density), [density]);
  useEffect(() => save("sidebarCollapsed", sidebarCollapsed), [sidebarCollapsed]);
  useEffect(() => save("radius", radius), [radius]);
  useEffect(() => save("baseSize", baseSize), [baseSize]);
  useEffect(() => save("fontId", fontId), [fontId]);
  useEffect(() => save("brandLight", brandLight), [brandLight]);
  useEffect(() => save("brandChroma", brandChroma), [brandChroma]);
  useEffect(() => save("brandHue", brandHue), [brandHue]);
  useEffect(() => save("customColors", customColors), [customColors]);
  useEffect(() => save("customPresets", customPresets), [customPresets]);
  useEffect(() => save("currentUserId", currentUserId), [currentUserId]);

  // Apply theme tokens
  useEffect(() => {
    const p = window.SPMSTheme.resolvePreset(preset, customPresets);
    let tokens = p.tokens;
    let m = p.mode;
    if (customColors) {
      tokens = window.SPMSTheme.deriveFromBrand({ L: brandLight, C: brandChroma, H: brandHue, mode });
      m = mode;
    }
    window.SPMSTheme.applyTokens(tokens);
    window.SPMSTheme.applyMode(m);
  }, [preset, customColors, brandLight, brandChroma, brandHue, mode, customPresets]);

  useEffect(() => { window.SPMSTheme.applyRadius(radius); }, [radius]);
  useEffect(() => {
    document.documentElement.style.fontSize = `${baseSize}px`;
    document.documentElement.dataset.density = density;
  }, [baseSize, density]);

  useEffect(() => {
    const fonts = {
      geist: { sans: '"Geist", "Geist Fallback", system-ui, sans-serif', mono: '"Geist Mono", ui-monospace, monospace' },
      inst: { sans: '"Instrument Sans", system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' },
      manrope: { sans: '"Manrope", system-ui, sans-serif', mono: '"IBM Plex Mono", ui-monospace, monospace' },
      system: { sans: "system-ui, -apple-system, sans-serif", mono: "ui-monospace, monospace" },
    };
    const f = fonts[fontId] || fonts.geist;
    document.documentElement.style.setProperty("--font-sans", f.sans);
    document.documentElement.style.setProperty("--font-mono", f.mono);
  }, [fontId]);

  useEffect(() => {
    window.SPMSData.CURRENT_USER = window.SPMSData.getUser(currentUserId) || window.SPMSData.USERS[0];
  }, [currentUserId]);

  const applyPreset = useCallback((id) => { setPreset(id); setCustomColors(false); }, []);
  const setModeFn = useCallback((m) => { setMode(m); if (m === "dark" && !customColors && ["default","ocean","forest","monochrome"].includes(preset)) setPreset("midnight"); if (m === "light" && !customColors && ["midnight","graphite"].includes(preset)) setPreset("default"); }, [customColors, preset]);
  const applyCustomBrand = useCallback(({ L, C, H }) => { setBrandLight(L); setBrandChroma(C); setBrandHue(H); setCustomColors(true); }, []);
  const saveCustomPreset = useCallback(({ L, C, H }) => {
    const id = "custom-" + Date.now();
    const tokens = window.SPMSTheme.deriveFromBrand({ L, C, H, mode });
    const np = { id, name: `Custom ${customPresets.length + 1}`, mode, tokens };
    setCustomPresets([...customPresets, np]);
    setPreset(id);
    setCustomColors(false);
  }, [customPresets, mode]);
  const setFont = useCallback((id) => setFontId(id), []);

  return {
    preset, mode, language, density, sidebarCollapsed, radius, baseSize, fontId,
    brandLight, brandChroma, brandHue, customColors, customPresets, currentUserId,
    setLanguage, setDensity, setSidebarCollapsed, setRadius, setBaseSize, setFont,
    setMode: setModeFn, applyPreset, applyCustomBrand, saveCustomPreset,
    setAsUser: setCurrentUserId,
  };
};

/* ---------------- App ---------------- */
const App = () => {
  const router = useRouterState();
  const app = useAppState();
  const [taskModalOpen, setTaskModalOpen] = React.useState(false);
  const [taskModalProject, setTaskModalProject] = React.useState(null);

  const openTaskModal = (projectId) => { setTaskModalProject(projectId || null); setTaskModalOpen(true); };
  const closeTaskModal = () => { setTaskModalOpen(false); setTaskModalProject(null); };

  // Expose modal opener globally so Header and ProjectDetail can use it
  React.useEffect(() => { window.__openTaskModal = openTaskModal; }, []);

  // If on auth pages, render without shell
  if (router.page.startsWith("auth-") || router.page === "login") {
    const mode = router.page === "auth-register" ? "register" : router.page === "auth-forgot" ? "forgot" : "login";
    return (
      <RouterContext.Provider value={router}>
        <AppContext.Provider value={app}>
          <AuthPage mode={mode}/>
          <TweaksPanel/>
        </AppContext.Provider>
      </RouterContext.Provider>
    );
  }

  return (
    <RouterContext.Provider value={router}>
      <AppContext.Provider value={app}>
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
          <Sidebar/>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <Header/>
            <main style={{ flex: 1, padding: 24, overflow: "auto" }}>
              <PageRouter/>
            </main>
          </div>
        </div>
        <CreateTaskModal open={taskModalOpen} onClose={closeTaskModal} defaultProjectId={taskModalProject}/>
        <TweaksPanel/>
      </AppContext.Provider>
    </RouterContext.Provider>
  );
};

const PageRouter = () => {
  const router = useRouter();
  const p = router.page;
  if (p === "dashboard") return <DashboardPage/>;
  if (p === "projects") return <ProjectsPage/>;
  if (p === "project-detail") return <ProjectDetailPage/>;
  if (p === "task-detail") return <TaskDetailPage/>;
  if (p === "workflow-editor") return <WorkflowEditorPage/>;
  if (p === "my-tasks") return <MyTasksPage/>;
  if (p === "user-profile") return <UserProfilePage/>;
  if (p === "create-project") return <CreateProjectPage/>;
  if (p === "teams") return <TeamsPage/>;
  if (p === "reports") return <ReportsPage/>;
  if (p === "settings") return <SettingsPage/>;
  if (p === "notifications" || p === "inbox") return <InboxPage/>;
  if (p === "calendar") return <CalendarPage/>;
  if (p === "search") return <SearchPage/>;
  if (p === "docs") return <DocsPage/>;
  if (p.startsWith("admin")) return <AdminPage/>;
  return <div style={{ padding: 40, color: "var(--fg-muted)" }}>Page not found: {p}</div>;
};

const TEAMS_SEED = [
  { id: "t1", name: { tr: "Mobil", en: "Mobile" }, lead: "u3", members: ["u3","u5","u6"], color: "var(--primary)", folder: "eng" },
  { id: "t2", name: { tr: "Backend", en: "Backend" }, lead: "u2", members: ["u2","u4","u8"], color: "var(--status-progress)", folder: "eng" },
  { id: "t3", name: { tr: "Platform & DevOps", en: "Platform & DevOps" }, lead: "u4", members: ["u4","u8"], color: "oklch(0.60 0.12 260)", folder: "eng" },
  { id: "t4", name: { tr: "Veri & Analitik", en: "Data & Analytics" }, lead: "u7", members: ["u7","u9"], color: "var(--status-review)", folder: "data" },
  { id: "t5", name: { tr: "Ürün Yönetimi", en: "Product Management" }, lead: "u1", members: ["u1","u10"], color: "var(--priority-critical)", folder: "product" },
  { id: "t6", name: { tr: "Tasarım", en: "Design" }, lead: "u5", members: ["u5","u10"], color: "oklch(0.65 0.16 330)", folder: "product" },
  { id: "t7", name: { tr: "Müşteri Başarı", en: "Customer Success" }, lead: "u10", members: ["u10","u6"], color: "oklch(0.62 0.14 180)", folder: "ops" },
  { id: "t8", name: { tr: "Güvenlik & Uyum", en: "Security & Compliance" }, lead: "u8", members: ["u8","u2"], color: "oklch(0.55 0.14 30)", folder: "ops" },
];

const FOLDERS_SEED = [
  { id: "eng", name: { tr: "Mühendislik", en: "Engineering" }, icon: "code" },
  { id: "product", name: { tr: "Ürün & Tasarım", en: "Product & Design" }, icon: "sparkle" },
  { id: "data", name: { tr: "Veri", en: "Data" }, icon: "chart" },
  { id: "ops", name: { tr: "Operasyon", en: "Operations" }, icon: "shield" },
];

const TeamsPage = () => {
  const lang = useApp().language;
  const load = (k, d) => { try { const v = localStorage.getItem("spms." + k); return v !== null ? JSON.parse(v) : d; } catch(e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem("spms." + k, JSON.stringify(v)); } catch(e) {} };

  const [folders, setFolders] = useState(() => load("teamFolders", FOLDERS_SEED));
  const [teams, setTeams] = useState(() => load("teams", TEAMS_SEED));
  const [expanded, setExpanded] = useState(() => load("teamFoldersOpen", Object.fromEntries(FOLDERS_SEED.map(f => [f.id, true]))));
  const [selectedFolder, setSelectedFolder] = useState("all"); // 'all' | folderId | 'uncategorized'
  const [view, setView] = useState(() => load("teamsView", "folders")); // 'folders' | 'grid'
  const [search, setSearch] = useState("");
  const [moveMenuFor, setMoveMenuFor] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => save("teamFolders", folders), [folders]);
  useEffect(() => save("teams", teams), [teams]);
  useEffect(() => save("teamFoldersOpen", expanded), [expanded]);
  useEffect(() => save("teamsView", view), [view]);

  const T = (v) => typeof v === "string" ? v : v[lang];

  const filteredTeams = teams.filter(t => {
    if (search && !T(t.name).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const teamsByFolder = useMemo(() => {
    const map = {};
    folders.forEach(f => map[f.id] = []);
    map["_uncat"] = [];
    filteredTeams.forEach(t => {
      if (t.folder && map[t.folder]) map[t.folder].push(t);
      else map["_uncat"].push(t);
    });
    return map;
  }, [filteredTeams, folders]);

  const moveTeam = (teamId, folderId) => {
    setTeams(teams.map(t => t.id === teamId ? { ...t, folder: folderId === "_uncat" ? null : folderId } : t));
    setMoveMenuFor(null);
  };

  const addFolder = () => {
    const id = "f_" + Date.now();
    setFolders([...folders, { id, name: { tr: newFolderName || "Yeni Kategori", en: newFolderName || "New Category" }, icon: "folder" }]);
    setExpanded({ ...expanded, [id]: true });
    setNewFolderName("");
    setEditingFolder(null);
  };

  const deleteFolder = (fid) => {
    setTeams(teams.map(t => t.folder === fid ? { ...t, folder: null } : t));
    setFolders(folders.filter(f => f.id !== fid));
  };

  const renameFolder = (fid, newName) => {
    setFolders(folders.map(f => f.id === fid ? { ...f, name: { tr: newName, en: newName } } : f));
    setEditingFolder(null);
  };

  const totalTasks = (team) => window.SPMSData.TASKS.filter(tk => team.members.includes(tk.assigneeId)).length;

  const visibleFolders = selectedFolder === "all"
    ? [...folders, { id: "_uncat", name: { tr: "Kategorisiz", en: "Uncategorized" }, icon: "folder", muted: true }].filter(f => teamsByFolder[f.id]?.length > 0)
    : selectedFolder === "_uncat"
      ? [{ id: "_uncat", name: { tr: "Kategorisiz", en: "Uncategorized" }, icon: "folder", muted: true }]
      : folders.filter(f => f.id === selectedFolder);

  const folderIconFor = (ic) => {
    if (ic === "code") return <Icons.Workflow size={15}/>;
    if (ic === "sparkle") return <Icons.Sparkle size={15}/>;
    if (ic === "chart") return <Icons.Chart size={15}/>;
    if (ic === "shield") return <Icons.Shield size={15}/>;
    return <Icons.Folder size={15}/>;
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 24, height: "100%" }}>
      {/* Main: teams display */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4 }}>
              {selectedFolder === "all" ? (lang === "tr" ? "Takımlar" : "Teams") :
               selectedFolder === "_uncat" ? (lang === "tr" ? "Kategorisiz" : "Uncategorized") :
               T(folders.find(f => f.id === selectedFolder)?.name || { tr: "", en: "" })}
            </div>
            <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 4 }}>
              {lang === "tr" ? "Üyeler birden fazla takımda ve projede yer alabilir." : "Members can belong to multiple teams & projects."}
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <Input icon={<Icons.Search size={13}/>} placeholder={lang === "tr" ? "Takım ara…" : "Search teams…"}
            value={search} onChange={(e) => setSearch(e.target.value)} size="sm" style={{ width: 200 }}/>
          <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
            <button onClick={() => setView("folders")} title={lang === "tr" ? "Klasör" : "Folders"}
              style={{ padding: "5px 8px", borderRadius: 4, background: view === "folders" ? "var(--surface)" : "transparent", color: view === "folders" ? "var(--fg)" : "var(--fg-muted)" }}><Icons.Folder size={13}/></button>
            <button onClick={() => setView("grid")} title={lang === "tr" ? "Izgara" : "Grid"}
              style={{ padding: "5px 8px", borderRadius: 4, background: view === "grid" ? "var(--surface)" : "transparent", color: view === "grid" ? "var(--fg)" : "var(--fg-muted)" }}><Icons.Dashboard size={13}/></button>
          </div>
          <Button variant="primary" size="sm" icon={<Icons.Plus size={13}/>}>{lang === "tr" ? "Yeni takım" : "New team"}</Button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, paddingBottom: 20 }}>
          {view === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {(selectedFolder === "all" ? filteredTeams : filteredTeams.filter(t => (selectedFolder === "_uncat" ? !t.folder : t.folder === selectedFolder))).map(t => (
                <TeamCard key={t.id} team={t} lang={lang} T={T} folders={folders} onMove={moveTeam} moveMenuFor={moveMenuFor} setMoveMenuFor={setMoveMenuFor} totalTasks={totalTasks(t)}/>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {visibleFolders.map(f => {
                const ts = teamsByFolder[f.id] || [];
                if (ts.length === 0 && selectedFolder === "all") return null;
                const isOpen = expanded[f.id] !== false;
                return (
                  <div key={f.id}>
                    <div onClick={() => setExpanded({ ...expanded, [f.id]: !isOpen })}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", cursor: "pointer", borderRadius: 6, userSelect: "none" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <Icons.ChevronRight size={14} style={{ color: "var(--fg-subtle)", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.12s" }}/>
                      <span style={{ color: f.muted ? "var(--fg-subtle)" : "var(--primary)", display: "inline-flex" }}>{folderIconFor(f.icon)}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: f.muted ? "var(--fg-muted)" : "var(--fg)" }}>{T(f.name)}</span>
                      <Badge size="xs" tone="neutral">{ts.length}</Badge>
                      <div style={{ flex: 1 }}/>
                      <span style={{ fontSize: 11, color: "var(--fg-subtle)" }} className="mono">
                        {new Set(ts.flatMap(t => t.members)).size} {lang === "tr" ? "üye" : "members"}
                      </span>
                    </div>
                    {isOpen && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 8, marginLeft: 26 }}>
                        {ts.map(t => (
                          <TeamCard key={t.id} team={t} lang={lang} T={T} folders={folders} onMove={moveTeam} moveMenuFor={moveMenuFor} setMoveMenuFor={setMoveMenuFor} totalTasks={totalTasks(t)}/>
                        ))}
                        {ts.length === 0 && (
                          <div style={{ gridColumn: "1 / -1", padding: 16, textAlign: "center", fontSize: 12, color: "var(--fg-subtle)", border: "1px dashed var(--border-strong)", borderRadius: 8 }}>
                            {lang === "tr" ? "Bu kategoride takım yok" : "No teams in this category"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {visibleFolders.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: "var(--fg-muted)", fontSize: 13 }}>
                  {lang === "tr" ? "Sonuç yok" : "No results"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar: folder tree (right) */}
      <Card padding={16} style={{ height: "fit-content", position: "sticky", top: 70 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{lang === "tr" ? "Kategoriler" : "Categories"}</div>
          <div style={{ flex: 1 }}/>
          <button onClick={() => setEditingFolder("new")} title={lang === "tr" ? "Kategori ekle" : "Add category"}
            style={{ color: "var(--fg-muted)", padding: 4, borderRadius: 6 }}>
            <Icons.Plus size={14}/>
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <FolderNavItem active={selectedFolder === "all"} onClick={() => setSelectedFolder("all")}
            icon={<Icons.Folder size={14}/>} label={lang === "tr" ? "Tüm Takımlar" : "All Teams"} count={teams.length}/>
          <div style={{ height: 8 }}/>
          {folders.map(f => (
            <div key={f.id}>
              <FolderNavItem
                active={selectedFolder === f.id}
                onClick={() => setSelectedFolder(f.id)}
                icon={folderIconFor(f.icon)}
                label={editingFolder === f.id ? null : T(f.name)}
                count={teamsByFolder[f.id]?.length || 0}
                onEdit={() => setEditingFolder(f.id)}
                onDelete={() => deleteFolder(f.id)}
                editNode={editingFolder === f.id && (
                  <input autoFocus defaultValue={T(f.name)}
                    onBlur={(e) => renameFolder(f.id, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && renameFolder(f.id, e.target.value)}
                    style={{ flex: 1, height: 22, padding: "0 6px", fontSize: 13, background: "var(--surface)", borderRadius: 4, boxShadow: "inset 0 0 0 1px var(--primary)" }}/>
                )}
              />
            </div>
          ))}
          {teamsByFolder["_uncat"]?.length > 0 && (
            <FolderNavItem active={selectedFolder === "_uncat"} onClick={() => setSelectedFolder("_uncat")}
              icon={<Icons.Folder size={14}/>} label={lang === "tr" ? "Kategorisiz" : "Uncategorized"} count={teamsByFolder["_uncat"].length} muted/>
          )}
          {editingFolder === "new" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", marginTop: 4 }}>
              <Icons.Folder size={14} style={{ color: "var(--fg-subtle)" }}/>
              <input autoFocus placeholder={lang === "tr" ? "Kategori adı" : "Category name"}
                value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={() => newFolderName ? addFolder() : setEditingFolder(null)}
                onKeyDown={(e) => e.key === "Enter" && addFolder()}
                style={{ flex: 1, height: 22, padding: "0 6px", fontSize: 13, background: "var(--surface)", borderRadius: 4, boxShadow: "inset 0 0 0 1px var(--primary)" }}/>
            </div>
          )}
        </div>
        <div style={{ marginTop: 16, padding: 12, background: "var(--surface-2)", borderRadius: 8, boxShadow: "var(--shadow-sm), var(--inset-card)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{lang === "tr" ? "Özet" : "Summary"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--fg-muted)" }}>{lang === "tr" ? "Kategori" : "Categories"}</span><span className="mono" style={{ fontWeight: 600 }}>{folders.length}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--fg-muted)" }}>{lang === "tr" ? "Takım" : "Teams"}</span><span className="mono" style={{ fontWeight: 600 }}>{teams.length}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--fg-muted)" }}>{lang === "tr" ? "Üye" : "Members"}</span><span className="mono" style={{ fontWeight: 600 }}>{new Set(teams.flatMap(t => t.members)).size}</span></div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const FolderNavItem = ({ active, onClick, icon, label, count, muted, onEdit, onDelete, editNode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 6, fontSize: 13, background: active ? "var(--accent)" : "transparent", color: active ? "var(--fg)" : (muted ? "var(--fg-muted)" : "var(--fg)"), fontWeight: active ? 600 : 500, cursor: "pointer", group: 1 }}
    className="folder-nav-item"
    onClick={onClick}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-2)"; const btns = e.currentTarget.querySelector(".folder-actions"); if (btns) btns.style.opacity = "1"; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; const btns = e.currentTarget.querySelector(".folder-actions"); if (btns) btns.style.opacity = "0"; }}>
    <span style={{ color: active ? "var(--primary)" : "var(--fg-subtle)", display: "inline-flex" }}>{icon}</span>
    {editNode ? editNode : <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>}
    {!editNode && (
      <>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-subtle)" }}>{count}</span>
        {(onEdit || onDelete) && (
          <div className="folder-actions" style={{ display: "flex", gap: 2, opacity: 0, transition: "opacity 0.1s" }}>
            {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{ padding: 2, color: "var(--fg-subtle)", borderRadius: 3 }}><Icons.Edit size={11}/></button>}
            {onDelete && <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete category?")) onDelete(); }} style={{ padding: 2, color: "var(--fg-subtle)", borderRadius: 3 }}><Icons.X size={11}/></button>}
          </div>
        )}
      </>
    )}
  </div>
);

const TeamCard = ({ team, lang, T, folders, onMove, moveMenuFor, setMoveMenuFor, totalTasks }) => {
  const lead = window.SPMSData.getUser(team.lead);
  const members = team.members.map(window.SPMSData.getUser);
  const currentFolder = folders.find(f => f.id === team.folder);
  return (
    <Card padding={16} style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: `color-mix(in oklch, ${team.color} 18%, transparent)`, color: team.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{T(team.name)[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{T(team.name)}</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
            <Avatar user={lead} size={14}/>
            <span>{lead?.name}</span>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={(e) => { e.stopPropagation(); setMoveMenuFor(moveMenuFor === team.id ? null : team.id); }}
            style={{ color: "var(--fg-subtle)", padding: 4, borderRadius: 4 }}
            title={lang === "tr" ? "Kategoriye taşı" : "Move to category"}>
            <Icons.MoreH size={14}/>
          </button>
          {moveMenuFor === team.id && (
            <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "var(--surface)", boxShadow: "0 8px 20px oklch(0 0 0 / 0.15), inset 0 0 0 1px var(--border)", borderRadius: 8, padding: 4, minWidth: 180, zIndex: 20 }}
              onMouseLeave={() => setMoveMenuFor(null)}>
              <div style={{ padding: "6px 10px", fontSize: 10.5, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{lang === "tr" ? "Kategoriye taşı" : "Move to"}</div>
              {folders.map(f => (
                <button key={f.id} onClick={() => onMove(team.id, f.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px", fontSize: 12.5, borderRadius: 5, textAlign: "left", background: team.folder === f.id ? "var(--accent)" : "transparent", fontWeight: team.folder === f.id ? 600 : 500 }}
                  onMouseEnter={(e) => { if (team.folder !== f.id) e.currentTarget.style.background = "var(--surface-2)"; }}
                  onMouseLeave={(e) => { if (team.folder !== f.id) e.currentTarget.style.background = "transparent"; }}>
                  <Icons.Folder size={12} style={{ color: "var(--fg-subtle)" }}/>
                  <span>{T(f.name)}</span>
                  {team.folder === f.id && <Icons.Check size={11} style={{ marginLeft: "auto", color: "var(--primary)" }}/>}
                </button>
              ))}
              <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }}/>
              <button onClick={() => onMove(team.id, "_uncat")}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px", fontSize: 12.5, borderRadius: 5, textAlign: "left", color: "var(--fg-muted)" }}>
                <Icons.X size={12}/><span>{lang === "tr" ? "Kategoriden çıkar" : "Remove from category"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {currentFolder && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 6px", borderRadius: 4, background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--border)", fontSize: 10.5, color: "var(--fg-muted)", marginTop: 8, fontWeight: 500 }}>
          <Icons.Folder size={9}/>
          {T(currentFolder.name)}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        <AvatarStack users={members} size={22}/>
        <span style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>{members.length} {lang === "tr" ? "üye" : "members"}</span>
        <div style={{ flex: 1 }}/>
        <span className="mono" style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{totalTasks} {lang === "tr" ? "görev" : "tasks"}</span>
      </div>
    </Card>
  );
};

Object.assign(window, { App, TeamsPage });

// Mount
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
