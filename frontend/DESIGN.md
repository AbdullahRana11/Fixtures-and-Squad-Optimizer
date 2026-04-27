# Design System: Tactical Command Center
**Project ID:** Local-Fixtures-Optimizer

## 1. Visual Theme & Atmosphere
The interface is a **"Tactical HUD" (Heads-Up Display)** designed for high-density information management. It evokes the feeling of a futuristic military command center or a professional sports data terminal.
- **Vibe:** Precise, High-Tech, Immersive, and Reactive.
- **Aesthetic:** Dark-mode exclusive, utilizing "Glassmorphism" for depth and 3D interactivity for an "experience" feel.

## 2. Color Palette & Roles
*   **Deep Space Void (#090A0F):** The foundational canvas color. Deep, absolute black with a hint of navy.
*   **Tactical Obsidian (#12151E):** Used for primary UI panels and card backgrounds. Provides subtle contrast against the void.
*   **Sentient Mint (#00F260):** Primary action color and success indicator. High-contrast neon green.
*   **Kinetic Aqua (#05D5FF):** Secondary information and telemetry highlights. Sleek neon cyan.
*   **Psionic Purple (#B026FF):** Tertiary accent and "Special" category highlights.
*   **Crimson Danger (#FF2A55):** Critical alerts, errors, and high-risk actions.
*   **Glass Base (rgba(255, 255, 255, 0.05)):** The translucent base for all floating panels.
*   **Glass Border (rgba(255, 255, 255, 0.1)):** The razor-thin edge for holographic panels.

## 3. Typography Rules
*   **Headers:** 'Clash Display' (Sans-Serif). Bold, wide characters for a high-end editorial feel.
*   **Sub-Headers / Telemetry:** 'Space Mono' (Monospace). Used for data points, statistics, and terminal-style feedback.
*   **Body:** 'Outfit' (Sans-Serif). Clean, legible, and modern for general descriptions.

## 4. Component Stylings
*   **Buttons (Magnetic & Glowing):**
    - Shape: Rectangular with sharp or subtly rounded corners (4px).
    - Styling: Sentient Mint borders with a subtle outer glow. Uses "Magnetic" interaction (pulls toward cursor).
*   **Cards (3D Tilted Glass):**
    - Shape: Rectangular with generous rounding (16px).
    - Effect: Interactive 3D tilt with dynamic glare/reflection.
    - Border: Thin glass border (1px).
*   **Text (Decrypted/Hacked):**
    - Logic: Main titles reveal themselves via a "hacking" animation on hover or view.
*   **Backdrop (Hyperspeed/Grid):**
    - The entire background is a "Live" environment with warp-speed particles or a tactical scanning grid.

## 5. Layout Principles
*   **HUD Density:** Information is packed but organized into clear "Data Cells".
*   **Whitespace:** Minimal but intentional, used to create "breathing room" between major tactical sectors.
*   **Z-Index Hierarchy:** Interactive elements "hover" over the data grid with significant backdrop blur (12px - 20px).
