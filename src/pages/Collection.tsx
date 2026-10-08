import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { RiAddFill, RiSearchLine } from "react-icons/ri";
import { MdOutlineFileUpload, MdOutlineFileDownload } from "react-icons/md";
import useCollectionContext from "contexts/Collection";
import Collection from "components/Collection";
import MyButton from "components/MyButton";
import { MyInput, MyTextarea } from "components/MyInput";
import MyModal from "components/MyModal";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (max-width: 640px) {
    gap: 16px;
  }
`;

const StickyActionWrapper = styled.div`
  position: sticky;
  top: 64px;
  z-index: 80;
  background: var(--bg-primary, #f8fafc);
  padding: 4px 0 10px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 768px) {
    top: 56px;
    padding: 2px 0 8px 0;
    gap: 10px;
  }
`;

const TopActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.05));

  @media (max-width: 640px) {
    padding: 14px 12px;
    gap: 12px;
    border-radius: 14px;
  }
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 260px;

  @media (max-width: 640px) {
    min-width: 100%;
    width: 100%;
  }

  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted, #94a3b8);
    font-size: 18px;
  }

  input {
    padding-left: 38px;
  }
`;

const ActionButtonsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    > button:first-child {
      grid-column: span 2;
      width: 100%;
    }

    > button,
    > label {
      width: 100%;
      button {
        width: 100%;
      }
    }
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  background-color: ${(props) => (props.$active ? "var(--accent-primary, #3b82f6)" : "var(--bg-card, #ffffff)")};
  color: ${(props) => (props.$active ? "#ffffff" : "var(--text-secondary, #475569)")};
  border: 1px solid ${(props) => (props.$active ? "var(--accent-primary, #3b82f6)" : "var(--border-color, #e2e8f0)")};
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    border-color: var(--accent-primary, #3b82f6);
    color: ${(props) => (props.$active ? "#ffffff" : "var(--accent-primary, #3b82f6)")};
  }
`;

const CollectionsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr));
  gap: 20px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-card, #ffffff);
  border: 1px dashed var(--border-color, #cbd5e1);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary, #64748b);
  }
`;

export default function CollectionPage() {
  const { collections, addCollection, exportToJSON, importFromJSON } = useCollectionContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckCategory, setNewDeckCategory] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [formError, setFormError] = useState("");

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    collections.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [collections]);

  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === "ALL" || c.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [collections, searchQuery, selectedCategory]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) {
      setFormError("Vui lòng nhập tên bộ sưu tập");
      return;
    }
    const result = addCollection(newDeckName, newDeckCategory || "Tổng hợp", newDeckDesc);
    if (result.success) {
      setShowAddModal(false);
      setNewDeckName("");
      setNewDeckCategory("");
      setNewDeckDesc("");
      setFormError("");
    } else {
      setFormError(result.message || "Tên bộ sưu tập đã tồn tại");
    }
  };

  const handleExport = () => {
    const jsonStr = exportToJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memocard-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importFromJSON(content);
        if (res.success) {
          alert(`Đã nhập thành công ${res.count} bộ sưu tập!`);
        } else {
          alert(`Lỗi: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <Container>
      <StickyActionWrapper>
        <TopActionBar>
          <SearchBox>
            <RiSearchLine />
            <MyInput
              type="text"
              placeholder="Tìm kiếm theo tên bộ thẻ hoặc chủ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBox>

          <ActionButtonsGroup>
            <MyButton
              variant="primary"
              icon={<RiAddFill />}
              onClick={() => setShowAddModal(true)}
            >
              Tạo bộ thẻ mới
            </MyButton>

            <MyButton
              variant="secondary"
              size="md"
              icon={<MdOutlineFileDownload />}
              onClick={handleExport}
              title="Xuất tệp sao lưu JSON"
            >
              Xuất JSON
            </MyButton>

            <label>
              <input
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleImport}
              />
              <MyButton
                variant="secondary"
                size="md"
                icon={<MdOutlineFileUpload />}
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.querySelector("input");
                  input?.click();
                }}
                title="Nhập tệp sao lưu JSON"
              >
                Nhập JSON
              </MyButton>
            </label>
          </ActionButtonsGroup>
        </TopActionBar>

        {/* CATEGORY FILTER TABS */}
        {categories.length > 0 && (
          <CategoryTabs>
            <TabButton
              $active={selectedCategory === "ALL"}
              onClick={() => setSelectedCategory("ALL")}
            >
              Tất cả ({collections.length})
            </TabButton>
            {categories.map((cat) => (
              <TabButton
                key={cat}
                $active={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </TabButton>
            ))}
          </CategoryTabs>
        )}
      </StickyActionWrapper>

      {/* COLLECTIONS LIST */}
      <CollectionsList>
        {filteredCollections.length > 0 ? (
          filteredCollections.map((collection) => (
            <Collection key={collection.pathname} collection={collection} />
          ))
        ) : (
          <EmptyState>
            <h3>Không tìm thấy bộ sưu tập phù hợp</h3>
            <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc tạo một bộ sưu tập mới.</p>
            <MyButton
              variant="primary"
              icon={<RiAddFill />}
              onClick={() => setShowAddModal(true)}
            >
              Tạo bộ sưu tập ngay
            </MyButton>
          </EmptyState>
        )}
      </CollectionsList>

      {/* CREATE MODAL */}
      {showAddModal && (
        <MyModal
          title="Tạo bộ sưu tập thẻ mới"
          onClose={() => setShowAddModal(false)}
        >
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {formError && (
              <div style={{ color: "#ef4444", fontSize: "13px", fontWeight: "600" }}>
                {formError}
              </div>
            )}

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Tên bộ sưu tập *
              </label>
              <MyInput
                placeholder="VD: Từ vựng Toeic 800+, Từ vựng IT..."
                value={newDeckName}
                onChange={(e) => {
                  setNewDeckName(e.target.value);
                  setFormError("");
                }}
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Chủ đề / Phân loại
              </label>
              <MyInput
                placeholder="VD: Tiếng Anh, Lập trình, Tiếng Nhật..."
                value={newDeckCategory}
                onChange={(e) => setNewDeckCategory(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Mô tả (tùy chọn)
              </label>
              <MyTextarea
                placeholder="Ghi chú mục tiêu học tập của bộ này..."
                value={newDeckDesc}
                onChange={(e) => setNewDeckDesc(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <MyButton variant="ghost" onClick={() => setShowAddModal(false)}>
                Hủy
              </MyButton>
              <MyButton variant="primary" type="submit">
                Tạo bộ sưu tập
              </MyButton>
            </div>
          </form>
        </MyModal>
      )}
    </Container>
  );
}
