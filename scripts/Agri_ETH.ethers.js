const { ethers } = require("ethers");
const assert = require("chai").assert;

describe("Test Smart contracts for Agri food chain traceability on Ethereum", async () => {

  const ProducerJSON = require("../build/contracts/Producer.json");
  const ResourceJSON = require("../build/contracts/Resource.json"); 
 
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");

  // const ownerAccount = "0xb720fa4E8f3088c2290914708034ccDc9665C552";
  // const p1Ac = "0x79a80228D4D6036b2B93F235a04C4CDb0F8b79a0";
  // const p2Ac = "0x4809ee88ec3eA7F547a5c55fAE09588e68089B03";
  // const certAc = "0xe8d5A1D4B11Bb581285e908143c5F5458f4f4F49";

  const ownerKey = Buffer.from("144ec9eb7e4009e61cf87bf7c729b7fe494133d2982f5f8b4f411c875ecb3b97", 'hex');
  const p1Key = Buffer.from("3bbd856e2357827f50195d41f962db36d5f884200068aa00e412bb4b4cbcff05", "hex");
  const p2Key = Buffer.from("71a128262b16d77c4993aeb06813d47f06798837b685c9519dfcdf285d4df080", 'hex');
  const certKey = Buffer.from("6cf723760e7aa01c022206c17af8ea691747941f07f3b7545cbf6f8bbb33d776", 'hex');

  const standardGas = 6000000;
  const myChainId = 1074;

  // const ownerAccount = await provider.getSigner();
  // const p1Ac = await provider.getSigner(1);
  // const p2Ac = await provider.getSigner(2);
  // const certAc = await provider.getSigner(4);
  const ownerAccount = new ethers.Wallet( ownerKey, provider );
  const p1Ac = new ethers.Wallet( p1Key , provider  );
  const p2Ac = new ethers.Wallet( p2Key , provider );
  const certAc = new ethers.Wallet( certKey , provider );

  console.log(ownerAccount);
  console.log(p1Ac);
  console.log(p2Ac);
  console.log(certAc);

  let p1Addr,
      p2Addr,
      res0Addr,
      res1Addr

  // console.log("Create First Producer");
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
  
  it("Read Events from events log", async () => {
    let res0 = new ethers.Contract(res0Addr, ResourceJSON.abi, p1Ac);
    let eventFilter = res0.filters.agriEvent();
    let events = await res0.queryFilter(eventFilter);
    console.log(events);
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