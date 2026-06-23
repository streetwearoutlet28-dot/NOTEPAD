# Mentora Note-Taking & Document Dashboard (React + TypeScript + TailwindCSS)

A pixel-perfect, highly polished SaaS dashboard interface inspired by the modern **Mentora UI Kit** built with React, TypeScript, and TailwindCSS. Exposes document toolkit utilities (quizzes, summary cards, 3D flipping flashcards), page indexes, thumbnail masonry layouts, and regional time/language preferences.

---

## Key Features Implemented

1. **Mentora-Inspired Aesthetics**:
   - Clean fonts powered by **Onest** (Google Fonts) for titles, metadata, and body.
   - JetBrains Mono typography for structured monospace notes or conceptual layouts.
   - Deep charcoal anthracite containers (`#1E1E1E`) and dark sidebar (`#2D2D2D`) with border hierarchy (`#3F3F3F`) for Dark Mode.
   - Clean white containers (`#FFFFFF`) on subtle off-white backgrounds with soft grey borders for Light Mode.
   - High corner radius (`rounded-2xl` / `rounded-3xl` or `16px`-`24px`) for visual harmony.

2. **Persistent Sidebar Navigation**:
   - **Workspace Selector**: Dropdown menu allows switching between workspaces (e.g. `TestHive`, `Mentora`).
   - **New Document Button**: Prominent orange call-to-action button to spawn fresh document records.
   - **Search Bar**: Quick inline global text search that dynamically filters document titles and paragraphs.
   - **Navigation Tree**: nested collapsible directories for logical directories:
     - 📁 Library (Cover, Get Started, Style Guide)
     - 📁 Projects (expandable projects section)
     - 📄 Recent Documents list (displays active documents with text overflow ellipsis)
   - **Profile Card**: Displays avatar initials, full name, email, and a clickable Settings cog at the bottom.

3. **Workspace Split-Screen Layout**:
   - **Header Tabs Bar**: Top sub-tabs displaying active document tabs, action buttons ("Upgrade" in orange, "Share"), and mock macOS traffic lights.
   - **Left Column (Document Viewer)**:
     - Renders document title, type, date, and prepared-for metadata cards.
     - Document sections with styled paragraph flows and monospace code block highlights.
     - **Anchor Index Overlay**: Floating Index menu lists subheadings and smoothly scrolls the viewport to headings when clicked.
     - **Gallery Masonry View**: Toggleable grid view alternative showing page thumbnail cards labeled "Page 01", "Page 02", etc. Clicking a card opens that page in the reader.
   - **Right Column (Toolkit Panel)**:
     - Tabbed sections for `Quiz Generation` (interactive quizzes, mock starting card, and quick prompt input), `Flashcards` (interactive flashcards that flip in 3D on click), and `Summary` (list card blocks condensing content).

4. **Advanced Settings Page**:
   - Tab options: `Profile Settings` and `General Settings`.
   - **Regional Preferences**:
     - Language Dropdown: Toggle between English 🇺🇸, Romanian 🇷🇴, and Hungarian 🇭🇺 with flags next to selections.
     - Timezone Selector: GMT time offsets.
     - Time Format: 12-hour vs 24-hour radio options.
     - Data Format: Dropdown selection (e.g., `DD/MM/YY`, `YYYY-MM-DD`).
   - **Theme Options**: Interactive visual cards showing Light, Dark, and System theme layouts with visual layout previews. Selecting a card switches the theme instantly.

5. **Theme Capsule Indicator**:
   - Large, rounded indicator capsule floating at the bottom center of the viewport, showing the Sun or Moon icon along with the active theme mode on theme changes, fading out smoothly after 2.5 seconds.

---

## Tech Stack

- **React 18 & TypeScript**: Core UI state coordination.
- **Tailwind CSS**: Pixel-perfect grid alignment, responsive spacing, and theme variables.
- **PostCSS & Autoprefixer**: Compilation pipeline.
- **Lucide React**: Crisp vector icons.
- **Electron**: Shell container to run as a macOS native app.
- **electron-store**: Settings persistence (language, timezones, themes, zoom, document state) saved on a 2-second debounce.

---

## Getting Started

### Installation

1. Navigate to the project folder:
   ```bash
   cd /Users/swo/Documents/GitHub/NOTEPAD
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```

### Running Locally

To run the application in development mode with live reloading:
```bash
npm start
```
This boots the TypeScript compiler, launches Vite, and runs the Electron app shell showing the dashboard.

### Packaging macOS DMG

To bundle and package the application into a `.dmg` installer for personal use:
```bash
npm run build
```
The output package will be generated inside the `dist/` directory as `Notepad-1.0.0-arm64.dmg`.
