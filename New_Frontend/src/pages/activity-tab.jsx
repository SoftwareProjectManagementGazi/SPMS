// Activity Tab — timeline of project events (§7)
// variant="full" (project detail) or variant="compact" (dashboard widget)

const ActivityTab = ({ projectId, variant = "full", maxItems = 30 }) => {
  const lang = useApp().language;
  const T = (tr, en) => lang === "tr" ? tr : en;
  const router = useRouter();
  const [filter, setFilter] = React.useState("all");
  const [userFilter, setUserFilter] = React.useState(null);
  const [showCount, setShowCount] = React.useState(maxItems);

  const allEvents = React.useMemo(() => {
    let evts = window.SPMSData.ACTIVITY_EVENTS;
    if (projectId) evts = evts.filter(e => e.projectId === projectId);
    return evts.sort((a, b) => b.time - a.time);
  }, [projectId]);

  const filtered = React.useMemo(() => {
    let evts = allEvents;
    if (filter !== "all") evts = evts.filter(e => e.type === filter);
    if (userFilter) evts = evts.filter(e => e.actor === userFilter);
    return evts.slice(0, showCount);
  }, [allEvents, filter, userFilter, showCount]);

  // Group by date
  const groups = React.useMemo(() => {
    const now = new Date(); now.setHours(0,0,0,0);
    const yesterday = new Date(now.getTime() - 86400000);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const gs = [];
    let cur = null;
    filtered.forEach(e => {
      const d = new Date(e.time); d.setHours(0,0,0,0);
      let label;
      if (d.getTime() === now.getTime()) label = T("Bugün", "Today");
      else if (d.getTime() === yesterday.getTime()) label = T("Dün", "Yesterday");
      else if (d.getTime() > weekAgo.getTime()) label = T("Bu Hafta", "This Week");
      else label = T("Daha Eski", "Older");
      if (cur?.label !== label) { cur = { label, items: [] }; gs.push(cur); }
      cur.items.push(e);
    });
    return gs;
  }, [filtered, lang]);

  const eventMeta = (type) => {
    const map = {
      create: { icon: <Icons.Plus size={9}/>, color: "var(--status-done)", label: T("oluşturdu", "created") },
      status: { icon: <Icons.ArrowRight size={9}/>, color: "var(--status-progress)", label: T("durumunu değiştirdi", "changed status") },
      assign: { icon: <Icons.Users size={9}/>, color: "var(--primary)", label: T("atadı", "assigned") },
      comment: { icon: <Icons.Chat size={9}/>, color: "var(--status-review)", label: T("yorum yaptı", "commented") },
      delete: { icon: <Icons.Trash size={9}/>, color: "var(--priority-critical)", label: T("sildi", "deleted") },
      phase: { icon: <Icons.CircleCheck size={9}/>, color: "var(--status-done)", label: T("faz geçişi yaptı", "changed phase") },
    };
    return map[type] || map.create;
  };

  const relTime = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return T("az önce", "just now");
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${T("dk", "m")}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${T("sa", "h")}`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} ${T("gün", "d")}`;
    return new Date(ts).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric" });
  };

  // Unique actors for avatar filter
  const actors = React.useMemo(() => {
    const ids = [...new Set(allEvents.map(e => e.actor))];
    return ids.map(id => window.SPMSData.getUser(id)).filter(Boolean);
  }, [allEvents]);

  const statusLabel = (s) => {
    const map = { todo: T("Yapılacak","To Do"), progress: T("Devam Ediyor","In Progress"), review: T("İncelemede","In Review"), done: T("Tamamlandı","Done") };
    return map[s] || s;
  };

  if (variant === "compact") {
    return (
      <div>
        {filtered.slice(0, 6).map((e, i) => {
          const actor = window.SPMSData.getUser(e.actor);
          const meta = eventMeta(e.type);
          return (
            <div key={e.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < 5 ? "1px solid var(--border)" : "0" }}>
              <Avatar user={actor} size={22}/>
              <div style={{ flex: 1, fontSize: 12.5 }}>
                <span style={{ fontWeight: 600 }}>{actor?.name.split(" ")[0]}</span>
                <span style={{ color: "var(--fg-muted)" }}> {meta.label} </span>
                {e.taskKey && <span style={{ fontWeight: 500, color: "var(--primary)", cursor: "pointer" }}>{e.taskKey}</span>}
              </div>
              <span className="mono" style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{relTime(e.time)}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <SegmentedControl value={filter} onChange={setFilter} options={[
          { id: "all", label: T("Tümü", "All") },
          { id: "create", label: T("Oluşturma", "Created") },
          { id: "status", label: T("Durum", "Status") },
          { id: "assign", label: T("Atama", "Assign") },
          { id: "comment", label: T("Yorum", "Comment") },
        ]}/>
        <div style={{ height: 20, width: 1, background: "var(--border)" }}/>
        <div style={{ display: "flex", gap: 4 }}>
          {actors.map(u => (
            <button key={u.id} onClick={() => setUserFilter(userFilter === u.id ? null : u.id)} title={u.name}>
              <Avatar user={u} size={24} ring={userFilter === u.id}/>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <span className="mono" style={{ fontSize: 11, color: "var(--fg-muted)" }}>{filtered.length} {T("olay", "events")}</span>
      </div>

      {/* Timeline */}
      <Card padding={0}>
        <div style={{ position: "relative", paddingLeft: 32 }}>
          {/* Vertical line */}
          <div style={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 2, background: "var(--border)" }}/>

          {groups.map((g, gi) => (
            <div key={gi}>
              <div style={{ padding: "14px 16px 8px", fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.5 }}>{g.label}</div>
              {g.items.map((e, i) => {
                const actor = window.SPMSData.getUser(e.actor);
                const meta = eventMeta(e.type);
                return (
                  <div key={e.id} style={{ display: "flex", gap: 12, padding: "12px 16px", position: "relative" }}>
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <Avatar user={actor} size={28}/>
                      <div style={{
                        position: "absolute", bottom: -2, right: -2,
                        width: 16, height: 16, borderRadius: "50%",
                        background: meta.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 0 2px var(--surface)",
                      }}>{meta.icon}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5 }}>
                        <span style={{ fontWeight: 600 }}>{actor?.name}</span>
                        <span style={{ color: "var(--fg-muted)" }}> {meta.label} </span>
                        {e.taskKey && (
                          <span onClick={() => router.go("task-detail", { taskId: e.taskKey })}
                            style={{ fontWeight: 500, cursor: "pointer", color: "var(--primary)" }}>{e.taskKey}</span>
                        )}
                        {e.phaseName && <span style={{ fontWeight: 500, color: "var(--primary)" }}>{e.phaseName}</span>}
                      </div>
                      {e.taskTitle && <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>{e.taskTitle}</div>}
                      {e.type === "status" && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 11.5 }}>
                          <Badge size="xs" tone="neutral">{statusLabel(e.from)}</Badge>
                          <Icons.ArrowRight size={10} style={{ color: "var(--fg-subtle)" }}/>
                          <Badge size="xs" tone={e.to === "done" ? "success" : e.to === "progress" ? "info" : e.to === "review" ? "warning" : "neutral"}>{statusLabel(e.to)}</Badge>
                        </div>
                      )}
                      {e.type === "assign" && e.to && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 11.5 }}>
                          <Icons.ArrowRight size={10} style={{ color: "var(--fg-subtle)" }}/>
                          <Avatar user={window.SPMSData.getUser(e.to)} size={18}/>
                          <span style={{ color: "var(--fg-muted)" }}>{window.SPMSData.getUser(e.to)?.name}</span>
                        </div>
                      )}
                      {e.type === "comment" && e.text && (
                        <div style={{ marginTop: 6, padding: "8px 10px", background: "var(--surface-2)", borderRadius: 6, fontSize: 12.5, color: "var(--fg-muted)", lineHeight: 1.5, boxShadow: "inset 0 0 0 1px var(--border)" }}>
                          {e.text}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 4 }}>{relTime(e.time)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {filtered.length >= showCount && (
            <div style={{ padding: 16, textAlign: "center" }}>
              <Button size="sm" variant="ghost" onClick={() => setShowCount(showCount + 30)}>{T("Daha fazla yükle", "Load more")}</Button>
            </div>
          )}

          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--fg-muted)", fontSize: 13 }}>
              {T("Bu filtreyle eşleşen olay yok.", "No events match this filter.")}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

Object.assign(window, { ActivityTab });
