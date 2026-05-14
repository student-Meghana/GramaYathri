# 🚌 GramaYathri - Rural Bus Tracker

**GramaYathri** is a community-driven Android application designed to bridge the gap in rural transportation. It provides real-time bus tracking, fare estimation, and emergency services specifically tailored for village communities.

---

## 🌟 Key Features

### 🌍 Live Rural Bus Map
*   **Real-Time Tracking:** Visualize moving buses on a live map (requires Google Maps API).
*   **Community Reporting:** Passenger-driven updates ("I'm Here") ensure accurate locations even without dedicated GPS hardware on buses.
*   **Status Indicators:** Buses are color-coded based on their schedule (🟢 On Time, 🟡 Slight Delay, 🔴 Major Delay).

### 📵 Offline SMS Updates
*   **Smart Updates:** No internet? No problem. Generate and send a backup SMS update to any contact.
*   **Automatic ETA:** The app automatically calculates and includes the Expected Time of Arrival (ETA) to your destination in the text message.

### 🎫 Fare Calculator
*   **Distance-Based Estimation:** Quickly calculate the fare between any two stops on a route.
*   **Route Search:** Find buses by searching for specific stops or route numbers.

### 🚨 Emergency SOS
*   **Instant Alerts:** Send your live location and a distress signal to pre-configured emergency contacts or local authorities with one tap.

### 🎨 Modern Dashboard
*   **Attractive Design:** A clean, intuitive UI with soft background gradients and dynamic layouts for easy navigation.
*   **Multi-User Sync:** Real-time data synchronization across all devices using Firebase.

---

## 🛠️ Technology Stack
*   **Language:** Kotlin
*   **UI Framework:** Jetpack Compose (Modern Declarative UI)
*   **Backend:** Firebase Realtime Database & Firebase Authentication
*   **Location:** Google Play Services Location & Google Maps SDK
*   **Design:** Material Design 3

---

## 🚀 Getting Started

### Prerequisites
*   Android Studio (Iguana or newer recommended)
*   JDK 17+
*   A Firebase Project

### Setup Instructions
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/gramayathri.git
    ```
2.  **Firebase Configuration:**
    *   Create a project in the [Firebase Console](https://console.firebase.google.com/).
    *   Enable **Authentication** (Email/Password) and **Realtime Database**.
    *   Download the `google-services.json` file and place it in the `app/` directory.
3.  **Google Maps API:**
    *   Enable the **Maps SDK for Android** in the Google Cloud Console.
    *   Add your API Key to `AndroidManifest.xml` (or `local.properties`).
4.  **Build & Run:**
    *   Open the project in Android Studio.
    *   Sync Gradle files and click the **Run** button.

---

## 🤝 Contributing
GramaYathri is a community project! Feel free to fork the repository and submit pull requests for new features or bug fixes.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
