import { useEffect, useRef } from 'react';
import { FarmRenderer } from '@/render/farmRenderer';
import type { DroneMood } from '@/render/sprites/drone';
import { speedOption } from '@/runtime';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import { useController, useGame } from '../../GameContext';

/** Hosts the canvas renderer; React only manages its lifecycle, never per-frame drawing. */
export function FarmCanvas() {
  const controller = useController();
  const game = useGame();
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(game);
  latest.current = game;

  useEffect(() => {
    const el = canvas.current!;
    const mood = (): DroneMood => {
      const s = latest.current.status;
      return s === 'error' || s === 'failed' ? 'troubled' : s === 'running' ? 'working' : 'idle';
    };
    const font = getComputedStyle(document.body).fontFamily;
    const renderer = new FarmRenderer(el, {
      showCoordinates: () => latest.current.save.settings.showCoordinates,
      reducedMotion: () => prefersReducedMotion(latest.current.save.settings.motion),
      droneMood: mood,
      actionMs: () => speedOption(latest.current.save.settings.speed).actionMs,
      font,
    });
    renderer.setFarm(controller.currentFarm);
    const offFarm = controller.farmReplaced.subscribe((farm) => renderer.setFarm(farm));
    const offEvents = controller.farmEvents.subscribe((e) => renderer.handleEvent(e, performance.now()));
    const resize = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      renderer.resize(r.width, r.height, window.devicePixelRatio);
    });
    resize.observe(el);
    let frame = 0;
    const draw = (t: number) => {
      renderer.draw(t);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      offFarm();
      offEvents();
    };
  }, [controller]);

  return <canvas ref={canvas} className="stage__canvas" role="img" aria-label="The farm field" />;
}
