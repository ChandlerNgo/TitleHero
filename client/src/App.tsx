// src/App.tsx
import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

type View = "login" | "main";

export default function App() {
  const [view, setView] = useState<View>("login");
  return view === "login"
    ? <Login onEnter={() => setView("main")} />
    : <Dashboard />;
}
