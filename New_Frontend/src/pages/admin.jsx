// Admin: Overview, Users, Roles, Permissions, Projects, Audit, Stats

const AdminPage = () => {
  const router = useRouter();
  const lang = useApp().language;
  const sub = router.page === "admin" ? "overview" : router.page.slice(6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icons.Shield size={18} style={{ color: "var(--primary)" }}/>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6 }}>{lang === "tr" ? "Yönetim Konsolu" : "Admin Console"}</div>
          </div>
          <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 4 }}>{lang === "tr" ? "Organizasyon genelinde izinler, kullanıcılar ve şablonlar" : "Org-wide permissions, users & templates"}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Button size="sm" variant="secondary" icon={<Icons.Download size={13}/>}>{lang === "tr" ? "Rapor al" : "Export"}</Button>
          <Button size="sm" variant="secondary" icon={<Icons.Audit size={13}/>}>{lang === "tr" ? "Denetim günlüğü" : "Audit log"}</Button>
        </div>
      </div>

      <Tabs active={sub} onChange={(s) => router.go(s === "overview" ? "admin" : `admin-${s}`)} tabs={[
        { id: "overview", label: lang === "tr" ? "Genel" : "Overview", icon: <Icons.Dashboard size={13}/> },
        { id: "users", label: lang === "tr" ? "Kullanıcılar" : "Users", icon: <Icons.Users size={13}/>, badge: window.SPMSData.USERS.length },
        { id: "roles", label: lang === "tr" ? "Roller" : "Roles", icon: <Icons.Shield size={13}/> },
        { id: "permissions", label: lang === "tr" ? "İzin Matrisi" : "Permissions", icon: <Icons.Lock size={13}/> },
        { id: "projects", label: lang === "tr" ? "Projeler" : "Projects", icon: <Icons.Folder size={13}/>, badge: window.SPMSData.PROJECTS.length },
        { id: "workflows", label: lang === "tr" ? "Şablonlar" : "Templates", icon: <Icons.Workflow size={13}/> },
        { id: "audit", label: "Audit", icon: <Icons.Audit size={13}/> },
        { id: "stats", label: lang === "tr" ? "İstatistik" : "Stats", icon: <Icons.Chart size={13}/> },
      ]}/>

      <div style={{ flex: 1, minHeight: 0 }}>
        {sub === "overview" && <AdminOverview lang={lang}/>}
        {sub === "users" && <AdminUsers lang={lang}/>}
        {sub === "roles" && <AdminRoles lang={lang}/>}
        {sub === "permissions" && <AdminPermissions lang={lang}/>}
        {sub === "projects" && <AdminProjects lang={lang}/>}
        {sub === "workflows" && <AdminWorkflows lang={lang}/>}
        {sub === "audit" && <AdminAudit lang={lang}/>}
        {sub === "stats" && <AdminStats lang={lang}/>}
      </div>
    </div>
  );
};

const AdminOverview = ({ lang }) => {
  const users = window.SPMSData.USERS;
  const projects = window.SPMSData.PROJECTS;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        <StatCard label={lang === "tr" ? "Kullanıcı" : "Users"} value={users.length} delta={`+3 ${lang === "tr" ? "bu ay" : "this mo."}`} tone="primary" icon={<Icons.Users/>}/>
        <StatCard label={lang === "tr" ? "Aktif Proje" : "Active projects"} value={projects.length} delta="+2" tone="info" icon={<Icons.Folder/>}/>
        <StatCard label={lang === "tr" ? "Onay Bekleyen" : "Pending"} value={window.SPMSData.PENDING_REQUESTS.length} delta={lang === "tr" ? "bugün" : "today"} tone="warning" icon={<Icons.Clock/>}/>
        <StatCard label={lang === "tr" ? "Şablon" : "Templates"} value={6} delta={lang === "tr" ? "3 özel" : "3 custom"} tone="neutral" icon={<Icons.Workflow/>}/>
        <StatCard label={lang === "tr" ? "Depolama" : "Storage"} value="12.4 GB" delta={`62% ${lang === "tr" ? "dolu" : "used"}`} tone="neutral" icon={<Icons.Chart/>}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        <Card padding={0}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === "tr" ? "Bekleyen Proje Katılım İstekleri" : "Pending Project Join Requests"}</div>
            <div style={{ flex: 1 }}/>
            <Button size="xs" variant="ghost">{lang === "tr" ? "Tümünü gör" : "View all"}</Button>
          </div>
          {window.SPMSData.PENDING_REQUESTS.map((r, i, arr) => {
            const pm = window.SPMSData.getUser(r.pm);
            const usr = window.SPMSData.getUser(r.user);
            const proj = window.SPMSData.getProject(r.project);
            return (
              <div key={r.id} style={{ padding: "14px 16px", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "0", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar user={pm} size={26}/>
                  <Icons.ArrowRight size={13} style={{ color: "var(--fg-subtle)" }}/>
                  <Avatar user={usr} size={26}/>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5 }}>
                    <span style={{ fontWeight: 600 }}>{pm?.name.split(" ")[0]}</span>
                    <span style={{ color: "var(--fg-muted)" }}> {lang === "tr" ? " — " : " requested "} </span>
                    <span style={{ fontWeight: 600 }}>{usr?.name.split(" ")[0]}</span>
                    <span style={{ color: "var(--fg-muted)" }}>{lang === "tr" ? " kullanıcısını " : " to join "}</span>
                    <span style={{ fontWeight: 600 }}>{proj?.name}</span>
                    <span style={{ color: "var(--fg-muted)" }}>{lang === "tr" ? " projesine eklemek istiyor" : ""}</span>
                  </div>
                  {r.note && <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 4, padding: 6, background: "var(--surface-2)", borderRadius: 4, fontStyle: "italic" }}>"{r.note}"</div>}
                  <div style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 4 }}>{r.time}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Button size="sm" variant="primary" icon={<Icons.Check size={12}/>}>{lang === "tr" ? "Onayla" : "Approve"}</Button>
                  <Button size="sm" variant="ghost">{lang === "tr" ? "Reddet" : "Reject"}</Button>
                </div>
              </div>
            );
          })}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding={16}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{lang === "tr" ? "Rol Dağılımı" : "Role distribution"}</div>
            {[
              { role: "Admin", count: 1, color: "var(--priority-critical)" },
              { role: "Project Manager", count: 2, color: "var(--status-progress)" },
              { role: "Member", count: 7, color: "var(--fg-muted)" },
            ].map(r => (
              <div key={r.role} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 12.5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color }}/>
                <span style={{ flex: 1 }}>{r.role}</span>
                <span className="mono" style={{ color: "var(--fg-muted)" }}>{r.count}</span>
                <div style={{ width: 60, height: 4, background: "var(--surface-2)", borderRadius: 2 }}>
                  <div style={{ width: `${r.count / 10 * 100}%`, height: "100%", background: r.color, borderRadius: 2 }}/>
                </div>
              </div>
            ))}
          </Card>

          <Card padding={16}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{lang === "tr" ? "Son Yönetim Olayları" : "Recent admin events"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
              {[
                { who: "Ayşe Demir", what: lang === "tr" ? "'Can Aksoy' kullanıcısına PM rolü verdi" : "granted PM role to Can Aksoy", time: "12 dk" },
                { who: "Ayşe Demir", what: lang === "tr" ? "'Mobil Bankacılık' projesini onayladı" : "approved project Mobile Banking", time: "1 sa" },
                { who: "Mert Yılmaz", what: lang === "tr" ? "Waterfall şablonunu düzenledi" : "edited Waterfall template", time: "3 sa" },
                { who: "Ayşe Demir", what: lang === "tr" ? "SSO ayarlarını güncelledi" : "updated SSO settings", time: "Dün" },
              ].map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", marginTop: 6, flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{e.who}</span>
                    <span style={{ color: "var(--fg-muted)" }}> {e.what}</span>
                  </div>
                  <span style={{ color: "var(--fg-subtle)", fontSize: 11 }} className="mono">{e.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AdminUsers = ({ lang }) => {
  const [filter, setFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const users = window.SPMSData.USERS.filter(u =>
    u.name.toLowerCase().includes(filter.toLowerCase()) &&
    (roleFilter === "all" || u.role === roleFilter)
  );

  return (
    <Card padding={0}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <Input icon={<Icons.Search size={13}/>} placeholder={lang === "tr" ? "Kullanıcı ara…" : "Search users…"} value={filter} onChange={(e) => setFilter(e.target.value)} size="sm" style={{ width: 240 }}/>
        <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
          {["all", "Admin", "Project Manager", "Member"].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{ padding: "4px 10px", fontSize: 11.5, fontWeight: 600, borderRadius: 4, background: roleFilter === r ? "var(--surface)" : "transparent", color: roleFilter === r ? "var(--fg)" : "var(--fg-muted)" }}>
              {r === "all" ? (lang === "tr" ? "Tümü" : "All") : r}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <Button size="sm" variant="secondary" icon={<Icons.Download size={13}/>}>CSV</Button>
        <Button size="sm" variant="secondary" icon={<Icons.Mail size={13}/>}>{lang === "tr" ? "Toplu davet" : "Bulk invite"}</Button>
        <Button size="sm" variant="primary" icon={<Icons.Plus size={13}/>}>{lang === "tr" ? "Kullanıcı ekle" : "Add user"}</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "28px 40px 2fr 2fr 130px 1fr 100px 90px 28px", padding: "10px 16px", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--fg-subtle)", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>
        <input type="checkbox"/><div/><div>{lang === "tr" ? "Ad Soyad" : "Name"}</div><div>Email</div><div>{lang === "tr" ? "Rol" : "Role"}</div><div>{lang === "tr" ? "Projeler" : "Projects"}</div><div>{lang === "tr" ? "Son Giriş" : "Last Seen"}</div><div>{lang === "tr" ? "Durum" : "Status"}</div><div/>
      </div>
      {users.map((u, i) => {
        const userProjects = window.SPMSData.PROJECTS.filter(p => p.memberIds.includes(u.id) || p.leadId === u.id);
        return (
          <div key={u.id} style={{ display: "grid", gridTemplateColumns: "28px 40px 2fr 2fr 130px 1fr 100px 90px 28px", padding: "10px 16px", alignItems: "center", gap: 8, borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "0", fontSize: 12.5, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <input type="checkbox" onClick={(e) => e.stopPropagation()}/>
            <Avatar user={u} size={28}/>
            <div style={{ fontWeight: 600 }}>{u.name}</div>
            <div style={{ color: "var(--fg-muted)" }}>{u.email}</div>
            <div><Badge size="xs" tone={u.role === "Admin" ? "danger" : u.role === "Project Manager" ? "info" : "neutral"}>{u.role}</Badge></div>
            <div><AvatarStack users={userProjects.map(p => ({ ...p, initials: p.key.slice(0,2), avColor: (p.id.charCodeAt(1) % 8) + 1 }))} max={4} size={20}/></div>
            <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{i === 0 ? (lang === "tr" ? "Şimdi" : "Now") : i < 3 ? `${i * 23} dk` : `${i} ${lang === "tr" ? "sa" : "h"}`}</div>
            <div><Badge size="xs" tone="success" dot>{lang === "tr" ? "Aktif" : "Active"}</Badge></div>
            <button style={{ color: "var(--fg-subtle)" }}><Icons.MoreH size={14}/></button>
          </div>
        );
      })}
      <div style={{ padding: "10px 16px", fontSize: 11.5, color: "var(--fg-muted)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
        <div>{users.length} {lang === "tr" ? "kullanıcı" : "users"}</div>
        <div style={{ display: "flex", gap: 4 }}>
          <Button size="xs" variant="ghost" icon={<Icons.ChevronLeft size={12}/>}/>
          <span style={{ padding: "0 10px", display: "inline-flex", alignItems: "center" }}>1 / 1</span>
          <Button size="xs" variant="ghost" icon={<Icons.ChevronRight size={12}/>}/>
        </div>
      </div>
    </Card>
  );
};

const AdminRoles = ({ lang }) => {
  const roles = [
    { id: "admin", name: "Admin", count: 1, desc: lang === "tr" ? "Tüm sistem erişimi, fatura ve güvenlik ayarları." : "Full system access incl. billing and security.", color: "var(--priority-critical)", perms: 28 },
    { id: "pm", name: "Project Manager", count: 2, desc: lang === "tr" ? "Proje oluşturma, üye davet etme, iş akışı düzenleme." : "Create projects, invite, edit workflow.", color: "var(--status-progress)", perms: 18 },
    { id: "member", name: "Member", count: 7, desc: lang === "tr" ? "Atandığı projelerde görev yönetimi." : "Task mgmt on assigned projects.", color: "var(--fg-muted)", perms: 8 },
    { id: "guest", name: "Guest", count: 0, desc: lang === "tr" ? "Yalnızca salt okuma erişimi." : "Read-only guest access.", color: "var(--fg-subtle)", perms: 2, custom: true },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
      {roles.map(r => (
        <Card key={r.id} padding={18}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `color-mix(in oklch, ${r.color} 18%, transparent)`, color: r.color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.Shield size={16}/></div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{r.name}</div>
                {r.custom && <Badge size="xs" tone="primary">{lang === "tr" ? "Özel" : "Custom"}</Badge>}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginTop: 4, lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 14, padding: "10px 0 0 0", borderTop: "1px solid var(--border)", fontSize: 12 }}>
            <div><span style={{ color: "var(--fg-subtle)" }}>{lang === "tr" ? "Kullanıcı" : "Users"}:</span> <b className="mono">{r.count}</b></div>
            <div><span style={{ color: "var(--fg-subtle)" }}>{lang === "tr" ? "İzin" : "Permissions"}:</span> <b className="mono">{r.perms}</b></div>
            <div style={{ flex: 1 }}/>
            <Button size="xs" variant="ghost">{lang === "tr" ? "Düzenle" : "Edit"}</Button>
          </div>
        </Card>
      ))}
      <Card padding={18} style={{ borderStyle: "dashed", background: "var(--surface-2)", boxShadow: "inset 0 0 0 1.5px var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 130, cursor: "pointer" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "var(--fg-muted)" }}>
          <Icons.Plus size={18}/>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === "tr" ? "Yeni rol oluştur" : "Create new role"}</div>
          <div style={{ fontSize: 11.5 }}>{lang === "tr" ? "Özelleştirilmiş izin seti" : "Custom permission set"}</div>
        </div>
      </Card>
    </div>
  );
};

const AdminPermissions = ({ lang }) => {
  const perms = [
    { group: lang === "tr" ? "Projeler" : "Projects", items: [
      { id: "p.create", label: lang === "tr" ? "Proje oluştur" : "Create project" },
      { id: "p.edit", label: lang === "tr" ? "Proje düzenle" : "Edit project" },
      { id: "p.delete", label: lang === "tr" ? "Proje sil" : "Delete project" },
      { id: "p.archive", label: lang === "tr" ? "Arşivle" : "Archive" },
    ]},
    { group: lang === "tr" ? "Görevler" : "Tasks", items: [
      { id: "t.create", label: lang === "tr" ? "Görev oluştur" : "Create task" },
      { id: "t.assign", label: lang === "tr" ? "Atama değiştir" : "Change assignee" },
      { id: "t.status", label: lang === "tr" ? "Durum değiştir" : "Change status" },
      { id: "t.delete", label: lang === "tr" ? "Görev sil" : "Delete task" },
    ]},
    { group: lang === "tr" ? "Üyeler & Roller" : "Members & Roles", items: [
      { id: "u.invite", label: lang === "tr" ? "Kullanıcı davet et" : "Invite user" },
      { id: "u.role", label: lang === "tr" ? "Rol ata" : "Assign role" },
      { id: "u.remove", label: lang === "tr" ? "Üye çıkar" : "Remove member" },
    ]},
    { group: lang === "tr" ? "İş Akışı" : "Workflow", items: [
      { id: "w.edit", label: lang === "tr" ? "İş akışı düzenle" : "Edit workflow" },
      { id: "w.lifecycle", label: lang === "tr" ? "Yaşam döngüsü düzenle" : "Edit lifecycle" },
      { id: "w.templates", label: lang === "tr" ? "Şablon yayınla" : "Publish template" },
    ]},
  ];
  const roles = ["Admin", "PM", "Member", "Guest"];
  // Matrix: Admin all, PM most, Member some, Guest few
  const matrix = {
    "p.create": [1,1,0,0], "p.edit": [1,1,0,0], "p.delete": [1,0,0,0], "p.archive": [1,1,0,0],
    "t.create": [1,1,1,0], "t.assign": [1,1,1,0], "t.status": [1,1,1,0], "t.delete": [1,1,0,0],
    "u.invite": [1,1,0,0], "u.role": [1,0,0,0], "u.remove": [1,1,0,0],
    "w.edit": [1,1,0,0], "w.lifecycle": [1,1,0,0], "w.templates": [1,0,0,0],
  };

  return (
    <Card padding={0}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === "tr" ? "İzin Matrisi" : "Permission Matrix"}</div>
        <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>{lang === "tr" ? "Rol başına tüm izinler tek bakışta" : "All permissions by role at a glance"}</div>
        <div style={{ flex: 1 }}/>
        <Button size="xs" variant="secondary" icon={<Icons.Copy size={12}/>}>{lang === "tr" ? "Kopyala" : "Clone"}</Button>
      </div>
      <div style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(4, 100px)", padding: "10px 16px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", fontSize: 11.5, fontWeight: 600, color: "var(--fg-muted)", position: "sticky", top: 0, zIndex: 2 }}>
          <div>{lang === "tr" ? "İzin" : "Permission"}</div>
          {roles.map(r => <div key={r} style={{ textAlign: "center" }}>{r}</div>)}
        </div>
        {perms.map(g => (
          <React.Fragment key={g.group}>
            <div style={{ padding: "10px 16px", background: "var(--bg-2)", fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: 0.5, textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{g.group}</div>
            {g.items.map((it, i) => (
              <div key={it.id} style={{ display: "grid", gridTemplateColumns: "2fr repeat(4, 100px)", padding: "10px 16px", borderBottom: "1px solid var(--border)", alignItems: "center", fontSize: 12.5 }}>
                <div>{it.label}</div>
                {roles.map((r, ri) => {
                  const v = (matrix[it.id] || [0,0,0,0])[ri];
                  return (
                    <div key={r} style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ width: 26, height: 18, borderRadius: 10, background: v ? "var(--primary)" : "var(--surface-2)", boxShadow: v ? "none" : "inset 0 0 0 1px var(--border)", position: "relative", cursor: "pointer", transition: "background 0.1s" }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: v ? 10 : 2, transition: "left 0.12s", boxShadow: "0 1px 2px oklch(0 0 0 / 0.15)" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
};

const AdminProjects = ({ lang }) => {
  const projects = window.SPMSData.PROJECTS;
  return (
    <Card padding={0}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <Input icon={<Icons.Search size={13}/>} placeholder={lang === "tr" ? "Proje ara…" : "Search…"} size="sm" style={{ width: 220 }}/>
        <div style={{ flex: 1 }}/>
        <Button size="sm" variant="secondary" icon={<Icons.Download size={13}/>}>{lang === "tr" ? "Dışa aktar" : "Export"}</Button>
        <Button size="sm" variant="primary" icon={<Icons.Plus size={13}/>}>{lang === "tr" ? "Yeni proje" : "New project"}</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "60px 2fr 110px 150px 120px 90px 90px 28px", padding: "10px 16px", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--fg-subtle)", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>
        <div>Key</div><div>{lang === "tr" ? "İsim" : "Name"}</div><div>{lang === "tr" ? "Yöntem" : "Method"}</div><div>{lang === "tr" ? "Yönetici" : "Lead"}</div><div>{lang === "tr" ? "Görevler" : "Tasks"}</div><div>{lang === "tr" ? "İlerleme" : "Progress"}</div><div>{lang === "tr" ? "Oluşturma" : "Created"}</div><div/>
      </div>
      {projects.map((p, i) => {
        const lead = window.SPMSData.getUser(p.leadId);
        const ts = window.SPMSData.TASKS.filter(t => t.projectId === p.id);
        return (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "60px 2fr 110px 150px 120px 90px 90px 28px", padding: "10px 16px", alignItems: "center", gap: 8, borderBottom: i < projects.length - 1 ? "1px solid var(--border)" : "0", fontSize: 12.5 }}>
            <div className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: "var(--fg-muted)", background: "var(--surface-2)", padding: "2px 5px", borderRadius: 4, display: "inline-block", width: "fit-content" }}>{p.key}</div>
            <div style={{ fontWeight: 500 }}>{p.name}</div>
            <div><Badge size="xs" tone={p.methodology === "scrum" ? "info" : p.methodology === "kanban" ? "primary" : "warning"}>{p.methodology}</Badge></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar user={lead} size={20}/><span style={{ fontSize: 12, color: "var(--fg-muted)" }}>{lead?.name.split(" ")[0]}</span></div>
            <div className="mono" style={{ fontSize: 11, color: "var(--fg-muted)" }}>{ts.length} · {ts.filter(t => t.status === "done").length} {lang === "tr" ? "bitti" : "done"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ flex: 1, height: 4, background: "var(--surface-2)", borderRadius: 2 }}>
                <div style={{ width: `${Math.round(p.progress * 100)}%`, height: "100%", background: "var(--primary)", borderRadius: 2 }}/>
              </div>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-muted)" }}>{Math.round(p.progress * 100)}%</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{new Date(p.start).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric" })}</div>
            <button style={{ color: "var(--fg-subtle)" }}><Icons.MoreH size={14}/></button>
          </div>
        );
      })}
    </Card>
  );
};

const AdminWorkflows = ({ lang }) => {
  const templates = [
    { id: "tpl-scrum", name: "Scrum", mode: "flexible", desc: lang === "tr" ? "Sprint tabanlı, iteratif geliştirme." : "Sprint-based iterative dev.", projects: 2, custom: false },
    { id: "tpl-waterfall", name: "Waterfall", mode: "sequential-locked", desc: lang === "tr" ? "Sıralı fazlar, geri dönüşsüz. Düzenlenmiş versiyon." : "Sequential phases, no reversal. Edited version.", projects: 2, custom: true },
    { id: "tpl-kanban", name: "Kanban", mode: "continuous", desc: lang === "tr" ? "Sürekli akış, WIP sınırlı." : "Continuous flow, WIP-limited.", projects: 2, custom: false },
    { id: "tpl-iso", name: "ISO Audit", mode: "sequential-locked", desc: lang === "tr" ? "ISO 27001 denetim süreci için özel şablon." : "Custom template for ISO 27001 audits.", projects: 1, custom: true },
    { id: "tpl-rd", name: "R&D Phase Gate", mode: "sequential-locked", desc: lang === "tr" ? "Ar-Ge faz kapı süreci." : "R&D phase-gate process.", projects: 0, custom: true },
    { id: "tpl-lean", name: "Lean", mode: "continuous", desc: lang === "tr" ? "Yalın, minimal sürtünme." : "Lean, minimal ceremony.", projects: 0, custom: false },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
      {templates.map(t => (
        <Card key={t.id} padding={16}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                {t.custom && <Badge size="xs" tone="primary">{lang === "tr" ? "Özel" : "Custom"}</Badge>}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 6, lineHeight: 1.5 }}>{t.desc}</div>
            </div>
            <button style={{ color: "var(--fg-subtle)" }}><Icons.MoreH size={14}/></button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "10px 0 0 0", borderTop: "1px solid var(--border)", fontSize: 11.5 }}>
            <Badge size="xs" tone={t.mode === "sequential-locked" ? "warning" : t.mode === "continuous" ? "info" : "neutral"}>
              {t.mode === "sequential-locked" ? <><Icons.Lock size={10}/> Locked</> : t.mode === "continuous" ? "Continuous" : "Flexible"}
            </Badge>
            <div style={{ flex: 1 }}/>
            <span style={{ color: "var(--fg-muted)" }}>{t.projects} {lang === "tr" ? "proje" : "projects"}</span>
          </div>
        </Card>
      ))}
    </div>
  );
};

const AdminAudit = ({ lang }) => {
  const rows = [
    { time: "14:23:11", actor: "u1", action: "user.role.update", target: "Can Aksoy", meta: "Member → PM", ip: "10.0.2.14", risk: "high" },
    { time: "14:18:03", actor: "u1", action: "project.create", target: "Veri Analitik Platformu", meta: "methodology=scrum", ip: "10.0.2.14", risk: "low" },
    { time: "13:02:44", actor: "u2", action: "workflow.publish", target: "Waterfall v2", meta: "nodes=6 edges=5", ip: "10.0.4.22", risk: "medium" },
    { time: "12:45:18", actor: "u1", action: "auth.sso.update", target: "Okta SAML", meta: "clientId=acme-sso", ip: "10.0.2.14", risk: "high" },
    { time: "11:30:09", actor: "u3", action: "user.invite", target: "deniz.acar@acme.co", meta: "role=Member", ip: "10.0.1.88", risk: "low" },
    { time: "10:15:52", actor: "u2", action: "project.archive", target: "Eski CRM Projesi", meta: "—", ip: "10.0.4.22", risk: "medium" },
    { time: "09:48:31", actor: "u1", action: "auth.mfa.reset", target: "Mert Yılmaz", meta: "method=totp", ip: "10.0.2.14", risk: "high" },
    { time: "09:12:07", actor: "u1", action: "user.deactivate", target: "Eski Kullanıcı", meta: "reason=offboarding", ip: "10.0.2.14", risk: "medium" },
  ];
  return (
    <Card padding={0}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center" }}>
        <Input icon={<Icons.Search size={13}/>} placeholder={lang === "tr" ? "actor, action, target…" : "actor, action, target…"} size="sm" style={{ width: 260 }}/>
        <Button size="sm" variant="ghost" icon={<Icons.Calendar size={13}/>}>{lang === "tr" ? "Son 24 saat" : "Last 24h"}</Button>
        <Button size="sm" variant="ghost" icon={<Icons.Filter size={13}/>}>{lang === "tr" ? "Filtre" : "Filter"}</Button>
        <div style={{ flex: 1 }}/>
        <Button size="sm" variant="secondary" icon={<Icons.Download size={13}/>}>{lang === "tr" ? "JSON" : "JSON"}</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "90px 160px 180px 1fr 1fr 120px 80px", padding: "10px 16px", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--fg-subtle)", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>
        <div>Time</div><div>Actor</div><div>Action</div><div>Target</div><div>Meta</div><div>IP</div><div>Risk</div>
      </div>
      {rows.map((r, i) => {
        const u = window.SPMSData.getUser(r.actor);
        return (
          <div key={i} className="mono" style={{ display: "grid", gridTemplateColumns: "90px 160px 180px 1fr 1fr 120px 80px", padding: "8px 16px", alignItems: "center", fontSize: 11.5, borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "0", cursor: "pointer" }}>
            <div style={{ color: "var(--fg-muted)" }}>{r.time}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)" }}><Avatar user={u} size={18}/><span>{u?.name}</span></div>
            <div style={{ color: "var(--status-progress)" }}>{r.action}</div>
            <div style={{ fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.target}</div>
            <div style={{ color: "var(--fg-muted)" }}>{r.meta}</div>
            <div style={{ color: "var(--fg-muted)" }}>{r.ip}</div>
            <div><Badge size="xs" tone={r.risk === "high" ? "danger" : r.risk === "medium" ? "warning" : "neutral"}>{r.risk}</Badge></div>
          </div>
        );
      })}
    </Card>
  );
};

const AdminStats = ({ lang }) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
      <Card padding={16}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === "tr" ? "Aktif kullanıcı eğilimi" : "Active users trend"}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 2 }}>{lang === "tr" ? "Son 30 gün" : "Last 30 days"}</div>
          </div>
          <Badge tone="success" dot>+12.4%</Badge>
        </div>
        <svg viewBox="0 0 400 140" style={{ width: "100%", height: 180 }}>
          {[0, 1, 2, 3].map(i => <line key={i} x1="0" x2="400" y1={i * 35 + 5} y2={i * 35 + 5} stroke="var(--border)"/>)}
          <path d="M0,110 L20,100 L40,105 L60,92 L80,88 L100,92 L120,75 L140,80 L160,70 L180,65 L200,68 L220,55 L240,58 L260,45 L280,50 L300,38 L320,42 L340,30 L360,28 L380,20 L400,25"
            fill="none" stroke="var(--primary)" strokeWidth="2"/>
          <path d="M0,110 L20,100 L40,105 L60,92 L80,88 L100,92 L120,75 L140,80 L160,70 L180,65 L200,68 L220,55 L240,58 L260,45 L280,50 L300,38 L320,42 L340,30 L360,28 L380,20 L400,25 L400,140 L0,140 Z"
            fill="color-mix(in oklch, var(--primary) 12%, transparent)"/>
        </svg>
      </Card>
      <Card padding={16}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{lang === "tr" ? "Metodoloji Kullanımı" : "Methodology usage"}</div>
        {[{k:"Scrum",v:45,c:"var(--status-progress)"},{k:"Kanban",v:35,c:"var(--primary)"},{k:"Waterfall",v:20,c:"var(--status-review)"}].map(r => (
          <div key={r.k} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span>{r.k}</span><span className="mono" style={{ color: "var(--fg-muted)" }}>{r.v}%</span>
            </div>
            <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 3 }}>
              <div style={{ width: `${r.v}%`, height: "100%", background: r.c, borderRadius: 3 }}/>
            </div>
          </div>
        ))}
      </Card>
      <Card padding={16} style={{ gridColumn: "1 / -1" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{lang === "tr" ? "Proje başına velocity" : "Velocity per project"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {window.SPMSData.PROJECTS.map(p => (
            <div key={p.id} style={{ padding: 10, background: "var(--surface-2)", borderRadius: 6 }}>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-muted)" }}>{p.key}</div>
              <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{Math.round(p.progress * 100)}<span style={{ fontSize: 13, color: "var(--fg-subtle)" }}>%</span></div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginTop: 8, height: 28 }}>
                {[0.3, 0.4, 0.5, 0.55, 0.7, 0.85, p.progress].map((v, i) => (
                  <div key={i} style={{ flex: 1, height: `${v * 100}%`, background: i === 6 ? "var(--primary)" : "var(--border-strong)", borderRadius: 1 }}/>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

Object.assign(window, { AdminPage });
