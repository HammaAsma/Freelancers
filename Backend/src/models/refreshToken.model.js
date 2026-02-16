import { DataTypes } from "sequelize";
import db from "../config/db.js";

const RefreshToken = db.define(
  "RefreshToken",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
    token: {
      type: DataTypes.STRING,
    },
    expires_at: {
      type: DataTypes.DATE,
    },
    revoked_at: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "refreshToken",
    underscored: true,
    timestamps: true,
  }
);

export default RefreshToken;
