// Import others
var Communicator = require('./communicator.js');
var fs = require('fs');

// Container to store assets
var assets = {};

// List of assets that will be loaded
var assetNames = [
    'images/arrow.png',
    'images/back-pattern.jpg',
    'images/head1.png',
    'images/skin1.png',
    'sounds/background.mp3',
    'sounds/background2.mp3',
    'sounds/Click in game.mp3',
    'sounds/When countdown starts to revive.mp3',
    'sounds/when someone dies.mp3',
    'sounds/when someone press GO FAST.wav'
]

// load assets to memory
assetNames.forEach(asset => {
    fs.readFile('assets/' + asset, function (err, data) {
        addAsset(asset.split('.').pop(), asset, data.toString('base64'));
    })
})

function addAsset(type, name, data) {
    switch (type)
    {
        case 'png':
            assets[name] = 'data:image/png;base64,' + data;
            break;
        case 'jpg':
            assets[name] = 'data:image/jpeg;base64,' + data;
            break;
        case 'mp3':
            assets[name] = 'data:audio/mpeg;base64,' + data;
            break;
        case 'wav':
            assets[name] = 'data:audio/wav;base64,' + data;
            break;
    }
}

// Methods for external operations for assets
function downloadAssets(socket) {
    Communicator.sendCmd(socket, 'assets', assets);
}

function downloadAsset(socket, url) {
    Communicator.sendCmd(socket, 'asset', assets[url]);
}

module.exports = {
    downloadAssets : downloadAssets,
}
