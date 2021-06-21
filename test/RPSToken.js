/**
 * @title RPSToken Tests
 * @notice Basic tests for the RPSToken contract
 */

const {expect} = require("chai");
const {ethers} = require("hardhat");
const {
	balanceConverter,
	reverseBalanceConverter,
} = require("../scripts/testHelper");

let Token;
let rpsToken;
let owner;
let alice;
let bob;
let addrs;

beforeEach(async () => {
	Token = await ethers.getContractFactory("RPSToken");
	[owner, alice, bob, ...addrs] = await ethers.getSigners();
	rpsToken = await Token.deploy();
});

/**
 * @dev tests to ensure contract deployment goes as intended
 */
describe("Token Contract Deployment", () => {
	it("should asign `owner` to msg.sender", async () => {
		expect(await rpsToken.owner()).to.equal(owner.address);
	});
	it("should mint half of `maxTotalSupply` to deployer address", async () => {
		expect(balanceConverter(await rpsToken.balanceOf(owner.address))).to.equal(
			5000000
		);
	});
});

/**
 * @dev tests to ensure calling `claimAirdrop` works as intended
 */

describe("Airdrops", () => {
	it("should asign 250 RPST to a caller address that has not received the airdrop", async () => {
		await rpsToken.connect(alice).claimAirdrop();
		expect(balanceConverter(await rpsToken.balanceOf(alice.address))).to.equal(
			250
		);
	});
	it("should reduce the `_totalAirdropSupply` by 250 upon each call to the `claimAirdrop` function", async () => {
		var airdropSupply = balanceConverter(await rpsToken.totalAirdropSupply());
		await rpsToken.connect(alice).claimAirdrop();
		expect(balanceConverter(await rpsToken.totalAirdropSupply())).to.equal(
			airdropSupply - 250
		);
	});
	it("should not asign an airdrop to a caller more than once", async () => {
		await rpsToken.connect(alice).claimAirdrop();
		await expect(rpsToken.connect(alice).claimAirdrop()).to.be.revertedWith(
			"This address has claimed the airdrop already"
		);
	});
	it("should not assing airdrop to owner address", async () => {
		await expect(rpsToken.claimAirdrop()).to.be.revertedWith(
			"Owner cannot claim airdrop"
		);
	});
	it("should change the `_totalAirdropSupply` to new value", async () => {
		var initialValue = await rpsToken.totalAirdropSupply();
		await rpsToken.setAirdropSupply(250);
		expect(await rpsToken.totalAirdropSupply()).to.equal(250);
	});
	it("should not assign an airdrop when `totalAirdropsupply` is less than `airdropValue", async () => {
		await rpsToken.setAirdropSupply(250);
		await expect(rpsToken.connect(alice).claimAirdrop()).to.be.revertedWith(
			"Available airdrop balance exhausted"
		);
	});
});
