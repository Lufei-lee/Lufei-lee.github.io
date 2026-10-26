import ReactMarkdown from 'react-markdown';
import katex from 'katex';

export default function ResearchProse({ children }: { children: string }) {
  return <ReactMarkdown components={{
    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
    code: ({ children }) => <span dangerouslySetInnerHTML={{ __html: katex.renderToString(String(children), { throwOnError: true, trust: false, output: 'htmlAndMathml' }) }} />,
  }}>{children}</ReactMarkdown>;
}
