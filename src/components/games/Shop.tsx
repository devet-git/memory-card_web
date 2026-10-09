import React, { useState } from "react";
import styled from "styled-components";
import MyButton from "components/MyButton";
import { Panel, MutedText } from "components/ui";
import useCollectionContext from "contexts/Collection";
import { profileOf } from "utils/games";
import { SHOP_ITEMS, ShopItem, balanceOf, owns } from "utils/shop";
import { MAX_FREEZES } from "utils/streak";

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 10px;
`;

const Item = styled.div<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid ${(p) => (p.$active ? "var(--accent-primary, #3b82f6)" : "var(--border-color, #e2e8f0)")};

  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
  }
  .swatch {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: inline-block;
    flex: none;
  }
  .emoji {
    font-size: 24px;
    line-height: 1;
  }
  .desc {
    font-size: 12.5px;
    color: var(--text-secondary, #64748b);
    flex: 1;
    line-height: 1.4;
  }
`;

/** Where coins are spent: a few cosmetics and the streak freeze. */
export default function Shop() {
  const { stats, buyItem, equipItem, unequipSlot } = useCollectionContext();
  const [message, setMessage] = useState<string | null>(null);
  const profile = profileOf(stats);
  const balance = balanceOf(profile);

  const say = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage((m) => (m === text ? null : m)), 2500);
  };

  const buy = (item: ShopItem) => {
    const r = buyItem(item.id);
    say(r.ok ? (item.kind === "consumable" ? `Đã mua ${item.name}!` : `Đã mua và đang dùng “${item.name}”.`) : r.error || "Không mua được.");
  };

  return (
    <Panel>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>🛍️ Cửa hàng</h3>
          <MutedText>Dùng xu kiếm được từ các trò chơi để đổi giao diện hoặc mua băng streak.</MutedText>
        </div>
        <b style={{ color: "#d97706", fontSize: 18 }}>{balance} 🪙</b>
      </div>
      <div style={{ minHeight: 20, fontSize: 13, color: "#b45309", marginBottom: 6 }} role="status">
        {message}
      </div>
      <Grid>
        {SHOP_ITEMS.map((item) => {
          const owned = item.kind === "cosmetic" && owns(profile, item.id);
          const active = Boolean(item.slot && profile.equipped?.[item.slot] === item.id && owned);
          const full = item.id === "freeze" && (stats.freezes ?? 0) >= MAX_FREEZES;
          return (
            <Item key={item.id} $active={active}>
              <div className="head">
                {item.preview.startsWith("#") ? <span className="swatch" style={{ background: item.preview }} aria-hidden /> : <span className="emoji">{item.preview}</span>}
                <span>{item.name}</span>
              </div>
              <div className="desc">
                {item.desc}
                {item.id === "freeze" ? ` Hiện có ${stats.freezes ?? 0}.` : ""}
              </div>
              {owned ? (
                active ? (
                  <MyButton variant="secondary" size="sm" onClick={() => item.slot && unequipSlot(item.slot)}>
                    ✓ Đang dùng • Bỏ dùng
                  </MyButton>
                ) : (
                  <MyButton variant="outline" size="sm" onClick={() => equipItem(item.id)}>
                    Dùng
                  </MyButton>
                )
              ) : (
                <MyButton variant="primary" size="sm" disabled={balance < item.price || full} onClick={() => buy(item)}>
                  {full ? "Đã đủ" : `Mua • ${item.price} 🪙`}
                </MyButton>
              )}
            </Item>
          );
        })}
      </Grid>
    </Panel>
  );
}
