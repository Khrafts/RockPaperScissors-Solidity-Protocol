// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.0;

/**
 * @title RPSToken
 * @notice The native ERC20 token for the `RockPaperScissors.sol` contract.
 * It has a total supply of 10 million tokens and a decimal value of 9.
 * Half of `_maxTotalSupply` is minted to the deployer's address upon deployment.
 * it contains a `claimAirdrop` function to freely and equally distribute half of `_maxTotalSupply`
 * to the first twenty-thousand participants.
 */

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import 'hardhat/console.sol';

contract RPSToken is ERC20, Ownable {
  using SafeMath for uint256;

  event AirdropReceived(address participantAddress, uint256 amount);

  /**
   * @dev The next few lines define the tokenomics of the token
   */

  uint256 private _maxTotalSupply = 10000000000000000; // Ten million total supply of RPSToken
  uint256 private _totalAirdropSupply = _maxTotalSupply.div(2);
  uint256 private _airdropValue = _totalAirdropSupply.div(20000); // value = 250 RPST

  // mapping to track addresses that have claimed airdrop.
  mapping(address => uint256) private _airdropedAddresses;

  /**
   * @dev Upon deployment, the `name`, `symbol` and `decimals` states of the token are permanently set
   * throgh the `ERC20` modifier.
   * Half of the `_maxTotalSupply` is minted into the deployer address.
   */

  constructor() public ERC20('RPSToken', 'RPST') {
    _setupDecimals(9); // sets decimal for token
    _mint(_msgSender(), _totalAirdropSupply);
  }

  // Getter functions

  /**
   * @dev returns the value of `_totalAirdropSupply`
   */
  function totalAirdropSupply() public view returns (uint256) {
    return _totalAirdropSupply;
  }

  /**
   * @dev returns the value of `_maxTotalSupply`
   */
  function maxTotalSupply() public view returns (uint256) {
    return _maxTotalSupply;
  }

  /**
   * @dev `claimAirdrop` transfers 250 `RPST` to `_msgSender()` only once if `_totalAirdropSupply` >= `_airdropValue` 0.
   */

  function claimAirdrop() public returns (bool) {
    address sender = _msgSender();
    require(
      _airdropedAddresses[sender] == 0,
      'This address has claimed the airdrop already'
    );
    require(
      _totalAirdropSupply >= _airdropValue,
      'Available airdrop balance exhausted'
    );
    require(_msgSender() != owner(), 'Owner cannot claim airdrop');
    _airdropedAddresses[sender] = _airdropValue;
    _mint(sender, _airdropValue);
    _totalAirdropSupply = _totalAirdropSupply.sub(_airdropValue);
    emit AirdropReceived(sender, _airdropValue);
    return true;
  }

  /**
   * @dev sets the `_totalAirdropSupply` to any value such that _totalAirdropSupply + _totalSupply <= _maxTotalSupply.
   * The function of course can only be acessed by the owner address.
   * The value set should be the value with `decimals` in consideration
   */
  function setAirdropSupply(uint256 value) public onlyOwner returns (bool) {
    require(
      value + totalSupply() <= _maxTotalSupply,
      'Sum of value and `_totalSupply` exceeds _maxTotalSupply'
    );
    _totalAirdropSupply = value;
    return true;
  }
}
