# Contributing to OpenMath

Thank you for your interest in contributing to **OpenMath**! Together, we are building the world's best free and open-source AI math and STEM homework platform.

---

## 🛠️ Development Setup

### 1. Prerequisites
- **Node.js**: v20 or later (v22/v24 recommended)
- **Package Manager**: `pnpm` (recommended: `corepack enable && corepack prepare pnpm@latest --activate`)

### 2. Quickstart
```bash
# Clone the repository
git clone https://github.com/openmath-ai/openmath.git
cd openmath

# Install dependencies
pnpm install

# Start development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Guidelines
Run tests prior to submitting any PR:
```bash
# Run unit tests
pnpm test

# Verify production build
pnpm build
```

---

## 📐 Architecture Principles
1. **Zero-Key Compatibility:** Features should always function gracefully in offline mode without requiring third-party API keys.
2. **KaTeX Delimiter Safety:** Always normalize math strings via `normalizeLatexDelimiters` to avoid layout breaks during streaming.
3. **Ergonomic Math UX:** The formula keyboard should preserve cursor focus and insert clean LaTeX snippets.
4. **Accessible UI:** Follow WCAG 2.1 AA accessibility standards for all buttons, dialogs, and contrast ratios.

---

## 📝 Pull Request Checklist
- [ ] Code follows TypeScript strict typing (no `any` where avoidable).
- [ ] All unit tests pass (`pnpm test`).
- [ ] Production build succeeds (`pnpm build`).
- [ ] Relevant documentation updated in `README.md` or `ARCHITECTURE.md`.
