import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
import vtkAnnotatedCubeActor from 'vtk.js/Sources/Rendering/Core/AnnotatedCubeActor';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import vtkImageStream from 'vtk.js/Sources/IO/Core/ImageStream';
import SmartConnect from 'wslink/src/SmartConnect';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.2, 0.2, 0.2, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const body = document.querySelector('body');
body.style.margin = 0;
body.style.padding = 0;

const imageContainer = document.querySelector('.content');
imageContainer.style.position = 'absolute';
imageContainer.style.height = '100vh';
imageContainer.style.width = '100vw';

// ----------------------------------------------------------------------------
// Remote rendering setup
// ----------------------------------------------------------------------------

const imgRenderer = new Image();
imageContainer.appendChild(imgRenderer);
imgRenderer.style.width = '100%';
imgRenderer.style.height = '100%';

const imageStream = vtkImageStream.newInstance();
const config = { sessionURL: 'ws://0.0.0.0:1234/ws' };
const smartConnect = SmartConnect.newInstance({ config });
smartConnect.onConnectionReady((connection) => {
  // Network
  const session = connection.getSession();

  // Image
  imageStream.connect(session);
  const viewStream = imageStream.createViewStream('-1', [
    window.innerWidth,
    window.innerHeight,
  ]);
  viewStream.onImageReady((event) => {
    imgRenderer.src = event.image.src;
  });

  viewStream.setInteractiveQuality(80);
  viewStream.setInteractiveRatio(1);
  viewStream.setCamera(renderer.getActiveCamera());
  viewStream.pushCamera();

  // Bind user input
  renderWindow.getInteractor().onStartAnimation(viewStream.startInteraction);
  renderWindow.getInteractor().onEndAnimation(viewStream.endInteraction);
});

smartConnect.onConnectionError(console.error);
smartConnect.onConnectionClose(console.error);
smartConnect.connect();

// ----------------------------------------------------------------------------
// Local rendering setup
// ----------------------------------------------------------------------------

// create cone
const coneSource = vtkConeSource.newInstance();
const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();

actor.setMapper(mapper);
mapper.setInputConnection(coneSource.getOutputPort());

actor.getProperty().setRepresentation(1);
actor.getProperty().setColor(0, 0, 0);
actor.getProperty().setInterpolationToFlat();

renderer.addActor(actor);

const axes = vtkAnnotatedCubeActor.newInstance();
axes.setDefaultStyle({
  text: '+X',
  fontStyle: 'bold',
  fontFamily: 'Arial',
  fontColor: 'black',
  fontSizeScale: (res) => res / 2,
  faceColor: '#0000ff',
  faceRotation: 0,
  edgeThickness: 0.1,
  edgeColor: 'black',
  resolution: 400,
});
// axes.setXPlusFaceProperty({ text: '+X' });
axes.setXMinusFaceProperty({
  text: '-X',
  faceColor: '#ffff00',
  faceRotation: 90,
  fontStyle: 'italic',
});
axes.setYPlusFaceProperty({
  text: '+Y',
  faceColor: '#00ff00',
  fontSizeScale: (res) => res / 4,
});
axes.setYMinusFaceProperty({
  text: '-Y',
  faceColor: '#00ffff',
  fontColor: 'white',
});
axes.setZPlusFaceProperty({
  text: '+Z',
  edgeColor: 'yellow',
});
axes.setZMinusFaceProperty({ text: '-Z', faceRotation: 45, edgeThickness: 0 });

// create orientation widget
const orientationWidget = vtkOrientationMarkerWidget.newInstance({
  actor: axes,
  interactor: renderWindow.getInteractor(),
});
orientationWidget.setEnabled(true);
orientationWidget.setViewportCorner(
  vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
);
orientationWidget.setViewportSize(0.15);
orientationWidget.setMinPixelSize(100);
orientationWidget.setMaxPixelSize(300);

renderer.resetCamera();
renderWindow.render();

global.renderWindow = renderWindow;