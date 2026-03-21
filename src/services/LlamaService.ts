/**
 * LlamaService.ts
 * Wraps llama.rn for model initialization, streaming generation, and cleanup.
 * llama.rn requires native code and is not available in Expo Go.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { runInAction } from 'mobx';
import { modelStore } from '../stores/ModelStore';
import { chatStore } from '../stores/ChatStore';
import { settingsStore } from '../stores/SettingsStore';

function detectExpoGo(): boolean {
  try {
    return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  } catch {
    return false;
  }
}

const isExpoGo = detectExpoGo();

let LlamaModule: any = null;

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('llama.rn');
    if (mod?.initLlama) LlamaModule = mod;
  } catch (e) {
    console.warn('[LlamaService] llama.rn not available:', e);
  }
}

if (!LlamaModule) {
  console.warn('[LlamaService] On-device AI unavailable. Use a development build: npx expo run:ios');
}

/** True if running in Expo Go (on-device AI will not be available). */
export function isRunningInExpoGo(): boolean {
  return isExpoGo;
}

/** User-facing message when model load fails due to Expo Go or missing native module. */
export const LLAMA_UNAVAILABLE_MESSAGE =
  'On-device AI is not available in Expo Go. To load and run models, create a development build.\n\n' +
  'In terminal, from the project folder (KaviAI/KaviAI):\n' +
  '• iOS: npx expo run:ios\n' +
  '• Android: npx expo run:android';

/** Result of initModel so the UI can show the real error. */
export interface InitModelResult {
  success: boolean;
  errorMessage?: string;
}

/** Normalize path for native: some iOS APIs need a path without file:// */
function pathForNative(pathOrUri: string): string {
  const s = pathOrUri.trim();
  if (s.startsWith('file://')) {
    return s.slice(7);
  }
  return s;
}

export async function initModel(modelPath: string): Promise<InitModelResult> {
  if (!LlamaModule) {
    console.warn('[LlamaService] llama.rn not loaded');
    return {
      success: false,
      errorMessage: isExpoGo ? LLAMA_UNAVAILABLE_MESSAGE : 'Native AI runtime not loaded.',
    };
  }
  if (modelStore.llamaContext) {
    try { await modelStore.llamaContext.release(); } catch (_) {}
  }
  const nativePath = pathForNative(modelPath);
  try {
    modelStore.setIsLoadingModel(true);
    const ctx = await LlamaModule.initLlama({
      model: nativePath,
      use_mlock: true,
      n_ctx: settingsStore.inference.contextLength,
      n_gpu_layers: settingsStore.inference.gpuLayers,
    });
    runInAction(() => {
      modelStore.setLlamaContext(ctx);
      modelStore.setIsLoadingModel(false);
      if (modelStore.activeModel) {
        modelStore.setModelLoaded(modelStore.activeModel.id, true);
      }
    });
    return { success: true };
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    const isNativeUnavailable =
      msg.includes("'install' of null") ||
      msg.includes('of null') ||
      msg.includes('native module') ||
      msg.includes('TurboModule') ||
      msg.includes('could not be found');
    if (isNativeUnavailable && LlamaModule) {
      LlamaModule = null;
      console.warn('[LlamaService] Native module unavailable (e.g. Expo Go). Use a dev build to load models: npx expo run:ios');
      modelStore.setIsLoadingModel(false);
      return { success: false, errorMessage: LLAMA_UNAVAILABLE_MESSAGE };
    }
    console.error('[LlamaService] initModel failed:', e);
    modelStore.setIsLoadingModel(false);
    const friendly = msg.length > 200 ? msg.slice(0, 197) + '...' : msg;
    return { success: false, errorMessage: friendly };
  }
}

/** Whether the llama native module is available (false in Expo Go). */
export function isLlamaAvailable(): boolean {
  return LlamaModule != null;
}

export async function releaseModel(): Promise<void> {
  if (modelStore.llamaContext) {
    try { await modelStore.llamaContext.release(); } catch (_) {}
    runInAction(() => {
      modelStore.setLlamaContext(null);
      if (modelStore.activeModel) {
        modelStore.setModelLoaded(modelStore.activeModel.id, false);
      }
    });
  }
}

function buildChatMLPrompt(systemPrompt: string, messages: { role: string; content: string }[]): string {
  let prompt = '<|im_start|>system\n' + systemPrompt + '<|im_end|>\n';
  for (const m of messages) {
    prompt += '<|im_start|>' + m.role + '\n' + m.content + '<|im_end|>\n';
  }
  prompt += '<|im_start|>assistant\n';
  return prompt;
}

const STOP_SEQUENCES = [
  '<|im_end|>', '<|im_start|>', '</s>', '<|eot_id|>', '<|end|>',
  '<|endoftext|>', '<|end_of_turn|>', '<|assistant|>', '<|user|>',
  '<|start_header_id|>', '<|end_header_id|>',
  '\nUser:', '\nuser:', '\nAssistant:', '\nassistant:',
  '\n### User', '\n### Assistant', '\n### Human', '\n### Response',
  '\nHuman:', '\nhuman:',
];

async function buildPrompt(
  ctx: any,
  systemPrompt: string,
  messages: { role: string; content: string }[],
): Promise<{ prompt: string; stop: string[] }> {
  const chatMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  if (typeof ctx.getFormattedChat === 'function') {
    try {
      const formatted = await ctx.getFormattedChat(chatMessages, null);
      if (typeof formatted === 'string' && formatted.length > 0) {
        return { prompt: formatted, stop: STOP_SEQUENCES };
      }
    } catch (_) {}
  }

  return {
    prompt: buildChatMLPrompt(systemPrompt, messages),
    stop: STOP_SEQUENCES,
  };
}

const TEMPLATE_TOKEN_RE = /<\|(?:im_end|im_start|eot_id|end|endoftext|end_of_turn|assistant|user|system|start_header_id|end_header_id)\|?>?[a-z]*/g;
const ROLE_PREFIX_RE = /^(User|Assistant|Human|Response|user|assistant|human|response):\s*/;

function stripTemplateTokens(text: string): string {
  return text.replace(TEMPLATE_TOKEN_RE, '').replace(/<\/s>/g, '');
}

export async function generateResponse(systemPrompt: string): Promise<void> {
  const ctx = modelStore.llamaContext;
  if (!ctx) {
    console.warn('[LlamaService] No context loaded');
    return;
  }

  const msgs = chatStore.messages.map(m => ({ role: m.role, content: m.content }));
  const { prompt, stop } = await buildPrompt(ctx, systemPrompt, msgs);
  const { nPredict, temperature, topK, topP, minP, repeatPenalty } = settingsStore.inference;

  chatStore.startAssistantMessage();
  const startTs = Date.now();
  let tokenCount = 0;
  let firstTokenTs: number | null = null;
  let tokenBuffer = '';
  let shouldStop = false;
  let fullOutput = '';

  try {
    const result = await ctx.completion(
      {
        prompt,
        n_predict: nPredict,
        temperature,
        top_k: topK,
        top_p: topP,
        min_p: minP,
        repeat_penalty: repeatPenalty,
        stop,
      },
      (data: { token: string }) => {
        if (shouldStop) return;
        if (firstTokenTs === null) firstTokenTs = Date.now();
        tokenCount++;

        tokenBuffer += data.token;
        fullOutput += data.token;

        for (const sq of STOP_SEQUENCES) {
          if (fullOutput.includes(sq)) {
            shouldStop = true;
            try { ctx.stopCompletion(); } catch (_) {}
            const beforeStop = fullOutput.split(sq)[0];
            const cleaned = stripTemplateTokens(beforeStop).replace(ROLE_PREFIX_RE, '');
            if (cleaned.length > 0) {
              runInAction(() => {
                chatStore.streamingContent = '';
                chatStore.appendToken(cleaned);
              });
            }
            tokenBuffer = '';
            return;
          }
        }

        const cleaned = stripTemplateTokens(tokenBuffer);
        if (cleaned.includes('<|') || cleaned.includes('<')) return;

        if (cleaned.length > 0) {
          runInAction(() => chatStore.appendToken(cleaned));
        }
        tokenBuffer = '';
      },
    );

    if (!shouldStop && tokenBuffer.length > 0) {
      const finalCleaned = stripTemplateTokens(tokenBuffer);
      if (finalCleaned.length > 0) {
        runInAction(() => chatStore.appendToken(finalCleaned));
      }
    }

    const totalMs = Date.now() - startTs;
    const ttftMs = firstTokenTs ? firstTokenTs - startTs : totalMs;
    const tokensPerSec = tokenCount > 0 ? (tokenCount / (totalMs / 1000)) : 0;
    const msPerToken = tokenCount > 0 ? (totalMs / tokenCount) : 0;

    runInAction(() =>
      chatStore.finalizeAssistantMessage({
        tokenCount,
        ttftMs,
        tokensPerSec,
        msPerToken,
      }),
    );
  } catch (e: any) {
    console.error('[LlamaService] generation error:', e);
    runInAction(() => chatStore.setIsGenerating(false));
  }
}

export function stopGeneration(): void {
  const ctx = modelStore.llamaContext;
  if (ctx) {
    try { ctx.stopCompletion(); } catch (_) {}
  }
  chatStore.setIsGenerating(false);
}
