// Import others
var Global = require('./global.js');
var Algebra = require('./algebra.js');
var Misc = require('./misc');
var ServerJS = require('./server.js');
var Communicator = require('./communicator.js');
var Bot = require('./bot.js');

// This is the management class for a room
class Room {
    constructor () {
        // index is the ID of the room
        // roomName is an additional feature - description of the name
        // amebae is a list of amebae
        // bots is a list of AI bots
        // sparks is a list of sparks(food)
        // mapInfo is a map information of this room
        // check interval is duration between checking computations.
        // startingPoint is the date the room opens
        // myBot is a class object (Bot class + some additional functions for this room)
        this.index = ++ Global.roomNo;
        this.roomName = '';
        this.amebae = [];
        this.sparks = [];

        this.mapInfo = {
            radius : 10000,
            boostSpeed : 300,
            normalSpeed : 100,
        }
        this.checkInterval = 50;
        this.startingPoint = new Date();

        this.stateBuffer = {
            pauseBuffer : [],
            playBuffer : [],
            lengthBuffer : {},
            agentBuffer : {}
        };
        this.stepBuffer = {};
        this.eatenSparks = [];
        this.deadAmebae = [];

        this.newAIBots = [];
        this.obsoleteAmebae = [];
        this.newSparks = [];
        this.eatenSparks = [];

        this.topScores = [];
        this.checkout = 0;
        this.aliveAmebae = {};

        // Install a timer to check and navigate
        setInterval(function () {
            this.checkObsolete();
            this.replenish();
            this.distribute();
            this.navigate();
            this.report();
            if ( ++ this.checkout % 10 == 0 ) {
                this.checkout = 0;
                this.amebae.forEach(ameba => {
                    ameba.simplifyTrack();
                    this.aliveAmebae[ameba.id] = ameba.status.paused;
                });
                this.broadcast("aliveAmebae", { list : this.aliveAmebae });
                this.aliveAmebae = {};
            }
        }.bind(this), this.checkInterval)
    }

    join(id) {
        if (Global.userlist[id].roomNo == this.index) {
            // If you were in this room before you were disconnected
            // Check if this user's already dead
        }

        var info = {};
        info.color = Global.userlist[id].color;
        var newOne = new Bot(this, id, info);

        this.broadcast('new', {
            amebae : [{
                id : newOne.id,
                userID : newOne.userID,
                status : newOne.status,
                track : newOne.track,
                color: info.color,
                name : newOne.name
        }]});
        
        this.amebae.push(newOne);

        Global.userlist[id].roomNo = this.index;
        Communicator.sendCmd(Global.userlist[id].socket, 'join', {
            roomNo : this.index,
            mapInfo : this.mapInfo,
            amebae : this.amebae.map(function (ameba) {
                return {
                    id : ameba.id,
                    userID : ameba.userID,
                    status : ameba.status,
                    track : ameba.track,
                    color: ameba.color,
                    name : ameba.name
                };
            }),
            sparks : this.sparks,
            moment : this.getCurrentMoment()
        });
        return true;
    }

    killAmeba(ameba) {
        this.broadcast('kill', { id: ameba.id });
        if (ameba.userID)
            this.leave(ameba.userID);
        this.amebae.splice(this.amebae.indexOf(ameba), 1);
    }

    checkObsolete() {
        this.amebae.forEach(ameba => {
            if (ameba.status.paused)
                return;
            ameba.calcHeadPos();
        });
    }

    replenish() {
        var sparkLim = Math.ceil(Math.pow(this.mapInfo.radius / 200, 2));
        var botLim = Math.ceil(Math.pow(this.mapInfo.radius/ 1000, 2) * 2);
        var idx;
        if (this.sparks.length < sparkLim) {
            for (idx = sparkLim - this.sparks.length; idx > 0; idx --) {
                this.newSpark();
                this.newSparks.push(this.sparks[this.sparks.length - 1]);
            }
        }
        if (this.amebae.length < botLim) {
            for (idx = botLim - this.amebae.length; idx > 0; idx --) {
                this.newAIBot();
                var newOne = this.amebae[this.amebae.length - 1];
                this.newAIBots.push({
                    id : newOne.id,
                    status : newOne.status,
                    track : newOne.track,
                    color: newOne.color,
                    name : newOne.name
                });
            }
        }
    }

    distribute() {
        var aliveAgents = [];
        this.amebae.forEach(ameba => {
            if (!ameba.userID)
                return;
            if (Global.userlist[ameba.userID] == undefined || Global.userlist[ameba.userID].socket == undefined)
                return;
            var agentAoe = {
                top : ameba.status.headPos.y - 2000,
                left : ameba.status.headPos.x - 2000,
                right : ameba.status.headPos.x + 2000,
                bottom : ameba.status.headPos.y + 2000,
            }
            aliveAgents.push({
                ameba : ameba,
                aoe : agentAoe
            });
        });
        this.amebae.forEach(ameba => {
            if (ameba.userID) {
                if (Global.userlist[ameba.userID] != undefined && Global.userlist[ameba.userID].socket != undefined) {
                    if (ameba.status.agentID != ameba.userID) {
                        this.stateBuffer.agentBuffer[ameba.id] = ameba.userID;
                        ameba.status.agentID = ameba.userID;
                    }
                }
                else {
                    this.stateBuffer.agentBuffer[ameba.id] = "";
                    ameba.status.agentID = "";
                }
            }
            else {
                if (ameba.status.agentID != "" && Global.userlist[ameba.status.agentID].socket == undefined) {
                    ameba.status.agentID = "";
                    this.stateBuffer.agentBuffer[ameba.id] = "";
                }

                aliveAgents.forEach(aliveAgent => {
                    if (ameba.status.agentID != aliveAgent.ameba.userID)
                        return;
                    if (!Algebra.rectIntersect(ameba.status.aoe, aliveAgent.aoe)) {
                        ameba.status.agentID = "";
                        this.stateBuffer.agentBuffer[ameba.id] = "";
                    }
                })

                if (ameba.status.agentID == "") {
                    for (var i = 0; i < aliveAgents.length; i ++) {
                        if (Algebra.rectIntersect(ameba.status.aoe, aliveAgents[i].aoe)) {
                            var agent = aliveAgents[i].ameba;
                            ameba.status.agentID = agent.userID;
                            this.stateBuffer.agentBuffer[ameba.id] = agent.userID;
                            break;
                        }
                    }
                }
            }
            ameba.expect.paused = ameba.status.agentID == "" ? true : false;
        });
    }

    navigate() {
        // For AI bots,  decide where to go
        // And at the same time every bot try to turn its head around
        this.amebae.forEach(ameba => {
            if (ameba.status.paused && ameba.expect.paused)
                return;
            ameba.takeStep();
        });
        this.amebae.forEach(ameba => {
            if (ameba.status.paused)
                return;
            ameba.dinnerTime();
        });
        this.amebae.forEach(ameba => {
            if (ameba.status.paused)
                return;
            if (ameba.expect.length > ameba.status.length) {
                var offset = ameba.expect.length - ameba.status.length;
                offset = offset < 0.5 ? offset : 0.5;
                ameba.status.length += offset;
                this.stateBuffer.lengthBuffer[ameba.id] = ameba.status.length;
            }
            else if (ameba.expect.length < ameba.status.length) {
                var offset = ameba.status.length - ameba.expect.length;
                offset = offset < 0.5 ? offset : 0.5;
                ameba.status.length -= offset;
                this.stateBuffer.lengthBuffer[ameba.id] = ameba.status.length;
            }
            ameba.status.thickness = Misc.getRadius(ameba.status.length);
        });
    }

    report() {
        this.broadcast('obsolete', {
            eatenSparks : this.eatenSparks,
            deadAmebae : this.deadAmebae
        });

        this.broadcast('changes', {
            states : this.stateBuffer,
            steps : this.stepBuffer
        });

        this.broadcast('new', {
            amebae : this.newAIBots,
            sparks : this.newSparks
        })

        this.stateBuffer = {
            pauseBuffer : [],
            playBuffer : [],
            lengthBuffer : {},
            agentBuffer : {}
        };
        this.stepBuffer = {};
        this.eatenSparks = [];
        this.deadAmebae = [];
        this.newSparks = [];
        this.newAIBots = [];
    }

    newSpark(px, py, val) {
        var d = Math.sqrt(Math.random()) * (this.mapInfo.radius - 200), a = Math.random() * 360;
        this.sparks.push({
            pos : {
                x : px == undefined ? Math.cos(Math.PI / 180 * a) * d : px,
                y : py == undefined ? Math.sin(Math.PI / 180 * a) * d : py
            },
            value: val == undefined ? Math.random() * 3 : val
        });
    }

    newAIBot() {
        var newOne = new Bot(this);
        this.amebae.push(newOne);
    }

    rotate(ameba, angle) {
        ameba.expect.angle = angle;
    }

    rotateOne(detail) {
        this.amebae.forEach(ameba => {
            if (ameba.userID != detail.userID)
                return;
            ameba.expect.angle = Algebra.getArrowAngle(detail.angle, detail.distance, ameba.expect.angle);
            Communicator.sendCmd(detail.socket, 'arrowAngle', {
                angle : ameba.expect.angle
            })
        })
    }

    multiRotate(detail) {
        this.amebae.forEach(ameba => {
            if (!detail[ameba.id])
                return;
            ameba.expect.angle = detail[ameba.id];
        })
    }

    boost(detail) {
        this.amebae.forEach(ameba => {
            if (ameba.id == detail.id)
                ameba.expect.boost = detail.boost;
        })
    }

    leave(userID) {
        Object.keys(Global.userlist).forEach(uID => {
            var user = Global.userlist[uID];
            if (uID == userID) {
                user.roomNo = 0;
                Communicator.sendCmd(user.socket, 'leave');
            }
        })
    }

    // Misc functions
    getCurrentMoment() {
        // Calculate the elapsed time since the starting point of this room in milliseconds
        if (this.startingPoint == undefined)
            return 0;
        return new Date() - this.startingPoint;
    }

    broadcast(cmd, detail) {
        // Broadcast command to all bots in this room
        ServerJS.internalBroadcast(this.index, cmd, detail);
    }

    // Calculate the count of amebae
    getAmebaCount() { return this.amebae.length; }
    getUserCount() {
        var count = 0;
        this.amebae.forEach(ameba => {
            if (ameba.userID)
                count ++;
        })
        return count;
    }
    getBotCount() { return this.getAmebaCount() - this.getUserCount(); }

    // Methods for ranking
    getTopScores() {
        return [];
    }

    // Method for communication
    parseCmd(cmd, detail) {
        switch(cmd) {
        case 'rotate':
            this.rotateOne(detail);
            break;
        case 'direction':
            this.multiRotate(detail);
            break;
        case 'boost':
            this.boost(detail);
            break;
        case 'leave':
            this.leave(detail);
            break;
        case 'kill':
            console.log(detail.murderer);
            this.amebae.forEach(ameba => {
                if (ameba.id == detail.deadID)
                    this.killAmeba(ameba);
                if (ameba.id == detail.murderer)
                    console.log(ameba.status.agentID);
            })
            break;
        case 'aoe':
            Object.keys(detail).forEach(id => {
                this.amebae.forEach(ameba => {
                    if (ameba.id == id)
                        ameba.status.aoe = detail[id];
                })
            })
            break;
        case 'laySparks':
            detail.sparks.forEach(spark => {
                this.sparks.push(spark);
                this.newSparks.push(spark);
            })
            break;
        }
    }
}

module.exports = Room;
