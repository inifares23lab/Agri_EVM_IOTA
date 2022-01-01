// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Product.sol";
import "./Primary.sol";

contract Producer is Ownable {
  
  string    _name;
  string    _description;
  address[] _products;
  address[] _primaryResources;
  
  event addResourceEvent (address indexed addr, uint indexed, string name);

  constructor (
    string memory name,
    string memory description
  ) Ownable() {
    _name = name;
    _description = description;
  }

  function GetName ()
    public
    view 
    returns (string memory) {
      return _name;
    }

  function GetProducts ()
    public
    view 
    returns (address[] memory) {
      return _products;
    }

  function GetPrimaryResources ()
    public
    view 
    returns (address[] memory) {
      return _primaryResources;
    }

  function AddPrimary (
      string memory name,
      string memory description
  ) public
    onlyOwner
    returns (address) {
    Primary prim = new Primary(name, description);
    _primaryResources.push(address(prim));
    emit addResourceEvent(msg.sender, _primaryResources.length - 1, name);
    return address(prim);
  }

  function AddProduct (
      string memory name,
      string memory description,
      address[] memory prevProd
  ) public
    onlyOwner
    returns (address) {
    Product prod = new Product(name, description, prevProd);
    _products.push(address(prod));
    //      for (uint i = 0; i > prevProd.length; i++) {
    //        require(Resource._primaryResources[prevProd[i]]._producer == msg.sender);
    //      }
    emit addResourceEvent(msg.sender, _products.length - 1, name);
    return address(prod);
  }

  function GetPrimary (
    uint resIndex
  ) public
    view
    returns (address prim) {
    prim = _primaryResources[resIndex];
  }

  function GetProduct (
    uint resIndex
  ) public
    view
    returns (address prod) {
    prod = _products[resIndex];
  }

  // function changeProducer ( address newProducer, uint productIndex ) public onlyOwner {
  //   Product prod = Product(_products[productIndex]);
  //   Producer(newProducer)._products.push(address(prod));
  //   prod.addAuthorized(newProducer, prod._authorized[address(this)]);
  //   prod.addAuthorized(address(this), Resource.Role.disabled);
  //   _products[productIndex] = address(0);
  // }
  
}
