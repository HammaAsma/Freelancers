import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Task = db.define(
  "Task",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "projects", key: "id" },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "todo",
        "in_progress",
        "in_review",
        "completed",
        "on_hold"
      ),
      allowNull: false,
      defaultValue: "todo",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: true,
    },
    estimated_hours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 },
    },
    hours_worked: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      validate: { min: 0 },
    },
    hourly_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 },
    },
    is_billed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "tasks", // ✅ Pluriel standard
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["project_id"] },
      { fields: ["status"] },
      { fields: ["is_billed"] },
      { fields: ["due_date"] },
    ],
  }
);

export default Task;
