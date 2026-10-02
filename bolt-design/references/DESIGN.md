# bolt DESIGN.md

> Auto-generated design system — reverse-engineered via static analysis by skillui.
> Frameworks: None detected
> Colors: 20 · Fonts: 3 · Components: 11
> Icon library: not detected · State: not detected
> Primary theme: light · Dark mode toggle: no · Motion: expressive

## Visual Reference

**Match this design exactly** — study colors, fonts, spacing, and component shapes before writing any UI code.

![bolt Homepage](../screenshots/homepage.png)

---

## 1. Visual Theme & Atmosphere

This is a **light-themed** interface with a cool, approachable feel. The light background emphasizes content clarity. Typography pairs **Schibsted Grotesk** for display/headings with **Cormorant Garamond** for body text, creating clear visual hierarchy through type contrast. Spacing follows a **4px base grid** (compact density), with scale: 2, 4, 6, 8, 10, 12, 14, 16px. The accent color **#96beff** anchors interactive elements (buttons, links, focus rings). Motion is expressive — spring physics, layout animations, and staggered reveals are part of the visual language.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Use |
|---|---|---|---|
| un-ring-offset-color | `#ffffff` | background | Page background, darkest surface |
| agent-color | `#000000` | text-primary | Headings and body text |
| sc-text-sub | `#ababab` | text-muted | Captions, placeholders, secondary info |
| text-secondary | `#525258` | text-muted | Captions, placeholders, secondary info |
| bolt-ds-borderSecondary | `#1e1e21` | border | Dividers, card borders, outlines |
| accent | `#96beff` | accent | CTAs, links, focus rings, active states |
| bolt-ds-dangerBgSubtle | `#ef4444` | danger | Error states, destructive actions |
| bolt-ds-successBgSubtle | `#22c55e` | success | Success states, positive indicators |
| bolt-ds-warningBgSubtle | `#f79009` | warning | Warning states, caution indicators |
| plyr-color-main | `#1488fc` | info | Informational highlights |
| theme-color | `#111114` | unknown | Palette color |
| unknown | `#7fddc1` | unknown | Palette color |
| unknown | `#0f6fd0` | unknown | Palette color |
| bolt-ds-neutralBorderSubtle | `#737373` | unknown | Palette color |
| bolt-ds-brandBgSubtle | `#2ba6ff` | unknown | Palette color |
| unknown | `#0b57c9` | unknown | Palette color |
| bolt-ds-borderSecondary | `#e5e7eb` | unknown | Palette color |
| normal-border | `#333333` | unknown | Palette color |
| success-bg | `#ecfdf3` | unknown | Palette color |
| unknown | `#3b82f6` | unknown | Palette color |

### CSS Variable Tokens

```css
--border-radius: 8px;
--normal-border: var(--gray4);
--success-border: hsl(145,92%,91%);
--info-border: hsl(221,91%,91%);
--warning-border: hsl(49,91%,91%);
--error-border: hsl(359,100%,94%);
--normal-border: hsl(0,0%,20%);
--normal-border: var(--gray3);
--normal-border: hsl(0,0%,20%);
--normal-border-hover: hsl(0,0%,25%);
--success-border: hsl(147,100%,12%);
--info-border: hsl(223,100%,12%);
--warning-border: hsl(60,100%,12%);
--error-border: hsl(357,89%,16%);
--un-border-spacing-x: 0;
--un-border-spacing-y: 0;
--un-border-spacing-x: 0;
--un-border-spacing-y: 0;
--un-border-opacity: 1;
--un-border-opacity: 1;
```


---

## 3. Typography Rules

**Font Stack:**
- **Cormorant Garamond** — Heading 1, Heading 2, Heading 3
- **Schibsted Grotesk** — Body, Caption
- **SFMono-Regular** — Code

**Font Sources:**

```css
@font-face {
  font-family: "Inter";
  src: url("fonts/Inter-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Inter";
  src: url("fonts/Inter-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Inter Display";
  src: url("fonts/InterDisplay-700.woff2") format("woff2");
  font-weight: 700;
}
@font-face {
  font-family: "Silkscreen";
  src: url("fonts/Silkscreen-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Silkscreen";
  src: url("fonts/Silkscreen-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "ApfelGrotezk";
  src: url("fonts/ApfelGrotezk-Regular.woff2") format("woff2");
  font-weight: 400;
}
@font-face {
  font-family: "Schibsted Grotesk";
  src: url("fonts/SchibstedGrotesk-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Schibsted Grotesk";
  src: url("fonts/SchibstedGrotesk-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Cormorant Garamond";
  src: url("fonts/CormorantGaramond-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Cormorant Garamond";
  src: url("fonts/CormorantGaramond-Regular.ttf") format("truetype");
  font-weight: 400;
}
```

| Role | Font | Size | Weight |
|---|---|---|---|
| Heading 1 | Cormorant Garamond | 8rem | 700 |
| Heading 2 | Cormorant Garamond | 6rem | 700 |
| Heading 3 | Cormorant Garamond | 72px | 700 |
| Body | Schibsted Grotesk | 14px | 400 |
| Caption | Schibsted Grotesk | 15px | 400 |
| Code | SFMono-Regular | 14px | 400 |

**Typographic Rules:**
- Limit to 3 font families max per screen
- Use **Cormorant Garamond** for body/UI text, **Schibsted Grotesk** for display/headings
- Maintain consistent hierarchy: no more than 3-4 font sizes per screen
- Headings use bold (600-700), body uses regular (400)
- Line height: 1.5 for body text, 1.2 for headings
- Use color and opacity for secondary hierarchy, not additional font sizes


---

## 4. Component Stylings

### Layout (1)

**Footer** — `html`

### Navigation (1)

**Navigation** — `html`

### Data Display (3)

**Card** — `html`
- Variants: `strip`, `strip--social`, `hover-canvas`, `preview`, `shot`

**Badge** — `html`

**List** — `html`

### Data Input (2)

**Button** — `html`
- Variants: `primary`
- Animation: 

**Input** — `html`
- State: :focus, :placeholder

### Overlay (1)

**Modal** — `html`

### Media (3)

**Image** — `html`

**Icon** — `html`

**Map/Canvas** — `html`



---

## 5. Layout Principles

- **Base spacing unit:** 4px
- **Spacing scale:** 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24
- **Border radius:** .125rem, .25rem, .375rem, .44rem, .5rem, .75rem, 1rem, 1px, 1.5rem, 2px, 2rem, 3px, 4px, 6px, 7px, 9px, 10px, 12px, 15px, 20%, 20px, 32px, inherit, 8px, 16px, 24px, 40px, 48px, 56px, 100%, 999px
- **Max content width:** 1024px

**Spacing as Meaning:**
| Spacing | Use |
|---|---|
| 4-8px | Tight: related items within a group |
| 12-16px | Medium: between groups |
| 24-32px | Wide: between sections |
| 48px+ | Vast: major section breaks |


---

## 6. Depth & Elevation

### Flat — subtle depth hints

- `0 0 0 2px #0006`
- `inset 0 1px #ffffff0d`
- `inset 0 1px #ffffffb3,0 1px 2px #0f172a0a`

### Raised — cards, buttons, interactive elements

- `var(--un-ring-offset-shadow),var(--un-ring-shadow),var(--un-shadow)`
- `inset 0 1px #ffffffe6,0 2px 8px #0f172a0f`
- `0 0 0 3px rgba(41,197,122,0.18)`

### Floating — dropdowns, popovers, modals

- `0 4px 12px #0000001a`
- `0 4px 12px #0000001a,0 0 0 2px #0003`
- `inset 0 1px #fffc,inset 0 0 20px rgb(var(--bolt-ds-brand)/.12),0 0 0 1px rgb(var(--bolt-ds-brand)/.35),0 0 20px rgb(var(--bolt-ds-brand)/.2),0 8px 20px #0f172a14`

### Overlay — full-screen overlays, top-level dialogs

- `0 24px 60px #0000008c`
- `0 24px 60px #1111141f`
- `inset 0 1px #ffffff14,inset 0 0 20px rgb(var(--bolt-ds-brand)/.18),0 0 0 1px rgb(var(--bolt-ds-brand)/.5),0 0 24px rgb(var(--bolt-ds-brand)/.45),0 10px 24px #060a1480`

### Z-Index Scale

`0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 21, 30, 40, 50, 60, 90, 99, 100, 995, 997, 998, 999, 1000, 9999, 999999999`



---

## 7. Animation & Motion

This project uses **expressive motion**. Animations are an integral part of the experience.

### CSS Animations

- `@keyframes swipe-out-left`
- `@keyframes swipe-out-right`
- `@keyframes swipe-out-up`
- `@keyframes swipe-out-down`
- `@keyframes sonner-fade-in`
- `@keyframes sonner-fade-out`
- `@keyframes sonner-spin`
- `@keyframes shadcn-down`

### Animated Components

- **Button**: 

### Motion Guidelines

- Duration: 150-300ms for micro-interactions, 300-500ms for page transitions
- Easing: `ease-out` for enters, `ease-in` for exits
- Always respect `prefers-reduced-motion`


---

## 8. Do's and Don'ts

### Do's

- Use `#96beff` for interactive elements (buttons, links, focus rings)
- Use `#ffffff` as the primary page background
- Pair **Cormorant Garamond** (body) with **Schibsted Grotesk** (display) — these are the only allowed fonts
- Follow the **4px** spacing grid for all margins, padding, and gaps
- Use the defined shadow tokens for elevation — see Section 6
- Use border-radius from the scale: .125rem, .25rem, .375rem, .44rem, .5rem
- Reuse existing components from Section 4 before creating new ones

### Don'ts

- Don't introduce colors outside this palette — extend the design tokens first
- Don't introduce additional font families beyond Cormorant Garamond and Schibsted Grotesk and SFMono-Regular
- Don't use arbitrary spacing values — stick to multiples of 4px
- Don't create custom box-shadow values outside the system tokens
- Don't use arbitrary border-radius values — pick from the defined scale
- Don't duplicate component patterns — check Section 4 first
- Don't use backdrop-blur or blur effects

### Anti-Patterns (detected from codebase)

- No blur or backdrop-blur effects
- No zebra striping on tables/lists


---

## 9. Responsive Behavior

| Name | Value | Source |
|---|---|---|
| xs | 420px | css |
| xs | 480px | css |
| sm | 540px | css |
| sm | 560px | css |
| sm | 600px | css |
| sm | 639.9px | css |
| sm | 640px | css |
| md | 720px | css |
| md | 767.9px | css |
| md | 768px | css |
| lg | 900px | css |
| lg | 980px | css |
| lg | 1024px | css |
| xl | 1025px | css |
| xl | 1130px | css |
| xl | 1200px | css |
| xl | 1280px | css |
| 2xl | 1536px | css |

**Approach:** Use `@media (min-width: ...)` queries matching the breakpoints above.


---

## 10. Agent Prompt Guide

Use these as starting points when building new UI:

### Build a Card

```
Background: #ffffff
Border: 1px solid #1e1e21
Radius: 9px
Padding: 16px
Font: Cormorant Garamond
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg #96beff, text white
Ghost: bg transparent, border #1e1e21
Padding: 8px 16px
Radius: 9px
Hover: opacity 0.9 or lighter shade
Focus: ring with #96beff
```

### Build a Page Layout

```
Background: #ffffff
Max-width: 1024px, centered
Grid: 4px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: #ffffff
Label: #ababab (muted, 12px, uppercase)
Value: #000000 (primary, 24-32px, bold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: #ffffff
Input border: 1px solid #1e1e21
Focus: border-color #96beff
Label: #ababab 12px
Spacing: 16px between fields
Radius: 9px
```

### General Component

```
1. Read DESIGN.md Sections 2-6 for tokens
2. Colors: only from palette
3. Font: Cormorant Garamond, type scale from Section 3
4. Spacing: 4px grid
5. Components: match patterns from Section 4
6. Elevation: shadow tokens
```
