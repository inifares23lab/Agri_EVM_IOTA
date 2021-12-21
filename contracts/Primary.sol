// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Resource.sol";

contract Primary is Resource {
  constructor ( string memory name, string memory description )
    Resource(name, description) {

  } 
}