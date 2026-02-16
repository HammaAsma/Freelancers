import { DataTypes } from "sequelize";
import db from "../config/db.js";

const TimeEntry = db.define(
  "TimeEntry",
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
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "tasks", key: "id" },
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
    },
    duration: {
      type: DataTypes.INTEGER, // secondes
      allowNull: true,
      validate: { min: 0 },
    },
    is_running: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: "time_entries",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["task_id"] },
      { fields: ["is_running"] },
      { fields: ["start_time"] },
    ],
  }
);

export default TimeEntry;
