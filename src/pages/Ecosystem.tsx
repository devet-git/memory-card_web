import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  MdOpenInNew,
  MdAdd,
  MdEdit,
  MdDelete,
  MdOutlineApps,
  MdRestartAlt
} from "react-icons/md";
import MyButton from "components/MyButton";
import MyModal from "components/MyModal";
import { MyInput, MyTextarea } from "components/MyInput";

interface RelatedApp {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: string;
  description: string;
  isCustom?: boolean;
}

const defaultApps: RelatedApp[] = [
  {
    id: "app-1",
    name: "Từ Điển Anh - Việt Tra Cứu Nhanh",
    url: "https://dict.laban.vn",
    icon: "📖",
    category: "Học ngoại ngữ",
    description: "Tra cứu từ vựng tiếng Anh, phiên âm chuẩn quốc tế IPA và ví dụ câu phong phú."
  },
  {
    id: "app-2",
    name: "Luyện Phát Âm Với YouGlish",
    url: "https://youglish.com",
    icon: "🎬",
    category: "Học ngoại ngữ",
    description: "Nghe người bản xứ phát âm từ vựng trong hàng triệu video YouTube thực tế."
  },
  {
    id: "app-3",
    name: "Pomodoro Focus Timer",
    url: "https://pomofocus.io",
    icon: "⏱️",
    category: "Năng suất",
    description: "Đồng hồ đếm ngược 25 phút Pomodoro giúp tập trung tối đa khi ôn thẻ từ vựng."
  },
  {
    id: "app-4",
    name: "Google Dịch (Google Translate)",
    url: "https://translate.google.com",
    icon: "🌐",
    category: "Công cụ",
    description: "Dịch nhanh văn bản, đoạn hội thoại và phát âm chuẩn đa ngôn ngữ."
  },
  {
    id: "app-5",
    name: "Notion Ghi Chú Học Tập",
    url: "https://notion.so",
    icon: "📝",
    category: "Năng suất",
    description: "Hệ thống quản lý tài liệu, ngữ pháp và lập kế hoạch mục tiêu học tập cá nhân."
  }
];

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (max-width: 640px) {
    gap: 16px;
  }
`;

const HeaderBanner = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  box-shadow: var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.05));

  @media (max-width: 640px) {
    padding: 16px 14px;
    gap: 12px;
    border-radius: 14px;

    .left {
      gap: 10px;

      .icon-box {
        width: 38px;
        height: 38px;
        font-size: 20px;
        border-radius: 10px;
      }

      h1 {
        font-size: 18px;
      }

      p {
        font-size: 12px;
      }
    }
  }

  .left {
    display: flex;
    align-items: center;
    gap: 14px;

    .icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
      flex-shrink: 0;
    }

    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
    }

    p {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: var(--text-secondary, #64748b);
    }
  }
`;

const FilterTabRow = styled.div`
  position: sticky;
  top: 0;
  z-index: 80;
  background: var(--bg-primary, #f8fafc);
  padding: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    top: 0;
    padding: 6px 0;
  }
`;

const FilterTab = styled.button<{ $active: boolean }>`
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
  }
`;

const AppGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 20px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const AppCard = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.05));
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 180px;

  @media (max-width: 640px) {
    padding: 16px 14px;
    min-height: auto;
    border-radius: 14px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--card-shadow-hover, 0 12px 24px -6px rgba(59, 130, 246, 0.15));
    border-color: rgba(59, 130, 246, 0.4);
  }

  .card-top {
    display: flex;
    align-items: flex-start;
    gap: 14px;

    .app-icon {
      font-size: 32px;
      line-height: 1;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-tertiary, #f1f5f9);
      border-radius: 12px;
      flex-shrink: 0;
    }

    .app-meta {
      flex: 1;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary, #0f172a);
      }

      .category-tag {
        display: inline-block;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 9999px;
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
        margin-top: 4px;
      }
    }
  }

  .app-desc {
    margin: 12px 0 16px 0;
    font-size: 13px;
    color: var(--text-secondary, #64748b);
    line-height: 1.4;
    flex: 1;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px dashed var(--border-color, #e2e8f0);
    padding-top: 14px;
  }
`;

export default function EcosystemPage() {
  const [apps, setApps] = useState<RelatedApp[]>(() => {
    try {
      const stored = localStorage.getItem("memcard_ecosystem_apps");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultApps;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingApp, setEditingApp] = useState<RelatedApp | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formIcon, setFormIcon] = useState("🔗");
  const [formCategory, setFormCategory] = useState("Công cụ");
  const [formDesc, setFormDesc] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("memcard_ecosystem_apps", JSON.stringify(apps));
    } catch {}
  }, [apps]);

  const categories = ["ALL", ...Array.from(new Set(apps.map((a) => a.category)))];

  const filteredApps = apps.filter(
    (a) => selectedCategory === "ALL" || a.category === selectedCategory
  );

  const handleOpenAddModal = () => {
    setEditingApp(null);
    setFormName("");
    setFormUrl("");
    setFormIcon("🚀");
    setFormCategory("Học tập");
    setFormDesc("");
    setShowConfigModal(true);
  };

  const handleOpenEditModal = (app: RelatedApp) => {
    setEditingApp(app);
    setFormName(app.name);
    setFormUrl(app.url);
    setFormIcon(app.icon || "🔗");
    setFormCategory(app.category || "Công cụ");
    setFormDesc(app.description || "");
    setShowConfigModal(true);
  };

  const handleSaveApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) return;

    let cleanUrl = formUrl.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    if (editingApp) {
      setApps((prev) =>
        prev.map((a) =>
          a.id === editingApp.id
            ? {
                ...a,
                name: formName.trim(),
                url: cleanUrl,
                icon: formIcon.trim() || "🔗",
                category: formCategory.trim() || "Tiện ích",
                description: formDesc.trim()
              }
            : a
        )
      );
    } else {
      const newApp: RelatedApp = {
        id: `custom-app-${Date.now()}`,
        name: formName.trim(),
        url: cleanUrl,
        icon: formIcon.trim() || "🔗",
        category: formCategory.trim() || "Tiện ích",
        description: formDesc.trim(),
        isCustom: true
      };
      setApps((prev) => [newApp, ...prev]);
    }

    setShowConfigModal(false);
  };

  const handleDeleteApp = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa liên kết ứng dụng này?")) {
      setApps((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Đặt lại toàn bộ danh sách liên kết ứng dụng về mặc định ban đầu?")) {
      setApps(defaultApps);
    }
  };

  return (
    <Container>
      <HeaderBanner>
        <div className="left">
          <div className="icon-box">
            <MdOutlineApps />
          </div>
          <div>
            <h1>Hệ Sinh Thái & Ứng Dụng Liên Quan</h1>
            <p>Khám phá và gắn thêm các công cụ, từ điển và website học tập bổ trợ hữu ích cho bạn.</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <MyButton
            variant="primary"
            icon={<MdAdd />}
            onClick={handleOpenAddModal}
          >
            Thêm ứng dụng mới
          </MyButton>

          <MyButton
            variant="secondary"
            icon={<MdRestartAlt />}
            onClick={handleResetDefaults}
            title="Khôi phục danh sách ứng dụng mẫu"
          >
            Mặc định
          </MyButton>
        </div>
      </HeaderBanner>

      {/* FILTER TABS */}
      <FilterTabRow>
        {categories.map((cat) => (
          <FilterTab
            key={cat}
            $active={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === "ALL" ? `Tất cả (${apps.length})` : cat}
          </FilterTab>
        ))}
      </FilterTabRow>

      {/* APPS GRID */}
      <AppGrid>
        {filteredApps.map((app) => (
          <AppCard key={app.id}>
            <div>
              <div className="card-top">
                <div className="app-icon">{app.icon}</div>
                <div className="app-meta">
                  <h3>{app.name}</h3>
                  <span className="category-tag">{app.category}</span>
                </div>
              </div>
              <p className="app-desc">{app.description}</p>
            </div>

            <div className="card-footer">
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex" }}
              >
                <MyButton
                  variant="primary"
                  size="sm"
                  icon={<MdOpenInNew />}
                >
                  Truy cập
                </MyButton>
              </a>

              <div style={{ display: "flex", gap: "4px" }}>
                <MyButton
                  variant="ghost"
                  size="sm"
                  icon={<MdEdit />}
                  onClick={() => handleOpenEditModal(app)}
                  title="Chỉnh sửa cấu hình"
                />
                <MyButton
                  variant="ghost"
                  size="sm"
                  icon={<MdDelete />}
                  onClick={() => handleDeleteApp(app.id)}
                  title="Xóa ứng dụng"
                />
              </div>
            </div>
          </AppCard>
        ))}
      </AppGrid>

      {/* ADD / EDIT MODAL */}
      {showConfigModal && (
        <MyModal
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>              <MyButton variant="ghost" onClick={() => setShowConfigModal(false)}>
                Hủy
              </MyButton>
              <MyButton variant="primary" type="submit" form="save-app-form" disabled={!formName.trim() || !formUrl.trim()}>
                {editingApp ? "Cập nhật cấu hình" : "Lưu ứng dụng"}
              </MyButton></div>
          }
          title={editingApp ? "Chỉnh sửa liên kết ứng dụng" : "Thêm ứng dụng liên quan mới"}
          onClose={() => setShowConfigModal(false)}
        >
          <form id="save-app-form" onSubmit={handleSaveApp} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>
                Tên ứng dụng / Trang web *
              </label>
              <MyInput
                placeholder="VD: Từ điển Cambridge, ChatGPT, Laban..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>
                Đường dẫn liên kết (URL) *
              </label>
              <MyInput
                placeholder="VD: https://dictionary.cambridge.org"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>
                  Icon / Emoji
                </label>
                <MyInput
                  placeholder="🚀, 📚..."
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>
                  Thể loại
                </label>
                <MyInput
                  placeholder="Học tập, Công cụ, AI..."
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 700 }}>
                Mô tả ngắn
              </label>
              <MyTextarea
                placeholder="Giới thiệu nhanh công dụng của web/app này đối với người học..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>

          </form>
        </MyModal>
      )}
    </Container>
  );
}
