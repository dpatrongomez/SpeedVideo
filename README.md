<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SpeedVideo — Chrome Extension

> High-performance video speed controller with a sleek minimalist UI.

Control the playback speed of any video on any website directly from a polished Chrome popup. Supports keyboard shortcuts and persists settings per-session.

---

## Instalación

### 1. Build

```bash
pnpm install
pnpm build
```

### 2. Cargar en Chrome

1. Abre `chrome://extensions`
2. Activa **Modo desarrollador** (esquina superior derecha)
3. Haz clic en **"Cargar descomprimida"**
4. Selecciona la carpeta `dist/` generada

---

## Uso

- **Popup**: haz clic en el icono de la extensión para abrir el panel y ajusta la velocidad con el slider o los botones rápidos.
- **Teclado** (en cualquier página con vídeo):
  - `D` → +0.1× (más rápido)
  - `S` → −0.1× (más lento)
- El **toggle** del header activa/desactiva la extensión sin perder la velocidad configurada.
- Los ajustes se guardan automáticamente con `chrome.storage.sync`.

---

## Arquitectura

```
src/
├── main.tsx          # Entry point del popup React
├── App.tsx           # UI del popup (tabs: Speed, Settings, Stats, Domains)
├── content.ts        # Content script — controla video.playbackRate
├── background.ts     # Service worker — inicializa storage en instalación
└── index.css         # Estilos (TailwindCSS v4)

public/
├── manifest.json     # Chrome Extension Manifest V3
└── icons/            # Iconos 16×48×128px
```

### Flujo de mensajes

```
Popup (App.tsx)
  └── chrome.tabs.sendMessage("SET_SPEED") ──→ content.js
                                                └── video.playbackRate = speed
Teclado S/D ──────────────────────────────────→ content.js
chrome.storage.sync ←─────────────────────────→ Popup + background.js
```

---

## Desarrollo local (sin extensión)

```bash
pnpm dev   # arranca en http://localhost:3000
```

> [!NOTE]
> En modo `dev` las APIs de Chrome (`chrome.tabs`, `chrome.storage`) no están disponibles. El UI puede usarse pero no enviará mensajes reales a ninguna pestaña.

---

## Stack

- **React 19** + **TypeScript**
- **Vite 6** — build con múltiples entry points (popup, content, background)
- **TailwindCSS v4**
- **Framer Motion** — animaciones del popup
- **Chrome Extension Manifest V3**
