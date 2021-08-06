<template>
  <section>
    <v-stage
      class="stage"
      ref="stage"
      :config="stageSize"
      @mousedown="handleStageMouseDown"
      @touchstart="handleStageMouseDown"
    >
    </v-stage>
    <button @click="downloadImage">downloadImage</button>
  </section>
</template>

<script>
import Konva from "konva"
export default {
  data() {
    return {
      stageSize: {
        width: 1000,
        height: 500
      },
      selectedShapeName: "",
      transformer: null,
      mainLayer: null
    }
  },
  computed: {
    stage() {
      return this.$refs.stage.getNode()
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    init() {
      this.mainLayer = new Konva.Layer()

      this.transformer = new Konva.Transformer()
      this.transformer.on("dragend", () => this.handleStageDragEnd())
      this.transformer.on("transformend", () => this.handleTransformEnd())
      this.mainLayer.add(this.transformer)

      this.recoverSnapshot()

      this.stage.add(this.mainLayer)
    },
    handleTransformEnd() {
      this.saveSnapshot()
    },
    handleStageDragEnd() {
      this.saveSnapshot()
    },
    handleStageMouseDown(e) {
      if (e.target === e.target.getStage()) {
        this.selectedShapeName = ""
        this.updateTransformer()
        return
      }

      const clickedOnTransformer = e.target.getParent().className === "Transformer"
      if (clickedOnTransformer) {
        return
      }

      const name = e.target.name()
      const transformerTraget = this.stage.find(r => r.name === name)
      if (transformerTraget) {
        this.selectedShapeName = name
      } else {
        this.selectedShapeName = ""
      }
      this.updateTransformer()
    },

    updateTransformer() {
      const selectedNode = this.stage.findOne("." + this.selectedShapeName)
      if (selectedNode === this.transformer.node()) {
        return
      }

      if (selectedNode) {
        const zIndex = this.mainLayer.children.length - 1
        selectedNode.zIndex(zIndex)
        this.transformer.zIndex(zIndex)
        this.transformer.nodes([selectedNode])
      } else {
        this.clearTransformer()
      }
    },
    clearTransformer() {
      this.transformer.nodes([])
    },
    saveSnapshot() {
      console.log("#@# saveSnapshot")
      localStorage.setItem("snapshot", this.mainLayer.toJSON())
    },
    getSnapshot() {
      return localStorage.getItem("snapshot")
    },
    recoverSnapshot() {
      const snapshot = this.getSnapshot()
      if (snapshot) {
        const shapes = JSON.parse(snapshot).children
        this.shapes = shapes.forEach(shape => {
          const { className, attrs } = shape
          if (className === "Transformer") {
            return
          }
          if (className === "Image") {
            const image = new Image()
            image.src = attrs.src
            image.crossOrigin = "anonymous"
            image.onload = () => {
              const konvaImage = new Konva.Image({ ...attrs, image })
              this.mainLayer.add(konvaImage)
            }
          } else {
            const shapeObj = new Konva[className](attrs)
            this.mainLayer.add(shapeObj)
          }
        })
        // FIXME: check redundant??
        // this.stage.draw()
      }
    },
    makeImageAndDownload(uri, name) {
      const link = document.createElement("a")
      link.download = name
      link.href = uri
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    downloadImage() {
      this.clearTransformer()
      const dataURL = this.stage.toDataURL({ pixelRatio: 3 })
      this.makeImageAndDownload(dataURL, "image.png")
    }
  }
}
</script>

<style lang="scss" scoped>
.stage {
  width: 1000px;
  height: 500px;
  border: 1px solid red;
  margin: auto;
}
</style>
