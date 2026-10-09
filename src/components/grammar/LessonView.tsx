import React, { useState } from "react";
import styled from "styled-components";
import { MdVolumeUp } from "react-icons/md";
import MyButton from "components/MyButton";
import { Panel, MutedText } from "components/ui";
import useCollectionContext from "contexts/Collection";
import { useSpeak, SpeakSpinner } from "hooks/useSpeak";
import { GrammarTopic } from "utils/grammar";

const Rule = styled.div`
  margin-bottom: 12px;

  h4 {
    margin: 0 0 4px;
    font-size: 15px;
  }
  ul {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14.5px;
    line-height: 1.55;
  }
`;

const Example = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border-color, #e2e8f0);

  &:last-child {
    border-bottom: none;
  }
  .en {
    font-weight: 700;
  }
  .vi {
    font-size: 13px;
    color: var(--text-secondary, #64748b);
  }
`;

const Mistake = styled.div`
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--bg-tertiary, #f1f5f9);
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;

  .wrong {
    color: #dc2626;
    text-decoration: line-through;
  }
  .right {
    color: #059669;
    font-weight: 700;
  }
  .why {
    font-size: 13px;
    color: var(--text-secondary, #64748b);
  }
`;

const DECK_NAME = "Ngữ pháp";

interface Props {
  topic: GrammarTopic;
  onPractice: () => void;
}

/** The explanation of one grammar point: rules, examples with audio, common mistakes. */
export default function LessonView({ topic, onPractice }: Props) {
  const { collections, addCollection, addWord } = useCollectionContext();
  const { speak, isLoading } = useSpeak();
  const [note, setNote] = useState<string | null>(null);

  const saveExamples = () => {
    const existing = collections.find((c) => c.name.toLowerCase() === DECK_NAME.toLowerCase());
    let pathname = existing?.pathname;
    if (!pathname) {
      const r = addCollection(DECK_NAME, "Ngữ pháp", "Câu ví dụ từ các bài học ngữ pháp");
      pathname = r.pathname;
    }
    if (!pathname) return setNote("Không tạo được bộ thẻ “Ngữ pháp”.");
    const have = new Set((existing?.words || []).map((w) => w.source.trim().toLowerCase()));
    const fresh = topic.examples.filter((e) => !have.has(e.en.trim().toLowerCase()));
    [...fresh].reverse().forEach((e) => addWord(pathname!, { source: e.en, target: e.vi, notes: `Ngữ pháp: ${topic.titleVi}` }));
    setNote(fresh.length ? `Đã thêm ${fresh.length} câu vào bộ thẻ “${DECK_NAME}”.` : "Các câu ví dụ này đã có trong bộ thẻ rồi.");
    window.setTimeout(() => setNote(null), 3500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel>
        <MutedText style={{ lineHeight: 1.6, fontSize: 14.5 }}>{topic.summary}</MutedText>
      </Panel>

      <Panel>
        <h3>Quy tắc</h3>
        {topic.rules.map((r) => (
          <Rule key={r.title}>
            <h4>{r.title}</h4>
            <ul>
              {r.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Rule>
        ))}
      </Panel>

      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>Ví dụ</h3>
          <MyButton variant="outline" size="sm" onClick={saveExamples} title="Thêm các câu ví dụ thành thẻ để ôn bằng lặp lại ngắt quãng">
            📌 Lưu ví dụ vào bộ thẻ
          </MyButton>
        </div>
        {note && (
          <div style={{ fontSize: 13, color: "#b45309", marginBottom: 6 }} role="status">
            {note}
          </div>
        )}
        {topic.examples.map((e) => (
          <Example key={e.en}>
            <MyButton variant="ghost" size="sm" onClick={() => speak(e.en, e.en)} aria-label={`Nghe: ${e.en}`} icon={isLoading(e.en) ? <SpeakSpinner /> : <MdVolumeUp />} />
            <div>
              <div className="en">{e.en}</div>
              <div className="vi">{e.vi}</div>
            </div>
          </Example>
        ))}
      </Panel>

      <Panel>
        <h3>Lỗi người Việt hay mắc</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {topic.mistakes.map((m) => (
            <Mistake key={m.wrong}>
              <span className="wrong">✗ {m.wrong}</span>
              <span className="right">✓ {m.right}</span>
              <span className="why">{m.why}</span>
            </Mistake>
          ))}
        </div>
      </Panel>

      <div style={{ textAlign: "center" }}>
        <MyButton variant="primary" size="lg" onClick={onPractice}>
          Luyện tập chủ điểm này ({topic.exercises.length} bài)
        </MyButton>
      </div>
    </div>
  );
}
