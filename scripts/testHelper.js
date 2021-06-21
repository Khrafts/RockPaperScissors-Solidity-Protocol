function balanceConverter(value) {
	return value / 10 ** 9;
}

function reverseBalanceConverter(value) {
	return value * 10 ** 9;
}

module.exports = {
	balanceConverter,
	reverseBalanceConverter,
};
