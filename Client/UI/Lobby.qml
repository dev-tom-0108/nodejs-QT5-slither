import QtQuick 2.10
import QtQuick.Controls 2.3
import QtGraphicalEffects 1.0
import "."

Item {
    anchors.fill: parent
    ListModel {
        id: roomlist
    }
    GridView {
        anchors.fill: parent
        cellWidth: 140; cellHeight: 160
        model: roomlist
        delegate: Item {
            width: 140
            height: 160

            Item {
                anchors.centerIn: parent
                width: 100
                height: 120
                Image {
                    id: liquid
                    visible: false
                    source: "../images/beaker-liquid.png"
                }
                HueSaturation {
                    anchors.fill: liquid
                    source: liquid
                    hue: ((roomNo - 1) * 60 % 255) / 255
                }
                Image {
                    source: "../images/beaker-bottle.png"
                }

                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        socket.sendCmd('join', { roomNo : roomNo });
                        Global.lastSent = new Date();
                    }
                }
            }
        }
    }

    function refreshList(rooms) {
        var idx;
        var count = rooms.length;

        if (roomlist.count > rooms.length)
            roomlist.remove(rooms.length, roomlist.count - rooms.length);
        else
            for (idx = roomlist.count; idx < rooms.length; idx ++)
                roomlist.append(rooms[idx]);
        for (idx = 0; idx < roomlist.count; idx ++)
            roomlist.set(idx, rooms[idx]);
    }

    function parseCmd(cmd, detail) {
        switch (cmd) {
        case 'roomlist':
            refreshList (detail)
            break;
        case 'join':
            Global.temp = detail;
            Global.userInfo.roomNo = detail.roomNo;
            root.getIn();
            break;
        }
    }
}
