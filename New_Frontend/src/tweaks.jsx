// Tweaks panel — floating in bottom right when edit mode is active.

const TweaksPanel = () => {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("theme");

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "__activate_edit_mode") setOpen(true);
      if (e.data?.type === "__deactivate_edit_mode") setOpen(false);
    };
    window.addEventListener("message", handler);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  if (!open) return null;
  const lang = app.language;

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, width: 360, maxHeight: "80vh",
      background: "var(--surface)", boxShadow: "0 16px 40px oklch(0 0 0 / 0.18), inset 0 0 0 1px var(--border)",
      borderRadius: 12, zIndex: 200, overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <Icons.Sparkle size={14} style={{ color: "var(--primary)" }}/>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Tweaks</div>
        <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{lang === "tr" ? "Canlı özelleştirme" : "Live customization"}</div>
        <div style={{ flex: 1 }}/>
        <button onClick={() => setOpen(false)} style={{ color: "var(--fg-muted)", padding: 4 }}><Icons.X size={14}/></button>
      </div>
      <div style={{ display: "flex", padding: "6px 8px", gap: 2, borderBottom: "1px solid var(--border)" }}>
        {[
          { id: "theme", l: lang === "tr" ? "Tema" : "Theme" },
          { id: "layout", l: lang === "tr" ? "Düzen" : "Layout" },
          { id: "type", l: lang === "tr" ? "Yazı" : "Type" },
          { id: "demo", l: "Demo" },
        ].map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            style={{ flex: 1, padding: "6px 8px", fontSize: 11.5, fontWeight: 600, borderRadius: 5, background: active === t.id ? "var(--accent)" : "transparent", color: active === t.id ? "var(--accent-fg)" : "var(--fg-muted)" }}>
            {t.l}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {active === "theme" && <ThemeTweaks lang={lang}/>}
        {active === "layout" && <LayoutTweaks lang={lang}/>}
        {active === "type" && <TypeTweaks lang={lang}/>}
        {active === "demo" && <DemoTweaks lang={lang}/>}
      </div>
    </div>
  );
};

const ThemeTweaks = ({ lang }) => {
  const app = useApp();
  return (
    <>
      <TweakLabel>{lang === "tr" ? "Hazır Tema" : "Preset"}</TweakLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14 }}>
        {Object.values(window.SPMSTheme.PRESETS).map(p => (
          <div key={p.id} onClick={() => app.applyPreset(p.id)}
            style={{ cursor: "pointer", padding: 8, borderRadius: 6, background: p.tokens.bg, boxShadow: app.preset === p.id && !app.customColors ? "inset 0 0 0 2px var(--primary)" : "inset 0 0 0 1px var(--border)" }}>
            <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
              {[p.tokens.primary, p.tokens.accent, p.tokens.fg].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }}/>)}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: p.tokens.fg }}>{p.name[lang].split(" ")[0]}</div>
          </div>
        ))}
      </div>
      <TweakLabel>{lang === "tr" ? "Mod" : "Mode"}</TweakLabel>
      <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)", marginBottom: 14 }}>
        {[["light", lang === "tr" ? "Açık" : "Light", <Icons.Sun size={11}/>], ["dark", lang === "tr" ? "Koyu" : "Dark", <Icons.Moon size={11}/>]].map(([v, l, icn]) => (
          <button key={v} onClick={() => app.setMode(v)} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 11.5, fontWeight: 600, background: app.mode === v ? "var(--surface)" : "transparent", color: app.mode === v ? "var(--fg)" : "var(--fg-muted)", display: "inline-flex", alignItems: "center", gap: 5 }}>
            {icn} {l}
          </button>
        ))}
      </div>
      <TweakLabel>{lang === "tr" ? "Marka Rengi (OKLCH)" : "Brand Color (OKLCH)"}</TweakLabel>
      <div style={{ padding: 10, background: "var(--surface-2)", borderRadius: 8, boxShadow: "inset 0 0 0 1px var(--border)", marginBottom: 10 }}>
        <TinySlider label="L" value={app.brandLight} min={0.3} max={0.85} step={0.01} onChange={(v) => app.applyCustomBrand({ L: v, C: app.brandChroma, H: app.brandHue })}/>
        <TinySlider label="C" value={app.brandChroma} min={0} max={0.3} step={0.005} onChange={(v) => app.applyCustomBrand({ L: app.brandLight, C: v, H: app.brandHue })}/>
        <TinySlider label="H" value={app.brandHue} min={0} max={360} step={1} onChange={(v) => app.applyCustomBrand({ L: app.brandLight, C: app.brandChroma, H: v })}/>
        <div className="mono" style={{ fontSize: 10, color: "var(--fg-subtle)", marginTop: 6 }}>
          oklch({app.brandLight.toFixed(3)} {app.brandChroma.toFixed(3)} {Math.round(app.brandHue)})
        </div>
      </div>
      <TweakLabel>{lang === "tr" ? "Hızlı tonlar" : "Quick hues"}</TweakLabel>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {[40, 15, 330, 290, 250, 210, 160, 130, 80].map(h => (
          <button key={h} onClick={() => app.applyCustomBrand({ L: 0.6, C: 0.17, H: h })}
            title={`H=${h}`}
            style={{ width: 22, height: 22, borderRadius: 5, background: `oklch(0.6 0.17 ${h})`, boxShadow: app.customColors && Math.round(app.brandHue) === h ? "inset 0 0 0 2px var(--fg), 0 0 0 2px var(--surface)" : "inset 0 0 0 1px oklch(0 0 0 / 0.1)", cursor: "pointer" }}/>
        ))}
      </div>
    </>
  );
};

const LayoutTweaks = ({ lang }) => {
  const app = useApp();
  return (
    <>
      <TweakLabel>{lang === "tr" ? "Köşe yuvarlaması" : "Corner radius"}</TweakLabel>
      <TinySlider value={app.radius} min={0} max={18} step={1} onChange={app.setRadius} display={`${app.radius}px`}/>
      <TweakLabel style={{ marginTop: 14 }}>{lang === "tr" ? "Kenar çubuğu" : "Sidebar"}</TweakLabel>
      <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
        {[[false, lang === "tr" ? "Açık" : "Expanded"], [true, lang === "tr" ? "Daraltılmış" : "Collapsed"]].map(([v, l]) => (
          <button key={String(v)} onClick={() => app.setSidebarCollapsed(v)} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 11.5, fontWeight: 600, background: app.sidebarCollapsed === v ? "var(--surface)" : "transparent", color: app.sidebarCollapsed === v ? "var(--fg)" : "var(--fg-muted)" }}>{l}</button>
        ))}
      </div>
      <TweakLabel style={{ marginTop: 14 }}>{lang === "tr" ? "Yoğunluk" : "Density"}</TweakLabel>
      <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
        {[["compact","C"],["cozy","M"],["comfortable","L"]].map(([v,l]) => (
          <button key={v} onClick={() => app.setDensity(v)} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 11.5, fontWeight: 600, background: app.density === v ? "var(--surface)" : "transparent", color: app.density === v ? "var(--fg)" : "var(--fg-muted)" }}>{l === "C" ? (lang==="tr"?"Sıkı":"Compact") : l === "M" ? (lang==="tr"?"Orta":"Cozy") : (lang==="tr"?"Rahat":"Comfy")}</button>
        ))}
      </div>
      <TweakLabel style={{ marginTop: 14 }}>{lang === "tr" ? "Dil" : "Language"}</TweakLabel>
      <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
        {["tr","en"].map(l => (
          <button key={l} onClick={() => app.setLanguage(l)} style={{ padding: "4px 14px", borderRadius: 4, fontSize: 11.5, fontWeight: 600, background: app.language === l ? "var(--surface)" : "transparent", color: app.language === l ? "var(--fg)" : "var(--fg-muted)" }}>{l.toUpperCase()}</button>
        ))}
      </div>
    </>
  );
};

const TypeTweaks = ({ lang }) => {
  const app = useApp();
  const fonts = [
    { id: "geist", label: "Geist (default)", sans: '"Geist", "Geist Fallback", system-ui, sans-serif', mono: '"Geist Mono", ui-monospace, monospace' },
    { id: "inst", label: "Instrument + JetBrains", sans: '"Instrument Sans", system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' },
    { id: "manrope", label: "Manrope + IBM Plex", sans: '"Manrope", system-ui, sans-serif', mono: '"IBM Plex Mono", ui-monospace, monospace' },
    { id: "system", label: "System UI", sans: "system-ui, -apple-system, sans-serif", mono: "ui-monospace, monospace" },
  ];
  return (
    <>
      <TweakLabel>{lang === "tr" ? "Yazı Tipi" : "Font Family"}</TweakLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {fonts.map(f => (
          <button key={f.id} onClick={() => app.setFont(f.id, f.sans, f.mono)}
            style={{ textAlign: "left", padding: "8px 10px", borderRadius: 6, background: app.fontId === f.id ? "var(--accent)" : "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--border)", fontFamily: f.sans }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</div>
            <div style={{ fontSize: 10.5, color: "var(--fg-muted)", marginTop: 2 }}>The quick brown fox · 0123456789</div>
          </button>
        ))}
      </div>
      <TweakLabel style={{ marginTop: 14 }}>{lang === "tr" ? "Temel Boyut" : "Base size"}</TweakLabel>
      <TinySlider value={app.baseSize} min={12} max={17} step={0.5} onChange={app.setBaseSize} display={`${app.baseSize}px`}/>
    </>
  );
};

const DemoTweaks = ({ lang }) => {
  const app = useApp();
  return (
    <>
      <TweakLabel>{lang === "tr" ? "Demo Senaryosu" : "Demo Scenario"}</TweakLabel>
      <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginBottom: 10 }}>{lang === "tr" ? "Farklı rollerden sisteme bakın" : "View the system as different roles"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { id: "u1", label: lang === "tr" ? "Yönetici (Admin)" : "Admin", desc: "Ayşe Demir" },
          { id: "u2", label: "Project Manager", desc: "Mert Yılmaz" },
          { id: "u3", label: lang === "tr" ? "Üye (Senior Dev)" : "Member (Senior Dev)", desc: "Deniz Acar" },
        ].map(r => (
          <button key={r.id} onClick={() => app.setAsUser(r.id)}
            style={{ textAlign: "left", padding: 10, borderRadius: 6, background: app.currentUserId === r.id ? "var(--accent)" : "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar user={window.SPMSData.getUser(r.id)} size={26}/>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{r.label}</div>
              <div style={{ fontSize: 10.5, color: "var(--fg-muted)" }}>{r.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
};

const TweakLabel = ({ children, style }) => (
  <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, ...style }}>
    {children}
  </div>
);

const TinySlider = ({ label, value, min, max, step, onChange, display }) => (
  <div style={{ marginBottom: 6 }}>
    {label && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginBottom: 3 }}>
      <span className="mono" style={{ color: "var(--fg-muted)", fontWeight: 600 }}>{label}</span>
      <span className="mono" style={{ color: "var(--fg-subtle)" }}>{typeof value === "number" ? value.toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : 0) : value}</span>
    </div>}
    <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "var(--primary)" }}/>
    {display && !label && <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-subtle)", marginLeft: 8 }}>{display}</span>}
  </div>
);

Object.assign(window, { TweaksPanel });
