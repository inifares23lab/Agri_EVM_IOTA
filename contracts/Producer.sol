// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma abicoder v2;

import "./Resource.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract Producer is Ownable {
  
  using Clones for Producer;

  string    _name;
  string    _description;
  address   _account;
  address[] _resources;
  mapping (address => uint) _resourceMap;

  event AddResourceEvent (address indexed ownerAddr, address indexed addr);
  event ChangeProducerEvent (address indexed src, address indexed dest, address indexed res);

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
    require(msg.sender == owner() || msg.sender == _account, addressToString(msg.sender));
    _;
  }

  modifier roleInRange(uint i) {
    require(i >= 0 && i <= uint(type(Role).max), "ERROR role number out of range");
    _;
  }

  modifier resInRange(uint i) {
    require(i >= 0 && i < _resources.length, "ERROR resource number out of range");
    _;
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

  function CreateResource (
      string memory name,
      string memory description,
      string memory unitOfMeasure,
      uint quantity,
      uint role,
      address[] memory prevProd
  ) public onlyAuthorized roleInRange(role) {
      Resource res = new Resource(name, description, unitOfMeasure, quantity, prevProd);
      res.addAuthorized(_account, Role(role));
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
    res.addAuthorized(prodAccont, Role.farmer);
    res.addAuthorized(_account, Role.disabled);
    res.transferOwnership(newProducer);
    _resources[_resourceMap[resAddr]] = address(0);
    emit ChangeProducerEvent(address(this), newProducer, resAddr);
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

  function addressToString(address x) 
  internal pure 
  returns (string memory) {
    bytes memory s = new bytes(40);
    for (uint i = 0; i < 20; i++) {
        bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
        bytes1 hi = bytes1(uint8(b) / 16);
        bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
        s[2*i] = char(hi);
        s[2*i+1] = char(lo);            
    }
    return string(s);
  }

  function char(bytes1 b)
  internal pure
  returns (bytes1 c) {
    if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
    else return bytes1(uint8(b) + 0x57);
  }
}