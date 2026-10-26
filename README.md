# Dayprint

<p align="center">
  <strong>Dayprint your life.</strong><br>
  <em>All the pieces of you, coming together.</em>
</p>

<p align="center">
  <a href="https://dayprint-five.vercel.app/"><strong>Live App Demo</strong></a> •
  <a href="https://dayprint-five.vercel.app/manual.html"><strong>Interactive User Manual</strong></a> •
  <a href="./docs/VIDEO-DEMO-SCRIPT.md"><strong>Video Script</strong></a> •
  <a href="./docs/DEVPOST-SUBMISSION.md"><strong>Devpost Package</strong></a>
</p>

---

> **Product Vision:** *Build your digital self. A digital self that grows with you.*  
> **Narrative:** *Every piece tells your story.*

Dayprint is a **tactile memory sanctuary and cognitive workspace** designed to help knowledge workers, developers, and thinkers unify their fragmented thoughts into an evolving digital twin. Built with zero centralized database dependencies, Dayprint stores your notes locally in your browser and automatically synchronizes them as plain Markdown files to your own private GitHub repository—giving you 100% data sovereignty.

---

# Project Details

### For Public Project Page
*Information entered below appears on the public project submission page.*

- **Project Title:** Dayprint
- **Tagline:** Dayprint your life. All the pieces of you, coming together. A tactile memory sanctuary cultivating your evolving digital self with 100% data sovereignty.
- **Try it out (Live Web App):** [https://dayprint-five.vercel.app/](https://dayprint-five.vercel.app/)
- **Interactive Manual:** [https://dayprint-five.vercel.app/manual.html](https://dayprint-five.vercel.app/manual.html)
- **Repository:** [https://github.com/katherinecym/Dayprint-app](https://github.com/katherinecym/Dayprint-app)

---

# Project Story

*About the project: What inspired us, what we learned, how we built it, the challenges we faced, and our future roadmap (formatted in Markdown with KaTeX math support).*

## Inspiration

In our digital lives, our thoughts and accomplishments are scattered across disconnected walled gardens:
- Our best architectural decisions and debugging wins disappear into closed Slack channels and pull requests;
- Our reading insights and study takeaways gather digital dust in disparate bookmark apps;
- Our fleeting reflections and emotional milestones evaporate in ephemeral phone memos.

When our memories are fractured, we lose touch with who we were and who we are becoming. Worse, proprietary cloud note services lock intimate personal data behind subscription paywalls and vendor shutdown risks.

We asked ourselves:
1. *What if all your living thoughts—work wins, study notes, and personal milestones—gathered into a single, cohesive sanctuary?*
2. *What if daily journaling felt as tactile, gentle, and satisfying as receiving an espresso receipt at an old neighborhood bookstore?*
3. *What if your notes naturally formed a living cognitive graph, evolving with you into a true digital twin—while remaining 100% owned by you in your own private GitHub repository as plain Markdown?*

That is why we created **Dayprint**.

---

## What it does

Dayprint is structured around three core views and daily reflective rituals:

### 1. Tab 1: Daily Canvas & Instant Scratchpad (`今日画卷 / 速记台`)
- **Ready-to-Type Scratchpad**: Opens expanded by default. Type quick thoughts without title or categorization friction.
- **AI STAR Polish**: Automatically structures unstructured work notes into Situation, Task, Action, and Result (STAR) bullet points for weekly reviews and promotion dossiers.
- **Companion Timeline & 5-Color Mood Wash**: Live timeline panel featuring daily reflection notes that synchronize in real time with thermal souvenir receipts, backed by Morandi mood washes (Terracotta, Fjord Blue, Honey Amber, Forest Moss, Twilight Lavender).
- **Echo Weave**: Intelligently surfaces past notes from 2–4 weeks ago discussing related themes to spark serendipitous connections.

### 2. Tab 2: Cognitive Ledger (`认知中枢账本`)
- **5-Stage Hierarchy ($L_0 \rightarrow L_4$)**: Elevates raw daily notes ($L_0$) into key wins ($L_1$), reusable workflows ($L_2$), mental models ($L_3$), and core principles ($L_4$).
- **Traceable Provenance (`source_ids`)**: Higher-order principles display a clickable badge (`"Derived from N notes"`), jumping directly back to the exact daily entry where the idea originated.
- **Confidence & Bilingual Meter**: Real-time visual confidence meters ($85\%+$ Green, $70\%+$ Amber, $<70\%$ Red) and native language indicators (`ZH` / `EN`).
- **Autonomous AI Distillation**: Synthesizes recent observations into candidate principles upon review.

### 3. Tab 3: Knowledge Graph (`知识图谱`)
- **Mondrian Tile Stream & Interactive Mesh**: Visualizes notes as interconnected cognitive nodes with category-coded Morandi hues.
- **Auto-Link Compiler**: Analyzes semantic tags, temporal proximity, and bidirectional `[[wikilinks]]` to dynamically reveal hidden patterns across projects and disciplines.

### 4. Thermal Souvenir Slips & Full Sovereignty
- **Physical Thermal Receipt Ritual**: Generates daily retrospective slips with realistic serrated edges, timestamped entries, and procedural Web Audio typing sounds.
- **100% Personal Data Sovereignty**: Operates without a middleman database. Notes reside in browser `localStorage` and sync directly to the user's private GitHub repository via GitHub REST API v3 as clean, Obsidian-compatible Markdown files.

---

## How we built it

Dayprint is built with a modern local-first fullstack architecture:

### Tech Stack Matrix
- **Core Framework:** [Next.js 16.4](https://nextjs.org/) (App Router, Turbopack, React 19, TypeScript 5)
- **Styling & Design System:** Tailwind CSS v4, custom Morandi physical paper textures, and responsive CSS masonry grids
- **Audio Synthesis:** Web Audio API programmatic mechanical typewriter keystroke synthesis (zero latency, zero external MP3 assets)
- **AI Engine:** Multi-provider LLM gateway (Google Gemini Pro, Claude 3.5, OpenAI GPT-4o) for STAR distillation and semantic link suggestions
- **Local-First Synchronization:** Client-side persistence with optimistic UI updates, debounced background GitHub commits, and `beforeunload` keepalive beacons

### Mathematical & Algorithmic Models

#### 1. Contextual Resonance & Link Formulation
The semantic and temporal resonance $\mathcal{R}(m_i, m_j)$ between two memory nodes $m_i, m_j \in \mathcal{M}$ is computed using high-dimensional cosine similarity weighted by exponential temporal decay:

$$\mathcal{R}(m_i, m_j) = \cos(\mathbf{v}_i, \mathbf{v}_j) \cdot \exp\left(-\lambda |t_i - t_j|\right) + \beta \cdot \mathcal{J}(\mathcal{T}_i, \mathcal{T}_j)$$

where:
- $\mathbf{v}_i, \mathbf{v}_j \in \mathbb{R}^d$ represent normalized embeddings of the memories,
- $\mathcal{J}(\mathcal{T}_i, \mathcal{T}_j) = \frac{|\mathcal{T}_i \cap \mathcal{T}_j|}{|\mathcal{T}_i \cup \mathcal{T}_j|}$ is the Jaccard similarity across topic taxonomies,
- $\lambda > 0$ is the memory half-life decay parameter, and
- $\beta$ is the taxonomic resonance weight.

#### 2. Information Entropy Reduction across the Cognitive Pyramid
The distillation process from raw notes ($L_0$) to core principles ($L_4$) systematically reduces information entropy while maximizing long-term stability:

$$H(L_0) > H(L_1) > H(L_2) > H(L_3) > H(L_4)$$

$$L_{k+1} = \operatorname{Distill}\left(\{m \in L_k \mid \operatorname{confidence}(m) \ge \theta_k\}\right), \quad \theta_k \in [0.70, 0.85]$$

#### 3. Local-First Zero-Data-Loss Invariant
To ensure seamless offline responsiveness with reliable cloud mirroring:

$$\text{State}_{\text{UI}} \xleftarrow{\Delta t = 0} \text{State}_{\text{Local}} \xrightarrow[\tau_{\text{debounce}} = 1500\text{ms}]{\text{GitHub REST v3}} \text{State}_{\text{Remote}}$$

$$\lim_{\text{tab close}} P(\text{Data Loss}) = 0 \quad \text{guaranteed via } \operatorname{fetch}(url, \{ \text{keepalive}: \text{true} \})$$

---

## Challenges we ran into

1. **Next.js 16 SSR Timezone & Hydration Mismatch**: Dynamic date formatting (`toLocaleDateString`) produces divergent strings on Node.js servers (UTC) versus client browsers (UTC+8), causing React hydration errors. We created deterministic date-slice utilities (`YYYY-MM-DD` and `HH:mm`) and localized date formatters with hydration guards.
2. **Masonry Subpixel Font Blurring**: Applying CSS rotations to physical cards inside dynamic columns induced micro-jitter in Chromium and WebKit. We enforced `transform-gpu backface-hidden will-change-transform` and isolated height computations to guarantee crisp text rendering.
3. **Browser Tab Close Data Loss**: Traditional web apps drop pending sync requests when a user abruptly navigates away. We implemented a dual-layer strategy: an in-memory queue flushed every 1.5s plus a `window.beforeunload` handler using `fetch(..., { keepalive: true })`.
4. **Bilingual Cognitive Consistency**: Preserving independent Chinese and English versions of memories without overwriting required a bidirectional auto-translation pipeline with strict fallback guards, ensuring English mode remains 100% free of untranslated leaks.

---

## Accomplishments that we're proud of

- **Tactile, Calming Design**: Crafted a Morandi paper aesthetic that turns daily reflection into a restorative ritual rather than a burdensome chore.
- **True User Ownership (Zero-Cloud Storage)**: Achieved full cross-device synchronization and version control via user-owned GitHub repositories without storing personal user notes on our own servers.
- **Seamless Dual-Mode Experience**: Built an instant **Demo Mode** (preloaded with 136 real-world engineering notes and 85 daily slips dating back to August 2026) alongside a clean **Production Mode** with clear 3-state save indicators (`Demo (Not Saved)`, `Local Cache Only`, `GitHub Synced`).
- **Complete Hackathon Delivery**: Delivered comprehensive planning specifications (`scope.md`, `prd.md`, `spec.md`), full test coverage (51 unit & integration tests), an interactive web manual (`manual.html`), and a synchronized demo video.

---

## What we learned

- **Spec-Driven Engineering Delivers Consistency**: Spending the first phase rigorously nailing down `scope.md`, `prd.md`, and `spec.md` prevented architectural drift and scope creep, enabling rapid, bug-free implementation.
- **Tactility Matters in Productivity**: Subtle details—procedural mechanical keyboard audio, torn thermal receipt edges, and gentle paper colors—dramatically boost user retention compared to sterile, corporate interfaces.
- **Data Sovereignty is the Future of Personal AI**: Users are rightfully hesitant to share their intimate career learnings and personal thoughts with proprietary platforms. Storing plain Markdown files in user-owned GitHub vaults unlocks uncompromised privacy and longevity.

---

## What's next for Dayprint

- **Physical Bluetooth Thermal Printer Output**: One-click ESC/POS printing to physical thermal receipt printers (e.g., Cat Printer, PeriPage) via the Web Bluetooth API.
- **Mobile PWA & Ambient Voice Journaling**: Installable mobile application with local whisper-based speech-to-text for frictionless voice memos on the go.
- **Interactive 3D Celestial Constellation**: Expanding the 2D Knowledge Graph into a 3D orbital constellation that maps life themes across multi-year horizons.
- **Obsidian Two-Way Sync Plugin**: Native Obsidian community plugin to bidirectional-sync local vaults with the Dayprint Web workspace.

---

# Repository Architecture & Submitted Contents

Below is the complete structure of everything included in this repository:

```
build-with-AI-basics/
├── README.md                      # Project story, overview, architecture & submission specs
├── scope.md                       # Devpost Phase 2: Kernel, user personas, & scope boundaries
├── prd.md                         # Devpost Phase 3: Product Requirements Document & user journeys
├── spec.md                        # Devpost Phase 4: Technical architecture & component specifications
├── USER-MANUAL.md                 # Complete bilingual user manual (English & 中文)
├── package.json                   # Dependencies (Next.js 16.4, React 19, Tailwind CSS v4)
├── next.config.ts                 # Next.js configuration with Turbopack & asset routing
│
├── docs/                          # Comprehensive Hackathon & Architecture Documentation
│   ├── DEVPOST-SUBMISSION.md      # Official Devpost submission package & copy
│   ├── VIDEO-DEMO-SCRIPT.md       # Synchronized demo video script & audio narration
│   ├── PRD-Dayprint-NextGen.md    # Multi-tenant BYOR & living memory specification
│   ├── TABS-SPEC.md               # Detailed specifications for Tabs 1, 2, and 3
│   └── DESIGN-ENHANCEMENT.md      # Morandi visual system & Web Audio specifications
│
├── public/                        # Static Assets & Standalone Web Manual
│   ├── manual.html                # Interactive, responsive bilingual user manual
│   ├── manual-assets/             # High-resolution screenshots of all app views & modals
│   ├── icon.svg                   # Dayprint official SVG icon
│   └── apple-icon.png             # Mobile application icon
│
└── src/                           # Complete Application Source Code
    ├── app/                       # Next.js 16 App Router
    │   ├── page.tsx               # Root application coordinator
    │   ├── layout.tsx             # Root HTML layout with metadata
    │   └── api/                   # API Routes (AI STAR polish, distill, obsidian sync, GitHub proxy)
    ├── components/                # React Components
    │   ├── canvas/                # Tab 1: TodayEditor, WeaveEcho, Timeline, Mood Wash
    │   ├── memory-os/             # Tab 2: Cognitive Ledger, L0-L4 hierarchy, confidence meters
    │   ├── graph/                 # Tab 3: Knowledge Graph, Mondrian layout, node inspector
    │   ├── receipts/              # Daily thermal souvenir slips with torn-paper edges
    │   ├── navigation/            # HeaderBar (with EN/中 toggle), ContextPanel (3-state save badge)
    │   ├── career/                # Career Studio Modal (STAR extraction & review exports)
    │   ├── constellation/         # Knowledge Constellation & wikilink inspector
    │   └── archive/               # Multi-week historical receipt archive modal
    ├── lib/                       # Core Utilities & Services
    │   ├── memory-context.tsx     # Centralized React state store & optimistic sync
    │   ├── date.ts                # Deterministic timezone-safe date utilities
    │   ├── audio.ts               # Web Audio API mechanical typewriter sound synthesizer
    │   ├── translator.ts          # Bidirectional auto-translation service
    │   └── seed-data.ts           # 136-item realistic demo dataset & 85 daily slips
    ├── types/                     # TypeScript Type Definitions
    │   └── memory.ts              # CanonicalMemory, Level, Provenance, & bilingual helpers
    └── tests/                     # Automated Vitest Test Suite (51 Tests Passing)
        ├── bilingual.test.ts      # Bilingual independence & [Untranslated] leak prevention
        ├── date.test.ts           # Timezone boundary & week calculation regression tests
        ├── memory.test.ts         # Core memory state mutations & lifecycle tests
        ├── seed-integrity.test.ts # Demo archive continuous date coverage validation
        └── welcome-gateway.test.ts# Setup & mode switching test suites
```

---

# Getting Started

### Prerequisites
- Node.js 18.18+ or 20+
- pnpm (recommended) or npm / yarn

### Installation & Local Run
```bash
# 1. Clone repository
git clone https://github.com/katherinecym/Dayprint-app.git
cd Dayprint-app

# 2. Install dependencies
pnpm install

# 3. Start local development server
pnpm dev

# 4. Open in browser
# http://localhost:3000
```

### Running Test Suite
```bash
# Run all 51 automated unit and integration tests
pnpm test
```

### Building for Production
```bash
# Verify typechecking and build production static bundle
pnpm build

# Run production server
pnpm start
```

---

# License

MIT License. Open source submission for the **Devpost "Build With AI: Basics" Hackathon**.
