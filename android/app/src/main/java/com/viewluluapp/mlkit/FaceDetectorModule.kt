package com.viewluluapp.mlkit

import android.net.Uri
import android.util.Log
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

            Log.i("FaceDetector", "detectFaces file=$photoPath")

            // ✅ ML Kit 정석: 파일 직접 전달
            val image = InputImage.fromFilePath(
                reactApplicationContext,
                Uri.fromFile(file)
            )

            val options = FaceDetectorOptions.Builder()
                .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
                .setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
                .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
                .setMinFaceSize(0.12f) // 🔥 중요
                .enableTracking()
                .build()

            val detector = FaceDetection.getClient(options)

            detector.process(image)
                .addOnSuccessListener { faces ->
                    Log.i("FaceDetector", "faces.size=${faces.size}")

                    val result = Arguments.createMap()
                    result.putInt("imageWidth", image.width)
                    result.putInt("imageHeight", image.height)

                    val faceArray = Arguments.createArray()
                    for (face in faces) {
                        val m = Arguments.createMap()

                        val b = Arguments.createMap()
                        b.putDouble("x", face.boundingBox.left.toDouble())
                        b.putDouble("y", face.boundingBox.top.toDouble())
                        b.putDouble("width", face.boundingBox.width().toDouble())
                        b.putDouble("height", face.boundingBox.height().toDouble())
                        m.putMap("bounds", b)

                        m.putDouble("headEulerAngleY", face.headEulerAngleY.toDouble())
                        m.putDouble("headEulerAngleZ", face.headEulerAngleZ.toDouble())

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
