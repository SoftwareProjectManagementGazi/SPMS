// Task Detail

const TaskDetailPage = () => {
  const router = useRouter();
  const lang = useApp().language;
  const task = window.SPMSData.TASKS.find(t => t.id === router.params.taskId) || window.SPMSData.TASKS[0];
  const project = window.SPMSData.getProject(task.projectId);
  const assignee = window.SPMSData.getUser(task.assigneeId);
  const status = window.SPMSData.STATUSES.find(s => s.id === task.status);
  const reporter = window.SPMSData.USERS[1];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--fg-muted)" }}>
          <Icons.Folder size={13}/><span onClick={() => router.go("project-detail", { projectId: project.id })} style={{ cursor: "pointer" }}>{project.name}</span>
          <Icons.ChevronRight size={11}/>
          <span className="mono">{task.key}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          {task.type === "bug" && <div style={{ width: 26, height: 26, borderRadius: 6, background: "color-mix(in oklch, var(--priority-critical) 15%, transparent)", color: "var(--priority-critical)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.Bug size={14}/></div>}
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, lineHeight: 1.3 }}>{task.title}</div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <Button size="sm" variant="secondary" icon={<Icons.Eye size={13}/>}>{lang === "tr" ? "Takip et" : "Watch"}</Button>
          <Button size="sm" variant="secondary" icon={<Icons.Link size={13}/>}>{lang === "tr" ? "Bağlantı" : "Link"}</Button>
          <Button size="sm" variant="secondary" icon={<Icons.GitBranch size={13}/>}>Branch</Button>
          <div style={{ flex: 1 }}/>
          <Button size="sm" variant="ghost" icon={<Icons.MoreH size={13}/>}/>
        </div>

        <Section title={lang === "tr" ? "Açıklama" : "Description"} style={{ marginTop: 24 }}>
          <Card padding={16}>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--fg)" }}>
              <p style={{ margin: 0 }}>{lang === "tr" ?
                "Bu görev, mobil uygulamada biyometrik girişin prototipini kapsar. Touch ID ve Face ID entegrasyonlarını test edilecek, fallback olarak 6 haneli PIN akışı tasarlanacak." :
                "This task covers the biometric login prototype in the mobile app. Touch ID and Face ID integrations to be tested, with 6-digit PIN flow as fallback."}</p>
              <ul style={{ marginTop: 10, paddingLeft: 20, color: "var(--fg-muted)" }}>
                <li>{lang === "tr" ? "iOS 17+ için LocalAuthentication framework" : "LocalAuthentication framework for iOS 17+"}</li>
                <li>{lang === "tr" ? "Android BiometricPrompt API" : "Android BiometricPrompt API"}</li>
                <li>{lang === "tr" ? "3 başarısız denemeden sonra PIN'e düşüş" : "Fallback to PIN after 3 failed attempts"}</li>
              </ul>
            </div>
          </Card>
        </Section>

        <Section title={lang === "tr" ? "Alt Görevler" : "Sub-tasks"} style={{ marginTop: 20 }} action={<Button size="xs" variant="ghost" icon={<Icons.Plus size={12}/>}>{lang === "tr" ? "Ekle" : "Add"}</Button>}>
          <Card padding={0}>
            {[
              { key: "MOBIL-19", title: "Touch ID için native bridge yazımı", status: "done", assignee: "u4" },
              { key: "MOBIL-20", title: "Face ID hata durumlarını modelle", status: "progress", assignee: "u5" },
              { key: "MOBIL-21", title: "PIN fallback UX akışı", status: "todo", assignee: "u6" },
              { key: "MOBIL-22", title: "Analytics eventleri tanımla", status: "todo", assignee: "u7" },
            ].map((st, i, arr) => {
              const u = window.SPMSData.getUser(st.assignee);
              return (
                <div key={st.key} style={{ display: "grid", gridTemplateColumns: "80px 20px 1fr 90px 22px", padding: "10px 14px", alignItems: "center", gap: 10, borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "0", fontSize: 12.5 }}>
                  <div className="mono" style={{ fontSize: 11, color: "var(--fg-muted)" }}>{st.key}</div>
                  <input type="checkbox" checked={st.status === "done"} readOnly/>
                  <div style={{ textDecoration: st.status === "done" ? "line-through" : "none", color: st.status === "done" ? "var(--fg-muted)" : "var(--fg)" }}>{st.title}</div>
                  <Badge size="xs" tone={st.status === "done" ? "success" : st.status === "progress" ? "info" : "neutral"} dot>{window.SPMSData.STATUSES.find(s => s.id === st.status).name[lang]}</Badge>
                  <Avatar user={u} size={20}/>
                </div>
              );
            })}
          </Card>
        </Section>

        <Section title={lang === "tr" ? "Aktivite" : "Activity"} style={{ marginTop: 20 }}>
          <Card padding={0}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
              {[[lang === "tr" ? "Yorumlar" : "Comments", true], [lang === "tr" ? "Geçmiş" : "History", false], [lang === "tr" ? "Worklog" : "Worklog", false]].map(([l, a]) => (
                <button key={l} style={{ padding: "4px 10px", fontSize: 12, fontWeight: a ? 600 : 500, borderRadius: 4, background: a ? "var(--accent)" : "transparent", color: a ? "var(--accent-fg)" : "var(--fg-muted)" }}>{l}</button>
              ))}
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <Avatar user={window.SPMSData.CURRENT_USER} size={26}/>
                <div style={{ flex: 1, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: 10, boxShadow: "inset 0 0 0 1px var(--border)" }}>
                  <div style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>{lang === "tr" ? "Yorum yaz… @ ile birinden bahset" : "Write a comment… @ to mention"}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
                    <Button size="xs" variant="ghost">{lang === "tr" ? "Vazgeç" : "Cancel"}</Button>
                    <Button size="xs" variant="primary">{lang === "tr" ? "Gönder" : "Send"}</Button>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { user: "u4", time: "1 saat önce", text: lang === "tr" ? "Touch ID tarafını bitirdim. Face ID için cihaz testi yapmam lazım, @Elif elinde iPhone 15 Pro var mı?" : "Finished Touch ID. Need to test Face ID on device — @Elif do you have an iPhone 15 Pro?" },
                  { user: "u5", time: "28 dakika önce", text: lang === "tr" ? "Evet bende var, öğleden sonra bakabiliriz." : "Yes I have one, let's look at it this afternoon." },
                ].map((c, i) => {
                  const u = window.SPMSData.getUser(c.user);
                  return (
                    <div key={i} style={{ display: "flex", gap: 10 }}>
                      <Avatar user={u} size={26}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{u.name}</span>
                          <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{c.time}</span>
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{c.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </Section>
      </div>

      {/* Sidebar */}
      <Card padding={0}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.5, textTransform: "uppercase" }}>{lang === "tr" ? "Özellikler" : "Properties"}</div>
        <div style={{ padding: "8px 0" }}>
          <MetaRow label={lang === "tr" ? "Durum" : "Status"}><Badge tone={task.status === "done" ? "success" : task.status === "progress" ? "info" : task.status === "review" ? "warning" : "neutral"} dot>{status.name[lang]}</Badge></MetaRow>
          <MetaRow label={lang === "tr" ? "Atanan" : "Assignee"}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar user={assignee} size={20}/><span style={{ fontSize: 12.5 }}>{assignee?.name}</span></div></MetaRow>
          <MetaRow label={lang === "tr" ? "Bildiren" : "Reporter"}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar user={reporter} size={20}/><span style={{ fontSize: 12.5 }}>{reporter?.name}</span></div></MetaRow>
          <MetaRow label={lang === "tr" ? "Öncelik" : "Priority"}><PriorityChip level={task.priority} lang={lang}/></MetaRow>
          <MetaRow label={lang === "tr" ? "Puan" : "Points"}><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{task.points}</span></MetaRow>
          <MetaRow label={lang === "tr" ? "Bitiş" : "Due date"}><span style={{ fontSize: 12.5 }}>{new Date(task.due).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</span></MetaRow>
          <MetaRow label="Sprint"><Badge size="xs" tone="info">Sprint 7</Badge></MetaRow>
          <MetaRow label={lang === "tr" ? "Etiketler" : "Labels"}><div style={{ display: "flex", gap: 4 }}><Badge size="xs">auth</Badge><Badge size="xs">mobile</Badge></div></MetaRow>
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{lang === "tr" ? "Bağımlılıklar" : "Dependencies"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "var(--surface-2)", borderRadius: 4, fontSize: 12 }}>
              <Icons.Lock size={12} style={{ color: "var(--fg-subtle)" }}/>
              <span className="mono" style={{ color: "var(--fg-muted)" }}>MOBIL-8</span>
              <span style={{ color: "var(--fg-muted)" }}>engelliyor</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const MetaRow = ({ label, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", padding: "6px 16px", alignItems: "center", gap: 8, fontSize: 12 }}>
    <div style={{ color: "var(--fg-subtle)", fontWeight: 500 }}>{label}</div>
    <div>{children}</div>
  </div>
);

Object.assign(window, { TaskDetailPage });
