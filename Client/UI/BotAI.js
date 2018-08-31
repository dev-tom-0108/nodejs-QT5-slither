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

WorkerScript.onMessage = function(message) {
    var dirs = {};
    var amebae = message.amebae;
    var sparks = message.sparks;

    amebae.forEach(function (ameba) {
        if (ameba.paused)
            return;
        if (ameba.userID)
            return;
        if (ameba.status.agentID !== message.userID)
            return;

        var headPos = ameba.realTrack[ameba.realTrack.length - 1];
        var bidt = 150 + ameba.status.thickness / 2, idx, idy, idt, avpo, tarAngle;

        amebae.forEach(function(other) {
            if (other === ameba)
                return;
            other.realTrack.forEach(function(step) {
                idx = Math.abs(headPos.pos.x - step.pos.x);
                idy = Math.abs(headPos.pos.y - step.pos.y);
                idt = idx > idy ? idx : idy;

                if (idt < bidt) {
                    bidt = idt;
                    avpo = step;
                }
            })
        });

        // Find out food
        var bfo = undefined, bfv = undefined;
        if (ameba.food === undefined || sparks.indexOf(ameba.food) === -1) {
            sparks.forEach(function(spark) {
                idx = Math.abs(headPos.pos.x - spark.pos.x);
                idy = Math.abs(headPos.pos.y - spark.pos.y);
                idt = idx > idy ? idx : idy;
                if (bfo == undefined || idt < bfv)
                    if (idt !== 0) {
                        bfv = idt;
                        bfo = spark;
                    }
            })
            ameba.food = bfo;
        }

        // Check direction
        if (avpo !== undefined) {
            var delta = {
                x : headPos.pos.y - avpo.pos.y,
                y : headPos.pos.x - avpo.pos.x
            }
            if (!(delta.x === 0 && delta.y === 0)) {
                var angle = correctAngle((Math.atan2(headPos.pos.y - avpo.pos.y,
                                        headPos.pos.x - avpo.pos.x) * 180 / Math.PI) + 90 - 180);
                ameba.status.angle = ameba.status.angle + getDeltaAngle(ameba.status.angle, angle) / 2;
                tarAngle = ameba.status.angle + 180;
            }
            tarAngle = ameba.status.angle + 180;
        }
        else if (ameba.food !== undefined) {
            tarAngle = (Math.atan2(ameba.food.pos.y - headPos.pos.y,
                         ameba.food.pos.x - headPos.pos.x) * 180 / Math.PI) + 90;
        }
        else tarAngle = ameba.status.angle;

        if (tarAngle !== undefined && tarAngle !== ameba.status.angle)
            dirs[ameba.id] = correctAngle(tarAngle);
    });
    WorkerScript.sendMessage({ 'dirs': dirs })
}
