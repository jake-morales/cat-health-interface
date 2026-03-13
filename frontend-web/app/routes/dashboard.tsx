import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { API_BASE, getToken, clearAuth, isLoggedIn } from "~/lib/auth";

interface Cat {
  id: string;
  name: string;
  breed: string | null;
  age: number | null;
  birthday: string | null;
}

export function meta() {
  return [{ title: "My Cats – Cat Health" }];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [cats, setCats] = useState<Cat[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Add cat form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [birthday, setBirthday] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
    }
  }, [navigate]);

  const fetchCats = useCallback(async () => {
    setLoadingCats(true);
    try {
      const res = await fetch(`${API_BASE}/cats/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) {
        clearAuth();
        navigate("/login");
        return;
      }
      const data = await res.json();
      setCats(data);
    } catch {
      // silently ignore network errors on load
    } finally {
      setLoadingCats(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCats();
  }, [fetchCats]);

  function handleLogout() {
    clearAuth();
    navigate("/");
  }

  async function handleDeleteCat(catId: string) {
    setDeletingId(catId);
    try {
      const res = await fetch(`${API_BASE}/cats/${catId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) {
        clearAuth();
        navigate("/login");
        return;
      }
      if (res.ok) {
        setCats((prev) => prev.filter((c) => c.id !== catId));
      }
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null);
    }
  }

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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.detail ?? "Failed to add cat");
        return;
      }

      const newCat = await res.json();
      setCats((prev) => [newCat, ...prev]);
      setName("");
      setBreed("");
      setAge("");
      setBirthday("");
      setShowForm(false);
    } catch {
      setFormError("Could not connect to the server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">🐱 Cat Health</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Cats</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Cat"}
          </button>
        </div>

        {/* Add cat form */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breed
                  </label>
                  <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birthday
                </label>
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

        {/* Cat list */}
        {loadingCats ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : cats.length === 0 ? (
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
                  onClick={() => handleDeleteCat(cat.id)}
                  disabled={deletingId === cat.id}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
                >
                  {deletingId === cat.id ? "Deleting…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
