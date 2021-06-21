/**
 * @title RockPaperScissors Tests
 * @notice Basic tests for the RockPaperScissors contract
 */

const {ethers} = require("hardhat");
const {expect, should} = require("chai");
const {BigNumber} = require("ethers");
const {
	reverseBalanceConverter,
	balanceConverter,
} = require("../scripts/testHelper");

let RPS;
let rockPaperScissors;
let owner;
let alice;
let bob;
let addrs;

beforeEach(async () => {
	RPS = await ethers.getContractFactory("RockPaperScissors");
	[owner, alice, bob, ...addrs] = await ethers.getSigners();
	rockPaperScissors = await RPS.deploy();
});

/**
 * @dev tests to ensure calling `initiateRound` works as intended
 */

describe("Initiating a round", () => {
	it("should revert if a player stakes an amount > `balanceOf(msg.sender)`", async () => {
		await rockPaperScissors.connect(alice).claimAirdrop();
		await expect(
			rockPaperScissors
				.connect(alice)
				.initiateRound(reverseBalanceConverter(250.01), 1)
		).to.revertedWith("Insufficient RPST tokens");
	});

	it("should revert if `_choice` parameter is other than 1, 2 or 3", async () => {
		await expect(
			rockPaperScissors.initiateRound(reverseBalanceConverter(200), 4)
		).to.be.revertedWith("Invalid turn option");
	});

	it("should revert if `_stake` is < `_minStake`", async () => {
		await expect(
			rockPaperScissors.initiateRound(reverseBalanceConverter(9.9), 2)
		).to.be.revertedWith("Stake less than minimum stake");
	});

	it("Should deduct the `stake` as selected by the initiator from the initiator balance and increase the balance of staked token in the contract by the value of `stake`", async () => {
		let iniBal = Number(await rockPaperScissors.balanceOf(owner.address));
		let conBal = Number(
			await rockPaperScissors.balanceOf(rockPaperScissors.address)
		);
		await rockPaperScissors.initiateRound(reverseBalanceConverter(50), 2);
		expect(await rockPaperScissors.balanceOf(owner.address)).to.equal(
			iniBal - reverseBalanceConverter(50)
		);
		finalConBal = reverseBalanceConverter(50) + conBal;
		expect(
			await rockPaperScissors.balanceOf(rockPaperScissors.address)
		).to.equal(finalConBal);
	});
});

/**
 * @dev tests to ensure calling `acceptRound` works as intended
 */

describe("Accepting a round", () => {
	it("should revert if a player calls `acceptRound` on already concluded round", async () => {
		await rockPaperScissors.connect(alice).claimAirdrop();
		await rockPaperScissors.connect(bob).claimAirdrop();
		result = await rockPaperScissors
			.connect(alice)
			.initiateRound(reverseBalanceConverter(200), 1);
		let receipt = await result.wait();

		[targetEvent] = receipt.events?.filter((x) => {
			return x.event == "RoundInitiated";
		});
		roundId = targetEvent.args.roundId.toNumber();
		result = await rockPaperScissors.connect(bob).acceptRound(roundId, 2);
		await expect(rockPaperScissors.acceptRound(roundId, 1)).to.be.revertedWith(
			"The round is already concluded."
		);
	});

	it("should revert if a player calls `acceptRound` with a choice other than 1, 2, or 3", async () => {
		await rockPaperScissors.connect(alice).claimAirdrop();
		await rockPaperScissors.connect(bob).claimAirdrop();
		result = await rockPaperScissors
			.connect(alice)
			.initiateRound(reverseBalanceConverter(200), 1);
		let receipt = await result.wait();

		[targetEvent] = receipt.events?.filter((x) => {
			return x.event == "RoundInitiated";
		});
		roundId = targetEvent.args.roundId.toNumber();
		await expect(rockPaperScissors.acceptRound(roundId, 4)).to.be.revertedWith(
			"Invalid turn option"
		);
	});

	it("should revert if a player calls `acceptRound` with a balance < `stake` of thee selected round", async () => {
		await rockPaperScissors.connect(alice).claimAirdrop();
		result = await rockPaperScissors.initiateRound(
			reverseBalanceConverter(251),
			1
		);
		let receipt = await result.wait();

		[targetEvent] = receipt.events?.filter((x) => {
			return x.event == "RoundInitiated";
		});
		roundId = targetEvent.args.roundId.toNumber();
		await expect(
			rockPaperScissors.connect(alice).acceptRound(roundId, 2)
		).to.be.revertedWith("Insufficient RPST tokens");
	});

	it("should assign total staked balance to player2 upon winning while permanently deducting staked amount from player1", async () => {
		await rockPaperScissors.connect(alice).claimAirdrop();
		await rockPaperScissors.connect(bob).claimAirdrop();
		result = await rockPaperScissors
			.connect(alice)
			.initiateRound(reverseBalanceConverter(200), 1);
		let receipt = await result.wait();

		[targetEvent] = receipt.events?.filter((x) => {
			return x.event == "RoundInitiated";
		});
		roundId = targetEvent.args.roundId.toNumber();
		result = await rockPaperScissors.connect(bob).acceptRound(roundId, 2);
		expect(await rockPaperScissors.balanceOf(bob.address)).to.equal(
			reverseBalanceConverter(200 + 250)
		);
		expect(await rockPaperScissors.balanceOf(alice.address)).to.equal(
			reverseBalanceConverter(250 - 200)
		);
	});

	it("should assign total staked balance to player1 upon winning while permanently deducting staked amount from player2", async () => {
		await rockPaperScissors.connect(alice).claimAirdrop();
		await rockPaperScissors.connect(bob).claimAirdrop();
		result = await rockPaperScissors
			.connect(alice)
			.initiateRound(reverseBalanceConverter(200), 1);
		let receipt = await result.wait();

		[targetEvent] = receipt.events?.filter((x) => {
			return x.event == "RoundInitiated";
		});
		roundId = targetEvent.args.roundId.toNumber();
		result = await rockPaperScissors.connect(bob).acceptRound(roundId, 3);
		expect(await rockPaperScissors.balanceOf(bob.address)).to.equal(
			reverseBalanceConverter(250 - 200)
		);
		expect(await rockPaperScissors.balanceOf(alice.address)).to.equal(
			reverseBalanceConverter(250 + 200)
		);
	});

	it("should transfer back the initiator's stake in the case of a draw", async () => {
		await rockPaperScissors.connect(alice).claimAirdrop();
		await rockPaperScissors.connect(bob).claimAirdrop();
		result = await rockPaperScissors
			.connect(alice)
			.initiateRound(reverseBalanceConverter(200), 1);
		let receipt = await result.wait();
		[targetEvent] = receipt.events?.filter((x) => {
			return x.event == "RoundInitiated";
		});
		roundId = targetEvent.args.roundId.toNumber();
		result = await rockPaperScissors.connect(bob).acceptRound(roundId, 1);
		expect(await rockPaperScissors.balanceOf(alice.address)).to.equal(
			reverseBalanceConverter(250)
		);
		expect(await rockPaperScissors.balanceOf(bob.address)).to.equal(
			reverseBalanceConverter(250)
		);
	});

	it("Should deduct only the value of `stake` as selected by the initiator from the contract balance when there is a win in a round", async () => {
		await rockPaperScissors.connect(alice).claimAirdrop();
		let result = await rockPaperScissors.initiateRound(
			reverseBalanceConverter(50),
			2
		);
		let receipt = await result.wait();
		[targetEvent] = receipt.events?.filter((x) => {
			return x.event == "RoundInitiated";
		});
		roundId = targetEvent.args.roundId.toNumber();
		let conBal = Number(
			await rockPaperScissors.balanceOf(rockPaperScissors.address)
		);
		await rockPaperScissors.connect(alice).acceptRound(roundId, 1);
		expect(
			await rockPaperScissors.balanceOf(rockPaperScissors.address)
		).to.equal(conBal - reverseBalanceConverter(50));
	});

	it("Should deduct only the value of `stake` as selected by the initiator from the contract balance when there is a draw in a round", async () => {
		await rockPaperScissors.connect(alice).claimAirdrop();
		let result = await rockPaperScissors.initiateRound(
			reverseBalanceConverter(50),
			2
		);
		let receipt = await result.wait();
		[targetEvent] = receipt.events?.filter((x) => {
			return x.event == "RoundInitiated";
		});
		roundId = targetEvent.args.roundId.toNumber();
		let conBal = Number(
			await rockPaperScissors.balanceOf(rockPaperScissors.address)
		);
		await rockPaperScissors.connect(alice).acceptRound(roundId, 2);
		expect(
			await rockPaperScissors.balanceOf(rockPaperScissors.address)
		).to.equal(conBal - reverseBalanceConverter(50));
	});
});

/**
 * @dev tests to ensure calling `terminateRound` works as intended
 */

describe("Terminating a round", () => {
	it("should revert if a non-initiator calls the `terminateRound` on a round", async () => {
		await rockPaperScissors.connect(alice).claimAirdrop();
		result = await rockPaperScissors
			.connect(alice)
			.initiateRound(reverseBalanceConverter(200), 1);
		let receipt = await result.wait();
		[targetEvent] = receipt.events?.filter((x) => {
			return x.event == "RoundInitiated";
		});
		roundId = targetEvent.args.roundId.toNumber();
		await expect(
			rockPaperScissors.connect(bob).terminateRound(roundId)
		).to.revertedWith("No permission to terminate this round");
	});

	it("should revert if an initiator tries terminating an already concluded round", async () => {
		await rockPaperScissors.connect(alice).claimAirdrop();
		await rockPaperScissors.connect(bob).claimAirdrop();
		result = await rockPaperScissors
			.connect(alice)
			.initiateRound(reverseBalanceConverter(200), 1);
		let receipt = await result.wait();
		[targetEvent] = receipt.events?.filter((x) => {
			return x.event == "RoundInitiated";
		});
		roundId = targetEvent.args.roundId.toNumber();
		await rockPaperScissors.connect(bob).acceptRound(roundId, 1);
		await expect(
			rockPaperScissors.connect(alice).terminateRound(roundId)
		).to.revertedWith("Cannot terminate concluded round");
	});

	it("Should deduct only the value of `stake` as selected by the initiator from the contract balance and add the value of `stake` to the initiator(terminator) balance", async () => {
		await rockPaperScissors.connect(alice).claimAirdrop();
		let result = await rockPaperScissors.initiateRound(
			reverseBalanceConverter(50),
			2
		);
		let playerBalAfterIni = Number(
			await rockPaperScissors.balanceOf(owner.address)
		);
		let contractBalAfterIni = Number(
			await rockPaperScissors.balanceOf(rockPaperScissors.address)
		);
		let receipt = await result.wait();
		[targetEvent] = receipt.events?.filter((x) => {
			return x.event == "RoundInitiated";
		});
		roundId = targetEvent.args.roundId.toNumber();
		await rockPaperScissors.terminateRound(roundId);
		expect(
			await rockPaperScissors.balanceOf(rockPaperScissors.address)
		).to.equal(contractBalAfterIni - reverseBalanceConverter(50));
		expect(await rockPaperScissors.balanceOf(owner.address)).to.equal(
			playerBalAfterIni + reverseBalanceConverter(50)
		);
	});
});
