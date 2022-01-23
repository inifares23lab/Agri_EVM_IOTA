const Web3 = require("web3");
const assert = require("chai").assert;
 
(async () => {
  const IOTAPublicUrl = null; //await new Web3.providers.HttpProvider("");
  const IOTAlocalUrl = null; //await new Web3.providers.HttpProvider("");
  const EthLocalUrl = "http://127.0.0.1:7545";


  const ProducerJSON = require("../build/contracts/Producer.json");
  const ResourceJSON = require("../build/contracts/Resource.json"); 

  let p1,
      p2,
      res0,
      res1,
      res2,
      res3;

  const providerArg = (process.argv.count > 2 && process.argv.slice(2)) || 0;
  
  const provider = (providerArg == 0 && await new Web3.providers.HttpProvider(EthLocalUrl))
                  || (providerArg == 1 && await new Web3.providers.HttpProvider(IOTAlocalUrl))
                  || (providerArg == 2 && await new Web3.providers.HttpProvider(IOTAPublicUrl));
  
  const web3 = await new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  const ownerAccount = accounts[0];
  const p1Ac = accounts[1];
  const p2Ac = accounts[2];
  const certAc = accounts[3];
  
  
  console.log("Create First Producer");
  p1 = await new web3.eth.Contract(ProducerJSON.abi)
                        .deploy({ data: ProducerJSON.bytecode,
                                  arguments: ["one", "one desc", p1Ac] })
                        .send({ from: ownerAccount,
                                gas: 6000000 });
  
  console.log("Create Second Producer");
  p2 = await new web3.eth.Contract(ProducerJSON.abi)
                        .deploy({ data: ProducerJSON.bytecode,
                                  arguments: ["two", "two desc", p2Ac] })
                        .send({ from: ownerAccount,
                                gas: 6000000 });
  
  console.log("Create First resource from first producer");
  await p1.methods.CreateResource("first resource", "some desc ", "uOM", 100, 1, [])
                  .send({from: p1Ac, gas: 6000000});
  let res0Address = await p1.methods.GetResource(0)
                                    .call();
  res0 = await new web3.eth.Contract(ResourceJSON.abi, res0Address);
  
  console.log("Create Second resource from first producer");
  await p1.methods.CreateResource("first product", "some desc ", "uOM", 100, 1, [res0._address])
                  .send({from: p1Ac, gas: 6000000});
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
                    .send({from: p1Ac, gas: 6000000});
  
  console.log("read event");  
  let event1 = await res0.methods.ReadEvent(0)
                                .call();
  let paramOut = Buffer.from(event1[3].slice(2), 'hex')
                      .toString('utf8');
  assert.equal(paramOut, param);
    
  
  console.log("add event from external certifier");
  await res0.methods.addAuthorized(certAc, 3)
                    .send({from : p1Ac, gas: 6000000});
  let param2 = JSON.stringify({ action: "certify origins", status: "OK" });
  let paramIn2 = "0x" + Buffer.from(param2)
                              .toString('hex');
  await res0.methods.AddEvent("first event", paramIn2)
                    .send({from: certAc, gas: 6000000});

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
                  .send({from: p1Ac, gas: 6000000});

  console.log("add resource to target producer's storage");
  await p2.methods.AddToResources(resAddress)
                  .send({from: p2Ac, gas: 6000000});

  console.log("modify quantity from target producer");
  await resource.methods.SetQuantity(Number(initialQ) + 10)
                        .send({from: p2Ac, gas: 6000000});

  console.log("read new quantity");
  let newQ = await resource.methods.GetQuantity()
                                  .call();

  console.log("assert the expected quantity is correct");
  assert.equal(Number(initialQ) + 10, Number(newQ));

  console.log("assert the expected owner is correct");
  assert.equal(p2._address, await resource.methods.owner()
                                                  .call());
  
})();