import { prepareMermaidCode } from "./sanitizeMermaid.ts";

export type FlowchartPng = {
  bytes: Uint8Array;
  widthPx: number;
  heightPx: number;
};

function cleanupMermaidArtifacts(id: string) {
  window.document.getElementById(id)?.remove();
  window.document.getElementById(`d${id}`)?.remove();
  window.document.querySelectorAll(`[id^="${id}"]`).forEach((el) => el.remove());
}

/**
 * Renderiza Mermaid em SVG puro (sem HTML labels) — essencial para rasterizar no Word.
 */
export async function renderFlowchartSvg(
  mermaidSource: string
): Promise<string | null> {
  const code = prepareMermaidCode(mermaidSource);
  if (!code) return null;

  const id = `export-flow-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  try {
    const mermaid = (await import("mermaid")).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
      // htmlLabels:false gera texto SVG (converte bem para PNG)
      flowchart: { htmlLabels: false, curve: "basis", useMaxWidth: false },
    });

    const { svg } = await mermaid.render(id, code);
    return svg;
  } catch (err) {
    console.error("Falha ao renderizar fluxograma para exportação:", err);
    return null;
  } finally {
    cleanupMermaidArtifacts(id);
  }
}

function prepareSvgForRaster(svgMarkup: string): {
  xml: string;
  width: number;
  height: number;
} {
  const host = window.document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-12000px;top:0;width:2400px;background:#ffffff;visibility:hidden;";
  host.innerHTML = svgMarkup;
  window.document.body.appendChild(host);

  try {
    const svgEl = host.querySelector("svg");
    if (!svgEl) {
      return { xml: svgMarkup, width: 900, height: 600 };
    }

    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgEl.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    let width = 900;
    let height = 600;
    try {
      const bbox = svgEl.getBBox();
      if (bbox.width > 1 && bbox.height > 1) {
        width = Math.ceil(bbox.width + 24);
        height = Math.ceil(bbox.height + 24);
      }
    } catch {
      // ignore
    }

    const vb = svgEl.getAttribute("viewBox");
    if (vb) {
      const parts = vb.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 1 && parts[3] > 1) {
        width = Math.ceil(parts[2]);
        height = Math.ceil(parts[3]);
      }
    }

    // Limita tamanho extremo
    const maxSide = 2000;
    if (width > maxSide || height > maxSide) {
      const scale = maxSide / Math.max(width, height);
      width = Math.ceil(width * scale);
      height = Math.ceil(height * scale);
    }

    svgEl.setAttribute("width", String(width));
    svgEl.setAttribute("height", String(height));
    if (!svgEl.getAttribute("viewBox")) {
      svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    // Fundo branco
    const bg = window.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#ffffff");
    svgEl.insertBefore(bg, svgEl.firstChild);

    const xml = new XMLSerializer().serializeToString(svgEl);
    return { xml, width, height };
  } finally {
    host.remove();
  }
}

/** Converte SVG em PNG via canvas (data-URI — mais estável que blob URL). */
export async function svgToPng(
  svgMarkup: string,
  scale = 2
): Promise<FlowchartPng | null> {
  try {
    const { xml, width, height } = prepareSvgForRaster(svgMarkup);
    const dataUrl =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error("Não foi possível carregar o SVG do fluxograma"));
      img.src = dataUrl;
    });

    const w = Math.max(
      1,
      Math.round((img.naturalWidth || width) * scale)
    );
    const h = Math.max(
      1,
      Math.round((img.naturalHeight || height) * scale)
    );

    const canvas = window.document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    // Preferir toDataURL se toBlob falhar em alguns browsers
    let bytes: Uint8Array | null = null;
    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (pngBlob) {
      bytes = new Uint8Array(await pngBlob.arrayBuffer());
    } else {
      const data = canvas.toDataURL("image/png");
      const b64 = data.split(",")[1];
      if (b64) {
        const bin = atob(b64);
        bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      }
    }

    if (!bytes || bytes.length < 32) return null;

    // Assinatura PNG
    if (
      bytes[0] !== 0x89 ||
      bytes[1] !== 0x50 ||
      bytes[2] !== 0x4e ||
      bytes[3] !== 0x47
    ) {
      return null;
    }

    return { bytes, widthPx: w, heightPx: h };
  } catch (err) {
    console.error("Falha ao converter fluxograma SVG→PNG:", err);
    return null;
  }
}

export async function renderFlowchartPng(
  mermaidSource: string
): Promise<FlowchartPng | null> {
  const svg = await renderFlowchartSvg(mermaidSource);
  if (!svg) return null;
  return svgToPng(svg, 2);
}
