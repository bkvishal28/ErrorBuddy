
import { useState } from "react";
import "./App.css";

function App() {
  const [language, setLanguage] = useState("Python");
  const [sourceCode, setSourceCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyzeError() {
    if (!sourceCode.trim() && !errorMessage.trim()) {
      setError("Please paste source code or an error message first.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("https://errorbuddy-api.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          source_code: sourceCode,
          error_message: errorMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("The server could not analyze your code.");
      }

      const data = await response.json();
      setResult(data);
    } catch {
      setError(
        "Could not connect to ErrorBuddy. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearForm() {
    setSourceCode("");
    setErrorMessage("");
    setResult(null);
    setError("");
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-icon">E</span>
          ErrorBuddy
        </a>
        <span className="status">
          <span className="status-dot"></span>
          Developer assistant
        </span>
      </header>

      <main className="main">
        <section className="hero">
          <span className="eyebrow">YOUR CODING COMPANION</span>
          <h1>
            Errors happen.
            <br />
            <span>Let's fix them.</span>
          </h1>
          <p>
            Paste your source code or programming error and get a clear
            explanation, possible causes, and a suggested fix.
          </p>
        </section>

        <section className="workspace">
          <div className="section-heading">
            <div>
              <span className="step-label">STEP 01</span>
              <h2>Share your code or error</h2>
            </div>
            <span className="optional">AI code analysis</span>
          </div>

          <label htmlFor="language">Programming language</label>
          <select
            id="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            <option>Python</option>
            <option>Java</option>
            <option>JavaScript</option>
            <option>C</option>
            <option>C++</option>
          </select>

          <label htmlFor="source-code">Source code (optional)</label>
          <textarea
            id="source-code"
            value={sourceCode}
            onChange={(event) => setSourceCode(event.target.value)}
            placeholder={"Paste your complete source code here...\n\nExample:\nnum1 = 10\nnum2 = 0\nprint(num1 / num2)"}
            rows={9}
            spellCheck={false}
          />

          <div className="input-footer">
            <span>{sourceCode.length} characters</span>
          </div>

          <label htmlFor="error-message">
            Error message (optional)
          </label>
          <textarea
            id="error-message"
            value={errorMessage}
            onChange={(event) => setErrorMessage(event.target.value)}
            placeholder={"Paste your error message here...\n\nExample: ZeroDivisionError: division by zero"}
            rows={5}
          />

          <div className="input-footer">
            <span>{errorMessage.length} characters</span>
            <div className="input-actions">
              <button
                className="text-button"
                onClick={() => {
                  setSourceCode("num1 = 10\nnum2 = 0\nprint(num1 / num2)");
                  setErrorMessage(
                    "ZeroDivisionError: division by zero"
                  );
                }}
              >
                Load example
              </button>

              <button className="text-button" onClick={clearForm}>
                Clear
              </button>
            </div>
          </div>

          <button
            className="analyze-button"
            onClick={analyzeError}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze code"}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>

          {error && <p className="error-message">{error}</p>}
        </section>

        {result && (
          <section className="results">
            <div className="section-heading">
              <div>
                <span className="step-label">STEP 02</span>
                <h2>Your error explained</h2>
              </div>
              <span className="result-badge">Analysis complete</span>
            </div>

            <div className="result-type">
              <span className="result-icon">!</span>
              <div>
                <span className="result-caption">ERROR TYPE</span>
                <h3>{result.error_type}</h3>
              </div>
            </div>

            <div className="result-card">
              <h3>What does it mean?</h3>
              <p>{result.explanation}</p>
            </div>

            <div className="result-card">
              <h3>Possible causes</h3>
              <ul>
                {result.possible_causes.map((cause, index) => (
                  <li key={index}>{cause}</li>
                ))}
              </ul>
            </div>

            <div className="fix-card">
              <h3>Suggested fix</h3>
              <p>{result.suggested_fix}</p>
            </div>

            {result.corrected_example && (
              <div className="code-card">
                <div className="code-card-header">
                  <h3>Corrected Code Example</h3>
                  <button
                    className="text-button"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        result.corrected_example
                      )
                    }
                  >
                    Copy code
                  </button>
                </div>
                <pre>
                  <code>{result.corrected_example}</code>
                </pre>
              </div>
            )}
          </section>
        )}

        <footer>
          <p>ErrorBuddy · Understand errors. Learn to fix them.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
