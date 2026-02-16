import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Invoice = db.define(
  "Invoice",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
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
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "projects", key: "id" },
    },
    number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    issue_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("draft", "sent", "paid", "overdue"),
      allowNull: false,
      defaultValue: "draft",
    },
    type: {
      type: DataTypes.ENUM("project", "manual"),
      allowNull: false,
      defaultValue: "manual",
    },
    currency: {
      type: DataTypes.ENUM("EUR", "MAD", "USD"),
      defaultValue: "EUR",
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    total_ht: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    total_tva: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    total_ttc: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
  },
  {
    tableName: "invoices",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["client_id"] },
      { fields: ["number"], unique: true },
      { fields: ["status"] },
      { fields: ["issue_date"] },
    ],
  }
);

export default Invoice;
