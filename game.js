const { useState, useEffect } = React;

function App() {
  const [storyHistory, setStoryHistory] = useState(() => {
    const saved = localStorage.getItem("storyHistory");
    console.log("Loaded storyHistory:", saved);
    return saved
      ? JSON.parse(saved)
      : [{ id: Date.now(), type: "ai", text: "Willkommen! Starte deine Geschichte, indem du etwas eingibst. Zum Beispiel: 'Ich betrete einen Wald.'" }];
  });

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    console.log("Saving storyHistory:", storyHistory);
    localStorage.setItem("storyHistory", JSON.stringify(storyHistory));
  }, [storyHistory]);

  async function submitInput() {
    if (!prompt.trim()) {
      console.log("Empty input");
      alert("Bitte gib etwas ein.");
      return;
    }
    console.log("Submitting prompt:", prompt);
    setGenerating(true);

    setStoryHistory((prev) => {
      const newHistory = [...prev, { id: Date.now(), type: "user", text: prompt }];
      console.log("Added user input:", newHistory);
      return newHistory;
    });

   try {
      const response = await fetch("http://localhost:3000/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error(`HTTP Fehler: ${response.status}`);
      const data = await response.json();
      console.log("API response:", data);

      const aiResponse = (data.story && data.story.scenes && data.story.scenes.intro && data.story.scenes.intro.text) 
        ? data.story.scenes.intro.text 
        : "🤖 AI: Keine gültige Antwort vom Server erhalten.";
      setStoryHistory((prev) => {
        const newHistory = [...prev, { id: Date.now() + 1, type: "ai", text: aiResponse }];
        console.log("Added AI response:", newHistory);
        return newHistory;
      });
    } catch (error) {
      console.error("API Fehler:", error);
      const errorResponse = `🤖 Fehler: Konnte nicht antworten (${error.message}).`;
      setStoryHistory((prev) => {
        const newHistory = [...prev, { id: Date.now() + 1, type: "ai", text: errorResponse }];
        console.log("Added error response:", newHistory);
        return newHistory;
      });
    }

    setPrompt("");
    setGenerating(false);
  }

  function resetStory() {
    console.log("Resetting story");
    setStoryHistory([{ id: Date.now(), type: "ai", text: "Willkommen! Starte deine Geschichte, indem du etwas eingibst. Zum Beispiel: 'Ich betrete einen Wald.'" }]);
    setPrompt("");
  }

  return React.createElement(
    "div",
    { className: "app-container" },
    React.createElement(
      "div",
      { className: "story-container" },
      storyHistory.map((entry) =>
        React.createElement(
          "div",
          { key: entry.id, className: `story-entry ${entry.type} fade-in` },
          React.createElement("p", { className: "story-text" }, entry.text)
        )
      )
    ),
    React.createElement(
      "div",
      { className: "input-container" },
      React.createElement("textarea", {
        className: "prompt-textarea",
        value: prompt,
        onChange: (e) => {
          console.log("Prompt changed:", e.target.value);
          setPrompt(e.target.value);
        },
        placeholder: "Was machst du als Nächstes? (z.B. 'Ich öffne die Tür')",
        "aria-label": "Deinen nächsten Story-Schritt eingeben",
        disabled: generating,
      }),
      React.createElement(
        "button",
        {
          onClick: submitInput,
          className: `submit-btn ${generating ? "disabled" : ""}`,
          disabled: generating,
          "aria-label": generating ? "Story wird generiert" : "Eingabe senden",
        },
        generating ? "Generiere..." : "Eingabe senden"
      ),
      React.createElement(
        "button",
        {
          onClick: resetStory,
          className: "reset-btn",
          "aria-label": "Geschichte zurücksetzen",
        },
        "Geschichte zurücksetzen"
      )
    )
  );
}

try {
  console.log("Rendering app");
  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
} catch (err) {
  console.error("Render error:", err);
  document.getElementById("root").innerHTML = `<div class="loading">Fehler beim Laden. Siehe Konsole (F12).</div>`;
}
