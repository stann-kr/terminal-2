/** Canonical text owns layout/accessibility; only the decorative output changes. */
export function TerminalText({ children }: { children: string }) {
  return <span className="tm-terminal-text"><span data-readout-source>{children}</span><span data-readout-output="" aria-hidden="true" /></span>;
}
