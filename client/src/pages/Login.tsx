// src/pages/Login.tsx
import type { FormEvent } from "react";
import "./Login.css";

export default function Login({ onEnter }: { onEnter: () => void }) {
  const prevent = (e: FormEvent) => e.preventDefault();

  return (
    <div className="welcome">
      <div className="welcome-card">
        <div className="welcome-head">
          <div className="logo-tag">TITLEHERO</div>
          <div className="ctas">
            <button className="btn" onClick={() => void 0}>Docs</button>
          </div>
        </div>

        <h1 style={{ margin: 0 }}>Welcome, USER</h1>

        <form onSubmit={prevent} className="welcome-form">
          <div className="field">
            <label htmlFor="org">Title Hero, enter cool slogan here.</label>
          </div>
        
        {/* login information will be here! Does not do anything right now */}

          <div className="row-2">
            <div className="field">
              <label htmlFor="email">Username</label>
              <input id="email" className="input" placeholder="<your username>" />
            </div>
            <div className="field">
              <label htmlFor="key">Password</label>
              <input id="key" className="input" placeholder="<your password>" />
            </div>
          </div>

          <div className="cta-row">
            <button className="btn" onClick={() => void 0}>
                Help
            </button>
            <button type="button" className="btn btn-primary" onClick={onEnter}>
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
