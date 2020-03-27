contract Flipper_no_args {
	bool private value;

	constructor() public {
		value = false;
	}

	function flip() public {
		value = !value;
	}

	function get() public view returns (bool) {
		return value;
	}
}
