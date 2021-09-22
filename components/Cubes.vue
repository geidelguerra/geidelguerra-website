<template>
  <div>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import * as THREE from 'three'
// import * as dat from 'dat.gui'

const MAX_NUM_CUBES = 10

const createCubeMaterial = (color, normalMap) => {
  const material = new THREE.MeshStandardMaterial()
  material.color = color
  material.metalness = 0.6
  material.roughness = 0.2
  material.normalMap = normalMap

  return material
}

const createCube = (size, material) => {
  const geometry = new THREE.BoxBufferGeometry(size, size, size)
  const mesh = new THREE.Mesh(geometry)
  mesh.material = material

  return mesh
}

export default {
  mounted() {
    let viewWidth = this.$el.clientWidth
    let viewHeight = this.$el.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, viewWidth / viewHeight, 0.1, 100);
    camera.position.z = 2
    scene.add(camera)

    const directionalLight = new THREE.DirectionalLight(0x3d962b, 2);
    directionalLight.position.z = 4
    scene.add(directionalLight)

    const pointLight1 = new THREE.PointLight(0x962b3d, 5)
    scene.add(pointLight1)

    const cubes = []
    const cubesTransformations = []
    const cubeNormalMap = new THREE.TextureLoader().load('/textures/metal_normal_map.jpg')
    const cubeMaterial = createCubeMaterial(new THREE.Color(0x0c0c0c), cubeNormalMap)

    const addCube = (size, position = {x:0, y: 0, z: 0}, rotation = {x:0, y: 0, z: 0}) => {
      const cube = createCube(size, cubeMaterial)
      cube.position.set(position.x || 0, position.y || 0, position.z || 0)
      cube.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0)

      scene.add(cube)
      cubes.push(cube)
      cubesTransformations.push(
        {
          rotation: { x: cube.rotation.x, y: cube.rotation.y, z: cube.rotation.z },
          position: { x: cube.position.x, y: cube.position.y, z: cube.position.z }
        }
      )
    }

    for (let i = 0; i < MAX_NUM_CUBES; i++) {
      addCube(
        0.2,
        {
          x: Math.sin(THREE.MathUtils.mapLinear(i, 0, MAX_NUM_CUBES, -Math.PI, Math.PI * 2)),
          y: Math.cos(THREE.MathUtils.mapLinear(i, 0, MAX_NUM_CUBES, -Math.PI, Math.PI * 2)),
          z: THREE.MathUtils.mapLinear(i, 0, MAX_NUM_CUBES, -5, 2)
        },
        {
          x: THREE.MathUtils.randFloat(-Math.PI, Math.PI * 2),
          y: THREE.MathUtils.randFloat(-Math.PI, Math.PI * 2),
          z: THREE.MathUtils.randFloat(-Math.PI, Math.PI * 2)
        }
      )
    }

    let mouseX = 0
    let mouseY = 0

    const renderer = new THREE.WebGLRenderer({ canvas: this.$refs.canvas, alpha: true })

    const resizeRenderer = () => {
      renderer.setSize(viewWidth, viewHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    resizeRenderer()

    const resizeCamera = () => {
      camera.aspect = viewWidth / viewHeight
      camera.updateProjectionMatrix()
    }

    const clock = new THREE.Clock()

    const tick = () => {
      const elapsedTime = clock.getElapsedTime()

      cubes.forEach((cube, i) => {
        const targetRotation = cubesTransformations[i].rotation
        const targetPosition = cubesTransformations[i].position

        cube.rotation.x = THREE.MathUtils.lerp(cube.rotation.x, targetRotation.x, 0.01) + (0.001 * elapsedTime)
        cube.rotation.y = THREE.MathUtils.lerp(cube.rotation.y, targetRotation.y, 0.01) + (0.001 * elapsedTime)
        cube.rotation.z = THREE.MathUtils.lerp(cube.rotation.z, targetRotation.z, 0.01) + (0.001 * elapsedTime)

        cube.position.z = THREE.MathUtils.lerp(cube.position.z, targetPosition.z, 0.1)
      })

      renderer.render(scene, camera)

      requestAnimationFrame(tick)
    }

    // const addDebugControls = () => {
    //   const gui = new dat.GUI()

    //   const guiLightFolder = gui.addFolder('Light')
    //   guiLightFolder.add(directionalLight, 'intensity').min(0).max(10)
    //   guiLightFolder.add(directionalLight.position, 'x').min(-6).max(6)
    //   guiLightFolder.add(directionalLight.position, 'y').min(-6).max(6)
    //   guiLightFolder.add(directionalLight.position, 'z').min(-6).max(6)
    // }

    document.addEventListener('mousemove', (event) => {
      mouseX = event.clientX
      mouseY = event.clientY

      cubes.forEach((cube, i) => {
        cubesTransformations[i].rotation =  {
          x: ((mouseY * i * 0.001 - cube.rotation.x) * 0.5) - cube.rotation.x,
          y: ((mouseX * i * 0.001 - cube.rotation.y) * 0.5) - cube.rotation.y,
          z: ((THREE.MathUtils.randFloat(0, mouseY) * i * 0.001 - cube.rotation.z) * 0.5)
        },
        cubesTransformations[i].position.z = (((mouseY - viewHeight * 0.5) * i * 0.01 - cube.position.z) * 0.5)
      })
    })

    window.addEventListener('resize', () => {
      viewWidth = this.$el.clientWidth
      viewHeight = this.$el.clientHeight

      resizeCamera()
      resizeRenderer()
    })

    // addDebugControls()
    tick()
  }
}
</script>