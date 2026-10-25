/**
 * English game content: missions, objectives, failure messages, crop names and upgrades.
 * This file is the contract for the other locales. Every key here must exist in pt-BR and es.
 */
export const en = {
  'mission.m1.title': 'First Flight',
  'mission.m1.concept': 'Calling a function',
  'mission.m1.briefing.0': 'Your drone has just come online. It does exactly what your code says, one line at a time.',
  'mission.m1.briefing.1':
    'move("east") flies one tile east. Each call is one step. Add more until the drone reaches the beacon at the end of the path.',

  'mission.m2.title': 'First Harvest',
  'mission.m2.concept': 'Directions and harvesting',
  'mission.m2.briefing.0':
    'A stalk of ripe wheat stands at the far corner, x 2, y 2. The drone starts at x 0, y 0, the south-west corner. North is up the screen.',
  'mission.m2.briefing.1':
    'Fly over it and call harvest(). Harvesting takes the crop into your inventory. Use console.log(getPosX(), getPosY()) to check where you are.',

  'mission.m3.title': 'Planting Season',
  'mission.m3.concept': 'Time and growth',
  'mission.m3.briefing.0':
    'Time on the farm is measured in ticks. Moving takes 2 ticks; planting and harvesting take 1. Wheat needs 8 ticks to ripen.',
  'mission.m3.briefing.1':
    'plant("wheat") puts a seed in the soil below. wait(n) lets n ticks pass. Grow three wheat. Harvest too early and the crop is destroyed.',

  'mission.m4.title': 'The Loop',
  'mission.m4.concept': 'for loops',
  'mission.m4.briefing.0':
    'Eight ripe stalks in a row. You could write harvest() and move("east") eight times each, but a loop repeats code for you.',
  'mission.m4.briefing.1':
    'for (let i = 0; i < 3; i++) { … } runs its block three times while i counts 0, 1, 2. Change it to clear the whole row.',

  'mission.m5.title': 'Field Inspection',
  'mission.m5.concept': 'if and conditions',
  'mission.m5.briefing.0':
    'This row mixes ripe wheat with tomato seedlings. Harvesting a seedling destroys it, and this mission fails if anything is destroyed.',
  'mission.m5.briefing.1':
    "getCropGrowth() returns 1 when the crop below is ripe. Wrap harvest() in an if so the drone only cuts what's ready.",

  'mission.m6.title': 'Smart Navigation',
  'mission.m6.concept': 'while loops and debugging',
  'mission.m6.briefing.0':
    "Rocks and a pond block the way to the beacon in the north-east corner. move() returns false when it's blocked, and the drone stays put.",
  'mission.m6.briefing.1':
    'Run the starter code first. It gets stuck: the drone keeps bumping into a rock, and after a while the game stops the program. Read the console, then use canMove(direction) to go north whenever east is blocked.',

  'mission.m7.title': 'Reusable Routines',
  'mission.m7.concept': 'functions',
  'mission.m7.briefing.0':
    'A bare 4 × 4 plot. Tending each tile means: harvest it if ripe, plant it if empty. Writing that out 16 times is no way to farm.',
  'mission.m7.briefing.1':
    'Put the routine in a function, then call it from your loops. When the drone reaches the east edge, bring it back west before moving north.',

  'mission.m8.title': 'Resource Management',
  'mission.m8.concept': 'Inventory and costs',
  'mission.m8.briefing.0': 'Carrots are worth more, but every carrot seed costs 2 wheat, and the cargo hold only fits 10 of each crop.',
  'mission.m8.briefing.1':
    'You start with 4 wheat. Use getInventory() and getCost("carrot") to decide what to plant, and grow wheat whenever you can\'t afford a carrot.',

  'mission.m9.title': 'Mixed Crops',
  'mission.m9.concept': 'Branching on values',
  'mission.m9.briefing.0':
    "A neighbour's field is ripe with wheat, carrots and tomatoes. Harvest every tile, then replant each one with the same crop it had.",
  'mission.m9.briefing.1':
    "getCropType() tells you what's below before you cut it. Tomato seeds cost 2 carrots, so collect before you spend.",

  'mission.m10.title': 'Autonomous Farm',
  'mission.m10.concept': 'Putting it all together',
  'mission.m10.briefing.0':
    'An empty 6 × 6 field and 3,000 ticks. Build a full supply chain: wheat pays for carrots, carrots pay for tomatoes.',
  'mission.m10.briefing.1': 'Watering a crop with water() doubles its growth speed. Fewer ticks is a better score.',

  'objective.beacon': 'Reach the beacon',
  'objective.beaconEast': 'Reach the beacon at the east end',
  'objective.collect': 'Collect {count} {crop}',
  'objective.have': 'Have {count} {crop}',
  'objective.harvest': 'Harvest {count} crops',
  'objective.loop': 'Use a loop',
  'objective.function': 'Define and use a function',
  'objective.nothingDestroyed': 'Leave every seedling standing',
  'objective.replanted': 'Replant every tile with its original crop',
  'objective.ticks': 'Finish within {limit} ticks',

  'failure.destroyed': 'A seedling was destroyed. Only harvest when getCropGrowth() === 1.',
  'failure.outOfTime': 'Out of time: the mission allows {limit} ticks.',
  'report.missionFailed': 'Mission failed',
  'report.notDone': 'Not quite',
  'report.missionComplete': 'Mission complete',
  'report.everyMissionComplete': 'Every mission complete',
  'report.stillToDo': 'Your program ended before every objective was met. Still to do: {items}.',
  'report.newBest': 'New best: {ticks} ticks (was {previous}).',
  'report.bestSoFar': 'Best so far: {ticks} ticks.',

  'crop.wheat.one': 'wheat',
  'crop.wheat.other': 'wheat',
  'crop.carrot.one': 'carrot',
  'crop.carrot.other': 'carrots',
  'crop.tomato.one': 'tomato',
  'crop.tomato.other': 'tomatoes',
  'crop.crystal.one': 'crystal',
  'crop.crystal.other': 'crystals',

  'upgrade.lens.name': 'Ripeness lens',
  'upgrade.lens.description': 'Unlocks canHarvest(), a quick ripeness check.',
  'upgrade.rotors.name': 'Turbo rotors',
  'upgrade.rotors.description': 'Moving on your farm costs 1 tick instead of 2.',
  'upgrade.field1.name': 'Field expansion',
  'upgrade.field1.description': 'Grows your farm from 5 × 5 to 7 × 7 tiles.',
  'upgrade.cargo1.name': 'Cargo pods',
  'upgrade.cargo1.description': 'Farm cargo holds 150 of each crop instead of 50.',
  'upgrade.sensor.name': 'Sensor array',
  'upgrade.sensor.description': 'Unlocks scan(direction) to inspect the next tile from afar.',
  'upgrade.crystal.name': 'Crystal seeds',
  'upgrade.crystal.description': 'Unlocks crystal, a slow crop that only grows when watered.',
  'upgrade.field2.name': 'Field expansion II',
  'upgrade.field2.description': 'Grows your farm to 9 × 9 tiles.',
  'upgrade.cargo2.name': 'Cargo pods II',
  'upgrade.cargo2.description': 'Farm cargo holds 500 of each crop.',
  'upgrade.blades.name': 'Sharp blades',
  'upgrade.blades.description': 'Every harvest on your farm yields 1 extra crop.',

  'log.missionLoaded': "Mission loaded: {title}. Press Run when you're ready.",
  'log.openFarmLoaded': 'Open farm loaded. Crops you harvest here are kept.',
  'log.fieldCleared': 'Field cleared.',
  'log.fieldReset': 'Field reset to the mission start.',
  'log.runStarted': 'Run started.',
  'log.runStartedStep': 'Run started in step mode.',
  'log.missionComplete': 'Mission complete: {title}.',
  'log.missionFailed': 'Mission failed: {reason}',
  'log.stillToDo': "Program finished, but the mission isn't done yet. Still to do: {items}.",
  'log.programFinished': 'Program finished.',

  'toast.upgradeInstalled': 'Upgrade installed.',
  'toast.progressReset': 'Progress reset.',
  'toast.notice': '{notice}',
  'toast.purchaseFailed': '{reason}',
} as const;

export type ContentKey = keyof typeof en;
