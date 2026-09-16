import type { RefObject } from 'react';
import { gsap, useGSAP, useMotionEnabled } from './MotionProvider';

export function useControlMotion(root: RefObject<HTMLElement | null>, viewKey: string) {
  const enabled = useMotionEnabled();
  useGSAP((_, contextSafe) => {
    const element = root.current;
    if (!enabled || !element || !contextSafe) return;
    const motions = new Map<HTMLElement, { x: gsap.QuickToFunc; scale: gsap.QuickToFunc }>();
    let pressed: HTMLElement | null = null;
    const labelFor = (target: EventTarget | null) => {
      const control = target instanceof Element ? target.closest<HTMLElement>('a,button') : null;
      if (!control || !element.contains(control) || control.matches(':disabled') || control.closest('[hidden]')) return null;
      const label = control.querySelector<HTMLElement>('[data-control-label]')
        ?? control.querySelector<HTMLElement>('.tm-nav-code,.tm-action > span:first-child,.tm-roster li a > span:last-child,.tm-gate-lineup a > span,.tm-history-entry h3');
      return label ? { control, label } : null;
    };
    const motionFor = (label: HTMLElement) => {
      let motion = motions.get(label);
      if (!motion) {
        motion = {
          x: gsap.quickTo(label, 'x', { duration: 0.24, ease: 'power3.out' }),
          scale: gsap.quickTo(label, 'scale', { duration: 0.16, ease: 'power2.out' }),
        };
        motions.set(label, motion);
      }
      return motion;
    };
    const over = contextSafe((event: PointerEvent) => {
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const found = labelFor(event.target);
      if (found && !(event.relatedTarget instanceof Node && found.control.contains(event.relatedTarget))) motionFor(found.label).x(3);
    });
    const out = contextSafe((event: PointerEvent) => {
      const found = labelFor(event.target);
      if (found && !(event.relatedTarget instanceof Node && found.control.contains(event.relatedTarget))) {
        motionFor(found.label).x(0);
        motionFor(found.label).scale(1);
      }
    });
    const down = contextSafe((event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && (event.repeat || !['Enter', ' '].includes(event.key))) return;
      const found = labelFor(event.target);
      if (found) { pressed = found.label; motionFor(pressed).scale(0.975); }
    });
    const release = contextSafe(() => {
      if (pressed) motionFor(pressed).scale(1);
      pressed = null;
    });
    const blur = contextSafe(() => {
      motions.forEach(motion => { motion.x(0); motion.scale(1); });
      pressed = null;
    });
    element.addEventListener('pointerover', over);
    element.addEventListener('pointerout', out);
    element.addEventListener('pointerdown', down);
    element.addEventListener('keydown', down);
    element.addEventListener('focusout', release);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('keyup', release);
    window.addEventListener('blur', blur);
    return () => {
      element.removeEventListener('pointerover', over);
      element.removeEventListener('pointerout', out);
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('keydown', down);
      element.removeEventListener('focusout', release);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('keyup', release);
      window.removeEventListener('blur', blur);
      motions.clear();
    };
  }, { scope: root, dependencies: [viewKey, enabled], revertOnUpdate: true });
}
