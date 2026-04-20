// Projects list page + reuse card for grid

const ProjectsPage = () => {
  const router = useRouter();
  const lang = useApp().language;
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const projects = window.SPMSData.PROJECTS.filter(p => {
    if (!p.name.toLowerCase().includes(filter.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });
  const T = (tr, en) => lang === "tr" ? tr : en;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6 }}>{T("Projeler", "Projects")}</div>
          <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 4 }}>{projects.length} {T("proje", "projects")} · {T("klavyeyle gezin", "keyboard friendly")} <Kbd style={{ marginLeft: 4 }}>↑↓</Kbd> <Kbd>↵</Kbd></div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <SegmentedControl value={statusFilter} onChange={setStatusFilter} options={[
            { id: "all", label: T("Tümü", "All") },
            { id: "active", label: T("Aktif", "Active") },
            { id: "completed", label: T("Bitti", "Done") },
            { id: "archived", label: T("Arşiv", "Archive") },
          ]}/>
          <Input icon={<Icons.Search size={14}/>} placeholder={T("Proje ara", "Search projects")} value={filter} onChange={(e) => setFilter(e.target.value)} size="md" style={{ width: 220 }}/>
          <Button variant="primary" icon={<Icons.Plus size={14}/>} onClick={() => router.go("create-project")}>{T("Yeni proje", "New project")}</Button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {projects.map(p => <ProjectCard key={p.id} project={p}/>)}
      </div>
    </div>
  );
};

const ProjectCard = ({ project }) => {
  const router = useRouter();
  const lang = useApp().language;
  const lead = window.SPMSData.getUser(project.leadId);
  const members = project.memberIds.map(id => window.SPMSData.getUser(id));
  const taskCount = window.SPMSData.TASKS.filter(t => t.projectId === project.id).length;
  const activeCount = window.SPMSData.TASKS.filter(t => t.projectId === project.id && t.status !== "done").length;
  const methTone = project.methodology === "scrum" ? "info" : project.methodology === "kanban" ? "primary" : "warning";
  return (
    <Card interactive padding={0} onClick={() => router.go("project-detail", { projectId: project.id })} style={{ opacity: project.status === "archived" ? 0.6 : 1 }}>
      <div style={{ height: 4, background: project.status === "completed" ? "var(--status-done)" : project.status === "on_hold" ? "var(--status-review)" : "var(--primary)", borderRadius: "var(--radius) var(--radius) 0 0" }}/>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 6 }}>{project.key}</div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>{project.name}</div>
          </div>
          <Badge tone={methTone} size="xs">{project.methodology}</Badge>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginTop: 8, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{project.description}</div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--fg-subtle)" }}>
          <span>{lang === "tr" ? "İlerleme" : "Progress"}</span>
          <div style={{ flex: 1, height: 4, background: "var(--surface-2)", borderRadius: 2 }}>
            <div style={{ width: `${Math.round(project.progress * 100)}%`, height: "100%", background: "var(--primary)", borderRadius: 2 }}/>
          </div>
          <span className="mono" style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--fg-muted)" }}>{Math.round(project.progress * 100)}%</span>
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
            <AvatarStack users={members} max={4} size={22}/>
            <span style={{ color: "var(--fg-muted)" }}>{activeCount}/{taskCount} {lang === "tr" ? "görev" : "tasks"}</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{new Date(project.end).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
        </div>
      </div>
    </Card>
  );
};

Object.assign(window, { ProjectsPage, ProjectCard });
