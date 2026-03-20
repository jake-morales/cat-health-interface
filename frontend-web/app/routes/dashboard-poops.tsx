import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { API_BASE, clearAuth, getToken } from "~/lib/auth";
import { useCats } from "~/lib/cat-context";

interface Poop {
  id: string;
  cat_id: string;
  timestamp: string;
  hardness: number;
}

export function meta() {
  return [{ title: "Poops – Cat Health" }];
}

const HARDNESS_COLORS = [
  "#6366f1", // 1 – indigo
  "#8b5cf6", // 2 – violet
  "#ec4899", // 3 – pink
  "#f97316", // 4 – orange
  "#eab308", // 5 – yellow
  "#22c55e", // 6 – green
  "#06b6d4", // 7 – cyan
];

const HARDNESS_OPTIONS = [
  { value: 1, label: "1 – Separate hard lumps" },
  { value: 2, label: "2 – Lumpy sausage" },
  { value: 3, label: "3 – Cracked sausage" },
  { value: 4, label: "4 – Smooth sausage" },
  { value: 5, label: "5 – Soft blobs" },
  { value: 6, label: "6 – Mushy" },
  { value: 7, label: "7 – Watery" },
];

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toLocalDatetimeValue(iso: string) {
  // Convert ISO string to datetime-local input value (YYYY-MM-DDTHH:MM)
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function HardnessPieChart({ poops }: { poops: Poop[] }) {
  const counts = HARDNESS_OPTIONS.map((o) => ({
    ...o,
    count: poops.filter((p) => p.hardness === o.value).length,
    color: HARDNESS_COLORS[o.value - 1],
  })).filter((o) => o.count > 0);

  const total = counts.reduce((sum, o) => sum + o.count, 0);

  // Build SVG pie slices
  const cx = 80, cy = 80, r = 70;
  let cumAngle = -Math.PI / 2;
  const slices = counts.map((o) => {
    const angle = (o.count / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...o, path, pct: Math.round((o.count / total) * 100) };
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Hardness breakdown</h2>
      <div className="flex items-center gap-6 flex-wrap">
        <svg viewBox="0 0 160 160" className="w-36 h-36 shrink-0">
          {slices.length === 1 ? (
            <circle cx={cx} cy={cy} r={r} fill={slices[0].color} />
          ) : (
            slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)
          )}
        </svg>
        <ul className="space-y-1.5 flex-1 min-w-0">
          {slices.map((s) => (
            <li key={s.value} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-gray-700 truncate">{s.label}</span>
              <span className="ml-auto text-gray-400 shrink-0">
                {s.count} ({s.pct}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PoopRow({
  poop,
  onUpdated,
  onDeleted,
}: {
  poop: Poop;
  onUpdated: (updated: Poop) => void;
  onDeleted: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [timestamp, setTimestamp] = useState("");
  const [hardness, setHardness] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setTimestamp(toLocalDatetimeValue(poop.timestamp));
    setHardness(String(poop.hardness));
    setError(null);
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/poops/${poop.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timestamp: new Date(timestamp).toISOString(),
          hardness: parseInt(hardness, 10),
        }),
      });
      if (res.status === 401) {
        clearAuth();
        navigate("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Failed to save");
        return;
      }
      const updated = await res.json();
      setEditing(false);
      onUpdated(updated);
    } catch {
      setError("Could not connect to the server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/poops/${poop.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) {
        clearAuth();
        navigate("/login");
        return;
      }
      if (res.ok) onDeleted(poop.id);
    } catch {
      // silently ignore
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <li className="bg-white border border-indigo-200 rounded-2xl px-5 py-4">
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              When <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Hardness <span className="text-red-500">*</span>
              <a
                href="https://www.amcny.org/wp-content/uploads/2020/09/Fecal-scoring-chart-without-header-1726x2048.jpg"
                target="_blank"
                rel="noreferrer"
                className="ml-1.5 text-indigo-500 hover:text-indigo-700 font-normal"
              >
                (chart)
              </a>
            </label>
            <select
              value={hardness}
              onChange={(e) => setHardness(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select…</option>
              {HARDNESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className="text-3xl">💩</div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{formatTimestamp(poop.timestamp)}</p>
        <p className="text-sm text-gray-500">
          Hardness: {poop.hardness} – {HARDNESS_OPTIONS.find((o) => o.value === poop.hardness)?.label.split("– ")[1] ?? "Unknown"}
        </p>
      </div>
      <button
        onClick={startEdit}
        className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </li>
  );
}

export default function DashboardPoops() {
  const navigate = useNavigate();
  const { selectedCat } = useCats();

  const [poops, setPoops] = useState<Poop[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [timestamp, setTimestamp] = useState(() => new Date().toISOString().slice(0, 16));
  const [hardness, setHardness] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPoops = useCallback(async () => {
    if (!selectedCat) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/poops/?cat_id=${selectedCat.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) {
        clearAuth();
        navigate("/login");
        return;
      }
      const data = await res.json();
      setPoops(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [selectedCat, navigate]);

  useEffect(() => {
    setPoops([]);
    fetchPoops();
  }, [fetchPoops]);

  async function handleAddPoop(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCat) return;
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/poops/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cat_id: selectedCat.id,
          timestamp: new Date(timestamp).toISOString(),
          hardness: parseInt(hardness, 10),
        }),
      });

      if (res.status === 401) {
        clearAuth();
        navigate("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.detail ?? "Failed to add poop");
        return;
      }

      const newPoop = await res.json();
      setPoops((prev) => [newPoop, ...prev]);
      setTimestamp(new Date().toISOString().slice(0, 16));
      setHardness("");
      setShowForm(false);
    } catch {
      setFormError("Could not connect to the server");
    } finally {
      setSubmitting(false);
    }
  }

  if (!selectedCat) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-64 text-center">
        <div className="text-5xl mb-3">🐾</div>
        <p className="text-gray-500">No cat selected. Add a cat first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Poops
          <span className="ml-2 text-base font-normal text-gray-500">— {selectedCat.name}</span>
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Poop"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Log a poop</h2>
          <form onSubmit={handleAddPoop} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hardness <span className="text-red-500">*</span>
                <a
                  href="https://my.royalcanin.com/UserFiles/Docs/Digital-Toolkit/gi-fecal-scoring-chart-cat.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1.5 text-indigo-500 hover:text-indigo-700 font-normal"
                >
                  (chart)
                </a>
              </label>
              <select
                value={hardness}
                onChange={(e) => setHardness(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select…</option>
                {HARDNESS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Logging…" : "Log Poop"}
            </button>
          </form>
        </div>
      )}

      {!loading && poops.length > 0 && <HardnessPieChart poops={poops} />}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : poops.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">💩</div>
          <p>No poops logged yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {poops.map((poop) => (
            <PoopRow
              key={poop.id}
              poop={poop}
              onUpdated={(updated) =>
                setPoops((prev) =>
                  prev
                    .map((p) => (p.id === updated.id ? updated : p))
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                )
              }
              onDeleted={(id) => setPoops((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
