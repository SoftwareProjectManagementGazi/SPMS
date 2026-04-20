// User Profile Page (§10)

const UserProfilePage = () => {
  const router = useRouter();
  const lang = useApp().language;
  const T = (tr, en) => lang === "tr" ? tr : en;
  const userId = router.params.userId || window.SPMSData.CURRENT_USER.id;
  const user = window.SPMSData.getUser(userId);
  const isSelf = userId === window.SPMSData.CURRENT_USER.id;

  const [tab, setTab] = React.useState("tasks");

  const userTasks = window.SPMSData.TASKS.filter(t => t.assigneeId === userId);
  const doneTasks = userTasks.filter(t => t.status === "done");
  const userProjects = window.SPMSData.PROJECTS.filter(p => p.memberIds.includes(userId) || p.leadId === userId);
  const [taskFilter, setTaskFilter] = React.useState("active");

  if (!user) return <div style={{ padding: 40, color: "var(--fg-muted)" }}>{T("Kullanıcı bulunamadı.", "User not found.")}</div>;

  const filteredTasks = taskFilter === "all" ? userTasks : taskFilter === "done" ? doneTasks : userTasks.filter(t => t.status !== "done");

  // Group tasks by project
  const tasksByProject = React.useMemo(() => {
    const map = {};
    filteredTasks.forEach(t => { (map[t.projectId] = map[t.projectId] || []).push(t); });
    return Object.entries(map).map(([pid, ts]) => ({ project: window.SPMSData.getProject(pid), tasks: ts }));
  }, [filteredTasks]);

  return (
    <div style={{ maxWidth: 1100, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Profile header */}
      <Card padding={24} style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Avatar user={user} size={64} ring={isSelf} style={{ fontSize: 24 }}/>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4 }}>{user.name}</div>
            <Badge tone={user.role === "Admin" ? "danger" : user.role === "Project Manager" ? "info" : "neutral"}>{user.role}</Badge>
            {isSelf && <Badge tone="primary" size="xs">{T("Sen", "You")}</Badge>}
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>{user.email}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8, fontSize: 12.5, color: "var(--fg-muted)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icons.Folder size={12}/> {userProjects.length} {T("proje", "projects")}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icons.CheckSquare size={12}/> {userTasks.length} {T("görev", "tasks")}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icons.CircleCheck size={12}/> {doneTasks.length} {T("tamamlanan", "completed")}</span>
          </div>
        </div>
        {isSelf && <Button size="sm" variant="secondary" icon={<Icons.Edit size={12}/>} onClick={() => router.go("settings")}>{T("Düzenle", "Edit")}</Button>}
      </Card>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard label={T("Atanan Görevler", "Assigned Tasks")} value={userTasks.filter(t => t.status !== "done").length} tone="primary" icon={<Icons.CheckSquare/>} delta={`${userTasks.length} ${T("toplam", "total")}`}/>
        <StatCard label={T("Tamamlanan", "Completed")} value={doneTasks.length} tone="success" icon={<Icons.CircleCheck/>} delta={`%${userTasks.length ? Math.round(100 * doneTasks.length / userTasks.length) : 0} ${T("oran", "rate")}`}/>
        <StatCard label={T("Projeler", "Projects")} value={userProjects.length} tone="info" icon={<Icons.Folder/>} delta={`${userProjects.filter(p => p.leadId === userId).length} ${T("yönetici", "lead")}`}/>
      </div>

      {/* Tabs */}
      <Tabs active={tab} onChange={setTab} tabs={[
        { id: "tasks", label: T("Görevler", "Tasks"), icon: <Icons.CheckSquare size={13}/>, badge: userTasks.filter(t => t.status !== "done").length },
        { id: "projects", label: T("Projeler", "Projects"), icon: <Icons.Folder size={13}/>, badge: userProjects.length },
        { id: "activity", label: T("Aktivite", "Activity"), icon: <Icons.Activity size={13}/> },
      ]}/>

      {/* Tab content */}
      {tab === "tasks" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <SegmentedControl value={taskFilter} onChange={setTaskFilter} options={[
              { id: "active", label: T("Aktif", "Active") },
              { id: "done", label: T("Tamamlanan", "Completed") },
              { id: "all", label: T("Tümü", "All") },
            ]}/>
            <div style={{ flex: 1 }}/>
            <span className="mono" style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>{filteredTasks.length} {T("görev", "tasks")}</span>
          </div>
          {tasksByProject.map(({ project: p, tasks: ts }) => (
            <Card key={p.id} padding={0} style={{ marginBottom: 12 }}>
              <div style={{ padding: "10px 14px", background: "var(--surface-2)", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 3, background: mtProjectColor(p.id) }}/>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-muted)" }}>{p.key}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.name}</span>
                <Badge size="xs" tone="neutral">{ts.length}</Badge>
              </div>
              {ts.map((t, i) => {
                const assignee = window.SPMSData.getUser(t.assigneeId);
                const status = window.SPMSData.STATUSES.find(s => s.id === t.status);
                return (
                  <div key={t.id} onClick={() => router.go("task-detail", { taskId: t.id })}
                    style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px 90px 70px", padding: "10px 14px", alignItems: "center", gap: 8, borderBottom: i < ts.length - 1 ? "1px solid var(--border)" : "0", fontSize: 12.5, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-muted)" }}>{t.key}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: t.status === "done" ? "line-through" : "none", color: t.status === "done" ? "var(--fg-muted)" : "var(--fg)" }}>{t.title}</span>
                    <Badge size="xs" tone={t.status === "done" ? "success" : t.status === "progress" ? "info" : t.status === "review" ? "warning" : "neutral"} dot>{status?.name[lang]}</Badge>
                    <PriorityChip level={t.priority} lang={lang}/>
                    <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>{t.due ? new Date(t.due).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric" }) : "—"}</span>
                  </div>
                );
              })}
            </Card>
          ))}
          {filteredTasks.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--fg-subtle)", fontSize: 13 }}>
              {T("Bu filtreyle görev bulunamadı.", "No tasks found with this filter.")}
            </div>
          )}
        </div>
      )}

      {tab === "projects" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {userProjects.map(p => <ProjectCard key={p.id} project={p}/>)}
        </div>
      )}

      {tab === "activity" && <ActivityTab variant="full"/>}
    </div>
  );
};

Object.assign(window, { UserProfilePage });
