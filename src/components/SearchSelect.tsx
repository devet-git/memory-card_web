import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { removeAccent } from "utils/removeAccent";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface BaseProps {
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  /** Lets the user type a value that isn't in the list ("Tạo ..."), e.g. a new category */
  creatable?: boolean;
  ariaLabel?: string;
}

interface SingleProps extends BaseProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

interface MultiProps extends BaseProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

export type SearchSelectProps = SingleProps | MultiProps;

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const Trigger = styled.button<{ $open: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 6px 12px;
  text-align: left;
  font-family: inherit;
  font-size: 14px;
  color: var(--text-primary, #0f172a);
  background: var(--bg-primary, #ffffff);
  border: 1px solid ${(p) => (p.$open ? "#3b82f6" : "var(--border-color, #cbd5e1)")};
  box-shadow: ${(p) => (p.$open ? "0 0 0 3px rgba(59, 130, 246, 0.15)" : "none")};
  border-radius: 10px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .placeholder {
    color: var(--text-muted, #94a3b8);
  }
  .caret {
    flex-shrink: 0;
    font-size: 11px;
    color: var(--text-muted, #94a3b8);
  }
`;

const Chips = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 2px 4px 2px 8px;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;

  button {
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 0 3px;
    border-radius: 50%;
  }
  button:hover {
    background: rgba(37, 99, 235, 0.2);
  }
`;

const Panel = styled.div`
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  background: var(--bg-card, #ffffff);
  overflow: hidden;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);

  input {
    flex: 1;
    min-width: 0;
    padding: 7px 10px;
    font-family: inherit;
    font-size: 14px;
    color: var(--text-primary, #0f172a);
    background: var(--bg-primary, #ffffff);
    border: 1px solid var(--border-color, #cbd5e1);
    border-radius: 8px;
    outline: none;
  }
  input:focus {
    border-color: #3b82f6;
  }
  button {
    border: none;
    background: transparent;
    color: #2563eb;
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 220px;
  overflow-y: auto;
`;

const Item = styled.li<{ $active: boolean; $selected: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  background: ${(p) => (p.$active ? "rgba(59, 130, 246, 0.1)" : "transparent")};
  font-weight: ${(p) => (p.$selected ? 700 : 500)};

  .desc {
    display: block;
    font-size: 12px;
    font-weight: 400;
    color: var(--text-secondary, #64748b);
  }
  .tick {
    width: 16px;
    flex-shrink: 0;
    color: #3b82f6;
  }
`;

const Empty = styled.div`
  padding: 12px;
  font-size: 13px;
  color: var(--text-secondary, #64748b);
`;

// Matching ignores case and Vietnamese accents ("hoc" finds "Học")
const norm = (s: string) => removeAccent(s || "").toLowerCase();

/**
 * Select / multi-select whose list can be searched. The list opens inline (not as a floating layer)
 * so it also works inside scrolling modals. Keyboard: arrows, Enter, Escape.
 */
export default function SearchSelect(props: SearchSelectProps) {
  const { options, placeholder = "Chọn...", searchPlaceholder = "Tìm kiếm...", emptyText = "Không có kết quả", disabled, creatable, ariaLabel } = props;
  const selected: string[] = props.multiple ? props.value : props.value ? [props.value] : [];

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const labelOf = (value: string) => options.find((o) => o.value === value)?.label ?? value;

  const q = norm(query.trim());
  const filtered = useMemo(
    () => options.filter((o) => !q || norm(o.label).includes(q) || norm(o.description || "").includes(q) || norm(o.value).includes(q)),
    [options, q]
  );
  const canCreate = Boolean(creatable) && query.trim() !== "" && !options.some((o) => norm(o.label) === q || norm(o.value) === q);
  const rows: { value: string; label: string; description?: string; create?: boolean }[] = [
    ...(canCreate ? [{ value: query.trim(), label: `Tạo "${query.trim()}"`, create: true }] : []),
    ...filtered
  ];

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => setActive(0), [query, open]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const choose = (value: string) => {
    if (props.multiple) {
      props.onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
      setQuery("");
      inputRef.current?.focus();
    } else {
      props.onChange(value);
      close();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(rows.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault(); // never submit the surrounding form from the search box
      if (rows[active]) choose(rows[active].value);
    } else if (e.key === "Escape" && open) {
      e.stopPropagation(); // close the list, not the modal around it
      close();
    }
  };

  return (
    <Root ref={rootRef} onKeyDown={onKeyDown}>
      <Trigger type="button" $open={open} disabled={disabled} onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-label={ariaLabel}>
        {props.multiple ? (
          selected.length === 0 ? (
            <span className="placeholder">{placeholder}</span>
          ) : (
            <Chips>
              {selected.map((v) => (
                <Chip key={v}>
                  {labelOf(v)}
                  <button
                    type="button"
                    aria-label={`Bỏ ${labelOf(v)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onChange(selected.filter((x) => x !== v));
                    }}
                  >
                    ×
                  </button>
                </Chip>
              ))}
            </Chips>
          )
        ) : selected[0] ? (
          <span>{labelOf(selected[0])}</span>
        ) : (
          <span className="placeholder">{placeholder}</span>
        )}
        <span className="caret">{open ? "▲" : "▼"}</span>
      </Trigger>

      {open && (
        <Panel>
          <SearchRow>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Tìm kiếm trong danh sách"
              autoComplete="off"
            />
            {props.multiple && (
              <>
                <button type="button" onClick={() => props.onChange(Array.from(new Set([...selected, ...filtered.map((o) => o.value)])))}>
                  Chọn tất cả
                </button>
                <button type="button" onClick={() => props.onChange([])} disabled={selected.length === 0}>
                  Bỏ chọn
                </button>
              </>
            )}
          </SearchRow>
          <List role="listbox" id={listId} aria-multiselectable={props.multiple || undefined}>
            {rows.length === 0 && <Empty>{emptyText}</Empty>}
            {rows.map((r, i) => (
              <Item
                key={`${r.create ? "new:" : ""}${r.value}`}
                role="option"
                aria-selected={selected.includes(r.value)}
                $active={i === active}
                $selected={selected.includes(r.value)}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(r.value)}
              >
                <span className="tick">{selected.includes(r.value) ? "✓" : ""}</span>
                <span>
                  {r.label}
                  {r.description && <span className="desc">{r.description}</span>}
                </span>
              </Item>
            ))}
          </List>
        </Panel>
      )}
    </Root>
  );
}
