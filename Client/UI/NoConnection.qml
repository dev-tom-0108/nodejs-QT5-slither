import QtQuick 2.10
import QtQuick.Controls 2.3

Item {
    anchors.fill: parent

    Rectangle {
        anchors.centerIn: inform
        width: inform.width + 40
        height: inform.height + 40
        color: '#1fffffff'
        radius: 20
    }

    Text {
        anchors.centerIn: parent
        width: parent.width / 2
        height: Math.min(parent.height / 2, 200)
        color: '#A07020'
        id: inform
        text : 'Can not find server!'
        font.family: 'Arial'
        textFormat: Text.AutoText
        font.pointSize: 30
        font.bold: true
        wrapMode: Text.WordWrap
    }
}
