// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma abicoder v2;

import "./Resource.sol";

contract Producer is Ownable {
  
  string    _name;
  string    _description;
  address   _account;
  address[] _resources;
  // mapping (uint => address) _resourceMap;

  event AddResourceEvent (address indexed ownerAddr, address indexed addr);
  event TransferResourceEvent (address indexed src, address indexed dest, address indexed res);
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
  ) public onlyAuthorized roleInRange(role)
  returns ( address ) {
      Resource res = new Resource(name, description, unitOfMeasure, quantity, prevProd);
      res.addAuthorized(_account, Role(role));
      _resources.push(address(res));
      emit AddResourceEvent(address(this), address(res));
      return address(res); 
  }

  // function TransferQuantity(
  //   address newAddress,
  //   uint resIndex,
  //   uint role,
  //   uint quantity
  // ) public onlyAuthorized roleInRange(role)
  // returns ( address ) {
  //   // address resAddress = _resources[resIndex];
  //   // Resource res = Resource(resAddress);
  //   // Producer prod = Producer(newAddress);
  //   // resAddress.call(bytes4(keccak256("RemoveQuantity(uint256)", quantity)));
  //   // q
  //   // address newResource = Clones.clone(resAddress);
  //   // // Resource newRes = Resource(newResource);
  //   // newResource.call(bytes4(keccak256("AddOrigin(address)", address(res))));
  //   // newResource.call(bytes4(keccak256("RemoveQuantity(uint256)", _quantity)));
  //   // newRes.addAuthorized(prod.GetAccount(), Role(role));    
  //   // newRes.transferOwnership(newAddress);
  //   // _resources.push(newResource);
  //   // emit TransferResourceEvent(address(this), newAddress, newResource);
  //   return address(0);
  // }

  function ChangeProducer (
    address newProducer,
    uint resIndex,
    uint role
  ) public onlyAuthorized roleInRange(role) {
    address resAddr = _resources[resIndex];
    Resource res = Resource(resAddr);
    Producer prod = Producer(newProducer);
    address prodAccont = prod.GetAccount();
    res.addAuthorized(prodAccont, Role.farmer);
    res.addAuthorized(_account, Role.disabled);
    res.transferOwnership(newProducer);
    //HERE IT GOES OUT OF GAS
    prod.AddToResources(resAddr);
    _resources[resIndex] = address(0);

    //ASSEMBLY NON SUCCESFUL TRY
    // bytes memory addAuthSig = abi.encodeWithSignature("addAuthorized(address, Role)", prodAccont, Role.farmer);
    // bytes memory removeAuthSig = abi.encodeWithSignature("addAuthorized(address, Role)", _account, Role.disabled);
    // // Role farmerRole = Role.farmer;
    // bytes memory transferOwnershipSig = abi.encodeWithSignature("transferOwnership(address)", newProducer);
    // bytes memory addToResSig = abi.encodeWithSignature("AddToResources(address)");
    // assembly {
    //   {   
    //     let x := mload(0x40)   //Find empty storage location using "free memory pointer"
    //     mstore(x, addAuthSig) //Place signature at begining of empty storage 
    //     // mstore(addAuthorized(x,0x04), prodAccont) //Place first argument directly next to signature
    //     // mstore(addAuthorized(x,0x24), farmerRole) //Place second argument next to first, padded to 32 bytes
    //     let success := call( 5000, res, 0, x, 32, x, 0x00)
    //   }
    //   {
    //     let x := mload(0x40) 
    //     mstore(x, removeAuthSig) //Place signature at begining of empty storage 
    //     let success := call(5000, res, 0, x, 32, x, 0x00)
    //   }
    //   {
    //     let x := mload(0x40)
    //     mstore(x, transferOwnershipSig) //Place signature at begining of empty storage 
    //     let success := call(5000, res, 0, x, 32, x, 0x00)
    //   }
    //   {
    //     let x := mload(0x40)
    //     mstore(x, addToResSig) //Place signature at begining of empty storage 
    //     let success := call(5000, res, 0, x, 32, x, 0x00)
    //   }
    // }

    //CALL NON SUCCESFUL TRY
    // bool success;
    // bytes memory result;
    // emit TransferResourceEvent(address(this), newProducer, resAddress);
    // (success, ) = res.call(abi.encodeWithSignature("addAuthorized(address, Role)", _account, Role.disabled));
    // require(success, "disable authorization didn't work");
    // (success, result) = newProducer.call(abi.encodeWithSignature("GetAccount()"));
    // require(success, "Get account function didn't work");
    // address prodAccont = abi.decode(result, (address));
    // (success, ) = res.call(abi.encode("addAuthorized(address, Role)", prodAccont, Role.disabled));
    // require(success, "add authorization didn't work"); 
    // (success, ) = res.delegatecall(abi.encode("transferOwnership(address)", newProducer));
    // require(success, "transfer ownership function didn't work"); 
    // (success, ) = newProducer.delegatecall(abi.encode("AddToResources(address)", res));
    // require(success, "add to resources function didn't work");
    // _resources[resIndex] = address(0);
  }

  function AddToResources(address res) 
  public onlyAuthorized {
    _resources.push(res);
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