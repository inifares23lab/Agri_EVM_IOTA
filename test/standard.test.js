const Producer = artifacts.require("Producer");
const Resource = artifacts.require("Resource");

contract("TESTS", async function ( accounts ) {
  const owner = accounts[0];
  const p1Ac = accounts[1];
  const p2Ac = accounts[2];
  const certAc = accounts[3];
  let p1,
      p2,
      res0,
      res1,
      res2,
      res3;

  before("istantiate producers and resources", async function () {
    p1 = await Producer.new("one", "some desc ", p1Ac, {from: owner});
    p2 = await Producer.new("two", "some desc ", p2Ac, {from: owner});
    await p1.CreateResource("first resource", "some desc ", "uOM", 10, [], {from: p1Ac});
    res0 = await Resource.at(await p1.GetResource.call(0));
    await p1.CreateResource("first product", "some desc ", "uOM", 10, [res0.address], {from:p1Ac});
    res1 = await Resource.at(await p1.GetResource.call(1));
  })

  it("get producers and resources names", async function () {
    console.log(await p1.GetName());
    console.log(await p2.GetName());
    console.log(await res0.GetName());
    console.log(await res1.GetName());
  })
  
  it("add and read event", async function () {
    let param = JSON.stringify({ action: "fertilizing", quantity: "10 liters" });
    let paramIn = "0x" + Buffer.from(param).toString('hex');
    await res0.AddEvent("first event", paramIn, {from: p1Ac});
    let event1 = await res0.ReadEvent.call(0);
    let paramOut = Buffer.from(event1[3].slice(2), 'hex').toString('utf8');
    assert.equal(paramOut, param);
  })

  it("add and read event from an added external certifier", async function () {
    await res0.addAuthorized(certAc, 3, {from : p1Ac});
    let param = JSON.stringify({ action: "certify origins", status: "OK" });
    let paramIn = "0x" + Buffer.from(param).toString('hex');
    await res0.AddEvent("first event", paramIn, {from: certAc});
    let event1 = await res0.ReadEvent.call(1);
    let paramOut = Buffer.from(event1[3].slice(2), 'hex').toString('utf8');
    assert.equal(paramOut, param);
  })
  
});