// MyTasksExperience: the rich reusable component used on both the dedicated
// "Görevlerim" page and in the dashboard "Benim İşim / Projeye göre
// görevlerim" section (with compact config).

const { useState: mtUseState, useMemo: mtUseMemo, useEffect: mtUseEffect, useRef: mtUseRef } = React;

/* ---------------- shared state store (so list edits persist across pages) ---- */

const MT_STORE_KEY = "spms.myTasksStore";

function mtLoadStore() {
  try {
    const raw = localStorage.getItem(MT_STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { overrides: {}, extras: [], starred: [], completedAt: {} };
}
function mtSaveStore(s) {
  try { localStorage.setItem(MT_STORE_KEY, JSON.stringify(s)); } catch(e) {}
}

function useMyTasksStore() {
  const [store, setStore] = mtUseState(mtLoadStore);
  mtUseEffect(() => mtSaveStore(store), [store]);
  return [store, setStore];
}

// Resolve the "live" list of my tasks given the base seed + store overrides
function resolveMyTasks(store) {
  const me = window.SPMSData.CURRENT_USER;
  const base = window.SPMSData.TASKS
    .filter(t => t.assigneeId === me.id)
    .map(t => ({ ...t, ...(store.overrides[t.id] || {}) }));
  const extra = store.extras.map(t => ({ ...t, assigneeId: me.id }));
  return [...extra, ...base];
}

/* ---------------- Saved views ---------------- */

const MT_VIEWS = [
  { id: "today",     icon: "Flame",       labelTr: "Bugün",     labelEn: "Today",     filter: (t) => mtDueBucket(t) === "today" && t.status !== "done" },
  { id: "overdue",   icon: "Alert",       labelTr: "Gecikmiş",  labelEn: "Overdue",   filter: (t) => mtDueBucket(t) === "overdue" },
  { id: "upcoming",  icon: "Calendar",    labelTr: "Yaklaşan",  labelEn: "Upcoming",  filter: (t) => ["today","week","later"].includes(mtDueBucket(t)) && t.status !== "done" },
  { id: "starred",   icon: "Star",        labelTr: "Yıldızlı",  labelEn: "Starred",   filter: (t, store) => store.starred.includes(t.id) },
  { id: "all",       icon: "CheckSquare", labelTr: "Tümü",      labelEn: "All",       filter: (t) => t.status !== "done" },
  { id: "done",      icon: "CircleCheck", labelTr: "Tamamlanan", labelEn: "Completed", filter: (t) => t.status === "done" },
];

/* ---------------- Main component ---------------- */

// Props:
//   compact: boolean — hide hero, saved-view tabs, right rail, quick-add
//   defaultGroupBy: "project" | "status" | "priority" | "due" | "none"
//   defaultView: one of MT_VIEWS.id (compact uses "all")
//   hideHeader, hideFilters, maxHeight
const MyTasksExperience = ({
  compact = false,
  defaultGroupBy = "due",
  defaultView = "today",
  hideHeader = false,
  hideFilters = false,
  hideQuickAdd = false,
  hideRightRail = false,
  projectFilter = null, // pre-scope to project
  title,
  subtitle,
  style,
}) => {
  const { language: lang } = useApp();
  const router = useRouter();
  const [store, setStore] = useMyTasksStore();
  const load = (k, d) => { try { const v = localStorage.getItem("spms." + k); return v !== null ? JSON.parse(v) : d; } catch(e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem("spms." + k, JSON.stringify(v)); } catch(e) {} };

  const [view, setView] = mtUseState(() => compact ? "all" : load("mt.view", defaultView));
  const [groupBy, setGroupBy] = mtUseState(() => load("mt.groupBy." + (compact ? "dash" : "page"), defaultGroupBy));
  const [search, setSearch] = mtUseState("");
  const [priFilter, setPriFilter] = mtUseState(() => load("mt.priFilter", [])); // list of priorities
  const [projFilter, setProjFilter] = mtUseState([]);
  const [density, setDensity] = mtUseState(() => load("mt.density", "cozy"));
  const [sort, setSort] = mtUseState(() => load("mt.sort", "smart"));
  const [collapsed, setCollapsed] = mtUseState(() => load("mt.collapsed." + (compact ? "dash" : "page"), {}));

  mtUseEffect(() => !compact && save("mt.view", view), [view]);
  mtUseEffect(() => save("mt.groupBy." + (compact ? "dash" : "page"), groupBy), [groupBy]);
  mtUseEffect(() => save("mt.priFilter", priFilter), [priFilter]);
  mtUseEffect(() => save("mt.density", density), [density]);
  mtUseEffect(() => save("mt.sort", sort), [sort]);
  mtUseEffect(() => save("mt.collapsed." + (compact ? "dash" : "page"), collapsed), [collapsed]);

  const allTasks = mtUseMemo(() => resolveMyTasks(store), [store]);

  // Filter pipeline
  const filteredTasks = mtUseMemo(() => {
    const viewDef = MT_VIEWS.find(v => v.id === view);
    let xs = allTasks;
    if (viewDef) xs = xs.filter(t => viewDef.filter(t, store));
    if (projectFilter) xs = xs.filter(t => t.projectId === projectFilter);
    if (projFilter.length) xs = xs.filter(t => projFilter.includes(t.projectId));
    if (priFilter.length) xs = xs.filter(t => priFilter.includes(t.priority));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      xs = xs.filter(t => t.title.toLowerCase().includes(q) || t.key.toLowerCase().includes(q));
    }
    // Sort
    if (sort === "smart") {
      const priRank = { critical: 0, high: 1, medium: 2, low: 3 };
      xs = [...xs].sort((a, b) => {
        // Overdue first, then due asc, then priority
        const aBucket = mtDueBucket(a), bBucket = mtDueBucket(b);
        const bucketRank = { overdue: 0, today: 1, week: 2, later: 3, "no-date": 4 };
        if (bucketRank[aBucket] !== bucketRank[bBucket]) return bucketRank[aBucket] - bucketRank[bBucket];
        const aD = a.due || "9999"; const bD = b.due || "9999";
        if (aD !== bD) return aD.localeCompare(bD);
        return priRank[a.priority] - priRank[b.priority];
      });
    } else if (sort === "priority") {
      const pr = { critical: 0, high: 1, medium: 2, low: 3 };
      xs = [...xs].sort((a,b) => pr[a.priority] - pr[b.priority]);
    } else if (sort === "due") {
      xs = [...xs].sort((a,b) => (a.due || "9999").localeCompare(b.due || "9999"));
    } else if (sort === "newest") {
      xs = [...xs].sort((a,b) => b.id.localeCompare(a.id));
    }
    return xs;
  }, [allTasks, view, projectFilter, projFilter, priFilter, search, sort, store]);

  // Group pipeline
  const groups = mtUseMemo(() => buildGroups(filteredTasks, groupBy, lang, allTasks), [filteredTasks, groupBy, lang, allTasks]);

  // Actions
  const updateTask = (id, patch) => {
    setStore(s => {
      const next = { ...s, overrides: { ...s.overrides, [id]: { ...(s.overrides[id] || {}), ...patch } } };
      if (patch.status === "done") next.completedAt = { ...s.completedAt, [id]: Date.now() };
      return next;
    });
  };
  const toggleStar = (id) => {
    setStore(s => {
      const has = s.starred.includes(id);
      return { ...s, starred: has ? s.starred.filter(x => x !== id) : [...s.starred, id] };
    });
  };
  const addTask = ({ title, projectId, priority, due }) => {
    const proj = window.SPMSData.getProject(projectId);
    const n = (window.SPMSData.TASKS.length + store.extras.length + 1);
    const task = {
      id: `te${Date.now()}`,
      key: `${proj.key}-NEW`,
      projectId, title, status: "todo", priority, due,
      points: 3, type: "task",
      assigneeId: window.SPMSData.CURRENT_USER.id,
      _isNew: true,
    };
    setStore(s => ({ ...s, extras: [task, ...s.extras] }));
  };

  const toggleCollapse = (gid) => setCollapsed(c => ({ ...c, [gid]: !c[gid] }));

  const renderRow = (t) => (
    <MTTaskRow
      key={t.id}
      task={t}
      lang={lang}
      density={density}
      starred={store.starred.includes(t.id)}
      onStatus={updateTask}
      onToggleStar={toggleStar}
      onOpen={() => router.go("task-detail", { taskId: t.id })}
      showProject={groupBy !== "project" && !projectFilter}
    />
  );

  // Hero metrics
  const heroStats = mtUseMemo(() => {
    const active = allTasks.filter(t => t.status !== "done");
    const buckets = { overdue: 0, today: 0, week: 0 };
    active.forEach(t => {
      const b = mtDueBucket(t);
      if (b === "overdue") buckets.overdue++;
      else if (b === "today") buckets.today++;
      else if (b === "week") buckets.week++;
    });
    const completedThisWeek = Object.entries(store.completedAt)
      .filter(([,ts]) => ts > Date.now() - 7 * 86400000).length;
    return { ...buckets, active: active.length, done: completedThisWeek };
  }, [allTasks, store]);

  /* -------- render -------- */

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 12 : 18, ...style }}>
      {!hideHeader && !compact && (
        <MTHero stats={heroStats} lang={lang} title={title} subtitle={subtitle} user={window.SPMSData.CURRENT_USER}/>
      )}

      {!hideQuickAdd && !compact && (
        <MTQuickAdd lang={lang} projects={window.SPMSData.PROJECTS} onAdd={addTask}/>
      )}

      {!hideFilters && (
        <MTToolbar
          compact={compact}
          lang={lang}
          view={view} setView={setView}
          groupBy={groupBy} setGroupBy={setGroupBy}
          search={search} setSearch={setSearch}
          priFilter={priFilter} setPriFilter={setPriFilter}
          projFilter={projFilter} setProjFilter={setProjFilter}
          density={density} setDensity={setDensity}
          sort={sort} setSort={setSort}
          allTasks={allTasks}
          projectFilter={projectFilter}
          store={store}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: (!compact && !hideRightRail) ? "minmax(0, 1fr) 300px" : "minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
        <Card padding={0} style={{ overflow: "hidden" }}>
          {groups.every(g => g.items.length === 0) ? (
            <MTEmpty lang={lang} view={view}/>
          ) : (
            <MTGroupedList
              groups={groups}
              collapsed={collapsed}
              onToggle={toggleCollapse}
              renderRow={renderRow}
            />
          )}
          <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--fg-muted)", borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
            <span>{filteredTasks.length} {lang === "tr" ? "görev" : "tasks"}</span>
            <span style={{ color: "var(--fg-subtle)" }}>·</span>
            <span>{filteredTasks.reduce((s,t) => s + (t.points || 0), 0)} {lang === "tr" ? "puan" : "points"}</span>
            <div style={{ flex: 1 }}/>
            <Kbd>⌘</Kbd><Kbd>N</Kbd><span style={{ marginLeft: 4 }}>{lang === "tr" ? "yeni görev" : "new task"}</span>
          </div>
        </Card>

        {!compact && !hideRightRail && <MTRightRail lang={lang} store={store} allTasks={allTasks}/>}
      </div>
    </div>
  );
};

/* ---------------- Grouping ---------------- */

function buildGroups(tasks, groupBy, lang, allTasks) {
  if (groupBy === "none") return [{ id: "_all", label: lang === "tr" ? "Tüm görevler" : "All tasks", items: tasks }];

  if (groupBy === "due") {
    const order = ["overdue", "today", "week", "later", "no-date"];
    const by = {}; order.forEach(k => by[k] = []);
    tasks.forEach(t => { by[mtDueBucket(t)].push(t); });
    return order.map(k => {
      const meta = MT_BUCKET_META[k];
      return {
        id: k,
        label: lang === "tr" ? meta.tr : meta.en,
        icon: <MTBucketIcon kind={meta.icon}/>,
        color: meta.color,
        items: by[k],
      };
    });
  }

  if (groupBy === "project") {
    const by = {};
    tasks.forEach(t => { (by[t.projectId] = by[t.projectId] || []).push(t); });
    const ids = Object.keys(by).sort((a,b) => by[b].length - by[a].length);
    return ids.map(pid => {
      const p = window.SPMSData.getProject(pid);
      // progress: share done of MY tasks in this project (including outside filter)
      const myInProj = allTasks.filter(t => t.projectId === pid);
      const pct = myInProj.length ? Math.round(100 * myInProj.filter(t => t.status === "done").length / myInProj.length) : 0;
      const color = mtProjectColor(pid);
      return {
        id: pid,
        label: p?.name || pid,
        meta: <span className="mono" style={{ fontSize: 11 }}>{p?.key}</span>,
        icon: <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }}/>,
        color,
        items: by[pid],
        progress: pct,
      };
    });
  }

  if (groupBy === "status") {
    const order = ["progress", "review", "todo", "blocked", "done"];
    const by = {}; order.forEach(k => by[k] = []);
    tasks.forEach(t => { (by[t.status] || (by[t.status] = [])).push(t); });
    return order.map(k => {
      const s = MT_STATUS_MAP[k];
      return {
        id: k,
        label: lang === "tr" ? s.labelTr : s.labelEn,
        icon: <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, display: "inline-block" }}/>,
        color: s.color,
        items: by[k] || [],
      };
    });
  }

  if (groupBy === "priority") {
    const order = ["critical", "high", "medium", "low"];
    const by = {}; order.forEach(k => by[k] = []);
    tasks.forEach(t => { by[t.priority].push(t); });
    return order.map(k => {
      const p = MT_PRI_MAP[k];
      return {
        id: k,
        label: lang === "tr" ? p.labelTr : p.labelEn,
        icon: <MTPriority priority={k} compact lang={lang}/>,
        color: p.color,
        items: by[k],
      };
    });
  }

  return [{ id: "_all", label: "All", items: tasks }];
}

/* ---------------- Hero ---------------- */

const MTHero = ({ stats, lang, title, subtitle, user }) => {
  const hour = new Date().getHours();
  const greet = hour < 12 ? (lang === "tr" ? "Günaydın" : "Good morning")
              : hour < 18 ? (lang === "tr" ? "İyi günler" : "Good afternoon")
              : (lang === "tr" ? "İyi akşamlar" : "Good evening");
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1.3fr 1fr",
      gap: 16,
      padding: 22,
      borderRadius: 14,
      background: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 10%, var(--surface)) 0%, var(--surface) 60%)",
      boxShadow: "var(--shadow-md)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in oklch, var(--primary) 22%, transparent), transparent 70%)", pointerEvents: "none" }}/>
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 13, color: "var(--fg-muted)", fontWeight: 500 }}>
          {greet}, {user.name.split(" ")[0]} — {new Date().toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 6, lineHeight: 1.2 }}>
          {title || (lang === "tr" ? "Bugünün odak noktanız" : "Your focus today")}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--fg-muted)", marginTop: 6, lineHeight: 1.6, maxWidth: 420 }}>
          {subtitle || (stats.overdue > 0
            ? (lang === "tr" ? `${stats.overdue} gecikmiş görev var. En kritik olanlardan başlamak iyi fikir.` : `${stats.overdue} tasks are overdue. Starting from the most critical might be a good idea.`)
            : (lang === "tr" ? `${stats.today} görev bugün için planlandı. Güzel bir tempoda gidiyor.` : `${stats.today} tasks scheduled for today. You're on a good pace.`)
          )}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, position: "relative" }}>
        <MTHeroStat icon={<Icons.Alert/>}       label={lang === "tr" ? "Gecikmiş" : "Overdue"}    value={stats.overdue} tone="danger"/>
        <MTHeroStat icon={<Icons.Flame/>}       label={lang === "tr" ? "Bugün" : "Today"}         value={stats.today}   tone="primary"/>
        <MTHeroStat icon={<Icons.Calendar/>}    label={lang === "tr" ? "Bu hafta" : "This week"}  value={stats.week}    tone="info"/>
        <MTHeroStat icon={<Icons.CircleCheck/>} label={lang === "tr" ? "Bitti (hafta)" : "Done (wk)"} value={stats.done} tone="success"/>
      </div>
    </div>
  );
};

const MTHeroStat = ({ icon, label, value, tone }) => {
  const tones = {
    danger: { color: "var(--priority-critical)", bg: "color-mix(in oklch, var(--priority-critical) 10%, var(--surface))" },
    primary: { color: "var(--primary)", bg: "color-mix(in oklch, var(--primary) 10%, var(--surface))" },
    info: { color: "var(--status-progress)", bg: "color-mix(in oklch, var(--status-progress) 10%, var(--surface))" },
    success: { color: "var(--status-done)", bg: "color-mix(in oklch, var(--status-done) 10%, var(--surface))" },
  };
  const t = tones[tone];
  return (
    <div style={{ padding: 14, borderRadius: 10, background: t.bg, boxShadow: "0 1px 3px oklch(0 0 0 / 0.06), var(--inset-card)" }}>
      <div style={{ color: t.color, width: 22, height: 22, borderRadius: 6, background: "var(--surface)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 1px var(--border)" }}>
        {React.cloneElement(icon, { size: 12 })}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1, marginTop: 10, color: value === 0 ? "var(--fg-muted)" : "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 2 }}>{label}</div>
    </div>
  );
};

/* ---------------- Toolbar ---------------- */

const MTToolbar = ({ compact, lang, view, setView, groupBy, setGroupBy, search, setSearch, priFilter, setPriFilter, projFilter, setProjFilter, density, setDensity, sort, setSort, allTasks, projectFilter, store }) => {
  const viewCounts = mtUseMemo(() => {
    const counts = {};
    MT_VIEWS.forEach(v => { counts[v.id] = allTasks.filter(t => v.filter(t, store)).length; });
    return counts;
  }, [allTasks, store]);

  const togglePri = (p) => setPriFilter(priFilter.includes(p) ? priFilter.filter(x => x !== p) : [...priFilter, p]);

  const groupOptions = [
    { id: "due", label: lang === "tr" ? "Tarihe göre" : "By date", icon: <Icons.Calendar size={12}/> },
    { id: "project", label: lang === "tr" ? "Projeye göre" : "By project", icon: <Icons.Folder size={12}/> },
    { id: "status", label: lang === "tr" ? "Duruma göre" : "By status", icon: <Icons.CheckSquare size={12}/> },
    { id: "priority", label: lang === "tr" ? "Önceliğe göre" : "By priority", icon: <Icons.Flame size={12}/> },
    { id: "none", label: lang === "tr" ? "Gruplama yok" : "Flat", icon: <Icons.List size={12}/> },
  ];

  const sortOptions = [
    { id: "smart", label: lang === "tr" ? "Akıllı" : "Smart" },
    { id: "due", label: lang === "tr" ? "Tarih" : "Due date" },
    { id: "priority", label: lang === "tr" ? "Öncelik" : "Priority" },
    { id: "newest", label: lang === "tr" ? "En yeni" : "Newest" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {!compact && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          {MT_VIEWS.map(v => {
            const Ico = Icons[v.icon];
            const active = v.id === view;
            const c = viewCounts[v.id] || 0;
            return (
              <button key={v.id} onClick={() => setView(v.id)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "7px 12px",
                  borderRadius: 8,
                  fontSize: 12.5, fontWeight: active ? 600 : 500,
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? "var(--fg)" : "var(--fg-muted)",
                  boxShadow: active ? "inset 0 0 0 1px var(--border), 0 1px 2px oklch(0 0 0 / 0.04)" : "none",
                }}>
                {Ico && <Ico size={13} style={{ color: active ? "var(--primary)" : "var(--fg-subtle)" }}/>}
                {lang === "tr" ? v.labelTr : v.labelEn}
                <span className="mono" style={{
                  fontSize: 10.5,
                  padding: "1px 6px",
                  borderRadius: 99,
                  background: active ? "var(--accent)" : "var(--surface-2)",
                  color: active ? "var(--accent-fg)" : "var(--fg-subtle)",
                }}>{c}</span>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Input icon={<Icons.Search size={13}/>} placeholder={lang === "tr" ? "Görevlerde ara…" : "Search tasks…"} size="sm" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: compact ? 200 : 240 }}/>

        <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 7, boxShadow: "inset 0 0 0 1px var(--border)" }}>
          {groupOptions.map(g => (
            <button key={g.id} onClick={() => setGroupBy(g.id)} title={g.label}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 5, fontSize: 11.5, fontWeight: 500,
                background: groupBy === g.id ? "var(--surface)" : "transparent",
                color: groupBy === g.id ? "var(--fg)" : "var(--fg-muted)",
                boxShadow: groupBy === g.id ? "0 1px 1px oklch(0 0 0 / 0.06)" : "none",
              }}>
              {g.icon}
              {!compact && g.label}
            </button>
          ))}
        </div>

        <div style={{ height: 20, width: 1, background: "var(--border)" }}/>

        {MT_PRIORITIES.map(p => (
          <MTChip key={p.id}
            active={priFilter.includes(p.id)}
            onClick={() => togglePri(p.id)}
            color={p.color}>
            <MTPriority priority={p.id} compact lang={lang}/>
            {!compact && (lang === "tr" ? p.labelTr : p.labelEn)}
          </MTChip>
        ))}

        <div style={{ flex: 1 }}/>

        <MTPicker value={sort} onChange={setSort} options={sortOptions} icon={<Icons.Chart size={12}/>}/>

        <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 7, boxShadow: "inset 0 0 0 1px var(--border)" }}>
          {["compact","cozy","comfortable"].map(d => (
            <button key={d} onClick={() => setDensity(d)} title={d}
              style={{
                padding: "4px 7px", borderRadius: 5,
                background: density === d ? "var(--surface)" : "transparent",
                color: density === d ? "var(--fg)" : "var(--fg-muted)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
              <MTDensityIcon kind={d}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const MTDensityIcon = ({ kind }) => {
  const gap = kind === "compact" ? 2 : kind === "cozy" ? 3 : 4;
  const h = kind === "compact" ? 1.5 : kind === "cozy" ? 2 : 2;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap, width: 14 }}>
      {[0,1,2].map(i => <span key={i} style={{ height: h, background: "currentColor", borderRadius: 1, opacity: 0.85 }}/>)}
    </span>
  );
};

/* ---------------- Empty state ---------------- */

const MTEmpty = ({ lang, view }) => {
  const messages = {
    today: { tr: "Bugün için sakin bir gün. İyi bir mola zamanı ☕", en: "A calm day. Good time for a break ☕" },
    overdue: { tr: "🎉 Gecikmiş görev yok!", en: "🎉 No overdue tasks!" },
    upcoming: { tr: "Yaklaşan görev yok", en: "No upcoming tasks" },
    starred: { tr: "Henüz yıldızlı görev yok", en: "No starred tasks yet" },
    all: { tr: "Aktif görev yok", en: "No active tasks" },
    done: { tr: "Henüz tamamlanan yok", en: "Nothing completed yet" },
  };
  const m = messages[view] || messages.all;
  return (
    <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--fg-muted)" }}>
      <div style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 56, height: 56, borderRadius: 16,
        background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--border)",
        color: "var(--fg-subtle)",
      }}>
        <Icons.CheckSquare size={24}/>
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, marginTop: 14, color: "var(--fg)" }}>{lang === "tr" ? m.tr : m.en}</div>
      <div style={{ fontSize: 12.5, marginTop: 4 }}>{lang === "tr" ? "Yeni bir görev eklemeye ne dersiniz?" : "How about adding a new task?"}</div>
    </div>
  );
};

/* ---------------- Right rail ---------------- */

const MTRightRail = ({ lang, store, allTasks }) => {
  // This week heatmap
  const days = mtUseMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const startDow = (today.getDay() + 6) % 7; // Monday-first
    const monday = new Date(today.getTime() - startDow * 86400000);
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getTime() + i * 86400000);
      const iso = d.toISOString().slice(0,10);
      const count = allTasks.filter(t => t.due === iso && t.status !== "done").length;
      out.push({ date: d, iso, count, isToday: d.getTime() === today.getTime() });
    }
    return out;
  }, [allTasks]);

  const maxCount = Math.max(1, ...days.map(d => d.count));
  const dayLabels = lang === "tr" ? ["Pt","Sa","Ça","Pe","Cu","Ct","Pz"] : ["M","T","W","T","F","S","S"];

  // Recent completed
  const recent = mtUseMemo(() => {
    return Object.entries(store.completedAt)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 4)
      .map(([id]) => allTasks.find(t => t.id === id))
      .filter(Boolean);
  }, [store, allTasks]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 70 }}>
      <Card padding={16} style={{ boxShadow: "var(--shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icons.Calendar size={14} style={{ color: "var(--primary)" }}/>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === "tr" ? "Bu hafta" : "This week"}</div>
          <div style={{ flex: 1 }}/>
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{days.reduce((s,d) => s + d.count, 0)}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 14 }}>
          {days.map((d, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 10, color: "var(--fg-subtle)", fontWeight: 600, letterSpacing: 0.3 }}>{dayLabels[i]}</div>
              <div title={`${d.count} ${lang === "tr" ? "görev" : "tasks"}`} style={{
                width: "100%", aspectRatio: "1 / 1", borderRadius: 6,
                background: d.count === 0 ? "var(--surface-2)" : `color-mix(in oklch, var(--primary) ${20 + (d.count / maxCount) * 60}%, transparent)`,
                boxShadow: d.isToday ? "inset 0 0 0 1.5px var(--primary)" : "inset 0 0 0 1px var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600,
                color: d.count === 0 ? "var(--fg-subtle)" : "var(--fg)",
              }}>
                {d.date.getDate()}
              </div>
              <div className="mono" style={{ fontSize: 9.5, color: d.count ? "var(--primary)" : "var(--fg-subtle)", fontWeight: 600 }}>{d.count || ""}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card padding={16} style={{ boxShadow: "var(--shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icons.Clock size={14} style={{ color: "var(--status-progress)" }}/>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === "tr" ? "Odak zamanlayıcı" : "Focus timer"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 14 }}>
          <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: -1.5, fontVariantNumeric: "tabular-nums" }}>24:32</div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>/ 50:00</div>
        </div>
        <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: "49%", height: "100%", background: "linear-gradient(90deg, var(--primary), var(--status-progress))" }}/>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 10 }}>
          MOBIL-18 · Biometric login prototipi
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <Button size="sm" variant="primary" icon={<Icons.Clock size={12}/>} style={{ flex: 1, justifyContent: "center" }}>{lang === "tr" ? "Duraklat" : "Pause"}</Button>
          <Button size="sm" variant="secondary" icon={<Icons.Check size={12}/>}>{lang === "tr" ? "Bitir" : "Done"}</Button>
        </div>
      </Card>

      {recent.length > 0 && (
        <Card padding={0} style={{ boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <Icons.CircleCheck size={14} style={{ color: "var(--status-done)" }}/>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === "tr" ? "Yakın zamanda biten" : "Recently completed"}</div>
          </div>
          {recent.map(t => {
            const p = window.SPMSData.getProject(t.projectId);
            return (
              <div key={t.id} style={{ padding: "10px 14px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)" }}>
                <Icons.Check size={11} style={{ color: "var(--status-done)", flexShrink: 0 }}/>
                <span style={{ textDecoration: "line-through", color: "var(--fg-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{t.title}</span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-subtle)" }}>{p?.key}</span>
              </div>
            );
          })}
        </Card>
      )}

      <Card padding={14} style={{ boxShadow: "var(--shadow)" }}>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", fontStyle: "italic", lineHeight: 1.6 }}>
          {lang === "tr" ? `"Yapılacaklar listesi nefes alır; sıkıştıkça daralır. En önemli üçünü seç, gerisini bırak."` : `"A to-do list breathes — it tightens when crowded. Pick the top three and let go of the rest."`}
        </div>
      </Card>
    </div>
  );
};

/* ---------------- Page wrapper ---------------- */

const MyTasksPage = () => {
  return (
    <div style={{ maxWidth: 1400 }}>
      <MyTasksExperience/>
    </div>
  );
};

Object.assign(window, { MyTasksExperience, MyTasksPage, buildGroups });
