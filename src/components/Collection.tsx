import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineCheck,
  AiOutlineCloseCircle,
  AiOutlineFolderOpen
} from "react-icons/ai";
import { MdQuiz, MdKeyboardAlt } from "react-icons/md";
import { IoFlashOutline } from "react-icons/io5";
import MyButton from "./MyButton";
import { MyInput } from "./MyInput";
import useCollectionContext from "contexts/Collection";
import { CollectionItem } from "types";

const Card = styled.div`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.05));
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 640px) {
    padding: 16px 14px;
    gap: 14px;
    margin-bottom: 0;
  }

  &:hover {
    box-shadow: var(--card-shadow-hover, 0 12px 24px -6px rgba(59, 130, 246, 0.12));
    border-color: rgba(59, 130, 246, 0.35);
    transform: translateY(-2px);
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const TitleArea = styled.div`
  flex: 1;
  min-width: 0;
`;

const CollectionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 19px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  transition: color 0.15s ease;
  word-break: break-word;

  @media (max-width: 640px) {
    font-size: 17px;
    gap: 8px;
  }

  &:hover {
    color: var(--accent-primary, #3b82f6);
  }

  svg {
    color: #3b82f6;
    font-size: 24px;
    flex-shrink: 0;

    @media (max-width: 640px) {
      font-size: 20px;
    }
  }
`;

const CategoryTag = styled.span<{ $color?: string }>`
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 9999px;
  background-color: ${(props) => (props.$color ? `${props.$color}15` : "rgba(59, 130, 246, 0.1)")};
  color: ${(props) => props.$color || "#2563eb"};
  margin-top: 6px;
`;

const Description = styled.p`
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  margin: 6px 0 0 0;
  line-height: 1.4;

  @media (max-width: 640px) {
    font-size: 12px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const ProgressBarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  font-weight: 500;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: var(--bg-tertiary, #f1f5f9);
  border-radius: 9999px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number }>`
  width: ${(props) => props.$percent}%;
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);
  border-radius: 9999px;
  transition: width 0.4s ease;
`;

const StudyActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px dashed var(--border-color, #e2e8f0);

  @media (max-width: 640px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    button {
      width: 100%;
      padding: 7px 6px;
      font-size: 12px;
    }
  }
`;

const EditRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

interface CollectionProps {
  collection: CollectionItem;
}

export default function Collection({ collection }: CollectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(collection.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { updateCollection, deleteCollection } = useCollectionContext();
  const navigate = useNavigate();

  const words = collection.words || [];
  const totalWords = words.length;
  const masteredWords = words.filter((w) => w.status === "mastered").length;
  const percentMastered = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

  const handleSaveName = () => {
    if (editName.trim() && editName !== collection.name) {
      updateCollection(collection.pathname, editName);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteCollection(collection.pathname);
    setShowDeleteConfirm(false);
  };

  return (
    <Card>
      <HeaderRow>
        <TitleArea>
          {isEditing ? (
            <EditRow>
              <MyInput
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                autoFocus
              />
              <MyButton
                variant="primary"
                size="sm"
                icon={<AiOutlineCheck />}
                onClick={handleSaveName}
                title="Lưu tên mới"
              />
              <MyButton
                variant="ghost"
                size="sm"
                icon={<AiOutlineCloseCircle />}
                onClick={() => setIsEditing(false)}
                title="Hủy"
              />
            </EditRow>
          ) : (
            <>
              <CollectionLink to={`/collections/${collection.pathname}`}>
                <AiOutlineFolderOpen />
                {collection.name}
              </CollectionLink>
              <div>
                <CategoryTag $color={collection.color}>
                  {collection.category || "Tổng hợp"} • {totalWords} thẻ
                </CategoryTag>
              </div>
              {collection.description && <Description>{collection.description}</Description>}
            </>
          )}
        </TitleArea>

        {!isEditing && (
          <HeaderActions>
            <MyButton
              variant="ghost"
              size="sm"
              icon={<AiOutlineEdit />}
              onClick={() => setIsEditing(true)}
              title="Sửa tên bộ sưu tập"
            />
            {showDeleteConfirm ? (
              <div style={{ display: "flex", gap: "4px" }}>
                <MyButton
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  title="Xác nhận xóa"
                >
                  Xác nhận
                </MyButton>
                <MyButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Hủy
                </MyButton>
              </div>
            ) : (
              <MyButton
                variant="ghost"
                size="sm"
                icon={<AiOutlineDelete />}
                onClick={() => setShowDeleteConfirm(true)}
                title="Xóa bộ sưu tập này"
              />
            )}
          </HeaderActions>
        )}
      </HeaderRow>

      <ProgressBarWrapper>
        <ProgressInfo>
          <span>Tiến độ ghi nhớ: {masteredWords}/{totalWords} từ</span>
          <span>{percentMastered}%</span>
        </ProgressInfo>
        <ProgressBar>
          <ProgressFill $percent={percentMastered} />
        </ProgressBar>
      </ProgressBarWrapper>

      <StudyActions>
        <MyButton
          variant="primary"
          size="sm"
          icon={<IoFlashOutline />}
          onClick={() => navigate(`/collections/${collection.pathname}?mode=card`)}
        >
          Học Flashcard
        </MyButton>
        <MyButton
          variant="secondary"
          size="sm"
          icon={<MdQuiz />}
          disabled={totalWords < 2}
          onClick={() => navigate(`/collections/${collection.pathname}?mode=quiz`)}
          title={totalWords < 2 ? "Cần ít nhất 2 từ để làm trắc nghiệm" : "Luyện trắc nghiệm"}
        >
          Trắc nghiệm
        </MyButton>
        <MyButton
          variant="secondary"
          size="sm"
          icon={<MdKeyboardAlt />}
          disabled={totalWords === 0}
          onClick={() => navigate(`/collections/${collection.pathname}?mode=typing`)}
          title="Luyện gõ từ vựng"
        >
          Gõ chính tả
        </MyButton>
        <MyButton
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/collections/${collection.pathname}?mode=table`)}
        >
          Xem danh sách ({totalWords})
        </MyButton>
      </StudyActions>
    </Card>
  );
}
