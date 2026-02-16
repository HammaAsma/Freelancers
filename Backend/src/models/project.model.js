import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Project = db.define(
  "Project",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "clients", key: "id" },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("planning", "in_progress", "completed", "on_hold"),
      defaultValue: "in_progress",
      allowNull: false,
    },
    billing_type: {
      type: DataTypes.ENUM("hourly", "fixed"),
      allowNull: false,
    },
    hourly_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 },
    },
    fixed_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 },
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date_estimated: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "projects",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["client_id"] },
      { fields: ["status"] },
    ],
  }
);

export default Project;
