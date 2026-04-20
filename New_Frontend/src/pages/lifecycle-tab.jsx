// Rebuilt LifecycleTab (§3) — summary strip, canvas, sub-tabs (overview, milestones, history, artifacts)
// + Phase Gate inline expand (§4)

const LifecycleTabV2 = ({ project, lang }) => {
  const router = useRouter();
  const T = (tr, en) => lang === "tr" ? tr : en;
  const wf = window.SPMSData.DEFAULT_LIFECYCLES[project.methodology];
  const isKanban = project.methodology === "kanban";
  const tasks = window.SPMSData.TASKS.filter(t => t.projectId === project.id);
  const doneTasks = tasks.filter(t => t.status === "done");

  const [sub, setSub] = React.useState("overview");
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [gateOpen, setGateOpen] = React.useState(false);

  // Active phase index (simplified: map project.phase to node index)
  const phaseMap = { initiation: 0, planning: 1, execution: 2, monitoring: 3, closure: 4, design: 1, testing: 3 };
  const activeIdx = phaseMap[project.phase] ?? 2;
  const activeNode = wf.nodes[activeIdx];
  const totalPhases = wf.nodes.length;
  const progressPct = Math.round((doneTasks.length / Math.max(tasks.length, 1)) * 100);

  // Phase stats per node
  const phaseStats = React.useMemo(() => {
    return wf.nodes.map((n, i) => {
      const phaseTasks = tasks.filter((_, ti) => ti % totalPhases === i);
      const done = phaseTasks.filter(t => t.status === "done").length;
      const total = phaseTasks.length;
      const state = i < activeIdx ? "past" : i === activeIdx ? "active" : "future";
      return { ...n, total, done, progress: total ? Math.round(100 * done / total) : 0, state, idx: i };
    });
  }, [wf, tasks, activeIdx]);

  const closedCount = phaseStats.filter(p => p.state === "past").length;
  const artifacts = window.SPMSData.ARTIFACTS[project.methodology] || [];
  const doneArtifacts = artifacts.filter(a => a.status === "completed").length;

  const subTabs = [
    { id: "overview", label: T("Genel Bakış", "Overview"), icon: <Icons.Chart size={12}/> },
    { id: "milestones", label: T("Kilometre Taşları", "Milestones"), icon: <Icons.Target size={12}/>, badge: window.SPMSData.MILESTONES.filter(m => m.projectId === project.id).length },
  ];
  if (!isKanban) {
    subTabs.push({ id: "history", label: T("Geçmiş", "History"), icon: <Icons.Clock size={12}/>, badge: closedCount });
    subTabs.push({ id: "artifacts", label: T("Artefaktlar", "Artifacts"), icon: <Icons.Doc size={12}/>, badge: `${doneArtifacts}/${artifacts.length}` });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <Card padding={0} style={{ overflow: "hidden" }}>
        {/* Summary strip */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16, fontSize: 12.5, flexWrap: "wrap" }}>
          <Badge tone="primary">{activeIdx + 1}/{totalPhases} — {activeNode?.name}</Badge>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ProgressBar value={progressPct} style={{ width: 120 }}/>
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-muted)" }}>%{progressPct}</span>
          </div>
          <span style={{ color: "var(--fg-muted)" }}>{tasks.length - doneTasks.length} {T("kalan", "remaining")}</span>
          <span style={{ color: "var(--fg-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Icons.Target size={12}/> {T("Demo — 12 gün", "Demo — 12 days")}
          </span>
          <div style={{ flex: 1 }}/>
          <Badge size="xs" tone={wf.mode === "sequential-locked" ? "warning" : wf.mode === "continuous" ? "info" : "neutral"}>
            {wf.mode === "sequential-locked" ? T("Sıralı · kilitli", "Sequential · locked") : wf.mode === "continuous" ? T("Sürekli", "Continuous") : T("Esnek", "Flexible")}
          </Badge>
          {!isKanban && (
            <Button size="sm" variant="primary" icon={<Icons.ArrowRight size={12}/>}
              onClick={() => setGateOpen(!gateOpen)}>
              {T("Sonraki Faza Geç", "Next Phase")}
            </Button>
          )}
          <Button size="sm" variant="secondary" icon={<Icons.Workflow size={13}/>}
            onClick={() => router.go("workflow-editor", { projectId: project.id })}>
            {T("Düzenle", "Edit")}
          </Button>
        </div>

        {/* Phase Gate inline expand (§4) */}
        {gateOpen && <PhaseGateExpand project={project} current={activeNode} next={wf.nodes[activeIdx + 1]} tasks={tasks} phaseStats={phaseStats[activeIdx]} wfMode={wf.mode} lang={lang} onClose={() => setGateOpen(false)}/>}

        {/* Canvas */}
        <div style={{ height: isKanban ? 200 : 320 }}>
          <WorkflowCanvas workflow={wf} readOnly activePhase={project.phase}
            onNodeClick={(n) => setSelectedNode(n.id === selectedNode ? null : n.id)}
            selected={selectedNode ? { type: "node", id: selectedNode } : null}/>
        </div>

        {/* Sub-tabs */}
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <div style={{ padding: "0 16px" }}>
            <Tabs size="sm" active={sub} onChange={setSub} tabs={subTabs}/>
          </div>
        </div>
      </Card>

      {/* Sub-tab content */}
      <div style={{ marginTop: 16 }}>
        {sub === "overview" && <OverviewSubTab phaseStats={phaseStats} activeIdx={activeIdx} selectedNode={selectedNode} tasks={tasks} lang={lang} isKanban={isKanban} project={project}/>}
        {sub === "milestones" && <MilestonesSubTab project={project} lang={lang}/>}
        {sub === "history" && <HistorySubTab project={project} lang={lang}/>}
        {sub === "artifacts" && <ArtifactsSubTab project={project} lang={lang}/>}
      </div>
    </div>
  );
};

/* ---- Overview Sub-Tab ---- */
const OverviewSubTab = ({ phaseStats, activeIdx, selectedNode, tasks, lang, isKanban, project }) => {
  const T = (tr, en) => lang === "tr" ? tr : en;
  const sel = selectedNode ? phaseStats.find(p => p.id === selectedNode) : phaseStats[activeIdx];

  if (isKanban) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <Card padding={16}>
          <div style={{ fontSize: 11.5, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{T("Ortalama Lead Time", "Avg Lead Time")}</div>
          <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>4.2<span style={{ fontSize: 14, color: "var(--fg-muted)" }}> {T("gün", "days")}</span></div>
        </Card>
        <Card padding={16}>
          <div style={{ fontSize: 11.5, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{T("Ortalama Cycle Time", "Avg Cycle Time")}</div>
          <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>2.8<span style={{ fontSize: 14, color: "var(--fg-muted)" }}> {T("gün", "days")}</span></div>
        </Card>
        <Card padding={16}>
          <div style={{ fontSize: 11.5, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{T("WIP", "WIP")}</div>
          <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>{tasks.filter(t => t.status === "progress").length}</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Selected/active phase detail card */}
      {sel && (
        <Card padding={14}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{sel.name}</span>
            <Badge size="xs" tone={sel.state === "active" ? "primary" : sel.state === "past" ? "success" : "neutral"} dot>
              {sel.state === "active" ? T("Aktif", "Active") : sel.state === "past" ? T("Tamamlandı", "Completed") : T("Bekliyor", "Pending")}
            </Badge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
            <MiniMetric label={T("Toplam", "Total")} value={sel.total}/>
            <MiniMetric label={T("Tamamlanan", "Done")} value={sel.done} color="var(--status-done)"/>
            <MiniMetric label={T("Devam Eden", "Active")} value={sel.total - sel.done} color="var(--status-progress)"/>
            <MiniMetric label={T("İlerleme", "Progress")} value={`%${sel.progress}`} mono/>
          </div>
          <ProgressBar value={sel.progress} height={4}/>
        </Card>
      )}

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Phase summary */}
        <Card padding={0}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12.5, fontWeight: 600 }}>{T("Faz Özeti", "Phase Summary")}</div>
          {phaseStats.map((p, i) => (
            <div key={p.id} onClick={() => {}} style={{
              display: "grid", gridTemplateColumns: "12px 1fr 80px 40px", gap: 10, alignItems: "center",
              padding: "10px 14px", borderBottom: i < phaseStats.length - 1 ? "1px solid var(--border)" : "0",
              background: p.state === "active" ? "var(--accent)" : "transparent",
            }}>
              <StatusDot status={p.state === "past" ? "done" : p.state === "active" ? "progress" : "todo"}/>
              <span style={{ fontSize: 12.5, fontWeight: p.state === "active" ? 600 : 500 }}>{p.name}</span>
              <ProgressBar value={p.progress} height={3} color={p.state === "past" ? "var(--status-done)" : p.state === "active" ? "var(--primary)" : "var(--border-strong)"}/>
              <span className="mono" style={{ fontSize: 11, color: "var(--fg-muted)", textAlign: "right" }}>%{p.progress}</span>
            </div>
          ))}
        </Card>

        {/* Upcoming tasks */}
        <Card padding={0}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12.5, fontWeight: 600 }}>{T("Yaklaşan Teslimler", "Upcoming Deliveries")}</div>
          {(() => {
            const upcoming = tasks.filter(t => t.status !== "done" && t.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
            if (upcoming.length === 0) return <div style={{ padding: 20, textAlign: "center", color: "var(--fg-subtle)", fontSize: 12 }}>{T("Yaklaşan teslim yok", "No upcoming deliveries")}</div>;
            return upcoming.map((t, i) => {
              const a = window.SPMSData.getUser(t.assigneeId);
              const daysLeft = Math.ceil((new Date(t.due) - new Date()) / 86400000);
              const overdue = daysLeft < 0;
              return (
                <div key={t.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 22px 50px", gap: 8, alignItems: "center", padding: "10px 14px", borderBottom: i < 4 ? "1px solid var(--border)" : "0", fontSize: 12.5 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-muted)" }}>{t.key}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                  <Avatar user={a} size={20}/>
                  <span style={{ textAlign: "right", fontSize: 11, color: overdue ? "var(--priority-critical)" : "var(--fg-muted)", display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                    {overdue && <Icons.Alert size={10}/>}
                    {overdue ? `${-daysLeft}${T("g","d")}` : `${daysLeft}${T("g","d")}`}
                  </span>
                </div>
              );
            });
          })()}
        </Card>
      </div>
    </div>
  );
};

const MiniMetric = ({ label, value, color, mono }) => (
  <div style={{ padding: 10, background: "var(--surface-2)", borderRadius: 6, textAlign: "center" }}>
    <div style={{ fontSize: 18, fontWeight: 600, color: color || "var(--fg)", fontVariantNumeric: mono ? "tabular-nums" : undefined }}>{value}</div>
    <div style={{ fontSize: 10.5, color: "var(--fg-muted)", marginTop: 2 }}>{label}</div>
  </div>
);

/* ---- Milestones Sub-Tab ---- */
const MilestonesSubTab = ({ project, lang }) => {
  const T = (tr, en) => lang === "tr" ? tr : en;
  const milestones = window.SPMSData.MILESTONES.filter(m => m.projectId === project.id);
  const [adding, setAdding] = React.useState(false);

  const statusTone = (s) => s === "completed" ? "success" : s === "in-progress" ? "info" : "neutral";
  const statusLabel = (s) => s === "completed" ? T("Tamamlandı","Done") : s === "in-progress" ? T("Devam Ediyor","In Progress") : T("Bekliyor","Pending");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Section title={T("Kilometre Taşları", "Milestones")} subtitle={`${milestones.length} ${T("tanımlı", "defined")}`}/>
        <div style={{ flex: 1 }}/>
        <Button size="sm" variant="secondary" icon={<Icons.Plus size={12}/>} onClick={() => setAdding(true)}>{T("Ekle", "Add")}</Button>
      </div>

      {adding && (
        <Card padding={14} style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10, marginBottom: 10 }}>
            <Input placeholder={T("Kilometre taşı adı…", "Milestone name…")} size="md" style={{ width: "100%" }}/>
            <Input type="date" size="md" style={{ width: "100%" }}/>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Button size="sm" variant="primary">{T("Kaydet", "Save")}</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>{T("İptal", "Cancel")}</Button>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {milestones.map(ms => {
          const daysLeft = Math.ceil((new Date(ms.dueDate) - new Date()) / 86400000);
          const overdue = ms.status !== "completed" && daysLeft < 0;
          return (
            <Card key={ms.id} padding={14} style={{ borderLeft: `3px solid ${overdue ? "var(--priority-critical)" : "var(--primary)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{ms.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: overdue ? "var(--priority-critical)" : "var(--fg-muted)", marginTop: 2 }}>
                    {new Date(ms.dueDate).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {ms.status !== "completed" && ` · ${overdue ? T(`${-daysLeft} gün gecikti`, `${-daysLeft}d overdue`) : T(`${daysLeft} gün kaldı`, `${daysLeft}d left`)}`}
                  </div>
                </div>
                <Badge tone={statusTone(ms.status)} dot>{statusLabel(ms.status)}</Badge>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <ProgressBar value={ms.progress} style={{ flex: 1 }}/>
                <span className="mono" style={{ fontSize: 11, color: "var(--fg-muted)" }}>%{ms.progress}</span>
              </div>
            </Card>
          );
        })}
        {milestones.length === 0 && (
          <div style={{ padding: 30, textAlign: "center", color: "var(--fg-subtle)", fontSize: 12.5, border: "1px dashed var(--border-strong)", borderRadius: 8 }}>
            {T("Henüz kilometre taşı tanımlanmamış.", "No milestones defined yet.")}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---- History Sub-Tab ---- */
const HistorySubTab = ({ project, lang }) => {
  const T = (tr, en) => lang === "tr" ? tr : en;
  const history = window.SPMSData.PHASE_HISTORY.filter(h => h.projectId === project.id);
  const [expanded, setExpanded] = React.useState({});
  const [reportOpen, setReportOpen] = React.useState({});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Section title={T("Kapatılmış Fazlar", "Closed Phases")} subtitle={`${history.length} ${T("faz tamamlandı", "phases completed")}`}/>
      {history.map(ph => (
        <Card key={ph.id} padding={14}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{ph.phaseName}</span>
                <Badge size="xs" tone="neutral">{ph.duration} {T("gün", "days")}</Badge>
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
                {new Date(ph.closedAt).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <Button size="xs" variant="ghost" icon={<Icons.Doc size={12}/>} onClick={() => setReportOpen({ ...reportOpen, [ph.id]: !reportOpen[ph.id] })}>{T("Rapor", "Report")}</Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 12 }}>
            <MiniMetric label={T("Toplam", "Total")} value={ph.total}/>
            <MiniMetric label={T("Tamamlanan", "Done")} value={ph.completed} color="var(--status-done)"/>
            <MiniMetric label={T("Taşınan", "Carried")} value={ph.carried} color="var(--status-review)"/>
            <MiniMetric label={T("Başarı", "Success")} value={`%${ph.successRate}`} mono/>
          </div>

          {ph.note && <div style={{ marginTop: 10, fontSize: 12, color: "var(--fg-muted)", fontStyle: "italic", padding: "8px 10px", background: "var(--surface-2)", borderRadius: 6 }}>"{ph.note}"</div>}

          {/* Evaluation report expand (§11) */}
          {reportOpen[ph.id] && (
            <div style={{ marginTop: 14, padding: 16, background: "var(--bg-2)", borderRadius: 8, boxShadow: "inset 0 0 0 1px var(--border)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{T("Faz Değerlendirme Raporu", "Phase Evaluation Report")} — {ph.phaseName}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12.5 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase" }}>{T("Karşılaşılan Sorunlar", "Issues Encountered")}</span>
                  <textarea rows={3} style={{ resize: "vertical", padding: 8, background: "var(--surface)", border: 0, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)", fontFamily: "var(--font-sans)", fontSize: 12.5 }}
                    defaultValue={T("API yanıt süresi beklentinin üzerindeydi. Redis cache eklenerek çözüldü.", "API response time was above expectations. Resolved by adding Redis cache.")}/>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase" }}>{T("Öğrenilen Dersler", "Lessons Learned")}</span>
                  <textarea rows={2} style={{ resize: "vertical", padding: 8, background: "var(--surface)", border: 0, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)", fontFamily: "var(--font-sans)", fontSize: 12.5 }}
                    defaultValue={T("Erken performans testi kritik. Her sprint'te mini-benchmark çalıştırılmalı.", "Early performance testing is critical. Run mini-benchmarks each sprint.")}/>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase" }}>{T("Sonraki Faz Önerileri", "Next Phase Recommendations")}</span>
                  <textarea rows={2} style={{ resize: "vertical", padding: 8, background: "var(--surface)", border: 0, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)", fontFamily: "var(--font-sans)", fontSize: 12.5 }}/>
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button size="sm" variant="secondary" icon={<Icons.Download size={12}/>}>PDF</Button>
                  <Button size="sm" variant="primary">{T("Kaydet", "Save")}</Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
      {history.length === 0 && (
        <div style={{ padding: 30, textAlign: "center", color: "var(--fg-subtle)", fontSize: 12.5, border: "1px dashed var(--border-strong)", borderRadius: 8 }}>
          {T("Henüz kapatılmış faz yok.", "No closed phases yet.")}
        </div>
      )}
    </div>
  );
};

/* ---- Artifacts Sub-Tab ---- */
const ArtifactsSubTab = ({ project, lang }) => {
  const T = (tr, en) => lang === "tr" ? tr : en;
  const artifacts = window.SPMSData.ARTIFACTS[project.methodology] || [];
  const doneCount = artifacts.filter(a => a.status === "completed").length;
  const [expandedId, setExpandedId] = React.useState(null);

  const statusDot = (s) => s === "completed" ? "var(--status-done)" : s === "draft" ? "var(--status-review)" : "var(--border-strong)";
  const statusLabel = (s) => s === "completed" ? T("Tamamlandı","Done") : s === "draft" ? T("Taslak","Draft") : T("Oluşturulmadı","Not Created");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>{doneCount}/{artifacts.length} {T("tamamlandı", "completed")}</span>
        <ProgressBar value={doneCount} max={artifacts.length} style={{ width: 200 }}/>
        <div style={{ flex: 1 }}/>
        <Button size="sm" variant="secondary" icon={<Icons.Plus size={12}/>}>{T("Özel Ekle", "Add Custom")}</Button>
      </div>

      <Card padding={0}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 120px 150px 100px 40px", padding: "10px 14px", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--fg-subtle)", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>
          <div>{T("Artefakt", "Artifact")}</div><div>{T("Durum", "Status")}</div><div>{T("Güncelleme", "Updated")}</div><div>{T("Sorumlu", "Owner")}</div><div/>
        </div>
        {artifacts.map((a, i) => {
          const u = a.updatedBy ? window.SPMSData.getUser(a.updatedBy) : null;
          return (
            <React.Fragment key={a.id}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 120px 150px 100px 40px", padding: "10px 14px", alignItems: "center", fontSize: 12.5, borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icons.Doc size={13} style={{ color: "var(--fg-muted)" }}/>
                  <span style={{ fontWeight: 500 }}>{a.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusDot(a.status), cursor: "pointer" }}/>
                  <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>{statusLabel(a.status)}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>{a.updatedAt || "—"}</div>
                <div>{u ? <Avatar user={u} size={20}/> : <span style={{ color: "var(--fg-subtle)" }}>—</span>}</div>
                <button style={{ color: "var(--fg-subtle)" }}><Icons.MoreH size={13}/></button>
              </div>
              {expandedId === a.id && (
                <div style={{ padding: 16, borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <Input placeholder={T("Artefakt adı", "Artifact name")} size="md" style={{ width: "100%" }}/>
                    <SegmentedControl value={a.status} onChange={() => {}} options={[
                      { id: "not-created", label: T("Yok", "None") },
                      { id: "draft", label: T("Taslak", "Draft") },
                      { id: "completed", label: T("Tamam", "Done") },
                    ]}/>
                  </div>
                  <textarea rows={2} placeholder={T("Not ekleyin…", "Add a note…")} style={{ width: "100%", resize: "vertical", padding: 8, background: "var(--surface)", border: 0, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)", fontFamily: "var(--font-sans)", fontSize: 12.5, marginBottom: 10 }}/>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button size="sm" variant="primary">{T("Kaydet", "Save")}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setExpandedId(null)}>{T("Kapat", "Close")}</Button>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </Card>
    </div>
  );
};

/* ---- Phase Gate Expand (§4) ---- */
const PhaseGateExpand = ({ project, current, next, tasks, phaseStats, wfMode, lang, onClose }) => {
  const T = (tr, en) => lang === "tr" ? tr : en;
  const [openTaskAction, setOpenTaskAction] = React.useState("move");
  const openTasks = tasks.filter(t => t.status !== "done");
  const criticalOpen = openTasks.filter(t => t.priority === "critical");
  const blockers = openTasks.filter(t => t.status === "blocked");

  const autoChecks = [
    { ok: openTasks.length === 0, label: T("Tüm görevler tamamlandı", "All tasks completed") },
    { ok: criticalOpen.length === 0, label: T("Kritik görev kalmadı", "No critical tasks remaining") },
    { ok: blockers.length === 0, label: T("Blocker kalmadı", "No blockers remaining") },
  ];
  const [manualChecks, setManualChecks] = React.useState({ reviewed: false, approved: false });
  const allPassed = autoChecks.every(c => c.ok) && Object.values(manualChecks).every(Boolean);
  const isLocked = wfMode === "sequential-locked";

  return (
    <div style={{ padding: 20, borderBottom: "2px solid var(--border)", background: "var(--bg-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{T("Faz Geçişi", "Phase Transition")}: {current?.name} → {next?.name || T("Kapanış", "Closure")}</div>
        <div style={{ flex: 1 }}/>
        <button onClick={onClose} style={{ color: "var(--fg-muted)", padding: 4 }}><Icons.X size={14}/></button>
      </div>

      <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginBottom: 14 }}>
        {T("Toplam", "Total")}: {phaseStats.total} · {T("Tamamlanan", "Done")}: {phaseStats.done} · {T("Açık", "Open")}: {openTasks.length}
        {openTasks.length > 0 && <span style={{ color: "var(--status-review)", marginLeft: 4 }}><Icons.Alert size={11}/></span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{T("Otomatik Kriterler", "Auto Checks")}</div>
          {autoChecks.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "4px 0" }}>
              {phaseStats.total === 0
                ? <span style={{ color: "var(--fg-subtle)" }}><Icons.Circle size={13}/></span>
                : c.ok
                  ? <span style={{ color: "var(--status-done)" }}><Icons.CircleCheck size={13}/></span>
                  : <span style={{ color: "var(--priority-critical)" }}><Icons.Alert size={13}/></span>
              }
              <span style={{ color: phaseStats.total === 0 ? "var(--fg-subtle)" : "var(--fg-muted)" }}>{phaseStats.total === 0 ? T("Uygulanamaz", "N/A") + " — " : ""}{c.label}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{T("Manuel Kriterler", "Manual Checks")}</div>
          {[
            { key: "reviewed", label: T("Faz çıktıları gözden geçirildi", "Phase outputs reviewed") },
            { key: "approved", label: T("Paydaş onayı alındı", "Stakeholder approval obtained") },
          ].map(c => (
            <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "4px 0", cursor: "pointer" }}>
              <input type="checkbox" checked={manualChecks[c.key]} onChange={() => setManualChecks({ ...manualChecks, [c.key]: !manualChecks[c.key] })}/>
              {c.label}
            </label>
          ))}
          <button style={{ fontSize: 11.5, color: "var(--primary)", marginTop: 6, fontWeight: 600 }}>{T("Kriterleri düzenle →", "Edit criteria →")}</button>
        </div>
      </div>

      {openTasks.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{T("Açık Görevler", "Open Tasks")} ({openTasks.length})</div>
          <SegmentedControl value={openTaskAction} onChange={setOpenTaskAction} options={[
            { id: "move", label: T("Sonraki faza taşı", "Move to next") },
            { id: "backlog", label: T("Backlog'a taşı", "Move to backlog") },
            { id: "keep", label: T("Bu fazda bırak", "Keep in this phase") },
          ]}/>
        </div>
      )}

      <textarea rows={2} placeholder={T("Geçiş notu (opsiyonel)…", "Transition note (optional)…")}
        style={{ width: "100%", resize: "vertical", padding: 8, background: "var(--surface)", border: 0, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)", fontFamily: "var(--font-sans)", fontSize: 12.5, marginBottom: 14 }}/>

      {isLocked && !allPassed && (
        <AlertBanner tone="danger" icon={<Icons.Lock size={13}/>} style={{ marginBottom: 10 }}>
          {T("Sıralı kilitli modda tüm kriterler karşılanmadan geçiş yapılamaz.", "All criteria must be met in sequential-locked mode.")}
        </AlertBanner>
      )}
      {!isLocked && !allPassed && (
        <AlertBanner tone="warning" icon={<Icons.Alert size={13}/>} style={{ marginBottom: 10 }}>
          {T("Bazı kriterler karşılanmadı. Yine de geçiş yapabilirsiniz.", "Some criteria are unmet. You can still proceed.")}
        </AlertBanner>
      )}

      <Button variant="primary" disabled={isLocked && !allPassed} icon={<Icons.ArrowRight size={13}/>}>
        {T("Faz Geçişini Onayla", "Confirm Phase Transition")}
      </Button>
    </div>
  );
};

Object.assign(window, { LifecycleTabV2 });
