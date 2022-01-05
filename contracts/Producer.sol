// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Resource.sol";

contract Producer is Ownable {
  
  string    _name;
  string    _description;
  address   _producerAccount;
  address[] _resources;
  Role      _role;

  event addResourceEvent (address indexed addr, uint indexed, string name);

  constructor (
    string memory name,
    string memory description,
    address account,
    uint role
  ) Ownable() {
    _name = name;
    _description = description;
    _producerAccount = account;
    _role = Role(role);
  }

  modifier onlyAuthorized() {
    require(msg.sender == owner() || msg.sender == _producerAccount);
    _;
  }

  function GetName ()
    public
    view 
    returns (string memory) {
      return _name;
    }

  function GetResources ()
    public
    view 
    returns (address[] memory) {
      return _resources;
    }

  function CreateResource (
      string memory name,
      string memory description,
      address[] memory prevProd
  ) public
    onlyAuthorized {
      Resource res = new Resource(name, description, prevProd);
      AddResource(address(res));
    //      for (uint i = 0; i > prevProd.length; i++) {
    //        require(Resource._primaryResources[prevProd[i]]._producer == msg.sender);
    //      }
      emit addResourceEvent(msg.sender, _resources.length - 1, name);
  }

  function AddResource (
      address resAddress
  ) public
    onlyAuthorized {
      _resources.push(resAddress);
      Resource(resAddress).addAuthorized(_producerAccount, Role.farmer);
    //      for (uint i = 0; i > prevProd.length; i++) {
    //        require(Resource._primaryResources[prevProd[i]]._producer == msg.sender);
    //      }
  }

  function GetResource (
    uint resIndex
  ) public
    view
    returns (address prim) {
    prim = _resources[resIndex];
  }

  function changeProducer ( address newProducer, uint resourceIndex ) public onlyOwner {
    Resource res = Resource(_resources[resourceIndex]);
    Producer(newProducer).AddResource(address(res));
    // res.addAuthorized(newProducer, res._authorized[_producerAccount]);
    res.addAuthorized(_producerAccount, Role.disabled);
    _resources[resourceIndex] = address(0);
  }
  
}
