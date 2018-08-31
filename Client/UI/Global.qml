pragma Singleton
import QtQuick 2.0

QtObject {
    property var userInfo
    property var temp
    property var settings
    settings: {
        normalSpeed: 100
        boostSpeed: 300
    }

    property var lastSent
    property var lastReceived
    property var offsetMoment

    property var camPosX
    property var camPosY
    Component.onCompleted: {
        userInfo = {
            id : '',
            password : '',
            roomNo : 0
        }
    }
}
