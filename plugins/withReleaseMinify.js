// release 빌드에 R8 난독화/축소/최적화와 리소스 축소를 켠다.
// prebuild 템플릿의 app/build.gradle 이 아래 gradle 속성을 읽는다.
// expo-build-properties 를 들이지 않고 같은 속성만 쓰는 로컬 플러그인이다.
const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

const PROPERTIES = {
  'android.enableMinifyInReleaseBuilds': 'true',
  'android.enableShrinkResourcesInReleaseBuilds': 'true',
  // AGP 8.12/8.13은 직접 켜야 한다(9.0부터 기본). Play Console "최적화된 리소스 축소" 권장 조치.
  'android.r8.optimizedResourceShrinking': 'true',
};

// 템플릿의 proguard-android.txt 는 -dontoptimize 를 담고 있어 R8 최적화가 꺼진다(AGP 9.0에서 지원 중단).
const PROGUARD_BASE = 'getDefaultProguardFile("proguard-android.txt")';
const PROGUARD_OPTIMIZE = 'getDefaultProguardFile("proguard-android-optimize.txt")';

module.exports = function withReleaseMinify(config) {
  config = withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(PROPERTIES)) {
      cfg.modResults = cfg.modResults.filter((item) => !(item.type === 'property' && item.key === key));
      cfg.modResults.push({ type: 'property', key, value });
    }
    return cfg;
  });
  return withAppBuildGradle(config, (cfg) => {
    const { contents } = cfg.modResults;
    if (!contents.includes(PROGUARD_BASE) && !contents.includes(PROGUARD_OPTIMIZE)) {
      throw new Error('withReleaseMinify: app/build.gradle 에서 기본 proguard 파일 지정을 찾지 못했다');
    }
    cfg.modResults.contents = contents.replace(PROGUARD_BASE, PROGUARD_OPTIMIZE);
    return cfg;
  });
};
