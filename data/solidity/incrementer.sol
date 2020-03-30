contract Incrementer {
	uint32 private value;

	constructor(uint32 initvalue) public {
		value = initvalue;
	}

	function inc(uint32 by) public {
		value += by;
	}

	function get() public view returns (uint32) {
		return value;
	}
}
