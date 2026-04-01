import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { API_BASE, clearAuth, getToken } from "../../lib/auth";
import { useCats, type Cat } from "../../lib/cat-context";

// ─── Cat Row ──────────────────────────────────────────────────────────────────

interface EditState {
  name: string;
  breed: string;
  age: string;
  birthday: string;
  error: string | null;
  saving: boolean;
}

function CatRow({
  cat,
  onDeleted,
  onSaved,
}: {
  cat: Cat;
  onDeleted: (id: string) => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [edit, setEdit] = useState<EditState>({
    name: "",
    breed: "",
    age: "",
    birthday: "",
    error: null,
    saving: false,
  });

  function startEdit() {
    setEdit({
      name: cat.name,
      breed: cat.breed ?? "",
      age: cat.age != null ? String(cat.age) : "",
      birthday: cat.birthday ?? "",
      error: null,
      saving: false,
    });
    setEditing(true);
  }

  async function handleSave() {
    setEdit((s) => ({ ...s, saving: true, error: null }));
    const body: Record<string, string | number | null> = { name: edit.name };
    body.breed = edit.breed || null;
    body.age = edit.age ? parseInt(edit.age, 10) : null;
    body.birthday = edit.birthday || null;

    try {
      const res = await fetch(`${API_BASE}/cats/${cat.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        await clearAuth();
        router.replace("/login" as any);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEdit((s) => ({ ...s, error: data.detail ?? "Failed to save", saving: false }));
        return;
      }
      setEditing(false);
      onSaved();
    } catch {
      setEdit((s) => ({
        ...s,
        error: "Could not connect to the server",
        saving: false,
      }));
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/cats/${cat.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) {
        await clearAuth();
        router.replace("/login" as any);
        return;
      }
      if (res.ok) onDeleted(cat.id);
    } catch {
      // silently ignore
    } finally {
      setDeleting(false);
    }
  }

  const details = [
    cat.breed,
    cat.age != null ? `${cat.age} yr${cat.age !== 1 ? "s" : ""}` : null,
    cat.birthday ? `b. ${cat.birthday}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (editing) {
    return (
      <View style={[styles.catCard, styles.catCardEditing]}>
        <View style={styles.field}>
          <Text style={styles.label}>
            Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={edit.name}
            onChangeText={(v) => setEdit((s) => ({ ...s, name: v }))}
            autoFocus
          />
        </View>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Breed</Text>
            <TextInput
              style={styles.input}
              value={edit.breed}
              onChangeText={(v) => setEdit((s) => ({ ...s, breed: v }))}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={edit.age}
              onChangeText={(v) => setEdit((s) => ({ ...s, age: v }))}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Birthday (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={edit.birthday}
            onChangeText={(v) => setEdit((s) => ({ ...s, birthday: v }))}
            placeholder="YYYY-MM-DD"
          />
        </View>
        {edit.error && <Text style={styles.errorText}>{edit.error}</Text>}
        <View style={styles.editActions}>
          <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={edit.saving}
            style={[styles.saveBtn, edit.saving && styles.saveBtnDisabled]}
          >
            {edit.saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.catCard}>
      <View style={styles.catAvatar}>
        <Text style={styles.catAvatarText}>
          {cat.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.catInfo}>
        <Text style={styles.catName}>{cat.name}</Text>
        <Text style={styles.catDetails} numberOfLines={1}>
          {details || "No details"}
        </Text>
      </View>
      <Pressable onPress={startEdit}>
        <Text style={styles.editBtn}>Edit</Text>
      </Pressable>
      <Pressable onPress={handleDelete} disabled={deleting}>
        <Text style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}>
          {deleting ? "…" : "Delete"}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Add Cat Form ─────────────────────────────────────────────────────────────

function AddCatForm({
  onAdded,
  onCancel,
}: {
  onAdded: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const body: Record<string, string | number> = { name: name.trim() };
      if (breed) body.breed = breed;
      if (age) body.age = parseInt(age, 10);
      if (birthday) body.birthday = birthday;

      const res = await fetch(`${API_BASE}/cats/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        await clearAuth();
        router.replace("/login" as any);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Failed to add cat");
        return;
      }
      onAdded();
    } catch {
      setError("Could not connect to the server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Add a cat</Text>
      <View style={styles.field}>
        <Text style={styles.label}>
          Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </View>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Breed</Text>
          <TextInput
            style={styles.input}
            value={breed}
            onChangeText={setBreed}
          />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Birthday (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={birthday}
          onChangeText={setBirthday}
          placeholder="YYYY-MM-DD"
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Add Cat</Text>
        )}
      </Pressable>
      <Pressable onPress={onCancel}>
        <Text style={styles.cancelLink}>Cancel</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { cats, refreshCats } = useCats();
  const [showForm, setShowForm] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        {!showForm && (
          <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ Add Cat</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Cats</Text>
        <Text style={styles.sectionSubtitle}>Manage your cats.</Text>

        {showForm && (
          <AddCatForm
            onAdded={async () => {
              await refreshCats();
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {cats.length === 0 && !showForm ? (
          <View style={styles.emptyCard}>
            <FontAwesome5 name="paw" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No cats yet. Add your first one!</Text>
          </View>
        ) : (
          <View style={styles.catList}>
            {cats.map((cat) => (
              <CatRow
                key={cat.id}
                cat={cat}
                onDeleted={() => refreshCats()}
                onSaved={() => refreshCats()}
              />
            ))}
          </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  addBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  scrollContent: { padding: 16, gap: 12 },

  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  sectionSubtitle: { fontSize: 14, color: "#6b7280", marginTop: 2 },

  // Form
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    gap: 12,
  },
  formTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  field: { gap: 4 },
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1, gap: 4 },
  label: { fontSize: 13, fontWeight: "500", color: "#374151" },
  required: { color: "#ef4444" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  errorText: { fontSize: 13, color: "#dc2626" },
  submitBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  cancelLink: { textAlign: "center", fontSize: 14, color: "#6b7280" },

  // Cat list
  catList: { gap: 8 },
  catCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  catCardEditing: {
    borderColor: "#c7d2fe",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
  },
  catAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  catAvatarText: { fontSize: 14, fontWeight: "700", color: "#4338ca" },
  catInfo: { flex: 1, gap: 1 },
  catName: { fontSize: 14, fontWeight: "500", color: "#111827" },
  catDetails: { fontSize: 12, color: "#9ca3af" },
  editBtn: { fontSize: 14, color: "#4f46e5", fontWeight: "500" },
  deleteBtn: { fontSize: 14, color: "#ef4444", fontWeight: "500" },
  deleteBtnDisabled: { opacity: 0.4 },

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

  // Empty
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 14, color: "#9ca3af", textAlign: "center" },
});
