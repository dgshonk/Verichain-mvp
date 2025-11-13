import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());
app.use(express.static('.')); // Serve index.html

// In-memory vault (restarts on refresh — perfect for MVP)
let vault = [];
let idCounter = 1;

// AI Fact-Check via Hugging Face (FREE)
async function checkFact(claim) {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // ← Get free key below
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `Is this true? "${claim}" Answer in 1 sentence with "True", "False", or "Uncertain".`
        })
      }
    );
    const data = await response.json();
    return data[0]?.generated_text?.trim() || "Uncertain (AI timeout)";
  } catch (e) {
    return "Error: AI unavailable";
  }
}

// API: Verify fact
app.post('/api/verify', async (req, res) => {
  const { claim, source } = req.body;
  const verdict = await checkFact(claim);

  const entry = {
    id: idCounter++,
    claim,
    source,
    verdict,
    timestamp: new Date().toISOString()
  };
  vault.push(entry);

  res.json(entry);
});

// API: Get vault
app.get('/api/vault', (req, res) => {
  res.json(vault);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`VeriChain MVP running on port ${port}`);
  console.log(`Open: http://localhost:${port}`);
});