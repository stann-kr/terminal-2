import { useRef, type RefObject } from 'react';
import { gsap, useGSAP, useMotionEnabled } from './MotionProvider';

interface ReadoutOptions {
  key: string;
  active?: boolean;
  titles?: string;
  content?: string;
  controls?: string;
  rules?: string;
}

/** Each screen owns its selectors. Only text moves; interactive areas only fade. */
export function useReadoutMotion(root: RefObject<HTMLElement | null>, { key, active = true, titles, content, controls, rules }: ReadoutOptions) {
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
    const ruleNodes = select(rules);
    const sequence = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'opacity,transform' } });
    sequence.addLabel('title', 0).addLabel('body', 0.07).addLabel('controls', 0.11);
    if (headingNodes.length) sequence.fromTo(headingNodes, { x: -10, opacity: 0.35 }, { x: 0, opacity: 1, duration: 0.46, stagger: 0.045 }, 'title');
    if (contentNodes.length) sequence.fromTo(contentNodes, { x: -4, opacity: 0.5 }, { x: 0, opacity: 1, duration: 0.36, stagger: { amount: 0.16 } }, 'body');
    if (controlNodes.length) sequence.fromTo(controlNodes, { opacity: 0.7 }, { opacity: 1, duration: 0.22, stagger: { amount: 0.06 } }, 'controls');
    if (ruleNodes.length) sequence.fromTo(ruleNodes, { '--tm-rule-scale': 0, '--tm-rule-opacity': 0.65 }, { '--tm-rule-scale': 1, duration: 0.42, ease: 'power2.inOut', clearProps: '' }, 0)
      .to(ruleNodes, { '--tm-rule-opacity': 0, duration: 0.22, clearProps: '--tm-rule-scale,--tm-rule-opacity' }, 0.36);

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
      element.removeEventListener('pointerdown', finish, true);
      element.removeEventListener('keydown', finish, true);
      element.removeEventListener('focusin', onFocus);
    };
  }, { scope: root, dependencies: [key, active, enabled, titles, content, controls, rules], revertOnUpdate: true });
}
