<template>
  <section>
    <v-stage
      class="stage"
      ref="stage"
      :config="stageSize"
      @mousedown="handleStageMouseDown"
      @touchstart="handleStageMouseDown"
    >
      <v-layer ref="layer">
        <v-transformer @dragend="handleStageDragEnd" @transformend="handleTransformEnd" ref="transformer" />
        <v-shape v-for="shape in shapes" :key="shape.name" :config="shape"> </v-shape>
      </v-layer>
    </v-stage>
    <button @click="downloadImage">downloadImage</button>
  </section>
</template>

<script>
export default {
  data() {
    return {
      stageSize: {
        width: 1000,
        height: 500
      },
      selectedShapeName: "",
      shapes: []
    }
  },
  computed: {
    stage() {
      return this.$refs.stage.getNode()
    },
    mainLayer() {
      return this.$refs.layer.getNode()
    },
    transformer() {
      return this.$refs.transformer.getNode()
    }
  },

  mounted() {
    this.init()
  },
  methods: {
    init() {
      const snapshot = this.getSnapshot()
      if (snapshot) {
        const shapes = JSON.parse(snapshot).children

        this.shapes = shapes.map(shape => {
          if (shape.className === "Image") {
            // FIXME: v-shape 이용해서 한방에 끗?
            const image = new Image()
            image.src = shape.attrs.src
            image.crossOrigin = "anonymous"
            image.onload = () => {
              shape.attrs.image = image
            }
          }
          return shape
        })
        this.stage.draw()
      }
    },
    handleTransformEnd() {
      this.toSnapshot()
    },
    handleStageDragEnd() {
      this.toSnapshot()
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
        const length = this.mainLayer.children.length
        selectedNode.zIndex(length)
        this.transformer.zIndex(length)

        this.transformer.nodes([selectedNode])
      } else {
        this.clearTransformer()
      }
    },
    clearTransformer() {
      this.transformer.nodes([])
    },
    toSnapshot() {
      localStorage.setItem("snapshot", this.mainLayer.toJSON())
    },
    getSnapshot() {
      return localStorage.getItem("snapshot")
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
