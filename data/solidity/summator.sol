contract Summator {
    uint32[10] private values;
    uint64 private sum;

    constructor() public {
        uint8 i = 0;
        while (i < values.length) {
            values[i] = 0;
            i += 1;
        }   
        sum = 0;
    }   

    function push(uint32 arg) public {
        sum -= values[9];

        uint256 i = values.length - 2;
        while (i > 0) {
            values[i+1] = values[i];
            i -= 1;
        }
        values[1] = values[0];

        values[0] = arg;
        sum += arg;
    }
}
