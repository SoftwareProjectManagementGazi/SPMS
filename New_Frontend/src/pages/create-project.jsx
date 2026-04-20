// Create Project Wizard (§17) — 4-step wizard
// Route: create-project

const CreateProjectPage = () => {
  const lang = useApp().language;
  const router = useRouter();
  const T = (tr, en) => lang === "tr" ? tr : en;

  const [step, setStep] = React.useState(1);

  // Step 1
  const [name, setName] = React.useState("");
  const [key, setKey] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [startDate, setStartDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = React.useState("");
  const [leadId, setLeadId] = React.useState(window.SPMSData.CURRENT_USER.id);

  // Step 2
  const [methodology, setMethodology] = React.useState("");

  // Step 3
  const [wfMode, setWfMode] = React.useState("flexible");
  const [selectedNode, setSelectedNode] = React.useState(null);

  // Step 4
  const [columns, setColumns] = React.useState(["Yapılacak", "Devam Ediyor", "İncelemede", "Tamamlandı"]);
  const [fields, setFields] = React.useState({ storyPoints: true, dueDate: true, priority: true, severity: false, risk: false, labels: true, assignee: true, estimateHours: false, attachments: true });
  const [rules, setRules] = React.useState({ enforceSequential: false, enforceWip: true, blockExpiredPhase: false, phaseAssignment: false });
  const [invitedMembers, setInvitedMembers] = React.useState([]);

  // Resolve workflow from methodology
  const getWorkflow = () => {
    if (!methodology) return null;
    const all = { ...window.SPMSData.DEFAULT_LIFECYCLES, ...window.SPMSData.EXTRA_LIFECYCLES };
    return all[methodology] || null;
  };
  const wf = getWorkflow();

  React.useEffect(() => {
    if (wf) setWfMode(wf.mode);
  }, [methodology]);

  const steps = [
    { n: 1, label: T("Temel Bilgiler", "Basics") },
    { n: 2, label: T("Metodoloji", "Methodology") },
    { n: 3, label: T("Yaşam Döngüsü", "Lifecycle") },
    { n: 4, label: T("Yapılandırma", "Configuration") },
  ];

  const canProceed = () => {
    if (step === 1) return name.trim() && key.trim();
    if (step === 2) return !!methodology;
    return true;
  };

  const handleCreate = () => {
    router.go("project-detail", { projectId: "p1" }); // mock
  };

  const templates = [
    { id: "scrum", name: "Scrum", mode: "flexible", desc: T("Sprint tabanlı, iteratif geliştirme. Esnek ilerleyiş.", "Sprint-based iterative development. Flexible progression."), row: 1 },
    { id: "kanban", name: "Kanban", mode: "continuous", desc: T("Sürekli akış, WIP sınırlı. Minimum seremoni.", "Continuous flow, WIP-limited. Minimal ceremony."), row: 1 },
    { id: "waterfall", name: "Waterfall", mode: "sequential-locked", desc: T("Sıralı fazlar, geri dönüşsüz. Geleneksel yapı.", "Sequential phases, no reversal. Traditional structure."), row: 1 },
    { id: "v-model", name: "V-Model", mode: "sequential-flexible", desc: T("Doğrulama odaklı, sıralı + esnek geri dönüş.", "Verification-focused, sequential + flex return."), row: 2 },
    { id: "spiral", name: "Spiral", mode: "flexible", desc: T("Risk odaklı döngüsel geliştirme.", "Risk-driven iterative development."), row: 2 },
    { id: "incremental", name: T("Artırımlı", "Incremental"), mode: "flexible", desc: T("Parçalı teslimat, paralel fazlar mümkün.", "Incremental delivery, parallel phases possible."), row: 2 },
  ];

  const modeBadge = (m) => {
    const map = {
      "flexible": { label: T("Esnek", "Flexible"), tone: "neutral" },
      "sequential-locked": { label: T("Sıralı Kilitli", "Seq. Locked"), tone: "warning" },
      "sequential-flexible": { label: T("Sıralı+", "Seq. Flex"), tone: "primary" },
      "continuous": { label: T("Sürekli", "Continuous"), tone: "info" },
    };
    const v = map[m] || map.flexible;
    return <Badge size="xs" tone={v.tone}>{v.label}</Badge>;
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && <div style={{ flex: 1, height: 2, background: step > s.n ? "var(--status-done)" : step === s.n ? "var(--primary)" : "var(--border)", margin: "0 8px", borderRadius: 1, transition: "background 0.2s" }}/>}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600,
                background: step > s.n ? "var(--status-done)" : step === s.n ? "var(--primary)" : "var(--surface-2)",
                color: step > s.n || step === s.n ? "var(--primary-fg)" : "var(--fg-muted)",
                boxShadow: step === s.n ? "0 0 0 3px color-mix(in oklch, var(--primary) 20%, transparent)" : "inset 0 0 0 1px var(--border)",
                transition: "all 0.2s",
              }}>
                {step > s.n ? <Icons.Check size={13}/> : s.n}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: step === s.n ? 600 : 500, color: step === s.n ? "var(--fg)" : "var(--fg-muted)" }}>{s.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && (
        <Card padding={24}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{T("Temel Bilgiler", "Basic Information")}</div>
          <div style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 20 }}>{T("Projenizin adı, anahtarı ve tarihlerini belirleyin.", "Set your project name, key and dates.")}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <ModalField label={T("Proje Adı", "Project Name")} required>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={T("Proje adı", "Project name")} style={wizInputStyle} autoFocus/>
            </ModalField>

            <ModalField label={T("Proje Anahtarı", "Project Key")} required>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input value={key} onChange={(e) => setKey(e.target.value.toUpperCase().slice(0, 6))} placeholder="KEY" maxLength={6} className="mono" style={{ ...wizInputStyle, width: 120, letterSpacing: 1 }}/>
                <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>{T("Görev anahtarları için kullanılır (ör. KEY-1, KEY-2)", "Used for task keys (e.g. KEY-1, KEY-2)")}</span>
              </div>
            </ModalField>

            <ModalField label={T("Açıklama", "Description")}>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder={T("Proje açıklaması...", "Project description...")} style={{ ...wizInputStyle, resize: "vertical", padding: "8px 10px", height: "auto" }}/>
            </ModalField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <ModalField label={T("Başlangıç Tarihi", "Start Date")}>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={wizInputStyle}/>
              </ModalField>
              <ModalField label={T("Bitiş Tarihi", "End Date")}>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={wizInputStyle}/>
              </ModalField>
            </div>

            <ModalField label={T("Proje Yöneticisi", "Project Lead")}>
              <select value={leadId} onChange={(e) => setLeadId(e.target.value)} style={wizSelectStyle}>
                {window.SPMSData.USERS.filter(u => u.role !== "Member").map(u => (
                  <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                ))}
              </select>
            </ModalField>
          </div>
        </Card>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{T("Metodoloji Seçimi", "Choose Methodology")}</div>
          <div style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 20 }}>{T("Projeniz için bir yaşam döngüsü şablonu seçin. Daha sonra değiştirebilirsiniz.", "Choose a lifecycle template. You can change it later.")}</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {templates.filter(t => t.row === 1).map(t => (
              <TemplateCard key={t.id} template={t} selected={methodology === t.id} onSelect={() => setMethodology(t.id)} modeBadge={modeBadge}/>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
            {templates.filter(t => t.row === 2).map(t => (
              <TemplateCard key={t.id} template={t} selected={methodology === t.id} onSelect={() => setMethodology(t.id)} modeBadge={modeBadge}/>
            ))}
          </div>

          {window.SPMSData.EXTRA_LIFECYCLES && Object.keys(window.SPMSData.EXTRA_LIFECYCLES).filter(k => !templates.find(t => t.id === k)).length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 20, marginBottom: 10 }}>{T("Özel Şablonlar", "Custom Templates")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {Object.entries(window.SPMSData.EXTRA_LIFECYCLES).filter(([k]) => !templates.find(t => t.id === k)).map(([k, v]) => (
                  <Card key={k} interactive padding={14} onClick={() => setMethodology(k)}
                    style={{ boxShadow: methodology === k ? "0 0 0 2px var(--primary), var(--shadow)" : "var(--shadow)" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{k}</div>
                    <div style={{ marginTop: 4 }}>{modeBadge(v.mode)}</div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{T("Yaşam Döngüsü", "Lifecycle")}</div>
          <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginBottom: 16 }}>{T("Projenin yaşam döngüsünü özelleştirin. Detaylı düzenleme için proje oluşturulduktan sonra İş Akışı Tasarımcısı'nı kullanabilirsiniz.", "Customize the lifecycle. Use the Workflow Designer after creation for detailed editing.")}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            {/* Canvas */}
            <Card padding={0} style={{ overflow: "hidden" }}>
              <div style={{ height: 420 }}>
                {wf ? (
                  <WorkflowCanvas workflow={{ ...wf, mode: wfMode }} readOnly={false}
                    onNodeClick={(n) => setSelectedNode(n.id === selectedNode ? null : n.id)}
                    selected={selectedNode ? { type: "node", id: selectedNode } : null}/>
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-subtle)" }}>
                    {T("Önce metodoloji seçin", "Select methodology first")}
                  </div>
                )}
              </div>
              <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 6 }}>
                <Button size="xs" variant="ghost" icon={<Icons.Plus size={11}/>}>{T("Faz Ekle", "Add Phase")}</Button>
                <Button size="xs" variant="ghost" icon={<Icons.Flow size={11}/>}>{T("Bağlantı", "Edge")}</Button>
                <Button size="xs" variant="ghost" icon={<Icons.Grid size={11}/>}>{T("Grup", "Group")}</Button>
                <div style={{ width: 1, height: 20, background: "var(--border)" }}/>
                <Button size="xs" variant="ghost" icon={<Icons.Trash size={11}/>} disabled={!selectedNode}>{T("Sil", "Delete")}</Button>
              </div>
            </Card>

            {/* Right panel */}
            <Card padding={14} style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 12.5 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{T("Akış Modu", "Flow Mode")}</div>
                <SegmentedControl value={wfMode} onChange={setWfMode} size="xs" options={[
                  { id: "flexible", label: T("Esnek", "Flex") },
                  { id: "sequential-locked", label: T("Sıralı", "Seq") },
                  { id: "sequential-flexible", label: T("Sıralı+", "Seq+") },
                  { id: "continuous", label: T("Sürekli", "Cont") },
                ]}/>
                <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 6, lineHeight: 1.5 }}>
                  {wfMode === "flexible" && T("Her düğüm arası geçiş tanımlanabilir.", "Define any transitions between nodes.")}
                  {wfMode === "sequential-locked" && T("Sıralı, geri dönüş yok.", "Sequential, no backward.")}
                  {wfMode === "sequential-flexible" && T("Sıralı, tanımlı geri dönüş.", "Sequential, defined returns.")}
                  {wfMode === "continuous" && T("Tek aktif faz, sürekli akış.", "Single active phase, continuous.")}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{T("Seçim", "Selection")}</div>
                {selectedNode && wf ? (() => {
                  const n = wf.nodes.find(nd => nd.id === selectedNode);
                  if (!n) return null;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input defaultValue={n.name} placeholder={T("Faz adı", "Phase name")} style={wizInputStyle}/>
                      <input defaultValue={n.description || ""} placeholder={T("Açıklama", "Description")} style={wizInputStyle}/>
                      <div style={{ display: "flex", gap: 4 }}>
                        {["status-todo","status-progress","status-review","status-done","status-blocked","primary"].map(c => (
                          <div key={c} style={{ width: 18, height: 18, borderRadius: 4, background: `var(--${c})`, cursor: "pointer", boxShadow: n.color === c ? "0 0 0 2px var(--fg)" : "inset 0 0 0 1px oklch(0 0 0 / 0.1)" }}/>
                        ))}
                      </div>
                    </div>
                  );
                })() : <div style={{ color: "var(--fg-subtle)" }}>{T("Bir faz, bağlantı veya grup seçin.", "Select a phase, edge or group.")}</div>}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{T("Doğrulama", "Validation")}</div>
                <ValidationItem ok label={T("Başlangıç düğümü mevcut", "Initial node exists")}/>
                <ValidationItem ok label={T("Bitiş düğümü mevcut", "Final node exists")}/>
                <ValidationItem ok label={T("Erişilebilirlik kontrolü", "Reachability OK")}/>
              </div>
            </Card>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{T("Yapılandırma", "Configuration")}</div>

          {/* Board columns */}
          <Card padding={16}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{T("Board Kolonları", "Board Columns")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {columns.map((col, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--fg-subtle)", cursor: "grab", fontSize: 14 }}>⠿</span>
                  <input value={col} onChange={(e) => { const c = [...columns]; c[i] = e.target.value; setColumns(c); }} style={{ ...wizInputStyle, flex: 1 }}/>
                  <input type="number" placeholder="∞" min="0" className="mono" style={{ ...wizInputStyle, width: 60 }}/>
                  <button onClick={() => setColumns(columns.filter((_, j) => j !== i))} style={{ color: "var(--fg-subtle)", padding: 4 }}><Icons.X size={12}/></button>
                </div>
              ))}
              <Button size="xs" variant="ghost" icon={<Icons.Plus size={11}/>} onClick={() => setColumns([...columns, ""])} style={{ alignSelf: "flex-start" }}>{T("Kolon Ekle", "Add Column")}</Button>
            </div>
          </Card>

          {/* Task fields */}
          <Card padding={16}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{T("Görev Alanları", "Task Fields")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { key: "storyPoints", label: "Story Points", desc: T("Görev büyüklük tahmini", "Task size estimation") },
                { key: "dueDate", label: T("Bitiş Tarihi", "Due Date"), desc: T("Görev son tarihi", "Task deadline") },
                { key: "priority", label: T("Öncelik", "Priority"), desc: T("Kritik, Yüksek, Orta, Düşük", "Critical, High, Medium, Low") },
                { key: "severity", label: T("Ciddiyet", "Severity"), desc: T("Bug'lar için ciddiyet seviyesi", "Bug severity level") },
                { key: "risk", label: T("Risk", "Risk"), desc: T("Görev risk seviyesi", "Task risk level") },
                { key: "labels", label: T("Etiketler", "Labels"), desc: T("Kategorik etiketler", "Categorical tags") },
                { key: "assignee", label: T("Atanan Kişi", "Assignee"), desc: T("Görev sorumlusu", "Task owner") },
                { key: "estimateHours", label: T("Tahmini Süre", "Estimate Hours"), desc: T("Saat bazlı tahmin", "Hour-based estimate") },
                { key: "attachments", label: T("Ekler", "Attachments"), desc: T("Dosya ekleri", "File attachments") },
              ].map(f => (
                <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{f.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>{f.desc}</div>
                  </div>
                  <Toggle on={fields[f.key]} onChange={(v) => setFields({ ...fields, [f.key]: v })}/>
                </div>
              ))}
            </div>
          </Card>

          {/* Behavior rules */}
          <Card padding={16}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{T("Davranış Kuralları", "Behavior Rules")}</div>
            {[
              { key: "enforceSequential", label: T("Sıralı faz bağımlılığını zorla", "Enforce sequential phase dependency") },
              { key: "enforceWip", label: T("WIP limitlerini zorla", "Enforce WIP limits") },
              { key: "blockExpiredPhase", label: T("Süresi dolan fazlara görev eklemeyi engelle", "Block tasks on expired phases") },
              { key: "phaseAssignment", label: T("Görev-Faz Ataması", "Task-Phase Assignment") },
            ].map(r => (
              <div key={r.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13 }}>{r.label}</span>
                <Toggle on={rules[r.key]} onChange={(v) => setRules({ ...rules, [r.key]: v })}/>
              </div>
            ))}
          </Card>

          {/* Invite members */}
          <Card padding={16}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{T("Üye Davet", "Invite Members")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Input icon={<Icons.Search size={13}/>} placeholder={T("Kullanıcı ara…", "Search users…")} size="sm" style={{ flex: 1 }}/>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {invitedMembers.map(uid => {
                const u = window.SPMSData.getUser(uid);
                return (
                  <div key={uid} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "var(--surface-2)", borderRadius: 99, boxShadow: "inset 0 0 0 1px var(--border)" }}>
                    <Avatar user={u} size={18}/><span style={{ fontSize: 12 }}>{u?.name}</span>
                    <button onClick={() => setInvitedMembers(invitedMembers.filter(x => x !== uid))} style={{ color: "var(--fg-subtle)", padding: 0 }}><Icons.X size={10}/></button>
                  </div>
                );
              })}
              {invitedMembers.length === 0 && <span style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>{T("Henüz üye eklenmedi", "No members added yet")}</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
              {window.SPMSData.USERS.filter(u => !invitedMembers.includes(u.id) && u.id !== leadId).slice(0, 5).map(u => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, fontSize: 12.5 }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <Avatar user={u} size={22}/>
                  <span style={{ flex: 1 }}>{u.name}</span>
                  <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>{u.role}</span>
                  <Button size="xs" variant="ghost" onClick={() => setInvitedMembers([...invitedMembers, u.id])}>{T("Ekle", "Add")}</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Footer buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24, justifyContent: "flex-end" }}>
        {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)}>{T("Geri", "Back")}</Button>}
        <div style={{ flex: 1 }}/>
        {step < 4 ? (
          <Button variant="primary" disabled={!canProceed()} onClick={() => setStep(step + 1)}>{T("Devam", "Continue")}</Button>
        ) : (
          <Button variant="primary" icon={<Icons.Check size={13}/>} onClick={handleCreate}>{T("Projeyi Oluştur", "Create Project")}</Button>
        )}
      </div>
    </div>
  );
};

const TemplateCard = ({ template, selected, onSelect, modeBadge }) => (
  <Card interactive padding={14} onClick={onSelect}
    style={{ boxShadow: selected ? "0 0 0 2px var(--primary), var(--shadow)" : "var(--shadow)", cursor: "pointer" }}>
    <div style={{ fontSize: 14, fontWeight: 600 }}>{template.name}</div>
    <div style={{ marginTop: 6 }}>{modeBadge(template.mode)}</div>
    <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 8, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{template.desc}</div>
  </Card>
);

const wizInputStyle = {
  height: 36, padding: "0 10px", fontSize: 13.5,
  background: "var(--surface-2)", border: 0,
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  fontFamily: "var(--font-sans)",
  width: "100%",
};

const wizSelectStyle = {
  ...wizInputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  paddingRight: 28,
};

Object.assign(window, { CreateProjectPage });
