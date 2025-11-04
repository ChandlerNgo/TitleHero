import { useEffect, useMemo, useRef, useState } from "react";
import "./Dashboard.css";
import { isAdmin } from "../utils/auth";

/** All searchable fields from DB (ids match DB keys exactly) */
const FIELD_DEFS = [
  // IDs / references
  { id: "documentID",       label: "documentID",       placeholder: "e.g., 6",                      type: "input",   span: 3 },
  { id: "abstractID",       label: "abstractID",       placeholder: "e.g., 42",                     type: "input",   span: 3 },
  { id: "bookTypeID",       label: "bookTypeID",       placeholder: "e.g., 1",                      type: "input",   span: 3 },
  { id: "subdivisionID",    label: "subdivisionID",    placeholder: "e.g., 17",                     type: "input",   span: 3 },
  { id: "countyID",         label: "countyID",         placeholder: "e.g., 123",                    type: "input",   span: 3 },

  // Instrument / book meta
  { id: "instrumentNumber", label: "instrumentNumber", placeholder: "e.g., IN12345",                type: "input",   span: 4 },
  { id: "book",             label: "book",             placeholder: "e.g., Book A",                 type: "input",   span: 3 },
  { id: "volume",           label: "volume",           placeholder: "e.g., Vol 1",                  type: "input",   span: 3 },
  { id: "page",             label: "page",             placeholder: "e.g., 12",                     type: "input",   span: 3 },

  // Parties / instrument type
  { id: "grantor",          label: "grantor",          placeholder: "e.g., John Doe",               type: "input",   span: 4 },
  { id: "grantee",          label: "grantee",          placeholder: "e.g., Jane Smith",             type: "input",   span: 4 },
  { id: "instrumentType",   label: "instrumentType",   placeholder: "e.g., Deed",                   type: "input",   span: 4 },

  // Amounts / numbers
  { id: "lienAmount",       label: "lienAmount",       placeholder: "e.g., 50000.75",               type: "input",   span: 3 },
  { id: "acres",            label: "acres",            placeholder: "e.g., 2.5000",                 type: "input",   span: 3 },
  { id: "exportFlag",       label: "exportFlag",       placeholder: "0 or 1",                       type: "input",   span: 3 },
  { id: "GFNNumber",        label: "GFNNumber",        placeholder: "e.g., 123",                    type: "input",   span: 3 },
  { id: "marketShare",      label: "marketShare",      placeholder: "e.g., 50%",                    type: "input",   span: 3 },

  // Legal / description blocks
  { id: "legalDescription", label: "legalDescription", placeholder: "Lot 1, Block A...",            type: "textarea",span: 8 },
  { id: "subBlock",         label: "subBlock",         placeholder: "e.g., Block A",                type: "input",   span: 3 },
  { id: "abstractText",     label: "abstractText",     placeholder: "Abstract text...",             type: "textarea",span: 8 },
  { id: "fieldNotes",       label: "fieldNotes",       placeholder: "Field notes...",               type: "textarea",span: 8 },
  { id: "remarks",          label: "remarks",          placeholder: "Remarks...",                   type: "textarea",span: 8 },

  // Dates / finalized
  { id: "fileStampDate",    label: "fileStampDate",    placeholder: "YYYY-MM-DD or ISO",            type: "input",   span: 4 },
  { id: "filingDate",       label: "filingDate",       placeholder: "YYYY-MM-DD or ISO",            type: "input",   span: 4 },
  { id: "finalizedBy",      label: "finalizedBy",      placeholder: "e.g., Admin User",             type: "input",   span: 4 },

  // Other references
  { id: "nFileReference",   label: "nFileReference",   placeholder: "e.g., NF123456",               type: "input",   span: 4 },
  { id: "propertyType",     label: "propertyType",     placeholder: "e.g., Residential",            type: "input",   span: 4 },
  { id: "sortArray",        label: "sortArray",        placeholder: "e.g., [1,2,3]",                type: "input",   span: 4 },

  // Location / CAD / links
  { id: "address",          label: "address",          placeholder: "e.g., 123 Main Street",        type: "input",   span: 6 },
  { id: "CADNumber",        label: "CADNumber",        placeholder: "e.g., CAD001",                 type: "input",   span: 3 },
  { id: "CADNumber2",       label: "CADNumber2",       placeholder: "e.g., CAD002",                 type: "input",   span: 3 },
  { id: "GLOLink",          label: "GLOLink",          placeholder: "http://...",                   type: "input",   span: 6 },

  // Timestamps
  { id: "created_at",       label: "created_at",       placeholder: "ISO timestamp",                type: "input",   span: 4 },
  { id: "updated_at",       label: "updated_at",       placeholder: "ISO timestamp",                type: "input",   span: 4 },

  // Optional freeform criteria (kept from your original UI)
  { id: "criteria",         label: "Search All Fields",  placeholder: "",                             type: "textarea",span: 6 },
] as const;

type FieldId = typeof FIELD_DEFS[number]["id"];

/* ----------------------- Upload Modal ----------------------- */
type UploadModalProps = {
  open: boolean;
  onClose: () => void;
  onUploaded?: (payload: { documentID: number; ai_extraction?: any } | null) => void;
};

function UploadModal({ open, onClose, onUploaded }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setErr(null);
      setBusy(false);
      setCreatedId(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeAt = (i: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
  };

  const upload = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr(null);
    setCreatedId(null);

    try {
      const baseUrl =
        import.meta.env.VITE_API_TARGET ||
        "https://5mj0m92f17.execute-api.us-east-2.amazonaws.com";

      const form = new FormData();
      // Multer field name your server expects:
      files.forEach(f => form.append("files", f, f.name));

      // Your express route is '/documents/ocr' and you front it with '/api'
      const res = await fetch(`${baseUrl}/api/documents/ocr`, {
        method: "POST",
        body: form
        // No manual Content-Type header for FormData
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Upload/OCR failed (${res.status}): ${t}`);
      }

      const data = await res.json(); // { message, documentID, ai_extraction }
      setCreatedId(data?.documentID ?? null);
      onUploaded?.(data ?? null);

      // Optional: auto-close after a short delay
      // setTimeout(onClose, 800);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
      onUploaded?.(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Upload documents">
      <div className="modal">
        <div className="modal-header">
          <h3>Upload Documents</h3>
          <button className="btn icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div
          className={`dropzone ${isDragging ? "dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".tif,.tiff,.pdf,.png,.jpg,.jpeg,.heic,.webp"
            onChange={onPick}
            style={{ display: "none" }}
          />
          <div className="dropzone-inner">
            <div className="big-arrow">⬆</div>
            <div className="dz-title">Drag & drop files here</div>
            <div className="dz-sub">or click to select (TIFF, PDF, PNG, JPG)</div>
          </div>
        </div>

        {!!files.length && (
          <div className="file-list">
            {files.map((f, i) => (
              <div key={i} className="file-row">
                <div className="file-name">{f.name}</div>
                <div className="file-size">{(f.size/1024/1024).toFixed(2)} MB</div>
                <button className="btn tiny" onClick={() => removeAt(i)}>Remove</button>
              </div>
            ))}
          </div>
        )}

        {err && <div className="error-text">{err}</div>}
        {createdId && (
          <div style={{ margin: "8px 16px", color: "#0a7", fontWeight: 600 }}>
            ✅ Created Document ID: {createdId}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" onClick={upload} disabled={!files.length || busy}>
            {busy ? "Uploading & Extracting…" : "Upload to OCR"}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ----------------------- Dashboard ----------------------- */
export default function Dashboard() {
  // Start with your original common set; user can "Select all" from dropdown.
  const [active, setActive] = useState<FieldId[]>(["criteria"]);

  // Initialize values for all fields to empty strings
  const INITIAL_VALUES = useMemo(
    () => Object.fromEntries(FIELD_DEFS.map(f => [f.id, ""])) as Record<FieldId, string>,
    []
  );
  const [values, setValues] = useState<Record<FieldId, string>>(INITIAL_VALUES);

  // Dropdown open/close
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    setActive(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(x => x !== id) : [...prev, id];
      if (!exists) queueMicrotask(() => document.getElementById(`field-${id}`)?.focus());
      return next;
    });
  };

  // NEW: refs/state near your other hooks
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [dropUp, setDropUp] = useState(false);

  // inline style for the fixed panel
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  // Recalc placement whenever opened / resized / scrolled
  useEffect(() => {
    function recalc() {
      if (!menuOpen || !triggerRef.current) return;

      const trg = triggerRef.current.getBoundingClientRect();
      const padding = 12; // viewport padding
      const desiredWidth = Math.min(900, window.innerWidth * 0.86);

      // Try to place below first
      const spaceBelow = window.innerHeight - trg.bottom - padding;
      const belowMaxH = Math.min(window.innerHeight * 0.6, spaceBelow);
      const openBelow = belowMaxH >= 240; // needs ~enough room

      let top = 0;
      let left = Math.min(
        Math.max(trg.left, padding),
        window.innerWidth - desiredWidth - padding
      );
      let maxHeight = 0;

      if (openBelow) {
        top = trg.bottom + 8; // a little gap
        maxHeight = Math.max(260, belowMaxH); // clamp
        setDropUp(false);
      } else {
        // open upward
        const spaceAbove = trg.top - padding;
        maxHeight = Math.min(window.innerHeight * 0.6, spaceAbove - 8);
        top = Math.max(padding, trg.top - maxHeight - 8);
        setDropUp(true);
      }

      setMenuStyle({
        top,
        left,
        maxHeight,
        width: desiredWidth
      });
    }

    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
    };
  }, [menuOpen]);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node) &&
          !triggerRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const onChange = (id: FieldId, v: string) =>
    setValues(prev => ({ ...prev, [id]: v }));

  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  // NEW: upload modal state
  const [showUpload, setShowUpload] = useState(false);

  // submitting function, then using the search from documents.js
  const submit = async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    for (const id of active) {
      const v = values[id]?.trim?.() ?? "";
      if (v) params.append(id, v);
    }

    try {
      const baseUrl = import.meta.env.VITE_API_TARGET || 'https://5mj0m92f17.execute-api.us-east-2.amazonaws.com';
      const res = await fetch(`${baseUrl}/api/documents/search?${params.toString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Server ${res.status}: ${t}`);
      }
      const data = await res.json();
      setResults(Array.isArray(data.rows) ? data.rows : []);
    } catch (e:any) {
      setError(e?.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const adminMode = isAdmin();

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">TITLEHERO</div>
        <button
          className="upload-btn"
          onClick={() => setShowUpload(true)}
          aria-label="Upload"
          title="Upload"
        >
          ↑
        </button>
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
          <div className="search-title">SEARCH</div>
          <form className="search-grid" onSubmit={(e) => e.preventDefault()}>
            {FIELD_DEFS.filter(f => activeSet.has(f.id)).map(f => (
              <div key={f.id} className={`field ${spanClass(f.span)}`} data-active>
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

            {/* Actions */}
            <div className="actions col-12">
              <div className="dropdown" ref={menuRef}>
                <button
                  type="button"
                  className="btn icon"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(v => !v)}
                  ref={triggerRef}
                >
                  ▾
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className={`dropdown-menu ${dropUp ? "drop-up" : ""}`}
                    aria-label="Select fields to search by"
                    style={menuStyle}
                  >
                    <div className="dropdown-title">Search by…</div>

                    {FIELD_DEFS.map(f => (
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
              <div className="results-title">
                RESULTS {loading ? '…' : `(${results.length})`}
              </div>
              {error && <div className="filter-pill" style={{color: '#b00'}}>{error}</div>}
            </div>

            {results.length === 0 && !loading && !error && (
              <div className="result-row" style={{background:'#f3efec'}}>
                No matches.
              </div>
            )}

            {results.map(row => (
              <div key={row.documentID} className="result-row">
                {/* header */}
                <div className="doc-head">
                  <div className="doc-title">
                    <span className="doc-id">ID {row.documentID}</span>
                    {row.instrumentNumber && (
                      <span className="doc-instrument">Instrument: {row.instrumentNumber}</span>
                    )}
                  </div>

                  <div className="badges">
                    {row.instrumentType && <span className="badge">{row.instrumentType}</span>}
                    {row.propertyType && <span className="badge">{row.propertyType}</span>}
                    {row.exportFlag ? <span className="badge">Exported</span> : null}
                  </div>
                </div>

                {/* meta */}
                <div className="doc-meta">
                  <div className="kv">
                    <b>Book/Vol/Page:</b>
                    <span className="mono">
                      {row.book ?? '—'}{row.volume ? ` ${row.volume}` : ''}{row.page ? ` / ${row.page}` : ''}
                    </span>
                  </div>

                  <div className="kv wide">
                    <b>Parties:</b>
                    <span>{fmtParty(row.grantor)} <span className="muted">→</span> {fmtParty(row.grantee)}</span>
                  </div>

                  <div className="kv">
                    <b>CountyID:</b> <span>{row.countyID ?? '—'}</span>
                  </div>

                  <div className="kv">
                    <b>Filed:</b> <span className="mono">{toDate(row.filingDate) ?? '—'}</span>
                  </div>

                  <div className="kv">
                    <b>File Stamp:</b> <span className="mono">{toDate(row.fileStampDate) ?? '—'}</span>
                  </div>
                </div>

                {/* legal preview */}
                <div className="legal">
                  <div className="legal-label"><b>Legal:</b></div>
                  <div className="legal-content">
                    {row.legalDescription?.trim() || '—'}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Upload modal */}
      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={() => {
          // Optional: re-run search to show new records right away
          // submit();
        }}
      />
    </div>
  );
}

function toDate(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0,10);
}

function fmtParty(s?: string | null) {
  return s && s.trim() ? s : '—';
}

function spanClass(span: number) {
  if (span === 12) return "col-12";
  if (span === 8)  return "col-8";
  if (span === 6)  return "col-6";
  if (span === 4)  return "col-4";
  if (span === 3)  return "col-3";
  return "col-12";
}
