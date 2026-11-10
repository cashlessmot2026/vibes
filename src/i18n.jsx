import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export const LANGS = [
  { code: 'es', label: 'Español', flag: '🇨🇴' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' }
]
export const TRANSLATION_LANGS = LANGS.filter((l) => l.code !== 'es')

const T = {
  es: {
    heroTitle1: 'Tu opinión', heroTitle2: 'nos impulsa',
    heroText: 'Ayúdanos a mejorar completando esta breve encuesta sobre tu experiencia en San Andrés. Solo toma 1 minuto.',
    start: 'Comenzar encuesta', scan: 'Escanear QR / NFC', install: 'Instalar app',
    heroFoot: '¡Gracias por ser parte de nuestra aventura!', servedBy: 'Te atendió',
    notOurs: 'Ese código no es de San Andrés Vibes',
    iosInstall: 'En iPhone: toca Compartir y luego “Agregar a inicio”.',
    scanTitle: 'Escanear QR o NFC', scanAim: 'Apunta la cámara trasera al código QR',
    nfcHint: 'o acerca tu teléfono al TAG NFC', nfcIos: 'En iPhone: cierra esta ventana y acerca la parte superior del teléfono al TAG NFC.',
    camDenied: 'Permite el acceso a la cámara para escanear el código.',
    camFail: 'No se pudo abrir la cámara. Usa la cámara de tu teléfono para escanear el QR.',
    close: 'Cerrar', home: 'Inicio', language: 'Idioma',
    loading: 'Cargando encuesta…', loadError: 'No pudimos cargar la encuesta. Revisa tu conexión e inténtalo de nuevo.',
    retry: 'Reintentar', noQuestions: 'No hay preguntas activas por ahora.', goBack: 'Volver',
    back: 'Atrás', next: 'Siguiente', skip: 'Omitir', send: 'Enviar encuesta', sending: 'Enviando…',
    sendError: 'No se pudo enviar la encuesta. Inténtalo de nuevo.',
    yes: 'Sí', no: 'No', textPlaceholder: 'Cuéntanos más sobre tu experiencia…',
    tapStar: 'Toca una estrella', ratings: ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'],
    thanks: '¡Gracias!', thanksText1: 'Tu opinión es muy importante para nosotros.',
    thanksText2: 'Seguiremos mejorando para ofrecerte las mejores experiencias en San Andrés.',
    queued: 'Estás sin conexión: tu encuesta quedó guardada y se enviará automáticamente.',
    reviewAsk: '¿Nos regalas una reseña? ⭐', reviewAsk2: 'Cuéntale al mundo tu experiencia',
    reviewSub: 'Solo toma unos segundos y nos ayuda muchísimo.',
    google: 'Reseña en Google', googleSub: 'Califícanos en Google Maps',
    trip: 'Reseña en Tripadvisor', tripSub: 'Comparte tu opinión con otros viajeros',
    bye: '¡Hasta la próxima aventura!', backHome: 'Volver al inicio'
  },
  en: {
    heroTitle1: 'Your opinion', heroTitle2: 'drives us',
    heroText: 'Help us improve by completing this short survey about your experience in San Andrés. It only takes 1 minute.',
    start: 'Start survey', scan: 'Scan QR / NFC', install: 'Install app',
    heroFoot: 'Thank you for being part of our adventure!', servedBy: 'Served by',
    notOurs: 'That code is not from San Andrés Vibes',
    iosInstall: 'On iPhone: tap Share, then “Add to Home Screen”.',
    scanTitle: 'Scan QR or NFC', scanAim: 'Point the rear camera at the QR code',
    nfcHint: 'or hold your phone near the NFC tag', nfcIos: 'On iPhone: close this window and hold the top of your phone near the NFC tag.',
    camDenied: 'Allow camera access to scan the code.',
    camFail: 'Could not open the camera. Use your phone’s camera app to scan the QR code.',
    close: 'Close', home: 'Home', language: 'Language',
    loading: 'Loading survey…', loadError: 'We couldn’t load the survey. Check your connection and try again.',
    retry: 'Retry', noQuestions: 'There are no active questions right now.', goBack: 'Go back',
    back: 'Back', next: 'Next', skip: 'Skip', send: 'Submit survey', sending: 'Sending…',
    sendError: 'The survey could not be sent. Please try again.',
    yes: 'Yes', no: 'No', textPlaceholder: 'Tell us more about your experience…',
    tapStar: 'Tap a star', ratings: ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'],
    thanks: 'Thank you!', thanksText1: 'Your opinion is very important to us.',
    thanksText2: 'We will keep improving to offer you the best experiences in San Andrés.',
    queued: 'You are offline: your survey was saved and will be sent automatically.',
    reviewAsk: 'Would you leave us a review? ⭐', reviewAsk2: 'Tell the world about your experience',
    reviewSub: 'It only takes a few seconds and helps us a lot.',
    google: 'Review on Google', googleSub: 'Rate us on Google Maps',
    trip: 'Review on Tripadvisor', tripSub: 'Share your opinion with other travelers',
    bye: 'See you on the next adventure!', backHome: 'Back to start'
  },
  fr: {
    heroTitle1: 'Votre avis', heroTitle2: 'nous fait avancer',
    heroText: 'Aidez-nous à nous améliorer en répondant à ce court questionnaire sur votre expérience à San Andrés. Cela ne prend qu’une minute.',
    start: 'Commencer', scan: 'Scanner QR / NFC', install: 'Installer l’app',
    heroFoot: 'Merci de faire partie de notre aventure !', servedBy: 'Vous avez été accueilli par',
    notOurs: 'Ce code n’appartient pas à San Andrés Vibes',
    iosInstall: 'Sur iPhone : touchez Partager, puis « Sur l’écran d’accueil ».',
    scanTitle: 'Scanner QR ou NFC', scanAim: 'Dirigez la caméra arrière vers le code QR',
    nfcHint: 'ou approchez votre téléphone du tag NFC', nfcIos: 'Sur iPhone : fermez cette fenêtre et approchez le haut du téléphone du tag NFC.',
    camDenied: 'Autorisez l’accès à la caméra pour scanner le code.',
    camFail: 'Impossible d’ouvrir la caméra. Utilisez l’appareil photo de votre téléphone pour scanner le QR.',
    close: 'Fermer', home: 'Accueil', language: 'Langue',
    loading: 'Chargement du questionnaire…', loadError: 'Impossible de charger le questionnaire. Vérifiez votre connexion et réessayez.',
    retry: 'Réessayer', noQuestions: 'Aucune question active pour le moment.', goBack: 'Retour',
    back: 'Retour', next: 'Suivant', skip: 'Passer', send: 'Envoyer', sending: 'Envoi…',
    sendError: 'Le questionnaire n’a pas pu être envoyé. Veuillez réessayer.',
    yes: 'Oui', no: 'Non', textPlaceholder: 'Parlez-nous de votre expérience…',
    tapStar: 'Touchez une étoile', ratings: ['', 'Mauvais', 'Moyen', 'Bien', 'Très bien', 'Excellent'],
    thanks: 'Merci !', thanksText1: 'Votre avis compte beaucoup pour nous.',
    thanksText2: 'Nous continuerons à nous améliorer pour vous offrir les meilleures expériences à San Andrés.',
    queued: 'Vous êtes hors ligne : votre questionnaire est enregistré et sera envoyé automatiquement.',
    reviewAsk: 'Vous nous laissez un avis ? ⭐', reviewAsk2: 'Partagez votre expérience',
    reviewSub: 'Cela ne prend que quelques secondes et nous aide énormément.',
    google: 'Avis sur Google', googleSub: 'Notez-nous sur Google Maps',
    trip: 'Avis sur Tripadvisor', tripSub: 'Partagez votre avis avec d’autres voyageurs',
    bye: 'À la prochaine aventure !', backHome: 'Retour à l’accueil'
  },
  it: {
    heroTitle1: 'La tua opinione', heroTitle2: 'ci dà la spinta',
    heroText: 'Aiutaci a migliorare completando questo breve sondaggio sulla tua esperienza a San Andrés. Richiede solo 1 minuto.',
    start: 'Inizia il sondaggio', scan: 'Scansiona QR / NFC', install: 'Installa l’app',
    heroFoot: 'Grazie per far parte della nostra avventura!', servedBy: 'Ti ha assistito',
    notOurs: 'Questo codice non è di San Andrés Vibes',
    iosInstall: 'Su iPhone: tocca Condividi e poi “Aggiungi alla schermata Home”.',
    scanTitle: 'Scansiona QR o NFC', scanAim: 'Punta la fotocamera posteriore sul codice QR',
    nfcHint: 'oppure avvicina il telefono al tag NFC', nfcIos: 'Su iPhone: chiudi questa finestra e avvicina la parte superiore del telefono al tag NFC.',
    camDenied: 'Consenti l’accesso alla fotocamera per scansionare il codice.',
    camFail: 'Impossibile aprire la fotocamera. Usa la fotocamera del telefono per scansionare il QR.',
    close: 'Chiudi', home: 'Home', language: 'Lingua',
    loading: 'Caricamento del sondaggio…', loadError: 'Non è stato possibile caricare il sondaggio. Controlla la connessione e riprova.',
    retry: 'Riprova', noQuestions: 'Al momento non ci sono domande attive.', goBack: 'Indietro',
    back: 'Indietro', next: 'Avanti', skip: 'Salta', send: 'Invia sondaggio', sending: 'Invio…',
    sendError: 'Non è stato possibile inviare il sondaggio. Riprova.',
    yes: 'Sì', no: 'No', textPlaceholder: 'Raccontaci di più sulla tua esperienza…',
    tapStar: 'Tocca una stella', ratings: ['', 'Scarso', 'Discreto', 'Buono', 'Molto buono', 'Eccellente'],
    thanks: 'Grazie!', thanksText1: 'La tua opinione è molto importante per noi.',
    thanksText2: 'Continueremo a migliorare per offrirti le migliori esperienze a San Andrés.',
    queued: 'Sei offline: il sondaggio è stato salvato e verrà inviato automaticamente.',
    reviewAsk: 'Ci lasci una recensione? ⭐', reviewAsk2: 'Racconta al mondo la tua esperienza',
    reviewSub: 'Richiede solo pochi secondi e ci aiuta moltissimo.',
    google: 'Recensione su Google', googleSub: 'Valutaci su Google Maps',
    trip: 'Recensione su Tripadvisor', tripSub: 'Condividi la tua opinione con altri viaggiatori',
    bye: 'Alla prossima avventura!', backHome: 'Torna all’inizio'
  },
  de: {
    heroTitle1: 'Ihre Meinung', heroTitle2: 'treibt uns an',
    heroText: 'Helfen Sie uns, besser zu werden, und beantworten Sie diese kurze Umfrage zu Ihrem Erlebnis auf San Andrés. Es dauert nur 1 Minute.',
    start: 'Umfrage starten', scan: 'QR / NFC scannen', install: 'App installieren',
    heroFoot: 'Danke, dass Sie Teil unseres Abenteuers sind!', servedBy: 'Betreut von',
    notOurs: 'Dieser Code gehört nicht zu San Andrés Vibes',
    iosInstall: 'Auf dem iPhone: Tippen Sie auf Teilen und dann auf „Zum Home-Bildschirm“.',
    scanTitle: 'QR oder NFC scannen', scanAim: 'Richten Sie die Rückkamera auf den QR-Code',
    nfcHint: 'oder halten Sie Ihr Telefon an den NFC-Tag', nfcIos: 'Auf dem iPhone: Schließen Sie dieses Fenster und halten Sie die Oberseite des Telefons an den NFC-Tag.',
    camDenied: 'Erlauben Sie den Kamerazugriff, um den Code zu scannen.',
    camFail: 'Die Kamera konnte nicht geöffnet werden. Scannen Sie den QR-Code mit der Kamera-App Ihres Telefons.',
    close: 'Schließen', home: 'Start', language: 'Sprache',
    loading: 'Umfrage wird geladen…', loadError: 'Die Umfrage konnte nicht geladen werden. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    retry: 'Erneut versuchen', noQuestions: 'Derzeit gibt es keine aktiven Fragen.', goBack: 'Zurück',
    back: 'Zurück', next: 'Weiter', skip: 'Überspringen', send: 'Umfrage senden', sending: 'Wird gesendet…',
    sendError: 'Die Umfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
    yes: 'Ja', no: 'Nein', textPlaceholder: 'Erzählen Sie uns mehr über Ihr Erlebnis…',
    tapStar: 'Tippen Sie auf einen Stern', ratings: ['', 'Schlecht', 'Mittelmäßig', 'Gut', 'Sehr gut', 'Ausgezeichnet'],
    thanks: 'Danke!', thanksText1: 'Ihre Meinung ist uns sehr wichtig.',
    thanksText2: 'Wir werden uns weiter verbessern, um Ihnen die besten Erlebnisse auf San Andrés zu bieten.',
    queued: 'Sie sind offline: Ihre Umfrage wurde gespeichert und wird automatisch gesendet.',
    reviewAsk: 'Schenken Sie uns eine Bewertung? ⭐', reviewAsk2: 'Erzählen Sie der Welt von Ihrem Erlebnis',
    reviewSub: 'Es dauert nur wenige Sekunden und hilft uns sehr.',
    google: 'Bewertung auf Google', googleSub: 'Bewerten Sie uns auf Google Maps',
    trip: 'Bewertung auf Tripadvisor', tripSub: 'Teilen Sie Ihre Meinung mit anderen Reisenden',
    bye: 'Bis zum nächsten Abenteuer!', backHome: 'Zurück zum Start'
  },
  pt: {
    heroTitle1: 'Sua opinião', heroTitle2: 'nos impulsiona',
    heroText: 'Ajude-nos a melhorar respondendo a esta breve pesquisa sobre sua experiência em San Andrés. Leva só 1 minuto.',
    start: 'Começar pesquisa', scan: 'Escanear QR / NFC', install: 'Instalar app',
    heroFoot: 'Obrigado por fazer parte da nossa aventura!', servedBy: 'Você foi atendido por',
    notOurs: 'Esse código não é da San Andrés Vibes',
    iosInstall: 'No iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”.',
    scanTitle: 'Escanear QR ou NFC', scanAim: 'Aponte a câmera traseira para o código QR',
    nfcHint: 'ou aproxime o celular da tag NFC', nfcIos: 'No iPhone: feche esta janela e aproxime a parte de cima do celular da tag NFC.',
    camDenied: 'Permita o acesso à câmera para escanear o código.',
    camFail: 'Não foi possível abrir a câmera. Use a câmera do seu celular para escanear o QR.',
    close: 'Fechar', home: 'Início', language: 'Idioma',
    loading: 'Carregando pesquisa…', loadError: 'Não conseguimos carregar a pesquisa. Verifique sua conexão e tente novamente.',
    retry: 'Tentar novamente', noQuestions: 'Não há perguntas ativas no momento.', goBack: 'Voltar',
    back: 'Voltar', next: 'Próximo', skip: 'Pular', send: 'Enviar pesquisa', sending: 'Enviando…',
    sendError: 'Não foi possível enviar a pesquisa. Tente novamente.',
    yes: 'Sim', no: 'Não', textPlaceholder: 'Conte-nos mais sobre sua experiência…',
    tapStar: 'Toque em uma estrela', ratings: ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'],
    thanks: 'Obrigado!', thanksText1: 'Sua opinião é muito importante para nós.',
    thanksText2: 'Vamos continuar melhorando para oferecer as melhores experiências em San Andrés.',
    queued: 'Você está offline: sua pesquisa foi salva e será enviada automaticamente.',
    reviewAsk: 'Pode nos deixar uma avaliação? ⭐', reviewAsk2: 'Conte ao mundo sua experiência',
    reviewSub: 'Leva só alguns segundos e nos ajuda muito.',
    google: 'Avaliar no Google', googleSub: 'Avalie-nos no Google Maps',
    trip: 'Avaliar no Tripadvisor', tripSub: 'Compartilhe sua opinião com outros viajantes',
    bye: 'Até a próxima aventura!', backHome: 'Voltar ao início'
  }
}

const KEY = 'sav-lang'
function initialLang() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && T[saved]) return saved
  } catch { /* noop */ }
  const nav = (navigator.languages || [navigator.language || 'es']).map((l) => l.slice(0, 2).toLowerCase())
  return nav.find((l) => T[l]) || 'es'
}

const Ctx = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const setLang = useCallback((l) => {
    setLangState(l)
    try { localStorage.setItem(KEY, l) } catch { /* noop */ }
  }, [])
  const value = useMemo(() => {
    const dict = T[lang] || T.es
    const t = (k) => dict[k] ?? T.es[k] ?? k
    // Traduce una pregunta creada por el admin (si tiene traducción para el idioma)
    const tq = (q) => {
      const tr = (lang !== 'es' && q.translations?.[lang]) || {}
      const opts = Array.isArray(q.options) ? q.options : []
      return {
        title: tr.title?.trim() || q.title,
        subtitle: tr.subtitle?.trim() || q.subtitle,
        option: (o) => {
          const i = opts.indexOf(o)
          return (i >= 0 && tr.options?.[i]?.trim()) || o
        }
      }
    }
    return { lang, setLang, t, tq }
  }, [lang, setLang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)
