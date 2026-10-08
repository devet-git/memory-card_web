import React from "react";
import ConfirmDialog from "components/ConfirmDialog";
import useAIJob, { AI_CANCEL_MESSAGE } from "hooks/useAIJob";

/** Asks before abandoning a running AI request, because the provider may still bill for it. */
export default function AICancelDialog({ job }: { job: ReturnType<typeof useAIJob> }) {
  if (!job.cancelOpen) return null;
  return (
    <ConfirmDialog
      title="Hủy yêu cầu AI?"
      message={AI_CANCEL_MESSAGE}
      confirmLabel="Hủy yêu cầu"
      cancelLabel="Tiếp tục chờ"
      danger
      onCancel={job.dismissCancel}
      onConfirm={job.confirmCancel}
    />
  );
}
