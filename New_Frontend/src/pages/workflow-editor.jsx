// Workflow canvas + editor page: n8n/Linear-style, with sequential-locked rules

const WorkflowCanvas = ({ workflow, readOnly = false, activePhase, onNodeClick, onEdgeClick, selected }) => {
  const width = 1200, height = 420;
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];
  const isLocked = workflow.mode === "sequential-locked";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "auto", background: "var(--bg-2)" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, color-mix(in oklch, var(--border-strong) 50%, transparent) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}/>
      <svg width={width} height={height} style={{ position: "relative", display: "block" }}>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--fg-subtle)"/>
          </marker>
          <marker id="arrPrimary" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--primary)"/>
          </marker>
        </defs>
        {edges.map(e => {
          const s = nodes.find(n => n.id === e.source);
          const t = nodes.find(n => n.id === e.target);
          if (!s || !t) return null;
          const sx = s.x + 140, sy = s.y + 30;
          const tx = t.x, ty = t.y + 30;
          const midX = (sx + tx) / 2;
          const d = `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
          const isPrimary = selected?.type === "edge" && selected.id === e.id;
          const strokeDash = e.type === "verification" ? "6 3" : e.type === "feedback" ? "8 4 2 4" : "none";
          const strokeColor = isPrimary ? "var(--primary)" : e.type === "verification" ? "var(--status-progress)" : e.type === "feedback" ? "var(--status-review)" : "var(--fg-subtle)";
          return (
            <g key={e.id} onClick={() => onEdgeClick && onEdgeClick(e)} style={{ cursor: onEdgeClick ? "pointer" : "default" }}>
              <path d={d} fill="none" stroke={strokeColor} strokeWidth={isPrimary ? 2.5 : 1.5} strokeDasharray={strokeDash} markerEnd={`url(#${isPrimary ? "arrPrimary" : "arr"})`}/>
              {e.label && (
                <g transform={`translate(${midX}, ${(sy + ty) / 2 - 10})`}>
                  <rect x={-e.label.length * 3.5 - 6} y={-8} width={e.label.length * 7 + 12} height={16} rx={8} fill="var(--surface)" stroke="var(--border)"/>
                  <text x={0} y={4} textAnchor="middle" fontSize="10" fill="var(--fg-muted)">{e.label}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {/* Swimlane groups */}
      {(workflow.groups || []).map(g => (
        <div key={g.id} style={{
          position: "absolute", left: g.x, top: g.y, width: g.width, height: g.height,
          background: `color-mix(in oklch, var(--${g.color || "primary"}) 6%, transparent)`,
          border: `1.5px dashed color-mix(in oklch, var(--${g.color || "primary"}) 30%, transparent)`,
          borderRadius: 12, zIndex: 0, pointerEvents: "none",
        }}>
          <div style={{ padding: "6px 10px", fontSize: 11, fontWeight: 600, color: `var(--${g.color || "primary"})` }}>{g.name}</div>
        </div>
      ))}
      {nodes.map((n, i) => {
        const isSel = selected?.type === "node" && selected.id === n.id;
        const isActiveIdx = activePhase && ["initiation","planning","execution","monitoring","closure","design","testing"].indexOf(activePhase) === i;
        const isPastLocked = isLocked && activePhase && i < (["initiation","planning","execution","monitoring","closure","design","testing"].indexOf(activePhase) || 0);
        return (
          <div key={n.id}
            onClick={() => onNodeClick && onNodeClick(n)}
            style={{
              position: "absolute", left: n.x, top: n.y,
              width: 140, height: 60,
              background: "var(--surface)",
              borderRadius: 10,
              boxShadow: isSel ? "0 0 0 2px var(--primary), 0 4px 16px oklch(0 0 0 / 0.08)" :
                          isActiveIdx ? "0 0 0 2px var(--primary), 0 4px 16px color-mix(in oklch, var(--primary) 20%, transparent)" :
                          "inset 0 0 0 1px var(--border-strong), 0 1px 3px oklch(0 0 0 / 0.05)",
              padding: "8px 10px",
              cursor: readOnly ? "default" : "pointer",
              transition: "box-shadow 0.15s, transform 0.08s",
              display: "flex", flexDirection: "column", gap: 4,
              opacity: isPastLocked ? 0.55 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: `var(--${n.color || "status-todo"})` }}/>
              <span style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</span>
              {n.isInitial && <Badge size="xs" tone="primary" style={{ marginLeft: "auto", padding: "0 4px", fontSize: 9 }}>•</Badge>}
              {n.isFinal && <Badge size="xs" tone="success" style={{ marginLeft: "auto", padding: "0 4px", fontSize: 9 }}>⬢</Badge>}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--fg-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.description || (n.wipLimit ? `WIP ${n.wipLimit}` : " ")}</div>
            {isPastLocked && <div style={{ position: "absolute", top: 6, right: 6, color: "var(--fg-subtle)" }}><Icons.Lock size={11}/></div>}
            {/* handles */}
            <span style={{ position: "absolute", left: -5, top: 26, width: 10, height: 10, background: "var(--surface)", border: "2px solid var(--border-strong)", borderRadius: "50%" }}/>
            <span style={{ position: "absolute", right: -5, top: 26, width: 10, height: 10, background: "var(--surface)", border: "2px solid var(--border-strong)", borderRadius: "50%" }}/>
          </div>
        );
      })}
    </div>
  );
};

const WorkflowEditorPage = () => {
  const router = useRouter();
  const lang = useApp().language;
  const project = window.SPMSData.getProject(router.params.projectId) || window.SPMSData.PROJECTS[0];
  const [editorMode, setEditorMode] = useState("lifecycle");
  const [wf, setWf] = useState(() => JSON.parse(JSON.stringify(window.SPMSData.DEFAULT_LIFECYCLES[project.methodology])));
  const [statusWf, setStatusWf] = useState(() => JSON.parse(JSON.stringify(window.SPMSData.DEFAULT_STATUS_FLOWS[project.methodology])));
  const current = editorMode === "lifecycle" ? wf : statusWf;
  const setCurrent = editorMode === "lifecycle" ? setWf : setStatusWf;
  const [selected, setSelected] = useState(null);
  const [dirty, setDirty] = useState(false);

  const setMode = (mode) => {
    setCurrent({ ...current, mode });
    setDirty(true);
  };

  const tmpls = editorMode === "lifecycle" ? window.SPMSData.DEFAULT_LIFECYCLES : window.SPMSData.DEFAULT_STATUS_FLOWS;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.4 }}>{lang === "tr" ? "İş Akışı Tasarımcısı" : "Workflow Designer"}</div>
          <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginTop: 2 }}>{project.name} · {project.key}</div>
        </div>
        <div style={{ flex: 1 }}/>
        {dirty && <Badge tone="warning" dot>{lang === "tr" ? "Kaydedilmemiş" : "Unsaved"}</Badge>}
        <Button size="sm" variant="ghost" onClick={() => router.go("project-detail", { projectId: project.id })}>{lang === "tr" ? "Geri dön" : "Back"}</Button>
        <Button size="sm" variant="secondary" icon={<Icons.Copy size={13}/>}>{lang === "tr" ? "Çoğalt" : "Duplicate"}</Button>
        <Button size="sm" variant="primary" icon={<Icons.Check size={13}/>} onClick={() => setDirty(false)}>{lang === "tr" ? "Kaydet" : "Save"}</Button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, marginBottom: 10 }}>
        <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 3, borderRadius: 8, boxShadow: "inset 0 0 0 1px var(--border)" }}>
          <button onClick={() => { setEditorMode("lifecycle"); setSelected(null); }} style={{ padding: "6px 14px", fontSize: 12.5, fontWeight: 600, borderRadius: 5, background: editorMode === "lifecycle" ? "var(--surface)" : "transparent", color: editorMode === "lifecycle" ? "var(--fg)" : "var(--fg-muted)", boxShadow: editorMode === "lifecycle" ? "inset 0 0 0 1px var(--border), 0 1px 0 var(--bg-2)" : "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icons.Flow size={13}/>{lang === "tr" ? "Yaşam Döngüsü" : "Lifecycle"}
          </button>
          <button onClick={() => { setEditorMode("status"); setSelected(null); }} style={{ padding: "6px 14px", fontSize: 12.5, fontWeight: 600, borderRadius: 5, background: editorMode === "status" ? "var(--surface)" : "transparent", color: editorMode === "status" ? "var(--fg)" : "var(--fg-muted)", boxShadow: editorMode === "status" ? "inset 0 0 0 1px var(--border), 0 1px 0 var(--bg-2)" : "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icons.Workflow size={13}/>{lang === "tr" ? "Görev Durumları" : "Task Statuses"}
          </button>
        </div>

        <div style={{ height: 24, width: 1, background: "var(--border)" }}/>
        <span style={{ fontSize: 11.5, color: "var(--fg-muted)", fontWeight: 500 }}>{lang === "tr" ? "Şablon" : "Template"}:</span>
        <Button size="xs" variant="ghost" iconRight={<Icons.ChevronDown size={11}/>}>{project.methodology}</Button>

        <div style={{ flex: 1 }}/>
        <Button size="xs" variant="ghost" icon={<Icons.ChevronLeft size={12}/>}>Undo</Button>
        <Button size="xs" variant="ghost" icon={<Icons.ChevronRight size={12}/>}>Redo</Button>
        <div style={{ height: 20, width: 1, background: "var(--border)" }}/>
        <Button size="xs" variant="ghost">—</Button>
        <span className="mono" style={{ fontSize: 11, color: "var(--fg-muted)", minWidth: 40, textAlign: "center" }}>100%</span>
        <Button size="xs" variant="ghost">+</Button>
        <Button size="xs" variant="ghost" icon={<Icons.Maximize size={12}/>}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 0, flex: 1, minHeight: 0, borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "inset 0 0 0 1px var(--border)" }}>
        <div style={{ position: "relative", minHeight: 0, overflow: "hidden" }}>
          <WorkflowCanvas workflow={current}
            onNodeClick={(n) => setSelected({ type: "node", id: n.id })}
            onEdgeClick={(e) => setSelected({ type: "edge", id: e.id })}
            selected={selected}/>
          {/* Bottom floating toolbar */}
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4, background: "var(--surface)", padding: 5, borderRadius: 10, boxShadow: "var(--shadow-lg)" }}>
            <Button size="sm" variant="ghost" icon={<Icons.Plus size={13}/>}>{lang === "tr" ? "Düğüm" : "Node"}</Button>
            <Button size="sm" variant="ghost" icon={<Icons.Flow size={13}/>}>{lang === "tr" ? "Bağlantı" : "Edge"}</Button>
            <Button size="sm" variant="ghost" icon={<Icons.Grid size={13}/>}>{lang === "tr" ? "Grup" : "Group"}</Button>
            <div style={{ width: 1, background: "var(--border)", margin: "0 2px" }}/>
            <Button size="sm" variant="ghost" icon={<Icons.Sparkle size={13}/>}>{lang === "tr" ? "AI öner" : "AI suggest"}</Button>
          </div>
          {/* Mode banner */}
          {current.mode === "sequential-locked" && (
            <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "color-mix(in oklch, var(--priority-critical) 8%, var(--surface))", borderRadius: 6, fontSize: 11.5, fontWeight: 500, color: "var(--priority-critical)", boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--priority-critical) 25%, transparent)" }}>
              <Icons.Lock size={12}/>{lang === "tr" ? "Sıralı kilitli: Fazlar tek yönde, geri dönüş yok." : "Sequential locked: phases one-way, no reversal."}
            </div>
          )}
          {/* Minimap */}
          <div style={{ position: "absolute", bottom: 16, right: 16, width: 180, height: 100, background: "var(--surface)", borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)", padding: 6 }}>
            <div style={{ fontSize: 9, color: "var(--fg-subtle)", letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>Minimap</div>
            <svg viewBox="0 0 1200 300" style={{ width: "100%", height: "calc(100% - 14px)" }}>
              {current.nodes.map(n => <rect key={n.id} x={n.x} y={n.y - 80} width={140} height={60} fill={`var(--${n.color || "status-todo"})`} opacity={0.5} rx={6}/>)}
            </svg>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 }}>{lang === "tr" ? "Akış Kuralları" : "Flow Rules"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "flexible", icon: <Icons.Unlock size={13}/>, label: lang === "tr" ? "Esnek" : "Flexible", desc: lang === "tr" ? "Her düğüm arası geçiş tanımlanabilir" : "Define any transitions" },
                { id: "sequential-locked", icon: <Icons.Lock size={13}/>, label: lang === "tr" ? "Sıralı · Kilitli" : "Sequential · Locked", desc: lang === "tr" ? "Waterfall: bir faz bitmeden öbürüne geçilemez, geri dönüş yok" : "Waterfall: no skipping, no backward" },
                { id: "sequential-flexible", icon: <Icons.Lock size={13}/>, label: lang === "tr" ? "Sıralı · Esnek Geri Dönüş" : "Sequential · Flex Return", desc: lang === "tr" ? "Sıralı ilerle, tanımlı geri dönüşlere izin ver. V-Model ve Modified Waterfall için." : "Sequential flow, defined returns allowed. For V-Model and Modified Waterfall." },
                { id: "continuous", icon: <Icons.Flow size={13}/>, label: lang === "tr" ? "Sürekli Akış" : "Continuous", desc: lang === "tr" ? "Kanban: tek aktif faz" : "Kanban: single active phase" },
              ].map(opt => {
                const active = current.mode === opt.id;
                return (
                  <button key={opt.id} onClick={() => setMode(opt.id)}
                    style={{ textAlign: "left", padding: 10, borderRadius: "var(--radius-sm)", display: "flex", gap: 10, alignItems: "flex-start",
                      background: active ? "var(--accent)" : "var(--surface-2)",
                      boxShadow: active ? "inset 0 0 0 1.5px var(--primary)" : "inset 0 0 0 1px var(--border)" }}>
                    <span style={{ color: active ? "var(--primary)" : "var(--fg-muted)", marginTop: 1 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2, lineHeight: 1.4 }}>{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 }}>{lang === "tr" ? "Seçim" : "Selection"}</div>
            {selected ? (
              selected.type === "node" ? (() => {
                const n = current.nodes.find(n => n.id === selected.id);
                if (!n) return null;
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Field label={lang === "tr" ? "Ad" : "Name"} value={n.name}/>
                    <Field label={lang === "tr" ? "Açıklama" : "Description"} value={n.description || ""} multi/>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <Field label={lang === "tr" ? "Renk" : "Color"} value={n.color || "status-todo"}/>
                      <Field label="WIP" value={n.wipLimit || "—"}/>
                    </div>
                    {editorMode === "status" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><input type="checkbox" checked={!!n.isInitial} readOnly/>{lang === "tr" ? "Başlangıç" : "Initial"}</label>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><input type="checkbox" checked={!!n.isFinal} readOnly/>{lang === "tr" ? "Bitiş" : "Final"}</label>
                      </div>
                    )}
                    <Button size="xs" variant="ghost" icon={<Icons.Trash size={12}/>} style={{ alignSelf: "flex-start", color: "var(--priority-critical)" }}>{lang === "tr" ? "Sil" : "Delete"}</Button>
                  </div>
                );
              })() : (() => {
                const e = current.edges.find(e => e.id === selected.id);
                if (!e) return null;
                const s = current.nodes.find(n => n.id === e.source);
                const t = current.nodes.find(n => n.id === e.target);
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 12.5, padding: 10, background: "var(--surface-2)", borderRadius: 6 }}>
                      <div style={{ fontWeight: 600 }}>{s?.name}</div>
                      <div style={{ color: "var(--fg-muted)", margin: "4px 0", display: "inline-flex", alignItems: "center", gap: 4 }}><Icons.ArrowRight size={12}/> {t?.name}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 2 }}>{lang === "tr" ? "Bağlantı Tipi" : "Edge Type"}</div>
                    <SegmentedControl value={e.type || "flow"} onChange={() => { setDirty(true); }} options={[
                      { id: "flow", label: lang === "tr" ? "Akış" : "Flow" },
                      { id: "verification", label: lang === "tr" ? "Doğrulama" : "Verify" },
                      { id: "feedback", label: lang === "tr" ? "Geri Bildirim" : "Feedback" },
                    ]}/>
                    <Field label={lang === "tr" ? "Etiket" : "Label"} value={e.label || ""}/>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><input type="checkbox" checked={!!e.bidirectional} readOnly/>{lang === "tr" ? "Çift yönlü" : "Bidirectional"}</label>
                    <Button size="xs" variant="ghost" icon={<Icons.Trash size={12}/>} style={{ color: "var(--priority-critical)", alignSelf: "flex-start" }}>{lang === "tr" ? "Bağlantıyı sil" : "Delete edge"}</Button>
                  </div>
                );
              })()
            ) : <div style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{lang === "tr" ? "Bir düğüm veya bağlantı seçin." : "Select a node or edge."}</div>}
          </div>

          <div style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 }}>{lang === "tr" ? "Doğrulama" : "Validation"}</div>
            <ValidationItem ok label={lang === "tr" ? "Başlangıç düğümü mevcut" : "Initial node exists"}/>
            <ValidationItem ok label={lang === "tr" ? "Bitiş düğümü mevcut" : "Final node exists"}/>
            <ValidationItem ok label={lang === "tr" ? "Ulaşılabilirlik kontrolü geçti" : "Reachability OK"}/>
            <ValidationItem warning label={lang === "tr" ? "2 düğümün atanmış görevi var" : "2 nodes have tasks"}/>
          </div>

          <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 }}>{lang === "tr" ? "Kısayollar" : "Shortcuts"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11.5 }}>
              {[
                [lang === "tr" ? "Kaydet" : "Save", "⌘S"],
                [lang === "tr" ? "Yeni düğüm" : "Add node", "N"],
                [lang === "tr" ? "Geri al" : "Undo", "⌘Z"],
                [lang === "tr" ? "Sil" : "Delete", "⌫"],
                [lang === "tr" ? "Tam ekran" : "Fit view", "F"],
              ].map(([l, k]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", color: "var(--fg-muted)" }}>
                  <span>{l}</span><Kbd>{k}</Kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, multi }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</span>
    {multi ? (
      <textarea defaultValue={value} rows={2} style={{ resize: "vertical", padding: "6px 8px", fontSize: 12.5, background: "var(--surface-2)", border: "0", borderRadius: 5, boxShadow: "inset 0 0 0 1px var(--border)", fontFamily: "inherit" }}/>
    ) : (
      <input defaultValue={value} style={{ padding: "6px 8px", fontSize: 12.5, background: "var(--surface-2)", border: 0, borderRadius: 5, boxShadow: "inset 0 0 0 1px var(--border)" }}/>
    )}
  </label>
);

const ValidationItem = ({ ok, warning, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "4px 0" }}>
    <span style={{ color: ok ? "var(--status-done)" : warning ? "var(--status-review)" : "var(--priority-critical)" }}>
      {ok ? <Icons.CircleCheck size={13}/> : <Icons.Alert size={13}/>}
    </span>
    <span style={{ color: "var(--fg-muted)" }}>{label}</span>
  </div>
);

Object.assign(window, { WorkflowCanvas, WorkflowEditorPage });
