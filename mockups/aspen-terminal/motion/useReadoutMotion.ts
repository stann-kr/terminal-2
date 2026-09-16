import { useRef, type RefObject } from 'react';
import { gsap, useGSAP, useMotionEnabled } from './MotionProvider';

interface ReadoutOptions {
  key: string;
  active?: boolean;
  titles?: string;
  content?: string;
  controls?: string;
}

/** Print into a visual text layer while canonical content stays in place. */
export function useReadoutMotion(root: RefObject<HTMLElement | null>, { key, active = true, titles, content, controls }: ReadoutOptions) {
  const enabled = useMotionEnabled();
  const previous = useRef<{ key: string; active: boolean } | null>(null);

  useGSAP(() => {
    const changed = !previous.current || previous.current.key !== key || previous.current.active !== active;
    previous.current = { key, active };
    const element = root.current;
    // Returning to a tab or switching CRT on must not replay the current screen.
    if (!enabled || !active || !changed || !element || element.closest('[hidden]')) return;
    const select = (selector?: string) => selector
      ? Array.from(element.querySelectorAll<HTMLElement>(selector)).filter(node => !node.closest('[hidden]')).slice(0, 16)
      : [];
    const headingNodes = select(titles);
    const contentNodes = select(content);
    const controlNodes = select(controls);
    const sequence = gsap.timeline({ defaults: { ease: 'none' } });
    sequence.addLabel('print', 0).addLabel('readout', 0.09);
    if (headingNodes.length) sequence.fromTo(headingNodes, { opacity: 0.78 }, { opacity: 1, duration: 0.1, clearProps: 'opacity' }, 'print');
    if (contentNodes.length) sequence.fromTo(contentNodes, { opacity: 0.8 }, { opacity: 1, duration: 0.08, ease: 'steps(2)', stagger: { amount: 0.12 }, clearProps: 'opacity' }, 'readout');
    if (controlNodes.length) sequence.fromTo(controlNodes, { opacity: 0.85 }, { opacity: 1, duration: 0.08, clearProps: 'opacity' }, 'readout');
    const outputs: HTMLElement[] = [];
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    headingNodes.forEach((heading, index) => {
      const source = heading.querySelector<HTMLElement>('[data-readout-source]');
      const output = heading.querySelector<HTMLElement>('[data-readout-output]');
      if (!source || !output) return;
      const characters = Array.from(segmenter.segment(source.textContent ?? ''), item => item.segment);
      if (!characters.length || characters.length > 96) return;
      outputs.push(output);
      const progress = { count: 0 };
      const start = Math.min(index * 0.025, 0.075);
      const duration = Math.min(0.26, Math.max(0.09, characters.length * 0.014));
      sequence.set(source, { opacity: 0 }, start)
        .to(progress, {
          count: characters.length, duration,
          onUpdate: () => {
            const count = Math.floor(progress.count);
            output.setAttribute('data-readout-output', characters.slice(0, count).join('') + (count < characters.length ? '▌' : ''));
          },
        }, start)
        .set(source, { clearProps: 'opacity' }, start + duration)
        .call(() => output.setAttribute('data-readout-output', ''), [], start + duration);
    });

    // Focus and input take effect immediately, including rapid route changes.
    // Programmatic heading focus is part of navigation, not an interruption.
    const finish = () => { sequence.progress(1); };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest('input,textarea,select,button,a')) finish();
    };
    element.addEventListener('pointerdown', finish, true);
    element.addEventListener('keydown', finish, true);
    element.addEventListener('focusin', onFocus);
    return () => {
      outputs.forEach(output => output.setAttribute('data-readout-output', ''));
      element.removeEventListener('pointerdown', finish, true);
      element.removeEventListener('keydown', finish, true);
      element.removeEventListener('focusin', onFocus);
    };
  }, { scope: root, dependencies: [key, active, enabled, titles, content, controls], revertOnUpdate: true });
}
