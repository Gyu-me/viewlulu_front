package com.viewluluapp.mlkit

import android.graphics.BitmapFactory
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import java.io.File

class FaceDetectorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "FaceDetector"

    @ReactMethod
    fun detectFaces(photoPath: String, promise: Promise) {
        try {
            val file = File(photoPath)
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "Photo file not found: $photoPath")
                return
            }

            val bitmap = BitmapFactory.decodeFile(photoPath)
            if (bitmap == null) {
                promise.reject("DECODE_FAILED", "Failed to decode bitmap: $photoPath")
                return
            }

            val options = FaceDetectorOptions.Builder()
                .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
                .setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
                .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
                .enableTracking()
                .build()

            val detector = FaceDetection.getClient(options)
            val image = InputImage.fromBitmap(bitmap, 0)

            detector.process(image)
                .addOnSuccessListener { faces ->
                    val result = Arguments.createMap()
                    result.putInt("imageWidth", bitmap.width)
                    result.putInt("imageHeight", bitmap.height)

                    val faceArray = Arguments.createArray()
                    for (face in faces) {
                        val m = Arguments.createMap()

                        val b = Arguments.createMap()
                        b.putDouble("x", face.boundingBox.left.toDouble())
                        b.putDouble("y", face.boundingBox.top.toDouble())
                        b.putDouble("width", face.boundingBox.width().toDouble())
                        b.putDouble("height", face.boundingBox.height().toDouble())
                        m.putMap("bounds", b)

                        m.putDouble("headEulerAngleY", face.headEulerAngleY.toDouble()) // yaw
                        m.putDouble("headEulerAngleZ", face.headEulerAngleZ.toDouble()) // roll

                        faceArray.pushMap(m)
                    }

                    result.putArray("faces", faceArray)
                    detector.close()
                    promise.resolve(result)
                }
                .addOnFailureListener { e ->
                    detector.close()
                    promise.reject("MLKIT_FAILED", e)
                }
        } catch (e: Exception) {
            promise.reject("UNEXPECTED", e)
        }
    }
}
