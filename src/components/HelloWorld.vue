<template>
  <v-stage ref="stage" :config="stageSize" @mousedown="handleStageMouseDown" @touchstart="handleStageMouseDown">
    <v-layer ref="layer">
      <v-rect v-for="item in rectangles" :key="item.id" :config="item" @transformend="handleTransformEnd" />
      <v-image :config="{ image: image, name: 'yoda', draggable: true }" @transformend="handleTransformEnd" />
      <v-transformer ref="transformer" />
    </v-layer>
  </v-stage>
</template>

<script>
import Konva from "konva"
const width = window.innerWidth
const height = window.innerHeight

export default {
  data() {
    return {
      stageSize: {
        width: width,
        height: height
      },
      rectangles: [
        {
          rotation: 0,
          x: 10,
          y: 10,
          width: 100,
          height: 100,
          scaleX: 1,
          scaleY: 1,
          fill: "red",
          name: "rect1",
          draggable: true
        },
        {
          rotation: 0,
          x: 150,
          y: 150,
          width: 100,
          height: 100,
          scaleX: 1,
          scaleY: 1,
          fill: "green",
          name: "rect2",
          draggable: true
        }
      ],
      image: null,
      selectedShapeName: ""
    }
  },
  created() {
    const image = new window.Image()
    image.src = "https://konvajs.org/assets/yoda.jpg"
    image.onload = () => {
      this.image = image
    }
  },
  methods: {
    handleTransformEnd(e) {
      // shape is transformed, let us save new attrs back to the node
      // find element in our state
      const rect = this.rectangles.find(r => r.name === this.selectedShapeName)
      // update the state
      rect.x = e.target.x()
      rect.y = e.target.y()
      rect.rotation = e.target.rotation()
      rect.scaleX = e.target.scaleX()
      rect.scaleY = e.target.scaleY()

      // change fill
      rect.fill = Konva.Util.getRandomColor()
    },
    handleStageMouseDown(e) {
      // clicked on stage - clear selection
      if (e.target === e.target.getStage()) {
        this.selectedShapeName = ""
        this.updateTransformer()
        return
      }

      // clicked on transformer - do nothing
      const clickedOnTransformer = e.target.getParent().className === "Transformer"
      if (clickedOnTransformer) {
        return
      }

      // find clicked rect by its name
      const name = e.target.name()
      const stage = this.$refs.stage.getNode()
      const transformerTraget = stage.find(r => r.name === name)
      if (transformerTraget) {
        this.selectedShapeName = name
      } else {
        this.selectedShapeName = ""
      }
      this.updateTransformer()
    },
    updateTransformer() {
      // here we need to manually attach or detach Transformer node
      const transformerNode = this.$refs.transformer.getNode()
      // const stage = transformerNode.getStage();
      const stage = this.$refs.stage.getNode()
      const { selectedShapeName } = this

      const selectedNode = stage.findOne("." + selectedShapeName)
      // do nothing if selected node is already attached
      if (selectedNode === transformerNode.node()) {
        return
      }

      if (selectedNode) {
        // attach to another node
        transformerNode.nodes([selectedNode])
      } else {
        // remove transformer
        transformerNode.nodes([])
      }
    }
  }
}
</script>

<style scoped></style>
