import { useState } from "react";
import { API_BASE, clearAuth, getToken } from "~/lib/auth";
import { useCats, type Cat } from "~/lib/cat-context";
import { useNavigate } from "react-router";

export function meta() {
  return [{ title: "My Cats – Cat Health" }];
}

export default function DashboardCats() {
  const navigate = useNavigate();
  const { cats, selectedCat, setSelectedCat, refreshCats } = useCats();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [birthday, setBirthday] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDeleteCat(cat: Cat) {
    setDeletingId(cat.id);
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
        // If we deleted the selected cat, refreshCats will auto-select the first remaining one
        await refreshCats();
      }
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Cats</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Cat"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a cat</h2>
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
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🐾</div>
          <p>No cats yet. Add your first one!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {cats.map((cat) => (
            <li
              key={cat.id}
              className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4"
            >
              <div className="text-3xl">🐱</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{cat.name}</p>
                <p className="text-sm text-gray-500">
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
                onClick={() => setSelectedCat(cat.id)}
                disabled={selectedCat?.id === cat.id}
                className="text-sm px-3 py-1 rounded-full border transition-colors disabled:border-indigo-300 disabled:text-indigo-600 disabled:bg-indigo-50 border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
              >
                {selectedCat?.id === cat.id ? "Selected" : "Select"}
              </button>
              <button
                onClick={() => handleDeleteCat(cat)}
                disabled={deletingId === cat.id}
                className="text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
              >
                {deletingId === cat.id ? "Deleting…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
