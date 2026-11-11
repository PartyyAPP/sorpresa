// ===== Configuración de la búsqueda =====
// Escondites genéricos (sirven en cualquier casa). Cada pista = un QR (#1, #2, …).
// Tipos nuevos: wordle, atrapa, outfits, calculadora, agita, ar, playlist, final (carrera + candado)
// Tipos del primer kit, por si los quieres usar: zoom, cancion, rasca, test, puzle, linterna, memoria, emoji
window.BUSQUEDA = {
  para: 'Sol',
  pistas: [
    {
      tipo: 'wordle', titulo: 'La palabra secreta',
      texto: 'Adivina la palabra en 6 intentos. Verde: letra en su sitio. Amarillo: está, pero en otro sitio.',
      palabra: 'DUCHA',
      siguiente: { texto: 'Exacto: la ducha. Busca la siguiente tarjeta allí.' },
    },
    {
      tipo: 'atrapa', titulo: 'Atrapa los te quiero',
      texto: 'Mueve la cesta con el dedo. Los te quiero, nene y miamor suman 1. Los joe y ein restan 3. Y si se te cae un te quiero al suelo, resta 1. Llega a 15.',
      objetivo: 15,
      siguiente: { texto: 'La siguiente está en el cajón de los cubiertos.' },
    },
    {
      tipo: 'outfits', titulo: '¿Dónde estábamos?',
      texto: 'Solo tu ropa, sin paisajes ni caras. ¿De qué viaje es cada outfit? Necesitas acertar 5 de 7.',
      minimo: 5,
      rondas: [
        { foto: 'fotos/outfits/hamburgo.jpg', correcta: 'Hamburgo', opciones: ['Hamburgo', 'Japón', 'Cádiz', 'Las Palmas'] },
        { foto: 'fotos/outfits/laponia.jpg', correcta: 'Laponia', opciones: ['Laponia', 'Polonia', 'Nueva York', 'Hamburgo'] },
        { foto: 'fotos/outfits/laspalmas.jpg', correcta: 'Las Palmas', opciones: ['Las Palmas', 'Cádiz', 'Mallorca', 'Japón'] },
        { foto: 'fotos/outfits/nuevayork.jpg', correcta: 'Nueva York', opciones: ['Nueva York', 'Polonia', 'Hamburgo', 'Laponia'] },
        { foto: 'fotos/outfits/japon.jpg', correcta: 'Japón', opciones: ['Japón', 'Cádiz', 'Las Palmas', 'Hamburgo'] },
        { foto: 'fotos/outfits/polonia.jpg', correcta: 'Polonia', opciones: ['Polonia', 'Laponia', 'Nueva York', 'Hamburgo'] },
        { foto: 'fotos/outfits/cadiz.jpg', correcta: 'Cádiz', opciones: ['Cádiz', 'Las Palmas', 'Nerja', 'Mallorca'] },
      ],
      siguiente: { texto: 'Mira debajo de tu almohada.' },
    },
    {
      tipo: 'calculadora', titulo: 'Saca la calculadora',
      texto: 'En siete años de WhatsApp nos hemos escrito 42.107 «te quiero». 23.584 son míos.',
      pregunta: '¿Cuántos «te quiero» más que tú te he dicho yo?',
      respuesta: 5061,
      dato: 'Tú 18.523, yo 23.584. Te saco 5.061 de ventaja 😏',
      siguiente: { texto: 'Abre la nevera. La siguiente pista está fresquita.' },
    },
    {
      tipo: 'agita', titulo: 'Agítame',
      texto: 'Dentro de esta cápsula está tu siguiente destino. Agita el móvil con fuerza para romperla.',
      siguiente: { texto: 'Está en el horno. Tranquila, está apagado 😅' },
    },
    {
      tipo: 'ar', titulo: 'Mira a tu alrededor',
      texto: 'Hay un corazón flotando en esta habitación. Levanta el móvil y gira despacio hasta encontrarlo.',
      siguiente: { texto: 'En el armario, entre las toallas.' },
    },
    {
      tipo: 'playlist', titulo: 'Nuestra playlist',
      texto: 'Te he hecho una lista. Escúchala si quieres, pero el secreto no está en la música…',
      pista: 'Fíjate en la primera letra de cada canción.',
      canciones: [
        { titulo: 'Sugar', artista: 'Maroon 5' },
        { titulo: 'Only Girl (In the World)', artista: 'Rihanna' },
        { titulo: 'Flowers', artista: 'Miley Cyrus' },
        { titulo: 'Adore You', artista: 'Harry Styles' },
      ],
      respuestas: ['sofa', 'el sofa'],
      siguiente: { texto: 'Entre los cojines del sofá está la última tarjeta.' },
    },
  ],
  final: {
    tipo: 'final', titulo: 'La última carrera',
    texto: 'Toca la pantalla lo más rápido que puedas para llegar a la meta. Tienes que batir mi récord.',
    record: 13.0, toques: 60,
    regalo: 'Tienes una sorpresa debajo de la cama 🎁',
    pregunta: 'Para la sorpresa necesitas un código. Es el día que volvimos. ¿Qué día fue?', respuesta: '15/08',
    codigo: '1508',
    carta: '',
    foto: '',
  },
};
