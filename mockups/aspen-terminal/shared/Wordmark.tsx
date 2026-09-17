/** The custom display face belongs to the brand word, never its surrounding copy. */
export function Wordmark({ text }: { text: string }) {
  return <>{text.split(/\b(TERMINAL)\b/g).map((part, index) => part === 'TERMINAL'
    ? <span key={index} className="tm-wordmark">{part}</span> : part)}</>;
}

/** Match the semantic source while its decorative terminal output is printing. */
export function writeWordmark(element: HTMLElement, text: string, source: string, cursor: boolean) {
  const fragment = document.createDocumentFragment();
  let remaining = text.length;
  for (const part of source.split(/\b(TERMINAL)\b/g)) {
    if (remaining <= 0) break;
    const printed = part.slice(0, remaining);
    if (part === 'TERMINAL') {
      const word = document.createElement('span');
      word.className = 'tm-wordmark';
      word.textContent = printed;
      fragment.append(word);
    } else fragment.append(document.createTextNode(printed));
    remaining -= part.length;
  }
  if (cursor) fragment.append(document.createTextNode('▌'));
  element.replaceChildren(fragment);
}
