import { useGLTF } from '@react-three/drei'
import { useLayoutEffect, useMemo } from 'react'
import { Box3, Mesh, Vector3, type Group, type MeshStandardMaterial } from 'three'
import type { ThreeElements } from '@react-three/fiber'

/**
 * A pivot expressed as a fraction of the model's own bounding box, so it reads
 * as a place on the object rather than a magic number: [0.5, 0, 0.5] is the
 * centre of its base, [0.5, 1, 0.5] the centre of its top.
 */
export type Pivot = [number, number, number]

export const PIVOT = {
  /** Standing on the floor — chairs, trolleys, anything with a footprint. */
  base: [0.5, 0, 0.5] as Pivot,
  /** Hanging from above — the clinic lamp's ceiling mount. */
  ceiling: [0.5, 1, 0.5] as Pivot,
  /** Held in a hand — the grip end of an instrument. */
  grip: [0.5, 0, 0.5] as Pivot,
  centre: [0.5, 0.5, 0.5] as Pivot,
}

/**
 * Loads a GLB and re-homes its pivot at runtime.
 *
 * Image-to-3D services centre the origin on the bounding box, which is wrong
 * for almost everything: a chair has to teeter about its base column, a lamp
 * has to swing from its ceiling mount. The pipeline doc treats that as a
 * Blender job, but it does not have to be — offsetting the mesh inside a
 * wrapper group puts the rotation point anywhere we like, costs nothing at
 * runtime, and is reversible in a line of code rather than a re-export.
 *
 * Rotate or animate THIS component; it turns about the pivot you named.
 */
export function Model({
  url,
  pivot = PIVOT.base,
  height,
  onTap,
  onHover,
  highlight = 0,
  colliderPadding = 1.12,
  ...props
}: Omit<ThreeElements['group'], 'pivot'> & {
  url: string
  pivot?: Pivot
  /** Scale the model so it stands this many units tall. */
  height?: number
  /**
   * 0–1 glow, for saying "this one, touch this one". Done by lifting the
   * material's own emissive rather than an outline pass: outlines need
   * post-processing, which is the first thing the performance budget cuts.
   */
  highlight?: number
  onHover?: (over: boolean) => void
  /**
   * Tap handler. Fires from an invisible box collider rather than the mesh
   * itself: a four-year-old's aim is generous and so should the target be, and
   * hit-testing twelve triangles beats hit-testing twenty-four thousand on
   * every pointer move.
   */
  onTap?: () => void
  /** How much bigger than the model the tap target is. */
  colliderPadding?: number
}) {
  const { scene } = useGLTF(url)

  // clone so the same GLB can appear twice without the two fighting over one
  // transform, and so shadow flags are ours to set
  const model = useMemo(() => scene.clone(true), [scene])

  useLayoutEffect(() => {
    model.traverse(o => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      // clone(true) shares materials, so highlighting one copy would light up
      // every copy — give this instance its own
      if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(m => m.clone())
      else if (mesh.material) mesh.material = mesh.material.clone()
    })
  }, [model])

  useLayoutEffect(() => {
    model.traverse(o => {
      const mat = (o as Mesh).material as MeshStandardMaterial | undefined
      if (!mat || !('emissive' in mat)) return
      mat.emissive.setRGB(highlight * 0.55, highlight * 0.62, highlight * 0.72)
      mat.emissiveIntensity = 1
    })
  }, [model, highlight])

  const { offset, scale, collider } = useMemo(() => {
    const box = new Box3().setFromObject(model)
    const size = box.getSize(new Vector3())
    const s = height && size.y > 0 ? height / size.y : 1
    // the point on the model that should end up sitting at the group's origin
    const anchor = new Vector3(
      box.min.x + size.x * pivot[0],
      box.min.y + size.y * pivot[1],
      box.min.z + size.z * pivot[2],
    )
    // the collider lives in the outer group's space, already scaled, so it
    // tracks the pivot rather than the raw mesh
    const centre = box.getCenter(new Vector3()).sub(anchor).multiplyScalar(s)
    return {
      offset: anchor.clone().multiplyScalar(-s),
      scale: s,
      collider: {
        size: [size.x * s * colliderPadding, size.y * s * colliderPadding, size.z * s * colliderPadding] as [
          number,
          number,
          number,
        ],
        centre: [centre.x, centre.y, centre.z] as [number, number, number],
      },
    }
  }, [model, height, pivot, colliderPadding])

  return (
    <group {...(props as Omit<ThreeElements['group'], 'pivot'>)}>
      <group position={offset} scale={scale}>
        <primitive object={model} />
      </group>
      {onTap && (
        <mesh
          position={collider.centre}
          onClick={onTap}
          onPointerOver={e => {
            e.stopPropagation()
            onHover?.(true)
          }}
          onPointerOut={() => onHover?.(false)}
          name="tap-collider"
        >
          <boxGeometry args={collider.size} />
          {/* the MATERIAL is hidden, not the mesh: an invisible Object3D can be
              skipped by the raycaster, but a mesh with a hidden material still
              hit-tests while costing no draw call */}
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </group>
  )
}

/** Warm a model before the scene that needs it is on screen (§22). */
export function preloadModel(url: string) {
  useGLTF.preload(url)
}

export type { Group }
