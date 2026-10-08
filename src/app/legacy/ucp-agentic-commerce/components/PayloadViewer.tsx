import { useState } from 'react';

type PayloadViewerProps = {
  payload: unknown;
};

function syntaxHighlight(json: unknown) {
  const str = typeof json === 'string' ? json : JSON.stringify(json, null, 2);
  const escapeHtml = (s: string) => s.replace(/[&<>]/g, ch => (ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : '&gt;'));
  return str.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match: string) => {
      let cls = 'json-number';
      if (/^\"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${escapeHtml(match)}</span>`;
    }
  );
}

export default function PayloadViewer({ payload }: PayloadViewerProps) {
  const [copied, setCopied] = useState(false);

  const json = JSON.stringify(payload, null, 2);
  const highlighted = syntaxHighlight(json);

  function handleCopy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="relative h-full">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 z-10 px-2.5 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors border border-slate-600"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <pre
        className="text-xs leading-relaxed font-mono overflow-auto h-full p-4 text-slate-300"
        dangerouslySetInnerHTML={{ __html: highlighted }}
        style={{ tabSize: 2 }}
      />
    </div>
  );
}
