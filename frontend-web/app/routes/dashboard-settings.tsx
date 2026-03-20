import { useState } from "react";
import { useNavigate } from "react-router";
import { API_BASE, clearAuth, getToken } from "~/lib/auth";
import { useCats, type Cat } from "~/lib/cat-context";

export function meta() {
  return [{ title: "Settings – Cat Health" }];
}

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
  const navigate = useNavigate();
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
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
        clearAuth();
        navigate("/login");
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
      setEdit((s) => ({ ...s, error: "Could not connect to the server", saving: false }));
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
        clearAuth();
        navigate("/login");
        return;
      }
      if (res.ok) {
        onDeleted(cat.id);
      }
    } catch {
      // silently ignore
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <li className="bg-white border border-indigo-200 rounded-xl p-4">
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={edit.name}
              onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Breed</label>
              <input
                type="text"
                value={edit.breed}
                onChange={(e) => setEdit((s) => ({ ...s, breed: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
              <input
                type="number"
                min="0"
                value={edit.age}
                onChange={(e) => setEdit((s) => ({ ...s, age: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Birthday</label>
            <input
              type="date"
              value={edit.birthday}
              onChange={(e) => setEdit((s) => ({ ...s, birthday: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {edit.error && <p className="text-xs text-red-600">{edit.error}</p>}
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
              disabled={edit.saving}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {edit.saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
        {cat.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
        <p className="text-xs text-gray-400 truncate">
          {[
            cat.breed,
            cat.age != null ? `${cat.age} yr${cat.age !== 1 ? "s" : ""}` : null,
            cat.birthday ? `b. ${cat.birthday}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "No details"}
        </p>
      </div>
      <button
        onClick={startEdit}
        className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors shrink-0"
      >
        Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-40 shrink-0"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </li>
  );
}

export default function DashboardSettings() {
  const navigate = useNavigate();
  const { cats, refreshCats } = useCats();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [birthday, setBirthday] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAddCat(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const body: Record<string, string | number> = { name };
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
        clearAuth();
        navigate("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.detail ?? "Failed to add cat");
        return;
      }

      setName("");
      setBreed("");
      setAge("");
      setBirthday("");
      setShowForm(false);
      await refreshCats();
    } catch {
      setFormError("Could not connect to the server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cats</h2>
            <p className="text-sm text-gray-500">Manage your cats.</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Cat"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Add a cat</h3>
            <form onSubmit={handleAddCat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                  <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    min="0"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Adding…" : "Add Cat"}
              </button>
            </form>
          </div>
        )}

        {cats.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white border border-gray-200 rounded-2xl">
            <div className="text-4xl mb-2">🐾</div>
            <p>No cats yet. Add your first one!</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cats.map((cat) => (
              <CatRow
                key={cat.id}
                cat={cat}
                onDeleted={() => refreshCats()}
                onSaved={() => refreshCats()}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
