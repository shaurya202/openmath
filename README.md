<div align="center">

# 📐 OpenMath

### The Modern Open-Source AI Math Solver, Homework Assistant & Graphing Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Zero-Key Ready](https://img.shields.io/badge/Zero--Key-Offline%20Ready-emerald)](https://github.com/openmath-ai/openmath)

*A community-first, privacy-respecting alternative to proprietary platforms like MathGPT, Photomath, and Symbolab.*

[Features](#-key-features) • [Quickstart](#-quickstart) • [Docker Deployment](#-docker-deployment) • [Architecture](#-architecture) • [Contributing](#-contributing)

---

</div>

## 🌟 Why OpenMath?

Most AI math applications lock step-by-step solutions behind aggressive subscription paywalls, sell student data, or fail when network connectivity drops.

**OpenMath** is engineered from the ground up to be:
1. **100% Free & Open-Source:** No paywalls, subscriptions, or "parent-pay" barriers.
2. **Zero-Key Offline Ready:** Works immediately out of the box with zero mandatory API keys, using an offline symbolic evaluation engine and benchmark corpus.
3. **Pluggable Multi-Model AI:** Add a free Google Gemini key or your favorite OpenAI/Ollama/DeepSeek model for multimodal reasoning and handwriting recognition.
4. **Interactive Math Ergonomics:** Includes a cursor-aware virtual math keyboard, high-speed KaTeX rendering, and built-in 2D Cartesian graphing.

---

## 🚀 Key Features

| Feature | OpenMath (Open-Source) | MathGPT / Proprietary Apps |
|---|---|---|
| **Step-by-Step Derivation** | ✅ Full step breakdown with explanations | ⚠️ Gated behind $19.99/mo |
| **Photo / OCR Solver** | ✅ Client-side pre-processing + vision | ⚠️ Limited free daily credits |
| **Formula Keyboard** | ✅ Categorized LaTeX palette (Popular, Trig, Calc, Greek) | ✅ Available |
| **Graphing Calculator** | ✅ Dual engine: Native Canvas plotter + GeoGebra embed | ⚠️ Iframe only |
| **Study Suite** | ✅ SM-2 Spaced Repetition Flashcards + Timed Exams | ⚠️ Paywalled |
| **Homework Auto-Grader**| ✅ 4-point AP-style rubric analysis & feedback | ⚠️ Paywalled |
| **Offline Self-Hosting**| ✅ 100% functional with zero API keys required | ❌ Cloud proprietary only |

---

## 📸 Core Modules

### 1. 💬 AI Homework Solver
- Step-by-step mathematical reasoning with formatted LaTeX display math ($$...$$) and inline math ($...$).
- Problem formalization, intermediate derivations, and final answers highlighted in $\\boxed{\\text{canonical format}}$.
- **"📈 Plot in Grapher"** action chip automatically detects equations and passes them into the graphing calculator.

### 2. ⌨️ Virtual Math Keyboard & Formula Palette
- Categorized palettes:
  - **Popular:** $+$, $-$, $\times$, $\div$, $\frac{a}{b}$, $x^2$, $x^n$, $\sqrt{x}$, $\pi$, $\infty$, $\pm$, $\le$, $\ge$
  - **Algebra:** $x$, $y$, $z$, $|x|$, $\log$, $\ln$, $x_1$, $f(x)$, $n!$, $\binom{n}{k}$
  - **Calculus:** $\frac{d}{dx}$, $\int$, $\int_a^b$, $\lim_{x \to 0}$, $\sum$, $\partial$, $\nabla$
  - **Trigonometry:** $\sin$, $\cos$, $\tan$, $\arcsin$, $\arccos$, $\arctan$, $\sec$, $\theta$
  - **Greek & Logic:** $\alpha, \beta, \gamma, \delta, \lambda, \sigma, \omega, \Delta, \in, \cup, \cap, \implies$
- Cursor-aware insertion with auto-selection of template parameters.

### 3. 📈 Interactive 2D Graphing Calculator
- High-performance Cartesian coordinate engine rendered on HTML5 Canvas.
- Real-time function stack: plot polynomials, trigonometric waves, exponentials, and logarithms.
- Live crosshair coordinate readout: $(x, y)$.
- Zoom, pan, and reset controls with smooth mouse/touch interaction.
- **GeoGebra Embed Toggle:** 1-click switch to full GeoGebra 2D/3D applet for advanced geometric constructions.

### 4. 🧠 Spaced Repetition Flashcards & Study Suite
- Built-in SuperMemo **SM-2 algorithm** for optimal long-term memory retention.
- 3D interactive flip cards with question prompts and mathematical proofs.
- Rate recall difficulty (*Again, Hard, Good, Easy*) to calculate dynamic review intervals.

### 5. ⏱️ AP & College Diagnostic Exams
- Timed 10-minute diagnostic tests featuring Multiple Choice and Free Response questions.
- Instant automated scoring, confetti celebration, and step-by-step solution keys.

### 6. 📝 FRQ & Assignment Auto-Grader
- Rubric-based evaluation scoring student derivations across 4 dimensions:
  1. Conceptual Setup & Formula Selection (1 pt)
  2. Intermediate Algebraic / Calculus Derivation (1 pt)
  3. Dimensional & Unit Consistency (1 pt)
  4. Final Accuracy & Boxed Value (1 pt)

---

## ⚡ Quickstart

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v20 or later
- [pnpm](https://pnpm.io/) (recommended: `corepack enable && corepack prepare pnpm@latest --activate`)

### 2. Installation
```bash
git clone https://github.com/openmath-ai/openmath.git
cd openmath

# Install dependencies
pnpm install

# Run development server
pnpm dev
```
Navigate to **http://localhost:3000** in your browser.

---

## 🐳 Docker Deployment

Deploy OpenMath with a single command using Docker:

```bash
docker compose up -d
```
The application will be live at `http://localhost:3000`.

---

## ⚙️ Environment Variables (Optional)

OpenMath works **out of the box with zero keys**. To enable cloud AI reasoning and vision OCR:

Create a `.env.local` file (copy from `.env.example`):

```bash
# Optional: Google Gemini (Multimodal & Fast)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: OpenAI / OpenRouter / DeepSeek / Ollama
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
```

---

## 🧪 Testing

OpenMath includes a comprehensive test suite covering mathematical normalization, SM-2 algorithms, and offline providers:

```bash
# Run unit tests
pnpm test

# Verify production build
pnpm build
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
Built with ❤️ for students, educators, and math lovers everywhere.
</div>
