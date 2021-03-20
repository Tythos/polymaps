/**
 * @author "Brian Kirkpatrick" <code@tythos.net>
 */

require(["polymaps-v2.5.1"], function(polymaps) {
    let map = polymaps.map();
    let svg = document.body.appendChild(polymaps.svg("svg"));
    map.container(svg);
    map.zoomRange([0, 9]);
    map.zoom(7);
    let layer = polymaps.image().url("http://s3.amazonaws.com/com.modestmaps.bluemarble/{Z}-r{Y}-c{X}.jpg");
    map.add(layer);
    map.add(polymaps.interact());
    map.add(polymaps.compass().pan("none"));
    console.log("done");
});
