// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Resource.sol";

contract Producer is Ownable {
  
  string    _name;
  string    _description;
  address   _account;
  address[] _resources;

  event addResourceEvent (address indexed addr, uint indexed, string name);

  constructor (
    string memory name,
    string memory description,
    address account
  ) Ownable() {
    _name = name;
    _description = description;
    _account = account;
  }

  modifier onlyAuthorized() {
    require(msg.sender == owner() || msg.sender == _account, "ERROR: not authorized");
    _;
  }

  function GetName ()
    public
    view 
    returns (string memory) {
      return _name;
    }

  function GetDescription ()
    public
    view 
    returns (string memory) {
      return _description;
    }
    
  function GetAccount ()
    public
    view 
    returns (address) {
      return _account;
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
      string memory unitOfMeasure,
      uint quantity,
      address[] memory prevProd
  ) public
    onlyAuthorized {
      Resource res = new Resource(name, description, unitOfMeasure, prevProd);
      AddResource(address(res), uint(Role.farmer));
      res.AddQuantity(quantity);
      emit addResourceEvent(msg.sender, _resources.length - 1, name);
  }

  function AddResource (
      address resAddress,
      uint    role
  ) public
    onlyAuthorized {
      require(role >= 0 && role < 5, "role number not valid");
      _resources.push(resAddress);
      Resource res = Resource(resAddress);
      res.addAuthorized(_account, Role(role));
      if (res.owner() != address(this)) {
        res.transferOwnership(address(this));
      }
  }

  function GetResource (
    uint resIndex
  ) public
    view
    returns (address prim) {
    prim = _resources[resIndex];
  }

  function TransferQuantity(
    address newAddress,
    uint resourceIndex,
    uint role,
    uint quantity
  ) onlyAuthorized
  public {
    Resource res = Resource(_resources[resourceIndex]);
    res.RemoveQuantity(quantity);
    Producer prod = Producer(newAddress);
    prod.CreateResource(res.GetName(), res.GetDescription(), res.GetUnitOfMeasure(), quantity, res.GetOrigins());
    res.addAuthorized(prod.GetAccount(), Role(role));
    res.AddOrigin(address(res));
  }

  function ChangeProducer (
    address newProducer,
    uint resourceIndex,
    uint role
    ) public
    onlyAuthorized {
    Resource res = Resource(_resources[resourceIndex]);
    Producer(newProducer).AddResource(address(res), role);
    // res.addAuthorized(newProducer, res._authorized[_account]);
    res.addAuthorized(_account, Role.disabled);
    _resources[resourceIndex] = address(0);
  }
  
}
