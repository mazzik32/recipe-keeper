---
name: eas-release
description: Bump the mobile app version and release a new build to the App Store via EAS Build with auto-submit.
---

# EAS Release Skill

## Overview

This skill handles bumping the app version and triggering an EAS production build that automatically submits to App Store Connect.

> **Important:** This project has a native `mobile/ios/` directory. EAS ignores `app.json` for versioning and reads directly from the **native Xcode project files**. Both must be updated.

## Steps

### 1. Ask for version details

Ask the user for:
- **New version string** (e.g. `1.0.4`) — marketing version shown in the App Store
- **New build number** (e.g. `20`) — must be strictly higher than all previous builds (check EAS dashboard if unsure)
- **Platform** — `ios`, `android`, or `all` (default: `ios`)

Do NOT proceed until you have all three values confirmed by the user.

### 2. Update version in JS config files

#### `mobile/app.json`
- Set `expo.version` to the new version string
- Set `expo.ios.buildNumber` to the new build number (as a string)

#### `mobile/package.json`
- Set `"version"` to the new version string

### 3. Update version in native iOS files (REQUIRED for bare projects)

EAS reads the version from the **native Xcode project**, not `app.json`. Both files below must be updated:

#### `mobile/ios/RecipeKeeperorg/Info.plist`
- `CFBundleShortVersionString` → new version string (e.g. `1.0.4`)
- `CFBundleVersion` → new build number (e.g. `20`)

#### `mobile/ios/RecipeKeeperorg.xcodeproj/project.pbxproj`
Use sed (there are 2 occurrences of each, one per build config):
```bash
# Update marketing version (appears twice)
sed -i '' 's/MARKETING_VERSION = <OLD>;/MARKETING_VERSION = <NEW>;/g' mobile/ios/RecipeKeeperorg.xcodeproj/project.pbxproj

# Update build number (appears twice)
sed -i '' 's/CURRENT_PROJECT_VERSION = <OLD_BUILD>;/CURRENT_PROJECT_VERSION = <NEW_BUILD>;/g' mobile/ios/RecipeKeeperorg.xcodeproj/project.pbxproj
```

Verify with:
```bash
grep "MARKETING_VERSION\|CURRENT_PROJECT_VERSION" mobile/ios/RecipeKeeperorg.xcodeproj/project.pbxproj
grep -A1 "CFBundleShortVersionString\|CFBundleVersion" mobile/ios/RecipeKeeperorg/Info.plist
```

### 4. Commit and push

```bash
git add mobile/app.json mobile/package.json \
        mobile/ios/RecipeKeeperorg/Info.plist \
        mobile/ios/RecipeKeeperorg.xcodeproj/project.pbxproj
git commit -m "chore: bump version to <VERSION> (build <BUILD>)"
git push
```

### 5. Trigger EAS Build with auto-submit

```bash
cd /Users/adrianpeter/Coding/Factory/recipe-keeper/mobile
eas build --platform <PLATFORM> --profile production --auto-submit --non-interactive
```

### 6. Share build links

After queuing, share both links:
- Build: `https://expo.dev/accounts/adrianpeter/projects/mobile/builds`
- Submission: `https://expo.dev/accounts/adrianpeter/projects/mobile/submissions`

## Key Constraints

- `appVersionSource` is `"local"` — but native files override `app.json` in bare projects
- `autoIncrement` is disabled — never re-enable it
- Build number must be **strictly increasing** — Apple rejects duplicates or lower numbers
- Always commit and push **before** running `eas build`
