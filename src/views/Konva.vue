<template>
  <section>
    <v-stage class="stage" ref="stage" :config="stageSize"> </v-stage>
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
      }
    }
  },
  computed: {
    stage() {
      return this.$refs.stage.getNode()
    }
  },
  mounted() {
    var layer = new Konva.Layer()
    this.stage.add(layer)

    var imageObj = new Image()
    imageObj.onload = function() {
      var yoda = new Konva.Image({
        x: 100,
        y: 100,
        image: imageObj
        // width: 106,
        // height: 118
      })
      layer.add(yoda)
    }
    imageObj.src = "https://konvajs.org/assets/yoda.jpg"
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
