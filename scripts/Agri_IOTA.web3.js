const Web3 = require("web3");
const Tx = require('ethereumjs-tx');
const assert = require("chai").assert;
 
(async () => {

  const ProducerJSON = require("../build/contracts/Producer.json");
  const ResourceJSON = require("../build/contracts/Resource.json"); 
 
  const provider = "http://127.0.0.1:8545";

  const ownerAccount = "0xF5DcAa8A14732F4E7911C368B5909FA0a4065231";
  const p1Ac = "0xc8a0b5165885D6f7FA0CB4e1c9e11C44067EACA0";
  const p2Ac = "0x91f548C5e51EE6AE4671197D57914Be792A551d2";
  const certAc = "0x323d67A43845022791138fdefe5C8Ccc0Db90dD7";
  
  const ownerKey = Buffer.from("d43a954287c8f63341d6068219a22d42bab160be06336b76aae78cd28f68198e", 'hex');
  const p1Key = Buffer.from("88e6e24c646672c22427f39443dae0b18408edb6c88fc266ce8ebee026146240", "hex");
  const p2Key = Buffer.from("847f20cd43c8cd88d1c8f5dec185a084eebd84773eccdddb6e583758e1a5aaa9", 'hex');
  const certKey = Buffer.from("1b42955491c6aad84fd2e23520dc40f4123384be403a690f1de7265628217019", 'hex');

  const standardGas = 6000000;
  const myChainId = 1074;

  const web3 = await new Web3(provider);

  let tx,
      p1,
      p2,
      res0,
      res1;

  console.log("Create First Producer");
  p1 = await new web3.eth.Contract(ProducerJSON.abi)
                        .deploy({ data: ProducerJSON.bytecode,
                                  arguments: ["one", "one desc", p1Ac] })
                        .send({ from: ownerAccount,
                                gas: standardGas });
  
  console.log("Create Second Producer");
  p2 = await new web3.eth.Contract(ProducerJSON.abi)
                        .deploy({ data: ProducerJSON.bytecode,
                                  arguments: ["two", "two desc", p2Ac] })
                        .send({ from: ownerAccount,
                                gas: standardGas });
  
  console.log("Create First resource from first producer");
  //RAW TRANSCTION
  let encodedMethod = await p1.methods.CreateResource("first resource", "some desc ", "uOM", 100, 1, []).encodeABI();
  tx = new Tx.Transaction({ to: p1._address,
                                  gas: standardGas,
                                  data : encodedMethod },{chain: myChainId});
  tx.sign(p1Key);
  await web3.eth.sendSignedTransaction("0x" + tx.serialize().toString('hex'));
     

  let res0Address = await p1.methods.GetResource(0)
                                    .call();
  res0 = await new web3.eth.Contract(ResourceJSON.abi, res0Address);
  
  console.log("Create Second resource from first producer");
  await p1.methods.CreateResource("first product", "some desc ", "uOM", 100, 1, [res0._address])
                  .send({from: p1Ac, gas: standardGas});
  let res1Address = await p1.methods.GetResource(1)
                                    .call();
  res1 = await new web3.eth.Contract(ResourceJSON.abi, res1Address);


  console.log("get producers and resources names");
  console.log(await p1.methods.GetName()
                              .call());
  console.log(await p2.methods.GetName()
                              .call());
  console.log(await res0.methods.GetName()
                                .call());
  console.log(await res1.methods.GetName()
                                .call());
  

  console.log("add event");
  let param = JSON.stringify({ action: "fertilizing", quantity: "10 liters" });
  let paramIn = "0x" + Buffer.from(param)
                            .toString('hex');
  await res0.methods.AddEvent("first event", paramIn)
                    .send({from: p1Ac, gas: standardGas});
  
  console.log("read event");  
  let event1 = await res0.methods.ReadEvent(0)
                                .call();
  let paramOut = Buffer.from(event1[3].slice(2), 'hex')
                      .toString('utf8');
  assert.equal(paramOut, param);
    
  
  console.log("add event from external certifier");
  await res0.methods.addAuthorized(certAc, 3)
                    .send({from : p1Ac, gas: standardGas});
  let param2 = JSON.stringify({ action: "certify origins", status: "OK" });
  let paramIn2 = "0x" + Buffer.from(param2)
                              .toString('hex');
  await res0.methods.AddEvent("first event", paramIn2)
                    .send({from: certAc, gas: standardGas});

  console.log("read certifing event");  
  let event2 = await res0.methods.ReadEvent(1)
                                .call();
  let paramOut2 = Buffer.from(event2[3].slice(2), 'hex')
                        .toString('utf8');
  assert.equal(paramOut2, param2);

  console.log("-----transfer resource from one producer to another-----");
  console.log("retrieve resource");
  let resAddress = await p1.methods.GetResource(0)
                                  .call();
  let resource = await new web3.eth.Contract(ResourceJSON.abi, resAddress);
 
  console.log("read initial quantity");
  let initialQ = await resource.methods.GetQuantity()
                                      .call();
  
  console.log("change producer");
  await p1.methods.ChangeProducer(p2._address, resAddress, 1)
                  .send({from: p1Ac, gas: standardGas});

  console.log("add resource to target producer's storage");
  await p2.methods.AddToResources(resAddress)
                  .send({from: p2Ac, gas: standardGas});

  console.log("modify quantity from target producer");
  await resource.methods.SetQuantity(Number(initialQ) + 10)
                        .send({from: p2Ac, gas: standardGas});

  console.log("read new quantity");
  let newQ = await resource.methods.GetQuantity()
                                  .call();

  console.log("assert the expected quantity is correct");
  assert.equal(Number(initialQ) + 10, Number(newQ));

  console.log("assert the expected owner is correct");
  assert.equal(p2._address, await resource.methods.owner()
                                                  .call());
  
})();