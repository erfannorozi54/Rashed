# Image Requirements

This file describes all images needed by the application.
Create each image and place it at the specified path.

---

## 1. Registration Page Illustration

**File path:** `public/images/auth/register-illustration.png`

**Usage:** Left decorative panel of the registration page (`/auth/register`).
Displayed at ~260×260 px on a deep purple gradient background
(`#4c1d95` → `#6d28d9` → `#7c3aed`).

**Dimensions:** 600 × 600 px (square, will be scaled down)

**Format:** PNG with **transparent background**

**Style:** Modern flat vector illustration — clean, minimal, elegant.
Similar aesthetic to [undraw.co](https://undraw.co) but math-focused.

**Content:**
- A stylized student character (gender-neutral, simple silhouette)
  sitting at a small desk or floating in study pose
- Around the character, artistically placed math elements:
  - Formula cards or speech bubbles containing: `∫`, `Σ`, `π`, `x²`, `√x`, `f(x)=ax²`
  - A small open book or notebook
  - A triangle ruler and/or compass
  - A parabola / sine wave curve floating in the background
  - Tiny floating dots and stars as accents
- Optional: small graduation cap above or near the character

**Color palette** (must match the site's design system):
| Element          | Color                        |
|------------------|------------------------------|
| Main character   | White `#ffffff` or very light purple |
| Math symbols     | White `#ffffff` (primary) and Gold `#fbbf24` (accent) |
| Book / notebook  | White `#ffffff` with subtle shadow |
| Curves / shapes  | White `#ffffff` at 40–70% opacity |
| Accent dots      | Gold `#fbbf24` / `#f59e0b`  |
| Shadows          | Deep purple `#4c1d95` at low opacity |

**Do NOT use:**
- Solid dark backgrounds (image must have transparent bg)
- Bright reds, greens, or blues not in the palette
- Photorealistic style
- Text in the image

**How to replace the inline SVG:**
Once the image is created and placed at the path above, open
`src/app/auth/register/page.tsx`, find the `<MathIllustration />` component
inside the left panel, and replace it with:

```tsx
<Image
    src="/images/auth/register-illustration.png"
    alt="تصویر ثبت‌نام"
    width={260}
    height={260}
    className="object-contain drop-shadow-2xl"
    priority
/>
```

---

## 2. (Future) Login Page Illustration

**File path:** `public/images/auth/login-illustration.png`

Same style and palette as above. Content: a key or lock being unlocked,
combined with math elements, suggesting "access to knowledge."

---

## 3. (Future) Home Page Hero Image

**File path:** `public/images/home/hero.png`

Wide format (1200 × 700 px). A classroom or study scene with Persian/Iranian
student aesthetic. Purple and gold accents matching the brand.
