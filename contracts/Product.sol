// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Resource.sol";

contract Product is Resource {
  
  bytes20[] _origins;
    
  constructor ( string memory name, string memory description, bytes20[] memory prevProd )
    Resource(name, description) {
      _origins = prevProd;
  }
}
