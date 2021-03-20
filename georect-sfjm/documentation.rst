Documentation
=============

Polymaps is a JavaScript library for generating “slippy” maps in the style of
Google Maps, Modest Maps, CloudMade and OpenLayers.

Most mapping libraries focus on 256×256-pixel image tiles, with only limited
support for dynamic overlays such as county boundaries and point clouds. These
libraries assume that data needed to produce the desired overlay can be loaded
into memory all-at-once, making it difficult to visualize large datasets.
Furthermore, while image tiles automatically adjust in resolution as the map
zooms in or out, the overlay resolution remains constant; this greatly limits
multi-scale exploration of data, as the resolution must be fixed either
for macro- (e.g., state-level) or micro- (e.g., block-level) observation.

The goal of Polymaps is to better support rich, large-scale data overlays on
interactive maps by extending the tile metaphor to vector graphics: in addition
to standard image tiles, Polymaps supports vector tiles that are rendered with
SVG. The vector geometry is loaded as GeoJSON via asynchronous XMLHttpRequest;
Point geometry objects are rendered as SVG circle elements, Polygons as paths,
and so on. By loading geometry at known tile boundaries, requests can be issued
efficiently on-demand by the client, and responses trivially cached on the
server. When the user zooms in, geometry can be seamlessly refined to show
greater detail, while on zoom out, geometry can be simplified to improve
performance.

Why SVG?
--------

Polymaps is designed from the ground up to use Scalable Vector Graphics.
Existing libraries are hamstrung by the need to support antiquated browsers, in
particular IE6. By standardizing on SVG, Polymaps allows powerful graphical
operations, such as geometric transforms, compositing, and image processing.
SVG allows styling to be applied via CSS, which simplifies development and
allows the use of CSS3 transitions and animation. In contrast to HTML5 Canvas,
SVG facilitates interaction through event handlers, :hover psuedo-classes, and
tooltips.

Maps should be Easy
-------------------

Each Polymap starts with a map instance. But before we can construct a map, we
typically “import” the Polymaps namespace into a short-named local variable for
convenience::

> var po = org.polymaps;

The exact name chosen (po, here) is at the developer’s discretion and can be
changed to avoid collisions with other libraries. Polymaps does not define
anything outside of its namespace.

A map instance be retrieved via the constructor::

> var map = po.map();

Note that Polymaps does not use traditional JavaScript constructors; the new
operator is unused. Instead, Polymaps provides factory methods which construct
the necessary objects internally. This makes the code slightly shorter, and
slightly faster through the use of object literals. And most importantly,
Polymaps uses private members to hide internal state; this makes the API more
robust and forward-compatible.

Polymaps makes extensive use of method chaining, as popularized by jQuery. All
methods on the map instance return the map instance, this. Thus, we can take
our bare map instance, insert it into a new SVG element in the document body,
and then add an image tile layer::

> var map = po.map()
>   .container(document.body.appendChild(po.svg("svg")))
>   .add(po.image().url(...));

Here po.svg is a convenience method for constructing SVG elements with the
given tag name. This avoids specifying the horribly verbose namespace::

> document.createElementNS("http://www.w3.org/2000/svg", "svg");

When passed with no arguments, Polymaps methods return the value of the
associated field, rather than the instance. This allows the method to serve
both as a setter and a getter::

> map.container(); // returns SVGSVGElement

Whenever possible, Polymaps objects have reasonable defaults, reducing the
amount of boilerplate code needed to instantiate a map. For example, if the
size of the map is not specified, it is automatically inferred from the map’s
container element. If the container is resized, the map automatically resizes
itself accordingly. On the other hand, maps should be easily customizable, so
Polymaps does not install any default layers or controls.

Maps Consist of Layers
----------------------

In the simplest case, a map only has a single image layer; more generally, maps
can consist of multiple layers that are drawn in-order from back to front (the
Painter’s algorithm). So, if we want to use a background grid behind the map
that is visible before any image tiles load, we can simply insert a new image
layer::

> var map = po.map()
>     .container(document.body.appendChild(po.svg("svg")))
>     .add(po.image().url("grid.png"))
>     .add(po.image().url(...));

Layers also use method chaining, allowing the layer to be configured while
simultaneously adding it to the map. Layer URLs can either be static (as in the
case of a background grid), or dynamic. URL templates are specified using
substitution variables, as in Modest Maps. The allowed parameters are::

* {X} - coordinate column.

* {Y} - coordinate row.

* {B} - bounding box.

* {Z} - zoom level.

* {S} - host.

The first two parameters specify Google-style tile coordinates; see
"maptiler.org" for more information. As an alternative, the {B} parameter
specifies the tile bounds in latitude and longitude. The argument to the url
method can alternatively be specified as a function, allowing the developer to
override how tile coordinates are encoded in the URL.

The syntax for adding a GeoJSON layer is similar to that for adding an image
layer, except the geoJson constructor is used instead::

> var map = po.map()
>     .container(document.body.appendChild(po.svg("svg")))
>     .add(po.image().url(...))
>     .add(po.geoJson().url(...));

Layers can be customized beyond the URL. The size of both image and GeoJSON
tiles can be changed; the default tile size is 256×256. Sizes must be powers of
two. Layers can have an optional id; this allows trivial styling of paths
through CSS. For example, to use a thick white stroke for U.S. state
boundaries, assign the layer the ID “state”, then define a selector for
contained path elements::

> #state path {
>   stroke: #fff;
>   stroke-width: 1.5px;
>   vector-effect: non-scaling-stroke;
> }

Clipping, enabled by default for GeoJSON tiles, can be disabled via
clip(false). Clipping allows the GeoJSON data to bleed outside the tile
bounding box, rather than requiring the server to cut feature geometry to tile
boundaries. However, with point features, clipping is unusually not desired.

For smaller datasets, it may be desirable to load the dataset statically. In
this case, the GeoJSON layer’s data can be specified using the features method:

> var map = po.map()
>     .container(document.body.appendChild(po.svg("svg")))
>     .add(po.geoJson().features(data));

Specifying the data statically results in a world-sized GeoJSON tile. In
addition, changing the zoom level causes the data to be reprojected immediately
without an additional request to the server. This mechanism is also useful to
integrate with data sources (not just static files) that do not support
bounding box filters.

Maps Are Not Controls
---------------------

Polymaps does not mandate any interaction behavior on new map instances. Maps
are non-interactive by default, and several standard interaction controls are
provided for optional binding. To use the default controls, specify interact::

> var map = po.map()
>     .container(document.body.appendChild(po.svg("svg")))
>     .add(po.image())
>     .add(po.interact());

This is shorthand for several separate controls::

> var map = po.map()
>     .container(document.body.appendChild(po.svg("svg")))
>     .add(po.image())
>     .add(po.arrow())
>     .add(po.drag())
>     .add(po.dblclick())
>     .add(po.wheel());

The arrow control registers key listeners that pan the map when arrow keys are
pressed, and zoom in and out with plus and minus. (As an implementation detail,
the arrow control listens to keyup and keydown events, such that multiple arrow
keys can be depressed simultaneously while panning.) The drag control adds
mouse listeners so that the map can be panned by dragging. The dblclick control
listens for its mouse event, and zooms in on the corresponding location.
Lastly, the wheel event zooms in and out when the mouse wheel is turned.

Another example control is hash, which reads and writes the map’s center and
zoom to the location hash (a.k.a. fragment). This can be added to the map with
one line::

> var map = po.map()
>     .container(document.body.appendChild(po.svg("svg")))
>     .add(po.image())
>     .add(po.interact())
>     .add(po.hash());

The hash control initializes the map center and zoom by looking at the location
hash on load. Additionally, in registers an event listener on the map for move
events; when the map is panned or zoomed, the hash control updates the location
hash accordingly.

Controls can also be visible. The compass control adds a user interface widget
to the map’s container element, providing visual controls for panning and
zooming. The compass control similarly listens to the map for zooming to update
the displayed zoom level::

> var map = po.map()
>     .container(document.body.appendChild(po.svg("svg")))
>     .add(po.image())
>     .add(po.interact())
>     .add(po.hash())
>     .add(po.compass());

Note that because the compass control lives in the SVG element, the corners of
the circles are not dead spots as they are in Google Maps. Instead, any events
within the circle are handled by the compass control, while events outside the
circle are handled by the underlying map.

Maps Are Dynamic
----------------

While image tiles are generally served as-is, GeoJSON tiles present additional
requirements for data visualization: geometry objects typically need to be
styled dynamically on the client. For instance, a symbol map might need to
color points by some categorical variable (such as crime); similarly, a
choropleth map requires setting the fill color of area boundaries.

To make matters more complicated, if geometry is loaded on-demand as tiles, the
set of all geometry objects is not available up-front for initial styling.
Instead, geometry objects need to be styled as they are displayed to the user.
Styles may also change over time, or with interaction; consider for instance
changing the radius or visibility of circles, or similarly shifting the color
of areas in a choropleth map, based on some temporal window. The developer
needs a way to access the currently-visible geometry objects (and data) to
update the style.

GeoJSON tiles can be styled dynamically by listening for events. When a GeoJSON
tile is added to the map, the associated data is loaded asynchronously; when
the server returns, a “load” event is dispatched to interested handlers. An
event handler can be registered using on, passing in the type of event and the
callback function::

> var map = po.map()
>     .container(document.body.appendChild(po.svg("svg")))
>     .add(po.geoJson().url(...).on("load", load))
>     .add(po.interact());

When events are dispatched, the callback function is invoked with similar semantics to standard W3C DOM events: the this context is the map instance, and the single argument is the current event, with a type attribute and associated event metadata. The event’s tile attribute contains the coordinate of the tile, in terms of column, row and zoom. The tile.key stores a unique string for each tile (as "zoom/column/row"), for convenient storage of tile-specific data in an object hash.

The load event has a features array, with an entry for each GeoJSON feature object. The data attribute points to the feature object, while the element is a reference to the SVG element corresponding to the feature. A MultiPolygon is rendered as a path element, for example. A trivial example of styling is to create a title tooltip using the feature ID:

function load(e) {
  for (var i = 0; i < e.features.length; i++) {
    var feature = e.features[i];
    feature.element.appendChild(po.svg("title")
        .appendChild(document.createTextNode(feature.data.id))
        .parentNode);
  }
}

Load events are only triggered for new tiles when data becomes available; if the tile is retrieved from the cache, no load event is dispatched. This guarantee avoids multiple tooltips for each feature in the above example.

The “show” event is similar to the load event, except that show events are dispatched every time a tile is displayed, regardless of whether the tile was retrieved from the cache or fetched from the server. Show events are dispatched immediately when the tile is displayed, which may be before the tile is loaded; in this case, the features array is empty. Show events can also be triggered manually for all visible tiles using reshow() on the given layer. This allows whatever styling logic to be reapplied on-demand, for example on user interaction or animation timer. Note that the same event handler can be registered for both load and show events, if needed.
Maps should be Fast

Interactive maps must be fast for a satisfying user experience! Polymaps employs several standard strategies to improve performance.

Tiles are cached so that if a recent tile is needed again, the tile can be retrieved from the cache rather than waiting for a server round-trip. The SVG element for the tile is cached as-is, which means that re-displaying a cached tile is always fast (and consistent) for both GeoJSON and image tiles. The cache stores a priority queue of tiles sorted by access time, so that the least recently-used tiles can be flused from the cache when it overflows.

If a tile is not available in the cache, tiles at adjacent zoom levels may be temporarily rescaled until the tile is available. This provides smooth continuity while zooming and panning. The map will downscale tiles from higher zoom levels, up to +2, and upscale tiles from lower zoom levels, down to -4. When the tile is finally available, rescaled tiles are immediately removed from the map. For smooth zooming, the map loads tiles at the closest integral zoom level, and the layer is transformed using a uniform scale. (Non-scaling strokes are useful for maintaining stroke widths while zooming.)

Requests to load tiles are queued such that currently-visible tiles take priority over other (recent) tiles that are no longer visible. This is accomplished by limiting the number of simultaneous requests (8), and re-ordering the queue for requests that are not yet processed. The map can even abort active requests for tiles to grant priority to new tiles, if needed.
