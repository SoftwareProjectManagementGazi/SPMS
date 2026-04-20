// Create Task Modal (§16)
// Triggered from header "Görev oluştur" and project detail "Görev" button

const CreateTaskModal = ({ open, onClose, defaultProjectId }) => {
  const lang = useApp().language;
  const T = (tr, en) => lang === "tr" ? tr : en;

  const [projectId, setProjectId] = React.useState(defaultProjectId || "");
  const [taskType, setTaskType] = React.useState("task"); // task | subtask | bug
  const [parentTaskId, setParentTaskId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState("medium");
  const [assigneeId, setAssigneeId] = React.useState("");
  const [points, setPoints] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [cycleId, setCycleId] = React.useState("");
  const [phaseId, setPhaseId] = React.useState("");
  const [tags, setTags] = React.useState([]);
  const [tagInput, setTagInput] = React.useState("");
  const [recurring, setRecurring] = React.useState(false);
  const [recurFreq, setRecurFreq] = React.useState("weekly");
  const [recurEnd, setRecurEnd] = React.useState("never");

  React.useEffect(() => {
    if (defaultProjectId) setProjectId(defaultProjectId);
  }, [defaultProjectId]);

  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && title.trim() && projectId) {
        e.preventDefault();
        handleSubmit();
      }
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, title, projectId]);

  if (!open) return null;

  const project = projectId ? window.SPMSData.getProject(projectId) : null;
  const members = project ? project.memberIds.map(id => window.SPMSData.getUser(id)) : [];
  const projectTasks = project ? window.SPMSData.TASKS.filter(t => t.projectId === project.id) : [];
  const wf = project ? window.SPMSData.DEFAULT_LIFECYCLES[project.methodology] : null;
  const cycleLabel = project ? (window.SPMSData.CYCLE_LABELS[project.methodology] || { tr: "Sprint", en: "Sprint" }) : { tr: "Sprint", en: "Sprint" };
  const enablePhaseAssignment = false; // toggle from settings — mock as false for now

  const handleSubmit = () => {
    if (!title.trim() || !projectId) return;
    // Mock — just close
    onClose();
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "oklch(0 0 0 / 0.3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.15s ease",
    }}>
      <Card onClick={(e) => e.stopPropagation()} padding={0} style={{
        width: 540, maxHeight: "85vh", overflowY: "auto",
        boxShadow: "var(--shadow-xl)",
        animation: "fadeIn 0.12s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{T("Görev Oluştur", "Create Task")}</div>
          <div style={{ flex: 1 }}/>
          <button onClick={onClose} style={{ color: "var(--fg-muted)", padding: 4 }}><Icons.X size={16}/></button>
        </div>

        {/* Form */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Project */}
          <ModalField label={T("Proje", "Project")} required>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={!!defaultProjectId}
              style={{ ...selectStyle, opacity: defaultProjectId ? 0.7 : 1 }}>
              <option value="">{T("Proje seçin…", "Select project…")}</option>
              {window.SPMSData.PROJECTS.filter(p => p.status === "active").map(p => (
                <option key={p.id} value={p.id}>{p.key} — {p.name}</option>
              ))}
            </select>
          </ModalField>

          {/* Task Type */}
          <ModalField label={T("Görev Türü", "Task Type")}>
            <SegmentedControl value={taskType} onChange={setTaskType} options={[
              { id: "task", label: T("Görev", "Task") },
              { id: "subtask", label: T("Alt Görev", "Sub-task") },
              { id: "bug", label: "Bug" },
            ]}/>
          </ModalField>

          {/* Parent task (subtask only) */}
          {taskType === "subtask" && (
            <ModalField label={T("Ana Görev", "Parent Task")}>
              <select value={parentTaskId} onChange={(e) => setParentTaskId(e.target.value)} style={selectStyle}>
                <option value="">{T("Ana görev seçin…", "Select parent…")}</option>
                {projectTasks.slice(0, 20).map(t => (
                  <option key={t.id} value={t.id}>{t.key} — {t.title}</option>
                ))}
              </select>
            </ModalField>
          )}

          {/* Title */}
          <ModalField label={T("Başlık", "Title")} required>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {taskType === "bug" && <Icons.Bug size={16} style={{ color: "var(--priority-critical)", flexShrink: 0 }}/>}
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder={T("Görev başlığı...", "Task title...")}
                style={{ ...inputStyle, fontSize: 14, fontWeight: 500, flex: 1 }}
                autoFocus/>
            </div>
          </ModalField>

          {/* Description */}
          <ModalField label={T("Açıklama", "Description")}>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder={T("Açıklama ekleyin...", "Add description...")}
              style={{ ...inputStyle, resize: "vertical", padding: "8px 10px", lineHeight: 1.5 }}/>
          </ModalField>

          {/* Two-column grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Priority */}
            <ModalField label={T("Öncelik", "Priority")}>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={selectStyle}>
                {[
                  { id: "critical", label: T("Kritik", "Critical") },
                  { id: "high", label: T("Yüksek", "High") },
                  { id: "medium", label: T("Orta", "Medium") },
                  { id: "low", label: T("Düşük", "Low") },
                ].map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </ModalField>

            {/* Due date */}
            <ModalField label={T("Bitiş Tarihi", "Due Date")}>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle}/>
            </ModalField>

            {/* Assignee */}
            <ModalField label={T("Atanan Kişi", "Assignee")}>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={selectStyle}>
                <option value="">{T("Atanmamış", "Unassigned")}</option>
                {members.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </ModalField>

            {/* Cycle */}
            <ModalField label={lang === "tr" ? cycleLabel.tr : cycleLabel.en}>
              <select value={cycleId} onChange={(e) => setCycleId(e.target.value)} style={selectStyle}>
                <option value="">{T("Seçilmedi", "None")}</option>
                <option value="s7">{lang === "tr" ? cycleLabel.tr : cycleLabel.en} 7</option>
                <option value="s8">{lang === "tr" ? cycleLabel.tr : cycleLabel.en} 8</option>
              </select>
            </ModalField>

            {/* Points */}
            <ModalField label={T("Puan", "Points")}>
              <input type="number" value={points} onChange={(e) => setPoints(e.target.value)}
                placeholder="SP" min="0" max="100" className="mono"
                style={{ ...inputStyle, width: "100%" }}/>
            </ModalField>

            {/* Phase (conditional) */}
            {enablePhaseAssignment && wf && (
              <ModalField label={T("Faz", "Phase")}>
                <select value={phaseId} onChange={(e) => setPhaseId(e.target.value)} style={selectStyle}>
                  <option value="">{T("Faz seçin…", "Select phase…")}</option>
                  {wf.nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </ModalField>
            )}
          </div>

          {/* Tags */}
          <ModalField label={T("Etiketler", "Labels")}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {tags.map(t => (
                <Badge key={t} size="xs" tone="primary" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {t}
                  <button onClick={() => setTags(tags.filter(x => x !== t))} style={{ color: "inherit", padding: 0, display: "inline-flex" }}><Icons.X size={9}/></button>
                </Badge>
              ))}
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder={T("Etiket ekle...", "Add label...")}
                style={{ border: 0, background: "transparent", outline: 0, fontSize: 12.5, minWidth: 100, flex: 1 }}/>
            </div>
          </ModalField>

          {/* Recurring (collapsible) */}
          <Collapsible title={T("Tekrarlayan Görev", "Recurring Task")} defaultOpen={false}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5 }}>{T("Tekrarlayan görev", "Recurring task")}</span>
                <Toggle on={recurring} onChange={setRecurring}/>
              </div>
              {recurring && (
                <>
                  <ModalField label={T("Sıklık", "Frequency")}>
                    <SegmentedControl value={recurFreq} onChange={setRecurFreq} size="xs" options={[
                      { id: "daily", label: T("Günlük", "Daily") },
                      { id: "weekly", label: T("Haftalık", "Weekly") },
                      { id: "monthly", label: T("Aylık", "Monthly") },
                    ]}/>
                  </ModalField>
                  <ModalField label={T("Bitiş", "End")}>
                    <SegmentedControl value={recurEnd} onChange={setRecurEnd} size="xs" options={[
                      { id: "never", label: T("Hiçbir zaman", "Never") },
                      { id: "date", label: T("Tarihte", "On date") },
                      { id: "count", label: T("Sayıda", "After count") },
                    ]}/>
                    {recurEnd === "date" && <input type="date" style={{ ...inputStyle, marginTop: 8 }}/>}
                    {recurEnd === "count" && <input type="number" placeholder="10" min="1" style={{ ...inputStyle, marginTop: 8, width: 80 }} className="mono"/>}
                  </ModalField>
                </>
              )}
            </div>
          </Collapsible>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>{T("Vazgeç", "Cancel")}</Button>
          <Button variant="primary" disabled={!title.trim() || !projectId} onClick={handleSubmit}>
            {T("Oluştur", "Create")}
          </Button>
          <Kbd style={{ marginLeft: 4 }}>⌘↵</Kbd>
        </div>
      </Card>
    </div>
  );
};

const ModalField = ({ label, required, children }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg-muted)" }}>
      {label}{required && <span style={{ color: "var(--priority-critical)", marginLeft: 2 }}>*</span>}
    </span>
    {children}
  </label>
);

const inputStyle = {
  height: 34, padding: "0 10px", fontSize: 13,
  background: "var(--surface-2)", border: 0,
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  fontFamily: "var(--font-sans)",
  width: "100%",
};

const selectStyle = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  paddingRight: 28,
};

Object.assign(window, { CreateTaskModal });
