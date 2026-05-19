import Foundation
import CoreGraphics

public enum VETransitionType: Int {
    case none
    case fade
    case dissolve
    case slideLeft
    case slideRight
    case slideUp
    case slideDown
    case wipeLeft
    case wipeRight
    case ripple
    case zoom
    case rotate
}

public enum VEFilterType: Int {
    case none
    case brightness
    case contrast
    case saturation
    case gaussianBlur
    case sharpen
    case sepia
    case vignette
}

public class VideoEditor {
    private let objcEditor: VEVideoEditor
    
    public var outputSize: CGSize {
        get { return objcEditor.outputSize }
        set { objcEditor.outputSize = newValue }
    }
    
    public var outputFramerate: Double {
        get { return objcEditor.outputFramerate }
        set { objcEditor.outputFramerate = newValue }
    }
    
    public var videoClipCount: Int {
        return objcEditor.videoClipCount
    }
    
    public var totalDuration: Double {
        return objcEditor.totalDuration
    }
    
    public init() {
        objcEditor = VEVideoEditor()
    }
    
    @discardableResult
    public func addVideoClip(_ path: String) -> Int {
        return objcEditor.addVideoClip(path)
    }
    
    public func setClipTrim(clipIndex: Int, start: Double, end: Double) {
        objcEditor.setClipTrim(clipIndex, start: start, end: end)
    }
    
    public func setClipSpeed(clipIndex: Int, speed: Float) {
        objcEditor.setClipSpeed(clipIndex, speed: speed)
    }
    
    public func setTransition(clipIndex: Int, type: VETransitionType, duration: Double) {
        objcEditor.setTransition(clipIndex, type: VETransitionType(rawValue: type.rawValue)!, duration: duration)
    }
    
    @discardableResult
    public func addAudioClip(_ path: String) -> Int {
        return objcEditor.addAudioClip(path)
    }
    
    public func setAudioClipStartTime(clipIndex: Int, time: Double) {
        objcEditor.setAudioClipStartTime(clipIndex, time: time)
    }
    
    public func setAudioClipVolume(clipIndex: Int, volume: Float) {
        objcEditor.setAudioClipVolume(clipIndex, volume: volume)
    }
    
    public func addFilter(_ type: VEFilterType) {
        objcEditor.addFilter(VEFilterType(rawValue: type.rawValue)!)
    }
    
    public func export(outputPath: String,
                        progress: ((Float) -> Void)? = nil,
                        error: ((Int, String) -> Void)? = nil) -> Bool {
        return objcEditor.export(outputPath,
            progress: { progressValue in
                progress?(progressValue)
            },
            error: { code, message in
                error?(code, message as String)
            })
    }
    
    public func cancelExport() {
        objcEditor.cancelExport()
    }
}
