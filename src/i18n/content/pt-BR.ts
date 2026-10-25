import type { ContentKey } from './en';

/** Brazilian Portuguese game content. Keys must match `en`; the type checker enforces this. */
export const pt: Record<ContentKey, string> = {
  'mission.m1.title': 'Primeiro voo',
  'mission.m1.concept': 'Chamando uma função',
  'mission.m1.briefing.0': 'Seu drone acabou de ligar. Ele faz exatamente o que o seu código manda, uma linha por vez.',
  'mission.m1.briefing.1':
    'move("east") voa uma casa para o leste. Cada chamada é um passo. Adicione mais até o drone chegar ao farol no fim do caminho.',

  'mission.m2.title': 'Primeira colheita',
  'mission.m2.concept': 'Direções e colheita',
  'mission.m2.briefing.0':
    'Um pé de trigo maduro está no canto mais distante, x 2, y 2. O drone começa em x 0, y 0, o canto sudoeste. O norte fica para cima na tela.',
  'mission.m2.briefing.1':
    'Voe sobre ele e chame harvest(). A colheita leva a cultura para o seu inventário. Use console.log(getPosX(), getPosY()) para checar onde você está.',

  'mission.m3.title': 'Época de plantio',
  'mission.m3.concept': 'Tempo e crescimento',
  'mission.m3.briefing.0':
    'O tempo na fazenda é medido em ticks. Mover leva 2 ticks; plantar e colher levam 1. O trigo precisa de 8 ticks para amadurecer.',
  'mission.m3.briefing.1':
    'plant("wheat") coloca uma semente no solo abaixo. wait(n) deixa passar n ticks. Cultive três pés de trigo. Se colher cedo demais, a cultura é destruída.',

  'mission.m4.title': 'O laço',
  'mission.m4.concept': 'Laços for',
  'mission.m4.briefing.0':
    'Oito pés maduros em fileira. Você poderia escrever harvest() e move("east") oito vezes cada, mas um laço repete o código para você.',
  'mission.m4.briefing.1':
    'for (let i = 0; i < 3; i++) { … } executa o bloco três vezes enquanto i conta 0, 1, 2. Mude-o para limpar a fileira inteira.',

  'mission.m5.title': 'Inspeção de campo',
  'mission.m5.concept': 'if e condições',
  'mission.m5.briefing.0':
    'Esta fileira mistura trigo maduro com mudas de tomate. Colher uma muda a destrói, e esta missão falha se algo for destruído.',
  'mission.m5.briefing.1':
    'getCropGrowth() retorna 1 quando a cultura abaixo está madura. Coloque harvest() dentro de um if para que o drone corte só o que está pronto.',

  'mission.m6.title': 'Navegação inteligente',
  'mission.m6.concept': 'Laços while e depuração',
  'mission.m6.briefing.0':
    'Pedras e um lago bloqueiam o caminho até o farol no canto nordeste. move() retorna false quando está bloqueado, e o drone fica parado.',
  'mission.m6.briefing.1':
    'Primeiro execute o código inicial. Ele trava: o drone continua batendo numa pedra e, depois de um tempo, o jogo para o programa. Leia o console e use canMove(direction) para ir ao norte sempre que o leste estiver bloqueado.',

  'mission.m7.title': 'Rotinas reutilizáveis',
  'mission.m7.concept': 'Funções',
  'mission.m7.briefing.0':
    'Um lote 4 × 4 vazio. Cuidar de cada casa significa: colher se estiver madura, plantar se estiver vazia. Escrever isso 16 vezes não é jeito de cultivar.',
  'mission.m7.briefing.1':
    'Coloque a rotina em uma função e chame-a dos seus laços. Quando o drone chegar à borda leste, traga-o de volta para o oeste antes de ir ao norte.',

  'mission.m8.title': 'Gestão de recursos',
  'mission.m8.concept': 'Inventário e custos',
  'mission.m8.briefing.0': 'Cenouras valem mais, mas cada semente de cenoura custa 2 de trigo, e a carga só comporta 10 de cada cultura.',
  'mission.m8.briefing.1':
    'Você começa com 4 de trigo. Use getInventory() e getCost("carrot") para decidir o que plantar, e cultive trigo sempre que não puder pagar uma cenoura.',

  'mission.m9.title': 'Culturas mistas',
  'mission.m9.concept': 'Ramificando por valores',
  'mission.m9.briefing.0':
    'O campo de um vizinho está maduro com trigo, cenouras e tomates. Colha cada casa e replante cada uma com a mesma cultura que tinha.',
  'mission.m9.briefing.1':
    'getCropType() informa o que está embaixo antes de você cortar. Sementes de tomate custam 2 cenouras, então colete antes de gastar.',

  'mission.m10.title': 'Fazenda autônoma',
  'mission.m10.concept': 'Juntando tudo',
  'mission.m10.briefing.0':
    'Um campo vazio de 6 × 6 e 3.000 ticks. Monte uma cadeia de suprimentos completa: o trigo paga as cenouras, e as cenouras pagam os tomates.',
  'mission.m10.briefing.1': 'Regar uma cultura com water() dobra sua velocidade de crescimento. Menos ticks é uma pontuação melhor.',

  'objective.beacon': 'Chegue ao farol',
  'objective.beaconEast': 'Chegue ao farol na extremidade leste',
  'objective.collect': 'Colete {count} {crop}',
  'objective.have': 'Tenha {count} {crop}',
  'objective.harvest': 'Colha {count} culturas',
  'objective.loop': 'Use um laço',
  'objective.function': 'Defina e use uma função',
  'objective.nothingDestroyed': 'Deixe todas as mudas de pé',
  'objective.replanted': 'Replante cada casa com sua cultura original',
  'objective.ticks': 'Termine em até {limit} ticks',

  'failure.destroyed': 'Uma muda foi destruída. Colha só quando getCropGrowth() === 1.',
  'failure.outOfTime': 'Tempo esgotado: a missão permite {limit} ticks.',
  'report.missionFailed': 'Falha na missão',
  'report.notDone': 'Quase lá',
  'report.missionComplete': 'Missão concluída',
  'report.everyMissionComplete': 'Todas as missões concluídas',
  'report.stillToDo': 'Seu programa terminou antes de todos os objetivos serem cumpridos. Pendente: {items}.',
  'report.newBest': 'Novo recorde: {ticks} ticks (antes era {previous}).',
  'report.bestSoFar': 'Melhor até agora: {ticks} ticks.',

  'crop.wheat.one': 'trigo',
  'crop.wheat.other': 'trigo',
  'crop.carrot.one': 'cenoura',
  'crop.carrot.other': 'cenouras',
  'crop.tomato.one': 'tomate',
  'crop.tomato.other': 'tomates',
  'crop.crystal.one': 'cristal',
  'crop.crystal.other': 'cristais',

  'upgrade.lens.name': 'Lente de maturação',
  'upgrade.lens.description': 'Libera canHarvest(), uma checagem rápida de maturação.',
  'upgrade.rotors.name': 'Rotores turbo',
  'upgrade.rotors.description': 'Mover na sua fazenda custa 1 tick em vez de 2.',
  'upgrade.field1.name': 'Expansão do campo',
  'upgrade.field1.description': 'Aumenta sua fazenda de 5 × 5 para 7 × 7 casas.',
  'upgrade.cargo1.name': 'Módulos de carga',
  'upgrade.cargo1.description': 'A carga da fazenda guarda 150 de cada cultura em vez de 50.',
  'upgrade.sensor.name': 'Matriz de sensores',
  'upgrade.sensor.description': 'Libera scan(direction) para inspecionar a próxima casa à distância.',
  'upgrade.crystal.name': 'Sementes de cristal',
  'upgrade.crystal.description': 'Libera crystal, uma cultura lenta que só cresce quando regada.',
  'upgrade.field2.name': 'Expansão do campo II',
  'upgrade.field2.description': 'Aumenta sua fazenda para 9 × 9 casas.',
  'upgrade.cargo2.name': 'Módulos de carga II',
  'upgrade.cargo2.description': 'A carga da fazenda guarda 500 de cada cultura.',
  'upgrade.blades.name': 'Lâminas afiadas',
  'upgrade.blades.description': 'Cada colheita na sua fazenda rende 1 cultura extra.',

  'log.missionLoaded': 'Missão carregada: {title}. Aperte Executar quando estiver pronto.',
  'log.openFarmLoaded': 'Fazenda livre carregada. As colheitas feitas aqui são mantidas.',
  'log.fieldCleared': 'Campo limpo.',
  'log.fieldReset': 'Campo reiniciado para o início da missão.',
  'log.runStarted': 'Execução iniciada.',
  'log.runStartedStep': 'Execução iniciada no modo passo.',
  'log.missionComplete': 'Missão concluída: {title}.',
  'log.missionFailed': 'Falha na missão: {reason}',
  'log.stillToDo': 'Programa finalizado, mas a missão ainda não está concluída. Pendente: {items}.',
  'log.programFinished': 'Programa finalizado.',

  'toast.upgradeInstalled': 'Melhoria instalada.',
  'toast.progressReset': 'Progresso apagado.',
  'toast.notice': '{notice}',
  'toast.purchaseFailed': '{reason}',
};
