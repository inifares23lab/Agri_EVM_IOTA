const Migrations = artifacts.require("Migrations");

module.exports = async function (deployer, networks, accounts ) {
  deployer.deploy(Migrations);
};

// const Admin = artifacts.require("Admin");
// const Producer = artifacts.require("Producer");
// const Product = artifacts.require("Product");
// const Primary = artifacts.require("Primary");


// module.exports = async function (deployer, networks, accounts ) {
// //   await deployer.deploy(Admin);
//    await deployer.deploy(Producer,'','');
//    await deployer.deploy(Primary,'','');
//    await deployer.deploy(Product,'','',[]);
// };