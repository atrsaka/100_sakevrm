/**
 * ドキュメント読み込み・テキスト抽出モジュール
 * PDF / テキスト / Markdown をブラウザ上で解析する
 */

export const MAX_DOCUMENT_CHARS = 30_000;

export const SUPPORTED_EXTENSIONS = [".pdf", ".txt", ".md", ".markdown"];
export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
];

export type DocumentContent = {
  fileName: string;
  mimeType: string;
  textContent: string;
  charCount: number;
  truncated: boolean;
};

export async function parseDocument(file: File): Promise<DocumentContent> {
  const fileName = file.name;
  const mimeType = file.type || guessMimeType(fileName);

  let rawText: string;

  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    rawText = await extractPdfText(file);
  } else {
    rawText = await file.text();
  }

  // 空白の正規化
  rawText = rawText.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  const truncated = rawText.length > MAX_DOCUMENT_CHARS;
  const textContent = truncated
    ? rawText.slice(0, MAX_DOCUMENT_CHARS) + "\n\n[...以降省略]"
    : rawText;

  return {
    fileName,
    mimeType,
    textContent,
    charCount: rawText.length,
    truncated,
  };
}

// PDF.js を CDN からロードしてバンドル問題を回避
const PDFJS_VERSION = "4.4.168";
const PDFJS_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build`;

let pdfjsLoadPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if (pdfjsLoadPromise) return pdfjsLoadPromise;

  pdfjsLoadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("PDF parsing is only available in the browser."));
      return;
    }

    // Check if already loaded
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }

    const script = document.createElement("script");
    script.src = `${PDFJS_CDN}/pdf.min.mjs`;
    script.type = "module";

    // Use a module script that assigns to window
    const moduleScript = document.createElement("script");
    moduleScript.type = "module";
    moduleScript.textContent = `
      import * as pdfjsLib from "${PDFJS_CDN}/pdf.min.mjs";
      pdfjsLib.GlobalWorkerOptions.workerSrc = "${PDFJS_CDN}/pdf.worker.min.mjs";
      window.pdfjsLib = pdfjsLib;
      window.dispatchEvent(new Event("pdfjsReady"));
    `;

    const onReady = () => {
      window.removeEventListener("pdfjsReady", onReady);
      resolve((window as any).pdfjsLib);
    };
    window.addEventListener("pdfjsReady", onReady);

    moduleScript.onerror = () => {
      pdfjsLoadPromise = null;
      reject(new Error("PDF.js の読み込みに失敗しました"));
    };

    document.head.appendChild(moduleScript);
  });

  return pdfjsLoadPromise;
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await loadPdfJs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join("");
    if (pageText.trim()) {
      pages.push(pageText);
    }
  }

  if (pages.length === 0) {
    throw new Error(
      "PDFからテキストを抽出できませんでした。画像ベースのPDFの可能性があります。テキストを手動で貼り付けてください。"
    );
  }

  return pages.join("\n\n");
}

function guessMimeType(fileName: string): string {
  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".md") || fileName.endsWith(".markdown"))
    return "text/markdown";
  return "text/plain";
}
