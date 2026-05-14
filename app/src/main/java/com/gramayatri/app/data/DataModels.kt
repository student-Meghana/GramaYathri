package com.gramayatri.app.data

import com.google.firebase.Timestamp

data class Route(
    val id: String = "",
    val name: String = "",
    val stops: List<String> = emptyList(),
    val timetable: Map<String, String> = emptyMap()
)

data class Ping(
    val id: String = "",
    val routeId: String = "",
    val stopId: String = "",
    val stopName: String = "",
    val timestamp: Timestamp? = null,
    val timestampLong: Long = 0L,
    val userId: String = "",
    val userName: String = "",
    val busId: String = "Bus 1"
)

data class Alert(
    val id: String = "",
    val routeId: String = "",
    val type: String = "delayed", // delayed, cancelled
    val message: String = "",
    val timestamp: Timestamp? = null,
    val timestampLong: Long = 0L,
    val userId: String = "",
    val userName: String = ""
)

object Constants {
    val STATIC_ROUTES = listOf(
        Route(
            id = "R1", 
            name = "Grama A ➔ Town Center", 
            stops = listOf("Grama A", "Old Temple", "Market Square", "High School", "Town Hospital", "Town Center"),
            timetable = mapOf("Morning" to "07:30 AM", "Noon" to "12:45 PM", "Evening" to "05:15 PM")
        ),
        Route(
            id = "R2", 
            name = "North Village ➔ Main Bus Stand", 
            stops = listOf("North Village", "River Bridge", "Big Banyan Tree", "Police Station", "Main Bus Stand"),
            timetable = mapOf("Morning" to "08:15 AM", "Noon" to "01:30 PM", "Evening" to "06:00 PM")
        )
    )
    const val AVG_TIME_PER_STOP = 7
}
