import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app-container">
      <header>
        <h1>Title Hero</h1>
        <p>Welcome to your project!</p>
      </header>

      <main>
        <div className="card">
          <h2>Interactive Counter</h2>
          <button onClick={() => setCount((count) => count + 1)}>
            Count: {count}
          </button>
          <p>Click the button to increase the count.</p>
        </div>
      </main>

      <footer>
        <p>Created with React + TypeScript</p>
      </footer>
    </div>
  )
}

export default App
