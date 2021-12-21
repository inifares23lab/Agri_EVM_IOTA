const Migrations = artifacts.require("Migrations");
const Producer = artifacts.require("Producer");
const Product = artifacts.require("Product");
const Primary = artifacts.require("Primary");


module.exports = function (deployer, networks, accounts ) {
  deployer.deploy(Migrations);
  deployer.deploy(Producer, 'name', 'desc');
  deployer.deploy(Primary, 'priname', 'pridesc');
  deployer.deploy(Product, 'proname', 'prodesc', [] );
};
