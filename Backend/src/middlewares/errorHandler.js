function errorHandler(err, req, res, next) {
  // Logger l'erreur
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Stack:', err.stack);
  } else {
    // En production, logger seulement le message (sans stack)
    console.error('Error:', {
      message: err.message,
      statusCode: err.statusCode || 500,
      path: req.path,
      method: req.method
    });
  }
  
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  let statusCode = err.statusCode || 500;
  const message = err.message || 'Une erreur est survenue';
  if (message === 'Facture non trouvée' || message === 'Projet non trouvé' || message === 'Tâche non trouvée') statusCode = 404;

  res.status(statusCode).json({
    success: false,
    message,
    // Stack trace seulement en développement
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

export default errorHandler;