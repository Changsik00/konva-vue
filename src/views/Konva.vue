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
  </section>
</template>

<script>
import dummy from "../assets/js/dummy.json"
import Konva from "konva"
export default {
  data() {
    return {
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
      console.log("#@# updateTransformer", this.selectedShapeName)

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
      console.log("#@# saveSnapshot", this.mainLayer.toJSON())
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
        this.selectedNode.attrs = { ...this.selectedNode.attrs, fill: "red" }
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
        // reset scale, so only with is changing by transformer
        textNode.setAttrs({
          width: textNode.width() * textNode.scaleX(),
          scaleX: 1
        })
      })
      textNode.on("dblclick dbltap", () => {
        // hide text node and transformer:
        textNode.hide()

        // create textarea over canvas with absolute position
        // first we need to find position for textarea
        // how to find it?

        // at first lets find position of text node relative to the stage:
        const textPosition = textNode.absolutePosition()

        // so position of textarea will be the sum of positions above:
        const areaPosition = {
          x: this.stage.container().offsetLeft + textPosition.x,
          y: this.stage.container().offsetTop + textPosition.y
        }

        // create textarea and style it
        const textarea = document.createElement("textarea")
        document.body.appendChild(textarea)

        // apply many styles to match text on canvas as close as possible
        // remember that text rendering on canvas and on the textarea can be different
        // and sometimes it is hard to make it 100% the same. But we will try...
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
        // also we need to slightly move textarea on firefox
        // because it jumps a bit
        const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1
        if (isFirefox) {
          px += 2 + Math.round(textNode.fontSize() / 20)
        }
        transform += "translateY(-" + px + "px)"

        textarea.style.transform = transform

        // reset height
        textarea.style.height = "auto"
        // after browsers resized it we can set actual value
        textarea.style.height = textarea.scrollHeight + 3 + "px"

        textarea.focus()

        function removeTextarea() {
          textarea.parentNode.removeChild(textarea)
          window.removeEventListener("click", handleOutsideClick)
          textNode.show()
        }

        function setTextareaWidth(newWidth) {
          if (!newWidth) {
            // set width for placeholder
            newWidth = textNode.placeholder.length * textNode.fontSize()
          }
          // some extra fixes on different browsers
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

        textarea.addEventListener("keydown", function(e) {
          // hide on enter
          // but don't hide on shift + enter
          if (e.keyCode === 13 && !e.shiftKey) {
            textNode.text(textarea.value)
            removeTextarea()
          }
          // on esc do not set value back to node
          if (e.keyCode === 27) {
            removeTextarea()
          }
        })

        textarea.addEventListener("keydown", function() {
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
