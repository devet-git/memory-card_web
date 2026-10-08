import { useEffect, useState } from "react";
import { AIConfig, AI_CHANGE_EVENT, loadAIConfig } from "utils/ai";

/** Current AI settings (or null when no key is set); stays in sync across components. */
export default function useAIConfig(): AIConfig | null {
  const [config, setConfig] = useState<AIConfig | null>(loadAIConfig);

  useEffect(() => {
    const refresh = () => setConfig(loadAIConfig());
    window.addEventListener(AI_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(AI_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return config;
}
