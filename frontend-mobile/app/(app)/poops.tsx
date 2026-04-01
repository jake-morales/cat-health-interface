import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { API_BASE, clearAuth, getToken } from "../../lib/auth";
import { useCats } from "../../lib/cat-context";
import { useSidebar } from "./_layout";

// ─── Constants ────────────────────────────────────────────────────────────────

interface Poop {
  id: string;
  cat_id: string;
  timestamp: string;
  hardness: number;
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

// ─── Hardness Picker Modal ────────────────────────────────────────────────────

function HardnessPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: number | null;
  onSelect: (v: number) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.pickerSheet}>
        <Text style={styles.pickerTitle}>Select Hardness</Text>
        {HARDNESS_OPTIONS.map((o) => (
          <Pressable
            key={o.value}
            style={[
              styles.pickerOption,
              selected === o.value && styles.pickerOptionActive,
            ]}
            onPress={() => {
              onSelect(o.value);
              onClose();
            }}
          >
            <View
              style={[
                styles.pickerDot,
                { backgroundColor: HARDNESS_COLORS[o.value - 1] },
              ]}
            />
            <Text
              style={[
                styles.pickerOptionText,
                selected === o.value && styles.pickerOptionTextActive,
              ]}
            >
              {o.label}
            </Text>
            {selected === o.value && (
              <FontAwesome5 name="check" size={14} color="#4338ca" />
            )}
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

// ─── Hardness Breakdown ───────────────────────────────────────────────────────

function HardnessBreakdown({ poops }: { poops: Poop[] }) {
  const total = poops.length;
  const rows = HARDNESS_OPTIONS.map((o) => ({
    ...o,
    count: poops.filter((p) => p.hardness === o.value).length,
    color: HARDNESS_COLORS[o.value - 1],
  })).filter((o) => o.count > 0);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Hardness breakdown</Text>
      {rows.map((o) => {
        const pct = Math.round((o.count / total) * 100);
        return (
          <View key={o.value} style={styles.barRow}>
            <View style={[styles.barDot, { backgroundColor: o.color }]} />
            <Text style={styles.barLabel} numberOfLines={1}>
              {o.label}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${pct}%` as any, backgroundColor: o.color },
                ]}
              />
            </View>
            <Text style={styles.barCount}>
              {o.count} ({pct}%)
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Poop Row ─────────────────────────────────────────────────────────────────

function PoopRow({
  poop,
  onUpdated,
  onDeleted,
}: {
  poop: Poop;
  onUpdated: (p: Poop) => void;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hardness, setHardness] = useState(poop.hardness);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setHardness(poop.hardness);
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
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
          timestamp: poop.timestamp,
          hardness,
        }),
      });
      if (res.status === 401) {
        await clearAuth();
        router.replace("/login" as any);
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
        await clearAuth();
        router.replace("/login" as any);
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
      <View style={[styles.poopCard, styles.poopCardEditing]}>
        <HardnessPickerModal
          visible={pickerOpen}
          selected={hardness}
          onSelect={setHardness}
          onClose={() => setPickerOpen(false)}
        />
        <Text style={styles.editTimestamp}>{formatTimestamp(poop.timestamp)}</Text>
        <Text style={styles.editLabel}>Hardness</Text>
        <Pressable
          style={styles.pickerButton}
          onPress={() => setPickerOpen(true)}
        >
          <View
            style={[
              styles.pickerButtonDot,
              { backgroundColor: HARDNESS_COLORS[hardness - 1] },
            ]}
          />
          <Text style={styles.pickerButtonText}>
            {HARDNESS_OPTIONS.find((o) => o.value === hardness)?.label ?? "Select…"}
          </Text>
          <FontAwesome5 name="chevron-down" size={12} color="#6b7280" />
        </Pressable>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.editActions}>
          <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  const hardnessOption = HARDNESS_OPTIONS.find((o) => o.value === poop.hardness);

  return (
    <View style={styles.poopCard}>
      <FontAwesome5 name="poop" size={24} color="#8b5cf6" />
      <View style={styles.poopInfo}>
        <Text style={styles.poopTimestamp}>{formatTimestamp(poop.timestamp)}</Text>
        <Text style={styles.poopHardness}>
          Hardness: {poop.hardness} –{" "}
          {hardnessOption?.label.split("– ")[1] ?? "Unknown"}
        </Text>
      </View>
      <View style={styles.poopActions}>
        <Pressable onPress={startEdit}>
          <Text style={styles.editBtn}>Edit</Text>
        </Pressable>
        <Pressable onPress={handleDelete} disabled={deleting}>
          <Text style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}>
            {deleting ? "…" : "Delete"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Add Poop Form ────────────────────────────────────────────────────────────

function AddPoopForm({
  catId,
  onAdded,
  onCancel,
}: {
  catId: string;
  onAdded: (p: Poop) => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [hardness, setHardness] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!hardness) {
      setError("Please select a hardness");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/poops/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cat_id: catId,
          timestamp: new Date().toISOString(),
          hardness,
        }),
      });
      if (res.status === 401) {
        await clearAuth();
        router.replace("/login" as any);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Failed to add poop");
        return;
      }
      const newPoop = await res.json();
      onAdded(newPoop);
    } catch {
      setError("Could not connect to the server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.card}>
      <HardnessPickerModal
        visible={pickerOpen}
        selected={hardness}
        onSelect={setHardness}
        onClose={() => setPickerOpen(false)}
      />
      <Text style={styles.cardTitle}>Log a poop</Text>

      <Text style={styles.editLabel}>Hardness</Text>
      <Pressable style={styles.pickerButton} onPress={() => setPickerOpen(true)}>
        {hardness ? (
          <>
            <View
              style={[
                styles.pickerButtonDot,
                { backgroundColor: HARDNESS_COLORS[hardness - 1] },
              ]}
            />
            <Text style={styles.pickerButtonText}>
              {HARDNESS_OPTIONS.find((o) => o.value === hardness)?.label}
            </Text>
          </>
        ) : (
          <Text style={styles.pickerButtonPlaceholder}>Select hardness…</Text>
        )}
        <FontAwesome5 name="chevron-down" size={12} color="#6b7280" />
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        style={[styles.logBtn, submitting && styles.logBtnDisabled]}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.logBtnText}>Log Poop</Text>
        )}
      </Pressable>

      <Pressable onPress={onCancel}>
        <Text style={styles.cancelLink}>Cancel</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PoopsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toggle } = useSidebar();
  const { selectedCat } = useCats();

  const [poops, setPoops] = useState<Poop[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchPoops = useCallback(async () => {
    if (!selectedCat) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/poops/?cat_id=${selectedCat.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) {
        await clearAuth();
        router.replace("/login" as any);
        return;
      }
      const data = await res.json();
      setPoops(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [selectedCat]);

  useEffect(() => {
    setPoops([]);
    fetchPoops();
  }, [fetchPoops]);

  if (!selectedCat) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={toggle} style={styles.hamburger}>
            <FontAwesome5 name="bars" size={20} color="#374151" />
          </Pressable>
          <Text style={styles.headerTitle}>Poops</Text>
        </View>
        <View style={styles.emptyCenter}>
          <FontAwesome5 name="paw" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No cat selected. Add a cat first.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={toggle} style={styles.hamburger}>
          <FontAwesome5 name="bars" size={20} color="#374151" />
        </Pressable>
        <Text style={styles.headerTitle}>
          Poops{" "}
          <Text style={styles.headerCatName}>— {selectedCat.name}</Text>
        </Text>
        {!showForm && (
          <Pressable
            style={styles.addBtn}
            onPress={() => setShowForm(true)}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {showForm && (
          <AddPoopForm
            catId={selectedCat.id}
            onAdded={(p) => {
              setPoops((prev) =>
                [p, ...prev].sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )
              );
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {!loading && poops.length > 0 && <HardnessBreakdown poops={poops} />}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} color="#4f46e5" />
        ) : poops.length === 0 && !showForm ? (
          <View style={styles.emptyCenter}>
            <FontAwesome5 name="poop" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No poops logged yet.</Text>
          </View>
        ) : (
          poops.map((poop) => (
            <PoopRow
              key={poop.id}
              poop={poop}
              onUpdated={(updated) =>
                setPoops((prev) =>
                  prev
                    .map((p) => (p.id === updated.id ? updated : p))
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                )
              }
              onDeleted={(id) =>
                setPoops((prev) => prev.filter((p) => p.id !== id))
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  hamburger: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#111827" },
  headerCatName: { fontSize: 14, fontWeight: "400", color: "#6b7280" },
  addBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  scrollContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },

  // Breakdown
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barDot: { width: 10, height: 10, borderRadius: 2 },
  barLabel: { width: 130, fontSize: 12, color: "#374151" },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
  barCount: { fontSize: 11, color: "#9ca3af", width: 56, textAlign: "right" },

  // Poop row
  poopCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  poopCardEditing: {
    borderColor: "#c7d2fe",
    flexDirection: "column",
    alignItems: "stretch",
  },
  poopInfo: { flex: 1, gap: 2 },
  poopTimestamp: { fontSize: 14, fontWeight: "600", color: "#111827" },
  poopHardness: { fontSize: 13, color: "#6b7280" },
  poopActions: { flexDirection: "row", gap: 12 },
  editBtn: { fontSize: 14, color: "#4f46e5", fontWeight: "500" },
  deleteBtn: { fontSize: 14, color: "#ef4444", fontWeight: "500" },
  deleteBtnDisabled: { opacity: 0.4 },

  // Edit mode
  editTimestamp: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  editLabel: { fontSize: 13, fontWeight: "500", color: "#374151" },
  editActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  cancelBtnText: { fontSize: 14, color: "#6b7280" },
  saveBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 64,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  // Hardness picker button
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  pickerButtonDot: { width: 10, height: 10, borderRadius: 2 },
  pickerButtonText: { flex: 1, fontSize: 14, color: "#111827" },
  pickerButtonPlaceholder: { flex: 1, fontSize: 14, color: "#9ca3af" },

  // Log button
  logBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  logBtnDisabled: { opacity: 0.5 },
  logBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  cancelLink: { textAlign: "center", fontSize: 14, color: "#6b7280" },

  // Error
  errorText: { fontSize: 13, color: "#dc2626" },

  // Empty state
  emptyCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: { fontSize: 16, color: "#6b7280", textAlign: "center" },

  // Modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  pickerSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    gap: 4,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  pickerOptionActive: { backgroundColor: "#eef2ff" },
  pickerDot: { width: 10, height: 10, borderRadius: 2 },
  pickerOptionText: { flex: 1, fontSize: 14, color: "#374151" },
  pickerOptionTextActive: { color: "#4338ca", fontWeight: "500" },
});
