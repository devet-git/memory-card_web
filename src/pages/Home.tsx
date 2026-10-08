import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  IoFlashOutline,
  IoFolderOpenOutline,
  IoAddCircleOutline,
  IoCheckmarkCircleOutline
} from "react-icons/io5";
import { HiFire } from "react-icons/hi";
import { MdQuiz, MdOutlineArrowForward, MdVolumeUp, MdKeyboardAlt } from "react-icons/md";
import useCollectionContext from "contexts/Collection";
import MyButton from "components/MyButton";
import MyModal from "components/MyModal";
import { MyInput, MyTextarea } from "components/MyInput";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const HeroBanner = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #8b5cf6 100%);
  color: white;
  padding: 40px 36px;
  box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.25);
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 640px) {
    padding: 28px 20px;
  }
`;

const HeroTitle = styled.h1`
  font-size: 34px;
  font-weight: 800;
  line-height: 1.2;
  margin: 0;
  letter-spacing: -0.02em;

  @media (max-width: 640px) {
    font-size: 26px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #e0e7ff;
  max-width: 900px;
  margin: 0;
  opacity: 0.95;
`;

const HeroActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 18px;
`;

const StatCard = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.05));
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  .icon-box {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
  }

  .stat-info {
    display: flex;
    flex-direction: column;

    .stat-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
    }

    .stat-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary, #64748b);
    }
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary, #0f172a);
    margin: 0;
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent-primary, #3b82f6);

    &:hover {
      text-decoration: underline;
    }
  }
`;

const DeckGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 22px;
`;

const DeckPreviewCard = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.05));
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 190px;

  &:hover {
    box-shadow: var(--card-shadow-hover, 0 12px 24px -6px rgba(59, 130, 246, 0.15));
    border-color: rgba(59, 130, 246, 0.4);
    transform: translateY(-2px);
  }

  .deck-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;

    .deck-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0;
    }

    .badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;
      background-color: rgba(59, 130, 246, 0.12);
      color: #2563eb;
    }
  }

  .deck-desc {
    font-size: 13px;
    color: var(--text-secondary, #64748b);
    line-height: 1.4;
    margin-bottom: 16px;
    flex: 1;
  }

  .deck-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding-top: 14px;
    border-top: 1px dashed var(--border-color, #e2e8f0);
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
`;

const FeatureCard = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  gap: 14px;

  .icon {
    font-size: 24px;
    color: #3b82f6;
    flex-shrink: 0;
  }

  .content {
    h4 {
      margin: 0 0 4px 0;
      font-size: 15px;
      font-weight: 700;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: var(--text-secondary, #64748b);
      line-height: 1.4;
    }
  }
`;

export default function HomePage() {
  const { collections, stats, addCollection } = useCollectionContext();
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckCategory, setNewDeckCategory] = useState("Tiếng Anh");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [formError, setFormError] = useState("");

  const totalCards = collections.reduce((acc, c) => acc + (c.words?.length || 0), 0);
  const totalMastered = collections.reduce(
    (acc, c) => acc + (c.words?.filter((w) => w.status === "mastered").length || 0),
    0
  );
  const masteryRate = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

  const firstDeck = collections[0];

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) {
      setFormError("Vui lòng nhập tên bộ thẻ");
      return;
    }
    const result = addCollection(newDeckName, newDeckCategory, newDeckDesc);
    if (result.success && result.pathname) {
      setShowAddModal(false);
      setNewDeckName("");
      setNewDeckDesc("");
      navigate(`/collections/${result.pathname}`);
    } else {
      setFormError(result.message || "Tên đã tồn tại");
    }
  };

  return (
    <Container>
      {/* HERO BANNER */}
      <HeroBanner>
        <div>
          <HeroTitle>Học Từ Vựng & Ghi Nhớ Siêu Tốc</HeroTitle>
          <HeroSubtitle>
            Áp dụng phương pháp lặp lại ngắt quãng (Spaced Repetition) và thẻ lật 3D tương tác. Tự động lưu 100% dữ liệu vào trình duyệt web của bạn mà không lo mất mát!
          </HeroSubtitle>
        </div>

        <HeroActionRow>
          {firstDeck ? (
            <MyButton
              bgColor="#ffffff"
              color="#1e3a8a"
              size="lg"
              icon={<IoFlashOutline />}
              onClick={() => navigate(`/collections/${firstDeck.pathname}?mode=card`)}
            >
              Học ngay: {firstDeck.name}
            </MyButton>
          ) : (
            <MyButton
              bgColor="#ffffff"
              color="#1e3a8a"
              size="lg"
              icon={<IoAddCircleOutline />}
              onClick={() => setShowAddModal(true)}
            >
              Tạo bộ thẻ đầu tiên
            </MyButton>
          )}

          <MyButton
            bgColor="rgba(255, 255, 255, 0.2)"
            color="#ffffff"
            size="lg"
            icon={<IoAddCircleOutline />}
            onClick={() => setShowAddModal(true)}
          >
            Thêm bộ thẻ mới
          </MyButton>

          <MyButton
            bgColor="transparent"
            color="#ffffff"
            size="lg"
            icon={<IoFolderOpenOutline />}
            onClick={() => navigate("/collections")}
          >
            Xem tất cả ({collections.length})
          </MyButton>
        </HeroActionRow>
      </HeroBanner>

      {/* STATS OVERVIEW */}
      <StatsGrid>
        <StatCard>
          <div className="icon-box" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
            <IoFolderOpenOutline />
          </div>
          <div className="stat-info">
            <span className="stat-value">{collections.length}</span>
            <span className="stat-label">Bộ sưu tập</span>
          </div>
        </StatCard>

        <StatCard>
          <div className="icon-box" style={{ background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" }}>
            <IoFlashOutline />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalCards}</span>
            <span className="stat-label">Thẻ từ vựng</span>
          </div>
        </StatCard>

        <StatCard>
          <div className="icon-box" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
            <IoCheckmarkCircleOutline />
          </div>
          <div className="stat-info">
            <span className="stat-value">{masteryRate}%</span>
            <span className="stat-label">Đã thành thạo ({totalMastered} từ)</span>
          </div>
        </StatCard>

        <StatCard>
          <div className="icon-box" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
            <HiFire />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.studyStreakDays} ngày</span>
            <span className="stat-label">Chuỗi học liên tục</span>
          </div>
        </StatCard>
      </StatsGrid>

      {/* FEATURED DECKS */}
      <div>
        <SectionHeader>
          <h2>Bộ thẻ nổi bật của bạn</h2>
          <Link to="/collections">
            Xem tất cả bộ sưu tập <MdOutlineArrowForward />
          </Link>
        </SectionHeader>

        <DeckGrid>
          {collections.slice(0, 3).map((coll) => {
            const cardCount = coll.words?.length || 0;
            const masteredCount = coll.words?.filter((w) => w.status === "mastered").length || 0;
            return (
              <DeckPreviewCard key={coll.pathname}>
                <div>
                  <div className="deck-header">
                    <h3 className="deck-title">{coll.name}</h3>
                    <span className="badge">{cardCount} thẻ</span>
                  </div>
                  <p className="deck-desc">
                    {coll.description || `Danh mục: ${coll.category || "Tổng hợp"}. Đã thuộc: ${masteredCount}/${cardCount} từ.`}
                  </p>
                </div>

                <div className="deck-footer">
                  <MyButton
                    variant="primary"
                    size="sm"
                    icon={<IoFlashOutline />}
                    onClick={() => navigate(`/collections/${coll.pathname}?mode=card`)}
                  >
                    Học ngay
                  </MyButton>

                  <MyButton
                    variant="secondary"
                    size="sm"
                    icon={<MdQuiz />}
                    disabled={cardCount < 2}
                    onClick={() => navigate(`/collections/${coll.pathname}?mode=quiz`)}
                    title={cardCount < 2 ? "Cần từ 2 thẻ trở lên" : "Làm bài trắc nghiệm"}
                  >
                    Trắc nghiệm
                  </MyButton>

                  <MyButton
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/collections/${coll.pathname}`)}
                  >
                    Chi tiết
                  </MyButton>
                </div>
              </DeckPreviewCard>
            );
          })}
        </DeckGrid>
      </div>

      {/* HIGHLIGHT FEATURES */}
      <div>
        <SectionHeader>
          <h2>Tính năng hỗ trợ học tập thông minh</h2>
        </SectionHeader>
        <FeatureGrid>
          <FeatureCard>
            <div className="icon">
              <MdVolumeUp />
            </div>
            <div className="content">
              <h4>Phát âm chuẩn Web Speech</h4>
              <p>Nghe phát âm chuẩn từng từ và câu ví dụ chỉ bằng một phím bấm, hỗ trợ cả tiếng Anh và tiếng Việt.</p>
            </div>
          </FeatureCard>

          <FeatureCard>
            <div className="icon">
              <MdQuiz />
            </div>
            <div className="content">
              <h4>Luyện tập trắc nghiệm</h4>
              <p>Tự động sinh đề thi trắc nghiệm 4 đáp án giúp kiểm tra phản xạ ghi nhớ của bạn trong tích tắc.</p>
            </div>
          </FeatureCard>

          <FeatureCard>
            <div className="icon">
              <MdKeyboardAlt />
            </div>
            <div className="content">
              <h4>Kiểm tra chính tả</h4>
              <p>Luyện gõ từ vựng theo nghĩa gợi ý giúp khắc sâu ngữ pháp và mặt chữ một cách tự nhiên nhất.</p>
            </div>
          </FeatureCard>
        </FeatureGrid>
      </div>

      {/* CREATE MODAL */}
      {showAddModal && (
        <MyModal
          title="Tạo bộ sưu tập thẻ mới"
          onClose={() => setShowAddModal(false)}
        >
          <form onSubmit={handleCreateDeck} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {formError && (
              <div style={{ color: "#ef4444", fontSize: "13px", fontWeight: "600" }}>
                {formError}
              </div>
            )}

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Tên bộ thẻ *
              </label>
              <MyInput
                placeholder="VD: Từ vựng IELTS Writing, Tiếng Nhật N3..."
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
                Chủ đề / Thể loại
              </label>
              <MyInput
                placeholder="VD: Tiếng Anh, Lập trình, Y học, Lịch sử..."
                value={newDeckCategory}
                onChange={(e) => setNewDeckCategory(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                Mô tả ngắn
              </label>
              <MyTextarea
                placeholder="Ghi chú mục tiêu hoặc tài liệu học của bộ thẻ này..."
                value={newDeckDesc}
                onChange={(e) => setNewDeckDesc(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <MyButton variant="ghost" onClick={() => setShowAddModal(false)}>
                Hủy
              </MyButton>
              <MyButton variant="primary" type="submit">
                Tạo bộ thẻ
              </MyButton>
            </div>
          </form>
        </MyModal>
      )}
    </Container>
  );
}
