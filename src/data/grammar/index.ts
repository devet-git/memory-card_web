import { GLevel, GrammarTopic } from "utils/grammar";
import { A1 } from "./a1";
import { A2 } from "./a2";
import { B1 } from "./b1";
import { B2 } from "./b2";
import { C1 } from "./c1";
import { C2 } from "./c2";

/** All grammar lessons, easiest first. */
export const TOPICS: GrammarTopic[] = [...A1, ...A2, ...B1, ...B2, ...C1, ...C2];

export const topicById = (id: string): GrammarTopic | undefined => TOPICS.find((t) => t.id === id);
export const topicsOf = (level: GLevel): GrammarTopic[] => TOPICS.filter((t) => t.level === level);
