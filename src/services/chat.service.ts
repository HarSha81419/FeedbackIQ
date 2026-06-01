import type { ChatQueryPayload, ChatResponsePayload } from '@/types';
import { api } from '@/services/api';
import { getToken } from '@/utils/token';

export async function chatQuery(payload: ChatQueryPayload): Promise<ChatResponsePayload> {
  const response = await api.post<ChatResponsePayload>('/chat/query', payload);
  return response.data;
}

export async function* streamChatQuery(payload: ChatQueryPayload): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${api.defaults.baseURL}/chat/query-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken() || ''}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to stream chat: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data) yield data;
        }
      }
    }

    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6);
      if (data) yield data;
    }
  } finally {
    reader.releaseLock();
  }
}
