// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Primary.sol";
import "./Product.sol";

contract Producer is Ownable {
  
  string    _name;
  string    _description;
  bytes20[] _products;
  bytes20[] _primaryResources;

  event addPrimaryResource (address indexed addr, address indexed);

  constructor ( string memory name, string memory description ) {
    _name = name;
    _description = description;
    emit addPrimaryResource(msg.sender, address(0));
  }

  function addPrimary ( string memory name, string memory description ) public {
    Primary primaryResource = new Primary(name, description);
    _primaryResources.push(bytes20(address(primaryResource)));
    emit addPrimaryResource(msg.sender, address(primaryResource));
  }

  function addProduct ( string memory name, string memory description, bytes20[] memory prevProd ) public {
    Product agriProd = new Product(name, description, prevProd);
    _products.push(bytes20(address(agriProd)));
  }

//   function changeProducer ( address newProducer, uint productId ) public onlyOwner {
//     // newProducer.call(addProduct(  name, description, prevProd  ));
//     (abi.encodeWithSignature("changeProducer(address)", newProducer ));
//     _resourceLink[productId]._id = address(0);
//   }
  
}
