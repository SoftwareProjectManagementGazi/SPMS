// Rich "My Tasks" experience — used both on the dedicated page and (in compact
// form) in the dashboard "Benim İşim / Projeye göre görevlerim" section.

const { useState: myUseState, useMemo: myUseMemo, useEffect: myUseEffect, useRef: myUseRef } = React;

/* ---------- shared helpers ---------- */

const MT_STATUSES = [
  { id: "todo",      labelTr: "Bekliyor",    labelEn: "To do",       color: "var(--status-todo)" },
  { id: "progress",  labelTr: "Devam ediyor", labelEn: "In progress", color: "var(--status-progress)" },
  { id: "review",    labelTr: "İncelemede",  labelEn: "In review",   color: "var(--status-review)" },
  { id: "done",      labelTr: "Tamamlandı",  labelEn: "Done",        color: "var(--status-done)" },
  { id: "blocked",   labelTr: "Engelli",     labelEn: "Blocked",     color: "var(--status-blocked)" },
];

const MT_STATUS_MAP = Object.fromEntries(MT_STATUSES.map(s => [s.id, s]));

// Deterministic project color (OKLCH hue by id hash)
function mtProjectColor(id) {
  let h = 0; for (let i = 0; i < id.length; i++) h = ((h << 5) - h) + id.charCodeAt(i);
  const hue = Math.abs(h) % 360;
  return `oklch(0.62 0.14 ${hue})`;
}

const MT_PRIORITIES = [
  { id: "critical", labelTr: "Kritik", labelEn: "Critical", color: "var(--priority-critical)", bars: 4 },
  { id: "high",     labelTr: "Yüksek", labelEn: "High",     color: "var(--priority-high)",     bars: 3 },
  { id: "medium",   labelTr: "Orta",   labelEn: "Medium",   color: "var(--priority-med)",      bars: 2 },
  { id: "low",      labelTr: "Düşük",  labelEn: "Low",      color: "var(--priority-low)",      bars: 1 },
];
const MT_PRI_MAP = Object.fromEntries(MT_PRIORITIES.map(p => [p.id, p]));

function mtFormatDue(dueISO, lang) {
  if (!dueISO) return { label: "—", tone: "muted", rel: "" };
  const d = new Date(dueISO); d.setHours(0,0,0,0);
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((d - now) / 86400000);
  const locale = lang === "tr" ? "tr-TR" : "en-US";
  const short = d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  if (diff < 0) {
    const txt = lang === "tr" ? `${-diff}g gecikti` : `${-diff}d overdue`;
    return { label: txt, tone: "overdue", rel: txt, abs: short };
  }
  if (diff === 0) return { label: lang === "tr" ? "Bugün" : "Today", tone: "today", rel: lang === "tr" ? "Bugün" : "Today", abs: short };
  if (diff === 1) return { label: lang === "tr" ? "Yarın" : "Tomorrow", tone: "soon", rel: lang === "tr" ? "Yarın" : "Tomorrow", abs: short };
  if (diff <= 3) return { label: lang === "tr" ? `${diff} gün` : `in ${diff}d`, tone: "soon", rel: lang === "tr" ? `${diff} gün` : `in ${diff}d`, abs: short };
  if (diff <= 7) return { label: lang === "tr" ? `${diff} gün` : `in ${diff}d`, tone: "week", rel: lang === "tr" ? `${diff} gün` : `in ${diff}d`, abs: short };
  return { label: short, tone: "muted", rel: lang === "tr" ? `${diff} gün` : `in ${diff}d`, abs: short };
}

function mtDueBucket(task) {
  if (!task.due) return "no-date";
  const d = new Date(task.due); d.setHours(0,0,0,0);
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((d - now) / 86400000);
  if (task.status !== "done" && diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff >= 1 && diff <= 7) return "week";
  if (diff > 7) return "later";
  return "no-date";
}

const MT_BUCKET_META = {
  overdue:   { tr: "Gecikmiş",      en: "Overdue",     color: "var(--priority-critical)", icon: "alert" },
  today:     { tr: "Bugün",         en: "Today",       color: "var(--primary)",           icon: "today" },
  week:      { tr: "Bu Hafta",      en: "This week",   color: "var(--status-progress)",   icon: "week" },
  later:     { tr: "İlerde",        en: "Later",       color: "var(--fg-muted)",          icon: "later" },
  "no-date": { tr: "Tarih yok",     en: "No date",     color: "var(--fg-subtle)",         icon: "none" },
};

/* ---------- Primitive: status dot button (click to advance) ---------- */

const MTStatusDot = ({ status, onChange, size = 16, title }) => {
  const [open, setOpen] = myUseState(false);
  const ref = myUseRef();
  myUseEffect(() => {
    if (!open) return;
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);
  const meta = MT_STATUS_MAP[status] || MT_STATUS_MAP.todo;
  const isDone = status === "done";
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        title={title}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          width: size, height: size, borderRadius: "50%",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          boxShadow: isDone
            ? `inset 0 0 0 ${size/2}px ${meta.color}`
            : `inset 0 0 0 1.75px ${meta.color}`,
          background: isDone ? meta.color : "transparent",
          flexShrink: 0, cursor: "pointer",
          transition: "box-shadow 0.15s ease, background 0.15s ease",
        }}
      >
        {isDone && (
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {status === "progress" && (
          <div style={{ width: size * 0.5, height: size * 0.5, borderRadius: "50%", background: meta.color }}/>
        )}
        {status === "blocked" && (
          <div style={{ width: size * 0.5, height: 2, background: meta.color }}/>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: size + 6, left: 0, background: "var(--surface)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 4, zIndex: 60, minWidth: 150 }}
          onClick={(e) => e.stopPropagation()}>
          {MT_STATUSES.map(s => (
            <button key={s.id} onClick={() => { onChange && onChange(s.id); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", width: "100%", borderRadius: 4, fontSize: 12.5, textAlign: "left", background: s.id === status ? "var(--surface-2)" : "transparent" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = s.id === status ? "var(--surface-2)" : "transparent"}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }}/>
              {useApp().language === "tr" ? s.labelTr : s.labelEn}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Priority: bars icon + label ---------- */

const MTPriority = ({ priority, compact, lang }) => {
  const p = MT_PRI_MAP[priority] || MT_PRI_MAP.low;
  const label = lang === "tr" ? p.labelTr : p.labelEn;
  return (
    <span title={label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 1.5, height: 11 }}>
        {[1,2,3,4].map(n => (
          <span key={n} style={{
            width: 2.5, height: n * 2.5 + 1.5,
            background: n <= p.bars ? p.color : "var(--border-strong)",
            borderRadius: 0.5,
          }}/>
        ))}
      </span>
      {!compact && <span style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>{label}</span>}
    </span>
  );
};

/* ---------- Due chip ---------- */

const MTDueChip = ({ task, lang, compact }) => {
  const due = mtFormatDue(task.due, lang);
  const map = {
    overdue: { bg: "color-mix(in oklch, var(--priority-critical) 14%, transparent)", fg: "var(--priority-critical)" },
    today:   { bg: "color-mix(in oklch, var(--primary) 14%, transparent)", fg: "var(--primary)" },
    soon:    { bg: "color-mix(in oklch, var(--status-review) 14%, transparent)", fg: "color-mix(in oklch, var(--status-review) 80%, var(--fg))" },
    week:    { bg: "var(--surface-2)", fg: "var(--fg-muted)" },
    muted:   { bg: "transparent", fg: "var(--fg-muted)" },
  };
  const s = map[due.tone];
  return (
    <span title={due.abs} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: compact ? "0" : "2px 8px",
      background: compact ? "transparent" : s.bg, color: s.fg,
      borderRadius: 99, fontSize: 11.5, fontWeight: 500,
      whiteSpace: "nowrap",
    }}>
      {due.tone === "overdue" && <Icons.Alert size={10}/>}
      {due.tone === "today" && !compact && <Icons.Clock size={10}/>}
      {due.label}
    </span>
  );
};

/* ---------- Project tag (inline) ---------- */

const MTProjectTag = ({ project, onClick, compact }) => {
  if (!project) return null;
  const color = project.color || mtProjectColor(project.id);
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: compact ? "0" : "2px 8px 2px 6px",
        borderRadius: 99,
        background: compact ? "transparent" : "var(--surface-2)",
        boxShadow: compact ? "none" : "inset 0 0 0 1px var(--border)",
        fontSize: 11.5, fontWeight: 500, color: "var(--fg-muted)",
        whiteSpace: "nowrap",
      }}>
      <span style={{ width: 6, height: 6, borderRadius: 2, background: color, flexShrink: 0 }}/>
      <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-subtle)" }}>{project.key}</span>
      {!compact && <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>{project.name}</span>}
    </button>
  );
};

/* ---------- Task row ---------- */

const MTTaskRow = ({ task, onStatus, onOpen, onToggleStar, lang, density = "cozy", starred, showProject = true }) => {
  const [hover, setHover] = myUseState(false);
  const project = window.SPMSData.getProject(task.projectId);
  const assignee = window.SPMSData.getUser(task.assigneeId);
  const padMap = { compact: "6px 12px", cozy: "9px 12px", comfortable: "13px 14px" };
  const fontMap = { compact: 12.5, cozy: 13, comfortable: 13.5 };
  const isDone = task.status === "done";
  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: showProject
          ? "18px 68px 1fr auto auto auto 28px 50px"
          : "18px 68px 1fr auto auto 28px 50px",
        alignItems: "center", gap: 12,
        padding: padMap[density],
        borderBottom: "1px solid var(--border)",
        background: hover ? "var(--surface-2)" : "transparent",
        cursor: "pointer", position: "relative",
        fontSize: fontMap[density],
      }}
    >
      <MTStatusDot status={task.status} onChange={(s) => onStatus(task.id, s)} size={density === "compact" ? 14 : 16}/>
      <span className="mono" style={{ fontSize: 10.8, color: "var(--fg-subtle)", letterSpacing: 0.3 }}>{task.key}</span>

      <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
        {task.type === "bug" && <Icons.Bug size={12} style={{ color: "var(--priority-critical)", flexShrink: 0 }}/>}
        <span style={{
          textDecoration: isDone ? "line-through" : "none",
          color: isDone ? "var(--fg-muted)" : "var(--fg)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontWeight: 500,
        }}>{task.title}</span>
        {starred && <Icons.Star size={12} style={{ color: "var(--status-review)", flexShrink: 0, fill: "var(--status-review)" }}/>}
      </div>

      {showProject && <MTProjectTag project={project} />}
      <MTPriority priority={task.priority} compact lang={lang}/>
      <MTDueChip task={task} lang={lang}/>
      {assignee ? <Avatar user={assignee} size={density === "compact" ? 20 : 22}/> : <span/>}
      
      {/* Points / actions overlay */}
      <div style={{ position: "relative", textAlign: "right", fontSize: 11, color: "var(--fg-subtle)", height: 20, display: "flex", alignItems: "center", justifyContent: "flex-end" }} className="mono">
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 2, opacity: hover ? 1 : 0, transition: "opacity 0.15s ease", background: "var(--surface-2)", paddingLeft: 4 }}>
          <button title={lang === "tr" ? "Yıldızla" : "Star"}
            onClick={(e) => { e.stopPropagation(); onToggleStar(task.id); }}
            style={{ padding: 3, borderRadius: 4, color: "var(--fg-subtle)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <Icons.Star size={12}/>
          </button>
          <button title={lang === "tr" ? "Daha fazla" : "More"}
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 3, borderRadius: 4, color: "var(--fg-subtle)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <Icons.MoreH size={12}/>
          </button>
        </div>
        <div style={{ opacity: hover ? 0 : 1, transition: "opacity 0.15s ease", pointerEvents: "none" }}>
          {task.points ? `${task.points} pt` : "—"}
        </div>
      </div>
    </div>
  );
};

/* ---------- Quick add ---------- */

const MTQuickAdd = ({ lang, projects, onAdd, defaultProjectId }) => {
  const [v, setV] = myUseState("");
  const [projId, setProjId] = myUseState(defaultProjectId || projects[0]?.id);
  const [pri, setPri] = myUseState("medium");
  const [due, setDue] = myUseState("today");
  const [focus, setFocus] = myUseState(false);
  const submit = () => {
    if (!v.trim()) return;
    const dueDate = due === "today" ? new Date() : due === "tomorrow" ? new Date(Date.now() + 86400000) : due === "week" ? new Date(Date.now() + 6*86400000) : null;
    onAdd({ title: v.trim(), projectId: projId, priority: pri, due: dueDate ? dueDate.toISOString().slice(0,10) : null });
    setV("");
  };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 10px 8px 14px",
      background: "var(--surface)",
      borderRadius: 10,
      boxShadow: focus
        ? "0 0 0 3px color-mix(in oklch, var(--primary) 15%, transparent), 0 2px 8px oklch(0 0 0 / 0.08), var(--inset-card)"
        : "var(--shadow), var(--inset-card)",
      transition: "box-shadow 0.15s ease, transform 0.15s ease",
      transform: focus ? "translateY(-1px)" : "translateY(0)",
    }}>
      <Icons.Plus size={14} style={{ color: "var(--fg-muted)" }}/>
      <input
        value={v} onChange={(e) => setV(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder={lang === "tr" ? "Görev ekle… (Enter ile kaydet)" : "Add a task… (Enter to save)"}
        style={{ flex: 1, background: "transparent", border: 0, fontSize: 13.5, height: 30 }}
      />
      <MTPicker value={projId} onChange={setProjId} options={projects.map(p => ({ id: p.id, label: p.key, sub: p.name, dot: mtProjectColor(p.id) }))} compactLabel="key"/>
      <MTPicker value={pri} onChange={setPri} options={MT_PRIORITIES.map(p => ({ id: p.id, label: lang === "tr" ? p.labelTr : p.labelEn, dot: p.color }))} icon={<MTPriority priority={pri} compact lang={lang}/>}/>
      <MTPicker value={due} onChange={setDue} options={[
        { id: "today", label: lang === "tr" ? "Bugün" : "Today" },
        { id: "tomorrow", label: lang === "tr" ? "Yarın" : "Tomorrow" },
        { id: "week", label: lang === "tr" ? "Bu hafta" : "This week" },
        { id: "none", label: lang === "tr" ? "Tarih yok" : "No date" },
      ]} icon={<Icons.Calendar size={12}/>}/>
      <Button size="sm" variant="primary" onClick={submit} disabled={!v.trim()}>{lang === "tr" ? "Ekle" : "Add"}</Button>
    </div>
  );
};

/* ---------- Generic popover picker ---------- */

const MTPicker = ({ value, onChange, options, icon, compactLabel }) => {
  const [open, setOpen] = myUseState(false);
  const ref = myUseRef();
  myUseEffect(() => {
    if (!open) return;
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);
  const cur = options.find(o => o.id === value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 9px", borderRadius: 6,
          background: "var(--surface-2)",
          boxShadow: "inset 0 0 0 1px var(--border)",
          fontSize: 11.5, fontWeight: 500, color: "var(--fg-muted)",
          height: 28,
        }}
      >
        {icon || (cur?.dot && <span style={{ width: 7, height: 7, borderRadius: 2, background: cur.dot }}/>)}
        <span style={{ fontFamily: compactLabel === "key" ? "var(--font-mono)" : "inherit", fontSize: compactLabel === "key" ? 11 : 11.5 }}>{cur?.label || "—"}</span>
        <Icons.ChevronDown size={10}/>
      </button>
      {open && (
        <div style={{ position: "absolute", top: 34, right: 0, minWidth: 200, background: "var(--surface)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 4, zIndex: 80, maxHeight: 300, overflowY: "auto" }}>
          {options.map(o => (
            <button key={o.id} onClick={() => { onChange(o.id); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", width: "100%", borderRadius: 4, fontSize: 12.5, textAlign: "left", background: o.id === value ? "var(--surface-2)" : "transparent", color: "var(--fg)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = o.id === value ? "var(--surface-2)" : "transparent"}>
              {o.dot && <span style={{ width: 8, height: 8, borderRadius: 2, background: o.dot }}/>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</div>
                {o.sub && <div style={{ fontSize: 11, color: "var(--fg-subtle)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.sub}</div>}
              </div>
              {o.id === value && <Icons.Check size={12} style={{ color: "var(--primary)" }}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Group header ---------- */

const MTGroupHeader = ({ icon, label, count, color, collapsed, onToggle, meta, progress }) => (
  <div onClick={onToggle} style={{
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px",
    background: "var(--surface-2)",
    borderTop: "1px solid var(--border)",
    borderBottom: collapsed ? "1px solid var(--border)" : "1px solid var(--border)",
    cursor: "pointer",
    position: "sticky", top: 0, zIndex: 2,
    boxShadow: collapsed ? "none" : "0 1px 3px oklch(0 0 0 / 0.06), var(--inset-top)",
  }}>
    <Icons.ChevronRight size={12} style={{ color: "var(--fg-subtle)", transform: collapsed ? "rotate(0deg)" : "rotate(90deg)", transition: "transform 0.15s" }}/>
    {icon && <span style={{ color }}>{icon}</span>}
    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
    <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontVariantNumeric: "tabular-nums" }} className="mono">{count}</span>
    {meta && <span style={{ fontSize: 11, color: "var(--fg-muted)", marginLeft: 4 }}>· {meta}</span>}
    <div style={{ flex: 1 }}/>
    {progress !== undefined && (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 100, height: 4, borderRadius: 2, background: "var(--surface)", overflow: "hidden", boxShadow: "inset 0 0 0 1px var(--border)" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: color || "var(--primary)" }}/>
        </div>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-muted)", width: 28, textAlign: "right" }}>{progress}%</span>
      </div>
    )}
  </div>
);

/* ---------- Group icons ---------- */

const MTBucketIcon = ({ kind, size = 14 }) => {
  if (kind === "alert") return <Icons.Alert size={size}/>;
  if (kind === "today") return <Icons.Flame size={size}/>;
  if (kind === "week") return <Icons.Calendar size={size}/>;
  if (kind === "later") return <Icons.Clock size={size}/>;
  return <Icons.Circle size={size}/>;
};

/* ---------- Main grouped list ---------- */

const MTGroupedList = ({ groups, collapsed, onToggle, renderRow, empty }) => {
  if (groups.every(g => g.items.length === 0)) return empty;
  return (
    <div>
      {groups.filter(g => g.items.length > 0).map(g => {
        const maxHeight = g.items.length > 5 ? 300 : null;
        return (
          <div key={g.id}>
            <MTGroupHeader icon={g.icon} label={g.label} count={g.items.length} color={g.color} collapsed={!!collapsed[g.id]} onToggle={() => onToggle(g.id)} meta={g.meta} progress={g.progress}/>
            {!collapsed[g.id] && (
              <div style={{ maxHeight, overflowY: maxHeight ? "auto" : "visible" }}>
                {g.items.map(renderRow)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- Filter chip ---------- */

const MTChip = ({ active, onClick, children, color, count }) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "4px 10px",
    borderRadius: 99,
    fontSize: 12, fontWeight: 500,
    background: active ? (color ? `color-mix(in oklch, ${color} 16%, transparent)` : "var(--accent)") : "transparent",
    color: active ? (color || "var(--accent-fg)") : "var(--fg-muted)",
    boxShadow: active
      ? (color ? `inset 0 0 0 1px color-mix(in oklch, ${color} 35%, transparent)` : "inset 0 0 0 1px var(--border)")
      : "inset 0 0 0 1px var(--border)",
    height: 26,
    transition: "background 0.12s ease",
  }}>
    {children}
    {count !== undefined && <span className="mono" style={{ fontSize: 10.5, opacity: 0.7 }}>{count}</span>}
  </button>
);

Object.assign(window, {
  MT_STATUSES, MT_STATUS_MAP, MT_PRIORITIES, MT_PRI_MAP,
  mtFormatDue, mtDueBucket, MT_BUCKET_META, mtProjectColor,
  MTStatusDot, MTPriority, MTDueChip, MTProjectTag, MTTaskRow,
  MTQuickAdd, MTPicker, MTGroupHeader, MTBucketIcon, MTGroupedList, MTChip,
});
