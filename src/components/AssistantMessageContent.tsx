import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AssistantMessageContentProps {
  content: string;
}

export function AssistantMessageContent({ content }: AssistantMessageContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.55 }}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul style={{ margin: '0 0 8px', paddingLeft: 20, fontSize: 14, lineHeight: 1.55 }}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol style={{ margin: '0 0 8px', paddingLeft: 20, fontSize: 14, lineHeight: 1.55 }}>
            {children}
          </ol>
        ),
        li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
        strong: ({ children }) => <strong>{children}</strong>,
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}>
      {content}
    </ReactMarkdown>
  );
}