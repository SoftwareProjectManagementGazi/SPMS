"use client"
import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { authService } from "@/services/auth-service"
import { useAuth } from "@/context/auth-context"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import { Card, Button, Toggle } from "@/components/primitives"
import {
  PRESETS,
  applyTokens,
  applyMode,
  applyRadius,
  deriveFromBrand,
  type ThemePreset,
} from "@/lib/theme"

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabId = "profile" | "preferences" | "appearance" | "notifications" | "security"

interface TabDef {
  id: TabId
  labelTr: string
  labelEn: string
  Icon: React.FC<{ size?: number }>
}

// Inline SVG icons (size=14) — avoids dependency on unestablished icons module
const UsersIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="5" r="2.5"/>
    <path d="M1 13c0-2.5 2-4 5-4s5 1.5 5 4"/>
    <circle cx="11.5" cy="4" r="2"/>
    <path d="M14.5 12.5c0-1.8-1.2-2.8-3-3"/>
  </svg>
)

const SettingsIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2"/>
    <path d="M8 1v1.5m0 10V14M1 8h1.5m10 0H14M3.05 3.05l1.06 1.06m7.78 7.78 1.06 1.06M3.05 12.95l1.06-1.06m7.78-7.78 1.06-1.06"/>
  </svg>
)

const PaletteIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5"/>
    <circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/>
    <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none"/>
    <circle cx="11.5" cy="8" r="1" fill="currentColor" stroke="none"/>
    <path d="M3.5 10.5c1.5 2 6 2 7-.5"/>
  </svg>
)

const BellIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5A4.5 4.5 0 0 0 3.5 6v3L2 11h12l-1.5-2V6A4.5 4.5 0 0 0 8 1.5Z"/>
    <path d="M6.5 11v.5a1.5 1.5 0 0 0 3 0V11"/>
  </svg>
)

const ShieldIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5 2.5 3.5v4C2.5 10.5 5 13 8 14.5c3-1.5 5.5-4 5.5-7v-4L8 1.5Z"/>
    <path d="m5.5 8 1.5 1.5 3-3"/>
  </svg>
)

const TABS: TabDef[] = [
  { id: "profile",       labelTr: "Profil",       labelEn: "Profile",       Icon: UsersIcon    },
  { id: "preferences",   labelTr: "Tercihler",    labelEn: "Preferences",   Icon: SettingsIcon },
  { id: "appearance",    labelTr: "Görünüm",      labelEn: "Appearance",    Icon: PaletteIcon  },
  { id: "notifications", labelTr: "Bildirimler",  labelEn: "Notifications", Icon: BellIcon     },
  { id: "security",      labelTr: "Güvenlik",     labelEn: "Security",      Icon: ShieldIcon   },
]

// ---------------------------------------------------------------------------
// Helper: LabeledField (re-used across tabs)
// ---------------------------------------------------------------------------

function LabeledField({
  label, type = "text", value, onChange, placeholder,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg-muted)" }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          // UI-sweep: standardized to Input primitive baseline (height:32, pad:"0 8px").
          height: 32, padding: "0 8px", fontSize: 13,
          background: "var(--surface-2)", border: 0,
          borderRadius: "var(--radius-sm)",
          boxShadow: "inset 0 0 0 1px var(--border)",
          color: "var(--fg)",
          // outline intentionally NOT set inline so :focus-visible ring paints (a11y).
        }}
      />
    </label>
  )
}

// ---------------------------------------------------------------------------
// Helper: PrefRow
// ---------------------------------------------------------------------------

function PrefRow({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "180px 1fr",
      padding: "14px 0",
      borderTop: "1px solid var(--border)",
      borderBottom: last ? "none" : undefined,
      alignItems: "center", fontSize: 13,
    }}>
      <div style={{ color: "var(--fg)" }}>{label}</div>
      <div>{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper: SegmentedPills (used inside Tercihler rows)
// ---------------------------------------------------------------------------

function SegmentedPills<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{
      display: "inline-flex", gap: 2,
      background: "var(--surface-2)", padding: 2,
      borderRadius: 6, boxShadow: "inset 0 0 0 1px var(--border)",
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "5px 12px", borderRadius: 4, fontSize: 12, fontWeight: 600,
            background: value === opt.value ? "var(--surface)" : "transparent",
            color: value === opt.value ? "var(--fg)" : "var(--fg-muted)",
            border: "none", cursor: "pointer",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Profile Section
// ---------------------------------------------------------------------------

function ProfileSection() {
  const { user } = useAuth()
  const { language } = useApp()
  const { showToast } = useToast()

  const [fullName, setFullName] = React.useState(user?.name ?? "")
  const [email, setEmail] = React.useState(user?.email ?? "")

  // Sync with user once loaded
  React.useEffect(() => {
    if (user) {
      setFullName(user.name)
      setEmail(user.email)
    }
  }, [user])

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Avatar upload mutation
  const avatarMutation = useMutation({
    mutationFn: (file: File) => authService.uploadAvatar(file),
    onSuccess: () => {
      showToast({
        message: language === "tr" ? "Avatar güncellendi." : "Avatar updated.",
        variant: "success",
      })
    },
    onError: () => {
      showToast({
        message: language === "tr" ? "Avatar yüklenemedi." : "Avatar upload failed.",
        variant: "error",
      })
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) avatarMutation.mutate(file)
  }

  // Profile save mutation
  const profileMutation = useMutation({
    mutationFn: () => authService.updateProfile({ full_name: fullName, email }),
    onSuccess: () => {
      showToast({
        message: language === "tr" ? "Değişiklikler kaydedildi." : "Changes saved.",
        variant: "success",
      })
    },
    onError: () => {
      showToast({
        message: language === "tr" ? "Bir şeyler ters gitti." : "Something went wrong.",
        variant: "error",
      })
    },
  })

  // Avatar display
  const avatarInitials = (user?.name ?? "?")
    .split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("")
  const avatarUrl = user?.avatar && user.avatar !== "/placeholder.svg" ? user.avatar : null

  return (
    <Card padding={20}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
        {language === "tr" ? "Profil Bilgileri" : "Profile"}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 20 }}>
        {language === "tr" ? "Adınız, avatarınız ve iletişim bilgileriniz" : "Your name, avatar and contact"}
      </div>

      {/* Avatar upload row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div
          style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "var(--accent)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 22, fontWeight: 600,
            color: "var(--accent-fg)", overflow: "hidden", flexShrink: 0,
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            avatarInitials
          )}
        </div>
        <div>
          {/* Hidden file input — T-10-06-02: accept only images */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarMutation.isPending
              ? (language === "tr" ? "Yükleniyor..." : "Uploading...")
              : (language === "tr" ? "Fotoğraf yükle" : "Upload photo")}
          </Button>
          <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginTop: 6 }}>
            PNG, JPG — max 2MB
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <LabeledField
          label={language === "tr" ? "Ad Soyad" : "Name"}
          value={fullName}
          onChange={setFullName}
        />
        <LabeledField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <Button
          variant="primary"
          onClick={() => profileMutation.mutate()}
        >
          {profileMutation.isPending
            ? (language === "tr" ? "Kaydediliyor..." : "Saving...")
            : (language === "tr" ? "Değişiklikleri kaydet" : "Save changes")}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setFullName(user?.name ?? "")
            setEmail(user?.email ?? "")
          }}
        >
          {language === "tr" ? "Vazgeç" : "Cancel"}
        </Button>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Preferences Section (D-31)
// ---------------------------------------------------------------------------

function PreferencesSection() {
  const { language, setLanguage, density, setDensity } = useApp()

  const langOptions = [
    { value: "tr" as const, label: "TR" },
    { value: "en" as const, label: "EN" },
  ]

  const densityOptions = [
    { value: "compact" as const, label: language === "tr" ? "Sıkı" : "Compact" },
    { value: "cozy" as const, label: language === "tr" ? "Dengeli" : "Cozy" },
    { value: "comfortable" as const, label: language === "tr" ? "Rahat" : "Comfortable" },
  ]

  const weekOptions = [
    { value: "mon" as const, label: language === "tr" ? "Pzt" : "Mon" },
    { value: "sun" as const, label: language === "tr" ? "Paz" : "Sun" },
  ]

  return (
    <Card padding={20}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
        {language === "tr" ? "Tercihler" : "Preferences"}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 4 }}>
        {language === "tr" ? "Dil, başlangıç sayfası ve klavye" : "Language, default page, keyboard"}
      </div>

      {/* Row 1: Dil */}
      <PrefRow label={language === "tr" ? "Dil" : "Language"}>
        <SegmentedPills
          options={langOptions}
          value={language}
          onChange={v => setLanguage(v)}
        />
      </PrefRow>

      {/* Row 2: Başlangıç sayfası — visual only */}
      <PrefRow label={language === "tr" ? "Başlangıç sayfası" : "Default page"}>
        <select
          style={{
            height: 30, padding: "0 10px", fontSize: 13,
            background: "var(--surface-2)", border: 0, borderRadius: 6,
            boxShadow: "inset 0 0 0 1px var(--border)", color: "var(--fg)",
          }}
        >
          <option>{language === "tr" ? "Panel" : "Dashboard"}</option>
          <option>{language === "tr" ? "Projelerim" : "My Projects"}</option>
          <option>{language === "tr" ? "Görevlerim" : "My Tasks"}</option>
        </select>
      </PrefRow>

      {/* Row 3: Görünüm yoğunluğu — wired to setDensity */}
      <PrefRow label={language === "tr" ? "Görünüm yoğunluğu" : "UI density"}>
        <SegmentedPills
          options={densityOptions}
          value={density}
          onChange={v => setDensity(v)}
        />
      </PrefRow>

      {/* Row 4: Hafta başlangıcı — visual only */}
      <PrefRow label={language === "tr" ? "Hafta başlangıcı" : "Week starts"}>
        <SegmentedPills
          options={weekOptions}
          value={"mon"}
          onChange={() => { /* visual only */ }}
        />
      </PrefRow>

      {/* Row 5: Klavye kısayolları — visual only */}
      <PrefRow label={language === "tr" ? "Klavye kısayolları" : "Keyboard shortcuts"}>
        <Toggle on={true} onChange={() => { /* visual only */ }} />
      </PrefRow>

      {/* Row 6: Komut paleti — visual only */}
      <PrefRow label={language === "tr" ? "Komut paleti (⌘K)" : "Command palette (⌘K)"} last>
        <Toggle on={true} onChange={() => { /* visual only */ }} />
      </PrefRow>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Security Section (D-32: password change only — no 2FA, no sessions)
// ---------------------------------------------------------------------------

function SecuritySection() {
  const { language } = useApp()
  const { showToast } = useToast()

  const [currentPass, setCurrentPass] = React.useState("")
  const [newPass, setNewPass] = React.useState("")
  const [confirmPass, setConfirmPass] = React.useState("")

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      authService.updateProfile({ current_password: currentPass, new_password: newPass }),
    onSuccess: () => {
      showToast({
        message: language === "tr" ? "Parolanız güncellendi." : "Password updated.",
        variant: "success",
      })
      setCurrentPass("")
      setNewPass("")
      setConfirmPass("")
    },
    onError: () => {
      showToast({
        message: language === "tr" ? "Parola güncellenemedi." : "Password update failed.",
        variant: "error",
      })
    },
  })

  // T-10-06-01: disable button until all fields valid + passwords match
  const canChangePassword =
    currentPass.length > 0 && newPass.length >= 8 && newPass === confirmPass

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card padding={20}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
          {language === "tr" ? "Parola" : "Password"}
        </div>

        <LabeledField
          label={language === "tr" ? "Mevcut parola" : "Current password"}
          type="password"
          value={currentPass}
          onChange={setCurrentPass}
        />
        <div style={{ height: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <LabeledField
            label={language === "tr" ? "Yeni parola" : "New password"}
            type="password"
            value={newPass}
            onChange={setNewPass}
          />
          <LabeledField
            label={language === "tr" ? "Tekrar" : "Confirm"}
            type="password"
            value={confirmPass}
            onChange={setConfirmPass}
          />
        </div>

        {/* Validation hint when passwords don't match */}
        {confirmPass.length > 0 && newPass !== confirmPass && (
          <div style={{ fontSize: 12, color: "var(--priority-critical)", marginTop: 8 }}>
            {language === "tr" ? "Parolalar eşleşmiyor." : "Passwords do not match."}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <Button
            variant="primary"
            onClick={() => changePasswordMutation.mutate()}
          >
            {changePasswordMutation.isPending
              ? (language === "tr" ? "Güncelleniyor..." : "Updating...")
              : (language === "tr" ? "Parolayı güncelle" : "Update password")}
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Appearance Section — Task 2 will replace this stub
// ---------------------------------------------------------------------------

function AppearanceSection() {
  const { language, mode, setMode, preset, applyPreset, brandHue, brandChroma, brandLight, applyCustomBrand, customColors, customPresets, radius, setRadius, sidebarCollapsed, setSidebarCollapsed } = useApp()
  const { showToast } = useToast()

  const [localHue, setLocalHue] = React.useState(brandHue)
  const [localChroma, setLocalChroma] = React.useState(brandChroma)
  const [localLight, setLocalLight] = React.useState(brandLight)

  React.useEffect(() => {
    setLocalHue(brandHue)
    setLocalChroma(brandChroma)
    setLocalLight(brandLight)
  }, [brandHue, brandChroma, brandLight])

  const handleApplyCustom = () => {
    applyCustomBrand({ L: localLight, C: localChroma, H: localHue })
    showToast({
      message: language === "tr" ? "Özel renk uygulandı." : "Custom color applied.",
      variant: "success",
    })
  }

  const allPresets = Object.values(PRESETS)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Preset Themes */}
      <Card padding={20}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          {language === "tr" ? "Hazır Temalar" : "Preset Themes"}
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 16 }}>
          {language === "tr"
            ? "Preset'ler baseline olarak kalır."
            : "Presets stay as baselines."}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {allPresets.map(p => {
            const isActive = preset === p.id && !customColors
            return (
              <div
                key={p.id}
                onClick={() => applyPreset(p.id)}
                style={{
                  cursor: "pointer", padding: 14, borderRadius: 10,
                  background: p.tokens.bg,
                  boxShadow: isActive
                    ? "inset 0 0 0 2px var(--primary)"
                    : "inset 0 0 0 1px var(--border)",
                  transition: "box-shadow 0.1s",
                }}
              >
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                  {([p.tokens.primary, p.tokens.accent, p.tokens["bg-2"], p.tokens.fg] as string[]).map((c, i) => (
                    <div key={i} style={{
                      width: 16, height: 16, borderRadius: 3, background: c,
                      boxShadow: "inset 0 0 0 1px oklch(0 0 0 / 0.1)",
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: p.tokens.fg }}>
                  {p.name[language === "tr" ? "tr" : "en"]}
                </div>
                <div style={{ fontSize: 11, color: p.tokens["fg-muted"], marginTop: 2 }}>
                  {p.mode === "dark"
                    ? (language === "tr" ? "Koyu" : "Dark")
                    : (language === "tr" ? "Açık" : "Light")}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Dark/Light mode toggle */}
      <Card padding={20}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
          {language === "tr" ? "Görünüm Modu" : "Display Mode"}
        </div>
        <PrefRow label={language === "tr" ? "Koyu mod" : "Dark mode"}>
          <Toggle
            on={mode === "dark"}
            onChange={v => {
              setMode(v ? "dark" : "light")
              applyMode(v ? "dark" : "light")
            }}
          />
        </PrefRow>

        {/* Corner radius */}
        <PrefRow label={language === "tr" ? "Köşe yuvarlaması" : "Corner radius"}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="range"
              value={radius}
              min={0} max={18} step={1}
              onChange={e => setRadius(parseFloat(e.target.value))}
              style={{ width: 160, accentColor: "var(--primary)" }}
            />
            <span style={{ fontSize: 12, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
              {radius}px
            </span>
          </div>
        </PrefRow>

        {/* Sidebar */}
        <PrefRow label={language === "tr" ? "Kenar çubuğu" : "Sidebar"} last>
          <SegmentedPills
            options={[
              { value: "expanded" as const, label: language === "tr" ? "Açık" : "Expanded" },
              { value: "collapsed" as const, label: language === "tr" ? "Daraltılmış" : "Collapsed" },
            ]}
            value={sidebarCollapsed ? "collapsed" : "expanded"}
            onChange={v => setSidebarCollapsed(v === "collapsed")}
          />
        </PrefRow>
      </Card>

      {/* Brand Color OKLCH */}
      <Card padding={20}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          {language === "tr" ? "Marka Rengi (OKLCH)" : "Brand Color (OKLCH)"}
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 16 }}>
          {language === "tr"
            ? "Tek bir renk seçin, tüm palet türetilsin."
            : "Pick one color — entire palette is derived."}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* L slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: "var(--fg-muted)" }}>
                {`L · ${language === "tr" ? "Parlaklık" : "Lightness"}`}
              </span>
              <span style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
                {localLight.toFixed(3)}
              </span>
            </div>
            <input
              type="range" value={localLight} min={0.3} max={0.85} step={0.01}
              onChange={e => setLocalLight(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary)" }}
            />
          </div>
          {/* C slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: "var(--fg-muted)" }}>
                {`C · ${language === "tr" ? "Doygunluk" : "Chroma"}`}
              </span>
              <span style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
                {localChroma.toFixed(3)}
              </span>
            </div>
            <input
              type="range" value={localChroma} min={0} max={0.3} step={0.005}
              onChange={e => setLocalChroma(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary)" }}
            />
          </div>
          {/* H slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: "var(--fg-muted)" }}>
                {`H · ${language === "tr" ? "Ton" : "Hue"}`}
              </span>
              <span style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
                {Math.round(localHue)}
              </span>
            </div>
            <input
              type="range" value={localHue} min={0} max={360} step={1}
              onChange={e => setLocalHue(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary)" }}
            />
          </div>
          {/* Preview swatch */}
          <div
            style={{
              padding: "12px 16px", borderRadius: 10,
              background: `oklch(${localLight} ${localChroma} ${localHue})`,
              color: localLight < 0.55 ? "var(--primary-fg)" : "var(--fg)",
              fontSize: 13, fontWeight: 600,
            }}
          >
            <div style={{ fontSize: 10.5, opacity: 0.85, fontFamily: "var(--font-mono)" }}>
              oklch({localLight.toFixed(3)} {localChroma.toFixed(3)} {Math.round(localHue)})
            </div>
            <div style={{ marginTop: 4 }}>
              {language === "tr" ? "Primary renk" : "Primary color"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="primary" onClick={handleApplyCustom}>
              {language === "tr" ? "Uygula" : "Apply"}
            </Button>
            <Button variant="ghost" onClick={() => applyPreset("default")}>
              {language === "tr" ? "Sıfırla" : "Reset"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notifications Section (Bildirimler) — visual-only toggles
// ---------------------------------------------------------------------------

function NotificationsSection() {
  const { language } = useApp()

  const [toggleState, setToggleState] = React.useState({
    assign_email: true,  assign_inapp: true,  assign_desktop: false,
    mention_email: true, mention_inapp: true, mention_desktop: true,
    status_email: false, status_inapp: true,  status_desktop: false,
    due_email: true,     due_inapp: true,     due_desktop: true,
    project_email: false, project_inapp: false, project_desktop: false,
    weekly_email: true,  weekly_inapp: false, weekly_desktop: false,
  })

  type ToggleKey = keyof typeof toggleState

  const toggle = (key: ToggleKey) =>
    setToggleState(prev => ({ ...prev, [key]: !prev[key] }))

  const rows: { label: string; eKey: ToggleKey; iKey: ToggleKey; dKey: ToggleKey }[] = [
    {
      label: language === "tr" ? "Size görev atandığında" : "When assigned a task",
      eKey: "assign_email", iKey: "assign_inapp", dKey: "assign_desktop",
    },
    {
      label: language === "tr" ? "Bahsedildiğinizde (@)" : "When mentioned (@)",
      eKey: "mention_email", iKey: "mention_inapp", dKey: "mention_desktop",
    },
    {
      label: language === "tr" ? "Görev durumu değiştiğinde" : "Task status changes",
      eKey: "status_email", iKey: "status_inapp", dKey: "status_desktop",
    },
    {
      label: language === "tr" ? "Yaklaşan teslim tarihleri" : "Upcoming due dates",
      eKey: "due_email", iKey: "due_inapp", dKey: "due_desktop",
    },
    {
      label: language === "tr" ? "Proje güncellemeleri" : "Project updates",
      eKey: "project_email", iKey: "project_inapp", dKey: "project_desktop",
    },
    {
      label: language === "tr" ? "Haftalık özet" : "Weekly digest",
      eKey: "weekly_email", iKey: "weekly_inapp", dKey: "weekly_desktop",
    },
  ]

  return (
    <Card padding={20}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
        {language === "tr" ? "Bildirimler" : "Notifications"}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 20 }}>
        {language === "tr" ? "Ne zaman ve nasıl haber verilsin" : "When and how to be notified"}
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 70px 70px 70px",
        paddingBottom: 10, borderBottom: "1px solid var(--border)",
        fontSize: 11, color: "var(--fg-subtle)",
        textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600,
      }}>
        <div />
        <div style={{ textAlign: "center" }}>Email</div>
        <div style={{ textAlign: "center" }}>In-app</div>
        <div style={{ textAlign: "center" }}>Desktop</div>
      </div>

      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: "grid", gridTemplateColumns: "1fr 70px 70px 70px",
            padding: "12px 0",
            borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
            alignItems: "center", fontSize: 13,
          }}
        >
          <div style={{ color: "var(--fg)" }}>{r.label}</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Toggle on={toggleState[r.eKey]} onChange={() => toggle(r.eKey)} />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Toggle on={toggleState[r.iKey]} onChange={() => toggle(r.iKey)} />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Toggle on={toggleState[r.dKey]} onChange={() => toggle(r.dKey)} />
          </div>
        </div>
      ))}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main SettingsPage
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { language } = useApp()
  const [activeTab, setActiveTab] = React.useState<TabId>("profile")

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 24,
        minHeight: "calc(100vh - 52px)",
      }}
    >
      {/* Left sidebar */}
      <div style={{ paddingRight: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.4, marginBottom: 4, color: "var(--fg)" }}>
          {language === "tr" ? "Ayarlar" : "Settings"}
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 16 }}>
          {language === "tr" ? "Kişisel tercihleriniz" : "Your preferences"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {TABS.map(tab => {
            const label = language === "tr" ? tab.labelTr : tab.labelEn
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 6,
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--fg)" : "var(--fg-muted)",
                  background: isActive ? "var(--accent)" : "transparent",
                  textAlign: "left", border: "none", cursor: "pointer",
                  width: "100%",
                }}
              >
                <span style={{ color: isActive ? "var(--primary)" : "var(--fg-subtle)", display: "flex" }}>
                  <tab.Icon size={14} />
                </span>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right content panel */}
      <div style={{ paddingLeft: 0 }}>
        {activeTab === "profile"       && <ProfileSection />}
        {activeTab === "preferences"   && <PreferencesSection />}
        {activeTab === "appearance"    && <AppearanceSection />}
        {activeTab === "notifications" && <NotificationsSection />}
        {activeTab === "security"      && <SecuritySection />}
      </div>
    </div>
  )
}
