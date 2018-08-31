import QtQuick 2.10
import QtQuick.Controls 2.3
import QtWebSockets 1.1
import "./UI"

ApplicationWindow {
    id: root
    visible: true
    width: 600
    height: 360

    Item {
        id: userInfo
    }

    Rectangle {
        anchors.fill: parent
        color: 'black'
    }

    Loader {
        id: viewer
        anchors.fill: parent
        property var nextSource;
        function toggle() {
            source = nextSource;
        }
    }

    WebSocket {
        id: socket
        active: true
        url: 'ws://ameba.wodebox.com:1337'

        onStatusChanged: {
            switch (status)
            {
            case WebSocket.Open:
                toggleUI('Login')
                break;
            case WebSocket.Closed:
                toggleUI('NoConnection')
                break;
            }
        }
        onTextMessageReceived: {
            var msg = JSON.parse(message);
            var cmd = msg.cmd;
            var detail = msg.detail;
            if (viewer.item.parseCmd !== undefined)
                viewer.item.parseCmd(cmd, detail);
        }
        function sendCmd(cmd, detail) {
            socket.sendTextMessage(JSON.stringify({ cmd : cmd, detail : detail }));
        }
    }

    Timer {
        interval: 5000
        repeat: true
        running: true
        onTriggered: {
            if (socket.status == WebSocket.Closed || socket.status == WebSocket.Error)
            {
                socket.active = false;
                socket.active = true;
            }
        }
    }

    function toggleUI(path) {
        viewer.nextSource = 'UI/' + path + '.qml';
        viewer.toggle();
    }

    function getIn() {
        if (Global.userInfo.roomNo === 0)
            toggleUI('Lobby');
        else toggleUI('GameView');
    }
}
