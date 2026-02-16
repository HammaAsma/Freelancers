import { Sequelize } from "sequelize";
import ENV from "./index.js";

const db = new Sequelize(ENV.DATABASE, ENV.USER, ENV.PASSWORD, {
  host: ENV.HOST,
  dialect: ENV.DIALECT,
  port: ENV.PORT_DATABASE,
  logging: process.env.NODE_ENV === 'development',
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 3
  }
});

const connection = async () => {
  try {
    console.log("tentative de connection ...");
    await db.authenticate();
    console.log("connexion réussie à MySql");
  } catch (error) {
    console.error(`Error de connexion :`, error.message);
    throw error; // Important : throw pour arrêter l'app si DB inaccessible
  }
};
connection();
export default db;
