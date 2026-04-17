# Design System Specification: The Monastic Terminal

## 1. Overview & Creative North Star
**The Creative North Star: "The Silent Authority"**
This design system rejects the "gamified" noise of modern fintech. It aims to bridge the gap between the high-density information of a Bloomberg Terminal and the serene, focused environment of a premium notes app. We are building a "Digital Sanctuary" for capital—a place where the user feels in total control, unhurried, and intellectually empowered.

To achieve this, we move beyond generic templates. The layout should feel like a custom-tailored broadsheet newspaper: intentional white space, high-contrast typography, and a "paper-on-paper" layering strategy that replaces traditional UI clutter with architectural depth.

---

## 2. Colors & Tonal Architecture
The palette is strictly monochromatic, relying on luminosity rather than hue to guide the eye.

### Base Palette
- **Primary Surface (Base):** `#FFFFFF` (The foundation of the "paper" experience)
- **Secondary Surface:** `#F9FAFB` (For structural grouping)
- **Tertiary Surface:** `#F3F4F6` (For recessed areas like code blocks or navigation sidebars)

### Functional Accents
- **Growth (Profit):** `#16A34A` (Used only for data strings, never for structural UI)
- **Recession (Loss):** `#DC2626` (High-signal, used sparingly)
- **Action/Primary:** `#111827` (Pure Black for CTAs and focus)

### The "No-Line" Rule
Traditional 1px borders are a visual crutch. In this system, sections must be defined by **Tonal Shifts**. To separate a sidebar from a main feed, transition from `Primary BG` to `Secondary BG`. Use color shifts to denote boundaries; lines should only be used where data density is so high that eye-tracking becomes difficult (e.g., complex tables).

### Surface Hierarchy & Nesting
Treat the UI as physical layers of vellum. 
- **Level 0 (Background):** `Secondary BG` (#F9FAFB)
- **Level 1 (Cards/Content):** `Primary BG` (#FFFFFF)
- **Level 2 (Modals/Popovers):** `Primary BG` (#FFFFFF) with an ambient shadow.

---

## 3. Typography: The Editorial Voice
We use **Inter** as a functional, utilitarian typeface that feels like a precision instrument.

| Level | Size (Desktop/Mobile) | Weight | Token Name | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 36px / 28px | Bold | `display-lg` | Portfolio Total / Hero Numbers |
| **Headline** | 20px / 18px | Semi-Bold | `headline-sm` | Section Headings / Major Modules |
| **Title** | 15px | Semi-Bold | `title-sm` | Fund Names / Scheme Headers |
| **Body** | 14px | Regular | `body-md` | Secondary Details / Descriptions |
| **Label** | 12px | Medium | `label-sm` | Micro-data / Metadata / Captions |

**Editorial Note:** Use tight tracking (-0.02em) on Display sizes to give the numbers a "compact terminal" feel. Increase line-height on Body text (1.6) to maintain the "Notes App" readability.

---

## 4. Elevation & Depth
We eschew "Material" shadows in favor of **Tonal Layering** and **Ambient Diffusion**.

- **The Layering Principle:** Depth is achieved by stacking. Place a white (`#FFFFFF`) Fund Card on a grey (`#F9FAFB`) background. The 12px radius creates a soft corner that catches the eye without needing a high-contrast stroke.
- **Ambient Shadows:** For floating elements like Modals, use a "Ghost Shadow": `0 10px 30px rgba(0,0,0,0.04)`. It should feel like a soft glow of shadow rather than a hard drop.
- **The "Ghost Border":** If a border is required for accessibility, use the `Border` token (#E5E7EB) but set its opacity to 60%. It should be felt, not seen.
- **Glassmorphism:** For top navigation bars, use `Primary BG` at 80% opacity with a `backdrop-blur(12px)`. This keeps the "Terminal" feel while allowing the content to flow beneath the navigation.

---

## 5. Components

### Fund Cards
- **Architecture:** 12px corner radius, 1px border (#E5E7EB), and a subtle shadow (`0 1px 3px rgba(0,0,0,0.06)`).
- **Styling:** No dividers between the fund name and the value. Use 24px of vertical padding to create a "gallery" feel.

### Buttons (The Black Action)
- **Primary:** Background: `#111827`, Text: `#FFFFFF`, Radius: 8px.
- **Secondary:** Background: `#FFFFFF`, Border: 1px `#E5E7EB`, Text: `#111827`.
- **States:** On hover, the Primary button should shift to 90% opacity. No heavy transforms.

### Inputs & Fields
- **Container:** 8px radius, Background: `#F9FAFB`, Border: 1px `#E5E7EB`.
- **Focus State:** Border color shifts to `Border Strong` (#D1D5DB). Avoid glowing blue focus rings; use a 2px solid black ring for accessibility.

### Data Lists
- **Rule:** Forbid the use of divider lines.
- **Alternative:** Use `16px` of vertical white space to separate list items. For hovering states, change the background of the entire row to `#F3F4F6`.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace Asymmetry:** Align high-level stats to the left and secondary metadata to the right to create a sophisticated, non-template look.
- **Use "Ink" Hierarchy:** Use `Text Primary` for the "What" (Amount) and `Text Secondary` for the "How" (Label).
- **Prioritize Breathing Room:** If a screen feels crowded, increase the padding rather than adding a border.

### Don’t:
- **No Color Bleed:** Do not use blue for links. All links are `Text Primary` with an underline or `Text Secondary` without.
- **No Rounded Corners Overload:** Keep buttons at 8px. Only Modals and Cards get the softer 12px-16px treatment. This maintains the "Professional Tool" aesthetic.
- **No Icons as Decoration:** Every Lucide icon (1.5px stroke) must serve a functional purpose. If it doesn't help the user navigate, remove it.

### Accessibility Note:
While we use a monochrome palette, ensure that the "Profit" Green and "Loss" Red have sufficient contrast against the white background. Use `Text Secondary` (#6B7280) for labels to ensure we meet WCAG AA standards for readability.