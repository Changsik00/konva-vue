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
    <button @click="addText">addText</button>
    <button @click="editableText">editableText</button>
    <button @click="changeColor">color</button>
    <button @click="reset">reset</button>
    <Photoshop v-model="colors" />
  </section>
</template>

<script>
import dummy from "../assets/js/dummy.json"
import Konva from "konva"
import { Photoshop } from "vue-color"
export default {
  components: {
    Photoshop
  },
  data() {
    return {
      colors: {
        hex: "#194d33",
        hex8: "#194D33A8",
        hsl: { h: 150, s: 0.5, l: 0.2, a: 1 },
        hsv: { h: 150, s: 0.66, v: 0.3, a: 1 },
        rgba: { r: 25, g: 77, b: 51, a: 1 },
        a: 1
      },
      stageSize: {
        width: 1000,
        height: 500
      },
      selectedShapeName: "",
      selectedNode: null,
      transformer: null,
      mainLayer: null
    }
  },
  computed: {
    stage() {
      return this.$refs.stage.getNode()
    },
    nodeCount() {
      return this.mainLayer.children.length - 1
    }
  },
  mounted() {
    const container = this.stage.container()
    container.tabIndex = 0
    container.addEventListener("keydown", e => this.handleStageKeydown(e))
    container.focus()
    this.init()
  },
  methods: {
    init() {
      this.mainLayer = new Konva.Layer()
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
      this.selectedNode = this.stage.findOne("." + this.selectedShapeName)
      if (this.selectedNode === this.transformer.node()) {
        return
      }

      if (this.selectedNode) {
        const zIndex = this.mainLayer.children.length - 1
        this.selectedNode.zIndex(zIndex)
        this.transformer.zIndex(zIndex)
        this.transformer.nodes([this.selectedNode])
      } else {
        this.clearTransformer()
      }
    },
    clearTransformer() {
      this.transformer.nodes([])
    },
    saveSnapshot() {
      localStorage.setItem("snapshot", this.mainLayer.toJSON())
    },
    getSnapshot() {
      return localStorage.getItem("snapshot")
    },
    recoverSnapshot() {
      const snapshot = this.getSnapshot()
      if (snapshot) {
        const shapes = JSON.parse(snapshot).children
        let isExistTransformer = false
        this.shapes = shapes.forEach(shape => {
          const { className, attrs } = shape

          if (className === "Image") {
            const image = new Image()
            image.src = attrs.src
            image.crossOrigin = "anonymous"
            image.onload = () => {
              const konvaImage = new Konva.Image({ ...attrs, image })
              this.mainLayer.add(konvaImage)
            }
          } else {
            if (attrs.name?.startsWith("editable-text")) {
              this.addEditableTextNode(attrs)
            } else {
              const shapeObj = new Konva[className](attrs)
              this.mainLayer.add(shapeObj)
              if (className === "Transformer") {
                isExistTransformer = true
                this.transformer = shapeObj
              }
            }
          }
        })

        if (!isExistTransformer) {
          this.transformer = new Konva.Transformer()
        }

        this.transformer.on("dragend", () => this.handleStageDragEnd())
        this.transformer.on("transformend", () => this.handleTransformEnd())
        this.mainLayer.add(this.transformer)
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
    },
    addText() {
      const shapeObj = new Konva.Text({
        x: this.stage.width() / 3,
        y: 15,
        text: "Simple Text",
        fontSize: 30,
        fontFamily: "Calibri",
        fill: "green",
        name: "text" + this.nodeCount,
        draggable: true,
        index: 4
      })
      this.mainLayer.add(shapeObj)
    },
    editableText() {
      this.addEditableTextNode()
    },
    changeColor() {
      if (this.selectedNode) {
        this.selectedNode.attrs = { ...this.selectedNode.attrs, fill: this.colors.hex }
        this.stage.draw()
      }
    },
    reset() {
      localStorage.setItem("snapshot", JSON.stringify(dummy))
      this.mainLayer.children = []
      this.recoverSnapshot()
    },
    addEditableTextNode(attr) {
      // https://konvajs.org/docs/sandbox/Editable_Text.html
      const textNode = new Konva.Text(
        attr ?? {
          text: "Some text here",
          x: 50,
          y: 80,
          fontSize: 20,
          draggable: true,
          width: 200,
          name: "editable-text" + this.nodeCount
        }
      )

      textNode.on("transform", function() {
        textNode.setAttrs({
          width: textNode.width() * textNode.scaleX(),
          scaleX: 1
        })
      })
      textNode.on("dblclick dbltap", () => {
        textNode.hide()
        const textPosition = textNode.absolutePosition()
        const areaPosition = {
          x: this.stage.container().offsetLeft + textPosition.x,
          y: this.stage.container().offsetTop + textPosition.y
        }

        const textarea = document.createElement("textarea")
        document.body.appendChild(textarea)

        textarea.value = textNode.text()
        textarea.style.position = "absolute"
        textarea.style.top = areaPosition.y + "px"
        textarea.style.left = areaPosition.x + "px"
        textarea.style.width = textNode.width() - textNode.padding() * 2 + "px"
        textarea.style.height = textNode.height() - textNode.padding() * 2 + 5 + "px"
        textarea.style.fontSize = textNode.fontSize() + "px"
        textarea.style.border = "none"
        textarea.style.padding = "0px"
        textarea.style.margin = "0px"
        textarea.style.overflow = "hidden"
        textarea.style.background = "none"
        textarea.style.outline = "none"
        textarea.style.resize = "none"
        textarea.style.lineHeight = textNode.lineHeight()
        textarea.style.fontFamily = textNode.fontFamily()
        textarea.style.transformOrigin = "left top"
        textarea.style.textAlign = textNode.align()
        textarea.style.color = textNode.fill()

        const rotation = textNode.rotation()
        let transform = ""
        if (rotation) {
          transform += "rotateZ(" + rotation + "deg)"
        }

        let px = 0
        const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1
        if (isFirefox) {
          px += 2 + Math.round(textNode.fontSize() / 20)
        }
        transform += "translateY(-" + px + "px)"
        textarea.style.transform = transform
        textarea.style.height = "auto"
        textarea.style.height = textarea.scrollHeight + 3 + "px"
        textarea.focus()

        function removeTextarea() {
          textarea.parentNode.removeChild(textarea)
          window.removeEventListener("click", handleOutsideClick)
          textNode.show()
        }

        function setTextareaWidth(newWidth) {
          if (!newWidth) {
            newWidth = textNode.placeholder.length * textNode.fontSize()
          }
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
          const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1
          if (isSafari || isFirefox) {
            newWidth = Math.ceil(newWidth)
          }
          const isEdge = document.documentMode || /Edge/.test(navigator.userAgent)
          if (isEdge) {
            newWidth += 1
          }
          textarea.style.width = newWidth + "px"
        }

        textarea.addEventListener("keydown", e => {
          if (e.keyCode === 13 && !e.shiftKey) {
            textNode.text(textarea.value)
            removeTextarea()
          }
          if (e.keyCode === 27) {
            removeTextarea()
          }
        })

        textarea.addEventListener("keydown", () => {
          const scale = textNode.getAbsoluteScale().x
          setTextareaWidth(textNode.width() * scale)
          textarea.style.height = "auto"
          textarea.style.height = textarea.scrollHeight + textNode.fontSize() + "px"
        })

        function handleOutsideClick(e) {
          if (e.target !== textarea) {
            textNode.text(textarea.value)
            removeTextarea()
          }
        }
        setTimeout(() => {
          window.addEventListener("click", handleOutsideClick)
        })
      })

      this.mainLayer.add(textNode)
    },

    handleStageKeydown(e) {
      switch (e.key) {
        case "Backspace":
          this.mainLayer.children = this.mainLayer.children.filter(d => d !== this.selectedNode)
          this.clearTransformer()
          this.stage.draw()
          this.saveSnapshot()
          break
        case (e.ctrlKey || e.metaKey) && e.shiftKey && "z":
          console.log("#@# redo")
          break
        case (e.ctrlKey || e.metaKey) && "z":
          console.log("#@# undo")
          break
      }
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
