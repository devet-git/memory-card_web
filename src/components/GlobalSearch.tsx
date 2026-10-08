import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import MyModal from "components/MyModal";
import { MyInput } from "components/MyInput";
import useCollectionContext from "contexts/Collection";
import { removeAccent } from "utils/removeAccent";

const Result = styled.button`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  color: inherit;
  cursor: pointer;

  &:hover,
  &:focus {
    border-color: #3b82f6;
    outline: none;
  }

  .deck {
    font-size: 12px;
    color: var(--text-muted, #94a3b8);
  }
`;

const norm = (s: string) => removeAccent(s || "").toLowerCase();

interface Props {
  onClose: () => void;
}

/** Ctrl/Cmd+K: find any card (term, meaning or example) across all collections. */
export default function GlobalSearch({ onClose }: Props) {
  const { collections } = useCollectionContext();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = norm(query.trim());
    if (q.length < 1) return [];
    const out: { pathname: string; deck: string; id: string | number; source: string; target: string }[] = [];
    for (const c of collections) {
      for (const w of c.words) {
        if (norm(w.source).includes(q) || norm(w.target).includes(q) || norm(w.example || "").includes(q)) {
          out.push({ pathname: c.pathname, deck: c.name, id: w.id, source: w.source, target: w.target });
          if (out.length >= 40) return out;
        }
      }
    }
    return out;
  }, [query, collections]);

  const open = (pathname: string, source: string) => {
    onClose();
    navigate(`/collections/${pathname}?mode=table&q=${encodeURIComponent(source)}`);
  };

  return (
    <MyModal title="Tìm kiếm thẻ" onClose={onClose} maxWidth="560px">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <MyInput
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) open(results[0].pathname, results[0].source);
          }}
          placeholder="Gõ từ, nghĩa hoặc câu ví dụ (không cần dấu)..."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflow: "auto" }}>
          {query.trim() && results.length === 0 && (
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Không tìm thấy thẻ nào.</span>
          )}
          {results.map((r) => (
            <Result key={`${r.pathname}-${r.id}`} onClick={() => open(r.pathname, r.source)}>
              <span>
                <strong>{r.source}</strong> — {r.target}
              </span>
              <span className="deck">{r.deck}</span>
            </Result>
          ))}
        </div>
      </div>
    </MyModal>
  );
}
