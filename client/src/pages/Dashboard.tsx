import { useEffect, useMemo, useRef, useState } from "react";
import "./Dashboard.css";
import { isAdmin } from "../utils/auth";

/** Field registry: id must be unique and stable */
const FIELD_DEFS = [
  { id: "legal", label: "Legal Description", placeholder: "Lot...", type: "textarea", span: 8 },
  { id: "doc", label: "Document Number", placeholder: "e.g., XXXXXXXXX", type: "input", span: 4 },
  { id: "grantor", label: "Grantor / Grantee", placeholder: "Name...", type: "input", span: 8 },
  { id: "type", label: "Instrument Type", placeholder: "Deed...", type: "input", span: 4 },
  { id: "date", label: "Instrument Date", placeholder: "MM/DD/YYYY", type: "input", span: 3 },
  { id: "vol", label: "Volume", placeholder: "Vol...", type: "input", span: 3 },
  { id: "criteria", label: "Search Criteria", placeholder: "", type: "textarea", span: 6 },
] as const;

type FieldId = typeof FIELD_DEFS[number]["id"];

export default function Dashboard() {
  // visible fields; start with the common ones
  const [active, setActive] = useState<FieldId[]>([
    "legal",
    "doc",
    "grantor",
    "type",
    "date",
    "vol",
    "criteria",
  ]);

  // values keyed by field id
  const [values, setValues] = useState<Record<FieldId, string>>({
    legal: "",
    doc: "",
    grantor: "",
    type: "",
    date: "",
    vol: "",
    criteria: "",
  });

  // dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // click outside to close
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const activeSet = useMemo(() => new Set(active), [active]);

  const toggleField = (id: FieldId) => {
    setActive((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      // focus the new field after render
      if (!exists) queueMicrotask(() => document.getElementById(`field-${id}`)?.focus());
      return next;
    });
  };

  const onChange = (id: FieldId, v: string) =>
    setValues((prev) => ({ ...prev, [id]: v }));

  const submit = () => {
    // Demo: log only active fields
    const payload = Object.fromEntries(
      active.map((id) => [id, values[id]])
    );
    console.log("SEARCH USING:", Array.from(activeSet));
    console.log("PAYLOAD:", payload);
    alert("Check console for payload 👀");
  };
  const adminMode = isAdmin();

  return (
    <div className="app">
      {/* Sidebar (unchanged layout decisions) */}
      <aside className="sidebar">
        <div className="brand">TITLEHERO</div>
        <button className="upload-btn" onClick={() => void 0} aria-label="Upload">↑</button>
      </aside>

      {/* Header */}
      <header className="header">
        <div className="breadcrumbs">DASHBOARD</div>
        {adminMode && <span style={{ color: '#ff4444', fontWeight: 'bold', marginRight: '10px' }}>ADMIN MODE</span>}
        <div className="profile">
          <div>ENTER NAME</div>
          <div className="avatar" />
        </div>
      </header>

      {/* Main */}
      <main className="main">
        <section className="card">
          <form className="search-grid" onSubmit={(e) => e.preventDefault()}>
            {FIELD_DEFS.filter(f => activeSet.has(f.id)).map((f) => (
              <div
                key={f.id}
                className={`field ${spanClass(f.span)}`}
                data-active
              >
                <label htmlFor={`field-${f.id}`}>{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    id={`field-${f.id}`}
                    className="textarea"
                    placeholder={f.placeholder}
                    value={values[f.id]}
                    onChange={(e) => onChange(f.id, e.target.value)}
                  />
                ) : (
                  <input
                    id={`field-${f.id}`}
                    className="input"
                    placeholder={f.placeholder}
                    value={values[f.id]}
                    onChange={(e) => onChange(f.id, e.target.value)}
                  />
                )}
              </div>
            ))}

            {/* Action row */}
            <div className="actions col-12">
              {/* Dropdown trigger */}
              <div className="dropdown" ref={menuRef}>
                <button
                  type="button"
                  className="btn icon"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  ▾
                </button>

                {menuOpen && (
                  <div role="menu" className="dropdown-menu">
                    <div className="dropdown-title">Search by…</div>
                    {FIELD_DEFS.map((f) => (
                      <label key={f.id} className="dropdown-item">
                        <input
                          type="checkbox"
                          checked={activeSet.has(f.id)}
                          onChange={() => toggleField(f.id)}
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                    <div className="dropdown-footer">
                      <button
                        type="button"
                        className="btn tiny"
                        onClick={() => setActive(FIELD_DEFS.map(f => f.id))}
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        className="btn tiny"
                        onClick={() => setActive([])}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button type="button" className="btn btn-primary" onClick={submit}>
                SEARCH
              </button>
            </div>
          </form>

          {/* Results scaffold */}
          <div className="results">
            <div className="results-header">
              <div className="results-title">RESULTS</div>
              <div className="filter-pill">FILTER ▾</div>
            </div>
            <div className="result-row" />
            <div className="result-row" />
            <div className="result-row" />
            <div className="result-row" />
          </div>
        </section>
      </main>
    </div>
  );
}

function spanClass(span: number) {
  // map span (in 12-col grid) to class names you already use
  if (span === 12) return "col-12";
  if (span === 8) return "col-8";
  if (span === 6) return "col-6";
  if (span === 4) return "col-4";
  if (span === 3) return "col-3";
  return "col-12";
}
