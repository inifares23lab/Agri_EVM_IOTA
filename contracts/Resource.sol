// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract Resource is Ownable {

  address     _holder;
  string      _name;
  string      _description;
  AgriEvent[] _agriEvents;
  uint32      _quantity;
  string      _unitOfMeasure;
  uint32      _minTimeInterval;
  
  enum Role {
    disabled,
    farmer,
    agrifirm,
    certifier,
    publicbody,
    retailer,
    reseller
  }

  struct AgriEvent {
    uint dateTime;
    address registrant;
    string name;
    bytes parameters;
  }

  address[] _roles;
  mapping ( address => Role )       _authorized;
  
  // mapping ( uint    => AgriEvent )  _agriEvents;
    
  // event agriEvent (address indexed registrant, address indexed resource);
 
  constructor(string memory name, string memory description ) {
    // _id = string(address(this));
    _name         = name;
    _description  = description;
  }

  modifier onlyAuthorized() {
    require(msg.sender == owner() || _authorized[msg.sender] != Role.disabled);
    _;
  }

  modifier ifInRange( uint eventNr  ) {
      require(eventNr >= 0 || eventNr <= _agriEvents.length, "ERROR: The event number must be within range!");
      _;
  }

  function addAuthorized( address authAddr, Role role ) onlyOwner public {
    _authorized[authAddr] = role;
  }

  function changeProducer( address newProducer ) onlyOwner public {
    _holder = newProducer;
  }

  function addEvent( string memory name, bytes memory parameters ) onlyAuthorized public {
    _agriEvents.push(AgriEvent( block.timestamp, msg.sender, name, parameters ));
    // emit agriEvent( _msgSender(), address(this));
  }

  function readEvent( uint eventNr  ) ifInRange ( eventNr ) public view returns ( AgriEvent memory ) {
    return _agriEvents[eventNr];
  }

  function getOwner() public view returns (address) {
    return owner();
  }
 
}
