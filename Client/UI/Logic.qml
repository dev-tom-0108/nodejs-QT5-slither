import QtQuick 2.10
import "."
import "./Misc.js" as Misc

Item {
    property var amebae: [];
    property var sparks: [];
    property var startTime;
    property real navigate: 0;

    function updateScene() {
        var amebaeArray = [], sparkArray = [];
        var newAoe = {};

        amebae.forEach(function (ameba) {
            if (ameba.status.paused && ameba.realTrack)
                return;
            var nodes = calcRealTrack(ameba);
            calcAoe(ameba);
            newAoe[ameba.id] = ameba.status.aoe;

            if (ameba.userID === Global.userInfo.id) {
                setCamPos(nodes[nodes.length - 1].pos.x, nodes[nodes.length - 1].pos.y)
            }

            nodes.forEach(function (node) {
                if (Math.abs(node.pos.x - camPosX) < (gameView.width / 2 + 100) && Math.abs(node.pos.y - camPosY) < (gameView.height / 2 + 100))
                    amebaeArray.push(node);
            })
        })

        amebae.forEach(function (ameba) {
            if (ameba.status.paused)
                return;
            if (ameba.status.agentID !== Global.userInfo.id)
                return;
            var headPos = ameba.status.headPos;
            var dead = false;
            var murderer;
            amebae.forEach(function (other) {
                if (other === ameba)
                    return;
                if (dead)
                    return;
                var distLim = other.status.thickness + ameba.status.thickness;
                for (var i = 0; i < other.realTrack.length; i ++) {
                    if (Algebra.distBetweenP(headPos, other.realTrack[i].pos) < distLim * distLim ) {
                        dead = true;
                        if (ameba.userID)
                            murderer = other.id;
                        break;
                    }
                }
            })
            if (dead) {
                laySparks(ameba);
                socket.sendCmd('kill', { deadID : ameba.id, murderer : murderer });
            }
        })

        sparkArray = sparks.filter(function (spark) {
            return Math.abs(spark.pos.x - camPosX) < (gameView.width / 2 + 100) && Math.abs(spark.pos.y - camPosY) < (gameView.height / 2 + 100);
        })
        drawSparks(sparkArray);
        drawAmebae(amebaeArray);

        socket.sendCmd('aoe', newAoe);
        if (++ navigate % 2 == 0) {
            navigate = 0;
            aiRunner.sendMessage({amebae : logic.amebae, sparks : logic.sparks, userID : Global.userInfo.id });
        }
    }

    function laySparks(ameba) {
        var rad = ameba.status.thickness;
        var amt = Math.ceil(Math.pow(ameba.status.length / 4, 0.25));
        var newSparks = [];
        ameba.realTrack.forEach(function (track) {
            for (var idx = 0; idx < amt; idx ++) {
                var d = Math.sqrt(Math.random()) * rad, a = Math.random() * 360;
                newSparks.push({
                                        pos : {
                                            x : Math.cos(Math.PI / 180 * a) * d + track.pos.x,
                                            y : Math.sin(Math.PI / 180 * a) * d + track.pos.y
                                        },
                                        value : amt
                                    })
            }
        })
        socket.sendCmd('laySparks', { sparks : newSparks });
    }

    function calcCurrentMoment() {
        return (new Date() - startTime) + Global.offsetMoment;
    }

    function calcRealTrack(ameba) {
        var iter = 0, idx, length, node, nodes = [], nodeCnt, track, rad, dist, curSpeed, headPos = {}, angle, timeOffset;
        length = ameba.status.length;
        track = ameba.track;

        nodeCnt = Misc.getNodeCount(length);
        rad = Misc.getRadius(length);
        ameba.status.thickness = rad;
        var index = amebae.indexOf(ameba);

        dist = Misc.getDistFromRadius(rad);
        if (!track)
            return;
        curSpeed = ameba.status.boost? Global.temp.mapInfo.boostSpeed : Global.temp.mapInfo.normalSpeed;
        angle = ameba.status.angle;

        timeOffset = (calcCurrentMoment() - ameba.status.timestamp) / 1000;

        headPos = {
            x : track[0].x + Math.sin(angle * Math.PI / 180) * curSpeed * timeOffset,
            y :track[0].y - Math.cos(angle * Math.PI / 180) * curSpeed * timeOffset,
            angle : angle
        };
        ameba.status.headPos = headPos;

        var tempMeter = 0;
        idx = 0;
        var pos0, pos1;
        if (!ameba.status.paused) {
            pos0 = headPos;
            pos1 = track[0];
        }
        else {
            pos0 = track[0];
            pos1 = track.length === 1 ? track[0] : track[1];
            idx ++;
        }
        var nDist = Algebra.distBetween(pos0, pos1);
        node = {
            pos : {
                x : pos0.x,
                y : pos0.y
            },
            head : true,
            angle : pos0.angle,
            radius : rad,
            boost : pos1.boost
        }
        nodes.unshift(node);

        while (-- nodeCnt)
        {
            tempMeter += dist;
            while (tempMeter > nDist)
            {
                tempMeter -= nDist;
                idx ++;
                if (idx >= track.length)
                    break;
                pos0 = track[idx - 1];
                pos1 = track[idx];
                nDist = Algebra.distBetween(pos0, pos1);
            }

            if (idx >= track.length)
            {
                node = {
                    pos : pos1,
                    head : false,
                    angle : pos0.angle,
                    radius : rad
                };
                nodes.unshift(node)
                break;
            }

            node = {
                pos : {
                    x : pos0.x * (nDist - tempMeter) / nDist + pos1.x * tempMeter / nDist,
                    y : pos0.y * (nDist - tempMeter) / nDist + pos1.y * tempMeter / nDist
                },
                head : false,
                angle : pos0.angle,
                radius : rad
            };

            nodes.unshift(node);
        }

        if (idx < ameba.track.length)
            track.splice(idx + 1, track.length - idx - 1);

        ameba.realTrack = nodes;
        return ameba.realTrack;
    }

    function calcAoe(ameba) {
        var top, left, right, bottom;
        top = ameba.realTrack[0].pos.y;
        bottom = ameba.realTrack[0].pos.y;
        left = ameba.realTrack[0].pos.y;
        right = ameba.realTrack[0].pos.y;
        if (!this.realTrack)
            return;
        this.realTrack.forEach(function (step) {
            if (top > step.pos.y)
                top = step.pos.y;
            if (bottom < step.pos.y)
                bottom = step.pos.y;
            if (left > step.pos.x)
                left = step.pos.x;
            if (right < step.pos.x)
                right = step.pos.x;
        })
        ameba.status.aoe = {
            top : top,
            left : left,
            right : right,
            bottom : bottom
        };
    }

    function reflectChanges(data) {
        var agentList = data.states.agentBuffer;
        amebae.forEach(function (ameba) {
            if (agentList[ameba.id] === undefined)
                return;
            ameba.status.agentID = agentList[ameba.id];
        })
        data.states.pauseBuffer.forEach(function (play) {
            amebae.forEach(function (ameba) {
                if (ameba.id === play.id)
                    ameba.status.paused = true;
            })
        });
        data.states.playBuffer.forEach(function (play) {
            amebae.forEach(function (ameba) {
                if (ameba.id === play.id) {
                    ameba.status.paused = false;
                    ameba.status.timestamp = play.timestamp;
                }
            })
        });
        var lengthList = data.states.lengthBuffer
        amebae.forEach(function (ameba) {
            if (!lengthList[ameba.id])
                return;
            ameba.status.length = lengthList[ameba.id];
        })
        var stepList = data.steps
        amebae.forEach(function (ameba) {
            if (!stepList[ameba.id])
                return;
            var step = stepList[ameba.id];
            ameba.track.unshift(step.pos);
            ameba.status.angle = step.angle;
            ameba.status.boost = step.boost;
            ameba.status.timestamp = step.timestamp;
        })
    }

    function obsolete(detail) {
        var dead = detail.deadAmebae, eaten = detail.eatenSparks;
        eaten.forEach(function (spark) {
            for (var idx = sparks.length - 1; idx >= 0; idx --)
                if (sparks[idx].pos.x === spark.pos.x && sparks[idx].pos.y === spark.pos.y)
                    sparks.splice(idx, 1);
        });
    }

    signal setCamPos(real cx, real cy);
    signal drawAmebae(var nodes);
    signal drawSparks(var sparks);
}
