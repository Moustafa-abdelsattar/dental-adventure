// Standalone viewer for the converted dental chair.
//
// Same optimised GLB the game loads and the same spring constants as
// src/three/ClinicScene/Chair.tsx — reimplemented in plain three.js so the
// whole thing fits in one self-contained page.
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  BoxGeometry,
  CircleGeometry,
  MeshStandardMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PCFShadowMap,
  Raycaster,
  Scene,
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

const FRAME = { width: 2.2, height: 2.0 }
const DRIFT = 0.015

const host = document.getElementById('stage')
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

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

const floor = new Mesh(new CircleGeometry(6, 48), new MeshStandardMaterial({ color: 0xdceefb, roughness: 0.95 }))
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

// ── state ───────────────────────────────────────────────────────────────────
let theta = 0
let omega = 0
let moving = false
let pivot = null
let collider = null

// live trace of the most recent teeter, for the plot
let trace = []
let tracing = false
let traceStart = 0

const el = {
  angle: document.getElementById('angle'),
  peak: document.getElementById('peak'),
  beats: document.getElementById('beats'),
  hint: document.getElementById('hint'),
  plot: document.getElementById('plot'),
}
const plotCtx = el.plot.getContext('2d')

function nudge() {
  omega += theta >= 0 ? IMPULSE : -IMPULSE
  moving = true
  trace = []
  tracing = true
  traceStart = performance.now()
  el.hint.classList.add('is-used')
}

// ── load the chair ──────────────────────────────────────────────────────────
const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)
loader.load(
  document.getElementById('model').textContent.trim(),
  gltf => {
    const model = gltf.scene
    model.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })

    // re-home the pivot at the base, the way Model.tsx does: the exporter
    // centres the origin on the bounding box, which would make the chair
    // rotate about its own middle instead of about the floor
    const box = new Box3().setFromObject(model)
    const size = box.getSize(new Vector3())
    const s = 1.2 / size.y
    const anchor = new Vector3(box.min.x + size.x * 0.5, box.min.y, box.min.z + size.z * 0.5)

    pivot = new Mesh()
    const inner = new Mesh()
    inner.position.copy(anchor.clone().multiplyScalar(-s))
    inner.scale.setScalar(s)
    inner.add(model)
    pivot.add(inner)

    // the generous tap target — twelve triangles instead of twenty-four thousand
    const centre = box.getCenter(new Vector3()).sub(anchor).multiplyScalar(s)
    collider = new Mesh(
      new BoxGeometry(size.x * s * 1.12, size.y * s * 1.12, size.z * s * 1.12),
      new MeshBasicMaterial({ visible: false }),
    )
    collider.position.copy(centre)
    pivot.add(collider)

    scene.add(pivot)
    document.body.classList.add('is-ready')
  },
  undefined,
  err => {
    el.hint.textContent = 'The model failed to load.'
    console.error(err)
  },
)

// ── interaction ─────────────────────────────────────────────────────────────
const ray = new Raycaster()
const ndc = new Vector2()
renderer.domElement.addEventListener('pointerdown', e => {
  if (!collider) return
  const r = renderer.domElement.getBoundingClientRect()
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  ray.setFromCamera(ndc, camera)
  if (ray.intersectObject(collider, true).length) nudge()
})

// ── plot ────────────────────────────────────────────────────────────────────
function drawPlot() {
  const w = el.plot.width
  const h = el.plot.height
  plotCtx.clearRect(0, 0, w, h)

  const mid = h / 2
  plotCtx.strokeStyle = 'rgba(137,148,165,0.28)'
  plotCtx.lineWidth = 1
  plotCtx.beginPath()
  plotCtx.moveTo(0, mid)
  plotCtx.lineTo(w, mid)
  plotCtx.stroke()

  if (trace.length < 2) return
  const span = 1400 // ms of history the plot shows
  const scale = mid / 8 // degrees → pixels, 8° full deflection

  plotCtx.strokeStyle = '#4fa3e3'
  plotCtx.lineWidth = 2
  plotCtx.lineJoin = 'round'
  plotCtx.beginPath()
  trace.forEach((p, i) => {
    const x = (p.t / span) * w
    const y = mid - p.d * scale
    if (i === 0) plotCtx.moveTo(x, y)
    else plotCtx.lineTo(x, y)
  })
  plotCtx.stroke()

  // mark the turning points — these are the client's five beats
  plotCtx.fillStyle = '#ffd45e'
  let count = 0
  for (let i = 1; i < trace.length - 1; i++) {
    const a = trace[i - 1].d
    const b = trace[i].d
    const c = trace[i + 1].d
    if (((b > a && b >= c) || (b < a && b <= c)) && Math.abs(b) > 0.2) {
      count++
      plotCtx.beginPath()
      plotCtx.arc((trace[i].t / span) * w, mid - b * scale, 3, 0, Math.PI * 2)
      plotCtx.fill()
    }
  }
  el.beats.textContent = String(count)
}

// ── loop ────────────────────────────────────────────────────────────────────
function resize() {
  const r = host.getBoundingClientRect()
  renderer.setSize(r.width, r.height, false)
  camera.aspect = r.width / r.height
  const halfV = Math.tan((camera.fov * Math.PI) / 360)
  const d = Math.max(FRAME.height / 2 / halfV, FRAME.width / 2 / (halfV * camera.aspect))
  camera.userData.dist = d
  camera.updateProjectionMatrix()

  const dpr = Math.min(devicePixelRatio, 2)
  el.plot.width = el.plot.clientWidth * dpr
  el.plot.height = el.plot.clientHeight * dpr
  plotCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
  el.plot.width = el.plot.clientWidth
  el.plot.height = el.plot.clientHeight
  drawPlot()
}
new ResizeObserver(resize).observe(host)
resize()

let peak = 0
let last = performance.now()
renderer.setAnimationLoop(now => {
  const delta = Math.min((now - last) / 1000, 0.1)
  last = now

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
      tracing = false
    }
    pivot.rotation.z = theta
  }

  const deg = (theta * 180) / Math.PI
  el.angle.textContent = deg.toFixed(2)
  peak = Math.max(peak, Math.abs(deg))
  el.peak.textContent = peak.toFixed(2)

  if (tracing) {
    const t = now - traceStart
    if (t <= 1400) {
      trace.push({ t, d: deg })
      drawPlot()
    } else tracing = false
  }

  // the camera never sits perfectly still
  const d = camera.userData.dist ?? 5
  const t = now / 1000
  const dx = reduced ? 0 : Math.sin(t * 0.32) * d * DRIFT
  const dy = reduced ? 0 : Math.sin(t * 0.51) * d * DRIFT * 0.6
  camera.position.set(dx, 0.85 + dy, d)
  camera.lookAt(0, 0.6, 0)

  renderer.render(scene, camera)
})

// keyboard parity, so the demo is operable without a pointer
document.getElementById('nudge').addEventListener('click', nudge)
