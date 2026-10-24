import { describe, expect, it } from 'vitest';
import { silentSoundPlayer } from '@/audio/soundPlayer';
import { GameController } from '@/app/gameController';
import { InMemorySaveRepository, createDefaultSave, type SaveData } from '@/persistence';

function controller(save?: SaveData) {
  const repo = new InMemorySaveRepository(save ?? null);
  let now = 0;
  const game = new GameController({ repository: repo, sound: silentSoundPlayer, now: () => now });
  const settle = () => {
    for (let i = 0; i < 1000 && game.getSnapshot().playback; i++) {
      now += 1000;
      game.frame();
    }
  };
  return { game, repo, settle };
}
const instant = (): SaveData => ({ ...createDefaultSave(), settings: { ...createDefaultSave().settings, speed: 6 } });

describe('GameController', () => {
  it('starts on the first mission with its starter code', () => {
    const { game } = controller();
    const s = game.getSnapshot();
    expect(s.level.id).toBe('m1');
    expect(s.code).toMatch(/move\("east"\)/);
    expect(s.status).toBe('idle');
  });
  it('completes a mission, pays the reward and persists progress', () => {
    const { game, repo, settle } = controller(instant());
    game.setCode('for (let i = 0; i < 5; i++) move("east");');
    game.toggleRun();
    settle();
    const s = game.getSnapshot();
    expect(s.status).toBe('complete');
    expect(s.report).toMatchObject({ tone: 'success', nextLevelId: 'm2', reward: { wheat: 5 } });
    expect(repo.current?.completed.m1).toBe(true);
    expect(repo.current?.bank.wheat).toBe(5);
    expect(repo.current?.code.m1).toMatch(/for/);
  });
  it('reports syntax errors on the offending line without starting', () => {
    const { game } = controller();
    game.setCode('move("east");\nif (');
    game.toggleRun();
    const s = game.getSnapshot();
    expect(s.status).toBe('error');
    expect(s.errorLine).toBe(2);
    expect(s.playback).toBeNull();
    expect(game.log.entries.at(-1)?.text).toMatch(/Syntax error/);
  });
  it('pauses, resumes, steps and stops', () => {
    const { game } = controller();
    game.setCode('while (true) { move("east"); move("west"); }');
    game.stepLine();
    expect(game.getSnapshot()).toMatchObject({ status: 'paused', executingLine: 1 });
    game.toggleRun();
    expect(game.getSnapshot().status).toBe('running');
    game.toggleRun();
    expect(game.getSnapshot().status).toBe('paused');
    game.stop();
    expect(game.getSnapshot()).toMatchObject({ status: 'stopped', playback: null });
  });
  it('does not allow locked levels', () => {
    const { game } = controller();
    game.selectLevel('m5');
    expect(game.getSnapshot().level.id).toBe('m1');
    game.selectLevel('farm');
    expect(game.getSnapshot().level.id).toBe('m1');
  });
  it('keeps sandbox harvests and applies purchased upgrades', () => {
    const save: SaveData = {
      ...instant(),
      completed: { m1: true, m2: true, m3: true },
      unlockedFunctions: ['move', 'plant', 'harvest', 'wait'],
      bank: { wheat: 30, carrot: 0, tomato: 0, crystal: 0 },
    };
    const { game, repo, settle } = controller(save);
    game.selectLevel('farm');
    game.setCode('plant("wheat"); wait(8); harvest();');
    game.toggleRun();
    settle();
    expect(repo.current?.bank.wheat).toBe(31);
    game.buyUpgrade('lens');
    expect(repo.current?.upgrades.lens).toBe(true);
    expect(repo.current?.unlockedFunctions).toContain('canHarvest');
    expect(repo.current?.bank.wheat).toBe(6);
  });
  it('restores starter code on request', () => {
    const { game } = controller();
    game.setCode('// mine');
    game.restoreStarterCode();
    expect(game.getSnapshot().code).toMatch(/move\("east"\)/);
  });
});
