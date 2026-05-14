package com.gramayatri.app.ui

import androidx.lifecycle.ViewModel
import com.google.firebase.auth.ktx.auth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import com.gramayatri.app.data.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class BusViewModel : ViewModel() {
    private val db = Firebase.database.reference
    private val auth = Firebase.auth

    private val _pings = MutableStateFlow<List<Ping>>(emptyList())
    val pings: StateFlow<List<Ping>> = _pings

    private val _alerts = MutableStateFlow<List<Alert>>(emptyList())
    val alerts: StateFlow<List<Alert>> = _alerts

    private val _routes = MutableStateFlow<List<Route>>(emptyList())
    val routes: StateFlow<List<Route>> = _routes

    private val _userEmail = MutableStateFlow<String?>(null)
    val userEmail: StateFlow<String?> = _userEmail

    init {
        auth.addAuthStateListener { firebaseAuth ->
            _userEmail.value = firebaseAuth.currentUser?.email
            if (firebaseAuth.currentUser != null) {
                fetchRoutes()
            }
        }
    }

    fun signUp(email: String, pass: String, onResult: (Boolean, String?) -> Unit) {
        auth.createUserWithEmailAndPassword(email, pass)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) onResult(true, null)
                else onResult(false, task.exception?.message)
            }
    }

    fun signIn(email: String, pass: String, onResult: (Boolean, String?) -> Unit) {
        auth.signInWithEmailAndPassword(email, pass)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) onResult(true, null)
                else onResult(false, task.exception?.message)
            }
    }

    fun signInWithGoogle(idToken: String, onResult: (Boolean, String?) -> Unit) {
        val credential = com.google.firebase.auth.GoogleAuthProvider.getCredential(idToken, null)
        auth.signInWithCredential(credential)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) onResult(true, null)
                else onResult(false, task.exception?.message)
            }
    }

    fun signOut() {
        auth.signOut()
        _routes.value = emptyList()
    }

    private fun fetchRoutes() {
        db.child("routes").addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val firestoreRoutes = mutableListOf<Route>()
                snapshot.children.forEach { child ->
                    child.getValue(Route::class.java)?.let { firestoreRoutes.add(it) }
                }
                val allRoutes = (Constants.STATIC_ROUTES + firestoreRoutes).distinctBy { it.id }
                _routes.value = allRoutes
            }
            override fun onCancelled(error: DatabaseError) {}
        })
    }

    fun createRoute(name: String, stops: List<String>) {
        val id = db.child("routes").push().key ?: return
        val newRoute = Route(id = id, name = name, stops = stops)
        db.child("routes").child(id).setValue(newRoute)
    }

    fun subscribeToRoute(routeId: String) {
        val todayStart = System.currentTimeMillis() - 24 * 60 * 60 * 1000

        // Subscribe to Pings
        db.child("routes").child(routeId).child("pings")
            .orderByChild("timestampLong") // Corrected field name
            .startAt(todayStart.toDouble())
            .addValueEventListener(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val pingList = mutableListOf<Ping>()
                    snapshot.children.forEach { child ->
                        child.getValue(Ping::class.java)?.let { pingList.add(it) }
                    }
                    _pings.value = pingList.sortedByDescending { it.timestampLong }
                }
                override fun onCancelled(error: DatabaseError) {}
            })

        // Subscribe to Alerts
        db.child("routes").child(routeId).child("alerts")
            .orderByChild("timestampLong") // Corrected field name
            .startAt(todayStart.toDouble())
            .addValueEventListener(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val alertList = mutableListOf<Alert>()
                    snapshot.children.forEach { child ->
                        child.getValue(Alert::class.java)?.let { alertList.add(it) }
                    }
                    _alerts.value = alertList.sortedByDescending { it.timestampLong }
                }
                override fun onCancelled(error: DatabaseError) {}
            })
    }

    fun sendPing(routeId: String, stopId: String, stopName: String, userName: String, busId: String) {
        val user = auth.currentUser ?: return
        val pingId = db.child("routes").child(routeId).child("pings").push().key ?: return
        val ping = Ping(
            id = pingId,
            routeId = routeId,
            stopId = stopId,
            stopName = stopName,
            userName = userName,
            userId = user.uid,
            busId = busId,
            timestampLong = System.currentTimeMillis()
        )
        db.child("routes").child(routeId).child("pings").child(pingId).setValue(ping)
    }

    fun sendAlert(routeId: String, type: String, message: String) {
        val user = auth.currentUser ?: return
        val alertId = db.child("routes").child(routeId).child("alerts").push().key ?: return
        val alert = Alert(
            id = alertId,
            routeId = routeId,
            type = type,
            message = message,
            userName = (user.email?.split("@")?.get(0) ?: "User"),
            userId = user.uid,
            timestampLong = System.currentTimeMillis()
        )
        db.child("routes").child(routeId).child("alerts").child(alertId).setValue(alert)
    }
}
