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
        <v-rect v-for="item in rectangles" :key="item.id" :config="item" @transformend="handleTransformEnd" />
        <v-image :config="image" @transformend="handleTransformEnd" />
        <v-transformer ref="transformer" />
      </v-layer>
    </v-stage>
    <button @click="toJson">toJson</button>
    <button @click="downloadImage">downloadImage</button>
  </section>
</template>

<script>
// import Konva from "konva"
// const width = window.innerWidth
// const height = window.innerHeight

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
      image: { image: null, name: "yoda", draggable: true, x: 300, y: 300, width: 100, height: 100 },
      selectedShapeName: ""
    }
  },
  computed: {
    stage() {
      return this.$refs.stage?.getNode()
    },
    transformer() {
      return this.$refs.transformer?.getNode()
    }
  },
  created() {
    const image = new Image()
    image.src = "https://konvajs.org/assets/yoda.jpg"
    image.crossOrigin = "anonymous" // https://stackoverflow.com/questions/22710627/tainted-canvases-may-not-be-exported
    image.onload = () => {
      this.image.image = image
    }
  },
  methods: {
    handleTransformEnd(e) {
      const rect = this.rectangles.find(r => r.name === this.selectedShapeName)
      rect.x = e.target.x()
      rect.y = e.target.y()
      rect.rotation = e.target.rotation()
      rect.scaleX = e.target.scaleX()
      rect.scaleY = e.target.scaleY()

      // change fill
      // rect.fill = Konva.Util.getRandomColor()
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
        this.transformer.nodes([selectedNode])
      } else {
        this.clearTransformer()
      }
    },
    clearTransformer() {
      this.transformer.nodes([])
    },
    toJson() {
      console.log("#@# toJson", this.stage.toJSON())
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
