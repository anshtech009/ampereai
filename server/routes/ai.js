const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/chat', async (req, res) => {
  const { message, messages, context } = req.body;

  // Accept either a single message or a full conversation
  if (!message && (!messages || messages.length === 0)) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Build a context block from the user's real data (if provided)
  let contextBlock = '';
  if (context) {
    const { name, state, totalUnits, totalBill, appliances } = context;
    contextBlock = `
Here is the current user's data — use it to personalize your answers:
- Name: ${name || 'Unknown'}
- State: ${state || 'Unknown'}
- Total monthly usage: ${totalUnits != null ? totalUnits.toFixed(1) + ' kWh' : 'Unknown'}
- Estimated monthly bill: ${totalBill != null ? '₹' + totalBill.toFixed(0) : 'Unknown'}
- Appliances:
${(appliances && appliances.length)
  ? appliances.map(a => `  • ${a.name} — ${a.wattage}W, ${a.hoursPerDay}h/day, category: ${a.category}`).join('\n')
  : '  (none added)'}
`;
  }

  const systemPrompt = `You are AmperAI, an intelligent assistant built into a smart electricity management app for Indian households.

Your specialty is electricity: helping users understand usage, save energy, reduce bills, and make smart appliance decisions. When relevant, use kWh for units, ₹ for costs, and reference Indian electricity context (DISCOMs, climate, tariffs).

You can also answer general questions helpfully and conversationally — if a user asks something outside electricity, answer it naturally, then you may gently offer to help with their energy usage if it fits. Don't refuse general questions.

Use the user's personal data below to give specific, personalized answers. If they ask about "my appliances", "my bill", or "my name", answer from this data. If a detail isn't available, say so honestly.
${contextBlock}
Be concise, friendly, and specific. Keep most answers to 3-5 sentences unless more detail is clearly needed.`;

  // Assemble the message list for Groq
  const groqMessages = [{ role: 'system', content: systemPrompt }];

  if (messages && messages.length) {
    // Use the conversation history (skip any stored system messages)
    messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .forEach(m => groqMessages.push({ role: m.role, content: m.content }));
  } else {
    groqMessages.push({ role: 'user', content: message });
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not process that.';
    res.json({ reply });

  } catch (error) {
    console.error('Groq API error:', error.message);
    res.status(500).json({ error: 'AI service error. Please try again.' });
  }
});

module.exports = router;