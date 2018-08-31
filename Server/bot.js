// Import others
var Misc = require('./misc.js');
var Global = require('./global.js');
var Algebra = require('./algebra.js');
var ServerJS = require('./server.js');

// This is the class to control a bot (human player and npc, both of them)
class Bot {
    constructor (room, id, info) {
        if (room == undefined) return;

        // Redefine member functions
        this.getCurrentMoment = room.getCurrentMoment.bind(room);

        // id is the ID of this bot in this room
        // userID is the ID of player, the owner of this bot
        // room is the object points the room
        // status is the status of this ameba
        this.id = ++ Global.botNo;
        this.userID = id;
        this.room = room;
        this.status = {};
        this.expect = {};

        // set personal informations about the owner of this bot
        if (info != undefined) {
            this.color = (info.color == undefined ? "FFFFFF" : info.color);
            this.name = (info.name == undefined ? "" : info.name);
        }
        else {
            this.color = Global.palette[Math.floor(Global.palette.length * Math.random())];
            this.name = Global.names[Math.floor(Math.random() * Global.names.length)];
        }

        // these tracks describes about the track of this bot
        this.track = [];

        // Join a player to this room
        this.status.paused = this.userID ? false : true;
        this.status.boost = false;
        this.expect.angle = (Math.random() - 0.5) * 360;
        this.status.angle = this.expect.angle;
        this.status.timestamp = this.getCurrentMoment();
        this.status.thickness = 0;
        this.status.agentID = this.userID ? this.userID : "";

        if (id == undefined)
            this.expect.length = 2900 * Math.random() + 10;
        else
            this.expect.length = 10;
        this.status.length = 10;

        var d = Math.sqrt(Math.random()) * (room.mapInfo.radius - 200), a = Math.random() * 360;

        // Inform player so that he can go on with this room
        this.track.push({
            x : Math.cos(Math.PI / 180 * a) * d,
            y : Math.sin(Math.PI / 180 * a) * d,
            range : 0,
            angle : this.status.angle
        })
        this.status.aoe = {
            top: this.track[0].y,
            left: this.track[0].x,
            right: this.track[0].x,
            bottom: this.track[0].y
        }
        this.status.headPos = this.track[0];

        this.expect.boost = false;
        this.expect.paused = this.userID ? false : true;
    }

    takeStep() {
        if (this.status.paused == false && this.expect.paused == true) {
            this.room.stateBuffer.pauseBuffer.push(this.id);
        }
        if (this.status.paused == true && this.expect.paused == false) {
            this.status.timestamp = this.getCurrentMoment();
            this.room.stateBuffer.playBuffer.push({
                id : this.id,
                timestamp : this.status.timestamp
            });
            this.status.paused = this.expect.paused;
        }
        // Let this bot try to turn its head to where it's gonna go
        var dA = Algebra.getDeltaAngle(this.status.angle, this.expect.angle);

        if (dA == 0 && this.status.boost == this.expect.boost && !(this.status.paused == false && this.expect.paused == true)) {
            return;
        }

        // measure delta angle and it's limit
        var s = dA > 0 ? 1 : -1;
        dA = Math.abs(dA);
        var limit = 150 / Misc.getRadius(this.status.length);

        var newTrack = {
            pos : this.status.headPos,
            angle : Algebra.correctAngle(this.status.angle + s * (dA > limit ? limit : dA)),
            boost : this.expect.boost,
            timestamp : this.getCurrentMoment()
        };

        var range = Algebra.distBetween(newTrack.pos, this.track[0]);
        this.track[0].range = range;

        this.status.angle = newTrack.angle;
        this.status.timestamp = newTrack.timestamp;
        this.status.boost = newTrack.boost;
        this.track.unshift(newTrack.pos);
        this.room.stepBuffer[this.id] = newTrack;

        this.status.paused = this.expect.paused;
    }
    
    calcHeadPos() {
        // calculate head position
        var timeOffset = (this.room.getCurrentMoment() - this.status.timestamp) / 1000;
        var curSpeed = this.status.boost ? this.room.mapInfo.boostSpeed : this.room.mapInfo.normalSpeed;
        this.status.headPos = {
            x: this.track[0].x + Math.sin(Math.PI / 180 * this.status.angle) * curSpeed * timeOffset,
            y: this.track[0].y - Math.cos(Math.PI / 180 * this.status.angle) * curSpeed * timeOffset,
            angle: this.status.angle
        }
    }

    dinnerTime() {
        for (var idx = this.room.sparks.length - 1; idx >= 0; idx --) {
            if (Algebra.distBetweenP(this.status.headPos, this.room.sparks[idx].pos) < this.status.thickness * this.status.thickness * 2.25) {
                this.expect.length += this.room.sparks[idx].value;
                if (!this.userID && this.expect.length > 3000)
                    this.expect.length = 3000;
                this.room.eatenSparks.push(this.room.sparks[idx]);
                this.room.sparks.splice(idx, 1);
            }
        }
    }

    simplifyTrack() {
        var idx = 0;
        var length = this.status.length;
        var radius = Misc.getRadius(length);
        this.status.thickness = radius;
        var nodeCnt = Misc.getNodeCount(length);
        var dist = Misc.getDistFromRadius(radius);

        var pos0 = this.status.headPos, pos1 = this.track[0];
        var tempMeter = dist * (nodeCnt - 1);
        var nDist = Algebra.distBetween(pos0, pos1);

        while (tempMeter > nDist) {
            tempMeter -= nDist;
            idx ++;
            if (idx == this.track.length)
                break;
            pos0 = this.track[idx - 1];
            pos1 = this.track[idx];
            nDist = pos1.range;
        }

        this.track.splice(idx + 1, this.track.length - idx - 1);
    }
}

module.exports = Bot;