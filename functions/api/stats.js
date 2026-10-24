// Cloudflare Pages Function: functions/api/stats.js
// Keeps your OpenRouter keys on the server; the stats page only gets numbers back.
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function onRequestPost({ request, env }) {
  try {
    const { password } = await request.json();
    if (!env.STATS_PASSWORD || password !== env.STATS_PASSWORD) {
      return json({ error: 'Wrong password' }, 401);
    }

    // Credits (USD) for the chatbot's API key
    const keyRes = await fetch('https://openrouter.ai/api/v1/key', {
      headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
    });
    const body = await keyRes.json();
    const k = body.data || body;
    const out = {
      credits: {
        total: k.usage, today: k.usage_daily, week: k.usage_weekly, month: k.usage_monthly,
        limit: k.limit, remaining: k.limit_remaining,
      },
    };

    // Tokens by day (optional: needs OPENROUTER_MGMT_KEY)
    if (env.OPENROUTER_MGMT_KEY) {
      const r = await fetch('https://openrouter.ai/api/v1/activity', {
        headers: { Authorization: `Bearer ${env.OPENROUTER_MGMT_KEY}` },
      });
      const a = await r.json();
      if (r.ok && Array.isArray(a.data)) {
        const days = {};
        for (const row of a.data) {
          const d = days[row.date] || (days[row.date] = { date: row.date, requests: 0, prompt: 0, completion: 0, cost: 0 });
          d.requests += row.requests || 0;
          d.prompt += row.prompt_tokens || 0;
          d.completion += row.completion_tokens || 0;
          d.cost += row.usage || 0;
        }
        out.days = Object.values(days).sort((x, y) => y.date.localeCompare(x.date));
      } else {
        out.activityError = (a.error && a.error.message) || 'Could not load token activity';
      }
    }
    return json(out);
  } catch (err) {
    return json({ error: 'Server error: ' + err.message }, 500);
  }
}
