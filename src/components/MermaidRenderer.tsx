import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

// Generate a unique ID to prevent ID collisions among rendered elements
let uniqueIdCount = 0;

interface MermaidRendererProps {
  chartCode: string;
}

export default function MermaidRenderer({ chartCode }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [elementId] = useState(() => `mermaid-diagram-${++uniqueIdCount}-${Date.now()}`);

  useEffect(() => {
    if (!chartCode) {
      setSvgContent("");
      setError(null);
      return;
    }

    const renderGraph = async () => {
      try {
        setError(null);

        // Prep clean code
        let cleanedCode = chartCode.trim();
        
        // Remove codeblock ticks if the AI wrapped it as a block
        if (cleanedCode.startsWith("```mermaid")) {
          cleanedCode = cleanedCode.replace(/^```mermaid/, "");
        } else if (cleanedCode.startsWith("```")) {
          cleanedCode = cleanedCode.replace(/^```/, "");
        }

        if (cleanedCode.endsWith("```")) {
          cleanedCode = cleanedCode.replace(/```$/, "");
        }
        
        cleanedCode = cleanedCode.trim();

        if (!cleanedCode) {
          setError("Diagrama vazio.");
          return;
        }

        // Initialize mermaid options
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#eff6ff", // bg-blue-50
            primaryTextColor: "#1e3a8a", // text-blue-900
            primaryBorderColor: "#bfdbfe", // border-blue-200
            lineColor: "#475569", // slate-600
            secondaryColor: "#f0fdf4", // bg-green-50
            tertiaryColor: "#fffbeb", // bg-amber-50
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "12px",
          },
          securityLevel: "loose",
        });

        // Request SVG output using latest async/await API
        const { svg } = await mermaid.render(elementId, cleanedCode);
        setSvgContent(svg);
        setError(null);
      } catch (err: any) {
        console.error("Mermaid generation failure:", err);
        // Attempt to clean a standard element error on parsing or parsing exceptions
        setError(err?.message || "Erro de renderização no compilador Mermaid. Sintaxe inválida.");
        setSvgContent("");
      }
    };

    renderGraph();
  }, [chartCode, elementId]);

  return (
    <div className="w-full border border-slate-100 rounded-xl bg-slate-50/20 p-4 md:p-6 overflow-auto flex flex-col items-center justify-center min-h-[300px]">
      {error ? (
        <div className="text-center p-6 space-y-3 max-w-xl animate-fade-in">
          <div className="inline-flex items-center justify-center p-2 rounded-full bg-rose-50 text-rose-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Sintaxe do Diagrama Inválida</h4>
            <p className="text-xs text-slate-500 mt-1">
              O modelo gerou um fluxograma que o compilador visual Mermaid não pôde processar.
            </p>
          </div>
          <pre className="text-[11px] font-mono text-left text-slate-600 bg-slate-100 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[140px] w-full border border-slate-200">
            {error}
          </pre>
          <p className="text-[11px] text-slate-400">
            Dica: Você pode editar o código do fluxograma manualmente para corrigir, ou usar um comando de edição por IA.
          </p>
        </div>
      ) : svgContent ? (
        <div 
          ref={containerRef}
          className="w-full flex justify-center animate-fade-in overflow-x-auto [&>svg]:min-w-[280px] [&>svg]:max-w-full [&>svg]:h-auto text-slate-700"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-400 animate-pulse text-xs font-semibold">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Compilando fluxograma técnico...
        </div>
      )}
    </div>
  );
}
