const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withInjectHostWrapper(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const newBuildGradleContent = `
  allprojects {
      repositories {
          mavenCentral()
          google()
          maven { url 'https://www.jitpack.io' }
      }
  }
  
  subprojects {
      afterEvaluate { project ->
          if (project.hasProperty('android')) {
              project.android {
                  compileSdkVersion 34
                  buildToolsVersion "34.0.0"
              }
          }
      }
  }
  `;
      config.modResults.contents += newBuildGradleContent;
    }
    return config;
  });
};
