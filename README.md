# GramaYathri - Android Setup Guide

This project is a complete Android Studio project built with **Jetpack Compose** and **Firebase**.

## Important: Firebase Configuration
Before opening this in Android Studio, you MUST add your Firebase configuration:

1.  **Register App**: Register `com.gramayatri.app` in your Firebase Project.
2.  **Add Configuration**: Download `google-services.json` from Firebase.
3.  **Place File**: Paste `google-services.json` into the `app/` directory of this project.

## How to Open
1.  Launch **Android Studio**.
2.  Select **Open** and choose the root `GramaYathri` folder.
3.  Wait for Gradle to sync.

## Required Firebase Settings
In your Firebase Console, ensure the following are enabled:
*   **Authentication**: 
    1. Go to the **Sign-in method** tab.
    2. Enable **Email/Password** provider.
*   **Firestore Database**: Create a database and allow reads/writes.
