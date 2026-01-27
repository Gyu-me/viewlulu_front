package com.viewluluapp

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Log
import com.facebook.react.bridge.*
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.TensorFlowLite
import java.io.File
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel
import kotlin.math.exp

class FaceShapeTfliteModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var interpreter: Interpreter? = null

    override fun getName(): String = "FaceShapeTflite"

    @ReactMethod
    fun predict(imagePath: String, promise: Promise) {
        try {
            Log.d("FaceShape", "🔥 predict() called")
            Log.d("FaceShape", "imagePath(raw) = $imagePath")

            val path = imagePath.removePrefix("file://")
            Log.d("FaceShape", "imagePath(clean) = $path")

            val file = File(path)
            Log.d("FaceShape", "file exists = ${file.exists()}, size=${if (file.exists()) file.length() else -1}")

            // 1) 모델 로드 (1번만)
            if (interpreter == null) {
                val modelBuffer = loadModelFile(reactApplicationContext, "faceshape_214_fixed.tflite")

                Log.i("FaceShape", "TFLite runtime version = ${TensorFlowLite.runtimeVersion()}")
                Log.i("FaceShape", "TFLite schema version = ${TensorFlowLite.schemaVersion()}")

                interpreter = Interpreter(modelBuffer)

                // ✅ 텐서 스펙은 모델 로드 직후 1회만 출력
                val inputTensor = interpreter!!.getInputTensor(0)
                val outputTensor = interpreter!!.getOutputTensor(0)

                Log.d("FaceShape", "Input tensor: shape=${inputTensor.shape().joinToString()}, type=${inputTensor.dataType()}")
                Log.d("FaceShape", "Output tensor: shape=${outputTensor.shape().joinToString()}, type=${outputTensor.dataType()}")
            }

            // 2) 이미지 로드
            val bmp0 = BitmapFactory.decodeFile(path)
                ?: throw IllegalArgumentException("Cannot decode image: $path")

            Log.d("FaceShape", "bitmap(original) w=${bmp0.width}, h=${bmp0.height}, config=${bmp0.config}")

            // 3) 중앙 crop 후 리사이즈
            val inputSize = 224

            val size = minOf(bmp0.width, bmp0.height)
            val x = (bmp0.width - size) / 2
            val y = (bmp0.height - size) / 2

            val cropped = Bitmap.createBitmap(bmp0, x, y, size, size)
            val bmp = Bitmap.createScaledBitmap(cropped, inputSize, inputSize, true)

            Log.d("FaceShape", "bitmap(cropped+resized) w=${bmp.width}, h=${bmp.height}")


            // 4) 입력 텐서 만들기 (float32 [1,224,224,3])
            val input = ByteBuffer.allocateDirect(1 * inputSize * inputSize * 3 * 4)
            input.order(ByteOrder.nativeOrder())

            val pixels = IntArray(inputSize * inputSize)
            bmp.getPixels(pixels, 0, inputSize, 0, 0, inputSize, inputSize)

            // ✅ 상단 일부 픽셀 샘플 로그
            for (i in 0 until 10) {
                val p = pixels[i]
                val r = ((p shr 16) and 0xFF)
                val g = ((p shr 8) and 0xFF)
                val b = (p and 0xFF)
                Log.d("FaceShape", "pixel[$i] RGB = $r, $g, $b")
            }

            // ✅ (현재 전처리) 0~1 스케일
            for (p in pixels) {
                input.putFloat((((p shr 16) and 0xFF) / 127.5f) - 1f)
                input.putFloat((((p shr 8) and 0xFF) / 127.5f) - 1f)
                input.putFloat(((p and 0xFF) / 127.5f) - 1f)
            }


            // ✅ 입력 텐서 샘플 (전처리 검증)
            input.rewind()
            val sampleInput = FloatArray(12)
            for (i in 0 until 12) {
                sampleInput[i] = input.float
            }
            Log.d("FaceShape", "input sample (first 12 floats) = ${sampleInput.joinToString()}")
            input.rewind()

            // 5) 출력 [1,5]
            val output = Array(1) { FloatArray(5) }
            interpreter!!.run(input, output)

            // ✅ 모델이 이미 softmax 확률을 출력하므로 그대로 사용
            Log.d("FaceShape", "probs(from model) = ${output[0].joinToString()}")

            val arr = Arguments.createArray()
            for (v in output[0]) arr.pushDouble(v.toDouble())
            promise.resolve(arr)


        } catch (e: Exception) {
            Log.e("FaceShape", "predict error", e)
            promise.reject("tflite_error", e.message, e)
        }
    }

    private fun softmax(logits: FloatArray): FloatArray {
        val max = logits.maxOrNull() ?: 0f
        val exps = logits.map { exp((it - max).toDouble()).toFloat() }
        val sum = exps.sum().coerceAtLeast(1e-12f)
        return exps.map { it / sum }.toFloatArray()
    }

    private fun loadModelFile(context: ReactApplicationContext, assetName: String): ByteBuffer {
        val fileDescriptor = context.assets.openFd(assetName)
        FileInputStream(fileDescriptor.fileDescriptor).use { inputStream ->
            val fileChannel = inputStream.channel
            return fileChannel.map(
                FileChannel.MapMode.READ_ONLY,
                fileDescriptor.startOffset,
                fileDescriptor.declaredLength
            )
        }
    }
}
