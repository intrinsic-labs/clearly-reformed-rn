// Config plugin: raise the iOS deployment-target floor for CocoaPods targets.
//
// Xcode 27.x refuses to build any pod that declares an iOS deployment target
// below 15.0 ("supported deployment target versions is 15.0 to 27.1.x"). Several
// pods we depend on still declare 12.4–13.x (RNSVG, Reanimated, WebView, ...).
// This adds a post_install step to the generated Podfile that lifts only the
// pods *below* the floor; the app's own target (`ios.deploymentTarget`, 16.4)
// and any pod already at or above the floor are untouched.
//
// Because ios/ is regenerated (CNG), the fix lives here, not in ios/Podfile.
const { withPodfile } = require('expo/config-plugins');

const FLOOR = '15.1'; // React Native 0.85's own minimum supported iOS
const MARKER = '# @generated cr-pod-deployment-target-floor';

const snippet = `    ${MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        current = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current && Gem::Version.new(current) < Gem::Version.new('${FLOOR}')
          bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${FLOOR}'
        end
      end
    end
`;

function addPodDeploymentTargetFloor(contents) {
  if (contents.includes(MARKER)) return contents;
  const anchor = /^(\s*post_install do \|installer\|\n)/m;
  if (!anchor.test(contents)) {
    throw new Error(
      'withPodDeploymentTargetFloor: no `post_install do |installer|` block found in the Podfile'
    );
  }
  return contents.replace(anchor, `$1${snippet}`);
}

module.exports = function withPodDeploymentTargetFloor(config) {
  return withPodfile(config, (cfg) => {
    cfg.modResults.contents = addPodDeploymentTargetFloor(cfg.modResults.contents);
    return cfg;
  });
};
module.exports.addPodDeploymentTargetFloor = addPodDeploymentTargetFloor;
