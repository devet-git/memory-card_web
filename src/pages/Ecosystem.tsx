import { useState } from "react";
import styled from "styled-components";
import { MdOpenInNew, MdOutlineApps, MdEdit } from "react-icons/md";
import MyButton from "components/MyButton";
import { openAdminConsole, useAdmin } from "utils/admin";
import { effectiveApps, useSiteConfig } from "utils/siteConfig";

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
  const admin = useAdmin();
  // The owner's list (set in the admin console, shared by everyone), else the built-in one
  const apps = effectiveApps(useSiteConfig());
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = ["ALL", ...Array.from(new Set(apps.map((a) => a.category)))];
  const filteredApps = apps.filter((a) => selectedCategory === "ALL" || a.category === selectedCategory);

  return (
    <Container>
      <HeaderBanner>
        <div className="left">
          <div className="icon-box">
            <MdOutlineApps />
          </div>
          <div>
            <h1>Hệ Sinh Thái & Ứng Dụng Liên Quan</h1>
            <p>Các công cụ, từ điển và website học tập bổ trợ hữu ích.</p>
          </div>
        </div>

        {admin && (
          <MyButton variant="secondary" icon={<MdEdit />} onClick={() => openAdminConsole("apps")}>
            Chỉnh sửa danh sách
          </MyButton>
        )}
      </HeaderBanner>

      {/* FILTER TABS */}
      <FilterTabRow>
        {categories.map((cat) => (
          <FilterTab key={cat} $active={selectedCategory === cat} onClick={() => setSelectedCategory(cat)}>
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
              <a href={app.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex" }}>
                <MyButton variant="primary" size="sm" icon={<MdOpenInNew />}>
                  Truy cập
                </MyButton>
              </a>
            </div>
          </AppCard>
        ))}
      </AppGrid>
    </Container>
  );
}
