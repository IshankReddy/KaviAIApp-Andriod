import { secretsStore } from '../stores/SecretsStore';
import { settingsStore } from '../stores/SettingsStore';
import type { Message } from '../stores/ChatStore';

function toChatMessages(messages: Message[]) {
  return messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content }));
}

export async function generateCloudResponse(systemPrompt: string, messages: Message[]): Promise<string> {
  const backend = settingsStore.app.chatBackend;
  const chatMessages = toChatMessages(messages);

  if (backend === 'openai') {
    const key = secretsStore.openaiKey.trim();
    if (!key) throw new Error('Missing OpenAI API key (set it in Settings).');
    const model = settingsStore.app.openaiModel || 'gpt-4.1';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...chatMessages],
      }),
    });
    const json: any = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || 'OpenAI request failed');
    return json?.choices?.[0]?.message?.content ?? '';
  }

  if (backend === 'anthropic') {
    const key = secretsStore.anthropicKey.trim();
    if (!key) throw new Error('Missing Anthropic API key (set it in Settings).');
    const model = settingsStore.app.anthropicModel || 'claude-sonnet-4-6';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: chatMessages.map((m) => ({ role: m.role, content: [{ type: 'text', text: m.content }] })),
      }),
    });
    const json: any = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || 'Anthropic request failed');
    const blocks = json?.content ?? [];
    return blocks.map((b: any) => (b?.type === 'text' ? b.text : '')).join('') || '';
  }

  if (backend === 'gemini') {
    const key = secretsStore.geminiKey.trim();
    if (!key) throw new Error('Missing Gemini API key (set it in Settings).');
    const model = settingsStore.app.geminiModel || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const parts = [
      { text: `System: ${systemPrompt}` },
      ...chatMessages.map((m) => ({ text: `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}` })),
    ];
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
      }),
    });
    const json: any = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || 'Gemini request failed');
    return json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
  }

  throw new Error('Cloud backend not selected');
}

