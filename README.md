# 📌 Pinterest Media Studio & All-in-One Downloader

> **Pinterest Media Studio** is an ultra-fast, high-resolution media extraction & creative suite built with TypeScript, Node.js, and strictly governed by **Oxlint Anti-Slop** guardrails.

---

## 🌟 Key Features (ฟีเจอร์เด่นทั้งหมด)

### 1. 🎯 Single Pin Downloader
- **Original High-Res Image Extractor:** Automatically resolves genuine full-resolution images (`originals/` `.png` & `.jpg`) with zero 403 Forbidden errors.
- **1080p / 720p HD Video Downloader:** Extracts embedded MP4 video streams with audio.
- **🎨 Color Palette Extractor:** Generates a 5-color Hex swatch palette from any Pin with one-click copy.
- **📱 Smart Social Resizer:** Instant resizing to **9:16 (TikTok/Reels/Story)**, **1:1 (Post)**, and **4:5 (Portrait)** with automated **Smart Blur Background**.
- **🎨 Figma & Canva Ready:** One-click image copy to paste directly (`Ctrl + V`) into design tools.

### 2. 📦 Batch & Board Downloader to ZIP
- **Multi-URL Input:** Paste 10–50 URLs to extract concurrently.
- **Board Downloader:** Input a Pinterest Board URL to scrape all Pins.
- **ZIP Bundle Packager:** Downloads all extracted images & videos as a single `.zip` archive.

### 3. 🖼️ One-Click Moodboard Generator
- Generates professional collage moodboards from extracted Pins in **16:9 Landscape**, **A4 Print**, or **9:16 Story** formats.
- Export directly to high-resolution PNG.

### 4. 🛡️ Anti-Slop Quality Gate
- Super-fast **Oxlint** + Strict **TypeScript** validation.
- Zero `any`, zero unjustified type casts, zero runtime crashes.

---

## 🚀 Quick Start (เริ่มต้นใช้งาน)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Web Server
```bash
npm run dev
```
Open your browser at: **`http://localhost:3000`**

### 3. Run Quality Gate & Automated Tests
```bash
# Run strict linter and typecheck
npm run check

# Run automated test suite
npm test
```

---

## 📁 Project Architecture (โครงสร้างโปรเจกต์)

```text
├── src/
│   ├── extractors/
│   │   ├── pin-extractor.ts     # Single Pin & Video extractor
│   │   └── board-extractor.ts   # Batch & Board scraper
│   ├── processors/
│   │   ├── color-palette.ts     # Color palette generator
│   │   └── zip-packager.ts      # In-memory streaming ZIP packager
│   ├── server/
│   │   └── web-server.ts        # Fast HTTP Server & Full Responsive UI
│   ├── test-runner.ts           # Automated test suite
│   └── index.ts
├── .oxlintrc.json               # Anti-Slop Linter rules
├── tsconfig.json                # Strict TypeScript configuration
├── PINTEREST_APP_SPEC.md        # Master 25-Feature Specification & Roadmap
├── ANTI_SLOP_SUMMARY.md         # Video summary & Deterministic Linter guide
└── package.json
```

---

## 📄 Documentation Files
- 📘 [PINTEREST_APP_SPEC.md](PINTEREST_APP_SPEC.md): Full 25-feature roadmap & technical architecture.
- 📕 [ANTI_SLOP_SUMMARY.md](ANTI_SLOP_SUMMARY.md): Complete summary of the *Anti-Slop Your Code With This New Linter* concept.

---

## 📜 License
MIT License
