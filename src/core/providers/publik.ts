// publik.ts — publik API as one provider option. Resolution order:
// the user's own key > PUBLIK_API_KEY / PUBLIK_API_BASE_URL env > this app's
// credential file > provision on first launch (after the user accepts
// DISCLOSURE) > the user's own key again if provisioning fails.
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { arch, homedir, hostname, platform, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { IMathProvider, ProviderSolveRequest, MATH_SYSTEM_PROMPT, parseSolutionResponse } from "./types";
import { MathSolution } from "@/types";
import { extractGraphableFunctions } from "../math/latex";

export const APP_SLUG = "openmath";
export const APP_VERSION = "1.0.0";
export const DEFAULT_BASE_URL = "https://publikhq.com/api/v1";
/** Ask for a tier, never a vendor model name. */
export const MODELS = { fast: "publik-fast", balanced: "publik-balanced", smart: "publik-smart" } as const;
/** Show this and get a yes BEFORE provision(). */
export const DISCLOSURE =
  "This app can use publik API for its AI features: no key to paste, priced per use in dollars from a publik balance that starts at $0.00. " +
  "Linking this computer to a publik account gives $0.05 of free use, once. Your prompts go through publik's servers to the model; you can switch to your own key at any time.";

export interface PublikCredential {
  key: string;
  base_url: string;
  install_id: string;
  claim_url: string | null;
  claim_state: "anonymous" | "claimed";
  add_credit_url: string | null;
  cost_sentence: string | null;
  balance_micros: number | null;
}

export type Provider =
  | { kind: "own"; baseURL: string; apiKey: string }
  | { kind: "publik"; baseURL: string; apiKey: string; credential: PublikCredential | null }
  | { kind: "needs_consent" };

/** The app token. Public by design (it can only mint capped keys attributed to this app), so
 *  publik-app-token.txt is committed and read from this module's folder or the nearest parent.
 *  PUBLIK_APP_TOKEN in the environment overrides it. */
export function appToken(): string {
  const env = process.env.PUBLIK_APP_TOKEN?.trim();
  if (env) return env;
  try {
    const root = process.cwd();
    const rootFile = join(root, "publik-app-token.txt");
    if (existsSync(rootFile)) return readFileSync(rootFile, "utf8").trim();

    for (let dir = dirname(fileURLToPath(import.meta.url)); ; dir = dirname(dir)) {
      const file = join(dir, "publik-app-token.txt");
      if (existsSync(file)) return readFileSync(file, "utf8").trim();
      if (dirname(dir) === dir) break;
    }
  } catch {
    // fallback if fileURLToPath is unavailable in certain bundles
  }
  return "";
}

/** ~/Library/Application Support/publik/apps/<slug>.json, %LOCALAPPDATA%\publik\apps\<slug>.json, ~/.config/publik/apps/<slug>.json */
export function credentialPath(): string {
  const os = platform();
  let base: string;
  if (os === "darwin") {
    base = join(homedir(), "Library", "Application Support");
  } else if (os === "win32") {
    base = process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local");
  } else {
    // Linux / Serverless environments (e.g. Vercel, AWS Lambda)
    if (process.env.XDG_CONFIG_HOME) {
      base = process.env.XDG_CONFIG_HOME;
    } else if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      base = join(tmpdir(), ".config");
    } else {
      try {
        const home = homedir();
        base = existsSync(home) ? join(home, ".config") : join(tmpdir(), ".config");
      } catch {
        base = join(tmpdir(), ".config");
      }
    }
  }
  return join(base, "publik", "apps", `${APP_SLUG}.json`);
}

export function readCredential(): PublikCredential | null {
  const tryRead = (filePath: string) => {
    try {
      const c = JSON.parse(readFileSync(filePath, "utf8")) as PublikCredential;
      return typeof c.key === "string" && c.key.startsWith("pk_") ? c : null;
    } catch {
      return null;
    }
  };

  const primary = tryRead(credentialPath());
  if (primary) return primary;

  // Fallback to /tmp in serverless or constrained environments
  const fallbackPath = join(tmpdir(), ".config", "publik", "apps", `${APP_SLUG}.json`);
  if (fallbackPath !== credentialPath()) {
    return tryRead(fallbackPath);
  }
  return null;
}

export function writeCredential(c: PublikCredential): void {
  const file = credentialPath();
  try {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(c, null, 2), { mode: 0o600 });
    try {
      chmodSync(file, 0o600);
    } catch {
      // Windows / restricted fs chmod may be a no-op or throw
    }
  } catch {
    // If standard path is not writable (e.g. Vercel serverless sandbox), fallback to tmpdir
    try {
      const fallbackPath = join(tmpdir(), ".config", "publik", "apps", `${APP_SLUG}.json`);
      mkdirSync(dirname(fallbackPath), { recursive: true });
      writeFileSync(fallbackPath, JSON.stringify(c, null, 2), { mode: 0o600 });
    } catch {
      // In worst-case read-only environments, avoid unhandled ENOENT/EACCES
    }
  }
}

export function resolveProvider(userKey?: { baseURL: string; apiKey: string } | null): Provider {
  if (userKey?.apiKey) return { kind: "own", ...userKey };
  if (process.env.PUBLIK_API_KEY) {
    return { kind: "publik", baseURL: process.env.PUBLIK_API_BASE_URL ?? DEFAULT_BASE_URL, apiKey: process.env.PUBLIK_API_KEY, credential: null };
  }
  const c = readCredential();
  if (c) return { kind: "publik", baseURL: c.base_url || DEFAULT_BASE_URL, apiKey: c.key, credential: c };
  return { kind: "needs_consent" };
}

/** Call only after the user accepted DISCLOSURE. Throws a readable message; the caller offers the user's own key. */
export async function provision(): Promise<PublikCredential> {
  const token = appToken();
  if (!token.startsWith("pat_")) throw new Error("This build has no publik API app token. Use your own key for now.");
  const prior = readCredential();
  let installId = prior?.install_id ?? crypto.randomUUID();
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${DEFAULT_BASE_URL}/installs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        app_token: token, app_slug: APP_SLUG, app_version: APP_VERSION,
        os: platform() === "darwin" ? "macos" : platform() === "win32" ? "windows" : "linux",
        arch: arch(), device_name: hostname().slice(0, 120), install_id: installId,
        disclosure_version: 1, dialects: ["chat_completions"],
      }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, any>;
    const key: string | null = body.key ?? (res.status === 200 ? prior?.key ?? null : null);
    if ((res.status === 201 || res.status === 200) && key) {
      const c: PublikCredential = {
        key, base_url: body.base_url ?? DEFAULT_BASE_URL, install_id: body.install_id ?? installId,
        claim_url: body.claim_url ?? null, claim_state: body.claim_state ?? "anonymous",
        add_credit_url: body.wallet?.add_credit_url ?? null, cost_sentence: body.disclosure?.cost ?? null,
        balance_micros: body.balance_micros ?? null,
      };
      writeCredential(c); // the key reaches disk before anything else sees it
      return c;
    }
    // A replay with no key on disk, or an install its owner revoked: one fresh install_id.
    if (res.status === 200 || body.error?.type === "install_revoked") { installId = crypto.randomUUID(); continue; }
    throw new Error(body.error?.message ?? `publik API could not set up this computer (${res.status}). Use your own key for now.`);
  }
  throw new Error("publik API could not set up this computer. Use your own key for now.");
}

/** Builder check, run by the BUILT app: start it with PUBLIK_SELF_TEST=1, print this line, exit.
 *  It provisions for real; the builder who runs it is the consent. */
export async function selfTest(): Promise<string> {
  try {
    return `publik self-test: ok ${APP_SLUG} ${APP_VERSION} (install ${(await provision()).install_id.slice(0, 8)})`;
  } catch (e) {
    return `publik self-test: failed: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/** OpenAI-compatible client config: new OpenAI(clientConfig(p)). */
export function clientConfig(p: Extract<Provider, { kind: "own" | "publik" }>) {
  return { baseURL: p.baseURL, apiKey: p.apiKey };
}

/** First-run card, line 1. Then keep it live from the x-publik-balance header. A new install is $0.00 until it is linked. */
export function balanceLine(micros: number | null | undefined, claimState: "anonymous" | "claimed" = "anonymous"): string {
  if (micros == null) return "";
  const dollars = `$${(micros / 1_000_000).toFixed(2)}`;
  return micros === 0 && claimState === "anonymous" ? `${dollars} · link this computer for $0.05 of free use` : `${dollars} of publik balance`;
}

/** A 402 renders its message plus exactly ONE link: this one. */
export function topUpUrlFrom402(body: unknown): { message: string; url: string | null } {
  const e = (body as { error?: { message?: string; top_up_url?: string } } | null)?.error;
  return { message: e?.message ?? "Not enough publik API balance.", url: e?.top_up_url ?? null };
}

/** `POST /search`: web results for `q` (quote a phrase to find it exactly), one published price per search; on 402 the message and the one link. */
export async function search(p: Extract<Provider, { kind: "publik" }>, q: string, count = 10): Promise<{ results: Array<{ url: string; title: string; snippet: string; site: string }>; message?: string; url?: string | null }> {
  const res = await fetch(`${p.baseURL}/search`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${p.apiKey}` }, body: JSON.stringify({ q, count }) });
  const body = (await res.json().catch(() => ({}))) as { results?: Array<{ url: string; title: string; snippet: string; site: string }>; error?: { message?: string } };
  if (res.status === 402) return { results: [], ...topUpUrlFrom402(body) };
  if (!res.ok) throw new Error(body.error?.message ?? `publik API answered ${res.status}`);
  return { results: body.results ?? [] };
}

export class PublikProvider implements IMathProvider {
  readonly name = "publik API (publik-fast)";

  isAvailable(): boolean {
    const p = resolveProvider();
    if (p.kind === "publik" || p.kind === "own") return true;
    return Boolean(appToken() && appToken().startsWith("pat_"));
  }

  private async getActiveCredentials(): Promise<{ baseURL: string; apiKey: string }> {
    let p = resolveProvider();
    if (p.kind === "needs_consent") {
      const cred = await provision();
      return { baseURL: cred.base_url, apiKey: cred.key };
    }
    return { baseURL: p.baseURL, apiKey: p.apiKey };
  }

  async solve(request: ProviderSolveRequest): Promise<MathSolution> {
    const creds = await this.getActiveCredentials();
    const messages: Array<{ role: string; content: unknown }> = [{ role: "system", content: MATH_SYSTEM_PROMPT }];

    if (request.imageBase64 && request.imageMimeType) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: request.query || "Solve the math problem in this image." },
          {
            type: "image_url",
            image_url: {
              url: `data:${request.imageMimeType};base64,${request.imageBase64}`,
            },
          },
        ],
      });
    } else {
      messages.push({ role: "user", content: request.query });
    }

    const res = await fetch(`${creds.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.apiKey}`,
      },
      body: JSON.stringify({
        model: MODELS.fast,
        messages,
        temperature: 0.1,
      }),
    });

    if (res.status === 402) {
      const errJson = await res.json().catch(() => ({}));
      const { message, url } = topUpUrlFrom402(errJson);
      throw new Error(`publik balance exhausted: ${message} Top up at: ${url ?? "https://publikhq.com"}`);
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`publik API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return parseSolutionResponse("publik", content, request.query);
  }

  async *solveStream(request: ProviderSolveRequest): AsyncIterable<string> {
    const creds = await this.getActiveCredentials();
    const messages: Array<{ role: string; content: string }> = [{ role: "system", content: MATH_SYSTEM_PROMPT }];
    messages.push({ role: "user", content: request.query });

    const res = await fetch(`${creds.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.apiKey}`,
      },
      body: JSON.stringify({
        model: MODELS.fast,
        messages,
        stream: true,
      }),
    });

    if (res.status === 402) {
      const errJson = await res.json().catch(() => ({}));
      const { message, url } = topUpUrlFrom402(errJson);
      yield `[402 Error: ${message}. Top up at ${url ?? "https://publikhq.com"}]`;
      return;
    }

    if (!res.ok || !res.body) {
      const err = await res.text();
      throw new Error(`publik API stream error (${res.status}): ${err}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const jsonStr = trimmed.replace("data: ", "");
        if (jsonStr === "[DONE]") return;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Ignore SSE parse errors
        }
      }
    }
  }
}
