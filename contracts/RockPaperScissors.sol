// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.0;

/**
 * @title RockPaperScissors
 *
 * @dev This contract inherits from `RPSToken` and `RPSLogic`
 * This contract defines how the two player game is implemented.
 * A player e.g Alice can initiate a round with a `stake` >= `_minStake` when she has a balance >= `stake`
 * Any random player , e.g Bob can choose to accept a round by staking same `stake` and providing a choice.
 * In actuality, Bob never actually stakes (transfer his tokens to the contract unlike alice).
 * If Bob looses, the `stake` as specified by Alice will be transfered to Alice.
 * If Alice looses, the `stake` already locked in the contract will be transfered to Bob.
 * Alice has a choice to terminate an already initiated round as long has Bob has not accepted to play his turn.
 * In the case that Alice calls `terminateRound` on a round she initiated, the value of her `stake` is transfered from the contract to her.
 * Players are not bound by any rules as to the number of rounds to initiate or the value of the stake they choose to initate
 * As long as they have enough `RPST` tokens to stake.
 * Likewise, players are allowed to accept any number of rounds as long as they have enough `RPST` tokens to stake with
 * An optional functionality of transfering 5% of any transfers made amongst token holders (with the exception of transfers to or from the contract) to a pool that'll be shared by a list of to winners in the community at a specific interval to sensitize more players.
 * Other functionalities can be included also.
 */

import './RPSToken.sol';
import './RPSLogic.sol';

contract RockPaperScissors is RPSToken, RPSLogic {
  event RoundInitiated(
    address indexed initiator,
    uint256 indexed roundId,
    uint256 indexed stake
  );
  event RoundAccepted(
    address indexed acceptor,
    uint256 indexed roundId,
    uint256 indexed stake
  );
  event RoundTerminated(
    address indexed terminator,
    uint256 indexed roundId,
    uint256 indexed stake
  );
  event GameEndsInDraw(
    address indexed player1,
    address indexed player2,
    uint256 indexed roundId
  );
  event GameEndsInWin(
    address indexed player1,
    address indexed player2,
    address indexed winner,
    uint256 roundId
  );

  RockPaperScissors _rpsHandler = RockPaperScissors(address(this));

  uint256 _minStake = 10000000000; // 10 RPSToken when the `decimal` clause is factored out

  struct Round {
    address player1; // initiator
    address player2; // acceptor
    uint32 p1Choice; // Either Rock, Paper or Scissors
    uint32 p2Choice; // Either Rock, Paper or Scissors
    uint256 stake; // price to play
    address winner; // winner of this round
  }

  Round[] private rounds;

  mapping(address => uint256[]) playerToWinsMap;
  mapping(address => uint256[]) playerToLossesMap;
  mapping(address => uint256[]) playerToDrawsMap;
  mapping(address => uint256[]) playerToTerminatedRounds;

  /**
   * @dev a utitlity function to perform transfers from contract to player addresses in the case of a win, draw or round cancellation.
   */

  function _inGameTransfer(address recipient, uint256 amount)
    private
    returns (bool)
  {
    (bool success, bytes memory data) =
      address(this).call(
        abi.encodeWithSignature('transfer(address,uint256)', recipient, amount)
      );
    return success;
  }

  /**
   * @dev Creates an open game by staking the initiators token in the contract and placing a turn (that can either be a `uint32` of 1, 2, or 3 each corresponding to Rock, Paper or Scissors).
   * Any player can choose to place a turn by staking same amount of token.
   */

  function initiateRound(uint256 _stake, uint32 _choice)
    public
    returns (uint256)
  {
    require(
      _choice == 1 || _choice == 2 || _choice == 3,
      'Invalid turn option'
    );
    require(balanceOf(_msgSender()) >= _stake, 'Insufficient RPST tokens');
    require(_stake >= _minStake, 'Stake less than minimum stake');

    transfer(address(this), _stake);

    rounds.push(
      Round(_msgSender(), address(0), _choice, 0, _stake, address(0))
    );

    uint256 roundId = rounds.length.sub(1);
    emit RoundInitiated(_msgSender(), roundId, _stake);
    return roundId;
  }

  /**
   * @dev A player chooses to accept and place a turn on an already initiated game.
   * Player never transfers staked tokens to contract.
   * Token transfers happen (in this case to the winner) if according to `decideWinner` there is a winner.
   * If there's a draw, the acceptor's stake never get's transferred and the initiator's stake is reverted immediately.
   * The mappings [`playerToWinsMap`, `playerToLossesMap`, `playerToDrawsMap`] are also updated.
   */

  function acceptRound(uint256 _roundId, uint32 _choice) public returns (bool) {
    address _player2 = _msgSender();
    Round storage round = rounds[_roundId];
    require(_player2 != address(0), 'strange request');
    require(round.player2 == address(0), 'The round is already concluded.');
    require(
      _choice == 1 || _choice == 2 || _choice == 3,
      'Invalid turn option'
    );
    require(balanceOf(_player2) >= round.stake, 'Insufficient RPST tokens');

    emit RoundAccepted(_player2, _roundId, round.stake);

    round.p2Choice = _choice;
    round.player2 = _player2;

    uint32 result = decideWinner(round.p1Choice, _choice);

    if (result == 0) {
      address _player1 = round.player1;
      _inGameTransfer(_player1, round.stake);
      emit GameEndsInDraw(_player1, _player2, _roundId);
      playerToDrawsMap[_player1].push(_roundId);
      playerToDrawsMap[_player2].push(_roundId);
      return (true);
    }

    uint256 stake = round.stake;
    address _player1 = round.player1;

    if (result == _choice) {
      _inGameTransfer(_player2, stake);
      round.winner = _player2;
      playerToWinsMap[_player2].push(_roundId);
      playerToLossesMap[_player1].push(_roundId);
      emit GameEndsInWin(_player1, _player2, _player2, _roundId);
    } else {
      approve(address(this), stake);
      _inGameTransfer(_player1, stake);
      transfer(_player1, stake);
      round.winner = _player1;
      playerToWinsMap[_player1].push(_roundId);
      playerToLossesMap[_player2].push(_roundId);
      emit GameEndsInWin(_player1, _player2, _player1, _roundId);
    }
  }

  /**
   * @dev An initiator of a round can choose to cancel the initiated round upon desire.
   * This is possible as long as the round has not been "accepted" by another player.
   * Only the initiator of a round can terminate that particular round.
   * Upon termination of the round, the initiator's `stake` for the round is transfered from the contract to the initiator.
   */

  function terminateRound(uint256 roundId) public returns (bool) {
    address _player1 = _msgSender();
    Round storage round = rounds[roundId];
    require(round.player1 == _player1, 'No permission to terminate this round');
    require(round.player2 == address(0), 'Cannot terminate concluded round');
    round.player2 = _player1;
    round.winner = address(0);
    _inGameTransfer(_player1, round.stake);
    playerToTerminatedRounds[_player1].push(roundId);
    emit RoundTerminated(_player1, roundId, round.stake);
    return true;
  }
}
