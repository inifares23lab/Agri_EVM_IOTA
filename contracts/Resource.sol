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
  uint32        _quantity;
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
    string parameters;
  }

  address[] _roles;
  mapping ( address => Role ) _authorized;
  
    
  event agriEvent (address indexed registrant, address indexed resource);
  
  constructor (
    string memory name,
    string memory description,
    address[] memory origins
  ) Ownable() {
    _name = name;
    _description = description;
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

  modifier ifInRange( uint eventNr  ) {
      require(eventNr >= 0 || eventNr <= _agriEvents.length, "ERROR: The event number must be within range!");
      _;
  }

  function GetName ()
    public
    view 
  returns ( string memory ) {
    return _name;
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
    string memory parameters
  ) onlyAuthorized
    public {
    _agriEvents.push(AgriEvent( block.timestamp, msg.sender, name, parameters ));
    emit agriEvent( msg.sender, address(this));
  }
    
  function ReadEvent(
    uint eventNr
  ) ifInRange (
    eventNr
  ) public
  view
  returns ( AgriEvent memory) {
    return _agriEvents[eventNr];
  } 
}
