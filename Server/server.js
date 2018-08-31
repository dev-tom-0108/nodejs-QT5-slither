// Import others
var Global = require('./global.js');
var mysql = require('mysql');

conn = mysql.createConnection({
    host: "localhost",
    user: "wodebox_admin",
    password: "LE%XT9T8[^QT",
    database: "wodebox_ameba"
})

conn.connect(function(err) {
    if (err) {
        console.log("Cannot access database!");
        process.exit(0);
    }
    console.log("DB has been successfully connected!");
    var sql = "CREATE TABLE customers (id int AUTO_INCREMENT, uID Text, color Text, rate Boolean, name Text, PRIMARY KEY(id))";
    conn.query(sql, function (err, result) {
        if (err) console.log("Table \"customers\" alreay exists!");
        else console.log("Table \"customers\" created!");
    });
});

// This is the class to control the server
class Server {
    static init () {
        // Initialize the server
        setInterval(function () {
            // Inform the room status to players in the lobby
            var info = Server.getRoomInfo();
            Server.internalBroadcast(0, 'roomlist', info);
        }, 500)

        // Initially create 50 rooms
        for (var i = 0; i < 50; i ++)
            this.createRoom();
    }
    static createRoom() {
        // Create a room
        var newRoom = new RoomClass();
        Global.rooms.push(newRoom);
    }

    static getRoomInfo() {
        // Get information about rooms
        var info = [];
        Global.rooms.forEach(room => {
            info.push({
                id : room.index,
                roomNo : room.index,
                amebaCount : room.getAmebaCount(),
                userCount : room.getUserCount(),
                highest : room.getTopScores()
            });
        })
        return info;
    }

    static parseCmd(cmd, detail) {
        // If this user is not in lobby then let the room controller parse this command
        // Else the server handles it.
        var roomNo = Global.userlist[detail.id].roomNo;
        if (!roomNo)
            return;
        Global.rooms.forEach(room => {
            if (room.index == roomNo)
                room.parseCmd(cmd, detail);
        })
    }

    static joinGame(socket, detail) {
        var id = socket.id;
        var roomNo = detail.roomNo;
        var joined = false;
        
        Global.rooms.forEach(room => {
            if (room.index == roomNo && room.join(id))
                joined = true;
        })

        if (joined == false) {
            if (Global.rooms.length)
                Global.rooms[0].join(id);
            else
                Communicator.sendCmd(socket, 'error', {
                    type : 'non-exist',
                    description : 'no-room'
                });
        }
    }

    static fire(heathen) {
        // Remove disconnected player
        if (heathen.id != undefined)
            delete Global.userlist[heathen.id].socket;
    }

    static verify(socket, detail) {
        // Let a player to come in
        var exist = false;
        var personalInfo = this.signIn(detail);

        Object.values(Global.userlist).forEach(user => {
            if (user.id != detail.id)
                return;
            if (user.socket == undefined)
                return;
            Communicator.sendCmd(socket, 'error', {
                type : 'exist',
                description: 'same-id'
            });
            exist = true;
        });
        
        if (exist)
            return false;
        
        socket.id = detail.id;
        if (Global.userlist[detail.id] == undefined) {
            Global.userlist[detail.id] = {
                socket : socket,
                roomNo : 0
            }
        }
        else {
            Global.userlist[detail.id].socket = socket;
        }
    
        Global.userlist[detail.id].color = personalInfo.color;
        Global.userlist[detail.id].rate = personalInfo.rate;
        Global.userlist[detail.id].name = personalInfo.name;
        var roomNo = Global.userlist[detail.id].roomNo;

        // If it's first time this user connect or
        // were not disconnected unexpectedly then go to lobby
        // Else go to the room where you were
        if (roomNo == 0) {
            Communicator.sendCmd(socket, 'join', {
                roomNo : 0
            });
            return true;
        }
        Global.rooms.forEach(room => {
            if (room.index != roomNo)
                return;
            Communicator.sendCmd(socket, 'join', {
                roomNo : roomNo,
                mapInfo : room.mapInfo,
                amebae : room.amebae.map(function (ameba) {
                    return {
                        id : ameba.id,
                        userID : ameba.userID,
                        status : ameba.status,
                        track : ameba.track,
                        color: ameba.color,
                        name : ameba.name
                    };
                }),
                sparks : room.sparks,
                moment : room.getCurrentMoment()
            });
        })
        return true;
    }

    static broadcast(cmd, detail) {
        // Broadcast command to the players
        Object.values(Global.userlist).forEach(user => {
            Communicator.sendCmd(user.socket, cmd, detail)
        });
    }
    
    static internalBroadcast(roomNo, cmd, detail) {
        // Broadcast command to the players in a certain room
        Object.values(Global.userlist).forEach(user => {
            if (user.roomNo == roomNo)
                Communicator.sendCmd(user.socket, cmd, detail);
        })
    }

    static signIn(detail) {
        var uID = detail.id;
        var name = detail.name ? detail.name : "";
        var personalInfo = {};
        conn.query("SELECT * FROM customers", function(err, result, fields) {
            if (err || !result.length) {
                conn.query("INSERT INTO customers (uID, color, rate, name) VALUES ('" + uID + "', 'FFFFFF', false, '" + name + "')");
                personalInfo.uID = uID;
                personalInfo.color = "FFFFFF";
                personalInfo.rate = false;
                personalInfo.name = name;
            }
            else {
                // update personal data
                conn.query("UPDATE customers SET name = '" + name + "' WHERE uID = '" + uID + "'");

                personalInfo.uID = uID;
                personalInfo.color = result.color;
                personalInfo.rate = result.rate;
                personalInfo.name = name;
            }
        });
        return personalInfo;
    }

    static changeColor(uID, color) {
        Global.userlist[uID].color = color;
        conn.query("UPDATE customers SET color = '" + color + "' WHERE uID = '" + uID + "'");
    }

    static rateThis(uID) {
        Global.userlist[uID].rate = true;
        conn.query("UPDATE customers SET rate = true WHERE uID = '" + uID + "'");
    }

    static rating() {
        var rating;
        conn.query("SELECT * FROM customers WHERE rate = true", function(err, result, fields) {
            rating = result.length;
        })
        return rating;
    }
}

module.exports = Server;

var Communicator = require('./communicator.js');
var RoomClass = require('./room.js');