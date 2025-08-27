const { useState, useEffect } = React;

function App() {
  const [story, setStory] = useState(() => {
    const saved = localStorage.getItem("storyData");
    return saved
      ? JSON.parse(saved)
      : { start: "intro", scenes: { intro: { text: "Willkommen! Erstelle oder spiele deine Story.", choices: [] } } };
  });

  const [currentScene, setCurrentScene] = useState(story.start);
  const [tab, setTab] = useState("play");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  const scene = story.scenes[currentScene] || { text: "Unbekannte Szene", choices: [] };

  async function generateStory() {
    if (!prompt) return alert("Bitte gib einen Kundenwunsch ein.");
    setGenerating(true);

    try {
      const response = await fetch("http://localhost:3000/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();

      setAiHistory(prev => [...prev, { text: data.storyText || `🤖 Mock AI: ${prompt}` }]);
    } catch (err) {
      console.error(err);
      setAiHistory(prev => [...prev, { text: `🤖 Mock AI: ${prompt}` }]);
    }

    setPrompt("");
    setGenerating(false);
  }

  return React.createElement("div", { className: "app-container" },
    // Tabs
    React.createElement("div", { className: "tabs" },
      ["play", "edit", "generate"].map(t =>
        React.createElement("button", {
          key: t,
          onClick: () => setTab(t),
          className: tab === t ? "active-tab" : ""
        }, t === "play" ? "Spielen" : t === "edit" ? "Editor" : "KI-Generieren")
      )
    ),

    // Play Mode
    tab === "play" && React.createElement("div", { className: "play-mode" },
      aiHistory.map((ai, idx) =>
        React.createElement("div", { key: idx, className: "ai-card" }, ai.text)
      ),
      React.createElement("div", { className: "scene-card" },
        React.createElement("p", null, scene.text),
        scene.choices.map((choice, idx) =>
          React.createElement("button", {
            key: idx,
            onClick: () => setCurrentScene(choice.next),
            className: "choice-btn"
          }, choice.text)
        )
      )
    ),

    // Generate Mode
    tab === "generate" && React.createElement("div", { className: "generate-mode" },
      React.createElement("textarea", {
        value: prompt,
        onChange: e => setPrompt(e.target.value),
        placeholder: "Beschreibe, worüber die KI schreiben soll...",
        className: "prompt-textarea"
      }),
      React.createElement("button", {
        onClick: generateStory,
        disabled: generating,
        className: "generate-btn"
      }, generating ? "Generiere..." : "Story generieren")
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
