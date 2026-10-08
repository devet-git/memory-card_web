// Save text content as a file. The anchor must be attached to the DOM and the blob URL
// kept alive for a moment, otherwise some browsers drop the `download` name/extension
// and save the file under a random name without ".json".
export function downloadTextFile(content: string, fileName: string, mimeType = "application/json;charset=utf-8"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function backupFileName(): string {
  return `memcard-backup-${new Date().toISOString().split("T")[0]}.json`;
}
