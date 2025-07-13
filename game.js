let round = 1;
let metrics = { economy: 100, stability: 100, opinion: 50 };
let genre = 'modern';

function setup() {
  createCanvas(0, 0); // No canvas needed, using p5.js for structure
}

function submitTurn() {
  const policy = document.getElementById('policy').value;
  const vote = document.getElementById('vote').value;
  const reason = document.getElementById('vote-reason').value;
  const comment = document.getElementById('comment').value;
  genre = document.getElementById('genre').value;

  if (policy.split(' ').length > 50) {
    alert('Policy must be 50 words or less!');
    return;
  }
  if (!reason || !comment) {
    alert('Please provide a vote reason and comment.');
    return;
  }

  let response = simulateAIResponse(policy, vote, comment, genre);
  updateMetrics(vote, policy);
  displayOutput(policy, vote, reason, comment, response);

  round++;
  if (round > 3) {
    endGame();
  } else {
    document.getElementById('policy').value = '';
    document.getElementById('vote-reason').value = '';
    document.getElementById('comment').value = '';
  }
}

function simulateAIResponse(policy, vote, comment, genre) {
  const narratives = {
    medieval: `The rival kingdom demands fair terms, wary of your ${policy.includes('neutral') ? 'neutral mediators' : 'self-serving policies'}.`,
    modern: `The opposing nation critiques your ${policy.includes('neutral') ? 'balanced approach' : 'resource-heavy proposal'}, seeking compromise.`,
    alternate_history: `The faction from the shattered timeline questions your ${policy.includes('neutral') ? 'diplomatic intent' : 'aggressive stance'}.`
  };
  let response = narratives[genre] || narratives.modern;
  if (vote === 'reject') response += ' Your rejection escalates tensions.';
  if (comment.includes('500/500')) response += ' They consider the 500/500 split but demand oversight.';
  return response;
}

function updateMetrics(vote, policy) {
  if (vote === 'approve') {
    metrics.stability += 5;
    metrics.opinion += 10;
  } else {
    metrics.stability -= 10;
  }
  if (policy.includes('$4M') || policy.includes('$5M')) metrics.economy -= 5;
  if (policy.includes('neutral')) metrics.opinion += 5;
  if (policy.includes('research')) metrics.stability += 10;

  const events = [
    { desc: 'Resource failure!', economy: -10 },
    { desc: 'External interference!', stability: -5 }
  ];
  const event = events[Math.floor(Math.random() * events.length)];
  metrics.economy += event.economy || 0;
  metrics.stability += event.stability || 0;

  metrics.economy = Math.max(0, Math.min(100, metrics.economy));
  metrics.stability = Math.max(0, Math.min(100, metrics.stability));
  metrics.opinion = Math.max(0, Math.min(100, metrics.opinion));

  document.getElementById('metrics').innerText = 
    `Economy: ${metrics.economy}% | Stability: ${metrics.stability}% | Public Opinion: ${metrics.opinion}%`;
}

function displayOutput(policy, vote, reason, comment, response) {
  const output = `
    <strong>Round ${round}</strong><br>
    Genre: ${genre}<br>
    Your Policy: ${policy}<br>
    Vote: ${vote} - ${reason}<br>
    Comment: ${comment}<br>
    AI Response: ${response}<br>
    Metrics: Economy: ${metrics.economy}%, Stability: ${metrics.stability}%, Opinion: ${metrics.opinion}%
  `;
  document.getElementById('output').innerHTML += output + '<hr>';
}

function endGame() {
  let result = metrics.economy > 80 && metrics.stability > 90 && metrics.opinion > 70 
    ? 'Victory! You balanced economy, stability, and opinion successfully.' 
    : 'Defeat. Metrics fell short of goals.';
  document.getElementById('output').innerHTML += `<strong>Game Over</strong><br>${result}`;
  document.querySelector('button').disabled = true;
}
