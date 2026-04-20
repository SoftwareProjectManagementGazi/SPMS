// Dashboard: Manager + Member view toggle, dense stats and portfolio

const { useState: useState_d } = React;

const ManagerView = ({ lang }) => {
  const projects = window.SPMSData.PROJECTS;
  const tasks = window.SPMSData.TASKS;
  const totalActive = tasks.filter(t => t.status !== "done").length;
  const totalDone = tasks.filter(t => t.status === "done").length;
  const overdueCount = tasks.filter(t => t.status !== "done" && new Date(t.due) < new Date()).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label={lang === "tr" ? "Toplam Proje" : "Projects"} value={projects.length} delta="+2" tone="primary" icon={<Icons.Folder/>}/>
        <StatCard label={lang === "tr" ? "Aktif Görev" : "Active tasks"} value={totalActive} delta="+14" tone="info" icon={<Icons.CheckSquare/>}/>
        <StatCard label={lang === "tr" ? "Tamamlanan" : "Completed"} value={totalDone} delta="bu hafta" tone="success" icon={<Icons.CircleCheck/>}/>
        <StatCard label={lang === "tr" ? "Gecikmiş" : "Overdue"} value={overdueCount} delta={lang === "tr" ? "dikkat" : "attention"} tone="danger" icon={<Icons.Alert/>}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        <Card padding={0}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === "tr" ? "Proje Portföyü" : "Project Portfolio"}</div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>{lang === "tr" ? "Aktif projeler, ilerleme ve sahipler" : "Active projects, progress & owners"}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Button size="xs" variant="ghost" icon={<Icons.Filter size={13}/>}>{lang === "tr" ? "Filtre" : "Filter"}</Button>
              <Button size="xs" variant="ghost" icon={<Icons.Download size={13}/>}>CSV</Button>
            </div>
          </div>
          <PortfolioTable/>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <MethodologyCard/>
          <ActivityFeed lang={lang}/>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, delta, tone = "neutral", icon }) => (
  <Card padding={14}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 11.5, color: "var(--fg-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 6, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      </div>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: tone === "primary" ? "color-mix(in oklch, var(--primary) 14%, transparent)" :
                     tone === "info" ? "color-mix(in oklch, var(--status-progress) 15%, transparent)" :
                     tone === "success" ? "color-mix(in oklch, var(--status-done) 15%, transparent)" :
                     tone === "danger" ? "color-mix(in oklch, var(--priority-critical) 13%, transparent)" : "var(--surface-2)",
        color: tone === "primary" ? "var(--primary)" :
                tone === "info" ? "var(--status-progress)" :
                tone === "success" ? "var(--status-done)" :
                tone === "danger" ? "var(--priority-critical)" : "var(--fg-muted)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
    </div>
    <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginTop: 10 }}>{delta}</div>
  </Card>
);

const PortfolioTable = () => {
  const router = useRouter();
  const lang = useApp().language;
  const projects = window.SPMSData.PROJECTS;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 120px 100px 90px 90px", padding: "10px 16px", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--fg-subtle)", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>
        <div>{lang === "tr" ? "Proje" : "Project"}</div>
        <div>{lang === "tr" ? "Yöntem" : "Method"}</div>
        <div>{lang === "tr" ? "Yönetici" : "Lead"}</div>
        <div>{lang === "tr" ? "Takım" : "Team"}</div>
        <div style={{ textAlign: "right" }}>{lang === "tr" ? "İlerleme" : "Progress"}</div>
        <div style={{ textAlign: "right" }}>{lang === "tr" ? "Bitiş" : "End"}</div>
      </div>
      {projects.map((p) => {
        const lead = window.SPMSData.getUser(p.leadId);
        const members = p.memberIds.map(id => window.SPMSData.getUser(id));
        const methTone = p.methodology === "scrum" ? "info" : p.methodology === "kanban" ? "primary" : "warning";
        return (
          <div key={p.id} onClick={() => router.go("project-detail", { projectId: p.id })}
            style={{ display: "grid", gridTemplateColumns: "2fr 90px 120px 100px 90px 90px", padding: "11px 16px", alignItems: "center", fontSize: 13, borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: "var(--fg-muted)", background: "var(--surface-2)", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{p.key}</div>
              <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
            </div>
            <div><Badge tone={methTone} size="xs">{p.methodology}</Badge></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <Avatar user={lead} size={20}/>
              <span style={{ fontSize: 12, color: "var(--fg-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead?.name.split(" ")[0]}</span>
            </div>
            <div><AvatarStack users={members} max={3} size={20}/></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
              <div style={{ width: 48, height: 4, background: "var(--surface-2)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${Math.round(p.progress * 100)}%`, height: "100%", background: "var(--primary)" }}/>
              </div>
              <span className="mono" style={{ fontSize: 11, color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>{Math.round(p.progress * 100)}%</span>
            </div>
            <div style={{ textAlign: "right", color: "var(--fg-muted)", fontSize: 12 }}>{new Date(p.end).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric" })}</div>
          </div>
        );
      })}
    </div>
  );
};

const MethodologyCard = () => {
  const lang = useApp().language;
  const projects = window.SPMSData.PROJECTS;
  const counts = { scrum: 0, kanban: 0, waterfall: 0 };
  projects.forEach(p => counts[p.methodology]++);
  const total = projects.length;
  return (
    <Card padding={16}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{lang === "tr" ? "Metodoloji dağılımı" : "Methodology mix"}</div>
      <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", background: "var(--surface-2)" }}>
        <div style={{ width: `${counts.scrum / total * 100}%`, background: "var(--status-progress)" }}/>
        <div style={{ width: `${counts.kanban / total * 100}%`, background: "var(--primary)" }}/>
        <div style={{ width: `${counts.waterfall / total * 100}%`, background: "var(--status-review)" }}/>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        {[{k:"scrum",c:"var(--status-progress)"},{k:"kanban",c:"var(--primary)"},{k:"waterfall",c:"var(--status-review)"}].map(({k,c}) => (
          <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c }}/>
              <span style={{ textTransform: "capitalize" }}>{k}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--fg-muted)" }}>{counts[k]} {lang === "tr" ? "proje" : "projects"}</span>
              <span className="mono" style={{ fontVariantNumeric: "tabular-nums", color: "var(--fg-subtle)", fontSize: 11 }}>{Math.round(counts[k] / total * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const ActivityFeed = ({ lang }) => {
  const items = [
    { user: "u4", action: lang === "tr" ? "MOBIL-12'yi 'Devam Ediyor' durumuna aldı" : "moved MOBIL-12 to In Progress", time: "5 dk" },
    { user: "u7", action: lang === "tr" ? "WEB-9 için yorum yazdı" : "commented on WEB-9", time: "22 dk" },
    { user: "u2", action: lang === "tr" ? "Veri Analitik projesini oluşturdu" : "created project Analytics Platform", time: "1 sa" },
    { user: "u5", action: lang === "tr" ? "3 görevi ERP-7'ye bağladı" : "linked 3 tasks to ERP-7", time: "3 sa" },
    { user: "u8", action: lang === "tr" ? "Bilgi Güvenliği testlerini tamamladı" : "completed security tests", time: "Dün" },
  ];
  return (
    <Card padding={0}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600 }}>{lang === "tr" ? "Son aktivite" : "Recent activity"}</div>
      <div>
        {items.map((it, i) => {
          const u = window.SPMSData.getUser(it.user);
          return (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 16px", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "0", alignItems: "center" }}>
              <Avatar user={u} size={22}/>
              <div style={{ flex: 1, fontSize: 12.5, minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>{u.name.split(" ")[0]}</span>
                <span style={{ color: "var(--fg-muted)" }}> {it.action}</span>
              </div>
              <span style={{ fontSize: 11, color: "var(--fg-subtle)" }} className="mono">{it.time}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const MemberView = ({ lang }) => {
  return (
    <MyTasksExperience
      compact
      defaultGroupBy="project"
      defaultView="all"
      hideQuickAdd
      hideRightRail
      hideHeader
      style={{ maxWidth: "none" }}
    />
  );
};

const TaskRow = ({ task, compact }) => {
  const router = useRouter();
  const assignee = window.SPMSData.getUser(task.assigneeId);
  return (
    <div onClick={() => router.go("task-detail", { taskId: task.id })}
      style={{ padding: compact ? "8px 0" : "10px 16px", display: "grid", gridTemplateColumns: "60px 1fr 80px 22px 70px", alignItems: "center", gap: 10, borderBottom: compact ? "0" : "1px solid var(--border)", fontSize: 12.5, cursor: "pointer" }}
      onMouseEnter={(e) => !compact && (e.currentTarget.style.background = "var(--surface-2)")}
      onMouseLeave={(e) => !compact && (e.currentTarget.style.background = "transparent")}>
      <div className="mono" style={{ fontSize: 11, color: "var(--fg-muted)" }}>{task.key}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <StatusDot status={task.status}/>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
      </div>
      <PriorityChip level={task.priority} lang="tr"/>
      <Avatar user={assignee} size={20}/>
      <div style={{ textAlign: "right", color: "var(--fg-subtle)", fontSize: 11 }}>
        {new Date(task.due).toLocaleDateString("tr-TR", { month: "short", day: "numeric" })}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const lang = useApp().language;
  const [view, setView] = useState_d("manager");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6 }}>{lang === "tr" ? "Merhaba, Ayşe" : "Welcome back, Ayşe"}</div>
          <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 4 }}>{new Date().toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { weekday: "long", month: "long", day: "numeric" })} · {lang === "tr" ? "Güzel bir hafta olsun" : "Make it count"}</div>
        </div>
        <div style={{ display: "inline-flex", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: 3, gap: 2, boxShadow: "inset 0 0 0 1px var(--border)" }}>
          <button onClick={() => setView("manager")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 600, background: view === "manager" ? "var(--surface)" : "transparent", color: view === "manager" ? "var(--fg)" : "var(--fg-muted)", boxShadow: view === "manager" ? "0 1px 2px oklch(0 0 0 / 0.05), inset 0 0 0 1px var(--border)" : "none" }}>{lang === "tr" ? "Yönetim" : "Management"}</button>
          <button onClick={() => setView("member")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 600, background: view === "member" ? "var(--surface)" : "transparent", color: view === "member" ? "var(--fg)" : "var(--fg-muted)", boxShadow: view === "member" ? "0 1px 2px oklch(0 0 0 / 0.05), inset 0 0 0 1px var(--border)" : "none" }}>{lang === "tr" ? "Benim İşim" : "My Work"}</button>
        </div>
      </div>
      {view === "manager" ? <ManagerView lang={lang}/> : <MemberView lang={lang}/>}
    </div>
  );
};

Object.assign(window, { DashboardPage });
