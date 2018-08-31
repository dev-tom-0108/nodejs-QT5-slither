import QtQuick 2.10
import "."

MouseArea {
    anchors.fill: parent

    property var mousePos;
    property real count;
    property var arrowAngle;

    signal rotate(real dist, real angle)

    onPressed: {
        count = 0;
        mousePos = { 'x' : mouse.x, 'y' : mouse.y };
    }
    onPositionChanged: {
        if (++ count)
        {
            var now = { 'x' : mouse.x, 'y' : mouse.y };
            var vec = { 'x' : now.x - mousePos.x, 'y' : now.y - mousePos.y};
            var dist = Algebra.distBetween(now, mousePos);
            if (dist === 0)
                return;
            vec.x /= dist;
            vec.y /= -dist;
            var angle = (vec.x >= 0 ? 1 : -1) * Math.acos(vec.y) * 180 / Math.PI;
            rotate(dist, angle);

            count = 0;
            mousePos = now;
        }
    }

    onPressedChanged: {
        if (pressed)
            arrow.formatDelta();
        else
            arrow.startAnim();
    }

    Item {
        id: arrow
        anchors.centerIn: parent
        property real delta: 0.0;

        NumberAnimation on delta {
            id: animator
            running: false
            from: 1.0
            to: 0.0
            duration: 250
        }
        function formatDelta()
        {
            animator.running = false;
            delta = 1.0;
        }

        function startAnim()
        {
            animator.running = false;
            animator.start();
        }

        Image {
            source: '../images/arrow.png'
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.bottom: parent.top
            anchors.bottomMargin: 50 - parent.delta * 20
            opacity: parent.delta
            mipmap: true

            width: 20
            height: 20
            fillMode: Image.Stretch
        }

        rotation: arrowAngle
    }
}
