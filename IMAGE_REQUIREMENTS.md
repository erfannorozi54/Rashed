# Image Requirements

This file describes all images needed by the application.
Create each image and place it at the specified path.

---

## 1. Login Page Illustration

**File path:** `public/images/auth/login-illustration.webp`

**Usage:** Left decorative panel of the login page (`/auth/login`).
Displayed at ~80% of the panel width on a deep purple gradient background
(`#4c1d95` → `#6d28d9` → `#7c3aed`). Same panel layout as the registration page.

**Dimensions:** 1200 × 780 px (wide landscape, same ratio as the registration illustration)

**Format:** WebP (preferred) or PNG — **white background is fine**, the page applies `mix-blend-multiply` to blend it into the purple panel

**Style:** Modern flat paper-cut illustration — same aesthetic and quality as the registration page illustration. Clean layered depth with subtle drop shadows on elements.

**Content:**
- A stylized student or person character (gender-neutral silhouette, same lavender/light purple tone as the registration illustration) in a confident, welcoming pose — e.g. standing and reaching forward, or sitting at a laptop/phone
- The character is interacting with a glowing screen or a floating login card/portal
- Around the character, elements that suggest **secure access and identity**:
  - A large stylized key or a glowing shield with a checkmark inside (the central metaphor)
  - A padlock — open or mid-unlock — rendered cleanly in the same flat paper-cut style
  - Floating math formula bubbles (same speech-bubble cards as the registration image): `∫`, `π`, `x²` — fewer than the registration image, just 2–3 to maintain brand continuity
  - A floating OTP / verification code panel: a small card showing `_ _ _ _ _ _` (six dashes or boxes) to hint at the OTP login feature
  - Small sparkles, dots, and star accents in gold (#fbbf24) scattered around
- Background curves: a subtle sine wave or smooth arc passing behind the character (same style as the registration image's wave curves)

**Color palette** (must exactly match the registration illustration and site design system):
| Element                  | Color                                          |
|--------------------------|------------------------------------------------|
| Character silhouette     | Light lavender `#c4b5fd` / `#ddd6fe`          |
| Key / shield / padlock   | White `#ffffff` with lavender shadow           |
| Formula speech bubbles   | White `#ffffff` cards with dark purple text    |
| OTP card                 | White `#ffffff` card, boxes in light purple    |
| Background curves        | Medium purple `#7c3aed` at 30–50% opacity      |
| Gold accent sparkles     | `#fbbf24` / `#f59e0b`                         |
| Orange accent dots       | `#fb923c` (small, sparingly)                  |
| Shadows / depth          | Soft lavender `#a78bfa` at low opacity         |

**Mood:** Trustworthy, secure, welcoming. The image should feel like "you are safe here, come in."

**Do NOT use:**
- Photorealistic style
- Bright greens or reds
- Heavy dark outlines — keep the line work light and soft
- Cluttered composition — simpler than the registration image is fine

---

## 2. (Future) Home Page Hero Image

**File path:** `public/images/home/hero.png`

Wide format (1200 × 700 px). A classroom or study scene with Persian/Iranian
student aesthetic. Purple and gold accents matching the brand.
