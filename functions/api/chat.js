const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });

export const onRequestOptions = () => new Response(null, { status: 204, headers: cors });

export async function onRequestPost({ request, env }) {
  try {
    const { messages, password } = await request.json();

    if (!env.PASSWORD || password !== env.PASSWORD) {
      return json({ reply: 'Unauthorized' }, 401);
    }

    // Keep only user/assistant text, last 12 turns, so visitors can't inject
    // their own system messages or send huge payloads.
    const clean = (Array.isArray(messages) ? messages : [])
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));

    if (!clean.length) return json({ reply: 'No messages provided' }, 400);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        max_tokens: 400,
        messages: [{ role: 'system', content: env.SYSTEM_PROMPT }, ...clean],
      }),
    });

    const data = await res.json();
    return json({ reply: data?.choices?.[0]?.message?.content || 'No response' });
  } catch (err) {
    return json({ reply: 'Server error: ' + err.message }, 500);
  }
}
