// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma abicoder v2;

import "./Resource.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract Producer is Ownable {

  string    private  _name;
  string    private  _description;
  address   private  _account;
  address[] private  _resources;
  mapping (address => uint) private _resourceMap;

  event AddResourceEvent (address indexed ownerAddr, 
                          address indexed addr);
  event ChangeProducerEvent ( address indexed src, 
                              address indexed dest,
                              address indexed res);

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
    require(msg.sender == owner() || msg.sender == _account,
              "ERROR only authorized");
    _;
  }

  function CreateResource (
      string memory name,
      string memory description,
      string memory unitOfMeasure,
      uint quantity,
      uint role,
      address[] memory prevProd
  ) public onlyAuthorized roleInRange(role) {
      Resource res = new Resource(name, description, unitOfMeasure, quantity, prevProd);
      res.addAuthorized(_account, role);
      AddToResources(address(res));
  }

  function ChangeProducer (
    address newProducer,
    address resAddr,
    uint role
  ) public onlyAuthorized roleInRange(role) {
    Resource res = Resource(resAddr);
    Producer prod = Producer(newProducer);
    address prodAccont = prod.GetAccount();
    res.addAuthorized(prodAccont, role);
    res.addAuthorized(_account, 0);
    res.transferOwnership(newProducer);
    _resources[_resourceMap[resAddr]] = address(0);
    emit ChangeProducerEvent(address(this), newProducer, resAddr);
  }

  function TransferQuantity (
    address newProducer,
    address resAddr,
    bytes32 salt,
    uint role,
    uint quantity
  ) public onlyAuthorized roleInRange(role) {
    Resource oldRes = Resource(resAddr);
    uint oldQuantity =oldRes.GetQuantity();
    oldRes.SetQuantity(oldQuantity - quantity);
    Resource res = Resource(Clones.cloneDeterministic(resAddr, salt));
    res.transferOwnership(address(this));
    Producer prod = Producer(newProducer);
    address prodAccont = prod.GetAccount();
    res.addAuthorized(prodAccont, role);
    res.addAuthorized(_account, 0);
    res.SetQuantity(quantity);
    res.transferOwnership(newProducer);
  }

  modifier roleInRange(uint i) {
    require(i >= 0 && i <= uint(type(Role).max),
              "ERROR role number out of range");
    _;
  }

  modifier resInRange(uint i) {
    require(i >= 0 && i < _resources.length,
              "ERROR resource number out of range");
    _;
  }

  function GetClonesAddress (
    address resAddr,
    bytes32 salt
  ) public onlyAuthorized view
  returns (address) {
    return Clones.predictDeterministicAddress(resAddr, salt);
  }

  function AddToResources(address res) 
  public onlyAuthorized {
    _resources.push(res);
    emit AddResourceEvent(address(this), address(res));
  }

  function RmFromResources(uint index) 
  public onlyAuthorized {
    _resources[index] = address(0);
  }

  function GetName ()
  public view 
  returns (string memory) {
    return _name;
  }

  function GetDescription ()
  public view 
  returns (string memory) {
    return _description;
  }
    
  function GetAccount ()
  public view 
  returns (address) {
    return _account;
  }

  function GetResource (
    uint resIndex
  ) public view resInRange(resIndex)
  returns (address) {
    return _resources[resIndex];
  }

  function GetResources ()
  public view 
  returns (address[] memory) {
    return _resources;
  }
}