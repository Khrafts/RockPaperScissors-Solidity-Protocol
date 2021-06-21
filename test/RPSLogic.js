/**
 * @title RPSLogic Tests
 * @notice Basic tests for the RPSLogic contract
 */

const {ethers} = require("hardhat");
const {expect} = require("chai");

let RPSLogic;
let rpsLogic;
let owner;
let alice;
let bob;
let addrs;

beforeEach(async () => {
	RPSLogic = await ethers.getContractFactory("RPSLogic");
	[owner, alice, bob, ...addrs] = await ethers.getSigners();
	rpsLogic = await RPSLogic.deploy();
});

describe("Rock Paper Scissors game logic", () => {
	it("should return 1 if alice chooses rock (1) and bob chooses scissors (3)", async () => {
		expect(await rpsLogic.decideWinner(1, 3)).to.equal(1);
	});
	it("should return 2 if alice chooses rock (1) and bob chooses paper (2)", async () => {
		expect(await rpsLogic.decideWinner(1, 2)).to.equal(2);
	});

	it("should return 2 if alice chooses paper (2) and bob chooses stone (1)", async () => {
		expect(await rpsLogic.decideWinner(2, 1)).to.equal(2);
	});
	it("should return 3 if alice chooses paper (2) and bob chooses scissors (3)", async () => {
		expect(await rpsLogic.decideWinner(2, 3)).to.equal(3);
	});
	it("should return 3 if alice chooses scissors (3) and bob chooses paper (2)", async () => {
		expect(await rpsLogic.decideWinner(3, 2)).to.equal(3);
	});
	it("should return 1 if alice chooses scissors(3) and bob chooses rock (1)", async () => {
		expect(await rpsLogic.decideWinner(3, 1)).to.equal(1);
	});
	it("should return 0 if alice chooses rock (1) and bob chooses rock (1)", async () => {
		expect(await rpsLogic.decideWinner(1, 1)).to.equal(0);
	});
	it("should return 0 if alice chooses paper (2) and bob chooses paper (2)", async () => {
		expect(await rpsLogic.decideWinner(2, 2)).to.equal(0);
	});
	it("should return 0 if alice chooses scissors (3) and bob chooses rock (3)", async () => {
		expect(await rpsLogic.decideWinner(3, 3)).to.equal(0);
	});
});
