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
  const [newSceneId, setNewSceneId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  useEffect(() => {
    localStorage.setItem("storyData", JSON.stringify(story));
  }, [story]);

  const scene = story.scenes[currentScene] || { text: "Unbekannte Szene", choices: [] };

  function addScene() {
    if (!newSceneId) return alert("Bitte gib eine Szene-ID ein.");
    setStory(prev => ({ ...prev, scenes: { ...prev.scenes, [newSceneId]: { text: "", choices: [] } } }));
    setNewSceneId("");
  }

  function deleteScene(id) {
    if (id === story.start) return alert("Die Startszene kann nicht gelöscht werden.");
    const newScenes = { ...story.scenes }; delete newScenes[id];
    setStory({ ...story, scenes: newScenes });
    if (currentScene === id) setCurrentScene(story.start);
  }

  function updateScene(id, text) {
    setStory(prev => ({ ...prev, scenes: { ...prev.scenes, [id]: { ...prev.scenes[id], text } } }));
  }

  function addChoice(id, text, next) {
    if (!text || !next) return alert("Bitte gib Text und nächste Szene ein.");
    setStory(prev => ({
      ...prev,
      scenes: {
        ...prev.scenes,
        [id]: { ...prev.scenes[id], choices: [...(prev.scenes[id].choices || []), { text, next }] }
      }
    }));
  }

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
      const aiScene = { text: data.story ? data.story.scenes[data.story.start].text : `Mock-AI: ${prompt}`, choices: data.story ? data.story.scenes[data.story.start].choices : [{ text: "Weiter", next: "ende" }] };
      setAiHistory(prev => [...prev, aiScene]);
      if (data.story) {
        setStory(data.story);
        setCurrentScene(data.story.start);
      }
    } catch (err) {
      console.error(err);
      const mockScene = { text: `🤖 AI Mock: ${prompt}`, choices: [{ text: "Weiter", next: "ende" }] };
      setAiHistory(prev => [...prev, mockScene]);
      setStory(prev => ({ ...prev, scenes: { ...prev.scenes, ende: { text: "Ende der Geschichte", choices: [] } } }));
      setCurrentScene("ende");
    }
    setGenerating(false);
  }

  return React.createElement("div", { className: "app-modern" },
    // Tabs
    React.createElement("div", { className: "tabs" }, ["play", "edit", "generate"].map(t =>
      React.createElement("button", {
        key: t,
        onClick: () => setTab(t),
        className: `tab-button ${tab === t ? "active" : ""}`
      }, t === "play" ? "Spielen" : t === "edit" ? "Editor" : "KI-Generieren")
    )),

    // Play Mode
    tab === "play" && React.createElement("div", { className: "play-mode" },
      // AI Story Cards
      aiHistory.map((ai, idx) =>
        React.createElement("div", { key: idx, className: "ai-card fade-in" }, ai.text)
      ),
      React.createElement("div", { className: "scene-card fade-in" },
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

    // Edit Mode
    tab === "edit" && React.createElement("div", { className: "edit-mode" },
      React.createElement("input", {
        value: newSceneId,
        onChange: e => setNewSceneId(e.target.value),
        placeholder: "Neue Szene-ID",
        className: "editor-input"
      }),
      React.createElement("button", { onClick: addScene, className: "editor-btn" }, "Szene hinzufügen"),
      Object.keys(story.scenes).map(id =>
        React.createElement("div", { key: id, className: "scene-editor" },
          React.createElement("textarea", { value: story.scenes[id].text, onChange: e => updateScene(id, e.target.value), className: "editor-textarea" }),
          React.createElement("button", { onClick: () => deleteScene(id), className: "delete-btn" }, "Löschen")
        )
      )
    ),

    // Generate Mode
    tab === "generate" && React.createElement("div", { className: "generate-mode" },
      React.createElement("textarea", {
        value: prompt,
        onChange: e => setPrompt(e.target.value),
        placeholder: "Beschreibe die gewünschte Geschichte...",
        className: "generate-textarea"
      }),
      React.createElement("button", {
        onClick: generateStory,
        disabled: generating,
        className: `generate-btn ${generating ? "disabled" : ""}`
      }, generating ? "Generiere..." : "Story generieren")
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
