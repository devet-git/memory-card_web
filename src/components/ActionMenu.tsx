import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { MdMoreHoriz } from "react-icons/md";
import MyButton from "components/MyButton";

const Wrap = styled.div`
  position: relative;
  display: inline-flex;
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 200;
  min-width: 220px;
  max-width: calc(100vw - 24px);
  padding: 6px;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
`;

const Item = styled.button<{ $dim?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary, #0f172a);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  opacity: ${(p) => (p.$dim ? 0.5 : 1)};

  &:hover,
  &:focus {
    background: var(--bg-tertiary, #f1f5f9);
    outline: none;
  }

  svg {
    font-size: 17px;
    flex-shrink: 0;
  }
`;

const Divider = styled.div`
  height: 1px;
  margin: 4px 6px;
  background: var(--border-color, #e2e8f0);
`;

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  dim?: boolean; // greyed out (e.g. feature needs an AI key) but still clickable to explain
  title?: string;
  dividerBefore?: boolean;
}

interface Props {
  label?: React.ReactNode;
  items: ActionMenuItem[];
}

/** Compact "more actions" dropdown that keeps secondary buttons out of the page header. */
export default function ActionMenu({ label = <span className="lbl">Công cụ</span>, items }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <Wrap ref={ref}>
      <MyButton variant="secondary" size="sm" icon={<MdMoreHoriz />} onClick={() => setOpen((v) => !v)} title="Thêm thao tác cho bộ thẻ">
        {label}
      </MyButton>
      {open && (
        <Menu role="menu">
          {items.map((it) => (
            <React.Fragment key={it.label}>
              {it.dividerBefore && <Divider />}
              <Item
                role="menuitem"
                $dim={it.dim}
                title={it.title}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
              >
                {it.icon}
                <span>{it.label}</span>
              </Item>
            </React.Fragment>
          ))}
        </Menu>
      )}
    </Wrap>
  );
}
