# Elixora Healthcare AI — Design System & Style Guide

Welcome to the **Elixora** design system documentation. This document serves as the authoritative source of truth for design tokens, typography, component specs, visual effects, and layout patterns across the Elixora web application.

---

## 1. Design Vision & Aesthetic

- **Theme Baseline**: Premium Dark Mode with glassmorphic cards, glowing ambient accents, and crisp monospaced clinical data displays.
- **Brand Identity**: Modern, trustworthy, and futuristic healthcare intelligence.
- **Core Principles**:
  - **High Contrast Readability**: High-legibility text against deep background tones (`#050507`).
  - **Fluid Micro-Animations**: Subtle hover transitions, interactive WebGL shaders (`SpecularButton`, `ParticleHandsCanvas`, `BreathOrb`).
  - **Tactile UI Elements**: Standardized 9999px rounded pill buttons, 16px rounded glass panels (`glass-panel`).

---

## 2. Color Palette & Design Tokens

### Primary Palette
| Token Name | HEX / Value | Role & Usage |
| :--- | :--- | :--- |
| `--bg-primary` / `--bg` | `#050507` | Main app canvas & body background |
| `--bg-secondary` / `--surface` | `#0A0E1A` | Elevated surface panels, cards, header background |
| `--surface-muted` | `rgba(255, 255, 255, 0.03)` | Subtle background fill for secondary list items / cards |
| `--border-subtle` / `--border` | `rgba(255, 255, 255, 0.08)` | Default border color for panels and dividers |

### Brand Accents & Glows
| Token Name | HEX / Value | Role & Usage |
| :--- | :--- | :--- |
| `--accent-blue` / `--accent` | `#3B82F6` | Primary brand accent color (buttons, active tabs, badges) |
| `--accent-blue-glow` | `#5B9CFF` | Hover state & ambient neon glow for primary CTAs |
| `--accent-dark` | `#2563EB` | Active pressed state for primary blue actions |
| `--accent-soft` | `rgba(59, 130, 246, 0.15)` | Background highlight tint for badges and icons |
| `--glow-a` | `rgba(91, 156, 255, 0.4)` | Radial glow effect A |
| `--glow-b` | `rgba(59, 130, 246, 0.1)` | Ambient background glow effect B |

### Typography Tokens
| Token Name | HEX / Value | Role & Usage |
| :--- | :--- | :--- |
| `--text-primary` / `--ink` | `#F5F5F7` | Headings, primary labels, main body text |
| `--text-secondary` / `--ink-muted` | `#9CA3AF` | Subtitles, helper descriptions, meta info |

### Status & Feedback Colors
| Status | HEX / Value | Usage |
| :--- | :--- | :--- |
| **Success / Normal** | `#10B981` (`emerald-500`) | Normal lab values, active online indicators |
| **Warning / Borderline** | `#F59E0B` (`amber-500`) | Borderline lab metrics, cautionary advice |
| **Danger / High Risk** | `#F43F5E` (`rose-500`) | Abnormal lab results, emergency red-flag triage alerts |

---

## 3. Typography & Hierarchy

- **Primary Font**: `"Geist Sans"`, `Inter`, `-apple-system`, `sans-serif`
- **Monospace Font**: `font-mono` (used for lab metric numbers, dosage metrics, code blocks)
- **Headline Font**: `font-headline` (negative letter spacing `-0.025em`)

### Type Scale
| Utility Class | Size | Line Height | Usage |
| :--- | :--- | :--- | :--- |
| `text-[10px]` | 10px | 14px | Micro badges, legal disclaimers |
| `text-xs` | 12px (0.75rem) | 16px | Subtitles, pill button labels (mobile), table headers |
| `text-sm` | 14px (0.875rem) | 20px | Standard body text, main button labels |
| `text-base` | 16px (1rem) | 24px | Card headers, lead paragraph text |
| `text-xl` | 20px (1.25rem) | 28px | Section headers |
| `text-3xl` | 30px (1.875rem) | 36px | Feature title headings |
| `text-6xl` | 60px (3.75rem) | 1.1 | Display landing hero headline |

---

## 4. Component Catalog & Button Specs

### 4.1 SpecularButton Component (`<SpecularButton />`)
A WebGL-powered interactive button component utilizing `ogl` shaders to render dynamic specular rim highlights that react to pointer distance and angle.

- **Source File**: [`components/ui/specular-button.tsx`](file:///d:/SGP5/components/ui/specular-button.tsx)
- **Styles File**: [`components/ui/specular-button.css`](file:///d:/SGP5/components/ui/specular-button.css)
- **Key Props**:
  - `size`: `"sm"` | `"md"` | `"lg"` (Default `"md"`)
  - `radius`: `9999` (Full pill shape)
  - `lineColor`: Specular highlight color (Default `#5227FF` or `#3B82F6`)
  - `baseColor`: Static edge stroke color (`#525252` or `#1E3A8A`)
  - `tint`: Background glass tint (`#FFFFFF`)
  - `tintOpacity`: Glass tint opacity (`0.05`)
  - `followMouse`: `true` (steers highlight toward cursor)

### 4.2 Standard Pill Buttons
- **Primary Pill (`.btn-pill-primary`)**:
  - Background: `#3B82F6`
  - Border-Radius: `9999px`
  - Hover: `#5B9CFF` with glow `shadow-[0_0_24px_rgba(59,130,246,0.45)]`
- **Secondary Pill (`.btn-pill-secondary`)**:
  - Background: `transparent` / `#FFFFFF`
  - Border: `1px solid rgba(255, 255, 255, 0.08)`
  - Text: `#F5F5F7` or `#000000`

### 4.3 Glassmorphic Panels (`.glass-panel`)
- **Background**: `#0A0E1A`
- **Border**: `1px solid rgba(255, 255, 255, 0.08)`
- **Border Radius**: `16px` (`rounded-2xl`)
- **Backdrop Blur**: `blur(12px)`
- **Hover Effect**: Subtle `-4px` Y-axis lift with `rgba(59, 130, 246, 0.15)` shadow.

---

## 5. Visual Effects & Shader Components

1. **`ParticleHandsCanvas`**: ASCII point-cloud WebGL particle visualization for the landing page hero section.
2. **`BreathOrb`**: Animated pulse/breath orb indicator used in branding and voice state indicators (`components/ui/breath-orb.tsx`).
3. **`Background Noise`** (`.bg-noise`): SVG fractal noise overlay at `0.035` opacity for tactile texture.

---

## 6. Layout & Spacing Principles

- **Grid System**: Flexbox & CSS Grid with standard Tailwind spacing scale (`gap-4`, `gap-6`, `gap-8`).
- **Max Containers**:
  - Hero Section: `max-w-6xl` (1152px)
  - Content Cards: `max-w-5xl` (1024px)
  - Navigation Header: `max-w-7xl` (1280px)
