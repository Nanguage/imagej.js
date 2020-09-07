import { setupRPC } from "imjoy-rpc";
import { version, description } from "../package.json";

export async function setupImJoyAPI(
  api,
  imagej,
  loader,
  getImageData,
  javaBytesToArrayBuffer,
  saveImage,
  openImage,
  addMenuItem
) {
  if (!api)
    api = await setupRPC({
      name: "ImageJ.JS",
      version: version,
      description: description,
      type: "rpc-window",
      defaults: { fullscreen: true }
    });
  const service_api = {
    setup() {
      api.log("ImageJ.JS loaded successfully.");
    },
    async run(ctx) {
      if (ctx.data && ctx.data.images) {
        //TODO: load images
        for (let img of ctx.data.images) {
          this.viewImage(img);
        }
      }
    },
    addMenuItem,
    async open(path) {
      loader.style.display = "block";
      try {
        await openImage(imagej, path);
      } catch (e) {
        throw e;
      } finally {
        loader.style.display = "none";
      }
    },
    async save(filename, format, ext) {
      loader.style.display = "block";
      try {
        await saveImage(imagej, filename, format, ext);
      } catch (e) {
        throw e;
      } finally {
        loader.style.display = "none";
      }
    },
    async runMacro(macro, args) {
      try {
        await imagej.runMacro(macro, args || "");
      } catch (e) {
        throw e;
      } finally {
        loader.style.display = "none";
      }
    },
    async installMacro(macro) {
      try {
        await imagej.installMacro(macro);
      } catch (e) {
        throw e;
      } finally {
        loader.style.display = "none";
      }
    },
    async installTool(tool) {
      try {
        await imagej.installTool(tool);
      } catch (e) {
        throw e;
      } finally {
        loader.style.display = "none";
      }
    },
    runPlugIn(className, args) {
      imagej.runPlugIn(className, args || "");
    },
    async viewImage(img, options) {
      loader.style.display = "block";
      try {
        options = options || {};
        options.name = options.name || "tmp";
        const filepath = "/str/" + options.name;
        const formats = {
          uint8: "8-bit",
          uint16: "16-bit Unsigned",
          int16: "16-bit Signed",
          uint32: "32-bit Unsigned",
          int32: "32-bit Signed"
        };
        cheerpjAddStringFile(filepath, new Uint8Array(img._rvalue));
        let format = formats[img._rdtype];

        if (img._rshape.length === 3) {
          let number = img._rshape[2];
          if (img._rshape[2] === 3) {
            format = "[24-bit RGB]";
            number = 1;
          }
          return await imagej.run(
            "Raw...",
            `open=${filepath} image=${format} width=${img._rshape[1]} height=${img._rshape[0]} number=${number}`
          );
        } else if (img._rshape.length === 4) {
          if (img._rshape[3] === 3) {
            format = "[24-bit RGB]";
          } else {
            if (img._rshape[3] !== 1) {
              throw "channel dimension (last) can only be 1 or 3";
            }
          }
          return await imagej.run(
            "Raw...",
            `open=${filepath} image=${format} width=${img._rshape[2]} height=${img._rshape[1]} number=${img._rshape[0]}`
          );
        } else if (img._rshape.length === 2) {
          return await imagej.run(
            "Raw...",
            `open=${filepath} image=${format} width=${img._rshape[1]} height=${img._rshape[0]}`
          );
        }
      } catch (e) {
        throw e;
      } finally {
        loader.style.display = "none";
      }
    },
    async getSelection() {
      const imp = await imagej.getImage();
      const bytes = javaBytesToArrayBuffer(
        await imagej.saveAsBytes(imp, "selection")
      );
      return bytes;
    },
    async getImage() {
      loader.style.display = "block";
      try {
        const data = await getImageData(imagej);
        return {
          _rtype: "ndarray",
          _rvalue: data.bytes,
          _rshape: data.shape,
          _rdtype: data.type
        };
      } finally {
        loader.style.display = "none";
      }
    }
  };

  api.export(service_api);
}
