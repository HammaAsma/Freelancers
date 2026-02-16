export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`;
    
    // Affiche en couleur selon le statut
    if (res.statusCode >= 500) {
      console.error('\x1b[31m%s\x1b[0m', logMessage); // Rouge pour les erreurs serveur
    } else if (res.statusCode >= 400) {
      console.warn('\x1b[33m%s\x1b[0m', logMessage);  // Jaune pour les erreurs client
    } else {
      console.log('\x1b[32m%s\x1b[0m', logMessage);   // Vert pour les succès
    }
  });

  next();
};
