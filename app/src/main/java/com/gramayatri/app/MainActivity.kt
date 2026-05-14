package com.gramayatri.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.text.style.TextAlign
import com.gramayatri.app.data.Constants.AVG_TIME_PER_STOP
import com.gramayatri.app.data.Route
import com.gramayatri.app.ui.BusViewModel
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.Icons
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.platform.LocalContext

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val viewModel: BusViewModel = viewModel()
            var selectedRoute by remember { mutableStateOf<Route?>(null) }
            val userEmail by viewModel.userEmail.collectAsState()

            Surface(modifier = Modifier.fillMaxSize(), color = Color(0xFFF5F5F5)) {
                if (userEmail == null) {
                    AuthScreen(viewModel)
                } else if (selectedRoute == null) {
                    RouteSelectionScreen(
                        viewModel = viewModel,
                        onRouteSelected = { 
                            selectedRoute = it
                            viewModel.subscribeToRoute(it.id)
                        }
                    )
                } else {
                    BusTrackingScreen(
                        route = selectedRoute!!, 
                        viewModel = viewModel,
                        onBack = { selectedRoute = null }
                    )
                }
            }
        }
    }
}

@Composable
fun AuthScreen(viewModel: BusViewModel) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLogin by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var passwordVisible by remember { mutableStateOf(false) }
    val primaryColor = Color(0xFF00796B)
    val context = LocalContext.current

    // Google Sign-In Configuration
    val gso = remember {
        GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken("929738724853-u08id0v5478465uiv1id4t28l7l7idlv.apps.googleusercontent.com")
            .requestEmail()
            .build()
    }
    val googleSignInClient = remember { GoogleSignIn.getClient(context, gso) }

    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)!!
            viewModel.signInWithGoogle(account.idToken!!) { success, msg ->
                if (!success) error = msg
            }
        } catch (e: ApiException) {
            error = "Google sign in failed: ${e.message}"
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("GramaYathri", fontSize = 32.sp, fontWeight = FontWeight.Black, color = primaryColor)
        Text(if (isLogin) "Welcome Back" else "Create Account", color = Color.Gray, modifier = Modifier.padding(bottom = 32.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        )
        Spacer(Modifier.height(16.dp))
        
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            trailingIcon = {
                val image = if (passwordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(imageVector = image, contentDescription = if (passwordVisible) "Hide password" else "Show password")
                }
            }
        )

        if (error != null) {
            val displayError = if (error!!.contains("invalid-credential")) {
                "Invalid email or password. If you don't have an account, please Sign Up first."
            } else {
                error!!
            }
            Text(displayError, color = Color.Red, fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
        }

        Spacer(Modifier.height(32.dp))

        Button(
            onClick = {
                if (isLogin) {
                    viewModel.signIn(email, password) { success, msg -> if (!success) error = msg }
                } else {
                    viewModel.signUp(email, password) { success, msg -> if (!success) error = msg }
                }
            },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = primaryColor)
        ) {
            Text(if (isLogin) "Sign In" else "Sign Up")
        }

        Spacer(Modifier.height(16.dp))

        // Google Sign-In Button
        OutlinedButton(
            onClick = { launcher.launch(googleSignInClient.signInIntent) },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.DarkGray)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("G ", fontWeight = FontWeight.Bold, color = Color(0xFF4285F4))
                Text("Sign in with Google")
            }
        }

        TextButton(onClick = { isLogin = !isLogin }) {
            Text(if (isLogin) "Don't have an account? Sign Up" else "Already have an account? Sign In", color = primaryColor)
        }
    }
}

@Composable
fun RouteSelectionScreen(viewModel: BusViewModel, onRouteSelected: (Route) -> Unit) {
    val routes by viewModel.routes.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var showAddDialog by remember { mutableStateOf(false) }
    var showTimetableRoute by remember { mutableStateOf<Route?>(null) }

    val filteredRoutes = routes.filter { 
        it.name.contains(searchQuery, ignoreCase = true) || 
        it.stops.any { stop -> stop.contains(searchQuery, ignoreCase = true) }
    }

    val primaryColor = Color(0xFF00796B)
    val backgroundColor = Color(0xFFF8F9FA)

    Scaffold(
        topBar = {
            Column(modifier = Modifier.background(Color.White).padding(top = 16.dp)) {
                Row(
                    modifier = Modifier.padding(horizontal = 24.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "GramaYathri", 
                        fontSize = 28.sp, 
                        fontWeight = FontWeight.Black, 
                        color = primaryColor
                    )
                    TextButton(onClick = { viewModel.signOut() }) {
                        Text("Sign Out", color = Color.Gray, fontSize = 12.sp)
                    }
                }
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search location or route...") },
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    shape = RoundedCornerShape(12.dp),
                    leadingIcon = { Text("🔍", modifier = Modifier.padding(start = 8.dp)) },
                    colors = TextFieldDefaults.colors(
                        unfocusedContainerColor = Color(0xFFF1F3F4),
                        focusedContainerColor = Color.White
                    )
                )
            }
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = primaryColor,
                contentColor = Color.White,
                icon = { Text("+", fontSize = 24.sp) },
                text = { Text("Add New Route") }
            )
        },
        containerColor = backgroundColor
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(horizontal = 16.dp)) {
            if (filteredRoutes.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No routes found for \"$searchQuery\"", color = Color.Gray)
                }
            }

            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(filteredRoutes) { route ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp)
                            .clickable { onRouteSelected(route) },
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.padding(20.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .background(primaryColor.copy(alpha = 0.1f), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("🚌", fontSize = 24.sp)
                                }
                                Column(modifier = Modifier.padding(start = 16.dp).weight(1f)) {
                                    Text(route.name, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color(0xFF202124))
                                    Text("${route.stops.size} Stops • ${route.stops.first()} ➔ ${route.stops.last()}", fontSize = 12.sp, color = Color.Gray)
                                }
                                Text("➔", color = primaryColor, fontWeight = FontWeight.Bold)
                            }
                            
                            Divider(modifier = Modifier.padding(horizontal = 20.dp), thickness = 0.5.dp, color = Color.LightGray.copy(alpha = 0.5f))
                            
                            TextButton(
                                onClick = { showTimetableRoute = route },
                                modifier = Modifier.padding(horizontal = 8.dp)
                            ) {
                                Text("📅 View Community Timetable", fontSize = 12.sp, color = primaryColor)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showTimetableRoute != null) {
        CommunityTimetableDialog(route = showTimetableRoute!!, onDismiss = { showTimetableRoute = null })
    }

    if (showAddDialog) {
        AddRouteDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { name, stops ->
                viewModel.createRoute(name, stops)
                showAddDialog = false
            }
        )
    }
}

@Composable
fun CommunityTimetableDialog(route: Route, onDismiss: () -> Unit) {
    val primaryColor = Color(0xFF00796B)
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Community Timetable", fontWeight = FontWeight.Black) },
        text = {
            Column {
                Text(route.name, fontSize = 14.sp, color = Color.Gray)
                Spacer(Modifier.height(16.dp))
                
                Text("Typically active at:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                Spacer(Modifier.height(8.dp))
                
                if (route.timetable.isEmpty()) {
                    Text("No timetable data available for this route yet.", fontSize = 13.sp, color = Color.Gray)
                } else {
                    route.timetable.forEach { (period, time) ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(period, fontSize = 14.sp)
                            Text(time, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = primaryColor)
                        }
                    }
                }
                
                Spacer(Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(primaryColor.copy(alpha = 0.05f), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Text(
                        "💡 This timetable is built from user reports. The more you use 'I'm Here', the more accurate this becomes!",
                        fontSize = 11.sp,
                        color = primaryColor,
                        textAlign = TextAlign.Center
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Close") }
        }
    )
}

@Composable
fun AddRouteDialog(onDismiss: () -> Unit, onConfirm: (String, List<String>) -> Unit) {
    var name by remember { mutableStateOf("") }
    var stopsStr by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create New Route") },
        text = {
            Column {
                TextField(value = name, onValueChange = { name = it }, label = { Text("Route Name (e.g. Village A to City)") })
                Spacer(Modifier.height(8.dp))
                TextField(value = stopsStr, onValueChange = { stopsStr = it }, label = { Text("Stops (comma separated)") })
            }
        },
        confirmButton = {
            Button(onClick = { 
                val stops = stopsStr.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                onConfirm(name, stops)
            }) { Text("Create") }
        }
    )
}

@Composable
fun BusTrackingScreen(route: Route, viewModel: BusViewModel, onBack: () -> Unit) {
    val pings by viewModel.pings.collectAsState()
    val alerts by viewModel.alerts.collectAsState()
    val userEmail by viewModel.userEmail.collectAsState()
    
    // Group pings by busId and take the latest one for each bus
    val activeBuses = pings.groupBy { it.busId }
        .mapValues { it.value.first() }
        .values
        .sortedByDescending { it.timestamp }

    val primaryColor = Color(0xFF00796B)
    var showReportSheet by remember { mutableStateOf(false) }
    var showBusNumDialog by remember { mutableStateOf<Pair<Int, String>?>(null) } // index, stopName

    Column(modifier = Modifier.padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onBack) {
                Text("← Back", color = primaryColor, fontWeight = FontWeight.Bold)
            }
            TextButton(onClick = { showReportSheet = true }) {
                Text("Report Issue ⚠️", color = Color(0xFFC62828), fontWeight = FontWeight.Bold)
            }
        }
        
        Spacer(Modifier.height(8.dp))
        
        Text(route.name, fontSize = 28.sp, fontWeight = FontWeight.Black, color = Color(0xFF202124))
        
        // Show Active Alerts if any
        alerts.firstOrNull()?.let { alert ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (alert.type == "cancelled") Color(0xFFFFEBEE) else Color(0xFFFFF3E0)
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(if (alert.type == "cancelled") "🚫" else "⏳", fontSize = 20.sp)
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(alert.message, fontWeight = FontWeight.Bold, color = Color(0xFF202124))
                        Text("Reported by ${alert.userName}", fontSize = 10.sp, color = Color.Gray)
                    }
                }
            }
        }
        
        // Show summary of all active buses
        if (activeBuses.isNotEmpty()) {
            LazyColumn(modifier = Modifier.fillMaxWidth().heightIn(max = 120.dp).padding(vertical = 8.dp)) {
                items(activeBuses) { bus ->
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        colors = CardDefaults.cardColors(containerColor = primaryColor),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.background(Color.White.copy(alpha = 0.2f), CircleShape).padding(8.dp)) {
                                Text("🚌", fontSize = 16.sp)
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(bus.busId, color = Color.White, fontWeight = FontWeight.Black, fontSize = 14.sp)
                                Text("At ${bus.stopName} • by ${bus.userName}", color = Color.White.copy(alpha = 0.8f), fontSize = 10.sp)
                            }
                        }
                    }
                }
            }
        } else {
            Card(
                modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.LightGray.copy(alpha = 0.2f)),
                shape = RoundedCornerShape(24.dp)
            ) {
                Box(modifier = Modifier.padding(24.dp), contentAlignment = Alignment.Center) {
                    Text("No buses detected yet today", color = Color.Gray, fontWeight = FontWeight.Bold)
                }
            }
        }

        Text("STOPS & LIVE TRACKING", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.Gray, modifier = Modifier.padding(bottom = 12.dp), letterSpacing = 2.sp)

        LazyColumn(modifier = Modifier.weight(1f)) {
            items(route.stops.withIndex().toList()) { (index, stop) ->
                // Check which buses are at or past this stop
                val busesAtThisStop = activeBuses.filter { (it.stopId.toIntOrNull() ?: -1) == index }
                val isAnyBusHere = busesAtThisStop.isNotEmpty()
                
                // A stop is "passed" if the LATEST bus on the route has passed it
                val furthestBusIndex = activeBuses.maxOfOrNull { it.stopId.toIntOrNull() ?: -1 } ?: -1
                val isPassed = furthestBusIndex > index
                
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(24.dp).padding(top = 4.dp)) {
                        Box(
                            modifier = Modifier
                                .size(if (isAnyBusHere) 16.dp else 8.dp)
                                .background(
                                    when {
                                        isAnyBusHere -> primaryColor
                                        isPassed -> Color.LightGray.copy(alpha = 0.5f)
                                        else -> Color.LightGray
                                    }, 
                                    CircleShape
                                )
                        )
                    }
                    
                    Spacer(Modifier.width(12.dp))
                    
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            stop, 
                            fontWeight = if (isAnyBusHere) FontWeight.Black else FontWeight.Bold,
                            color = when {
                                isAnyBusHere -> primaryColor
                                isPassed -> Color.Gray.copy(alpha = 0.4f)
                                else -> Color(0xFF202124)
                            },
                            fontSize = 16.sp
                        )
                        
                        if (isAnyBusHere) {
                            busesAtThisStop.forEach { bus ->
                                Text("🚌 ${bus.busId} is here", color = primaryColor, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        } else if (isPassed) {
                            val passTime = pings.find { it.stopId == "$index" }?.let {
                                if (it.timestampLong != 0L) java.util.Date(it.timestampLong) else it.timestamp?.toDate()
                            }
                            val timeStr = if (passTime != null) {
                                java.text.SimpleDateFormat("hh:mm a", java.util.Locale.getDefault()).format(passTime)
                            } else "recently"
                            Text("Passed at $timeStr", color = Color.Gray.copy(alpha = 0.6f), fontSize = 10.sp)
                        } else if (furthestBusIndex != -1) {
                            // Calculate ETA from the closest bus behind this stop
                            val nearestBusBehind = activeBuses
                                .filter { (it.stopId.toIntOrNull() ?: -1) < index }
                                .maxByOrNull { it.stopId.toIntOrNull() ?: -1 }
                            
                            if (nearestBusBehind != null) {
                                val stopsAway = index - (nearestBusBehind.stopId.toIntOrNull() ?: -1)
                                val mins = stopsAway * AVG_TIME_PER_STOP
                                Text("Estimated $mins mins away (via ${nearestBusBehind.busId})", color = Color(0xFF00897B), fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
                            }
                        }
                    }

                    Button(
                        onClick = { showBusNumDialog = index to stop },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isPassed) Color(0xFFF1F3F4) else primaryColor.copy(alpha = 0.08f),
                            contentColor = if (isPassed) Color.LightGray else primaryColor
                        ),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        modifier = Modifier.height(36.dp)
                    ) {
                        Text("I'm Here", fontSize = 10.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }

    if (showBusNumDialog != null) {
        // Create a unique default ID like "Bus-A1B2" using first 4 chars of user UID
        val userUid = viewModel.userEmail.value?.hashCode()?.let { 
            Integer.toHexString(it).take(4).uppercase() 
        } ?: "XXXX"
        var busId by remember { mutableStateOf("Bus-$userUid") }
        
        AlertDialog(
            onDismissRequest = { showBusNumDialog = null },
            title = { Text("Identify Bus") },
            text = {
                Column {
                    Text("Which bus are you on? (e.g. Bus Number or Nickname)", fontSize = 12.sp)
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = busId,
                        onValueChange = { busId = it },
                        placeholder = { Text("Bus Number / Name") },
                        label = { Text("Bus ID") }
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    val displayName = userEmail?.split("@")?.get(0) ?: "User"
                    viewModel.sendPing(route.id, "${showBusNumDialog!!.first}", showBusNumDialog!!.second, displayName, busId)
                    showBusNumDialog = null
                }) { Text("Confirm") }
            }
        )
    }

    if (showReportSheet) {
        AlertDialog(
            onDismissRequest = { showReportSheet = false },
            title = { Text("Report an Issue", fontWeight = FontWeight.Black) },
            text = {
                Column {
                    Text("Is something wrong with the bus service? Inform others.", fontSize = 14.sp, color = Color.Gray)
                    Spacer(Modifier.height(20.dp))
                    
                    OutlinedButton(
                        onClick = { 
                            viewModel.sendAlert(route.id, "delayed", "Bus is running late")
                            showReportSheet = false
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFE65100))
                    ) {
                        Text("🕒 REPORT DELAY")
                    }
                    
                    Spacer(Modifier.height(12.dp))
                    
                    OutlinedButton(
                        onClick = { 
                            viewModel.sendAlert(route.id, "cancelled", "Bus service cancelled")
                            showReportSheet = false
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFB71C1C))
                    ) {
                        Text("🚫 REPORT CANCELLATION")
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showReportSheet = false }) { Text("Cancel") }
            }
        )
    }
}
