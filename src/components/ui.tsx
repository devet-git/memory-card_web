import styled from "styled-components";

// Shared page building blocks for the newer pages (review, stats)
export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
`;

export const Panel = styled.section`
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.05));

  h2,
  h3 {
    margin: 0 0 12px 0;
    font-size: 17px;
    font-weight: 700;
  }

  @media (max-width: 640px) {
    padding: 14px;
  }
`;

export const MutedText = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary, #64748b);
`;
