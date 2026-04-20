// Design primitives: Avatar, Badge, Button, Card, Kbd, Tabs, Tooltip

const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

// Avatar: initials on colored bg
const Avatar = ({ user, size = 28, ring = false, style }) => {
  if (!user) return null;
  const color = `var(--av-${user.avColor || 1})`;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 600, letterSpacing: -0.3,
      flexShrink: 0,
      boxShadow: ring ? "0 0 0 2px var(--surface), 0 0 0 4px var(--primary)" : "inset 0 0 0 1px oklch(0 0 0 / 0.08)",
      ...style,
    }}>{user.initials}</div>
  );
};

const AvatarStack = ({ users, max = 4, size = 22 }) => {
  const shown = users.slice(0, max);
  const extra = users.length - max;
  return (
    <div style={{ display: "inline-flex" }}>
      {shown.map((u, i) => (
        <div key={u.id} style={{ marginLeft: i === 0 ? 0 : -6, position: "relative", zIndex: 10 - i }}>
          <Avatar user={u} size={size} style={{ boxShadow: "0 0 0 2px var(--surface)" }}/>
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -6, width: size, height: size, borderRadius: "50%",
          background: "var(--surface-2)", color: "var(--fg-muted)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.38, fontWeight: 600,
          boxShadow: "0 0 0 2px var(--surface), inset 0 0 0 1px var(--border)",
        }}>+{extra}</div>
      )}
    </div>
  );
};

// Badge
const Badge = ({ children, tone = "neutral", style, size = "sm", dot }) => {
  const tones = {
    neutral: { bg: "var(--surface-2)", fg: "var(--fg-muted)", bd: "var(--border)" },
    primary: { bg: "color-mix(in oklch, var(--primary) 12%, transparent)", fg: "var(--primary)", bd: "color-mix(in oklch, var(--primary) 25%, transparent)" },
    success: { bg: "color-mix(in oklch, var(--status-done) 15%, transparent)", fg: "var(--status-done)", bd: "color-mix(in oklch, var(--status-done) 30%, transparent)" },
    warning: { bg: "color-mix(in oklch, var(--status-review) 18%, transparent)", fg: "color-mix(in oklch, var(--status-review) 85%, var(--fg))", bd: "color-mix(in oklch, var(--status-review) 35%, transparent)" },
    danger: { bg: "color-mix(in oklch, var(--priority-critical) 14%, transparent)", fg: "var(--priority-critical)", bd: "color-mix(in oklch, var(--priority-critical) 30%, transparent)" },
    info: { bg: "color-mix(in oklch, var(--status-progress) 13%, transparent)", fg: "var(--status-progress)", bd: "color-mix(in oklch, var(--status-progress) 25%, transparent)" },
    mono: { bg: "var(--accent)", fg: "var(--accent-fg)", bd: "transparent" },
  };
  const s = tones[tone] || tones.neutral;
  const sz = size === "xs" ? { padding: "1px 6px", fontSize: 10.5, height: 18 } : { padding: "2px 8px", fontSize: 11.5, height: 20 };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      ...sz,
      borderRadius: 999, background: s.bg, color: s.fg,
      boxShadow: `inset 0 0 0 1px ${s.bd}`,
      fontWeight: 500, whiteSpace: "nowrap", ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.fg }}/>}
      {children}
    </span>
  );
};

// Button
const Button = ({ variant = "secondary", size = "md", icon, iconRight, children, style, onClick, disabled, type = "button", title, active }) => {
  const variants = {
    primary: {
      background: "var(--primary)", color: "var(--primary-fg)",
      boxShadow: "0 2px 4px oklch(0.60 0.17 40 / 0.24), 0 1px 2px oklch(0 0 0 / 0.08), var(--inset-primary-top), var(--inset-primary-bottom)",
    },
    secondary: {
      background: "var(--surface)", color: "var(--fg)",
      boxShadow: "0 1px 2px oklch(0 0 0 / 0.05), var(--inset-top), var(--inset-bottom), inset 0 0 0 1px var(--border-strong)",
    },
    ghost: { background: "transparent", color: "var(--fg)", boxShadow: "none" },
    subtle: { background: "var(--surface-2)", color: "var(--fg)", boxShadow: "none" },
    danger: {
      background: "var(--priority-critical)", color: "#fff",
      boxShadow: "0 2px 4px oklch(0.58 0.22 25 / 0.26), var(--inset-top), var(--inset-primary-bottom)",
    },
  };
  const sizes = {
    xs: { height: 24, padding: "0 8px", fontSize: 12, gap: 4 },
    sm: { height: 28, padding: "0 10px", fontSize: 12.5, gap: 6 },
    md: { height: 32, padding: "0 12px", fontSize: 13, gap: 6 },
    lg: { height: 40, padding: "0 16px", fontSize: 14, gap: 8 },
    icon: { height: 28, width: 28, padding: 0, fontSize: 13, gap: 0 },
  };
  const v = variants[variant];
  const s = sizes[size];
  return (
    <button type={type} disabled={disabled} onClick={onClick} title={title}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--radius-sm)", fontWeight: 500,
        transition: "transform 0.08s ease, background 0.1s ease, box-shadow 0.1s ease",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...v, ...s,
        ...(active ? { background: "var(--accent)", color: "var(--accent-fg)" } : {}),
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "translateY(0.5px)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {icon}{children}{iconRight}
    </button>
  );
};

// Card surface
const Card = ({ children, style, interactive, padding = 16, ...rest }) => (
  <div {...rest} style={{
    background: "var(--surface)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow), var(--inset-card)",
    padding,
    transition: "box-shadow 0.12s ease, transform 0.12s ease",
    ...(interactive ? { cursor: "pointer" } : {}),
    ...style,
  }}
  onMouseEnter={interactive ? (e) => {
    e.currentTarget.style.boxShadow = "var(--shadow-md), var(--inset-card)";
    e.currentTarget.style.transform = "translateY(-1px)";
  } : undefined}
  onMouseLeave={interactive ? (e) => {
    e.currentTarget.style.boxShadow = "var(--shadow), var(--inset-card)";
    e.currentTarget.style.transform = "translateY(0)";
  } : undefined}
  >
    {children}
  </div>
);

// Keyboard hint
const Kbd = ({ children, style }) => (
  <span className="mono" style={{
    display: "inline-flex", alignItems: "center",
    height: 18, padding: "0 5px", minWidth: 18, justifyContent: "center",
    borderRadius: 4, fontSize: 10.5,
    background: "var(--surface-2)", color: "var(--fg-muted)",
    boxShadow: "inset 0 0 0 1px var(--border), 0 1px 0 var(--border)",
    ...style,
  }}>{children}</span>
);

// Tabs
const Tabs = ({ tabs, active, onChange, style, size = "md" }) => {
  const padMap = { sm: "6px 10px", md: "8px 14px", lg: "10px 16px" };
  const fontMap = { sm: 12, md: 13, lg: 14 };
  return (
    <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)", ...style }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            style={{
              padding: padMap[size], fontSize: fontMap[size], fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--fg)" : "var(--fg-muted)",
              borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -1,
              display: "inline-flex", alignItems: "center", gap: 6,
              transition: "color 0.12s",
            }}>
            {tab.icon}{tab.label}
            {tab.badge != null && <Badge size="xs" tone={isActive ? "primary" : "neutral"}>{tab.badge}</Badge>}
          </button>
        );
      })}
    </div>
  );
};

// Section heading
const Section = ({ title, subtitle, action, children, style }) => (
  <div style={{ ...style }}>
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

// Priority chip
const PriorityChip = ({ level, lang, withLabel = true }) => {
  const label = window.SPMSi18n.t(`priority.${level}`, lang);
  const color = `var(--priority-${level})`;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--fg-muted)", fontWeight: 500 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, transform: "rotate(45deg)" }}/>
      {withLabel && label}
    </span>
  );
};

// Status pill using status token
const StatusDot = ({ status, size = 8 }) => {
  const color = `var(--status-${status === "progress" ? "progress" : status === "review" ? "review" : status === "done" ? "done" : status === "blocked" ? "blocked" : "todo"})`;
  return <span style={{ width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }}/>;
};

// Input
const Input = ({ icon, placeholder, value, onChange, style, kbdHint, size = "md", type = "text" }) => {
  const heights = { sm: 28, md: 32, lg: 38 };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      background: "var(--surface)", borderRadius: "var(--radius-sm)",
      boxShadow: "inset 0 0 0 1px var(--border)",
      height: heights[size], padding: "0 8px", gap: 6,
      transition: "box-shadow 0.12s",
      ...style,
    }}>
      {icon && <span style={{ color: "var(--fg-subtle)", display: "inline-flex" }}>{icon}</span>}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ flex: 1, minWidth: 0, height: "100%", background: "transparent", border: 0, outline: 0, fontSize: 13, color: "var(--fg)" }}/>
      {kbdHint && <Kbd>{kbdHint}</Kbd>}
    </div>
  );
};

// ProgressBar
const ProgressBar = ({ value = 0, max = 100, height = 4, color = "var(--primary)", bg = "var(--surface-2)", style }) => (
  <div style={{ height, background: bg, borderRadius: height, overflow: "hidden", ...style }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color, borderRadius: height, transition: "width 0.2s" }}/>
  </div>
);

// SegmentedControl
const SegmentedControl = ({ options, value, onChange, size = "sm" }) => (
  <div style={{ display: "inline-flex", background: "var(--surface-2)", padding: 2, borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)" }}>
    {options.map(opt => (
      <button key={opt.id} onClick={() => onChange(opt.id)}
        style={{ padding: size === "xs" ? "3px 8px" : "4px 10px", fontSize: size === "xs" ? 11 : 11.5, fontWeight: 600, borderRadius: 4,
          background: value === opt.id ? "var(--surface)" : "transparent",
          color: value === opt.id ? "var(--fg)" : "var(--fg-muted)",
          boxShadow: value === opt.id ? "var(--shadow-sm), var(--inset-top)" : "none",
          display: "inline-flex", alignItems: "center", gap: 5 }}>
        {opt.icon}{opt.label}
      </button>
    ))}
  </div>
);

// Collapsible
const Collapsible = ({ title, badge, defaultOpen = false, children, style }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", ...style }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, background: "transparent" }}>
        <Icons.ChevronRight size={13} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s", color: "var(--fg-subtle)" }}/>
        <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
        {badge && <Badge size="xs" tone="neutral">{badge}</Badge>}
      </button>
      {open && <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>{children}</div>}
    </div>
  );
};

// AlertBanner
const AlertBanner = ({ tone = "warning", icon, children, action, style }) => {
  const colorVar = tone === "danger" ? "--priority-critical" : tone === "success" ? "--status-done" : tone === "info" ? "--status-progress" : "--status-review";
  return (
    <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, borderRadius: "var(--radius-sm)",
      background: `color-mix(in oklch, var(${colorVar}) 10%, var(--surface))`,
      boxShadow: `inset 0 0 0 1px color-mix(in oklch, var(${colorVar}) 25%, transparent)`,
      color: `var(${colorVar})`, ...style }}>
      {icon}
      <span style={{ flex: 1 }}>{children}</span>
      {action}
    </div>
  );
};

// Toggle (reusable)
const Toggle = ({ on, onChange, size = "md" }) => {
  const w = size === "sm" ? 30 : 36;
  const h = size === "sm" ? 16 : 20;
  const d = size === "sm" ? 12 : 16;
  return (
    <div onClick={() => onChange && onChange(!on)} style={{
      width: w, height: h, borderRadius: h, cursor: "pointer",
      background: on ? "var(--primary)" : "var(--surface-2)",
      boxShadow: on ? "var(--inset-primary-top), var(--inset-primary-bottom)" : "inset 0 0 0 1px var(--border-strong)",
      position: "relative", transition: "background 0.12s",
    }}>
      <div style={{ width: d, height: d, borderRadius: "50%", background: "#fff", position: "absolute", top: (h - d) / 2, left: on ? w - d - (h - d) / 2 : (h - d) / 2, transition: "left 0.12s", boxShadow: "0 1px 3px oklch(0 0 0 / 0.15)" }}/>
    </div>
  );
};

Object.assign(window, { Avatar, AvatarStack, Badge, Button, Card, Kbd, Tabs, Section, PriorityChip, StatusDot, Input, ProgressBar, SegmentedControl, Collapsible, AlertBanner, Toggle });
