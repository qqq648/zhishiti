import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './MarkdownRenderer.css';

type Props = { text: string; verbatim?: boolean };

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type Segment = { type: 'normal' | 'string' | 'comment'; text: string };

function tokenizePython(code: string): Segment[] {
  const segments: Segment[] = [];
  const len = code.length;
  let i = 0;
  while (i < len) {
    // Triple-quoted strings
    if (code.startsWith("'''", i) || code.startsWith('"""', i)) {
      const quote = code.substr(i, 3);
      let j = i + 3;
      while (j < len) {
        if (code.startsWith(quote, j)) { j += 3; break; }
        j++;
      }
      segments.push({ type: 'string', text: code.slice(i, Math.min(j, len)) });
      i = Math.min(j, len);
      continue;
    }
    // Single/double-quoted strings
    if (code[i] === '"' || code[i] === '\'') {
      const quote = code[i];
      let j = i + 1;
      let escaped = false;
      while (j < len) {
        const ch = code[j];
        if (!escaped && ch === quote) { j++; break; }
        if (!escaped && ch === '\\') { escaped = true; j++; continue; }
        escaped = false; j++;
      }
      segments.push({ type: 'string', text: code.slice(i, Math.min(j, len)) });
      i = Math.min(j, len);
      continue;
    }
    // Line comments
    if (code[i] === '#') {
      let j = i;
      while (j < len && code[j] !== '\n') j++;
      segments.push({ type: 'comment', text: code.slice(i, j) });
      i = j;
      continue;
    }
    // Normal segment until next token boundary
    let j = i;
    while (j < len && !/["'#]/.test(code[j]) && !code.startsWith("'''", j) && !code.startsWith('"""', j)) {
      j++;
    }
    segments.push({ type: 'normal', text: code.slice(i, j) });
    i = j;
  }
  return segments;
}

function highlightPython(code: string): string {
  const parts = tokenizePython(code).map(seg => {
    if (seg.type === 'string') return `<span class="token string">${escapeHtml(seg.text)}</span>`;
    if (seg.type === 'comment') return `<span class="token comment">${escapeHtml(seg.text)}</span>`;
    let t = escapeHtml(seg.text);
    // Decorators @decorator
    t = t.replace(/@[A-Za-z_][A-Za-z0-9_]*/g, '<span class="token decorator">$&</span>');
    // self.attribute
    t = t.replace(/\bself\.[A-Za-z_][A-Za-z0-9_]*/g, (m) => {
      const prop = m.slice(5);
      return `<span class="token variable">self</span>.<span class="token attr">${prop}</span>`;
    });
    // Function and class names
    t = t.replace(/(\bdef\b)(\s+)([A-Za-z_][A-Za-z0-9_]*)/g, '<span class="token keyword">$1</span>$2<span class="token function">$3</span>');
    t = t.replace(/(\bclass\b)(\s+)([A-Za-z_][A-Za-z0-9_]*)/g, '<span class="token keyword">$1</span>$2<span class="token class-name">$3</span>');
    // Keywords
    const kw = /\b(?:and|as|assert|break|continue|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/g;
    t = t.replace(kw, '<span class="token keyword">$&</span>');
    // Builtins
    const bi = /\b(?:len|range|sum|print|zip|map|filter|dict|list|set|tuple|int|float|str|bool|type|object)\b/g;
    t = t.replace(bi, '<span class="token builtin">$&</span>');
    // Numbers
    const num = /\b\d+(?:\.\d+)?\b/g;
    t = t.replace(num, '<span class="token number">$&</span>');
    return t;
  });
  return parts.join('');
}

function highlight(code: string, lang: string): string {
  const language = (lang || '').toLowerCase();
  if (language === 'python' || language === 'py') return highlightPython(code);
  // Fallback: escape only
  return escapeHtml(code);
}

function Header({ language, onCopy, copied }: { language: string; onCopy: () => void; copied: boolean }) {
  const label = language ? language[0].toUpperCase() + language.slice(1) : 'Code';
  return (
    <div className="mdr-header">
      <div className="mdr-lang">{label}</div>
      <button className="mdr-copy" onClick={onCopy}>{copied ? '已复制' : '复制'}</button>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const html = highlight(code, language);
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };
  return (
    <div className="mdr-block">
      <Header language={language} onCopy={doCopy} copied={copied} />
      <pre className="mdr-pre"><code className="mdr-code" dangerouslySetInnerHTML={{ __html: html }} /></pre>
    </div>
  );
}

export default function MarkdownRenderer({ text, verbatim }: Props) {
  if (verbatim) {
    // 原样展示：保留换行与缩进，不做 Markdown 解析
    return <div className="mdr-plain">{text}</div>;
  }
  return (
    <ReactMarkdown
      components={{
        // 移除 react-markdown 默认在代码块外包裹的 <pre>
        pre({ children }: { children?: React.ReactNode }) {
          return <>{children}</>;
        },
        // 正确区分行内代码与块级代码：
        // - 行内（`...` 或 ``...``）始终渲染为行内代码
        // - 仅当是带语言标记的 fenced 代码块，或内容包含换行时，才渲染为代码块
        //   这样可以避免缩进触发的“伪代码块”误判。
        code({ inline, className, children }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
          const raw = String(children ?? '').replace(/\n$/, '');
          const cls = className || '';
          const m = cls.match(/language-(\w+)/);
          const lang = m ? m[1] : 'plaintext';

          if (inline) {
            return <code className="mdr-inline">{raw}</code>;
          }

          const isFencedWithLang = !!m; // 通常来自 ```lang
          const hasNewline = raw.includes('\n');
          const shouldRenderBlock = isFencedWithLang || hasNewline;
          if (!shouldRenderBlock) {
            // 无语言标记且仅一行的“代码块”按行内代码处理，符合“只有 ``` 才是块级”的诉求
            return <code className="mdr-inline">{raw}</code>;
          }

          return <CodeBlock code={raw} language={lang} />;
        }
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
