import './style.css'
import * as THREE from 'three'
// __controls_import__
// __gui_import__

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as dat from 'lil-gui'
import data from './data.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import fontToLoad from 'three/examples/fonts/helvetiker_bold.typeface.json?url'
import { gsap } from 'gsap'

let loadedFont = null

const uniforms = {
	uTime: { value: 0 },
}

/**
 * Debug
 */
// __gui__
const configs = {
	example: 5,
}
const gui = new dat.GUI()
// gui.add(configs, 'example', 0, 10, 0.1).onChange((val) => console.log(val))

// Add GUI inputs for each column of the year 2024
const year2024 = data.find((d) => d.year === 2024)
year2024.columns.forEach((column, index) => {
	gui
		.add(column, 'value')
		.name(column.title)
		.onFinishChange((val) => {
			const bar = scene.getObjectByName(`bar-2024-${index}`)
			console.log(bar, `bar-2024-${index}`)
			const newHeight = Math.max(0.05, ((column.scale * val) / 100) * 5)
			gsap.to(bar.scale, {
				y: newHeight / bar.geometry.parameters.height,
				duration: 1,
			})
			gsap.to(bar.position, {
				y: newHeight / 2,
				duration: 1,
				onComplete: () => {
					// Add 3D text for column value
					const valueTextGeometry = new TextGeometry(column.value.toString(), {
						font: loadedFont,
						size: 0.2,
						depth: 0.05,
					})
					valueTextGeometry.computeBoundingBox()
					const valueTextWidth =
						valueTextGeometry.boundingBox.max.x -
						valueTextGeometry.boundingBox.min.x
					const valueTextMaterial = new THREE.MeshStandardMaterial({
						color: 'white',
					})
					const valueTextMesh = new THREE.Mesh(
						valueTextGeometry,
						valueTextMaterial
					)
					valueTextMesh.position.set(
						bar.position.x - valueTextWidth / 2,
						newHeight + 0.2,
						0
					)
					chartGroup.add(valueTextMesh)
				},
			})
		})
})

/**
 * Scene
 */
const scene = new THREE.Scene()
scene.fog = new THREE.Fog(0x000000, 10, 50) // Add fog to the scene
scene.background = new THREE.Color(0x000000)

// __box__
/**
 * BOX
 */
// const material = new THREE.MeshNormalMaterial()
// const material = new THREE.MeshStandardMaterial({ color: 'coral' })
// const geometry = new THREE.BoxGeometry(1, 1, 1)
// const mesh = new THREE.Mesh(geometry, material)
// mesh.position.y += 0.5
// scene.add(mesh)

// __floor__
/**
 * Plane
 */
// const groundMaterial = new THREE.MeshStandardMaterial({ color: 'lightgray' })
// const groundGeometry = new THREE.PlaneGeometry(10, 10)
// groundGeometry.rotateX(-Math.PI * 0.5)
// const ground = new THREE.Mesh(groundGeometry, groundMaterial)
// scene.add(ground)

/**
 * render sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

/**
 * Camera
 */
const fov = 75
const camera = new THREE.PerspectiveCamera(fov, sizes.width / sizes.height, 0.1)
camera.position.set(0, 4, 6)
// camera.lookAt(new THREE.Vector3(0, 2.5, 0))

/**
 * Show the axes of coordinates system
 */
// __helper_axes__
const axesHelper = new THREE.AxesHelper(3)
// scene.add(axesHelper)

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer({
	antialias: window.devicePixelRatio < 2,
	logarithmicDepthBuffer: true,
})
document.body.appendChild(renderer.domElement)
handleResize()

/**
 * OrbitControls
 */
// __controls__
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 2.5, 0)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
directionalLight.position.set(3, 10, 7)
scene.add(ambientLight, directionalLight)

/**
 * Three js Clock
 */
// __clock__
const clock = new THREE.Clock()

/**
 * Create 3D Chart
 */

const particlesMaterial = new THREE.ShaderMaterial({
	fragmentShader: /*glsl */ `
			void main() {
				gl_FragColor = vec4(1.0, 1.0, 1.0, 0.3);
			}
		`,
	vertexShader: /*glsl */ `
			attribute float velocity;
			uniform float uTime;

			void main() {
				vec4 worldPosition = modelMatrix * vec4(position, 1.0);
				float dist = distance(worldPosition.xyz, cameraPosition);
				worldPosition.y += sin(uTime * 0.1 + worldPosition.x + velocity * 2.) * velocity * 3.;
				gl_Position = projectionMatrix * viewMatrix * worldPosition;
				gl_PointSize = (2. + 3.5 * sin(uTime + velocity * 100.)) * smoothstep(50.,0.,dist);
			}
		`,
	uniforms: {
		uTime: uniforms.uTime,
	},
	transparent: true,
})

const buttons = []
const chartGroup = new THREE.Group()
const colGap = 200

function create3DChart(data) {
	const barWidth = 0.5
	const barDepth = 0.5
	const maxBarHeight = 5
	const minBarHeight = 0.05
	const gap = 0.3

	const colors = [
		'skyblue',
		'lightgreen',
		'skyblue',
		'coral',
		'lightgreen',
		'gold',
		'purple',
		'orange',
		'pink',
		'cyan',
		'magenta',
	]

	const fontLoader = new FontLoader()
	fontLoader.load(fontToLoad, (font) => {
		loadedFont = font
		data.forEach((yearData, yearIndex) => {
			const yearGroup = new THREE.Group()
			yearData.columns.forEach((column, columnIndex) => {
				const barHeight = Math.max(
					minBarHeight,
					((column.scale * column.value) / 100) * maxBarHeight
				)
				const geometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth)
				const material = new THREE.MeshStandardMaterial({
					color: colors[yearIndex % colors.length],
				})
				const bar = new THREE.Mesh(geometry, material)
				bar.name = `bar-${yearData.year}-${columnIndex}`
				console.log(bar.name)
				bar.position.set(
					columnIndex * (barWidth + colGap) +
						yearIndex * (barWidth + gap) -
						(data.length * (barWidth + gap) - gap) / 2 +
						barWidth / 2,
					barHeight / 2,
					0
				)
				yearGroup.add(bar)

				// Add 3D text for column title
				if (yearIndex === 0) {
					const textGeometry = new TextGeometry(column.title, {
						font: font,
						size: 10,
						depth: 4,
					})
					// textGeometry.rotateX(-Math.PI / 2)

					textGeometry.computeBoundingBox()
					const textWidth =
						textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x
					const textMaterial = new THREE.MeshStandardMaterial({
						color: 0x222233,
					})
					const textMesh = new THREE.Mesh(textGeometry, textMaterial)
					textMesh.position.set(
						columnIndex * (barWidth + colGap) - textWidth / 2,
						0,
						-30
					)
					yearGroup.add(textMesh)

					const valueTextGeometry = new TextGeometry(column.value.toString(), {
						font: font,
						size: 0.2,
						depth: 0.05,
					})
					valueTextGeometry.computeBoundingBox()
					const valueTextWidth =
						valueTextGeometry.boundingBox.max.x -
						valueTextGeometry.boundingBox.min.x
					const valueTextMaterial = new THREE.MeshStandardMaterial({
						color: 'white',
					})
					const valueTextMesh = new THREE.Mesh(
						valueTextGeometry,
						valueTextMaterial
					)
					valueTextMesh.position.set(
						bar.position.x - valueTextWidth / 2,
						barHeight + 0.2,
						0
					)
					yearGroup.add(valueTextMesh)

					const buttonColor = 'black' //0x121212

					// Add 3D button to slide the camera, except for the last column
					if (columnIndex < yearData.columns.length - 1) {
						const buttonGeometry = new THREE.ConeGeometry(
							barWidth / 3,
							barWidth / 1.5,
							20
						)
						buttonGeometry.rotateZ(-Math.PI / 2)
						const buttonMaterial = new THREE.MeshStandardMaterial({
							color: buttonColor,
						})
						const button = new THREE.Mesh(buttonGeometry, buttonMaterial)
						button.position.copy(textMesh.position)
						button.position.x += textWidth / 2 + 1.5
						button.position.y = 1
						button.position.z = 0
						button.name = `button-next-${yearData.year}-${columnIndex}`
						button.userData = { columnIndex }
						buttons.push(button)
						yearGroup.add(button)
					}

					// Add 3D button to go to the previous column, except for the first column
					if (columnIndex > 0) {
						const buttonGeometry = new THREE.ConeGeometry(
							barWidth / 3,
							barWidth / 1.5,
							20
						)
						buttonGeometry.rotateZ(Math.PI / 2)
						const buttonMaterial = new THREE.MeshStandardMaterial({
							color: buttonColor,
						})
						const button = new THREE.Mesh(buttonGeometry, buttonMaterial)
						button.position.copy(textMesh.position)
						button.position.x += textWidth / 2 - 1.5
						button.position.y = 1
						button.position.z = 0
						button.name = `button-prev-${yearData.year}-${columnIndex}`
						button.userData = { columnIndex }
						buttons.push(button)
						yearGroup.add(button)
					}
				}
				chartGroup.add(yearGroup)
			})
		})

		scene.add(chartGroup)
	})

	// Add infinite horizontal grid
	const gridSize = 10000
	const gridDivisions = gridSize / (barWidth + gap)
	const gridHelper = new THREE.GridHelper(
		gridSize,
		gridDivisions,
		0x888888,
		0x444444
	)
	// gridHelper.rotation.x = Math.PI / 2
	gridHelper.position.x = -200
	gridHelper.position.z = (barWidth + gap) / 2
	chartGroup.add(gridHelper)

	// Add animated particles
	const particleCount = 100000
	const particlesGeometry = new THREE.BufferGeometry()
	const positions = new Float32Array(particleCount * 3)
	const velocities = new Float32Array(particleCount)

	for (let i = 0; i < particleCount; i++) {
		positions[i * 3] = (Math.random() - 0.5) * gridSize * 0.5
		positions[i * 3 + 1] = 0
		positions[i * 3 + 2] = (Math.random() - 0.5) * 60
		velocities[i] = Math.random()
	}

	particlesGeometry.setAttribute(
		'position',
		new THREE.BufferAttribute(positions, 3)
	)
	particlesGeometry.setAttribute(
		'velocity',
		new THREE.BufferAttribute(velocities, 1)
	)

	const particles = new THREE.Points(particlesGeometry, particlesMaterial)
	chartGroup.add(particles)
}

create3DChart(data)

// Add event listener for button clicks
document.addEventListener('mousedown', onDocumentMouseDown, false)

function onDocumentMouseDown(event) {
	// event.preventDefault()

	const mouse = new THREE.Vector2()
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

	const raycaster = new THREE.Raycaster()
	raycaster.setFromCamera(mouse, camera)

	const intersects = raycaster.intersectObjects(buttons, true)
	console.log('Intersects', intersects)

	if (intersects.length > 0) {
		const intersectedObject = intersects[0].object
		console.log('Intersected object', intersectedObject)
		if (intersectedObject.name.startsWith('button-next-')) {
			console.log('Next button clicked', intersectedObject.name)
			const columnIndex = intersectedObject.userData.columnIndex

			gsap.to(chartGroup.position, {
				x: `-=${colGap + 0.5}`,
				duration: 1,
			})
		} else if (intersectedObject.name.startsWith('button-prev-')) {
			console.log('Prev button clicked', intersectedObject.name)
			const columnIndex = intersectedObject.userData.columnIndex

			gsap.to(chartGroup.position, {
				x: `+=${colGap + 0.5}`,
				duration: 1,
			})
		}
	}
}

/**
 * frame loop
 */
function tic() {
	/**
	 * tempo trascorso dal frame precedente
	 */
	// const deltaTime = clock.getDelta()
	/**
	 * tempo totale trascorso dall'inizio
	 */
	const time = clock.getElapsedTime()
	particlesMaterial.uniforms.uTime.value = time

	// __controls_update__
	controls.update()

	renderer.render(scene, camera)

	requestAnimationFrame(tic)
}

requestAnimationFrame(tic)

window.addEventListener('resize', handleResize)

function handleResize() {
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	camera.aspect = sizes.width / sizes.height

	// camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix()

	renderer.setSize(sizes.width, sizes.height)

	const pixelRatio = Math.min(window.devicePixelRatio, 2)
	renderer.setPixelRatio(pixelRatio)
}
