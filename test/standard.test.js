const { constructorMethods } = require("truffle-contract/lib/contract/index");

const Producer = artifacts.require("Producer");
const Resource = artifacts.require("Resource");

contract("TESTS", async function ( accounts ) {
  const owner = accounts[0];
  const p1Ad = accounts[1];
  const p2Ad = accounts[2];
  const certAd = accounts[3];
  const resellAd = accounts[4];
  let p1,
      p2,
      p1_res0,
      p2_res0,
      p1_res1,
      p2_res1;

  before("istantiate producers and resources", async function () {
    p1 = await Producer.new("one", "some desc ", p1Ad, {from: owner});
    p2 = await Producer.new("two", "some desc ", p2Ad, {from: owner});
    await p1.CreateResource("first resource", "some desc ", "uOM", 10, [], {from:owner});
    p1_res0 = await Resource.at(await p1.GetResource.call(0));
    await p1.CreateResource("first product", "some desc ", "uOM", 10, [p1_res0.address], {from:owner});
    p1_res1 = await Resource.at(await p1.GetResource.call(1));
  })

  it("get producers and resources names", async function () {
    console.log(await p1.GetName());
    console.log(await p2.GetName());
    console.log(await p1_res0.GetName());
    console.log(await p1_res1.GetName());
  })
  
  it("add and read event", async function () {
    let paramIn = "0x".concat(Buffer.from(JSON.stringify({ action: "fertilizing", quantity: "10 liters" })).toString('hex'));
    await p1_res0.AddEvent("first event", paramIn, {from: p1Ad});
    let event1 = await p1_res0.ReadEvent.call(0);
    let paramOut = Buffer.from(event1[3].slice(2), 'hex').toString('utf8');
    console.log(event1);
    console.log(paramOut);
  })

  it("Change producer", async function () {
    await p1.ChangeProducer(await p2.address, 0, 1, {from: p1Ad});
    assert.equal(await p2.address, await p1_res0.owner());
  })

  it("transfer quantity", async function () {
    await p1.TransferQuantity(await p2.address, 0, 1, 9, {from: p1Ad});
    p2_res0 = await Resource.at(await p2.GetResource.call(0));
    assert.equal(await p1_res0.GetQuantity.call(), 1);
    assert.equal(await p2_res0.GetQuantity.call(), 9);
  })

});