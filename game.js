let round = 1;
let metrics = { economy: 100, stability: 100, opinion: 50 };
let genre = 'modern';

function setup() {
  createCanvas(0, 0); // No canvas needed, using p5.js for structure
}

async function submitTurn() {
  const policy = document.getElementById("policy").value;
  const vote = document.getElementById("vote").value;
  const comment = document.getElementById("comment").value;
  const genre = document.getElementById("genre").value;

  const response = await fetch("http://localhost:3000/api/ai-response", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ policy, vote, comment, genre }),
  });

  const data = await response.json();
  document.getElementById("output").innerText = data.aiResponse;
}
