import React from "react";
import {
  parseMarkdown,
  type BlockNode,
  type InlineNode,
} from "../utils/markdown";

function renderInline(nodes: InlineNode[], keyPrefix: string): React.ReactNode[] {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (node.type) {
      case "text":
        return <React.Fragment key={key}>{node.text}</React.Fragment>;
      case "code":
        return (
          <code key={key} className="md-inline-code">
            {node.text}
          </code>
        );
      case "bold":
        return (
          <strong key={key} className="md-bold">
            {renderInline(node.children, key)}
          </strong>
        );
      case "italic":
        return (
          <em key={key} className="md-italic">
            {renderInline(node.children, key)}
          </em>
        );
      default:
        return null;
    }
  });
}

function renderBlock(block: BlockNode, index: number): React.ReactNode {
  const key = `b-${index}`;
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4";
      return (
        <Tag key={key} className={`md-h md-h${block.level}`}>
          {renderInline(block.children, key)}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p key={key} className="md-p">
          {renderInline(block.children, key)}
        </p>
      );
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag
          key={key}
          className={block.ordered ? "md-ol" : "md-ul"}
        >
          {block.items.map((item, i) => (
            <li key={`${key}-li-${i}`} className="md-li">
              {renderInline(item, `${key}-li-${i}`)}
            </li>
          ))}
        </ListTag>
      );
    }
    case "table":
      return (
        <div key={key} className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                {block.headers.map((cell, i) => (
                  <th key={`${key}-th-${i}`}>
                    {renderInline(cell, `${key}-th-${i}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={`${key}-tr-${ri}`}>
                  {row.map((cell, ci) => (
                    <td key={`${key}-td-${ri}-${ci}`}>
                      {renderInline(cell, `${key}-td-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "code":
      return (
        <pre key={key} className="md-pre">
          <code>{block.text}</code>
        </pre>
      );
    case "hr":
      return <hr key={key} className="md-hr" />;
    case "blockquote":
      return (
        <blockquote key={key} className="md-quote">
          {renderInline(block.children, key)}
        </blockquote>
      );
    default:
      return null;
  }
}

interface MarkdownDocumentProps {
  content: string;
  className?: string;
}

/** Renderiza markdown do POPI com tipografia e tabelas legíveis. */
export default function MarkdownDocument({
  content,
  className = "",
}: MarkdownDocumentProps) {
  const blocks = React.useMemo(() => parseMarkdown(content || ""), [content]);

  if (!content?.trim()) {
    return (
      <p className="text-sm text-slate-400 italic">Documento vazio.</p>
    );
  }

  return (
    <article className={`md-doc ${className}`.trim()}>
      {blocks.map(renderBlock)}
    </article>
  );
}
