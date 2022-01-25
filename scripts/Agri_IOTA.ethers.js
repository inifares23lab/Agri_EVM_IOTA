const { ethers } = require("ethers");
const assert = require("chai").assert;

describe("Test Smart contracts for Agri food chain traceability on IOTA", async () => {

  const ProducerJSON = require("../build/contracts/Producer.json");
  const ResourceJSON = require("../build/contracts/Resource.json"); 
 
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

  // const ownerAccount = "0xF5DcAa8A14732F4E7911C368B5909FA0a4065231";
  // const p1Ac = "0xc8a0b5165885D6f7FA0CB4e1c9e11C44067EACA0";
  // const p2Ac = "0x91f548C5e51EE6AE4671197D57914Be792A551d2";
  // const certAc = "0x323d67A43845022791138fdefe5C8Ccc0Db90dD7";

  // const ownerKey = Buffer.from("d43a954287c8f63341d6068219a22d42bab160be06336b76aae78cd28f68198e", 'hex');
  const p1Key = Buffer.from("88e6e24c646672c22427f39443dae0b18408edb6c88fc266ce8ebee026146240", "hex");
  const p2Key = Buffer.from("847f20cd43c8cd88d1c8f5dec185a084eebd84773eccdddb6e583758e1a5aaa9", 'hex');
  const certKey = Buffer.from("1b42955491c6aad84fd2e23520dc40f4123384be403a690f1de7265628217019", 'hex');

  const standardGas = 6000000;
  const myChainId = 1074;

  const ownerAccount = provider.getSigner();
  const p1Ac = new ethers.Wallet( p1Key , provider  );
  const p2Ac = new ethers.Wallet( p2Key , provider );
  const certAc = new ethers.Wallet( certKey , provider );

  let p1Addr,
      p2Addr,
      res0Addr,
      res1Addr

  it("Deploy contracts", async () => {
    console.log("Create First Producer");
    let factory = new ethers.ContractFactory( ProducerJSON.abi , ProducerJSON.bytecode, ownerAccount);
    let producer1 = await factory.deploy("one", "one desc", p1Ac.address);      
    await producer1.deployTransaction.wait();
    p1Addr = producer1.address;
    console.log("Create Second Producer");
    let producer2 = await factory.deploy("two", "two desc", p2Ac.address);
    await producer2.deployTransaction.wait();
    p2Addr = producer2.address;
  });


  it("create first resource", async () => {
    console.log("Create First resource from first producer");
    let p1 = new ethers.Contract(p1Addr, ProducerJSON.abi, p1Ac);
    let tx = await p1.CreateResource("first resource", "some desc ", "uOM", 100, 1, []);
    let receipt = await tx.wait();
    res0Addr = await p1.GetResource(0);
  });

  it("create second resource", async () => {
    console.log("Create Second resource from first producer");
    let p1 = new ethers.Contract(p1Addr, ProducerJSON.abi, p1Ac);
    let tx = await p1.CreateResource("first product", "some desc ", "uOM", 100, 1, [res0Addr]);
    let receipt = await tx.wait();
    res1Addr = await p1.GetResource(1);
  });

  it("Get producers and resources names", async () => {
    let p1 = new ethers.Contract(p1Addr, ProducerJSON.abi, provider);
    let p2 = new ethers.Contract(p2Addr, ProducerJSON.abi, provider);
    let res0 = new ethers.Contract(res0Addr, ResourceJSON.abi, provider);
    let res1 = new ethers.Contract(res1Addr, ResourceJSON.abi, provider);
    console.log(await p1.GetName());
    console.log(await p2.GetName());
    console.log(await res0.GetName());
    console.log(await res1.GetName());
  });

  it("Add and read event from storage" , async () => {
    let param = JSON.stringify({ action: "fertilizing", quantity: "10 liters" });
    let paramIn = "0x" + Buffer.from(param).toString('hex');
    let res0 = new ethers.Contract(res0Addr, ResourceJSON.abi, p1Ac);
    let tx = await res0.AddEvent("first event", paramIn);
    let receipt = tx.wait();
    let event = await res0.ReadEvent(0);
    let paramOut = Buffer.from(event[3].slice(2), 'hex').toString('utf8');
    console.log("block timestamp: " + Number(event[0]));
    console.log("registrar address: " + event[1]);
    console.log("event name: " + event[2]);
    console.log("parameters: " + paramOut);
  });

  it("Add external certifier to authorized accounts", async () => {
    let res0 = new ethers.Contract(res0Addr, ResourceJSON.abi, p1Ac);
    let tx = await res0.addAuthorized(certAc.address, 3);
    let receipt = tx.wait();
  });

  it("Event from external certifier", async() => {
    let res0 = new ethers.Contract(res0Addr, ResourceJSON.abi, certAc);
    let param = JSON.stringify({ action: "certify origins", status: "OK" });
    let paramIn = "0x" + Buffer.from(param).toString('hex');
    let tx = await res0.AddEvent("first event", paramIn);
    let receipt = tx.wait();
    let event = await res0.ReadEvent(1);
    let paramOut = Buffer.from(event[3].slice(2), 'hex').toString('utf8');
    console.log("block timestamp: " + Number(event[0]));
    console.log("registrar address: " + event[1]);
    console.log("event name: " + event[2]);
    console.log("parameters: " + paramOut);
  });

  it("Read Events from events log", async () => {
    let res0 = new ethers.Contract(res0Addr, ResourceJSON.abi, p1Ac);
    let eventFilter = res0.filters.agriEvent();
    let events = await res0.queryFilter(eventFilter);
    console.log(events);
  });

  it("-----transfer resource from one producer to another-----", async () => {
    let p1 = new ethers.Contract(p1Addr, ProducerJSON.abi, p1Ac);
    let p2 = new ethers.Contract(p2Addr, ProducerJSON.abi, p2Ac);
    let resAddress = await p1.GetResource(0);
    let resourceP1 = new ethers.Contract(resAddress, ResourceJSON.abi, p1Ac);
    console.log("read initial quantity");
    let initialQ = await resourceP1.GetQuantity();

    console.log("change producer");
    let tx0 = await p1.ChangeProducer(p2.address, resourceP1.address, 1);
    tx0.wait();

    console.log("add resource to target producer's storage");
    let tx1 = await p2.AddToResources(resAddress);
    tx1.wait();

    console.log("modify quantity from target producer");
    let resourceP2 = new ethers.Contract(resAddress, ResourceJSON.abi, p2Ac);
    let tx2 = await resourceP2.SetQuantity(Number(initialQ) + 10);
    tx2.wait();

    console.log("read new quantity");
    let newQ = await resourceP2.GetQuantity();

    console.log("assert the expected quantity is correct");
    assert.equal(Number(initialQ) + 10, Number(newQ));

    console.log("assert the expected owner is correct");
    assert.equal(p2.address, await resourceP2.owner());
  });
  
});