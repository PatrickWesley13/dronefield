import type { ContentKey } from './en';

/** Spanish game content. Keys must match `en`; the type checker enforces this. */
export const es: Record<ContentKey, string> = {
  'mission.m1.title': 'Primer vuelo',
  'mission.m1.concept': 'Llamar a una función',
  'mission.m1.briefing.0': 'Tu dron acaba de encenderse. Hace exactamente lo que dice tu código, una línea a la vez.',
  'mission.m1.briefing.1':
    'move("east") vuela una casilla al este. Cada llamada es un paso. Añade más hasta que el dron llegue a la baliza al final del camino.',

  'mission.m2.title': 'Primera cosecha',
  'mission.m2.concept': 'Direcciones y cosecha',
  'mission.m2.briefing.0':
    'Una espiga de trigo madura está en la esquina lejana, x 2, y 2. El dron empieza en x 0, y 0, la esquina suroeste. El norte queda arriba en la pantalla.',
  'mission.m2.briefing.1':
    'Vuela sobre ella y llama a harvest(). Cosechar lleva el cultivo a tu inventario. Usa console.log(getPosX(), getPosY()) para comprobar dónde estás.',

  'mission.m3.title': 'Temporada de siembra',
  'mission.m3.concept': 'Tiempo y crecimiento',
  'mission.m3.briefing.0':
    'El tiempo en la granja se mide en ticks. Moverse cuesta 2 ticks; plantar y cosechar cuestan 1. El trigo necesita 8 ticks para madurar.',
  'mission.m3.briefing.1':
    'plant("wheat") pone una semilla en la tierra. wait(n) deja pasar n ticks. Cultiva tres trigos. Si cosechas demasiado pronto, el cultivo se destruye.',

  'mission.m4.title': 'El bucle',
  'mission.m4.concept': 'Bucles for',
  'mission.m4.briefing.0':
    'Ocho espigas maduras en fila. Podrías escribir harvest() y move("east") ocho veces cada uno, pero un bucle repite el código por ti.',
  'mission.m4.briefing.1':
    'for (let i = 0; i < 3; i++) { … } ejecuta su bloque tres veces mientras i cuenta 0, 1, 2. Cámbialo para limpiar toda la fila.',

  'mission.m5.title': 'Inspección de campo',
  'mission.m5.concept': 'if y condiciones',
  'mission.m5.briefing.0':
    'Esta fila mezcla trigo maduro con plántulas de tomate. Cosechar una plántula la destruye, y esta misión falla si algo se destruye.',
  'mission.m5.briefing.1':
    'getCropGrowth() devuelve 1 cuando el cultivo de abajo está maduro. Envuelve harvest() en un if para que el dron corte solo lo que está listo.',

  'mission.m6.title': 'Navegación inteligente',
  'mission.m6.concept': 'Bucles while y depuración',
  'mission.m6.briefing.0':
    'Rocas y un estanque bloquean el camino hacia la baliza en la esquina noreste. move() devuelve false cuando está bloqueado, y el dron se queda donde está.',
  'mission.m6.briefing.1':
    'Primero pulsa Ejecutar con el código inicial. Se atasca: el dron sigue chocando con una roca y, después de un rato, el juego detiene el programa. Lee la consola y usa canMove(direction) para ir al norte siempre que el este esté bloqueado.',

  'mission.m7.title': 'Rutinas reutilizables',
  'mission.m7.concept': 'Funciones',
  'mission.m7.briefing.0':
    'Una parcela de 4 × 4 vacía. Cuidar cada casilla significa: cosechar si está madura, plantar si está vacía. Escribirlo 16 veces no es forma de cultivar.',
  'mission.m7.briefing.1':
    'Pon la rutina en una función y llámala desde tus bucles. Cuando el dron llegue al borde este, devuélvelo al oeste antes de avanzar al norte.',

  'mission.m8.title': 'Gestión de recursos',
  'mission.m8.concept': 'Inventario y costes',
  'mission.m8.briefing.0':
    'Las zanahorias valen más, pero cada semilla de zanahoria cuesta 2 de trigo, y la bodega de carga solo cabe 10 de cada cultivo.',
  'mission.m8.briefing.1':
    'Empiezas con 4 de trigo. Usa getInventory() y getCost("carrot") para decidir qué plantar, y cultiva trigo siempre que no te alcance para una zanahoria.',

  'mission.m9.title': 'Cultivos mixtos',
  'mission.m9.concept': 'Ramificar según valores',
  'mission.m9.briefing.0':
    'El campo de un vecino está maduro con trigo, zanahorias y tomates. Cosecha cada casilla y vuelve a plantar cada una con el mismo cultivo que tenía.',
  'mission.m9.briefing.1':
    'getCropType() te dice qué hay debajo antes de cortarlo. Las semillas de tomate cuestan 2 zanahorias, así que cosecha antes de gastar.',

  'mission.m10.title': 'Granja autónoma',
  'mission.m10.concept': 'Juntándolo todo',
  'mission.m10.briefing.0':
    'Un campo vacío de 6 × 6 y 3.000 ticks. Construye una cadena de suministro completa: el trigo paga las zanahorias, y las zanahorias pagan los tomates.',
  'mission.m10.briefing.1': 'Regar un cultivo con water() duplica su velocidad de crecimiento. Menos ticks es una mejor puntuación.',

  'objective.beacon': 'Llega a la baliza',
  'objective.beaconEast': 'Llega a la baliza en el extremo este',
  'objective.collect': 'Recoge {count} {crop}',
  'objective.have': 'Ten {count} {crop}',
  'objective.harvest': 'Cosecha {count} cultivos',
  'objective.loop': 'Usa un bucle',
  'objective.function': 'Define y usa una función',
  'objective.nothingDestroyed': 'Deja en pie cada plántula',
  'objective.replanted': 'Vuelve a plantar cada casilla con su cultivo original',
  'objective.ticks': 'Termina en menos de {limit} ticks',

  'failure.destroyed': 'Se destruyó una plántula. Cosecha solo cuando getCropGrowth() === 1.',
  'failure.outOfTime': 'Se acabó el tiempo: la misión permite {limit} ticks.',
  'report.missionFailed': 'Misión fallida',
  'report.notDone': 'Casi',
  'report.missionComplete': 'Misión completada',
  'report.everyMissionComplete': 'Todas las misiones completadas',
  'report.stillToDo': 'Tu programa terminó antes de cumplir todos los objetivos. Pendiente: {items}.',
  'report.newBest': 'Nuevo récord: {ticks} ticks (antes era {previous}).',
  'report.bestSoFar': 'Mejor hasta ahora: {ticks} ticks.',

  'crop.wheat.one': 'trigo',
  'crop.wheat.other': 'trigo',
  'crop.carrot.one': 'zanahoria',
  'crop.carrot.other': 'zanahorias',
  'crop.tomato.one': 'tomate',
  'crop.tomato.other': 'tomates',
  'crop.crystal.one': 'cristal',
  'crop.crystal.other': 'cristales',

  'upgrade.lens.name': 'Lente de madurez',
  'upgrade.lens.description': 'Desbloquea canHarvest(), una comprobación rápida de madurez.',
  'upgrade.rotors.name': 'Rotores turbo',
  'upgrade.rotors.description': 'Moverse en tu granja cuesta 1 tick en vez de 2.',
  'upgrade.field1.name': 'Expansión del campo',
  'upgrade.field1.description': 'Amplía tu granja de 5 × 5 a 7 × 7 casillas.',
  'upgrade.cargo1.name': 'Módulos de carga',
  'upgrade.cargo1.description': 'La carga de la granja guarda 150 de cada cultivo en vez de 50.',
  'upgrade.sensor.name': 'Matriz de sensores',
  'upgrade.sensor.description': 'Desbloquea scan(direction) para inspeccionar la siguiente casilla desde lejos.',
  'upgrade.crystal.name': 'Semillas de cristal',
  'upgrade.crystal.description': 'Desbloquea crystal, un cultivo lento que solo crece al regarse.',
  'upgrade.field2.name': 'Expansión del campo II',
  'upgrade.field2.description': 'Amplía tu granja a 9 × 9 casillas.',
  'upgrade.cargo2.name': 'Módulos de carga II',
  'upgrade.cargo2.description': 'La carga de la granja guarda 500 de cada cultivo.',
  'upgrade.blades.name': 'Cuchillas afiladas',
  'upgrade.blades.description': 'Cada cosecha en tu granja rinde 1 cultivo extra.',

  'log.missionLoaded': 'Misión cargada: {title}. Pulsa Ejecutar cuando estés listo.',
  'log.openFarmLoaded': 'Granja libre cargada. Las cosechas que hagas aquí se guardan.',
  'log.fieldCleared': 'Campo limpiado.',
  'log.fieldReset': 'Campo reiniciado al inicio de la misión.',
  'log.runStarted': 'Ejecución iniciada.',
  'log.runStartedStep': 'Ejecución iniciada en modo paso.',
  'log.missionComplete': 'Misión completada: {title}.',
  'log.missionFailed': 'Misión fallida: {reason}',
  'log.stillToDo': 'Programa terminado, pero la misión aún no está completa. Pendiente: {items}.',
  'log.programFinished': 'Programa terminado.',

  'toast.upgradeInstalled': 'Mejora instalada.',
  'toast.progressReset': 'Progreso reiniciado.',
  'toast.notice': '{notice}',
  'toast.purchaseFailed': '{reason}',
};
