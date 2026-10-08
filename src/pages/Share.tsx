import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCollectionContext from "contexts/Collection";
import MyButton from "components/MyButton";
import { PageContainer, Panel, MutedText } from "components/ui";
import { decodeDeck, DecodedDeck } from "utils/share";

export default function SharePage() {
  const { importSharedCollection } = useCollectionContext();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<DecodedDeck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const payload = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("d");
    if (!payload) {
      setError("Liên kết không chứa dữ liệu bộ thẻ.");
      return;
    }
    decodeDeck(payload)
      .then(setDeck)
      .catch((err) => setError(err?.message || "Không đọc được liên kết chia sẻ"));
  }, []);

  const handleImport = () => {
    if (!deck) return;
    const pathname = importSharedCollection(deck);
    navigate(`/collections/${pathname}`);
  };

  return (
    <PageContainer>
      <Panel>
        <h2>Nhận bộ thẻ được chia sẻ</h2>
        {error && <MutedText style={{ color: "#dc2626" }}>{error}</MutedText>}
        {!error && !deck && <MutedText>Đang đọc liên kết...</MutedText>}
        {deck && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <strong style={{ fontSize: 18 }}>{deck.name}</strong>
              <MutedText>
                {deck.words.length} thẻ{deck.category ? ` • ${deck.category}` : ""}
              </MutedText>
              {deck.description && <MutedText>{deck.description}</MutedText>}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, maxHeight: 220, overflow: "auto" }}>
              {deck.words.slice(0, 20).map((w, i) => (
                <li key={i}>
                  <strong>{w.source}</strong> — {w.target}
                </li>
              ))}
              {deck.words.length > 20 && <li>... và {deck.words.length - 20} thẻ khác</li>}
            </ul>
            <div>
              <MyButton variant="primary" onClick={handleImport}>
                Thêm vào bộ sưu tập của tôi
              </MyButton>
            </div>
          </div>
        )}
      </Panel>
    </PageContainer>
  );
}
