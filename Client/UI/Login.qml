import QtQuick 2.10
import QtQuick.Controls 2.3
import QtQuick.Particles 2.0
import QtQuick.Controls.Material 2.2
import "."

Item {
    id: login
    anchors.fill: parent
    Material.theme: Material.Dark
    Material.accent: Material.Orange

    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: 'lightsteelblue' }
            GradientStop { position: 0.75; color: 'lightgray' }
            GradientStop { position: 1.0; color: 'gray' }
        }
    }

    Image {
        anchors.fill: parent
        source: "../images/back.png"
        fillMode: Image.PreserveAspectFit
    }

    Rectangle {
        anchors.centerIn: infoDialog
        width: infoDialog.width + 30
        height: infoDialog.height + 30
        color: '#3f000000'
        radius: 10
    }

    ParticleSystem {
        id: particles
        anchors.fill: parent

        ImageParticle {
            groups: ['center', 'edge']
            anchors.fill: parent
            source: 'qrc:///particleresources/glowdot.png'
            colorVariation: 0.1
            color: '#009999FF'
        }

        Emitter {
            anchors.top : parent.bottom
            width: parent.width
            height: 0

            group: 'center'
            emitRate: 0.5
            lifeSpan: 16000
            size: 40
            sizeVariation: 16
            endSize: 0
            //! [0]
            shape: LineShape {}
            velocity: PointDirection {
                xVariation: 2
                yVariation: 2
                y: - root.height / 20
            }
            //! [0]
        }

        Emitter {
            anchors.top : parent.bottom
            width: parent.width
            height: 0

            group: 'edge'
            startTime: 2000
            emitRate: 1
            lifeSpan: 16000
            size: 56
            sizeVariation: 16
            endSize: 32
            shape: LineShape {}
            velocity: PointDirection {
                xVariation: 2
                yVariation: 2
                y: - root.height / 20
            }
            acceleration: PointDirection {
                xVariation: 2
                yVariation: 2
            }
        }
    }

    Column {
        id: infoDialog
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 30
        spacing: 10
        width: 300

        Row {
            width: parent.width - 20
            spacing: 10
            Label {
                anchors.verticalCenter: parent.verticalCenter
                width: 80
                text : 'ID:'
                font.pointSize: 10
                font.bold: true
            }
            TextField {
                id: id
                width: parent.width - 90
                font.pointSize: 10
            }
        }

        Row {
            width: parent.width - 20
            spacing: 10
            Label {
                anchors.verticalCenter: parent.verticalCenter
                width: 80
                text : 'PASSWORD:'
                font.pointSize: 10
                font.bold: true
            }
            TextField {
                id: password
                width: parent.width - 90
                font.pointSize: 10
                echoMode: TextInput.Password
            }
        }

        Button {
            enabled: id.text != ''
            width: parent.width * 3 / 5
            anchors.horizontalCenter: parent.horizontalCenter
            text: 'Login'
            font.pointSize: 10
            font.bold: true

            onClicked: {
                login.login();
            }
        }
    }

    function login() {
        socket.sendCmd('info', { id : id.text });
        Global.lastSent = new Date();
    }

    function parseCmd(cmd, detail) {
        switch (cmd) {
        case 'error':
            break;
        case 'join':
            Global.temp = detail;
            Global.userInfo.roomNo = detail.roomNo;
            Global.userInfo.id = id.text
            root.getIn();
            break;
        }
    }
}
