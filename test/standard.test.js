const { constructorMethods } = require("truffle-contract/lib/contract/index");

const Producer = artifacts.require("Producer");
const Resource = artifacts.require("Resource");

contract("TESTS", async function ( accounts ) {
  const owner = accounts[0];
  let p1,
      p2,
      p1_prim1,
      p2_prim2,
      p1_prod1,
      p2_prod2;

  before("istantiate producers", async function () {
    p1 = await Producer.new("one", "some desc ", accounts[1], {from: owner});
    p2 = await Producer.new("two", "some desc ", accounts[2], {from: owner});
  })

  it("get producers names", async function () {
    console.log(await p1.GetName());
    console.log(await p2.GetName());
    await p1.CreateResource("first resource", "some desc ", [], 1, {from:owner});
    p1_res0 = await Resource.at(await p1.GetResource.call(0));
    await p1.CreateResource("first product", "some desc ", [p1_res0.address], 1, {from:owner});
    p1_res1 = await Resource.at(await p1.GetResource.call(1));
    console.log(await p1_res0.GetName());
    console.log(await p1_res1.GetName());
    await p1_res0.AddEvent("first event", JSON.stringify({ action: "fertilizing", quantity: "10 liters /" }), {from: accounts[1]});
    let event1 = await p1_res0.ReadEvent.call(0);
    console.log(JSON.parse(event1[3]));
  })

});