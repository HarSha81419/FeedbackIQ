import { useState, useCallback } from 'react';
import type { ChatQueryPayload, ChatResponsePayload } from '@/types';
import { chatQuery, streamChatQuery } from '@/services/chat.service';

interface UseStreamChatResult {
  isPending: boolean;
  error: Error | null;
  streamChat: (payload: ChatQueryPayload) => AsyncGenerator<string, void, unknown>;
}

export function useStreamChat(): UseStreamChatResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const streamChat = useCallback(
    async function* (payload: ChatQueryPayload): AsyncGenerator<string, void, unknown> {
      setIsPending(true);
      setError(null);
      try {
        yield* streamChatQuery(payload);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return { isPending, error, streamChat };
}

export function useChatQuery() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeQuery = useCallback(
    async (payload: ChatQueryPayload): Promise<ChatResponsePayload> => {
      setIsPending(true);
      setError(null);
      try {
        const result = await chatQuery(payload);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return { isPending, error, executeQuery };
}
