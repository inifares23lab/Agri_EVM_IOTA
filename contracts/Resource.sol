// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

enum Role {
    disabled,
    farmer,
    agrifirm,
    certifier,
    publicbody,
    retailer,
    reseller
  }

contract Resource is Ownable {

  string        private _name;
  string        private _description;
  uint          private _quantity;
  string        private _unitOfMeasure;
  uint32        private _minTimeInterval;
  AgriEvent[]   private _agriEvents;  
  address[]     private _origins;
  address[]     private _roles;
  ResourceType  private _resourceType;
  mapping ( address => Role ) private _authorized;
  
  enum ResourceType {
    primary,
    product
  }
  
  struct AgriEvent {
    uint dateTime;
    address registrant;
    string name;
    bytes parameters;
  }
    
  event agriEvent (address indexed registrant, address indexed resource);
  
  constructor (
    string memory name,
    string memory description,
    string memory unitOfMeasure,
    uint quantity,
    address[] memory origins
  ) Ownable() {
    _name = name;
    _description = description;
    _unitOfMeasure = unitOfMeasure;
    _quantity = quantity;
    _origins = origins;
    if (origins.length == 0){
      _resourceType = ResourceType.primary;
    } else {
      _resourceType = ResourceType.product;
    }
  }
  
  function transferOwnership(
    address newOwner
  ) public override onlyOwnerOrUninitialized {
    require(newOwner != address(0), "Ownable: new owner is the zero address");
    _transferOwnership(newOwner);
  }

  modifier onlyOwnerOrUninitialized(){
    require(owner() == msg.sender || owner() == address(0));
    _;
  }

  modifier roleInRange(uint i) {
    require(i >= 0 && i <= uint(type(Role).max), 
              "ERROR role number out of range");
    _;
  }
  modifier eventInRange(uint eventNr) {
    require(eventNr >= 0 && eventNr < _agriEvents.length, 
              "ERROR: The event number must be within range!");
    _;
  }
  modifier onlyAuthorized() {
    require(msg.sender == owner() || _authorized[msg.sender] != Role.disabled,
              "ERROR: not authorized");
    _;
  }
  modifier onlyCertifiers() {
    require(msg.sender == owner() || _authorized[msg.sender] != Role.disabled,
              "ERROR: not authorized");
    _;
  }

  function AddEvent (
    string memory name,
    bytes memory parameters
  ) onlyAuthorized public {
    _agriEvents.push(AgriEvent(block.timestamp, msg.sender, name, parameters));
    emit agriEvent( msg.sender, address(this));
  }

  function SetQuantity(uint quantity)
    onlyAuthorized public {
    _quantity = quantity;
  }

  function AddOrigin (
    address originAddr
  ) onlyAuthorized public {
    _origins.push(originAddr);
  }

  function addAuthorized (
    address authAddr,
    uint role
  ) onlyAuthorized roleInRange(role) public {
    _authorized[authAddr] = Role(role);
  }
    
  function ReadEvent(
    uint eventNr
  ) public view eventInRange(eventNr)
  returns ( AgriEvent memory) {
    return _agriEvents[eventNr];
  }

  function GetName ()
    public view 
  returns ( string memory ) {
    return _name;
  }

  function GetDescription ()
    public view 
  returns ( string memory ) {
    return _description;
  }

  function GetUnitOfMeasure ()
    public view 
  returns ( string memory ) {
    return _unitOfMeasure;
  }

  function GetQuantity ()
    public view 
  returns ( uint ) {
    return _quantity;
  }

  function GetOrigins ()
    public view 
  returns ( address[] memory ) {
    return _origins;
  }

  function getAuthorized (
    address authAddress
  ) public view 
  returns ( Role ) {
    return _authorized[authAddress];
  } 
}
