const { Sequelize, DataTypes } = require("sequelize");
const config = require("../config/database");

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: "mysql",
    logging: false,
  }
);

// Import models
const ReceiptScan = require("./ReceiptScan")(sequelize, DataTypes);
const User = require("./user")(sequelize, DataTypes);
const Transaction = require("./transaction")(sequelize, DataTypes);
const Profile = require("./profile")(sequelize, DataTypes);


// Collect models
const db = {
  sequelize,
  Sequelize,
  ReceiptScan,
  User,
  Transaction,
  Profile
};


// Associations (after db is defined)
db.User.hasOne(db.Profile, { foreignKey: "user_id" });
db.Profile.belongsTo(db.User, { foreignKey: "user_id" });

module.exports = db;