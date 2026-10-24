import { describe, expect, it } from 'vitest';
import { parseProgram } from '@/interpreter';
import { unlockHint } from '@/progression';
import { MISSION_LIMITS, Playback, ProgramRun, type RunOutcome } from '@/runtime';
import { ALL_FUNCTIONS, field } from './helpers';

function setup(source: string, actionMs: number, startPaused = false) {
  let now = 0;
  const lines: number[] = [];
  let outcome: RunOutcome | null = null;
  const farm = field();
  const run = new ProgramRun({
    program: parseProgram(source),
    farm,
    unlockedFunctions: new Set(ALL_FUNCTIONS),
    unlockHint,
    console: { write: () => {}, clear: () => {} },
    notices: { warn: () => {} },
    limits: MISSION_LIMITS,
    randomSeed: 1,
  });
  const playback = new Playback(
    run,
    { onStep: (s) => s.type === 'step' && lines.push(s.line), onEnded: (o) => (outcome = o) },
    { actionDuration: () => actionMs, now: () => now },
    startPaused,
  );
  return { playback, farm, lines, advance: (ms: number) => (now += ms), outcome: () => outcome };
}

describe('playback', () => {
  const program = 'move("east");\nmove("east");\nmove("north");';

  it('paces actions by speed without changing the result', () => {
    const slow = setup(program, 100);
    slow.playback.update();
    expect(slow.farm.drone).toEqual({ x: 1, y: 0 });
    slow.playback.update();
    expect(slow.farm.drone).toEqual({ x: 1, y: 0 });
    slow.advance(100);
    slow.playback.update();
    expect(slow.farm.drone).toEqual({ x: 2, y: 0 });
    for (let i = 0; i < 5; i++) {
      slow.advance(100);
      slow.playback.update();
    }
    const fast = setup(program, 0);
    fast.playback.update();
    expect(fast.outcome()?.kind).toBe('finished');
    expect(slow.outcome()?.kind).toBe('finished');
    expect(slow.farm.drone).toEqual(fast.farm.drone);
    expect(slow.farm.tick).toBe(fast.farm.tick);
  });
  it('pauses and resumes', () => {
    const p = setup(program, 0);
    p.playback.pause();
    p.playback.update();
    expect(p.farm.tick).toBe(0);
    p.playback.resume();
    p.playback.update();
    expect(p.playback.state).toBe('ended');
  });
  it('steps one line at a time', () => {
    const p = setup(program, 0, true);
    p.playback.stepLine();
    expect(p.lines).toEqual([1]);
    expect(p.farm.drone).toEqual({ x: 0, y: 0 });
    p.playback.stepLine();
    expect(p.lines).toEqual([1, 2]);
    expect(p.farm.drone).toEqual({ x: 1, y: 0 });
  });
  it('stops an endless program and keeps the UI loop bounded', () => {
    const p = setup('while (true) { move("east"); move("west"); }', 0);
    p.playback.update();
    expect(p.playback.state).toBe('running');
    p.playback.stop();
    expect(p.outcome()?.kind).toBe('stopped');
  });
  it('excludes paused time from elapsed time', () => {
    const p = setup(program, 100);
    p.advance(50);
    p.playback.pause();
    p.advance(1000);
    p.playback.resume();
    p.advance(50);
    expect(p.playback.elapsedMs).toBe(100);
  });
});
