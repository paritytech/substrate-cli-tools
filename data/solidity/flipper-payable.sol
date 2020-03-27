contract Flipper_payable {
	bool private value;

	constructor() public payable {
		value = false;
	}

	function flip() public payable {
		value = !value;
	}

	function get() public view returns (bool) {
		return value;
	}
}
