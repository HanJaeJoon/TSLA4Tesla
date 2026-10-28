// release 빌드에 R8 난독화/축소와 리소스 축소를 켠다.
// prebuild 템플릿의 app/build.gradle 이 아래 gradle 속성을 읽는다.
// expo-build-properties 를 들이지 않고 같은 속성만 쓰는 로컬 플러그인이다.
const { withGradleProperties } = require('expo/config-plugins');

const PROPERTIES = {
  'android.enableMinifyInReleaseBuilds': 'true',
  'android.enableShrinkResourcesInReleaseBuilds': 'true',
};

module.exports = function withReleaseMinify(config) {
  return withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(PROPERTIES)) {
      cfg.modResults = cfg.modResults.filter((item) => !(item.type === 'property' && item.key === key));
      cfg.modResults.push({ type: 'property', key, value });
    }
    return cfg;
  });
};
