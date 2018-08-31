var referTable = false;
var table = {};

for (var i = 5; i < 4000; i ++)
    table[i] = {
        nodeCount : getNodeCount(i),
        radius : getRadius(i)
    };

referTable = true;

function getNodeCount(length) {
    length = Math.floor(length)
    if (referTable) {
        if (!length)
            return table[10].nodeCount;
        if (length > 3000)
            return table[3000].nodeCount;
        return table[length].nodeCount;
    }
    return Math.floor(Math.sqrt(length / 10)) + 9;
}

function getRadius(length) {
    length = Math.floor(length)
    if (referTable) {
        if (!length)
            return table[10].radius;
            if (length > 3000)
                return table[3000].radius;
        return table[length].radius;
    }
    return  Math.pow(length / 10, 0.25) * 15;
}

function getDistFromRadius(rad) {
    return rad * 5 / 4
}

module.exports = {
    getNodeCount : getNodeCount,
    getRadius : getRadius,
    getDistFromRadius : getDistFromRadius
}