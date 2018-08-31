function distBetween(a, b) {
    // distance between 2 points
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function distBetweenP(a, b) {
    // distance between 2 points
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
}

function distBetweenF(a, b) {
    // distance between 2 points
    var dx = Math.abs(a.x - b.x);
    var dy = Math.abs(a.y - b.y);
    return dx > dy ? dx : dy;
}

function vectorLength(vec) {
    // length of a vector
    return Math.sqrt(Math.pow(vec.x, 2), Math.pow(vec.y, 2));
}

function correctAngle(angle) {
    var a = angle % 360;
    // correct the angle in range of (-180, 180]
    if (a < - 180)
        a += 360;
    else if (a > 180)
        a -= 360;
    return a;
}

function getDeltaAngle(angle1, angle2) {
    // if clockwise returns positive number else returns negative number
    var a1 = getDeltaAngleClockWise(angle1, angle2), a2 = 360 - a1;
    return a1 < a2 ? a1 : -a2;
}

function getArrowAngle(angle, distance, baseAngle) {
    if (distance == undefined)
        return angle;
    var deltaAngle = getDeltaAngle(baseAngle, angle);
    var factor = 5 / (5 + distance);
    return correctAngle(baseAngle + deltaAngle * factor / 5);
}

function getDeltaAngleClockWise(angle1, angle2) {
    // Get delta angle between angle1 and angle2
    angle1 = correctAngle(angle1);
    angle2 = correctAngle(angle2);
    var a1 = angle1 < 0 ? 360 + angle1 : angle1, a2 = angle2 < 0 ? 360 + angle2 : angle2;
    var angle = a2 - a1;
    if (angle < 0)
        angle += 360;
    if (angle < 0)
        angle += 360;
    if (angle > 360)
        angle -= 360;
    return correctAngle(angle);
}

function vecMul(elem, item1, item2)
{
	vec1 = {"x" : item1.x - elem.x, "y" : item1.y - elem.y};
	vec2 = {"x" : item2.x - elem.x, "y" : item2.y - elem.y};
	var res = vec1.x * vec2.y - vec1.y * vec2.x;
	if (res > 0)
		return 1;
	else if (res < 0)
		return -1;
	return 0;
}

function intersect(line1, line2) // check if 2 lines are intersect with each other
{
    return  (vecMul(line1[0], line1[1], line2[0]) != vecMul(line1[0], line1[1], line2[1])) &&
            (vecMul(line2[0], line2[1], line1[0]) != vecMul(line2[0], line2[1], line1[1]));
}

function distBetweenPointToLineSeg(line, point)
{
    return Math.sqrt(distBetweenPointToLineSegP(line, point));
}

function distBetweenPointToLineSegP(line, point)
{
    var pt1 = line[0], pt2 = line[1];
    var pt0 = {
        x : point.x + pt1.y - pt2.y,
        y : point.y + pt1.x - pt2.x
    };
    if (vecMul(point, pt0, pt1) * vecMul(point, pt0, pt2) >= 0) {
        var d1 = distBetweenP(point, pt1), d2 = distBetweenP(point, pt2);
        return d1 < d2 ? d1 : d2;
    }
    var dx = pt2.x - pt1.x, dy = pt2.y - pt1.y;
    var h = dy * point.x - dx * point.y + pt2.x * pt1.y - pt2.y * pt1.x, l = dy * dy + dx * dx;
    return h * h / l;
}

function rangeIntersect(v1, v2) {
    if (v2.from < v1.from && v1.from < v2.to)
        return true;
    if (v2.from < v1.to && v1.to < v2.to)
        return true;
    if (v1.from < v2.from && v2.from < v1.to)
        return true;
    if (v1.from < v2.to && v2.to < v1.to)
        return true;
    return false;
}

function rectIntersect(rect1, rect2) {
    return rangeIntersect({ from: rect1.left, to: rect1.right }, { from: rect2.left, to: rect2.right })
        && rangeIntersect({ from: rect1.top, to: rect1.bottom }, { from: rect2.top, to: rect2.bottom });
}

module.exports = {
    distBetween : distBetween,
    distBetweenP : distBetweenP,
    distBetweenF : distBetweenF,
    distBetweenPointToLineSeg : distBetweenPointToLineSeg,
    distBetweenPointToLineSegP : distBetweenPointToLineSegP,
    vectorLength : vectorLength,
    correctAngle : correctAngle,
    getDeltaAngle : getDeltaAngle,
    intersect : intersect,
    rectIntersect : rectIntersect,
    rangeIntersect : rangeIntersect,
    getArrowAngle : getArrowAngle
}