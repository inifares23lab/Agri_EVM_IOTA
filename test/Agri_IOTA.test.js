const Web3 = require("web3");

(async () => {
  const IOTAPublicProvider = null; //await new Web3.providers.HttpProvider("");
  const IOTAlocalProvider = null; //await new Web3.providers.HttpProvider("");
  const EthLocalProvider = await new Web3.providers.HttpProvider("http://127.0.0.1:7545");
  
  const web3 = await new Web3(IOTAPublicProvider || IOTAlocalProvider || EthLocalProvider);
  const accounts = await web3.eth.getAccounts();
  const owner = accounts[0];
  const p1Ac = accounts[1];
  const p2Ac = accounts[2];
  const certAc = accounts[3];
  
  const ProducerABI = require("../build/contracts/Producer.json");
  const ResourceABI = require("../build/contracts/Resource.json");  

  let p1,
      p2,
      res0,
      res1,
      res2,
      res3;

    (async () => {
      console.log("istantiate producers and resources");
      p1 = await new web3.eth.Contract(ProducerABI.abi, "one", "some desc ", p1Ac, {from: owner});
      p2 = await new web3.eth.Contract(ProducerABI.abi, "two", "some desc ", p2Ac, {from: owner});
      await p1.CreateResource("first resource", "some desc ", "uOM", 100, 1, [], {from: p1Ac});
      res0 = await Resource.at(await p1.GetResource.call(0));
      await p1.CreateResource("first product", "some desc ", "uOM", 100, 1, [res0.address], {from:p1Ac});
      res1 = await Resource.at(await p1.GetResource.call(1));
    })();

    (async () => {
      console.log("get producers and resources names");
      console.log(await p1.GetName());
      console.log(await p2.GetName());
      console.log(await res0.GetName());
      console.log(await res1.GetName());
    })();
    
    (async () => {
      console.log("add and read event");
      let param = JSON.stringify({ action: "fertilizing", quantity: "10 liters" });
      let paramIn = "0x" + Buffer.from(param).toString('hex');
      await res0.AddEvent("first event", paramIn, {from: p1Ac});
      let event1 = await res0.ReadEvent.call(0);
      let paramOut = Buffer.from(event1[3].slice(2), 'hex').toString('utf8');
      assert.equal(paramOut, param);
    })();

    (async () => {
      console.log("add and read event from an external certifier");
      await res0.addAuthorized(certAc, 3, {from : p1Ac});
      let param = JSON.stringify({ action: "certify origins", status: "OK" });
      let paramIn = "0x" + Buffer.from(param).toString('hex');
      await res0.AddEvent("first event", paramIn, {from: certAc});
      let event1 = await res0.ReadEvent.call(1);
      let paramOut = Buffer.from(event1[3].slice(2), 'hex').toString('utf8');
      assert.equal(paramOut, param);
    })();
    
    (async () => {
      console.log("change producer");
      let resAddress = await p1.GetResource(0);
      let resource = await Resource.at(resAddress);
      let initialQ = await resource.GetQuantity();
      await p1.ChangeProducer(p2.address, resAddress, 1, {from: p1Ac});
      await p2.AddToResources(resAddress, {from: p2Ac});
      await resource.SetQuantity(Number(initialQ) + 10, { from : p2Ac });
      let newQ = await resource.GetQuantity();
      assert.equal(Number(initialQ) + 10, Number(newQ));
      assert.equal(p2.address, await resource.owner());
    })();

})();
