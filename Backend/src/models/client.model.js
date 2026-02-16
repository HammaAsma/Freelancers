import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Client = db.define(
  "Client",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      IsIn: {
        args: [["company", "individual"]],
        msg: "type doit ",
      },
    },
    contact_name: {
      type: DataTypes.STRING,
    },
    contact_email: {
      type: DataTypes.STRING,
    },
    contact_phone: {
      type: DataTypes.STRING,
    },
    billing_address: {
      type: DataTypes.TEXT,
    },
    note: {
      type: DataTypes.TEXT,
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "clients",
    underscored: true,
    timestamps: true,
  }
);

export default Client;
