import { DataTypes } from "sequelize";
import db from "../config/db.js";

const InvoiceItem = db.define(
  "InvoiceItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "invoices", key: "id" },
    },
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "tasks", key: "id" },
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "projects", key: "id" },
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    Nb_heure: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      validate: { min: 0 },
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
  },
  {
    tableName: "invoice_items",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["invoice_id"] },
      { fields: ["task_id"] },
      { fields: ["project_id"] },
    ],
  }
);

export default InvoiceItem;
