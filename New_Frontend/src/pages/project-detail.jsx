// Project detail with tabs: Board (kanban), List, Timeline, Calendar, Lifecycle, Members, Settings

const ProjectDetailPage = () => {
  const router = useRouter();
  const lang = useApp().language;
  const project = window.SPMSData.getProject(router.params.projectId) || window.SPMSData.PROJECTS[0];
  const [tab, setTab] = useState("board");
  const lead = window.SPMSData.getUser(project.leadId);
  const members = project.memberIds.map(id => window.SPMSData.getUser(id));
  const tasks = window.SPMSData.TASKS.filter(t => t.projectId === project.id);
  const methTone = project.methodology === "scrum" ? "info" : project.methodology === "kanban" ? "primary" : "warning";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", background: "var(--surface-2)", padding: "3px 8px", borderRadius: 4 }}>{project.key}</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>{project.name}</div>
          <Badge tone={methTone}>{project.methodology}</Badge>
          <Badge tone={project.status === "active" ? "success" : project.status === "completed" ? "info" : project.status === "on_hold" ? "warning" : "neutral"} dot>
            {project.status === "active" ? (lang === "tr" ? "Aktif" : "Active") : project.status === "completed" ? (lang === "tr" ? "Tamamlandı" : "Completed") : project.status === "on_hold" ? (lang === "tr" ? "Askıda" : "On Hold") : (lang === "tr" ? "Arşiv" : "Archived")}
          </Badge>
          <div style={{ flex: 1 }}/>
          <Button size="sm" variant="secondary" icon={<Icons.Workflow size={13}/>} onClick={() => router.go("workflow-editor", { projectId: project.id })}>{lang === "tr" ? "İş akışı" : "Workflow"}</Button>
          <Button size="sm" variant="secondary" icon={<Icons.MoreH size={13}/>}/>
          <Button size="sm" variant="primary" icon={<Icons.Plus size={13}/>} onClick={() => window.__openTaskModal && window.__openTaskModal(project.id)}>{lang === "tr" ? "Görev" : "Task"}</Button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 12.5, color: "var(--fg-muted)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Icons.Calendar size={13}/> {new Date(project.start).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric" })} → {new Date(project.end).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric" })}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Icons.Users size={13}/> {members.length} {lang === "tr" ? "üye" : "members"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Icons.CheckSquare size={13}/> {tasks.length} {lang === "tr" ? "görev" : "tasks"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Icons.Target size={13}/> Sprint 7 / 12</div>
          <div style={{ flex: 1 }}/>
          <AvatarStack users={members} max={6}/>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Tabs active={tab} onChange={setTab} size="md" tabs={[
          { id: "board", label: lang === "tr" ? "Pano" : "Board", icon: <Icons.Grid size={13}/> },
          { id: "list", label: lang === "tr" ? "Liste" : "List", icon: <Icons.List size={13}/>, badge: tasks.length },
          { id: "timeline", label: lang === "tr" ? "Zaman Çizelgesi" : "Timeline", icon: <Icons.Chart size={13}/> },
          { id: "calendar", label: lang === "tr" ? "Takvim" : "Calendar", icon: <Icons.Calendar size={13}/> },
          { id: "activity", label: lang === "tr" ? "Aktivite" : "Activity", icon: <Icons.Activity size={13}/> },
          { id: "lifecycle", label: project.methodology === "kanban" ? (lang === "tr" ? "Akış Metrikleri" : "Flow Metrics") : (lang === "tr" ? "Yaşam Döngüsü" : "Lifecycle"), icon: <Icons.Flow size={13}/> },
          { id: "members", label: lang === "tr" ? "Üyeler" : "Members", icon: <Icons.Users size={13}/>, badge: members.length },
          { id: "settings", label: lang === "tr" ? "Ayarlar" : "Settings", icon: <Icons.Settings size={13}/> },
        ]}/>
      </div>

      <div style={{ marginTop: 20, flex: 1, minHeight: 0 }}>
        {tab === "board" && <BoardTab project={project} tasks={tasks} lang={lang}/>}
        {tab === "list" && <ListTab project={project} tasks={tasks} lang={lang}/>}
        {tab === "timeline" && <TimelineTab project={project} tasks={tasks} lang={lang}/>}
        {tab === "calendar" && <CalendarTab project={project} tasks={tasks} lang={lang}/>}
        {tab === "activity" && <ActivityTab projectId={project.id} variant="full"/>}
        {tab === "lifecycle" && <LifecycleTabV2 project={project} lang={lang}/>}
        {tab === "members" && <MembersTab project={project} lang={lang}/>}
        {tab === "settings" && <SettingsTab project={project} lang={lang}/>}
      </div>
    </div>
  );
};

const BoardTab = ({ project, tasks, lang }) => {
  const columns = window.SPMSData.STATUSES;
  const [dragged, setDragged] = useState(null);
  const [taskMap, setTaskMap] = useState(() => {
    const m = {};
    columns.forEach(c => m[c.id] = tasks.filter(t => t.status === c.id));
    return m;
  });
  const [compact, setCompact] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Input icon={<Icons.Search size={13}/>} placeholder={lang === "tr" ? "Filtrele" : "Filter"} size="sm" style={{ width: 200 }}/>
        <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
          <button onClick={() => setCompact(true)} style={{ padding: "4px 10px", fontSize: 11.5, fontWeight: 600, borderRadius: 4, background: compact ? "var(--surface)" : "transparent", color: compact ? "var(--fg)" : "var(--fg-muted)" }}>{lang === "tr" ? "Sıkı" : "Compact"}</button>
          <button onClick={() => setCompact(false)} style={{ padding: "4px 10px", fontSize: 11.5, fontWeight: 600, borderRadius: 4, background: !compact ? "var(--surface)" : "transparent", color: !compact ? "var(--fg)" : "var(--fg-muted)" }}>{lang === "tr" ? "Detaylı" : "Rich"}</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--fg-muted)", fontSize: 12 }}>
          <span>Sprint:</span><Badge size="xs" tone="info">Sprint 7</Badge>
        </div>
        <div style={{ flex: 1 }}/>
        <AvatarStack users={project.memberIds.map(id => window.SPMSData.getUser(id))} max={5} size={22}/>
        <Button size="sm" variant="ghost" icon={<Icons.Filter size={13}/>}>{lang === "tr" ? "Filtreler" : "Filters"}</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))`, gap: 12, flex: 1, minHeight: 0, overflow: "auto" }}>
        {columns.map(col => {
          const colTasks = taskMap[col.id];
          const overLimit = col.wipLimit && colTasks.length > col.wipLimit;
          return (
            <div key={col.id}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.boxShadow = "inset 0 0 0 2px var(--primary)"; }}
              onDragLeave={(e) => { e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--border)"; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--border)";
                if (dragged && dragged.status !== col.id) {
                  setTaskMap(prev => {
                    const np = { ...prev };
                    Object.keys(np).forEach(k => { np[k] = np[k].filter(t => t.id !== dragged.id); });
                    np[col.id] = [...np[col.id], { ...dragged, status: col.id }];
                    return np;
                  });
                }
                setDragged(null);
              }}
              style={{
                background: overLimit ? "color-mix(in oklch, var(--priority-critical) 6%, var(--bg-2))" : (col.wipLimit && colTasks.length === col.wipLimit) ? "color-mix(in oklch, var(--status-review) 4%, var(--bg-2))" : "var(--bg-2)",
                borderRadius: "var(--radius)",
                boxShadow: "inset 0 0 0 1px var(--border)",
                display: "flex", flexDirection: "column",
                transition: "box-shadow 0.1s, background 0.15s",
                minHeight: 200,
              }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                <StatusDot status={col.id}/>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{col.name[lang]}</span>
                <Badge size="xs" tone={overLimit ? "danger" : (col.wipLimit && colTasks.length === col.wipLimit) ? "warning" : "neutral"}>{colTasks.length}{col.wipLimit ? `/${col.wipLimit}` : ""}</Badge>
                <div style={{ flex: 1 }}/>
                <button style={{ color: "var(--fg-subtle)" }}><Icons.Plus size={14}/></button>
              </div>
              {overLimit && <AlertBanner tone="danger" icon={<Icons.Alert size={11}/>} style={{ margin: "0 8px 0 8px", borderRadius: 4 }}>{lang === "tr" ? "WIP limiti aşıldı" : "WIP limit exceeded"}</AlertBanner>}
              <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flex: 1 }}>
                {colTasks.map(t => <KanbanCard key={t.id} task={t} compact={compact} onDragStart={() => setDragged(t)}/>)}
                {colTasks.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "var(--fg-subtle)", fontSize: 12 }}>{lang === "tr" ? "Bu kolonda görev yok" : "No tasks"}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const KanbanCard = ({ task, compact, onDragStart }) => {
  const router = useRouter();
  const assignee = window.SPMSData.getUser(task.assigneeId);
  return (
    <div draggable onDragStart={onDragStart} onClick={() => router.go("task-detail", { taskId: task.id })}
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "inset 0 0 0 1px var(--border), 0 1px 2px oklch(0 0 0 / 0.03)",
        borderLeft: `3px solid var(--priority-${task.priority})`,
        padding: compact ? "8px 10px 8px 9px" : "10px 12px 10px 11px",
        cursor: "grab", fontSize: 12.5,
        transition: "transform 0.08s, box-shadow 0.12s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--border-strong), 0 2px 6px oklch(0 0 0 / 0.06)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--border), 0 1px 2px oklch(0 0 0 / 0.03)"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: compact ? 0 : 6 }}>
        {task.type === "bug" && <Icons.Bug size={12} style={{ color: "var(--priority-critical)" }}/>}
        <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-subtle)", fontWeight: 600 }}>{task.key}</span>
        <div style={{ flex: 1 }}/>
        {!compact && <PriorityChip level={task.priority} withLabel={false}/>}
      </div>
      <div style={{ fontWeight: 500, lineHeight: 1.4, textWrap: "pretty", color: "var(--fg)" }}>{task.title}</div>
      {!compact && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "var(--fg-muted)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mono" style={{ padding: "1px 5px", background: "var(--surface-2)", borderRadius: 3 }}>{task.points}p</span>
            <span>{new Date(task.due).toLocaleDateString("tr-TR", { month: "short", day: "numeric" })}</span>
          </div>
          <Avatar user={assignee} size={20}/>
        </div>
      )}
      {compact && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 4 }}>
          <Avatar user={assignee} size={18}/>
        </div>
      )}
    </div>
  );
};

const ListTab = ({ tasks, lang }) => {
  return (
    <Card padding={0}>
      <div style={{ display: "grid", gridTemplateColumns: "80px 2fr 110px 110px 120px 90px 60px", padding: "10px 14px", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--fg-subtle)", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>
        <div>Anahtar</div><div>Başlık</div><div>Durum</div><div>Öncelik</div><div>Atanan</div><div>Bitiş</div><div style={{ textAlign: "right" }}>Puan</div>
      </div>
      {tasks.map(t => {
        const a = window.SPMSData.getUser(t.assigneeId);
        const status = window.SPMSData.STATUSES.find(s => s.id === t.status);
        return (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "80px 2fr 110px 110px 120px 90px 60px", padding: "10px 14px", alignItems: "center", fontSize: 12.5, borderBottom: "1px solid var(--border)", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div className="mono" style={{ fontSize: 11, color: "var(--fg-muted)" }}>{t.key}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {t.type === "bug" && <Icons.Bug size={12} style={{ color: "var(--priority-critical)" }}/>}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
            </div>
            <div><Badge size="xs" tone={t.status === "done" ? "success" : t.status === "progress" ? "info" : t.status === "review" ? "warning" : "neutral"} dot>{status.name[lang]}</Badge></div>
            <div><PriorityChip level={t.priority} lang={lang}/></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar user={a} size={20}/><span style={{ fontSize: 12 }}>{a?.name.split(" ")[0]}</span></div>
            <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{new Date(t.due).toLocaleDateString("tr-TR", { month: "short", day: "numeric" })}</div>
            <div className="mono" style={{ textAlign: "right", fontSize: 11, color: "var(--fg-muted)" }}>{t.points}</div>
          </div>
        );
      })}
    </Card>
  );
};

const TimelineTab = ({ project, tasks, lang }) => {
  const weeks = 16;
  return (
    <Card padding={16}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === "tr" ? "Zaman çizelgesi" : "Timeline"}</div>
        <Badge size="xs">{lang === "tr" ? "Haftalık görünüm" : "Weekly view"}</Badge>
        <div style={{ flex: 1 }}/>
        <Button size="xs" variant="ghost">Gün</Button>
        <Button size="xs" variant="secondary">Hafta</Button>
        <Button size="xs" variant="ghost">Ay</Button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${weeks}, 56px)`, fontSize: 11, borderBottom: "1px solid var(--border)", paddingBottom: 8, color: "var(--fg-muted)" }}>
          <div>{lang === "tr" ? "Görev" : "Task"}</div>
          {Array.from({ length: weeks }, (_, i) => <div key={i} className="mono" style={{ textAlign: "center", fontSize: 10.5 }}>W{i+1}</div>)}
        </div>
        {tasks.slice(0, 10).map((t, i) => {
          const start = (window.SPMSData.TASKS.indexOf(t) * 7) % 70 / 10;
          const dur = 1 + ((window.SPMSData.TASKS.indexOf(t) * 3) % 5);
          return (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: `200px repeat(${weeks}, 56px)`, padding: "8px 0", alignItems: "center", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><StatusDot status={t.status}/><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span></div>
              <div style={{ gridColumn: `${Math.floor(start)+2} / span ${dur}`, height: 16, background: `color-mix(in oklch, var(--priority-${t.priority}) 60%, transparent)`, borderRadius: 3, borderLeft: `2px solid var(--priority-${t.priority})`, fontSize: 10, color: "#fff", padding: "0 6px", display: "flex", alignItems: "center", overflow: "hidden", whiteSpace: "nowrap" }}>{t.key}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const CalendarTab = ({ tasks, lang }) => {
  const days = Array.from({ length: 35 }, (_, i) => i - 3);
  const weekDays = lang === "tr" ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return (
    <Card padding={16}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{lang === "tr" ? "Nisan 2026" : "April 2026"}</div>
        <Button size="xs" variant="ghost" icon={<Icons.ChevronLeft size={13}/>}/>
        <Button size="xs" variant="ghost" icon={<Icons.ChevronRight size={13}/>}/>
        <Button size="xs" variant="secondary">{lang === "tr" ? "Bugün" : "Today"}</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: "var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
        {weekDays.map(d => <div key={d} style={{ padding: "8px 10px", background: "var(--surface-2)", fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase" }}>{d}</div>)}
        {days.map((d, i) => {
          const isToday = d === 18;
          const dayTasks = tasks.filter((t, idx) => idx % 4 === (i % 4) && idx < d * 2 + 3 && idx >= d * 2 - 1 && d > 0).slice(0, 3);
          return (
            <div key={i} style={{ background: "var(--surface)", minHeight: 88, padding: 6, display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", fontSize: 11, fontWeight: 600, background: isToday ? "var(--primary)" : "transparent", color: isToday ? "var(--primary-fg)" : d > 0 && d < 31 ? "var(--fg)" : "var(--fg-subtle)" }}>{d > 0 ? d : (30 + d)}</div>
              {dayTasks.map(t => (
                <div key={t.id} style={{ fontSize: 10.5, padding: "2px 5px", borderRadius: 3, background: `color-mix(in oklch, var(--priority-${t.priority}) 18%, transparent)`, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.key} · {t.title}</div>
              ))}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const LifecycleTab = ({ project, lang }) => {
  const router = useRouter();
  const wf = window.SPMSData.DEFAULT_LIFECYCLES[project.methodology];
  return (
    <div>
      <Card padding={0} style={{ height: 520, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === "tr" ? "Bu projenin yaşam döngüsü" : "Project lifecycle"}</div>
          <Badge size="xs" tone={wf.mode === "sequential-locked" ? "warning" : wf.mode === "continuous" ? "info" : "neutral"}>
            {wf.mode === "sequential-locked" ? (lang === "tr" ? "Sıralı · geri dönüşsüz" : "Sequential · no reverse") : wf.mode === "continuous" ? (lang === "tr" ? "Sürekli" : "Continuous") : (lang === "tr" ? "Esnek" : "Flexible")}
          </Badge>
          <div style={{ flex: 1 }}/>
          <Button size="sm" variant="secondary" icon={<Icons.Workflow size={13}/>} onClick={() => router.go("workflow-editor", { projectId: project.id })}>{lang === "tr" ? "Düzenle" : "Edit"}</Button>
        </div>
        <WorkflowCanvas workflow={wf} readOnly activePhase={project.phase}/>
      </Card>
    </div>
  );
};

const MembersTab = ({ project, lang }) => {
  const members = project.memberIds.map(id => window.SPMSData.getUser(id));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
      <Card padding={0}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <Input icon={<Icons.Search size={13}/>} placeholder={lang === "tr" ? "Üye ara…" : "Search members…"} size="sm" style={{ width: 220 }}/>
          <Button size="sm" variant="primary" icon={<Icons.Plus size={13}/>}>{lang === "tr" ? "Üye ekle" : "Add member"}</Button>
        </div>
        {members.map((u, i) => (
          <div key={u.id} style={{ padding: "10px 16px", display: "grid", gridTemplateColumns: "28px 1fr 120px 100px 60px", alignItems: "center", gap: 10, borderBottom: i < members.length - 1 ? "1px solid var(--border)" : "0", fontSize: 12.5 }}>
            <Avatar user={u} size={28}/>
            <div>
              <div style={{ fontWeight: 600 }}>{u.name} {u.id === window.SPMSData.CURRENT_USER.id && <Badge size="xs" tone="primary" style={{ marginLeft: 4 }}>Sen</Badge>}</div>
              <div style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{u.email}</div>
            </div>
            <Badge size="xs" tone={u.role === "Admin" ? "danger" : u.role === "Project Manager" ? "info" : "neutral"}>{u.role}</Badge>
            <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{Math.floor(Math.random() * 20) + 2} {lang === "tr" ? "görev" : "tasks"}</div>
            <button style={{ color: "var(--fg-subtle)", justifySelf: "end" }}><Icons.MoreH size={14}/></button>
          </div>
        ))}
      </Card>
      <Card padding={16}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{lang === "tr" ? "Bekleyen istekler" : "Pending requests"}</div>
        {window.SPMSData.PENDING_REQUESTS.filter(r => r.project === project.id).length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{lang === "tr" ? "Bekleyen istek yok." : "No pending requests."}</div>
        ) : (
          window.SPMSData.PENDING_REQUESTS.filter(r => r.project === project.id).map(r => {
            const u = window.SPMSData.getUser(r.user);
            return (
              <div key={r.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar user={u} size={22}/><span style={{ fontSize: 12, fontWeight: 600 }}>{u?.name}</span></div>
                {r.note && <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 6, padding: 8, background: "var(--surface-2)", borderRadius: 4 }}>"{r.note}"</div>}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <Button size="xs" variant="primary">Onayla</Button>
                  <Button size="xs" variant="ghost">Reddet</Button>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
};

const SettingsTab = ({ project, lang }) => {
  const T = (tr, en) => lang === "tr" ? tr : en;
  const [sub, setSub] = useState("columns");
  const wf = window.SPMSData.DEFAULT_LIFECYCLES[project.methodology];
  const phases = wf?.nodes || [];
  return (
    <Card padding={0}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
        <Tabs size="sm" active={sub} onChange={setSub} tabs={[
          { id: "columns", label: T("Kolonlar", "Columns"), icon: <Icons.List size={12}/> },
          { id: "workflow", label: T("İş Akışı", "Workflow"), icon: <Icons.Workflow size={12}/> },
          { id: "lifecycle", label: T("Yaşam Döngüsü", "Lifecycle"), icon: <Icons.Flow size={12}/> },
          { id: "general", label: T("Genel", "General"), icon: <Icons.Settings size={12}/> },
        ]}/>
      </div>
      <div style={{ padding: 20, fontSize: 13 }}>
        {sub === "columns" && <div style={{ color: "var(--fg-muted)" }}>{T("Basit kolon düzenleyici. Gelişmiş akış için İş Akışı sekmesine geçin.", "Simple columns editor. See Workflow tab for advanced flow.")}</div>}
        {sub === "workflow" && <div style={{ color: "var(--fg-muted)" }}>{T("Görev durumlarını node tabanlı editörde düzenleyin.", "Node-based status workflow editor.")} <Button size="sm" variant="primary" onClick={() => useRouter().go("workflow-editor", { projectId: project.id })} style={{ marginLeft: 8 }}>{T("Aç", "Open")}</Button></div>}
        {sub === "lifecycle" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>{T("Her faz için geçiş kriterlerini tanımlayın.", "Define transition criteria for each phase.")}</div>
            {/* Phase assignment toggle (§14) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{T("Görev-Faz Ataması", "Task-Phase Assignment")}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 2 }}>{T("Görevlere ve alt görevlere faz ataması yapılabilir.", "Tasks and subtasks can be assigned to phases.")}</div>
              </div>
              <Toggle on={false}/>
            </div>
            {phases.map(ph => (
              <Collapsible key={ph.id} title={ph.name} badge={`3 ${T("kriter", "criteria")}`} defaultOpen={false}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.5 }}>{T("Otomatik Kriterler", "Auto Criteria")}</div>
                  {[
                    { label: T("Tüm görevler tamamlanmalı", "All tasks must be completed"), on: true },
                    { label: T("Kritik görev kalmamalı", "No critical tasks remaining"), on: true },
                    { label: T("Blocker kalmamalı", "No blockers remaining"), on: false },
                  ].map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                      <span style={{ fontSize: 12.5 }}>{c.label}</span>
                      <Toggle on={c.on} size="sm"/>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8 }}>{T("Manuel Kriterler", "Manual Criteria")}</div>
                  {[T("Faz çıktıları gözden geçirildi", "Phase outputs reviewed"), T("Paydaş onayı alındı", "Stakeholder approval obtained")].map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                      <Input defaultValue={c} size="sm" style={{ flex: 1 }}/>
                      <button style={{ color: "var(--fg-subtle)", padding: 4 }}><Icons.X size={12}/></button>
                    </div>
                  ))}
                  <Button size="xs" variant="ghost" icon={<Icons.Plus size={11}/>}>{T("Kriter Ekle", "Add Criterion")}</Button>
                </div>
              </Collapsible>
            ))}
            <Button size="sm" variant="primary" style={{ alignSelf: "flex-start" }}>{T("Kaydet", "Save")}</Button>
          </div>
        )}
        {sub === "general" && <div style={{ color: "var(--fg-muted)" }}>{T("Proje adı, açıklama, tarihler, arşivleme.", "Name, description, dates, archive.")}</div>}
      </div>
    </Card>
  );
};

Object.assign(window, { ProjectDetailPage });
