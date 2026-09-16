import { useRef, type RefObject } from 'react';
import { gsap, useGSAP, useMotionEnabled } from './MotionProvider';
import { measureReadout, readoutPanels, readoutText } from './readoutLines';

interface ReadoutOptions {
  key: string;
  active?: boolean;
  titles?: string;
  content?: string;
  controls?: string;
  updates?: string;
  contentKey?: string;
  layout?: boolean;
}

/** Assemble surfaces and print their content without changing the layout. */
export function useReadoutMotion(root: RefObject<HTMLElement | null>, { key, active = true, titles, content, controls, updates, contentKey, layout = false }: ReadoutOptions) {
  const enabled = useMotionEnabled();
  const previous = useRef<{ key: string; active: boolean; contentKey?: string; element: HTMLElement | null } | null>(null);

  useGSAP(() => {
    const last = previous.current;
    const element = root.current;
    const changed = !last || last.key !== key || last.active !== active || last.contentKey !== contentKey || last.element !== element;
    previous.current = { key, active, contentKey, element };
    // Tab/policy restoration doesn't replay content already shown.
    if (!enabled || !active || !changed || !element || element.closest('[hidden]')) return;
    const partial = last?.active && last.element === element && last.contentKey === contentKey;
    const selector = partial && updates ? updates : [titles, content, controls].filter(Boolean).join(',');
    const containers = selector === ':scope' ? [element] : selector ? Array.from(element.querySelectorAll<HTMLElement>(selector)) : [];
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const readouts = readoutText(element, containers).map(node => {
      const source = node.querySelector<HTMLElement>('[data-readout-source]');
      const output = node.querySelector<HTMLElement>('[data-readout-output]');
      const characters = source && output ? Array.from(segmenter.segment(source.textContent ?? ''), item => item.segment) : [];
      const typed = characters.length > 0 && characters.length <= 96;
      return { ...measureReadout(source ?? node), source, output, characters, typed };
    });
    const panels = layout ? readoutPanels(element, containers) : [];
    const items = [
      ...panels.map(panel => ({ ...panel, kind: 'panel' as const })),
      ...readouts.map(readout => ({ ...readout, kind: 'text' as const })),
    ].sort((a, b) => {
      // A parent surface must precede everything inside it.
      if (a.node.contains(b.node)) return -1;
      if (b.node.contains(a.node)) return 1;
      return Math.abs(a.top - b.top) < 3 ? a.left - b.left : a.top - b.top;
    });
    if (!items.length) return;
    const durationFor = (item: typeof readouts[number]) => item.typed ? Math.min(0.22, Math.max(0.09, item.characters.length * 0.012)) : item.bottoms.length * 0.045;
    const lead = panels.length ? 0.12 : 0;
    const total = lead + panels.length * 0.065 + readouts.reduce((sum, item) => sum + durationFor(item), 0);
    const speed = Math.min(1, (layout ? 1.8 : 1.4) / total);
    const initialWidth = element.clientWidth;
    const initialHeight = element.clientHeight;
    // All geometry is read before this write, ahead of the first paint.
    gsap.set(items.map(item => item.node), { opacity: 0 });
    const sequence = gsap.timeline({ defaults: { ease: 'none' } });
    let position = lead * speed;
    // Surfaces and their content use the same output sequence.
    items.forEach(item => {
      if (item.kind === 'panel') {
        // Nested regions run their own readout; open the hosting surface first.
        sequence.set(item.node, { clearProps: 'opacity' }, item.hostsRegion ? lead * speed : position);
        position += 0.065 * speed;
        return;
      }
      const duration = durationFor(item) * speed;
      if (item.typed && item.source && item.output) {
        const output = item.output;
        const progress = { count: 0 };
        sequence.to(progress, {
          count: item.characters.length, duration,
          onUpdate: () => {
            const count = Math.floor(progress.count);
            output.setAttribute('data-readout-output', item.characters.slice(0, count).join('') + (count < item.characters.length ? '▌' : ''));
          },
        }, position)
          .set(item.source, { clearProps: 'opacity' }, position + duration)
          .call(() => output.setAttribute('data-readout-output', ''), [], position + duration);
      } else {
        item.bottoms.forEach((bottom, index) => {
          sequence.set(item.node, { opacity: 1, clipPath: `inset(-0.15em -0.15em ${bottom ? `${bottom}px` : '-0.15em'} -0.15em)` }, position + index * duration / item.bottoms.length);
        });
        sequence.set(item.node, { clearProps: 'opacity,clipPath' }, position + duration);
      }
      position += duration;
    });

    // Input, resize and font changes settle the output without moving content.
    const finish = () => { sequence.progress(1); };
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
      if (element.clientWidth !== initialWidth || element.clientHeight !== initialHeight) finish();
    }) : null;
    resize?.observe(element);
    const interactionRoot = element.closest('main') ?? element;
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest('input,textarea,select,button,a')) finish();
    };
    interactionRoot.addEventListener('pointerdown', finish, true);
    interactionRoot.addEventListener('keydown', finish, true);
    interactionRoot.addEventListener('input', finish, true);
    interactionRoot.addEventListener('focusin', onFocus);
    window.addEventListener('resize', finish);
    document.fonts?.addEventListener('loadingdone', finish);
    return () => {
      readouts.forEach(item => item.output?.setAttribute('data-readout-output', ''));
      resize?.disconnect();
      interactionRoot.removeEventListener('pointerdown', finish, true);
      interactionRoot.removeEventListener('keydown', finish, true);
      interactionRoot.removeEventListener('input', finish, true);
      interactionRoot.removeEventListener('focusin', onFocus);
      window.removeEventListener('resize', finish);
      document.fonts?.removeEventListener('loadingdone', finish);
    };
  }, { scope: root, dependencies: [key, active, enabled, titles, content, controls, updates, contentKey, layout], revertOnUpdate: true });
}
