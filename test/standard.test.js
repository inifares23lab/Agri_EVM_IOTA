const Producer = artifacts.require("Producer");
const Product = artifacts.require("Product");
const Primary = artifacts.require("Primary");

contract("TESTS", async function ( accounts ) {
  const owner = accounts[0];
  let p1,
      p2,
      p1_prim1,
      p2_prim2,
      p1_prod1,
      p2_prod2;

  before("istantiate producers", async function () {
    p1 = await Producer.new("one", "some desc ");
    p2 = await Producer.new("two", "some desc ");
  })

  it("get producers names", async function () {
    console.log(await p1.GetName());
    console.log(await p2.GetName());
    p1_prim1 = await p1.AddPrimary.call("first resource", "some desc ",{from:owner});
    p1_prod1 = await p1.AddProduct.call("two", "some desc ", [p1_prim1],{from:owner});
    await p1_prod1.abi.AddEvent().call("first event", ..."random stuff");
    console.log(await p1_prod1.ReadEvent.call(0));
  })

});