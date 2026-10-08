import React, { useCallback, useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { speakWord, TTSOptions } from "utils/speech";

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

// Safety net so a button never stays locked if the browser never fires any speech event
const MAX_LOADING_MS = 10000;

const Spinner = styled.span`
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  flex-shrink: 0;
`;

export const SpeakSpinner = () => <Spinner role="status" aria-label="Đang tải âm thanh" />;

/**
 * Wraps speakWord with a loading state: busy from click until the audio has
 * finished playing, so buttons can show a spinner and ignore repeated clicks.
 * `key` lets several buttons share one hook (only the clicked one spins).
 */
export function useSpeak() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const speak = useCallback((key: string, text: string, options?: TTSOptions | string, rate?: number) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setActiveKey(key);

    const release = () => {
      busyRef.current = false;
      if (mountedRef.current) setActiveKey(null);
    };
    const timer = window.setTimeout(release, MAX_LOADING_MS);

    speakWord(text, options, rate).finally(() => {
      window.clearTimeout(timer);
      release();
    });
  }, []);

  return {
    speak,
    isBusy: activeKey !== null,
    isLoading: (key: string) => activeKey === key
  };
}
