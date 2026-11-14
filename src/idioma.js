// 🌍 Los idiomas del juego (español e inglés). Todos los textos que se ven están aquí, con una "llave" (como 'tienda.comprar').
// t('tienda.comprar') devuelve el texto en el idioma elegido. Las {llaves} se reemplazan: t('toast.entro', { nombre: 'Ana' }).
// El robot Traductor del lobby cambia el idioma (y se guarda en este navegador).

export const IDIOMAS = ['es', 'en'];
let actual = 'es';
export const idioma = () => actual;
export function ponerIdioma(i) { if (IDIOMAS.includes(i)) actual = i; return actual; }
export function t(clave, vars = {}) {
  const txt = TEXTOS[actual][clave] ?? TEXTOS.es[clave] ?? clave;
  return txt.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}
// Plural fácil: 1 amigo / 2 amigos ("s" o nada)
export const s = n => (n === 1 ? '' : 's');

export const TEXTOS = {
  es: {
    // Inicio
    'login.usuario': 'Tu usuario', 'login.placeholder': 'el humano', 'login.jugar': 'Jugar',
    'login.ayuda': 'Si ya guardaste con este usuario, sigues donde lo dejaste. Para guardar, pulsa el botón verde <b>GUARDAR</b>.',
    'login.error': 'Escribe un nombre de usuario para jugar.',
    // Botones y avisos
    'ui.guardar': 'GUARDAR', 'ui.guardado': 'CAMBIOS GUARDADOS', 'ui.guia': '🤖 Guía', 'ui.caja': '📦 Caja', 'ui.salir': '📦 Salir', 'ui.armario': '🚪 Armario', 'ui.usar': '✋ Usar',
    'ui.lockHint': 'Haz clic para mirar con el ratón (Esc para soltarlo)', 'ui.cerrar': 'Cerrar',
    'armario.dentro': '🚪 Dentro del armario · {como}', 'armario.salirTouch': 'toca 📦 para salir', 'armario.salirB': 'B para salir', 'aviso.armario': 'meterte en el armario',
    'usar.cerrarPuerta': 'cerrar la puerta', 'usar.abrirPuerta': 'abrir la puerta', 'usar.linterna': 'agarrar una linterna 🔦', 'usar.agarrar': 'agarrar {emoji}',
    'usar.comida': 'servirle comida a Yellow', 'usar.pintarte': 'pintarte 🎨', 'usar.cerrarArmario': 'cerrar el armario', 'usar.abrirArmario': 'abrir el armario', 'usar.traductor': 'cambiar el idioma 🌍',
    // Bot guía
    'guia.quien': '🤖 BOT GUÍA', 'guia.como': '¿Cómo juego?', 'guia.que': '¿Qué tengo que hacer?', 'guia.color': '🎨 Color', 'guia.cerrarAria': 'Cerrar el diálogo del bot guía', 'guia.colorAria': 'Cambiar el color del bot guía',
    'guia.saludo': '¡Hola, {nombre}! Soy tu bot guía 🤖. ', 'guia.estasEn': '📍 Estás en: {sala}. ',
    'guia.comoTeclado': 'Para moverte usa WASD, las flechas izquierda/derecha (o arrastrar el mouse) para mover la cámara, la rueda del ratón para alejarla o acercarla, y ESPACIO para saltar. B = meterte en tu caja o en el armario (y salir) · E = usar (puertas, objetos, la tienda…) · en una escotilla, W sube por la escalera y S baja · V = primera persona · ENTER = abrir o cerrar este diálogo · H = esconderme o llamarme · C = cambiar mi color. Para guardar, pulsa el botón verde GUARDAR.',
    'guia.comoTouch': 'Para moverte usa el círculo de abajo a la izquierda, arrastra el dedo (o el círculo CÁMARA) para mover la cámara, y toca SALTAR para saltar. 📦 Caja te esconde y ✋ Usar abre puertas y agarra cosas. En una escotilla, empuja el círculo hacia arriba para subir por la escalera. El botón 🤖 Guía abre o cierra este diálogo. Para guardar, toca GUARDAR.',
    'guia.queHago': 'En el lobby puedes pintarte en el balde, comprar cajas y caminos, y cambiar el idioma con el robot Traductor. Cuando estés listo, cruza la puerta grande: empieza la noche. Hat te dirá qué buscar: agárralo con E y llévalo al Laboratorio Central. ¡Cuidado con los dragones! Si te ven, métete en tu caja (B) o corre al Hoyo del Pánico o al Inicio: ahí no entran.',
    // Perder la noche
    'perdiste.titulo': '💀 ¡PERDISTE LA NOCHE!', 'perdiste.lobby': '🏠 Volver al lobby', 'perdiste.texto': '¡{nombre} te atrapó! Tienes {monedas} 🪙', 'perdiste.pagar': '🪙 Pagar {costo} y seguir',
    // Balde, tiendas y traductor
    'paleta.titulo': '🎨 Elige tu color', 'tienda.titulo': '🛒 Tienda de cajas', 'tiendaCaminos.titulo': '✨ Tienda de caminos', 'tienda.tienes': 'Tienes {n} 🪙',
    'tienda.puesta': 'Puesta ✓', 'tienda.ponerte': 'Ponértela', 'tienda.comprar': 'Comprar', 'tienda.quitar': 'Quitártelo', 'tienda.puesto': 'Puesto ✓', 'tienda.ponerteCamino': 'Ponértelo',
    'tienda.noAlcanza': 'No te alcanza 🪙', 'tienda.compraste': '¡Compraste: {nombre}! B para ponértela 📦', 'tienda.comprasteCamino': '¡Compraste: {nombre}! Camina para verlo ✨',
    'tienda.fuera': '🛒 ¡Fuera de mi tienda! No tienes suficientes monedas',
    'traductor.titulo': '🌍 Idioma · Language', 'traductor.listo': '🌍 ¡Ahora el juego está en español!',
    // Noches
    'noche.n': 'NOCHE {n}', 'noche.final': 'NOCHE FINAL', 'noche.apagon': ' · APAGÓN', 'noche.llevas': ' · llevas {n}: ¡al {lugar}!', 'noche.completada': '¡NOCHE {n} COMPLETADA!',
    'lobby.cruza': 'cruza la puerta para empezar', 'escapaste': 'ESCAPASTE',
    // Avisos
    'toast.holaDeNuevo': '¡Hola de nuevo, {nombre}!', 'toast.bienvenido': 'Hola, {nombre}. Bienvenido al laboratorio',
    'toast.noGuardar': 'No se pudo guardar: este navegador no deja guardar datos',
    'toast.conectadoAmigos': '¡Conectado! Hay {n} amigo{s} jugando', 'toast.conectadoPrimero': '¡Conectado! Eres el primero en llegar',
    'toast.entro': '{nombre} entró al juego', 'toast.salio': '💥 {nombre} se desconectó', 'toast.nombreUsado': 'Ya hay alguien jugando como "{nombre}". Usa otro nombre.',
    'toast.sinSala': 'No se pudo entrar a la sala: ¿el servidor está encendido? Juegas solo', 'toast.cortado': 'Se cortó la conexión con el servidor',
    'toast.pagaste': '🪙 Pagaste: ¡sigues en la noche! (desde el inicio)', 'toast.perdiste': '💀 Perdiste la noche. Cruza la puerta para intentarlo otra vez',
    'toast.yellowHambre': '🟡 ¡Yellow se despertó con hambre y salió a buscar comida!', 'toast.linterna': '🔦 ¡Agarraste una linterna!',
    'toast.baterias': '🔋 ¡{n} batería{s} conectada{s} a la máquina!', 'toast.entregaste': '{emoji} ¡Entregaste {n}!', 'toast.bonk': '💥 ¡BONK!',
    'toast.compuerta': '📦 ¡Se abrió la compuerta! Entra y saca las cajas de encima de la escotilla',
    'toast.puertaCerro': '🚪 ¡La puerta se cerró detrás de ti! Quedan {n} cajas encima de la escotilla',
    'toast.escotilla': '💥 ¡La escotilla cayó como rampa! Grey viene subiendo la escalera… ¡Baja y escapa por las ventilaciones!',
    'toast.caiste': 'Te caíste del laboratorio: vuelves al inicio', 'dragon.alguien': 'Un dragón',
    // Letreros del mundo
    'letrero.laboratorio': 'LABORATORIO', 'letrero.tiendaCajas': 'TIENDA DE CAJAS', 'letrero.tiendaCaminos': 'TIENDA DE CAMINOS', 'letrero.traductor': 'TRADUCTOR',
    'letrero.keep': 'MANTÉN', 'letrero.calm': 'LA CALMA', 'letrero.food': 'COMIDA', 'letrero.stop': 'ALTO', 'letrero.keepOut1': '¡NO', 'letrero.keepOut2': 'PASAR!', 'letrero.danger': 'PELIGRO', 'letrero.no': 'NO',
    // Hat
    'hat.noche1': 'Hola. No te voy a decir quién soy, pero necesito que encuentres 16 tubos de ensayo que se me cayeron por todas partes.',
    'hat.noche2': 'Ahora necesito que consigas algunos de estos paquetes de comida.',
    'hat.noche3': 'Miren quién decidió salir de su cama. En fin, tienes que encontrar 6 baterías para conectarlas a mi máquina.',
    'hat.noche4': 'Hoy es la noche final. Después de que encuentres las piezas del rompecabezas te diré por qué estás aquí.',
    'hat.noche5': 'Oh, ahora supongo que tienes que encontrar 10 fusibles para encender todo. Toma estas linternas.',
    'hat.inicio': 'Ahora sí, esta es la noche final. Decidí invitarte a la fiesta de despedida.',
    'hat.final': 'Todavía no termino contigo. Las cosas se van a poner mucho más ÉPICAS.',
    // Objetos, cajas y caminos
    'obj.tubo': 'Tubos de ensayo', 'obj.comida': 'Paquetes de comida', 'obj.bateria': 'Baterías', 'obj.pieza': 'Piezas de rompecabezas', 'obj.fusible': 'Fusibles',
    'caja.carton': 'Caja de cartón', 'caja.espacial': 'Caja espacial', 'caja.regalo': 'Caja de Navidad', 'caja.playa': 'Caja mojada', 'caja.piedra': 'Piedra mascota',
    'camino.amarillo': 'Camino amarillo', 'camino.fuego': 'Camino de fuego', 'camino.electrico': 'Camino eléctrico',
    // Lugares
    'sala.testLab': 'Laboratorio de Pruebas', 'sala.spawn': 'Inicio', 'sala.escaleras': 'Escaleras del inicio', 'sala.pasilloNorte': 'Pasillo norte', 'sala.pasilloOeste': 'Pasillo oeste',
    'sala.panico': 'Hoyo del Pánico', 'sala.salon': 'Salón central', 'sala.banos': 'Baños', 'sala.pasilloEste': 'Pasillo este', 'sala.lockers': 'Casilleros', 'sala.centerLab': 'Laboratorio Central',
    'sala.greyCove': 'Guarida de Grey', 'sala.yellowRoom': 'Cuarto de Yellow', 'sala.tunelNorte': 'Túnel norte', 'sala.tunelEste': 'Túnel este', 'sala.tunelCentro': 'Túnel del centro',
    'sala.tunelOeste': 'Túnel oeste', 'sala.tunelSur': 'Túnel sur', 'sala.tunelYellow': 'Túnel a Yellow', 'sala.lobby': 'Lobby',
    'sala.fSpawn': 'Inicio de la fiesta', 'sala.fSalon': 'Salón de la fiesta', 'sala.fRampa': 'La rampa', 'sala.fBloques': 'Cuarto de las cajas', 'sala.fBajo': 'Cuarto de abajo',
    'sala.fPasillo': 'Pasillo de la fiesta', 'sala.fVent1': 'Ventilación', 'sala.fVent2': 'Ventilación', 'sala.fVent3': 'Ventilación final', 'sala.fVentA': 'Ventilación (sin salida)',
    'sala.fVentB': 'Ventilación (sin salida)', 'sala.fVentC': 'Ventilación (sin salida)', 'sala.fSalida': 'Afuera',
    // Mascotas
    'mascotas.titulo': '🥚 Tienda de mascotas', 'mascotas.huevo': 'Huevo misterioso · {precio} 🪙', 'mascotas.abrir': 'Abrir', 'mascotas.salio': '🥚 ¡Te salió: {nombre}!',
    'mascotas.salioRara': '🌟 ¡WOW! ¡Te salió una rara: {nombre}!', 'mascotas.tuyas': 'Tus mascotas', 'mascotas.ninguna': 'Todavía no tienes mascotas: ¡abre un huevo!',
    'mascotas.llevar': 'Llevar', 'mascotas.llevando': 'Contigo ✓', 'mascotas.vender': 'Vender 1 (+{n} 🪙)', 'mascotas.vendiste': '🪙 Vendiste un {nombre} repetido (+{n})',
    'mascotas.probabilidades': 'Puede salir', 'usar.mascotas': 'ver las mascotas 🥚', 'letrero.mascotas': 'MASCOTAS',
    'mascota.ganso': 'Ganso', 'mascota.oso': 'Oso', 'mascota.planta': 'Mini planta', 'mascota.fantasma': 'Fantasmita', 'mascota.miniYellow': 'Mini Yellow', 'mascota.arcoiris': 'Cubo arcoíris',
  },
  en: {
    'login.usuario': 'Your username', 'login.placeholder': 'the human', 'login.jugar': 'Play',
    'login.ayuda': "If you already saved with this username, you continue where you left off. To save, press the green <b>SAVE</b> button.",
    'login.error': 'Type a username to play.',
    'ui.guardar': 'SAVE', 'ui.guardado': 'CHANGES SAVED', 'ui.guia': '🤖 Guide', 'ui.caja': '📦 Box', 'ui.salir': '📦 Get out', 'ui.armario': '🚪 Closet', 'ui.usar': '✋ Use',
    'ui.lockHint': 'Click to look around with the mouse (Esc to let go)', 'ui.cerrar': 'Close',
    'armario.dentro': '🚪 Inside the closet · {como}', 'armario.salirTouch': 'tap 📦 to get out', 'armario.salirB': 'B to get out', 'aviso.armario': 'hide in the closet',
    'usar.cerrarPuerta': 'close the door', 'usar.abrirPuerta': 'open the door', 'usar.linterna': 'grab a flashlight 🔦', 'usar.agarrar': 'grab {emoji}',
    'usar.comida': 'give Yellow some food', 'usar.pintarte': 'paint yourself 🎨', 'usar.cerrarArmario': 'close the closet', 'usar.abrirArmario': 'open the closet', 'usar.traductor': 'change the language 🌍',
    'guia.quien': '🤖 GUIDE BOT', 'guia.como': 'How do I play?', 'guia.que': 'What do I do?', 'guia.color': '🎨 Color', 'guia.cerrarAria': 'Close the guide bot dialog', 'guia.colorAria': "Change the guide bot's color",
    'guia.saludo': "Hi, {nombre}! I'm your guide bot 🤖. ", 'guia.estasEn': "📍 You're in: {sala}. ",
    'guia.comoTeclado': 'Move with WASD, turn the camera with the left/right arrows (or by dragging the mouse), zoom it with the mouse wheel, and jump with SPACE. B = hide in your box or the closet (and get out) · E = use (doors, objects, the shop…) · on a hatch, W climbs the ladder and S goes down · V = first person · ENTER = open or close this dialog · H = hide me or call me · C = change my color. To save, press the green SAVE button.',
    'guia.comoTouch': 'Move with the circle at the bottom left, drag your finger (or the CAMERA circle) to turn the camera, and tap JUMP to jump. 📦 Box hides you and ✋ Use opens doors and grabs things. On a hatch, push the circle up to climb the ladder. The 🤖 Guide button opens or closes this dialog. To save, tap SAVE.',
    'guia.queHago': "In the lobby you can paint yourself at the bucket, buy boxes and trails, and change the language with the Translator robot. When you're ready, go through the big door: the night begins. Hat will tell you what to find: grab it with E and bring it to the Center Lab. Watch out for the dragons! If they see you, hide in your box (B) or run to the Panic Hole or the Spawn: they can't go in there.",
    'perdiste.titulo': '💀 YOU LOST THE NIGHT!', 'perdiste.lobby': '🏠 Back to the lobby', 'perdiste.texto': '{nombre} caught you! You have {monedas} 🪙', 'perdiste.pagar': '🪙 Pay {costo} and keep going',
    'paleta.titulo': '🎨 Pick your color', 'tienda.titulo': '🛒 Box shop', 'tiendaCaminos.titulo': '✨ Trail shop', 'tienda.tienes': 'You have {n} 🪙',
    'tienda.puesta': 'Wearing ✓', 'tienda.ponerte': 'Wear it', 'tienda.comprar': 'Buy', 'tienda.quitar': 'Take it off', 'tienda.puesto': 'On ✓', 'tienda.ponerteCamino': 'Use it',
    'tienda.noAlcanza': 'Not enough coins 🪙', 'tienda.compraste': 'You bought: {nombre}! Press B to wear it 📦', 'tienda.comprasteCamino': 'You bought: {nombre}! Walk to see it ✨',
    'tienda.fuera': "🛒 Get out of my shop! You don't have enough coins",
    'traductor.titulo': '🌍 Idioma · Language', 'traductor.listo': '🌍 The game is now in English!',
    'noche.n': 'NIGHT {n}', 'noche.final': 'FINAL NIGHT', 'noche.apagon': ' · BLACKOUT', 'noche.llevas': ' · carrying {n}: to the {lugar}!', 'noche.completada': 'NIGHT {n} COMPLETE!',
    'lobby.cruza': 'go through the door to start', 'escapaste': 'YOU ESCAPED',
    'toast.holaDeNuevo': 'Welcome back, {nombre}!', 'toast.bienvenido': 'Hi, {nombre}. Welcome to the lab',
    'toast.noGuardar': "Couldn't save: this browser doesn't allow saving data",
    'toast.conectadoAmigos': 'Connected! {n} friend{s} playing', 'toast.conectadoPrimero': "Connected! You're the first one here",
    'toast.entro': '{nombre} joined the game', 'toast.salio': '💥 {nombre} disconnected', 'toast.nombreUsado': 'Someone is already playing as "{nombre}". Use another name.',
    'toast.sinSala': "Couldn't join the room: is the server on? You're playing alone", 'toast.cortado': 'Lost the connection to the server',
    'toast.pagaste': "🪙 You paid: you're still in the night! (from the Spawn)", 'toast.perdiste': '💀 You lost the night. Go through the door to try again',
    'toast.yellowHambre': '🟡 Yellow woke up hungry and went looking for food!', 'toast.linterna': '🔦 You grabbed a flashlight!',
    'toast.baterias': '🔋 {n} batter{ies} connected to the machine!', 'toast.entregaste': '{emoji} You delivered {n}!', 'toast.bonk': '💥 BONK!',
    'toast.compuerta': '📦 The gate opened! Go in and push the boxes off the hatch',
    'toast.puertaCerro': '🚪 The door closed behind you! {n} boxes still on the hatch',
    'toast.escotilla': '💥 The hatch fell like a ramp! Grey is coming up the stairs… Go down and escape through the vents!',
    'toast.caiste': 'You fell out of the lab: back to the Spawn', 'dragon.alguien': 'A dragon',
    'letrero.laboratorio': 'LABORATORY', 'letrero.tiendaCajas': 'BOX SHOP', 'letrero.tiendaCaminos': 'TRAIL SHOP', 'letrero.traductor': 'TRANSLATOR',
    'letrero.keep': 'KEEP', 'letrero.calm': 'CALM', 'letrero.food': 'FOOD', 'letrero.stop': 'STOP', 'letrero.keepOut1': 'KEEP', 'letrero.keepOut2': 'OUT!', 'letrero.danger': 'DANGER', 'letrero.no': 'NO',
    'hat.noche1': "Hello. I'm not telling you who am I, but I'm needing you to find 16 test tubes I dropped all over.",
    'hat.noche2': 'Now I need you to get some of these food packs.',
    'hat.noche3': 'Look who decided to get out of his bed. Anyways, you have to find 6 batteries to connect them on my machine.',
    'hat.noche4': "Today is the final night. After you find the puzzle pieces I'll tell you why are you here.",
    'hat.noche5': 'Oh now I guess you have to find 10 fuses to turn everything on. Take these flashlights.',
    'hat.inicio': "Now this is the final night. I've decided to invite you to the goodbye celebration.",
    'hat.final': "I'm still not done with you. Things are going to get a lot more EPIC.",
    'obj.tubo': 'Test tubes', 'obj.comida': 'Food packs', 'obj.bateria': 'Batteries', 'obj.pieza': 'Puzzle pieces', 'obj.fusible': 'Fuses',
    'caja.carton': 'Cardboard box', 'caja.espacial': 'Space box', 'caja.regalo': 'Christmas box', 'caja.playa': 'Wet box', 'caja.piedra': 'Pet rock',
    'camino.amarillo': 'Yellow trail', 'camino.fuego': 'Fire trail', 'camino.electrico': 'Electric trail',
    'sala.testLab': 'Test Lab', 'sala.spawn': 'Spawn', 'sala.escaleras': 'Spawn stairs', 'sala.pasilloNorte': 'North hall', 'sala.pasilloOeste': 'West hall',
    'sala.panico': 'Panic Hole', 'sala.salon': 'Main hall', 'sala.banos': 'Bathrooms', 'sala.pasilloEste': 'East hall', 'sala.lockers': 'Lockers', 'sala.centerLab': 'Center Lab',
    'sala.greyCove': "Grey's Cove", 'sala.yellowRoom': "Yellow's room", 'sala.tunelNorte': 'North tunnel', 'sala.tunelEste': 'East tunnel', 'sala.tunelCentro': 'Center tunnel',
    'sala.tunelOeste': 'West tunnel', 'sala.tunelSur': 'South tunnel', 'sala.tunelYellow': "Tunnel to Yellow's", 'sala.lobby': 'Lobby',
    'sala.fSpawn': 'Party spawn', 'sala.fSalon': 'Party hall', 'sala.fRampa': 'The ramp', 'sala.fBloques': 'Box room', 'sala.fBajo': 'Room below',
    'sala.fPasillo': 'Party hallway', 'sala.fVent1': 'Vent', 'sala.fVent2': 'Vent', 'sala.fVent3': 'Final vent', 'sala.fVentA': 'Vent (dead end)',
    'sala.fVentB': 'Vent (dead end)', 'sala.fVentC': 'Vent (dead end)', 'sala.fSalida': 'Outside',
    'mascotas.titulo': '🥚 Pet shop', 'mascotas.huevo': 'Mystery egg · {precio} 🪙', 'mascotas.abrir': 'Open', 'mascotas.salio': '🥚 You got: {nombre}!',
    'mascotas.salioRara': '🌟 WOW! You got a rare one: {nombre}!', 'mascotas.tuyas': 'Your pets', 'mascotas.ninguna': "You don't have pets yet: open an egg!",
    'mascotas.llevar': 'Take', 'mascotas.llevando': 'With you ✓', 'mascotas.vender': 'Sell 1 (+{n} 🪙)', 'mascotas.vendiste': '🪙 You sold a duplicate {nombre} (+{n})',
    'mascotas.probabilidades': 'Can hatch', 'usar.mascotas': 'see the pets 🥚', 'letrero.mascotas': 'PETS',
    'mascota.ganso': 'Goose', 'mascota.oso': 'Bear', 'mascota.planta': 'Mini plant', 'mascota.fantasma': 'Little ghost', 'mascota.miniYellow': 'Mini Yellow', 'mascota.arcoiris': 'Rainbow cube',
  },
};
// Inglés: "battery" → "batteries" (por eso 'toast.baterias' usa {ies})
export const ies = n => (n === 1 ? 'y' : 'ies');
