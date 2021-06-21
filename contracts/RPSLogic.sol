// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

/**
 * @title RPSLogic
 * @dev This contract implements the basic logic behind a rock paper scissors game
 */

contract RPSLogic {
  uint32 rock = 1;
  uint32 paper = 2;
  uint32 scissors = 3;

  /**
   * @dev Map structure to define the outcome of player choices
   */
  mapping(uint32 => mapping(uint32 => uint32)) decisionMap;

  constructor() public {
    decisionMap[rock][paper] = paper;
    decisionMap[rock][scissors] = rock;
    decisionMap[rock][rock] = 0;
    decisionMap[paper][rock] = paper;
    decisionMap[paper][scissors] = scissors;
    decisionMap[paper][paper] = 0;
    decisionMap[scissors][paper] = scissors;
    decisionMap[scissors][rock] = rock;
    decisionMap[scissors][scissors] = 0;
  }

  /**
   * @dev basic rock paper scissor game implementation
   */

  function decideWinner(uint32 choice1, uint32 choice2)
    public
    view
    returns (uint32)
  {
    return decisionMap[choice1][choice2];
    // if (choice1 == choice2) return 0; // 0 for a draw

    // if (choice1 == rock) {
    //   if (choice1 + choice2 == 4) {
    //     return choice1;
    //   }
    //   return choice2;
    // }

    // if (choice1 == paper) {
    //   if (choice1 + choice2 == 5) {
    //     return choice1;
    //   }
    //   return choice2;
    // }

    // if (choice1 == scissors) {
    //   if (choice1 + choice2 == 5) {
    //     return choice1;
    //   }
    //   return choice2;
    // }
  }
}
