// src/pages/Dashboard.tsx
import type { FormEvent } from "react";
import "./Dashboard.css";
import { isAdmin } from "../utils/auth";

export default function Dashboard() {
  const stop = (e: FormEvent) => e.preventDefault();
  const adminMode = isAdmin();

  return (
    <div className="app">
      {/* SIDEBAR NAV -  subject to change a ton but */}
      <aside className="sidebar">
        <div className="brand">TITLEHERO</div>
        <nav className="nav">
          <h4>ROBERTSON</h4>
          <button onClick={() => void 0}>Search</button>
          <button onClick={() => void 0}>Edit</button>

          <h4>COUNTY X</h4>
          <button onClick={() => void 0}>Search</button>

          <h4>COUNTY Y</h4>
          <button onClick={() => void 0}>Search</button>

          <h4>COUNTY Z</h4>
          <button onClick={() => void 0}>Search</button>
        </nav>

        <div style={{ marginTop: "auto" }}>
          <button className="btn" style={{ width: "100%" }} onClick={() => void 0}>+ New</button>
        </div>
      </aside>

      {/* here is going to display which database you are in, just need to know that */}
      
      <header className="header">
        <div className="breadcrumbs">
          {adminMode && <span style={{ color: '#ff4444', fontWeight: 'bold', marginRight: '10px' }}>ADMIN MODE</span>}
          DATABASE <span> - </span> ROBERTSON COUNTY <span> - </span>{" "}
          <span className="current">SEARCH</span>
        </div>
        <div className="profile">
          <div>ENTER NAME</div>
          <div className="avatar" />
        </div>
      </header>

      {/* MAIN AREA - where database search will happen */}
      <main className="main">
        <section className="card">
          <div className="search-title">SEARCH CRITERIA</div>

          <form className="search-grid" onSubmit={stop}>
            {/* lef col */}
            <div className="field" style={{ gridColumn: "1 / 2" }}>
              <label>Legal Description</label>
              <textarea className="input textarea" placeholder="Lot..." />
            </div>

            {/* mid col */}
            <div className="field" style={{ gridColumn: "2 / 3" }}>
              <label>Document Number</label>
              <input className="input" placeholder="e.g., XXXXXXXXX" />
            </div>

            {/* right col */}
            <div className="field" style={{ gridColumn: "3 / 4" }}>
              <label>Search Criteria</label>
              <div className="criteria"></div>
            </div>

            <div className="field" style={{ gridColumn: "1 / 2" }}>
              <label>Grantor / Grantee</label>
              <input className="input" placeholder="Name..." />
            </div>

            <div className="subgrid-3" style={{ gridColumn: "2 / 4" }}>
              <div className="field">
                <label>Instrument Type</label>
                <input className="input" placeholder="Deed..." />
              </div>
              <div className="field">
                <label>Instrument Date</label>
                <input className="input" placeholder="MM/DD/YYYY" />
              </div>
              <div className="field">
                <label>Volume</label>
                <input className="input" placeholder="Vol…" />
              </div>
            </div>

            <div className="actions-right">
              <button className="btn" onClick={() => void 0}>▼</button>
              <button className="btn btn-primary" onClick={() => void 0}>SEARCH</button>
            </div>
          </form>

          {/* Results -> empty right now but to be populated */}
          <div className="results">
            <div className="results-header">
              <div className="results-title">RESULTS</div>
              <div className="filter-pill">
                FILTER
                <button className="btn btn-pill" onClick={() => void 0}>▼</button>
              </div>
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
