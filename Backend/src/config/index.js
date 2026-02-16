import dotenv from "dotenv";
dotenv.config();

// Validation des variables requises (autorise PASSWORD vide pour MySQL sans mot de passe)
const requiredEnvVars = [
  'PORT',
  'DB_USER',
  'PASSWORD',
  'DATABASE',
  'HOST',
  'DIALECT',
  'PORT_DATABASE',
  'JWT_SECRET'
];

// Considère "manquant" seulement si la variable est undefined (pas si chaîne vide)
const missingVars = requiredEnvVars.filter(
  (varName) => typeof process.env[varName] === 'undefined'
);

if (missingVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:', missingVars.join(', '));
  console.error('💡 Assurez-vous d\'avoir un fichier .env avec toutes les variables requises.');
  process.exit(1);
}

const ENV = {
  PORT: parseInt(process.env.PORT) || 8000,
  HOST: process.env.HOST,
  USER: process.env.DB_USER,
  PASSWORD: process.env.PASSWORD ?? '',
  DATABASE: process.env.DATABASE,
  DIALECT: process.env.DIALECT,
  PORT_DATABASE: parseInt(process.env.PORT_DATABASE) || 3306,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
};

export default ENV;
