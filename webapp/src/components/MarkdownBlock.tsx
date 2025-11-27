import React from 'react';
import ReactMarkdown from 'react-markdown';

// 解析 ```lang 提取语言
const extractLang = (className?: string): string => {
  if (!className) return '';
  const m = className.match(/language-(\w+)/);
  return m ? m[1].toUpperCase() : '';
};

interface MarkdownBlockProps {
  children: string;
}

const MarkdownBlock: React.FC<MarkdownBlockProps> = ({ children }) => {
  return (
    <ReactMarkdown
      children={children}
      components={{
        code({ node, className, children, ...props }) {
          const lang = extractLang(className);
          return (
            <div className="code-block-wrapper">
              {lang && <div className="code-lang-label">{lang}</div>}
              <pre className="code-block">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            </div>
          );
        },
      }}
    />
  );
};

export default MarkdownBlock;