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
        <v-rect v-for="item in rectangles" :key="item.id" :config="item" />
        <v-image :config="image" />
      </v-layer>
    </v-stage>
    <button @click="toJson">toJson</button>
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
      image: {
        image: null,
        name: "yoda",
        draggable: true,
        x: 300,
        y: 300,
        width: 100,
        height: 100,
        src: "https://konvajs.org/assets/yoda.jpg"
      },
      selectedShapeName: ""
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
  created() {
    const image = new Image()
    image.src = this.image.src
    image.crossOrigin = "anonymous" // https://stackoverflow.com/questions/22710627/tainted-canvases-may-not-be-exported
    image.onload = () => {
      this.image.image = image
    }
  },
  methods: {
    handleTransformEnd(e) {
      console.log("#@# handleTransformEnd", e)
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
    handleStageDragEnd(e) {
      console.log("#@# handleStageDragEnd", e)
      this.toSnapshot()
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
