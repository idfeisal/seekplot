const { useState, useEffect } = React;

function App() {
  // Initialize story history from localStorage or default
  const [storyHistory, setStoryHistory] = useState(() => {
    const saved = localStorage.getItem("storyHistory");
    return saved
      ? JSON.parse(saved)
      : [{ id: Date.now(), type: "ai", text: "Willkommen! Starte deine Geschichte, indem du etwas eingibst." }];
  });

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  // Persist story history to localStorage
  useEffect(() => {
    localStorage.setItem("storyHistory", JSON.stringify(storyHistory));
  }, [storyHistory]);

  // Handle user input submission
  function submitInput() {
    if (!prompt.trim()) return alert("Bitte gib etwas ein.");
    setGenerating(true);

    // Add user input to history
    setStoryHistory((prev) => [...prev, { id: Date.now(), type: "user", text: prompt }]);

    // Mock AI response
    try {
      const aiResponse = `🤖 AI: ${prompt}... (Hier wäre die KI-Fortsetzung deiner Geschichte.)`;
      setStoryHistory((prev) => [...prev, { id: Date.now() + 1, type: "ai", text: aiResponse }]);
    } catch (err) {
      console.error(err);
      setStoryHistory((prev) => [...prev, { id: Date.now() + 1, type: "ai", text: "🤖 Fehler: Konnte nicht antworten." }]);
    }

    setPrompt("");
    setGenerating(false);
  }

  // Reset story
  function resetStory() {
    setStoryHistory([{ id: Date.now(), type: "ai", text: "Willkommen! Starte deine Geschichte, indem du etwas eingibst." }]);
    setPrompt("");
  }

  return React.createElement(
    "div",
    { className: "app-container" },
    // Story display
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
    // Input area
    React.createElement(
      "div",
      { className: "input-container" },
      React.createElement("textarea", {
        className: "prompt-textarea",
        value: prompt,
        onChange: (e) => setPrompt(e.target.value),
        placeholder: "Was machst du als Nächstes?",
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

// Render the app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
