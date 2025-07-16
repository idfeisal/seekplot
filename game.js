let round = 1;
let metrics = { economy: 100, stability: 100, opinion: 50 };
let genre = 'modern';

function setup() {
  createCanvas(0, 0); // No canvas needed, using p5.js for structure
}

async function simulateAIResponse(policy, vote, comment, genre) {
  try {
    const useChatGPT = true; // Toggle to use your API or ChatGPT directly

    if (useChatGPT) {
      // Call OpenAI ChatGPT API via your secure backend or direct fetch (for local testing only)
      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      const apiKey = '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'; // Replace securely

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Adjust as per your plan
          messages: [
            {
              role: 'system',
              content: `You are an AI policy advisor in a ${genre} setting. Provide concise in-universe responses.`
            },
            {
              role: 'user',
              content: `Policy Proposal: ${policy}\nVote: ${vote}\nComment: ${comment}`
            }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices[0].message.content.trim() || 'No ChatGPT response.';
    } else {
      // Your existing API call fallback
      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      const apiKey = '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';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ policy, vote, comment, genre })
      });
      const data = await response.json();
      return data.response || 'API error: No response received.';
    }

  } catch (error) {
    console.error('AI call failed:', error);
    return `Fallback: The ${genre} faction responds to your ${policy.includes('neutral') ? 'neutral' : 'bold'} policy.`;
  }
}
