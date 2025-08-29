const { useState, useEffect } = React;

function App() {
  const [storyHistory, setStoryHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("storyHistory");
      console.log("Loaded storyHistory from localStorage:", saved);
      return saved
        ? JSON.parse(saved)
        : [{ id: Date.now(), type: "ai", text: "Willkommen! Starte deine Geschichte, indem du etwas eingibst. Zum Beispiel: 'Ich betrete einen Wald.'" }];
    } catch (error) {
      console.error("Failed to parse storyHistory from localStorage:", error);
      return [{ id: Date.now(), type: "ai", text: "Willkommen! Starte deine Geschichte, indem du etwas eingibst. Zum Beispiel: 'Ich betrete einen Wald.'" }];
    }
  });

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      console.log("Saving storyHistory to localStorage:", storyHistory);
      localStorage.setItem("storyHistory", JSON.stringify(storyHistory));
    } catch (error) {
      console.error("Failed to save storyHistory to localStorage:", error);
    }
  }, [storyHistory]);

  async function submitInput() {
    if (!prompt.trim()) {
      console.log("Empty input detected");
      alert("Bitte gib etwas ein.");
      return;
    }

    console.log("Submitting prompt:", prompt);
    setGenerating(true);
    setError(null);

    const newUserEntry = { id: Date.now(), type: "user", text: prompt };
    setStoryHistory(prev => [...prev, newUserEntry]);

    try {
      const response = await fetch("http://localhost:3000/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, history: storyHistory }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      const aiResponse = data.story || "🤖 AI: Keine gültige Antwort vom Server erhalten.";
      setStoryHistory(prev => [...prev, { id: Date.now() + 1, type: "ai", text: aiResponse }]);
    } catch (error) {
      console.error("Fetch error:", error);
      const errorResponse = `🤖 Fehler: Konnte nicht antworten (${error.message}).`;
      setStoryHistory(prev => [...prev, { id: Date.now() + 1, type: "ai", text: errorResponse }]);
      setError(error.message);
    }

    setPrompt("");
    setGenerating(false);
  }

  function resetStory() {
    console.log("Resetting story");
    setStoryHistory([{ id: Date.now(), type: "ai", text: "Willkommen! Starte deine Geschichte, indem du etwas eingibst. Zum Beispiel: 'Ich betrete einen Wald.'" }]);
    setPrompt("");
    setError(null);
  }

  return (
    <div className="app-container">
      {error && <div className="error-message">{error}</div>}
      <div className="story-container">
        {storyHistory.map(entry => (
          <div key={entry.id} className={`story-entry ${entry.type} fade-in`}>
            <p className="story-text">{entry.text}</p>
          </div>
        ))}
      </div>
      <div className="input-container">
        <textarea
          className="prompt-textarea"
          value={prompt}
          onChange={e => {
            console.log("Prompt changed:", e.target.value);
            setPrompt(e.target.value);
          }}
          placeholder="Was machst du als Nächstes? (z.B. 'Ich öffne die Tür')"
          aria-label="Deinen nächsten Story-Schritt eingeben"
          disabled={generating}
        />
        <button
          onClick={submitInput}
          className={`submit-btn ${generating ? "disabled" : ""}`}
          disabled={generating}
          aria-label={generating ? "Story wird generiert" : "Eingabe senden"}
        >
          {generating ? "Generiere..." : "Eingabe senden"}
        </button>
        <button
          onClick={resetStory}
          className="reset-btn"
          aria-label="Geschichte zurücksetzen"
        >
          Geschichte zurücksetzen
        </button>
      </div>
    </div>
  );
}

try {
  console.log("Rendering React app");
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
} catch (err) {
  console.error("Render error:", err);
  document.getElementById("root").innerHTML = `<div class="loading">Fehler beim Laden. Siehe Konsole (F12).</div>`;
}
