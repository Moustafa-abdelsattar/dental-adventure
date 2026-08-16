// Standalone clinic scene: the PPTX room as a backdrop, the converted chair
// standing in it as a hotspot. Same spring constants, same strings, same
// recorded narration as the game — rebuilt in plain three.js so it fits in one
// self-contained page.
import {
  AmbientLight,
  Box3,
  CircleGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  BoxGeometry,
  MeshStandardMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PCFShadowMap,
  Raycaster,
  RingGeometry,
  Scene,
  ShadowMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
  ACESFilmicToneMapping,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

// ── the spring, exactly as the game has it ──────────────────────────────────
const TENSION = 420
const FRICTION = 8
const MASS = 1.1
const PEAK_RAD = (7 * Math.PI) / 180
const OMEGA_N = Math.sqrt(TENSION / MASS)
const ZETA = FRICTION / (2 * Math.sqrt(TENSION * MASS))
const OMEGA_D = OMEGA_N * Math.sqrt(1 - ZETA * ZETA)
const PEAK_PHASE = Math.atan(Math.sqrt(1 - ZETA * ZETA) / ZETA)
const PEAK_PER_V = (Math.exp((-ZETA * OMEGA_N * PEAK_PHASE) / OMEGA_D) * Math.sin(PEAK_PHASE)) / OMEGA_D
const IMPULSE = PEAK_RAD / PEAK_PER_V

const STALL_MS = 10000
const FRAME = { width: 2.4, height: 2.2 }
const DRIFT = 0.015

const host = document.getElementById('stage')
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

const el = {
  caption: document.getElementById('caption'),
  sheet: document.getElementById('sheet'),
  next: document.getElementById('next'),
  replay: document.getElementById('replay'),
  again: document.getElementById('again'),
}

// ── renderer ────────────────────────────────────────────────────────────────
const renderer = new WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = PCFShadowMap
renderer.toneMapping = ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
host.appendChild(renderer.domElement)

const scene = new Scene()
const camera = new PerspectiveCamera(42, 1, 0.1, 60)

const key = new DirectionalLight(0xffffff, 1.15)
key.position.set(3.5, 6, 4)
key.castShadow = true
key.shadow.mapSize.set(1024, 1024)
key.shadow.bias = -0.0008
key.shadow.normalBias = 0.02
key.shadow.camera = new OrthographicCamera(-4, 4, 4, -4, 0.1, 20)
scene.add(key)
scene.add(new HemisphereLight(0xeaf6ff, 0xffe9c2, 0.85))
scene.add(new AmbientLight(0xffffff, 0.25))

// the floor catches the shadow without painting over the room behind it
const floor = new Mesh(new CircleGeometry(6, 48), new ShadowMaterial({ opacity: 0.26, color: 0x3a3560 }))
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

// ── the ring that says "touch this one" ─────────────────────────────────────
const ring = new Mesh(
  new RingGeometry(0.48, 0.62, 48),
  new MeshBasicMaterial({ color: 0xffd45e, transparent: true, opacity: 0.3, side: DoubleSide, depthWrite: false }),
)
ring.rotation.x = -Math.PI / 2
ring.position.y = 0.012
scene.add(ring)

// ── state ───────────────────────────────────────────────────────────────────
let theta = 0
let omega = 0
let moving = false
let pivot = null
let collider = null
let chairMaterials = []

let hovered = false
let selected = false
let explored = false
let lastTouch = performance.now()

const narration = new Audio(document.getElementById('narration').textContent.trim())

function setHighlight(v) {
  for (const m of chairMaterials) m.emissive.setRGB(v * 0.55, v * 0.62, v * 0.72)
}

function select() {
  if (selected) return
  selected = true
  lastTouch = performance.now()
  omega += theta >= 0 ? IMPULSE : -IMPULSE
  moving = true
  el.caption.classList.add('is-hidden')
  el.sheet.classList.add('is-open')
  narration.currentTime = 0
  narration.play().catch(() => {})
}

function dismiss() {
  selected = false
  explored = true
  el.sheet.classList.remove('is-open')
  el.again.classList.add('is-shown')
  narration.pause()
}

el.next.addEventListener('click', dismiss)
el.replay.addEventListener('click', () => {
  narration.currentTime = 0
  narration.play().catch(() => {})
})
el.again.addEventListener('click', () => {
  explored = false
  lastTouch = performance.now()
  el.again.classList.remove('is-shown')
  el.caption.classList.remove('is-hidden')
})

// ── load the chair ──────────────────────────────────────────────────────────
const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)
loader.load(document.getElementById('model').textContent.trim(), gltf => {
  const model = gltf.scene
  model.traverse(o => {
    if (!o.isMesh) return
    o.castShadow = true
    o.receiveShadow = true
    o.material = o.material.clone()
    if (o.material.emissive) chairMaterials.push(o.material)
  })

  // re-home the pivot at the base, the way the game does — the exporter
  // centres the origin on the bounding box, which would spin the chair about
  // its own middle instead of about the floor
  const box = new Box3().setFromObject(model)
  const size = box.getSize(new Vector3())
  const s = 1.2 / size.y
  const anchor = new Vector3(box.min.x + size.x * 0.5, box.min.y, box.min.z + size.z * 0.5)

  pivot = new Group()
  const inner = new Group()
  inner.position.copy(anchor.clone().multiplyScalar(-s))
  inner.scale.setScalar(s)
  inner.add(model)
  pivot.add(inner)

  // a generous tap target: twelve triangles instead of twenty-four thousand
  const centre = box.getCenter(new Vector3()).sub(anchor).multiplyScalar(s)
  collider = new Mesh(
    new BoxGeometry(size.x * s * 1.12, size.y * s * 1.12, size.z * s * 1.12),
    new MeshBasicMaterial({ visible: false }),
  )
  collider.position.copy(centre)
  pivot.add(collider)

  scene.add(pivot)
  document.body.classList.add('is-ready')
})

// ── pointer ─────────────────────────────────────────────────────────────────
const ray = new Raycaster()
const ndc = new Vector2()
const hits = px => {
  if (!collider) return false
  const r = renderer.domElement.getBoundingClientRect()
  ndc.set(((px.clientX - r.left) / r.width) * 2 - 1, -((px.clientY - r.top) / r.height) * 2 + 1)
  ray.setFromCamera(ndc, camera)
  return ray.intersectObject(collider, true).length > 0
}
renderer.domElement.addEventListener('pointermove', e => {
  hovered = hits(e)
  renderer.domElement.style.cursor = hovered ? 'pointer' : 'default'
})
renderer.domElement.addEventListener('pointerdown', e => {
  if (hits(e)) select()
})

// ── loop ────────────────────────────────────────────────────────────────────
function resize() {
  const r = host.getBoundingClientRect()
  renderer.setSize(r.width, r.height, false)
  camera.aspect = r.width / r.height
  const halfV = Math.tan((camera.fov * Math.PI) / 360)
  camera.userData.dist = Math.max(FRAME.height / 2 / halfV, FRAME.width / 2 / (halfV * camera.aspect))
  camera.updateProjectionMatrix()
}
new ResizeObserver(resize).observe(host)
resize()

const camPos = new Vector3()
const camAim = new Vector3()
let seeded = false
let last = performance.now()

renderer.setAnimationLoop(now => {
  const delta = Math.min((now - last) / 1000, 0.1)
  last = now
  const t = now / 1000

  if (moving && pivot) {
    let remaining = delta
    while (remaining > 0) {
      const step = Math.min(remaining, 1 / 240)
      omega += ((-TENSION * theta - FRICTION * omega) / MASS) * step
      theta += omega * step
      remaining -= step
    }
    if (Math.abs(theta) < 0.0004 && Math.abs(omega) < 0.0004) {
      theta = 0
      omega = 0
      moving = false
    }
    pivot.rotation.z = theta
  }

  setHighlight(selected || hovered ? 0.2 : 0)

  // the ring: breathing while it waits, harder after ten quiet seconds,
  // steady once chosen, gone once explored
  const stalled = !selected && !explored && now - lastTouch > STALL_MS
  if (explored) {
    ring.visible = false
  } else {
    ring.visible = true
    if (selected) {
      ring.scale.setScalar(1.16)
      ring.material.opacity = 0.5
    } else {
      const speed = stalled ? 3.6 : 1.6
      const wave = (Math.sin(t * speed) + 1) / 2
      ring.scale.setScalar(1 + wave * (stalled ? 0.2 : 0.11))
      ring.material.opacity = 0.22 + wave * (stalled ? 0.45 : 0.28)
    }
  }

  // camera: home, or travelled in on the thing that was touched
  const d = camera.userData.dist ?? 5
  const home = new Vector3(0, 0.85, d)
  const aimHome = new Vector3(0, 0.6, 0)
  const near = new Vector3(0, 1.02, d * 0.62)
  const aimNear = new Vector3(0, 0.95, 0)
  if (!seeded) {
    camPos.copy(home)
    camAim.copy(aimHome)
    seeded = true
  }
  const k = 1 - Math.pow(0.001, delta)
  camPos.lerp(selected ? near : home, k)
  camAim.lerp(selected ? aimNear : aimHome, k)

  const dx = reduced ? 0 : Math.sin(t * 0.32) * d * DRIFT
  const dy = reduced ? 0 : Math.sin(t * 0.51) * d * DRIFT * 0.6
  camera.position.set(camPos.x + dx, camPos.y + dy, camPos.z)
  camera.lookAt(camAim)

  renderer.render(scene, camera)
})
