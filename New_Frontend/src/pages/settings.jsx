// Settings page: Profile, Preferences, Notifications, Security, Appearance (theme)

const SettingsPage = () => {
  const lang = useApp().language;
  const [sec, setSec] = useState("profile");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.4, marginBottom: 4 }}>{lang === "tr" ? "Ayarlar" : "Settings"}</div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 16 }}>{lang === "tr" ? "Kişisel tercihleriniz" : "Your preferences"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { id: "profile", label: lang === "tr" ? "Profil" : "Profile", icon: <Icons.Users size={14}/> },
            { id: "preferences", label: lang === "tr" ? "Tercihler" : "Preferences", icon: <Icons.Settings size={14}/> },
            { id: "appearance", label: lang === "tr" ? "Görünüm" : "Appearance", icon: <Icons.Palette size={14}/> },
            { id: "notifications", label: lang === "tr" ? "Bildirimler" : "Notifications", icon: <Icons.Bell size={14}/> },
            { id: "security", label: lang === "tr" ? "Güvenlik" : "Security", icon: <Icons.Shield size={14}/> },
          ].map(it => (
            <button key={it.id} onClick={() => setSec(it.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, fontSize: 13, color: sec === it.id ? "var(--fg)" : "var(--fg-muted)", background: sec === it.id ? "var(--accent)" : "transparent", fontWeight: sec === it.id ? 600 : 500, textAlign: "left" }}>
              <span style={{ color: sec === it.id ? "var(--primary)" : "var(--fg-subtle)" }}>{it.icon}</span>
              {it.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {sec === "profile" && <ProfileSection lang={lang}/>}
        {sec === "preferences" && <PreferencesSection lang={lang}/>}
        {sec === "appearance" && <AppearanceSection lang={lang}/>}
        {sec === "notifications" && <NotifSection lang={lang}/>}
        {sec === "security" && <SecuritySection lang={lang}/>}
      </div>
    </div>
  );
};

const ProfileSection = ({ lang }) => {
  const u = window.SPMSData.CURRENT_USER;
  return (
    <Card padding={20}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{lang === "tr" ? "Profil Bilgileri" : "Profile"}</div>
      <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 20 }}>{lang === "tr" ? "Adınız, avatarınız ve iletişim bilgileriniz" : "Your name, avatar and contact"}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <Avatar user={u} size={72} style={{ fontSize: 24 }}/>
        <div>
          <Button size="sm" variant="secondary">{lang === "tr" ? "Fotoğraf yükle" : "Upload photo"}</Button>
          <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginTop: 6 }}>{lang === "tr" ? "PNG, JPG — max 2MB" : "PNG, JPG — max 2MB"}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <LabeledField label={lang === "tr" ? "Ad Soyad" : "Name"} defaultValue={u.name}/>
        <LabeledField label={lang === "tr" ? "Görünen ad" : "Display name"} defaultValue="Ayşe"/>
        <LabeledField label="Email" defaultValue={u.email}/>
        <LabeledField label={lang === "tr" ? "Telefon" : "Phone"} defaultValue="+90 532 *** **89"/>
        <LabeledField label={lang === "tr" ? "Departman" : "Department"} defaultValue="Ürün · Teknoloji"/>
        <LabeledField label={lang === "tr" ? "Unvan" : "Title"} defaultValue="Head of Engineering"/>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <Button variant="primary">{lang === "tr" ? "Değişiklikleri kaydet" : "Save changes"}</Button>
        <Button variant="ghost">{lang === "tr" ? "Vazgeç" : "Cancel"}</Button>
      </div>
    </Card>
  );
};

const LabeledField = ({ label, defaultValue, type = "text" }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg-muted)" }}>{label}</span>
    <input type={type} defaultValue={defaultValue} style={{ height: 34, padding: "0 10px", fontSize: 13, background: "var(--surface-2)", border: 0, borderRadius: "var(--radius-sm)", boxShadow: "inset 0 0 0 1px var(--border)" }}/>
  </label>
);

const PreferencesSection = ({ lang }) => {
  const app = useApp();
  return (
    <Card padding={20}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{lang === "tr" ? "Tercihler" : "Preferences"}</div>
      <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 20 }}>{lang === "tr" ? "Dil, başlangıç sayfası ve klavye" : "Language, default page, keyboard"}</div>
      <PrefRow label={lang === "tr" ? "Dil" : "Language"}>
        <div style={{ display: "inline-flex", gap: 2, background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
          {["tr", "en"].map(l => (
            <button key={l} onClick={() => app.setLanguage(l)} style={{ padding: "5px 12px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: app.language === l ? "var(--surface)" : "transparent", color: app.language === l ? "var(--fg)" : "var(--fg-muted)" }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </PrefRow>
      <PrefRow label={lang === "tr" ? "Başlangıç sayfası" : "Default page"}>
        <select style={{ height: 30, padding: "0 10px", fontSize: 13, background: "var(--surface-2)", border: 0, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
          <option>{lang === "tr" ? "Panel" : "Dashboard"}</option>
          <option>{lang === "tr" ? "Projelerim" : "My Projects"}</option>
          <option>{lang === "tr" ? "Görevlerim" : "My Tasks"}</option>
        </select>
      </PrefRow>
      <PrefRow label={lang === "tr" ? "Görünüm yoğunluğu" : "UI density"}>
        <div style={{ display: "inline-flex", gap: 2, background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
          {[["compact", lang === "tr" ? "Sıkı" : "Compact"], ["cozy", lang === "tr" ? "Dengeli" : "Cozy"], ["comfortable", lang === "tr" ? "Rahat" : "Comfortable"]].map(([v, l]) => (
            <button key={v} style={{ padding: "5px 12px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: v === "cozy" ? "var(--surface)" : "transparent", color: v === "cozy" ? "var(--fg)" : "var(--fg-muted)" }}>{l}</button>
          ))}
        </div>
      </PrefRow>
      <PrefRow label={lang === "tr" ? "Hafta başlangıcı" : "Week starts"}>
        <div style={{ display: "inline-flex", gap: 2, background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
          {[lang === "tr" ? "Pzt" : "Mon", lang === "tr" ? "Paz" : "Sun"].map((l, i) => (
            <button key={l} style={{ padding: "5px 12px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: i === 0 ? "var(--surface)" : "transparent", color: i === 0 ? "var(--fg)" : "var(--fg-muted)" }}>{l}</button>
          ))}
        </div>
      </PrefRow>
      <PrefRow label={lang === "tr" ? "Klavye kısayolları" : "Keyboard shortcuts"}>
        <Toggle on/>
      </PrefRow>
      <PrefRow label={lang === "tr" ? "Komut paleti (⌘K)" : "Command palette (⌘K)"}>
        <Toggle on/>
      </PrefRow>
    </Card>
  );
};

const PrefRow = ({ label, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", padding: "14px 0", borderTop: "1px solid var(--border)", alignItems: "center", fontSize: 13 }}>
    <div>{label}</div>
    <div>{children}</div>
  </div>
);

const Toggle = ({ on }) => (
  <div style={{ width: 36, height: 20, borderRadius: 10, background: on ? "var(--primary)" : "var(--surface-2)", boxShadow: on ? "none" : "inset 0 0 0 1px var(--border-strong)", position: "relative", cursor: "pointer", transition: "background 0.1s" }}>
    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: on ? 18 : 2, transition: "left 0.12s", boxShadow: "0 1px 3px oklch(0 0 0 / 0.15)" }}/>
  </div>
);

const AppearanceSection = ({ lang }) => {
  const app = useApp();
  const [localHue, setLocalHue] = useState(app.brandHue);
  const [localChroma, setLocalChroma] = useState(app.brandChroma);
  const [localLight, setLocalLight] = useState(app.brandLight);

  const applyCustom = () => {
    app.applyCustomBrand({ L: localLight, C: localChroma, H: localHue });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card padding={20}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{lang === "tr" ? "Hazır Temalar" : "Preset Themes"}</div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 16 }}>{lang === "tr" ? "Preset'ler baseline olarak kalır. Özel ayarlarınızı yan sekmede kaydedebilirsiniz." : "Presets stay as baselines. Save your customizations as a new theme."}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {Object.values(window.SPMSTheme.PRESETS).map(p => {
            const isActive = app.preset === p.id && !app.customColors;
            return (
              <div key={p.id} onClick={() => app.applyPreset(p.id)}
                style={{ cursor: "pointer", padding: 14, borderRadius: 10, background: p.tokens.bg, boxShadow: isActive ? "inset 0 0 0 2px var(--primary)" : "inset 0 0 0 1px var(--border)", transition: "box-shadow 0.1s" }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                  {[p.tokens.primary, p.tokens.accent, p.tokens["bg-2"], p.tokens.fg].map((c, i) => (
                    <div key={i} style={{ width: 16, height: 16, borderRadius: 3, background: c, boxShadow: "inset 0 0 0 1px oklch(0 0 0 / 0.1)" }}/>
                  ))}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: p.tokens.fg }}>{p.name[lang]}</div>
                <div style={{ fontSize: 11, color: p.tokens["fg-muted"], marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  {p.mode === "dark" ? <Icons.Moon size={10}/> : <Icons.Sun size={10}/>} {p.mode === "dark" ? (lang === "tr" ? "Koyu" : "Dark") : (lang === "tr" ? "Açık" : "Light")}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card padding={20}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{lang === "tr" ? "Marka Rengi (OKLCH)" : "Brand Color (OKLCH)"}</div>
            <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{lang === "tr" ? "Tek bir renk seçin, tüm palet türetilsin." : "Pick one color — entire palette is derived."}</div>
          </div>
          {app.customColors && <Badge tone="primary" dot>{lang === "tr" ? "Özel aktif" : "Custom active"}</Badge>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Slider label={`L · ${lang === "tr" ? "Parlaklık" : "Lightness"}`} value={localLight} min={0.3} max={0.85} step={0.01} onChange={setLocalLight}/>
            <Slider label={`C · ${lang === "tr" ? "Doygunluk" : "Chroma"}`} value={localChroma} min={0} max={0.3} step={0.005} onChange={setLocalChroma}/>
            <Slider label={`H · ${lang === "tr" ? "Ton" : "Hue"}`} value={localHue} min={0} max={360} step={1} onChange={setLocalHue}/>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="primary" onClick={applyCustom}>{lang === "tr" ? "Uygula" : "Apply"}</Button>
              <Button variant="secondary" onClick={() => app.saveCustomPreset({ L: localLight, C: localChroma, H: localHue })}>{lang === "tr" ? "Yeni tema olarak kaydet" : "Save as new theme"}</Button>
              <Button variant="ghost" onClick={() => app.applyPreset("default")}>{lang === "tr" ? "Sıfırla" : "Reset"}</Button>
            </div>
          </div>

          <div>
            <div style={{ padding: 16, background: "var(--surface-2)", borderRadius: 10, boxShadow: "inset 0 0 0 1px var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 10 }}>{lang === "tr" ? "Önizleme" : "Preview"}</div>
              <div style={{
                padding: "12px 16px", borderRadius: 10,
                background: `oklch(${localLight} ${localChroma} ${localHue})`,
                color: localLight < 0.55 ? "#fff" : "#111",
                fontSize: 13, fontWeight: 600, marginBottom: 10,
              }}>
                <div className="mono" style={{ fontSize: 10.5, opacity: 0.85 }}>oklch({localLight.toFixed(3)} {localChroma.toFixed(3)} {Math.round(localHue)})</div>
                <div style={{ marginTop: 4 }}>{lang === "tr" ? "Primary renk" : "Primary color"}</div>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {[0.3, 0.45, 0.6, 0.75, 0.9].map(l => (
                  <div key={l} style={{ flex: 1, height: 28, borderRadius: 4, background: `oklch(${l} ${localChroma * (l < 0.5 ? 1.2 : 0.8)} ${localHue})` }}/>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--fg-muted)", marginBottom: 6 }}>{lang === "tr" ? "WCAG uyum tahmini" : "Contrast estimate"}</div>
              <div style={{ fontSize: 11.5, display: "flex", gap: 8 }}>
                <Badge size="xs" tone={localLight < 0.55 || localLight > 0.75 ? "success" : "warning"}>
                  {localLight < 0.55 || localLight > 0.75 ? "AA ok" : "Check"}
                </Badge>
                <span className="mono" style={{ color: "var(--fg-subtle)" }}>ΔL≈{Math.abs(localLight - 0.5).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card padding={20}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{lang === "tr" ? "Özel Temalarım" : "My Custom Themes"}</div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 16 }}>{lang === "tr" ? "Preset'ler baseline olarak kalır; özellerinizi burada saklayın." : "Presets stay baseline; your customs live here."}</div>
        {app.customPresets.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", fontSize: 12.5, color: "var(--fg-subtle)", border: "1px dashed var(--border-strong)", borderRadius: 10 }}>
            {lang === "tr" ? "Henüz özel temanız yok. 'Yeni tema olarak kaydet' ile başlayın." : "No custom themes yet. Save one above."}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {app.customPresets.map(p => (
              <div key={p.id} onClick={() => app.applyPreset(p.id)}
                style={{ cursor: "pointer", padding: 12, borderRadius: 10, background: p.tokens.bg, boxShadow: app.preset === p.id ? "inset 0 0 0 2px var(--primary)" : "inset 0 0 0 1px var(--border)" }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                  {[p.tokens.primary, p.tokens.accent, p.tokens["bg-2"]].map((c, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c }}/>)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: p.tokens.fg }}>{p.name}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding={20}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{lang === "tr" ? "Layout Tokens" : "Layout Tokens"}</div>
        <PrefRow label={lang === "tr" ? "Köşe yuvarlaması" : "Corner radius"}>
          <Slider value={app.radius} min={0} max={18} step={1} onChange={(v) => app.setRadius(v)} display={`${app.radius}px`} width={220}/>
        </PrefRow>
        <PrefRow label={lang === "tr" ? "Kenar çubuğu" : "Sidebar"}>
          <div style={{ display: "inline-flex", gap: 2, background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
            <button onClick={() => app.setSidebarCollapsed(false)} style={{ padding: "5px 12px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: !app.sidebarCollapsed ? "var(--surface)" : "transparent", color: !app.sidebarCollapsed ? "var(--fg)" : "var(--fg-muted)" }}>{lang === "tr" ? "Açık" : "Expanded"}</button>
            <button onClick={() => app.setSidebarCollapsed(true)} style={{ padding: "5px 12px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: app.sidebarCollapsed ? "var(--surface)" : "transparent", color: app.sidebarCollapsed ? "var(--fg)" : "var(--fg-muted)" }}>{lang === "tr" ? "Daraltılmış" : "Collapsed"}</button>
          </div>
        </PrefRow>
      </Card>
    </div>
  );
};

const Slider = ({ label, value, min, max, step, onChange, display, width }) => (
  <div>
    {label && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
      <span style={{ fontWeight: 600, color: "var(--fg-muted)" }}>{label}</span>
      <span className="mono" style={{ color: "var(--fg-subtle)" }}>{typeof value === "number" ? value.toFixed(step < 0.1 ? 3 : 2).replace(/\.0+$/, "") : value}</span>
    </div>}
    <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ width: width || "100%", accentColor: "var(--primary)" }}/>
    {display && !label && <span style={{ marginLeft: 10, fontSize: 12, color: "var(--fg-muted)" }} className="mono">{display}</span>}
  </div>
);

const NotifSection = ({ lang }) => (
  <Card padding={20}>
    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{lang === "tr" ? "Bildirimler" : "Notifications"}</div>
    <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 20 }}>{lang === "tr" ? "Ne zaman ve nasıl haber verilsin" : "When and how to be notified"}</div>
    {[
      { k: lang === "tr" ? "Size görev atandığında" : "When assigned a task", e: true, i: true, d: false },
      { k: lang === "tr" ? "Bahsedildiğinizde (@)" : "When mentioned (@)", e: true, i: true, d: true },
      { k: lang === "tr" ? "Görev durumu değiştiğinde" : "Task status changes", e: false, i: true, d: false },
      { k: lang === "tr" ? "Yaklaşan teslim tarihleri" : "Upcoming due dates", e: true, i: true, d: true },
      { k: lang === "tr" ? "Proje güncellemeleri" : "Project updates", e: false, i: false, d: false },
      { k: lang === "tr" ? "Haftalık özet" : "Weekly digest", e: true, i: false, d: false },
    ].map((r, i) => (
      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", padding: "12px 0", borderTop: i === 0 ? "0" : "1px solid var(--border)", alignItems: "center", fontSize: 13 }}>
        <div>{r.k}</div>
        <div style={{ display: "flex", justifyContent: "center" }}><Toggle on={r.e}/></div>
        <div style={{ display: "flex", justifyContent: "center" }}><Toggle on={r.i}/></div>
        <div style={{ display: "flex", justifyContent: "center" }}><Toggle on={r.d}/></div>
      </div>
    ))}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
      <div/><div style={{ textAlign: "center" }}>Email</div><div style={{ textAlign: "center" }}>In-app</div><div style={{ textAlign: "center" }}>Desktop</div>
    </div>
  </Card>
);

const SecuritySection = ({ lang }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <Card padding={20}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>{lang === "tr" ? "Parola" : "Password"}</div>
      <LabeledField label={lang === "tr" ? "Mevcut parola" : "Current password"} type="password" defaultValue=""/>
      <div style={{ height: 12 }}/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <LabeledField label={lang === "tr" ? "Yeni parola" : "New password"} type="password" defaultValue=""/>
        <LabeledField label={lang === "tr" ? "Tekrar" : "Confirm"} type="password" defaultValue=""/>
      </div>
      <Button variant="primary" style={{ marginTop: 14 }}>{lang === "tr" ? "Parolayı güncelle" : "Update password"}</Button>
    </Card>
    <Card padding={20}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{lang === "tr" ? "İki Faktörlü Kimlik Doğrulama" : "Two-Factor Auth"}</div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{lang === "tr" ? "TOTP ile hesabınızı koruyun (Google Authenticator, 1Password vb.)" : "Protect your account with TOTP."}</div>
        </div>
        <Badge tone="success" dot>{lang === "tr" ? "Etkin" : "Active"}</Badge>
      </div>
      <Button variant="secondary" style={{ marginTop: 12 }}>{lang === "tr" ? "Yeniden yapılandır" : "Reconfigure"}</Button>
    </Card>
    <Card padding={20}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{lang === "tr" ? "Aktif Oturumlar" : "Active Sessions"}</div>
      {[
        { d: "Macbook Pro — Chrome", l: "Istanbul, TR", t: lang === "tr" ? "Şu an" : "Now", c: true },
        { d: "iPhone 15 Pro — Safari", l: "Istanbul, TR", t: lang === "tr" ? "2 saat önce" : "2h ago", c: false },
      ].map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i === 0 ? "0" : "1px solid var(--border)", fontSize: 12.5 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{s.d} {s.c && <Badge size="xs" tone="primary" style={{ marginLeft: 4 }}>{lang === "tr" ? "Bu cihaz" : "Current"}</Badge>}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 2 }}>{s.l} · {s.t}</div>
          </div>
          {!s.c && <Button size="xs" variant="ghost" style={{ color: "var(--priority-critical)" }}>{lang === "tr" ? "Çıkış" : "Revoke"}</Button>}
        </div>
      ))}
    </Card>
  </div>
);

Object.assign(window, { SettingsPage });
