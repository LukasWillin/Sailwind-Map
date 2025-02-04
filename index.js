(async function init() {
  /**
   * Needs to be initialised with grapics and layers.
   * @type {SailwindMap}
   */
  let sailwindMap = null;

  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GeoJSONLayer",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/widgets/CoordinateConversion"
  ], function (ArcGISMap, MapView, GeoJSONLayer, Graphic, GraphicsLayer, CoordinateConversion) {

    const labelBlob = new Blob([JSON.stringify(labels)], {
      type: "application/json"
    });
    const blob = new Blob([JSON.stringify(geojson)], {
      type: "application/json"
    });
    const gridBlob = new Blob([JSON.stringify(gridJson)], {
      type: "application/json"
    });
    const fGridBlob = new Blob([JSON.stringify(fineGrid)], {
      type: "application/json"
    });
    const edgeBlob = new Blob([JSON.stringify(edgeJson)], {
      type: "application/json"
    });



    let fGridRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line",  // autocasts as SimpleLineSymbol()
        color: [0, 0, 0, 0.9],
        style: 'long-dash-dot',
        width: .2
      }
    };
    let gridRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line",  // autocasts as SimpleLineSymbol()
        color: [0, 0, 0, .5],
        style: 'solid',
        width: 1
      }
    };
    let edgeRenderer = {
      type: "simple",
      symbol: {
        type: "simple-line",  // autocasts as SimpleLineSymbol()
        color: [0, 0, 0, .5],
        style: 'solid',
        width: 1.5
      }
    };
    let renderer = {
      type: "unique-value",  // autocasts as new UniqueValueRenderer()
      field: "Region",
      defaultSymbol: { type: "simple-fill" },  // autocasts as new SimpleFillSymbol()
      uniqueValueInfos: [{
        // All features with value of "North" will be blue
        value: "Emerald Archipelago",
        symbol: {
          type: "simple-fill",  // autocasts as new SimpleFillSymbol()
          color: "green"
        }
      }, {
        // All features with value of "East" will be green
        value: "Al'Ankh",
        symbol: {
          type: "simple-fill",  // autocasts as new SimpleFillSymbol()
          color: "orange"
        }
      }, {
        // All features with value of "South" will be red
        value: "Happy Bay",
        symbol: {
          type: "simple-fill",  // autocasts as new SimpleFillSymbol()
          color: "grey"
        }
      }, {
        // All features with value of "West" will be yellow
        value: "Aestrin",
        symbol: {
          type: "simple-fill",  // autocasts as new SimpleFillSymbol()
          color: "lightgreen"
        }
      }, {
        value: "City",
        symbol: {
          type: "simple-fill",
          color: "red"
        }
      }],
      visualVariables: [{
        type: "opacity",
        field: "POPULATION",
        normalizationField: "SQ_KM",
        // features with 30 ppl/sq km or below are assigned the first opacity value
        stops: [{ value: 100, opacity: 0.15 },
        { value: 1000, opacity: 0.90 }]
      }]
    };

    const labelClass = {
      // autocasts as new LabelClass()
      symbol: {
        type: "text",  // autocasts as new TextSymbol()
        color: "black",
        font: {  // autocast as new Font()
          family: "Playfair Display",
          size: 10,
          weight: "bold"
        }
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.name"
      }
    };
    const gridJsonUrl = URL.createObjectURL(gridBlob);
    const grid = new GeoJSONLayer({
      url: gridJsonUrl,
      renderer: gridRenderer
    });

    const fGridJsonUrl = URL.createObjectURL(fGridBlob);
    const fGrid = new GeoJSONLayer({
      url: fGridJsonUrl,
      renderer: fGridRenderer
    });
    const edgeJsonUrl = URL.createObjectURL(edgeBlob);
    const edgeGrid = new GeoJSONLayer({
      url: edgeJsonUrl,
      renderer: edgeRenderer
    });

    const geojsonUrl = URL.createObjectURL(blob);
    const layer = new GeoJSONLayer({
      url: geojsonUrl,
      renderer: renderer,
      labelingInfo: [labelClass]
    });

    const map = new ArcGISMap({
      layers: [layer, grid, edgeGrid, fGrid]
    });
    const view = new MapView({
      container: "viewDiv",
      map: map,
      center: [0, 35],
      zoom: 4
    });

    view.ui._removeComponents(["attribution"]);

    const ccWidget = new CoordinateConversion({
      view: view
    });
    view.ui.add(ccWidget, "bottom-left");

    edgeLayer = new GraphicsLayer();
    gridLayer = new GraphicsLayer();
    lineGraphicsLayer = new GraphicsLayer();
    graphicsLayer = new GraphicsLayer();

    map.add(edgeLayer);
    map.add(gridLayer);
    map.add(lineGraphicsLayer);
    map.add(graphicsLayer);

    point = {
      type: "point", // autocasts as new Point()
      longitude: 0,
      latitude: 0
    };
    polyline = {
      type: "polyline", // autocasts as new Polyline()
      paths: [[0, 0]]
    };

    // Create a symbol for drawing the point
    const markerSymbol = {
      type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
      style: "x",
      color: [226, 119, 40],
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: [255, 125, 0],
        width: 2
      }
    };

    let polylineSymbol = {
      type: "simple-line",  // autocasts as SimpleLineSymbol()
      color: [255, 255, 0],
      style: 'dash-dot',
      width: 2
    };

    polylineGraphic = new Graphic({
      geometry: polyline,
      symbol: polylineSymbol
    });

    pointGraphic = new Graphic({
      geometry: point,
      symbol: markerSymbol
    });

    view.graphics.add(polylineGraphic);
    view.graphics.add(pointGraphic);

    sailwindMap = new SailwindMap(polylineGraphic, lineGraphicsLayer, pointGraphic, graphicsLayer, []);

    sailwindMap.load();

    view.on("click", setCoordsFromClick);
  });

  //#region Event Handlers
  /**
   * Set coords when clicking on map.
   * @param {PointerEvent} event 
   */
  function setCoordsFromClick(event) {
    sailwindMap?.drawPoint(SailwindPoint.fromArcGisPoint(event.mapPoint));
  }

  /**
   * Event handler for map value inputs.
   */
  window.setCoordsFromInputs = function setCoordsFromInputs() {
    const latInputEl = document.getElementById("a");
    const longInputEl = document.getElementById("b");
    sailwindMap?.drawPoint(new SailwindPoint(latInputEl.value, longInputEl.value));
    latInputEl.value = null;
    longInputEl.value = null;
  };

  /**
   * Event handler to clear the whole map.
   */
  window.clearMap = function clearMap() {
    sailwindMap?.clear();
  }

  window.saveMap = function saveMap() {
    sailwindMap?.save();
  }

  window.endTrip = function endTrip() {
    sailwindMap?.endCurrentTrip();
  }
  //#endregion Event Handlers

  function toRadians(degrees) {
    return degrees * Math.PI / 180;
  };

  // Converts from radians to degrees.
  function toDegrees(radians) {
    return radians * 180 / Math.PI;
  }

  function bearing(startLat, startLng, destLat, destLng) {
    startLat = toRadians(startLat);
    startLng = toRadians(startLng);
    destLat = toRadians(destLat);
    destLng = toRadians(destLng);

    y = Math.sin(destLng - startLng) * Math.cos(destLat);
    x = Math.cos(startLat) * Math.sin(destLat) -
      Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    brng = Math.atan2(y, x);
    brng = toDegrees(brng);
    return (brng + 360) % 360;
  }
})();