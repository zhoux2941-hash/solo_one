#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>

typedef NS_ENUM(NSInteger, VETransitionType) {
    VETransitionTypeNone,
    VETransitionTypeFade,
    VETransitionTypeDissolve,
    VETransitionTypeSlideLeft,
    VETransitionTypeSlideRight,
    VETransitionTypeSlideUp,
    VETransitionTypeSlideDown,
    VETransitionTypeWipeLeft,
    VETransitionTypeWipeRight,
    VETransitionTypeRipple,
    VETransitionTypeZoom,
    VETransitionTypeRotate
};

typedef NS_ENUM(NSInteger, VEFilterType) {
    VEFilterTypeNone,
    VEFilterTypeBrightness,
    VEFilterTypeContrast,
    VEFilterTypeSaturation,
    VEFilterTypeGaussianBlur,
    VEFilterTypeSharpen,
    VEFilterTypeSepia,
    VEFilterTypeVignette
};

@interface VEVideoEditor : NSObject

@property (nonatomic, assign) CGSize outputSize;
@property (nonatomic, assign) double outputFramerate;
@property (nonatomic, readonly) NSInteger videoClipCount;
@property (nonatomic, readonly) double totalDuration;

- (instancetype)init NS_DESIGNATED_INITIALIZER;

- (NSInteger)addVideoClip:(NSString *)path;
- (void)setClipTrim:(NSInteger)clipIndex start:(double)start end:(double)end;
- (void)setClipSpeed:(NSInteger)clipIndex speed:(float)speed;

- (void)setTransition:(NSInteger)clipIndex type:(VETransitionType)type duration:(double)duration;

- (NSInteger)addAudioClip:(NSString *)path;
- (void)setAudioClipStartTime:(NSInteger)clipIndex time:(double)time;
- (void)setAudioClipVolume:(NSInteger)clipIndex volume:(float)volume;

- (void)addFilter:(VEFilterType)type;

- (BOOL)export:(NSString *)outputPath
      progress:(void (^)(float progress))progressCallback
         error:(void (^)(NSInteger code, NSString *message))errorCallback;

- (void)cancelExport;

@end
