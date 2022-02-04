const { ethers } = require("ethers");
const assert = require("chai").assert;
const crypto = require('crypto');
const fs = require('fs');
const Constants = JSON.parse(fs.readFileSync('scripts/constants.json', 'utf8'));

describe("Test Smart contracts for Agri food chain traceability on IOTA", async () => {

  const ProducerJSON = require("../build/contracts/Producer.json");
  const ResourceJSON = require("../build/contracts/Resource.json");

  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

  const p1Key = Buffer.from("88e6e24c646672c22427f39443dae0b18408edb6c88fc266ce8ebee026146240", "hex");
  const p2Key = Buffer.from("847f20cd43c8cd88d1c8f5dec185a084eebd84773eccdddb6e583758e1a5aaa9", 'hex');
  const certKey = Buffer.from("1b42955491c6aad84fd2e23520dc40f4123384be403a690f1de7265628217019", 'hex');

  const ownerAccount = provider.getSigner();
  const p1Ac = new ethers.Wallet(p1Key, provider);
  const p2Ac = new ethers.Wallet(p2Key, provider);
  const certAc = new ethers.Wallet(certKey, provider);

  let p1Addr,
    p2Addr,
    res0Addr,
    res1Addr;
  let msg = "";
  let testVar = [];
  let testGas = [];
  msg += "____IOTA LOG____";
  before("Deploy contracts", async () => {
    let factory = new ethers.ContractFactory(ProducerJSON.abi, ProducerJSON.bytecode, ownerAccount);
    let producer1 = await factory.deploy("one", "one desc", p1Ac.address);
    await producer1.deployTransaction.wait();
    p1Addr = producer1.address;
    let producer2 = await factory.deploy("two", "two desc", p2Ac.address);
    await producer2.deployTransaction.wait();
    p2Addr = producer2.address;
  });

  testVar[0] = it(Constants.test0, async () => {
    let p1 = new ethers.Contract(p1Addr, ProducerJSON.abi, p1Ac);
    let tx = await p1.CreateResource("first resource", "some desc ", "uOM", 100, 1, []);
    let receipt = await tx.wait();
    res0Addr = await p1.GetResource(0);
    testGas[0] = Number(receipt.gasUsed);
    msg +=  "\nCreate 1st Resource\n\tGas Used: "+ Number(receipt.gasUsed);
  });

  testVar[1] = it(Constants.test1, async () => {
    let p1 = new ethers.Contract(p1Addr, ProducerJSON.abi, p1Ac);
    let tx = await p1.CreateResource("first product", "some desc ", "uOM", 100, 1, [res0Addr]);
    let receipt = await tx.wait();
    res1Addr = await p1.GetResource(1);
    testGas[1] = Number(receipt.gasUsed);
    msg +=  "\nCreate 2nd Resource\n\tGas Used: "+ Number(receipt.gasUsed);
  });

  testVar[2] = it(Constants.test2, async () => {
    let param = JSON.stringify({ action: "fertilizing", quantity: "10 liters" });
    let paramIn = "0x" + Buffer.from(param).toString('hex');
    let res0 = new ethers.Contract(res0Addr, ResourceJSON.abi, p1Ac);
    let tx = await res0.AddEvent("first event", paramIn);
    let receipt = await tx.wait();
    let event = await res0.ReadEvent(0);
    let paramOut = Buffer.from(event[3].slice(2), 'hex').toString('utf8');
    testGas[2] = Number(receipt.gasUsed);
    msg +=  "\nAgriEvent from Storage:\n\tblock timestamp: " + Number(event[0])+
            "\n\tregistrar address: " + event[1]+
            "\n\tevent name: " + event[2]+
            "\n\tparameters: " + paramOut+
            "\n\tGas Used: "+ Number(receipt.gasUsed);
  });

  testVar[3] = it(Constants.test3, async () => {
    let res0 = new ethers.Contract(res0Addr, ResourceJSON.abi, p1Ac);
    let tx = await res0.addAuthorized(certAc.address, 3);
    let receipt = await tx.wait();
    testGas[3] = Number(receipt.gasUsed);
    msg +=  "\nAdd authorized account\n\tGas Used: "+ Number(receipt.gasUsed);
  });

  testVar[4] = it(Constants.test4, async() => {
    let res0 = new ethers.Contract(res0Addr, ResourceJSON.abi, certAc);
    let param = JSON.stringify({ action: "certify origins", status: "OK" });
    let paramIn = "0x" + Buffer.from(param).toString('hex');
    let tx = await res0.AddEvent("first event", paramIn);
    let receipt = await tx.wait();
    let event = await res0.ReadEvent(1);
    let paramOut = Buffer.from(event[3].slice(2), 'hex').toString('utf8');
    testGas[4] = Number(receipt.gasUsed);
    msg +=  "\nAdd Event from an external certifier\n\tblock timestamp: " + Number(event[0])+
            "\n\tregistrar address: " + event[1]+
            "\n\tevent name: " + event[2]+
            "\n\tparameters: " + paramOut+
            "\n\tGas Used: "+ Number(receipt.gasUsed);
  });

  testVar[5] = it(Constants.test5, async () => {
    let p1 = new ethers.Contract(p1Addr, ProducerJSON.abi, p1Ac);
    let p2 = new ethers.Contract(p2Addr, ProducerJSON.abi, p2Ac);
    let resAddress = await p1.GetResource(0);
    let resourceP1 = new ethers.Contract(resAddress, ResourceJSON.abi, p1Ac);
    let tx = await p1.ChangeProducer(p2.address, resourceP1.address, 1);
    let receipt = await tx.wait();
    let resourceP2 = new ethers.Contract(resAddress, ResourceJSON.abi, p2Ac);
    assert.equal(p2.address, await resourceP2.owner());
    testGas[5] = Number(receipt.gasUsed);
    msg +=  "\nChange Producer\n\tGas Used: "+ Number(receipt.gasUsed);
  });

  testVar[6] = it(Constants.test6, async () => {
    let transferQuantity = 10;
    let p1 = new ethers.Contract(p1Addr, ProducerJSON.abi, p1Ac);
    let p2 = new ethers.Contract(p2Addr, ProducerJSON.abi, p2Ac);
    let resAddress = await p1.GetResource(1);
    let resourceP1 = new ethers.Contract(resAddress, ResourceJSON.abi, p1Ac);
    let initialQ = await resourceP1.GetQuantity();
    let salt = await crypto.randomBytes(32);
    let newResAddress = await p1.GetClonesAddress(resAddress, salt);
    let tx = await p1.TransferQuantity(p2.address, resourceP1.address, salt, 1, transferQuantity);
    let receipt = await tx.wait();
    let resourceP2 = new ethers.Contract(newResAddress, ResourceJSON.abi, p2Ac);
    assert.equal(Number(initialQ) - transferQuantity, Number(await resourceP1.GetQuantity()));
    assert.equal(transferQuantity, Number(await resourceP2.GetQuantity()));  
    assert.equal(p2.address, await resourceP2.owner());
    assert.equal(p1.address, await resourceP1.owner());
    testGas[6] = Number(receipt.gasUsed);
    msg +=  "\nTransfer Quantity\n\tGas Used: "+ Number(receipt.gasUsed);
  });

  after("Read Events from events log", async () => {
    let res0 = new ethers.Contract(res0Addr, ResourceJSON.abi, p1Ac);
    let eventFilter0 = res0.filters.agriEvent();
    let events0 = await res0.queryFilter(eventFilter0);
    p1 = new ethers.Contract(p1Addr, ProducerJSON.abi, p1Ac);
    let eventFilter1 = p1.filters.ChangeProducerEvent();
    let events1 = await p1.queryFilter(eventFilter1);
    console.log(msg);
    // saveToLog(testVar, testGas);
  }); 
});

let saveToLog = async (testVar, testGas) => {
  const DB = require('arangojs').Database;  
  try {
    let db = new DB({
      url: "http://127.0.0.1:8529",
      databaseName: "AGRI",
      auth: {username: "root", password: "openSesame"}
    });
    let agri = db.collection('agri');
    let count = (await agri.count()).count;
    let doc = {};
    for(i=0; i< testVar.length; i++){
      if(testVar[i].isPassed())
        doc[testVar[i].title] = { 
          duration: testVar[i].duration,
          gas: testGas[i]
        }
    }  
    await agri.save({_key: count.toString(), chaintype: 'iota',tests: doc});
  } catch (err) {
    console.error(err)
  }
}

