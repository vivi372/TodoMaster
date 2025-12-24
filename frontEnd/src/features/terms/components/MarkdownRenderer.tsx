import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold text-foreground mb-4 mt-8 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold text-foreground mb-4 mt-8 pb-2 border-b-2 border-primary/20">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg font-semibold text-foreground mb-2 mt-4">{children}</h4>
        ),
        p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-2 mb-4 ml-4">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-2 mb-4 ml-4">{children}</ol>
        ),
        li: ({ children }) => <li className="text-gray-700">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary bg-primary/5 pl-4 py-2 my-4 italic text-gray-600">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
            <code className="text-sm font-mono text-gray-800">{children}</code>
          </pre>
        ),
        hr: () => <hr className="my-8 border-t-2 border-gray-200" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-gray-300">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-primary/10">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-gray-300">{children}</tr>,
        th: ({ children }) => (
          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">{children}</th>
        ),
        td: ({ children }) => <td className="border border-gray-300 px-4 py-2">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
