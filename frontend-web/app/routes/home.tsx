import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { isLoggedIn } from "~/lib/auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cat Health" },
    { name: "description", content: "Track your cat's health" },
  ];
}

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <div className="text-6xl">🐱</div>
        <h1 className="text-4xl font-bold text-gray-900">Cat Health</h1>
        <p className="text-gray-500 text-lg">Track your cat's health, all in one place.</p>
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={() => navigate("/signup")}
            className="px-6 py-3 bg-indigo-600 text-white text-base font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign up
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-white text-gray-700 text-base font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
