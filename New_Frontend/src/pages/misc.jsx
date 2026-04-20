// Auth screens and misc page stubs

const AuthPage = ({ mode }) => {
  const router = useRouter();
  const lang = useApp().language;
  const T = (tr, en) => lang === "tr" ? tr : en;

  return (
    <div style={{ position: "fixed", inset: 0, display: "grid", gridTemplateColumns: "1fr 1.1fr", background: "var(--bg)", zIndex: 100 }}>
      <div style={{ display: "flex", flexDirection: "column", padding: "40px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoMark/>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>PMS</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>{T("Proje Yönetim Sistemi", "Project Management System")}</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginBottom: 8 }}>
              {mode === "login" && T("Tekrar hoş geldiniz", "Welcome back")}
              {mode === "register" && T("Hesap oluşturun", "Create account")}
              {mode === "forgot" && T("Parolanızı mı unuttunuz?", "Forgot password?")}
            </div>
            <div style={{ fontSize: 13.5, color: "var(--fg-muted)", marginBottom: 28, lineHeight: 1.6 }}>
              {mode === "login" && T("Hesabınıza giriş yaparak projelerinizi yönetmeye devam edin.", "Sign in to continue managing your projects.")}
              {mode === "register" && T("Hesabınızı oluşturduktan sonra yönetici onayı ile erişim kazanırsınız.", "After registering, an admin approves your access.")}
              {mode === "forgot" && T("E-posta adresinize sıfırlama bağlantısı gönderelim.", "We'll send a reset link to your email.")}
            </div>

            {mode !== "forgot" && (
              <>
                <button onClick={() => router.go("dashboard")}
                  style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--surface)", color: "var(--fg)", borderRadius: "var(--radius-sm)", boxShadow: "inset 0 0 0 1px var(--border-strong)", fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
                  <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7L12.9 19.5C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.7l6.2 5.2C41 34.8 44 29.8 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
                  {T("Google ile devam et", "Continue with Google")}
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0", color: "var(--fg-subtle)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
                  <span>{T("veya e-posta ile", "or with email")}</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
                </div>
              </>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {mode === "register" && <LabeledField label={T("Ad Soyad", "Full Name")} defaultValue=""/>}
              <LabeledField label="Email" defaultValue={mode === "login" ? "ayse.demir@acme.co" : ""}/>
              {mode !== "forgot" && <LabeledField label={T("Parola", "Password")} type="password" defaultValue={mode === "login" ? "••••••••••" : ""}/>}
              {mode === "register" && <LabeledField label={T("Şirket", "Company")} defaultValue="Acme Holding"/>}
            </div>

            {mode === "login" && (
              <div style={{ display: "flex", alignItems: "center", marginTop: 12, fontSize: 12 }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--fg-muted)" }}>
                  <input type="checkbox" defaultChecked/> {T("Beni hatırla", "Remember me")}
                </label>
                <div style={{ flex: 1 }}/>
                <a onClick={() => router.go("auth-forgot")} style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}>{T("Parolamı unuttum", "Forgot password")}</a>
              </div>
            )}

            <Button variant="primary" size="lg" style={{ width: "100%", marginTop: 20, justifyContent: "center" }} onClick={() => router.go("dashboard")}>
              {mode === "login" && T("Giriş yap", "Sign in")}
              {mode === "register" && T("Hesap oluştur", "Create account")}
              {mode === "forgot" && T("Bağlantı gönder", "Send reset link")}
            </Button>

            <div style={{ marginTop: 24, fontSize: 12.5, color: "var(--fg-muted)", textAlign: "center" }}>
              {mode === "login" && <>{T("Hesabınız yok mu?", "No account?")} <a onClick={() => router.go("auth-register")} style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}>{T("Kayıt olun", "Sign up")}</a></>}
              {mode === "register" && <>{T("Zaten hesabınız var mı?", "Have an account?")} <a onClick={() => router.go("auth-login")} style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}>{T("Giriş yapın", "Sign in")}</a></>}
              {mode === "forgot" && <><a onClick={() => router.go("auth-login")} style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}>← {T("Girişe dön", "Back to sign in")}</a></>}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-subtle)", display: "flex", gap: 16 }}>
          <span>© 2025 Acme Holding</span>
          <a>{T("Gizlilik", "Privacy")}</a>
          <a>{T("Şartlar", "Terms")}</a>
        </div>
      </div>

      {/* Right: Marketing panel */}
      <div style={{ position: "relative", background: "var(--surface-2)", boxShadow: "inset 1px 0 0 var(--border)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(800px 500px at 70% 30%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 60%), radial-gradient(500px 300px at 20% 80%, color-mix(in oklch, var(--status-progress) 10%, transparent), transparent 60%)" }}/>
        <div style={{ position: "relative", padding: "80px 60px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "var(--surface)", boxShadow: "inset 0 0 0 1px var(--border)", fontSize: 11, fontWeight: 600, letterSpacing: 0.3, color: "var(--primary)", textTransform: "uppercase" }}>
              <Icons.Sparkle size={11}/> v2.4 — {T("Özelleştirilebilir iş akışları", "Customizable workflows")}
            </div>
            <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: -1, marginTop: 20, lineHeight: 1.15, maxWidth: 480 }}>
              {T("Waterfall'dan Scrum'a — tek platform, sizin kurallarınız.", "Waterfall to Scrum — one platform, your rules.")}
            </div>
            <div style={{ fontSize: 14.5, color: "var(--fg-muted)", marginTop: 16, lineHeight: 1.6, maxWidth: 440 }}>
              {T("Özel yaşam döngüsü kuralları, rol tabanlı yetkiler ve gerçek zamanlı işbirliği.", "Custom lifecycle rules, role-based access, real-time collaboration.")}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {[
              { k: "120+", v: T("Aktif proje", "Active projects") },
              { k: "99.9%", v: T("Çalışma süresi", "Uptime") },
              { k: "4.8/5", v: T("Kullanıcı puanı", "User rating") },
              { k: "24/7", v: T("Destek", "Support") },
            ].map(s => (
              <div key={s.k} style={{ padding: 14, background: "var(--surface)", borderRadius: 10, boxShadow: "inset 0 0 0 1px var(--border)" }}>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>{s.k}</div>
                <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LogoMark = ({ size = 22 }) => (
  <div style={{ width: size, height: size, borderRadius: 6, background: "var(--primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: size * 0.55, letterSpacing: -0.5 }}>
    P
  </div>
);

/* ---------- Simple stub pages ---------- */

const InboxPage = () => {
  const lang = useApp().language;
  const items = [
    { type: "mention", from: "u5", text: lang === "tr" ? "@ayse figma linkini paylaşır mısın?" : "@ayse can you share the figma link?", ctx: "MOB-24 · Onboarding akışı", time: "4 dk" },
    { type: "assigned", from: "u3", text: lang === "tr" ? "Size yeni görev atadı" : "Assigned you a new task", ctx: "API-88 · Rate limiting middleware", time: "34 dk" },
    { type: "review", from: "u7", text: lang === "tr" ? "İnceleme istedi" : "Requested your review", ctx: "DA-12 · Data warehouse schema v2", time: "1 sa" },
    { type: "status", from: "u4", text: lang === "tr" ? "Görev 'İncelemede' durumuna taşındı" : "Task moved to 'In Review'", ctx: "MOB-23 · Wallet empty state", time: "2 sa" },
    { type: "approve", from: "u1", text: lang === "tr" ? "Proje katılım isteğinizi onayladı" : "Approved your project join request", ctx: "Veri Analitik Platformu", time: "3 sa" },
    { type: "due", from: "sys", text: lang === "tr" ? "Görev son tarihi yaklaşıyor (yarın)" : "Task due tomorrow", ctx: "ISO-42 · Kontrol maddelerinin eşlenmesi", time: "5 sa" },
  ];
  const iconFor = (t) => {
    if (t === "mention") return <Icons.Chat size={14}/>;
    if (t === "assigned") return <Icons.Task size={14}/>;
    if (t === "review") return <Icons.Review size={14}/>;
    if (t === "status") return <Icons.Progress size={14}/>;
    if (t === "approve") return <Icons.Check size={14}/>;
    if (t === "due") return <Icons.Clock size={14}/>;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 880 }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6, display: "flex", alignItems: "center", gap: 8 }}>
          <Icons.Bell size={18} style={{ color: "var(--primary)" }}/> {lang === "tr" ? "Gelen Kutusu" : "Inbox"}
        </div>
        <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 4 }}>{items.length} {lang === "tr" ? "okunmamış bildirim" : "unread notifications"}</div>
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Tabs active="all" onChange={() => {}} tabs={[
          { id: "all", label: lang === "tr" ? "Tümü" : "All", badge: items.length },
          { id: "mentions", label: lang === "tr" ? "Bahisler" : "Mentions", badge: 1 },
          { id: "assigned", label: lang === "tr" ? "Atanan" : "Assigned", badge: 2 },
          { id: "watching", label: lang === "tr" ? "Takip" : "Watching", badge: 2 },
        ]}/>
        <div style={{ flex: 1 }}/>
        <Button size="sm" variant="ghost" icon={<Icons.Check size={13}/>}>{lang === "tr" ? "Tümünü okundu işaretle" : "Mark all read"}</Button>
      </div>
      <Card padding={0}>
        {items.map((n, i) => {
          const u = window.SPMSData.getUser(n.from);
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr auto", gap: 12, padding: "14px 16px", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "0", alignItems: "flex-start", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ position: "relative" }}>
                {u ? <Avatar user={u} size={34}/> : <div style={{ width: 34, height: 34, borderRadius: 17, background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--fg-muted)" }}><Icons.Bell size={14}/></div>}
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: "var(--surface)", boxShadow: "0 0 0 2px var(--bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                  {iconFor(n.type)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13 }}>
                  {u && <span style={{ fontWeight: 600 }}>{u.name.split(" ")[0]}</span>} <span style={{ color: "var(--fg-muted)" }}>{n.text}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginTop: 4 }} className="mono">{n.ctx}</div>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>{n.time}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

const CalendarPage = () => {
  const lang = useApp().language;
  const days = [lang === "tr" ? "Pzt" : "Mon", lang === "tr" ? "Sal" : "Tue", lang === "tr" ? "Çar" : "Wed", lang === "tr" ? "Per" : "Thu", lang === "tr" ? "Cum" : "Fri", lang === "tr" ? "Cmt" : "Sat", lang === "tr" ? "Paz" : "Sun"];
  const today = 15; // arbitrary
  const tasks = window.SPMSData.TASKS.filter(t => t.due).slice(0, 14);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4 }}>{lang === "tr" ? "Kasım 2025" : "November 2025"}</div>
          <div style={{ color: "var(--fg-muted)", fontSize: 13 }}>{lang === "tr" ? "42 görev, 8 kilometre taşı" : "42 tasks, 8 milestones"}</div>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
          {[lang === "tr" ? "Ay" : "Month", lang === "tr" ? "Hafta" : "Week", lang === "tr" ? "Gün" : "Day"].map((v, i) => (
            <button key={v} style={{ padding: "5px 12px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: i === 0 ? "var(--surface)" : "transparent", color: i === 0 ? "var(--fg)" : "var(--fg-muted)" }}>{v}</button>
          ))}
        </div>
        <Button size="sm" variant="secondary" icon={<Icons.ChevronLeft size={12}/>}/>
        <Button size="sm" variant="ghost">{lang === "tr" ? "Bugün" : "Today"}</Button>
        <Button size="sm" variant="secondary" icon={<Icons.ChevronRight size={12}/>}/>
        <Button size="sm" variant="primary" icon={<Icons.Plus size={13}/>}>{lang === "tr" ? "Etkinlik" : "Event"}</Button>
      </div>

      <Card padding={0} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border)" }}>
          {days.map(d => (
            <div key={d} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{d}</div>
          ))}
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridTemplateRows: "repeat(5, 1fr)", minHeight: 0 }}>
          {Array.from({ length: 35 }).map((_, i) => {
            const day = i - 2; // offset so the 1st lands on Wed
            const inMonth = day >= 1 && day <= 30;
            const isToday = day === today;
            const dayTasks = inMonth ? tasks.filter((_, ti) => (ti % 10) === (day % 10)) : [];
            return (
              <div key={i} style={{ borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--border)" : "0", borderBottom: i < 28 ? "1px solid var(--border)" : "0", padding: 8, display: "flex", flexDirection: "column", gap: 4, background: isToday ? "color-mix(in oklch, var(--primary) 5%, transparent)" : "transparent", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: !inMonth ? "var(--fg-subtle)" : isToday ? "var(--primary)" : "var(--fg)", width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: isToday ? "color-mix(in oklch, var(--primary) 12%, transparent)" : "transparent" }}>
                    {inMonth ? day : (day <= 0 ? 31 + day : day - 30)}
                  </span>
                </div>
                {dayTasks.slice(0, 2).map(t => {
                  const p = window.SPMSData.getProject(t.projectId);
                  return (
                    <div key={t.id} style={{ fontSize: 10.5, padding: "2px 5px", borderRadius: 3, background: "color-mix(in oklch, var(--primary) 14%, transparent)", color: "var(--primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
                      <span className="mono" style={{ marginRight: 3, opacity: 0.7 }}>{t.key}</span>{t.title}
                    </div>
                  );
                })}
                {dayTasks.length > 2 && <div style={{ fontSize: 10, color: "var(--fg-muted)" }}>+{dayTasks.length - 2} more</div>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const SearchPage = () => {
  const lang = useApp().language;
  const [q, setQ] = useState("onboarding");
  const hits = window.SPMSData.TASKS.filter(t => t.title.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 920 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4 }}>{lang === "tr" ? "Arama" : "Search"}</div>
        <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 4 }}>{lang === "tr" ? "Görev, proje, kişi, belge" : "Tasks, projects, people, docs"}</div>
      </div>
      <Input icon={<Icons.Search size={14}/>} value={q} onChange={(e) => setQ(e.target.value)} autoFocus/>
      <div style={{ display: "flex", gap: 6 }}>
        {[lang === "tr" ? "Hepsi" : "All", lang === "tr" ? "Görevler" : "Tasks", lang === "tr" ? "Projeler" : "Projects", lang === "tr" ? "Kişiler" : "People", lang === "tr" ? "Dosyalar" : "Files"].map((t, i) => (
          <Badge key={t} tone={i === 0 ? "primary" : "neutral"} style={{ cursor: "pointer" }}>{t}</Badge>
        ))}
      </div>
      <Card padding={0}>
        {hits.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--fg-muted)", fontSize: 13 }}>{lang === "tr" ? "Sonuç yok" : "No results"}</div>
        ) : hits.map((t, i) => {
          const p = window.SPMSData.getProject(t.projectId);
          const a = window.SPMSData.getUser(t.assigneeId);
          return (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "24px 1fr 130px 100px 26px", padding: "11px 16px", borderBottom: i < hits.length - 1 ? "1px solid var(--border)" : "0", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
              <Icons.Task size={14} style={{ color: "var(--fg-subtle)" }}/>
              <div>
                <div><span className="mono" style={{ fontSize: 10.5, color: "var(--fg-muted)", marginRight: 6 }}>{t.key}</span>{t.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginTop: 2 }}>{p.name}</div>
              </div>
              <StatusPill status={t.status}/>
              {a && <Avatar user={a} size={22}/>}
              <Icons.ChevronRight size={14} style={{ color: "var(--fg-subtle)" }}/>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

const DocsPage = () => {
  const lang = useApp().language;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24, height: "100%" }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{lang === "tr" ? "Belgeler" : "Documents"}</div>
        <Button size="sm" variant="primary" icon={<Icons.Plus size={13}/>} style={{ width: "100%", justifyContent: "center", marginBottom: 14 }}>{lang === "tr" ? "Yeni belge" : "New doc"}</Button>
        <div style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, padding: "10px 0 4px" }}>{lang === "tr" ? "Klasörler" : "Folders"}</div>
        {[
          { n: lang === "tr" ? "Şirket Politikaları" : "Company Policies", c: 8 },
          { n: lang === "tr" ? "Teknik Dokümanlar" : "Tech Docs", c: 23, active: true },
          { n: "PRDs", c: 14 },
          { n: lang === "tr" ? "Sprint Notları" : "Sprint Notes", c: 31 },
          { n: lang === "tr" ? "Müşteri Araştırması" : "Customer Research", c: 6 },
        ].map(f => (
          <div key={f.n} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, fontSize: 13, background: f.active ? "var(--accent)" : "transparent", fontWeight: f.active ? 600 : 500, cursor: "pointer" }}>
            <Icons.Folder size={14} style={{ color: f.active ? "var(--primary)" : "var(--fg-subtle)" }}/>
            <span style={{ flex: 1 }}>{f.n}</span>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-subtle)" }}>{f.c}</span>
          </div>
        ))}
      </div>
      <Card padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <Icons.Doc size={14} style={{ color: "var(--fg-muted)" }}/>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{lang === "tr" ? "Mobil Bankacılık — PRD v2.3" : "Mobile Banking — PRD v2.3"}</div>
          <div style={{ flex: 1 }}/>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--fg-muted)" }}>
            <Icons.Edit size={11}/>
            {lang === "tr" ? "2 dk önce kaydedildi" : "Saved 2m ago"}
          </div>
          <Button size="xs" variant="ghost" icon={<Icons.Share size={12}/>}>{lang === "tr" ? "Paylaş" : "Share"}</Button>
        </div>
        <div style={{ padding: "40px 60px", maxWidth: 720 }}>
          <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, color: "var(--primary)" }}>PRD · {lang === "tr" ? "Ürün Gereksinimleri" : "Product Requirements"}</div>
          <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.8, marginTop: 10 }}>{lang === "tr" ? "Mobil Bankacılık Uygulaması v2" : "Mobile Banking App v2"}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, fontSize: 12, color: "var(--fg-muted)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar user={window.SPMSData.CURRENT_USER} size={20}/> Ayşe Demir</div>
            <span>·</span>
            <span>{lang === "tr" ? "3 Kasım 2025" : "Nov 3, 2025"}</span>
            <span>·</span>
            <Badge size="xs" tone="success" dot>{lang === "tr" ? "Onaylı" : "Approved"}</Badge>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 36, letterSpacing: -0.3 }}>1. {lang === "tr" ? "Genel Bakış" : "Overview"}</h2>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--fg)", marginTop: 8 }}>
            {lang === "tr" ? "Bu doküman, Acme Bank mobil uygulamasının ikinci büyük sürümü için ürün gereksinimlerini tanımlar. Temel hedef, kullanıcı ediniminde %35 artış sağlamak ve NPS skorunu 42'den 55'e çıkarmaktır." : "This document defines the requirements for the second major release of the Acme Bank mobile app. The primary goal is to drive 35% user acquisition growth and raise NPS from 42 to 55."}
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 28, letterSpacing: -0.3 }}>2. {lang === "tr" ? "Kapsam" : "Scope"}</h2>
          <ul style={{ fontSize: 14, lineHeight: 1.85, color: "var(--fg)", marginTop: 8, paddingLeft: 22 }}>
            <li>{lang === "tr" ? "Yeni onboarding akışı — 3 adımlı" : "New onboarding flow — 3 steps"}</li>
            <li>{lang === "tr" ? "Biyometrik kimlik doğrulama (Face ID / parmak izi)" : "Biometric auth (Face ID / fingerprint)"}</li>
            <li>{lang === "tr" ? "Anlık bildirim mimarisi v2" : "Push notification architecture v2"}</li>
            <li>{lang === "tr" ? "Kripto cüzdan entegrasyonu (Faz 2)" : "Crypto wallet integration (Phase 2)"}</li>
          </ul>
          <div style={{ padding: 14, borderRadius: 8, background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--border)", marginTop: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Icons.Info size={14} style={{ color: "var(--status-progress)", marginTop: 2 }}/>
            <div style={{ fontSize: 12.5, color: "var(--fg-muted)", lineHeight: 1.6 }}>
              {lang === "tr" ? "Bu belge 5 kişi tarafından görüntüleniyor. Deniz Acar ve Mert Yılmaz yorum bıraktı." : "This doc is being viewed by 5 people. Deniz Acar and Mert Yılmaz left comments."}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const ReportsPage = () => {
  const lang = useApp().language;
  const T = (tr, en) => lang === "tr" ? tr : en;
  const [cfdRange, setCfdRange] = React.useState("30");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4 }}>{T("Raporlar", "Reports")}</div>
          <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 4 }}>{T("Performans ve verimlilik metrikleri", "Performance & velocity metrics")}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Button size="sm" variant="secondary" icon={<Icons.Calendar size={13}/>}>Q2 2026</Button>
          <Button size="sm" variant="secondary" icon={<Icons.Download size={13}/>}>PDF</Button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label={T("Sprint Velocity", "Sprint velocity")} value="48" delta="+6 pts" tone="success" icon={<Icons.Chart/>}/>
        <StatCard label={T("Döngü Süresi", "Cycle time")} value="3.2d" delta="-0.4d" tone="success" icon={<Icons.Clock/>}/>
        <StatCard label={T("Tamamlanan", "Completed")} value="124" delta="+18%" tone="primary" icon={<Icons.Check/>}/>
        <StatCard label={T("Engeller", "Blockers")} value="3" delta="-2" tone="warning" icon={<Icons.Alert/>}/>
      </div>

      {/* Burndown + Team Load */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <Card padding={16}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Burndown — Sprint 23</div>
          <svg viewBox="0 0 400 180" style={{ width: "100%" }}>
            {[0,1,2,3].map(i => <line key={i} x1="30" x2="400" y1={i * 40 + 10} y2={i * 40 + 10} stroke="var(--border)"/>)}
            <line x1="30" y1="10" x2="400" y2="150" stroke="var(--fg-subtle)" strokeWidth="1.5" strokeDasharray="4 4"/>
            <path d="M30,10 L80,25 L130,40 L180,60 L230,70 L280,95 L330,110 L400,130" fill="none" stroke="var(--primary)" strokeWidth="2.5"/>
            {[30,80,130,180,230,280,330,400].map((x, i) => (
              <circle key={i} cx={x} cy={[10,25,40,60,70,95,110,130][i]} r="3" fill="var(--primary)"/>
            ))}
            {["D1","D3","D5","D7","D9","D11","D13","D15"].map((l, i) => (
              <text key={l} x={[30,80,130,180,230,280,330,400][i]} y="170" textAnchor="middle" fontSize="10" fill="var(--fg-subtle)" fontFamily="var(--font-mono)">{l}</text>
            ))}
          </svg>
        </Card>
        <Card padding={16}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{T("Takım Yükü", "Team Load")}</div>
          {window.SPMSData.USERS.slice(0, 6).map(u => {
            const load = Math.min(100, (u.id.charCodeAt(1) * 11) % 100 + 20);
            return (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", fontSize: 12 }}>
                <Avatar user={u} size={22}/>
                <span style={{ flex: 1 }}>{u.name.split(" ")[0]}</span>
                <ProgressBar value={load} height={6} style={{ width: 140 }} color={load > 85 ? "var(--priority-critical)" : load > 65 ? "var(--status-review)" : "var(--status-progress)"}/>
                <span className="mono" style={{ width: 34, textAlign: "right", color: "var(--fg-muted)" }}>{load}%</span>
              </div>
            );
          })}
        </Card>
      </div>

      {/* CFD (§12) */}
      <Card padding={16}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{T("Kümülatif Akış Diyagramı", "Cumulative Flow Diagram")}</div>
          <div style={{ flex: 1 }}/>
          <SegmentedControl value={cfdRange} onChange={setCfdRange} size="xs" options={[
            { id: "7", label: T("7 gün", "7d") },
            { id: "30", label: T("30 gün", "30d") },
            { id: "90", label: T("90 gün", "90d") },
          ]}/>
        </div>
        <svg viewBox="0 0 400 160" style={{ width: "100%", height: 200 }}>
          {/* Stacked areas */}
          <path d="M0,160 L0,140 L50,135 L100,128 L150,118 L200,105 L250,90 L300,72 L350,55 L400,40 L400,160 Z" fill="color-mix(in oklch, var(--status-done) 40%, transparent)"/>
          <path d="M0,140 L50,135 L100,128 L150,118 L200,105 L250,90 L300,72 L350,55 L400,40 L400,55 L350,68 L300,82 L250,96 L200,108 L150,120 L100,130 L50,138 L0,142 Z" fill="color-mix(in oklch, var(--status-review) 40%, transparent)"/>
          <path d="M0,142 L50,138 L100,130 L150,120 L200,108 L250,96 L300,82 L350,68 L400,55 L400,75 L350,85 L300,95 L250,105 L200,115 L150,125 L100,135 L50,142 L0,148 Z" fill="color-mix(in oklch, var(--status-progress) 40%, transparent)"/>
          <path d="M0,148 L50,142 L100,135 L150,125 L200,115 L250,105 L300,95 L350,85 L400,75 L400,90 L350,96 L300,104 L250,112 L200,120 L150,130 L100,140 L50,148 L0,155 Z" fill="color-mix(in oklch, var(--status-todo) 40%, transparent)"/>
        </svg>
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11.5 }}>
          {[
            { label: T("Tamamlandı", "Done"), color: "var(--status-done)" },
            { label: T("İncelemede", "Review"), color: "var(--status-review)" },
            { label: T("Devam Ediyor", "In Progress"), color: "var(--status-progress)" },
            { label: T("Yapılacak", "To Do"), color: "var(--status-todo)" },
          ].map(l => (
            <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--fg-muted)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color }}/>
              {l.label}
            </span>
          ))}
          <div style={{ flex: 1 }}/>
          <span className="mono" style={{ color: "var(--fg-muted)" }}>{T("Ort. WIP", "Avg WIP")}: <b>6.2</b></span>
          <span className="mono" style={{ color: "var(--fg-muted)" }}>{T("Ort. Tamamlanma", "Avg Completion")}: <b>3.8/{T("gün","d")}</b></span>
        </div>
      </Card>

      {/* Lead/Cycle Time (§12) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card padding={16}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Lead Time</div>
          <div style={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>4.2 <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>{T("gün", "days")}</span></div>
          <svg viewBox="0 0 300 100" style={{ width: "100%", height: 120, marginTop: 10 }}>
            {[{x:10,w:50,h:30,l:"0-1d"},{x:70,w:50,h:70,l:"1-3d"},{x:130,w:50,h:90,l:"3-5d"},{x:190,w:50,h:55,l:"5-10d"},{x:250,w:50,h:20,l:"10d+"}].map(b => (
              <React.Fragment key={b.l}>
                <rect x={b.x} y={100 - b.h} width={b.w - 4} height={b.h} rx="3" fill="color-mix(in oklch, var(--primary) 70%, transparent)"/>
                <text x={b.x + (b.w - 4) / 2} y="98" textAnchor="middle" fontSize="9" fill="var(--fg-subtle)" fontFamily="var(--font-mono)">{b.l}</text>
              </React.Fragment>
            ))}
          </svg>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 6 }}>P50: 3.2{T("g","d")} · P85: 7.1{T("g","d")} · P95: 12{T("g","d")}</div>
        </Card>
        <Card padding={16}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Cycle Time</div>
          <div style={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>2.8 <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>{T("gün", "days")}</span></div>
          <svg viewBox="0 0 300 100" style={{ width: "100%", height: 120, marginTop: 10 }}>
            {[{x:10,w:50,h:45,l:"0-1d"},{x:70,w:50,h:85,l:"1-3d"},{x:130,w:50,h:60,l:"3-5d"},{x:190,w:50,h:30,l:"5-10d"},{x:250,w:50,h:10,l:"10d+"}].map(b => (
              <React.Fragment key={b.l}>
                <rect x={b.x} y={100 - b.h} width={b.w - 4} height={b.h} rx="3" fill="color-mix(in oklch, var(--status-progress) 70%, transparent)"/>
                <text x={b.x + (b.w - 4) / 2} y="98" textAnchor="middle" fontSize="9" fill="var(--fg-subtle)" fontFamily="var(--font-mono)">{b.l}</text>
              </React.Fragment>
            ))}
          </svg>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 6 }}>P50: 2.1{T("g","d")} · P85: 4.8{T("g","d")} · P95: 8.3{T("g","d")}</div>
        </Card>
      </div>

      {/* Iteration Comparison (§12) */}
      <Card padding={16}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{T("İterasyon Karşılaştırma", "Iteration Comparison")}</div>
        <svg viewBox="0 0 400 140" style={{ width: "100%", height: 180 }}>
          {["Sprint 20","Sprint 21","Sprint 22","Sprint 23"].map((s, si) => {
            const x = si * 100 + 20;
            const planned = [30, 35, 28, 32][si];
            const done = [25, 32, 24, 28][si];
            const carried = [5, 3, 4, 4][si];
            return (
              <React.Fragment key={s}>
                <rect x={x} y={140 - planned * 3} width={22} height={planned * 3} rx="3" fill="color-mix(in oklch, var(--status-progress) 60%, transparent)"/>
                <rect x={x + 26} y={140 - done * 3} width={22} height={done * 3} rx="3" fill="color-mix(in oklch, var(--status-done) 70%, transparent)"/>
                <rect x={x + 52} y={140 - carried * 3} width={22} height={carried * 3} rx="3" fill="color-mix(in oklch, var(--status-review) 60%, transparent)"/>
                <text x={x + 38} y="155" textAnchor="middle" fontSize="9" fill="var(--fg-subtle)" fontFamily="var(--font-mono)">{s.replace("Sprint ","S")}</text>
              </React.Fragment>
            );
          })}
        </svg>
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11.5 }}>
          {[
            { label: T("Planlanan", "Planned"), color: "var(--status-progress)" },
            { label: T("Tamamlanan", "Completed"), color: "var(--status-done)" },
            { label: T("Taşınan", "Carried"), color: "var(--status-review)" },
          ].map(l => (
            <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--fg-muted)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color }}/>{l.label}
            </span>
          ))}
        </div>
      </Card>

      {/* Phase Reports (§11) */}
      <Card padding={16}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Icons.Doc size={14} style={{ color: "var(--primary)" }}/>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{T("Faz Raporları", "Phase Reports")}</div>
          <div style={{ flex: 1 }}/>
          <Button size="sm" variant="ghost">{T("Tümünü gör", "View all")}</Button>
        </div>
        {window.SPMSData.PHASE_HISTORY.map(ph => (
          <div key={ph.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 80px 80px 80px", padding: "10px 0", borderBottom: "1px solid var(--border)", alignItems: "center", fontSize: 12.5 }}>
            <div>
              <span style={{ fontWeight: 600 }}>{ph.phaseName}</span>
              <span style={{ color: "var(--fg-muted)", marginLeft: 8 }}>· {window.SPMSData.PROJECTS.find(p => p.id === ph.projectId)?.name}</span>
            </div>
            <span className="mono" style={{ color: "var(--fg-muted)", fontSize: 11 }}>{ph.closedAt}</span>
            <span className="mono">{ph.total} {T("görev", "tasks")}</span>
            <ProgressBar value={ph.successRate} style={{ width: 60 }}/>
            <span className="mono" style={{ textAlign: "right" }}>%{ph.successRate}</span>
          </div>
        ))}
      </Card>
    </div>
  );
};

Object.assign(window, { AuthPage, InboxPage, CalendarPage, SearchPage, DocsPage, ReportsPage, LogoMark });
