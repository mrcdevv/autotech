/**
 * Triggers a browser download for a Blob using a generated object URL.
 *
 * Centralises the duplicated blob -> objectURL -> anchor.click() pattern used
 * across Excel and PDF downloads so every export behaves consistently.
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
