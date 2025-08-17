// Load environment variables (for local development)
if (typeof dotenv !== 'undefined') {
  dotenv.config();
}

const { useState, useEffect } = React;

function App() {
  const [story, setStory] = useState(() => {
    const saved = localStorage.getItem("storyData");
    return saved ? JSON.parse(saved) : {
      start: "intro",
      scenes: {
        intro: { text: "Willkommen! Erstelle oder spiele deine Story.", choices: [] }
      }
    };
  });

  const [currentScene, setCurrentScene] = useState(story.start);
  const [tab, setTab] = useState("play");
  const [newSceneId, setNewSceneId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem("storyData", JSON.stringify(story));
  }, [story]);

  const scene = story.scenes[currentScene] || { text: "Unbekannte Szene", choices: [] };

  function addScene() {
    if (!newSceneId) {
      alert("Bitte gib eine Szene-ID ein.");
      return;
    }
    setStory(prev => ({
      ...prev,
      scenes: { ...prev.scenes, [newSceneId]: { text: "", choices: [] } }
    }));
    setNewSceneId("");
  }

  function deleteScene(sceneId) {
    if (sceneId === story.start) {
      alert("Die Startszene kann nicht gelöscht werden.");
      return;
    }
    const newScenes = { ...story.scenes };
    delete newScenes[sceneId];
    setStory({ ...story, scenes: newScenes });
    if (currentScene === sceneId) setCurrentScene(story.start);
  }

  function updateScene(sceneId, text) {
    setStory(prev => ({
      ...prev,
      scenes: { ...prev.scenes, [sceneId]: { ...prev.scenes[sceneId], text } }
    }));
  }

  function addChoice(sceneId, choiceText, nextScene) {
    if (!choiceText || !nextScene) {
      alert("Bitte gib Text und nächste Szene ein.");
      return;
    }
    setStory(prev => ({
      ...prev,
      scenes: {
        ...prev.scenes,
        [sceneId]: {
          ...prev.scenes[sceneId],
          choices: [...(prev.scenes[sceneId].choices || []), { text: choiceText, next: nextScene }]
        }
      }
    }));
  }

  async function generateStory() {
    if (!prompt) {
      alert("Bitte gib einen Kundenwunsch ein.");
      return;
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      alert("API-Schlüssel fehlt. Bitte füge XAI_API_KEY in die .env-Datei hinzu.");
      return;
    }

    setGenerating(true);

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'grok-4',
            messages: [{
              role: 'user',
              content: `Generiere eine interaktive Geschichte als JSON: {start: "intro", scenes: {intro: {text: "...", choices: [{text: "...", next: "..."}]}}} basierend auf: ${prompt}`
            }],
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        if (response.status === 429) {
          // Handle rate limiting with exponential backoff
          attempt++;
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP Fehler: ${response.status}`);
        }

        const data = await response.json();
        const generatedStory = JSON.parse(data.choices[0].message.content);
        setStory(generatedStory);
        setCurrentScene(generatedStory.start);
        alert("Story generiert!");
        break;
      } catch (error) {
        console.error("API Fehler:", error);
        if (attempt === maxRetries - 1) {
          // Fallback to mock story on final failure
          const mockStory = {
            start: "intro",
            scenes: {
              intro: { text: `Generierte Story basierend auf: ${prompt}`, choices: [{ text: "Weiter", next: "ende" }] },
              ende: { text: "Ende der Geschichte.", choices: [] }
            }
          };
          setStory(mockStory);
          setCurrentScene(mockStory.start);
          alert("Mock-Story generiert (API-Fehler).");
        }
      }
      attempt++;
    }
    setGenerating(false);
  }

  return (
    React.createElement("div", { className: "container" },
      React.createElement("div", { className: "flex mb-4 gap-2" },
        ["play", "edit", "generate"].map(t =>
          React.createElement("button", {
            key: t,
            onClick: () => setTab(t),
            className: `tab-button ${tab === t ? "active" : "inactive"}`
          }, t === "play" ? "Spielen" : t === "edit" ? "Editor" : "KI-Generieren")
        ),
        React.createElement("button", {
          onClick: () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(story));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "story.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
          },
          className: "action-button"
        }, "Export"),
        React.createElement("input", {
          type: "file",
          accept: ".json",
          onChange: e => {
            const fileReader = new FileReader();
            fileReader.onload = event => {
              const importedStory = JSON.parse(event.target.result);
              setStory(importedStory);
              setCurrentScene(importedStory.start);
            };
            fileReader.readAsText(e.target.files[0]);
          },
          className: "action-button"
        })
      ),

      tab === "play" &&
        React.createElement("div", null,
          React.createElement("p", { className: "scene-text" }, scene.text),
          scene.choices.map((choice, index) =>
            React.createElement("button", {
              key: index,
              onClick: () => setCurrentScene(choice.next),
              className: "choice-button"
            }, choice.text)
          )
        ),

      tab === "edit" &&
        React.createElement("div", null,
          React.createElement("h2", { className: "font-bold mb-2" }, "Editor"),
          React.createElement("div", { className: "editor-section" },
            React.createElement("input", {
              value: newSceneId,
              onChange: e => setNewSceneId(e.target.value),
              placeholder: "Neue Szene-ID",
              className: "editor-input"
            }),
            React.createElement("button", { onClick: addScene, className: "action-button" }, "Szene hinzufügen")
          ),
          Object.keys(story.scenes).map(sceneId =>
            React.createElement("div", { key: sceneId, className: "editor-section" },
              React.createElement("h3", null, sceneId),
              React.createElement("textarea", {
                value: story.scenes[sceneId].text,
                onChange: e => updateScene(sceneId, e.target.value),
                className: "editor-input"
              }),
              React.createElement("div", null,
                React.createElement("input", {
                  placeholder: "Antworttext",
                  className: "editor-input",
                  id: `choice-text-${sceneId}`
                }),
                React.createElement("input", {
                  placeholder: "Nächste Szene-ID",
                  className: "editor-input",
                  id: `choice-next-${sceneId}`
                }),
                React.createElement("button", {
                  onClick: () => {
                    const text = document.getElementById(`choice-text-${sceneId}`).value;
                    const next = document.getElementById(`choice-next-${sceneId}`).value;
                    addChoice(sceneId, text, next);
                  },
                  className: "action-button"
                }, "Antwort hinzufügen")
              ),
              React.createElement("button", {
                onClick: () => deleteScene(sceneId),
                className: "action-button delete-button"
              }, "Szene löschen")
            )
          )
        ),

      tab === "generate" &&
        React.createElement("div", null,
          React.createElement("h2", { className: "font-bold mb-2" }, "Generiere Story basierend auf Kundenwunsch"),
          React.createElement("textarea", {
            value: prompt,
            onChange: e => setPrompt(e.target.value),
            placeholder: "z.B. 'Eine Fantasy-Geschichte mit einem Drachen und einem mutigen Helden'",
            className: "textarea"
          }),
          React.createElement("button", {
            onClick: generateStory,
            disabled: generating,
            className: `generate-button ${generating ? "disabled" : "enabled"}`
          }, generating ? "Generiere..." : "Story generieren")
        )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
