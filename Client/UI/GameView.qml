import QtQuick 2.10
import QtQuick.Controls 2.3
import QtWebSockets 1.1
import QtGraphicalEffects 1.0
import "."

Item {
    id: gameView
    anchors.fill: parent

    property real camPosX: 0
    property real camPosY: 0
    property real arrowAngle: 0

    property bool finished;

    Logic {
        id: logic

        onDrawAmebae: {
            var idx;
            if (amebaList.count > nodes.length)
                amebaList.remove(nodes.length, amebaList.count - nodes.length);
            else
                for (idx = amebaList.count; idx < nodes.length; idx ++)
                    amebaList.append(nodes[idx]);
            for (idx = 0; idx < amebaList.count; idx ++)
                amebaList.set(idx, nodes[idx]);
        }

        onDrawSparks: {
            var idx;
            if (sparkList.count > sparks.length)
                sparkList.remove(sparks.length, sparkList.count - sparks.length);
            else
                for (idx = sparkList.count; idx < sparks.length; idx ++)
                    sparkList.append(sparks[idx]);
            for (idx = 0; idx < sparkList.count; idx ++)
                sparkList.set(idx, sparks[idx]);
        }

        onSetCamPos: {
            camPosX = cx;
            camPosY = cy;
        }
    }

    Image {
        id: background
        anchors.fill: parent
        source: '../images/mainBack.png'
        visible: true
    }

    Timer {
        id: drawTimer
        interval: 25
        running: true
        repeat: true
        triggeredOnStart: true
        onTriggered: updateScene()

        signal updateScene()
    }

    ListModel {
        id: amebaList
    }

    ListModel {
        id: sparkList
    }

    Repeater {
        id: sparkDrawerTop
        anchors.fill: parent
        model: sparkList

        Image {
            x: (pos.x - camPosX) + gameView.width / 2 - width / 2
            y: (pos.y - camPosY) + gameView.height / 2 - height / 2
            width: 20 * Math.sqrt(value)
            height: width
            opacity: 0.5
            source: "qrc:///particleresources/fuzzydot.png"
        }
    }

    Repeater {
        id: amebaDrawer
        anchors.fill: parent
        model: amebaList

        Item {
            x: (pos.x - camPosX) + gameView.width / 2
            y: (pos.y - camPosY) + gameView.height / 2
            Image {
                id: node
                x: - width / 2
                y: - height / 2
                source: head ? '../images/head1.png' : '../images/skin1.png'
                width: radius * (head ? 3 : 2)
                height: width
                fillMode: Image.Stretch
                rotation: angle
            }
        }
    }

    Sensor {
        anchors.fill: parent
        id: sensor
        enabled: !finished
        arrowAngle : gameView.arrowAngle
        onRotate: socket.sendCmd('rotate', {
                        userID : Global.userInfo.id,
                        distance : dist,
                        angle : angle
                    });
    }

    WorkerScript {
        id: aiRunner
        source: "BotAI.js"
        onMessage: {
            socket.sendCmd('direction', messageObject.dirs);
        }
    }

    function parseCmd(cmd, detail) {
        switch (cmd) {
        case 'new':
            if (detail.amebae) {
                detail.amebae.forEach(function (ameba) {
                    logic.amebae.push(ameba);
                })
            }
            if (detail.sparks) {
                detail.sparks.forEach(function (spark) {
                    logic.sparks.push(spark);
                })
            }
            break;
        case 'arrowAngle':
            gameView.arrowAngle = detail.angle;
            break;
        case 'kill':
            logic.amebae.forEach(function (ameba) {
                if (ameba.id === detail.id)
                {
                    if (ameba.userID === Global.userInfo.id)
                        finished = true;
                    logic.amebae.splice(logic.amebae.indexOf(ameba), 1);
                }
            })
            break;
        case 'leave':
            Global.userInfo.roomNo = 0;
            root.getIn();
            break;
        case 'changes':
            logic.reflectChanges(detail);
            break;
        case 'obsolete':
            logic.obsolete(detail);
            break;
        case 'aliveAmebae':
            logic.amebae.forEach(function (ameba) {
                if (detail.list[ameba.id] === undefined)
                    logic.amebae.splice(logic.amebae.indexOf(ameba), 1);
                else
                    ameba.status.paused = detail.list[ameba.id];
            })
            break;
        }
    }

    Component.onCompleted: {
        logic.startTime = new Date();
        Global.lastReceived = logic.startTime;
        Global.offsetMoment = (Global.lastReceived - Global.lastSent) + Global.temp.moment;

        logic.amebae = Global.temp.amebae;
        logic.sparks = Global.temp.sparks;

        logic.amebae.forEach(function (ameba) {
            if (ameba.userID === Global.userInfo.id)
                arrowAngle = ameba.status.angle;
        })

        drawTimer.updateScene.connect(logic.updateScene);
    }
}
