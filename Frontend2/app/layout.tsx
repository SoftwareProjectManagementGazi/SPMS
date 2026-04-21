import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { AppProvider } from "@/context/app-context"
import { AuthProvider } from "@/context/auth-context"

import "./globals.css"

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SPMS",
  description: "Software Project Management System",
}

// Synchronous theme init: runs before first paint so the browser applies the
// user's preset tokens, mode, density, and radius immediately. Without this,
// the page paints with default :root/[data-mode="dark"] values, React
// hydrates, then AppContext's useEffect overrides them — every token that
// differs causes a visible flicker (button backgrounds, primary hue, etc).
//
// The script inlines the full PRESETS table from lib/theme.ts and the
// deriveFromBrand logic so it can apply the EXACT same tokens AppContext
// would apply. When hydration runs, AppContext re-applies identical values —
// no change, no flicker.
//
// If this table drifts from lib/theme.ts, the flicker will return. Keep them
// in sync when editing presets.
const THEME_INIT_SCRIPT = `(function(){try{
var d=document.documentElement,ls=window.localStorage;
function g(k,v){var x=ls.getItem('spms.'+k);if(x===null)return v;try{return JSON.parse(x)}catch(e){return v}}
var P={
default:{mode:'light',tokens:{bg:'oklch(0.985 0.006 75)','bg-2':'oklch(0.97 0.008 70)',surface:'oklch(1 0 0)','surface-2':'oklch(0.975 0.006 70)',fg:'oklch(0.20 0.025 50)','fg-muted':'oklch(0.48 0.018 55)','fg-subtle':'oklch(0.62 0.012 60)',border:'oklch(0.90 0.01 65)','border-strong':'oklch(0.82 0.015 60)',primary:'oklch(0.60 0.17 40)','primary-fg':'oklch(0.985 0.005 75)','primary-hover':'oklch(0.55 0.18 40)',accent:'oklch(0.93 0.03 50)','accent-fg':'oklch(0.25 0.04 50)',ring:'oklch(0.60 0.17 40 / 0.4)'}},
ocean:{mode:'light',tokens:{bg:'oklch(0.985 0.006 220)','bg-2':'oklch(0.97 0.01 215)',surface:'oklch(1 0 0)','surface-2':'oklch(0.975 0.008 220)',fg:'oklch(0.20 0.03 230)','fg-muted':'oklch(0.48 0.025 225)','fg-subtle':'oklch(0.62 0.015 225)',border:'oklch(0.90 0.012 220)','border-strong':'oklch(0.82 0.018 220)',primary:'oklch(0.55 0.15 210)','primary-fg':'oklch(0.985 0.005 220)','primary-hover':'oklch(0.50 0.16 210)',accent:'oklch(0.93 0.03 215)','accent-fg':'oklch(0.25 0.05 215)',ring:'oklch(0.55 0.15 210 / 0.4)'}},
forest:{mode:'light',tokens:{bg:'oklch(0.985 0.006 150)','bg-2':'oklch(0.97 0.01 145)',surface:'oklch(1 0 0)','surface-2':'oklch(0.975 0.008 150)',fg:'oklch(0.20 0.03 160)','fg-muted':'oklch(0.48 0.02 155)','fg-subtle':'oklch(0.62 0.012 155)',border:'oklch(0.90 0.012 150)','border-strong':'oklch(0.82 0.018 150)',primary:'oklch(0.50 0.14 150)','primary-fg':'oklch(0.985 0.005 150)','primary-hover':'oklch(0.45 0.15 150)',accent:'oklch(0.93 0.03 145)','accent-fg':'oklch(0.25 0.05 150)',ring:'oklch(0.50 0.14 150 / 0.4)'}},
monochrome:{mode:'light',tokens:{bg:'oklch(0.985 0 0)','bg-2':'oklch(0.97 0 0)',surface:'oklch(1 0 0)','surface-2':'oklch(0.975 0 0)',fg:'oklch(0.18 0 0)','fg-muted':'oklch(0.48 0 0)','fg-subtle':'oklch(0.62 0 0)',border:'oklch(0.90 0 0)','border-strong':'oklch(0.78 0 0)',primary:'oklch(0.22 0 0)','primary-fg':'oklch(0.99 0 0)','primary-hover':'oklch(0.12 0 0)',accent:'oklch(0.93 0 0)','accent-fg':'oklch(0.20 0 0)',ring:'oklch(0.22 0 0 / 0.4)'}},
midnight:{mode:'dark',tokens:{bg:'oklch(0.17 0.02 280)','bg-2':'oklch(0.20 0.025 280)',surface:'oklch(0.22 0.025 280)','surface-2':'oklch(0.25 0.028 280)',fg:'oklch(0.96 0.01 280)','fg-muted':'oklch(0.70 0.02 280)','fg-subtle':'oklch(0.55 0.02 280)',border:'oklch(0.32 0.025 280)','border-strong':'oklch(0.42 0.03 280)',primary:'oklch(0.72 0.17 290)','primary-fg':'oklch(0.15 0.02 280)','primary-hover':'oklch(0.77 0.18 290)',accent:'oklch(0.32 0.04 280)','accent-fg':'oklch(0.95 0.01 280)',ring:'oklch(0.72 0.17 290 / 0.5)'}},
graphite:{mode:'dark',tokens:{bg:'oklch(0.19 0.005 240)','bg-2':'oklch(0.22 0.008 240)',surface:'oklch(0.24 0.008 240)','surface-2':'oklch(0.27 0.01 240)',fg:'oklch(0.96 0.005 240)','fg-muted':'oklch(0.70 0.01 240)','fg-subtle':'oklch(0.55 0.01 240)',border:'oklch(0.33 0.01 240)','border-strong':'oklch(0.44 0.015 240)',primary:'oklch(0.75 0.06 240)','primary-fg':'oklch(0.15 0.01 240)','primary-hover':'oklch(0.80 0.07 240)',accent:'oklch(0.33 0.015 240)','accent-fg':'oklch(0.95 0.005 240)',ring:'oklch(0.75 0.06 240 / 0.5)'}}
};
var mode=g('mode','light'),preset=g('preset','default'),density=g('density','cozy'),radius=g('radius',8),customColors=g('customColors',false);
if(mode!=='light'&&mode!=='dark')mode='light';
var tokens,finalMode;
if(customColors){
var L=g('brandLight',0.6),C=g('brandChroma',0.17),H=g('brandHue',40);
var base=P[mode==='dark'?'graphite':'default'];
tokens={};for(var k in base.tokens)tokens[k]=base.tokens[k];
tokens.primary='oklch('+L+' '+C+' '+H+')';
var pfL=L<0.55?0.985:0.15;
tokens['primary-fg']='oklch('+pfL+' '+(C*0.05)+' '+H+')';
tokens['primary-hover']='oklch('+Math.max(0.08,L-0.05)+' '+(C+0.01)+' '+H+')';
tokens.ring='oklch('+L+' '+C+' '+H+' / 0.4)';
if(mode==='light'){
tokens.accent='oklch('+Math.min(0.96,L+0.32)+' '+(C*0.15)+' '+H+')';
tokens['accent-fg']='oklch('+Math.max(0.20,L-0.35)+' '+(C*0.3)+' '+H+')';
}else{
tokens.accent='oklch('+Math.max(0.25,L-0.4)+' '+(C*0.3)+' '+H+')';
tokens['accent-fg']='oklch('+Math.min(0.97,L+0.22)+' '+(C*0.1)+' '+H+')';
}
finalMode=mode;
}else{
var r=P[preset]||P['default'];
tokens=r.tokens;
finalMode=r.mode;
}
for(var k in tokens)d.style.setProperty('--'+k,tokens[k]);
d.setAttribute('data-mode',finalMode);
d.setAttribute('data-density',density);
d.style.setProperty('--radius',radius+'px');
d.style.setProperty('--radius-sm',Math.max(2,radius-4)+'px');
d.style.setProperty('--radius-lg',(radius+4)+'px');
}catch(e){document.documentElement.setAttribute('data-mode','light');document.documentElement.setAttribute('data-density','cozy');}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <noscript>
          <style>{`html:not([data-mode]) body { visibility: visible !important; }`}</style>
        </noscript>
      </head>
      <body className={`${geist.variable} ${geistMono.variable}`}>
        <AppProvider><AuthProvider>{children}</AuthProvider></AppProvider>
      </body>
    </html>
  )
}
