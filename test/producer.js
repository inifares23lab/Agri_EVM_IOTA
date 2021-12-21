const Producer = artifacts.require("Producer");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Producer", function (accounts) {
  it("should assert true", async function () {
    let producer;
    await Producer.deployed().then( function( instance ) {
          instance.addPrimary("priName", "priDesc");
    })
    return assert.isTrue(true);
  });
});
