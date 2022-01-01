// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Resource.sol";

contract Product is Resource {

  address[] _origins;

  constructor (
    string memory name,
    string memory description,
    address[] memory origins
  ) Resource(name, description) {
    _origins = origins;
  }

}
