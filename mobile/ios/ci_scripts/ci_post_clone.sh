#!/bin/sh
set -e

echo "=> Installing Node.js and CocoaPods..."
export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
brew install node
brew install cocoapods

# This script is executed from mobile/ios/ci_scripts/
# We need to navigate up to the `mobile` folder to install npm packages
echo "=> Navigating to the mobile project root..."
cd ../..

echo "=> Installing JS dependencies..."
npm install

echo "=> Navigating to ios directory and installing Pods..."
cd ios
pod install

echo "=> Done Xcode Cloud setup!"
