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

  string        _name;
  string        _description;
  uint          _quantity;
  string        _unitOfMeasure;
  uint32        _minTimeInterval;
  AgriEvent[]   _agriEvents;  
  address[]     _origins;
  ResourceType  _resourceType;
  
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

  address[] _roles;
  mapping ( address => Role ) _authorized;
  
    
  event agriEvent (address indexed registrant, address indexed resource);
  
  constructor (
    string memory name,
    string memory description,
    string memory unitOfMeasure,
    address[] memory origins
  ) Ownable() {
    _name = name;
    _description = description;
    _unitOfMeasure = unitOfMeasure;
    _origins = origins;
    if (origins.length == 0){
      _resourceType = ResourceType.primary;
    } else {
      _resourceType = ResourceType.product;
    }
  }
  
  modifier onlyAuthorized() {
    require(msg.sender == owner() || _authorized[msg.sender] != Role.disabled);
    _;
  }



  function AddQuantity(uint quantity) onlyAuthorized public {
    _quantity = _quantity + quantity;
  }

  function RemoveQuantity(uint quantity) onlyAuthorized public {
    require(_quantity - quantity >= 0, "Not enough quantity available");
    _quantity = _quantity - quantity;
  }

  function GetName ()
    public
    view 
  returns ( string memory ) {
    return _name;
  }

  function GetDescription ()
    public
    view 
  returns ( string memory ) {
    return _description;
  }

  function GetUnitOfMeasure ()
    public
    view 
  returns ( string memory ) {
    return _unitOfMeasure;
  }

  function GetQuantity ()
    public
    view 
  returns ( uint ) {
    return _quantity;
  }

  function GetOrigins ()
    public
    view 
  returns ( address[] memory ) {
    return _origins;
  }

  function AddOrigin (
    address originAddr
  ) onlyOwner
    public {
    _origins.push(originAddr);
  }

  function addAuthorized (
    address authAddr,
    Role role
  ) onlyOwner
    public {
    _authorized[authAddr] = role;
  }

  function getAuthorized (
    address authAddress
  ) public
    view 
  returns ( Role ) {
    return _authorized[authAddress];
  }

  function AddEvent (
    string memory name,
    bytes memory parameters
  ) onlyAuthorized
    public {
    _agriEvents.push(AgriEvent( block.timestamp, msg.sender, name, parameters ));
    emit agriEvent( msg.sender, address(this));
  }
    
  function ReadEvent(
    uint eventNr
  ) public
   view
  returns ( AgriEvent memory) {
  require(eventNr >= 0 && eventNr < _agriEvents.length, "ERROR: The event number must be within range!");
    return _agriEvents[eventNr];
  } 
}
