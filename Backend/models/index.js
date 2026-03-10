const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

// Import models
const ReceiptScan = require("./ReceiptScan")(sequelize, DataTypes);
const User = require("./user")(sequelize, DataTypes);
const Transaction = require("./transaction")(sequelize, DataTypes);
const Profile = require("./profile")(sequelize, DataTypes);

const db = {
  sequelize,
  Sequelize,
  ReceiptScan,
  User,
  Transaction,
  Profile
};

// Associations
db.User.hasOne(db.Profile, { foreignKey: "user_id" });
db.Profile.belongsTo(db.User, { foreignKey: "user_id" });

module.exports = db;