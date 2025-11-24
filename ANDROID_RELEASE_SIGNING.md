# Android Release Signing Setup

The previously committed release keystore has been removed. Generate a fresh keystore before cutting the next Play Store build.

## 1. Create a New Keystore

Run keytool -genkeypair -alias planmyescape-release -keyalg RSA -keysize 4096 -validity 3650 -keystore /secure/path/planmyescape-release.keystore and follow the prompts.

Use a strong, unique password. Store the keystore and credentials in an encrypted secret manager or hardware token.

## 2. Reference the Keystore Securely

Choose one of the following approaches:

Option A: Environment variables (recommended for CI)
  ANDROID_KEYSTORE_PATH=/secure/path/planmyescape-release.keystore
  ANDROID_KEYSTORE_STORE_PASSWORD=
  ANDROID_KEYSTORE_KEY_ALIAS=planmyescape-release
  ANDROID_KEYSTORE_KEY_PASSWORD=

Option B: Local keystore.properties
  storeFile=/secure/path/planmyescape-release.keystore
  storePassword=
  keyAlias=planmyescape-release
  keyPassword=

## 3. Verify the Setup

Run npm run android:bundleRelease locally after configuring credentials. Gradle automatically uses environment variables or a local keystore.properties file.

## Rotation & Storage Tips

- Rotate the keystore if there is any indication it was exposed.
- Store passwords in a vault (1Password, Bitwarden, Azure Key Vault, etc.).
- Keep an encrypted backup of the keystore in a secure location; losing it prevents future Play Store updates.
